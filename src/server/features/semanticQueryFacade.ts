import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import type { HotContextCache } from '../knowledge/HotContextCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { isCallableEntity } from '../knowledge/callSignature';
import { InheritanceGraph, type MemberClosureEntry } from '../knowledge/resolution/InheritanceGraph';
import type { ResolvedTargetInfo } from '../knowledge/resolution/semanticQueryService';
import {
  toResolvedSymbolModel,
  toResolvedSymbolSet,
  type ResolvedCallableModel,
  type ResolvedEnumContextModel,
  type ResolvedReceiverModel,
  type ResolvedSymbolSet,
} from '../knowledge/resolution/resolvedSemanticModels';
import {
  toSemanticQueryResult,
  type SemanticQuery,
  type SemanticQueryResult,
} from '../knowledge/resolution/semanticQueryResult';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';
import { EntityKind } from '../knowledge/types';
import { InvocationContext } from '../utils/invocationContext';
import { resolveCatalogOwnerTypes } from './dataWindowBindingModel';
import { resolveExpectedEnumContextForCallArgumentAtPosition } from './enumeratedContext';
import {
  createDocumentQueryContext,
  resolveDocumentQualifierType,
  type DocumentQueryContext,
} from './queryContext';
import type { QueryConsumerId } from './queryScopePolicy';

export interface SemanticQueryFacadeDependencies {
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  systemCatalog?: SystemCatalog;
  hotContext?: HotContextCache;
}

export interface CreateFeatureSemanticContextOptions {
  consumer?: QueryConsumerId;
  traceLabel?: string;
  explicitContext?: InvocationContext;
}

export interface InheritanceQueryResult {
  typeName: string;
  ancestors: string[];
  descendants: string[];
  memberClosure: MemberClosureEntry[];
}

export class SemanticQueryFacade {
  constructor(private readonly dependencies: SemanticQueryFacadeDependencies) {}

  createPositionContext(
    document: TextDocument,
    position: Position,
    options: CreateFeatureSemanticContextOptions = {},
  ): DocumentQueryContext {
    const { kb, graph, hotContext } = this.dependencies;
    return createDocumentQueryContext(
      document,
      position,
      kb,
      graph,
      hotContext,
      options.traceLabel,
      options.consumer,
      options.explicitContext,
    );
  }

  resolveTargetSymbol(
    document: TextDocument,
    position: Position,
    options: CreateFeatureSemanticContextOptions = {},
  ): ResolvedSymbolSet {
    return toResolvedSymbolSet(this.createPositionContext(document, position, options).resolvedTargets);
  }

  resolveTargetInfo(
    document: TextDocument,
    position: Position,
    options: CreateFeatureSemanticContextOptions = {},
  ): ResolvedTargetInfo | null {
    return this.createPositionContext(document, position, options).resolvedTargets;
  }

  /**
   * Resuelve el target en la posición dada devolviendo el contrato unificado SemanticQueryResult.
   * Spec: PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01.
   */
  resolveTarget(
    document: TextDocument,
    position: Position,
    options: CreateFeatureSemanticContextOptions = {},
  ): SemanticQueryResult {
    const context = this.createPositionContext(document, position, options);
    const effectivePolicy = context.consumerPolicy;
    const info = context.resolvedTargets ?? {
      context: context.context ?? { identifier: '' },
      targets: [],
      reasonCodes: [],
      invocationKind: 'local-symbol', // fallback
      invocationRisk: 'dynamic',
      confidence: 'low',
      evidence: [],
      candidatePool: [],
      trace: [],
      winnerLineage: null
    };

    const query: SemanticQuery = {
      consumer: options.consumer ?? effectivePolicy?.consumer,
      uri: document.uri,
      position: position,
      ...(info.context.identifier ? { identifier: info.context.identifier } : {}),
      ...(info.context.qualifier ? { qualifier: info.context.qualifier } : {}),
      invocationKind: info.invocationKind,
      ...(effectivePolicy
        ? {
          sourceOriginPolicy: {
            allowStaging: effectivePolicy.allowStaging,
            allowGenerated: effectivePolicy.allowGenerated,
            allowExternal: effectivePolicy.allowExternal,
          },
          budgetMs: effectivePolicy.budgetMs,
          resultCap: effectivePolicy.resultCap,
        }
        : {})
    };

    return toSemanticQueryResult(info, query, this.dependencies.kb.semanticEpoch);
  }

  resolveReceiverType(
    document: TextDocument,
    qualifier: string,
    position: Position,
  ): ResolvedReceiverModel {
    const { kb, hotContext } = this.dependencies;
    const ownerType = resolveDocumentQualifierType(document, qualifier, position, kb, hotContext) ?? null;
    return {
      expression: qualifier,
      ownerType,
      confidence: ownerType ? 'high' : 'unknown',
      reasonCodes: ownerType ? ['qualifier-type'] : [],
    };
  }

  resolveCallable(
    document: TextDocument,
    position: Position,
    options: CreateFeatureSemanticContextOptions = {},
  ): ResolvedCallableModel[] {
    const context = this.createPositionContext(document, position, options);
    return (context.resolvedTargets?.targets ?? [])
      .filter((target) => isCallableEntity(target))
      .map((target) => ({
        symbol: toResolvedSymbolModel(target, context.resolvedTargets),
        ...(target.signature ? { signature: target.signature } : {}),
        parameterLabels: target.parameters?.map((parameter) => parameter.label) ?? [],
        ...(target.returnType ? { returnType: target.returnType } : {}),
      }));
  }

  resolveInheritance(typeName: string): InheritanceQueryResult {
    const { graph } = this.dependencies;
    return {
      typeName,
      ancestors: graph.getAncestors(typeName),
      descendants: graph.getDescendants(typeName),
      memberClosure: graph.getMemberClosure(typeName),
    };
  }

  resolveExpectedEnumContext(
    document: TextDocument,
    position: Position,
  ): ResolvedEnumContextModel | null {
    const { kb, graph, systemCatalog } = this.dependencies;
    if (!systemCatalog) {
      return null;
    }

    const context = resolveExpectedEnumContextForCallArgumentAtPosition(document, position, kb, systemCatalog, graph);
    return context
      ? {
        enumTypeName: context.enumTypeName,
        dataWindowContext: context.dataWindowContext,
        confidence: 'high',
        reasonCodes: ['qualifier-type'],
      }
      : null;
  }

  resolveCatalogCallable(
    identifier: string,
    ownerType?: string,
  ): PbSystemSymbolEntry | undefined {
    const { graph, systemCatalog } = this.dependencies;
    if (!systemCatalog) {
      return undefined;
    }

    if (ownerType) {
      return systemCatalog.resolveMemberFunctionForOwner(identifier, resolveCatalogOwnerTypes(ownerType, graph));
    }

    return systemCatalog.findSystemSymbol(identifier).find((entry) => entry.kind === 'callable');
  }

  isCallableTargetSet(resolution: ResolvedSymbolSet): boolean {
    return resolution.symbols.some((symbol) => symbol.kind === EntityKind.Function || symbol.kind === EntityKind.Event);
  }
}

export function createSemanticQueryFacade(dependencies: SemanticQueryFacadeDependencies): SemanticQueryFacade {
  return new SemanticQueryFacade(dependencies);
}