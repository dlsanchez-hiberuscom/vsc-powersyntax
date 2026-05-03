import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  resolveQualifierType,
  type QueryEvidenceEntry,
  type QueryInvocationKind,
  type QueryInvocationRisk,
  type QueryReasonCode,
  resolveCurrentObjectAtLine,
  resolveTargetEntityDetailed,
  type QueryResolutionConfidence,
  type ResolvedTargetInfo
} from '../knowledge/resolution/semanticQueryService';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { Entity, EntityKind } from '../knowledge/types';
import { normalizeUri } from '../system/uriUtils';
import { getEventApiInvocationContext, getInvocationContext, type InvocationContext } from '../utils/invocationContext';

export interface DocumentQueryContext {
  context: InvocationContext | null;
  currentUri: string;
  documentEntities: Entity[];
  currentMainObject: Entity | undefined;
  resolvedTargets: ResolvedTargetInfo | null;
  resolutionConfidence?: QueryResolutionConfidence;
  primaryResolutionReasonCode?: QueryReasonCode;
  invocationKind?: QueryInvocationKind;
  invocationRisk?: QueryInvocationRisk;
  hasResolutionAmbiguity: boolean;
  resolutionTargetCount: number;
  resolutionEvidenceKinds: QueryEvidenceEntry['kind'][];
}

function getDocumentEntities(
  currentUri: string,
  kb: KnowledgeBase,
  hotContext?: HotContextCache
): Entity[] {
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    const cached = hotContext.getActiveEntities();
    if (cached) {
      return cached;
    }
  }

  const entities = kb.getEntitiesByUri(currentUri);
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    hotContext.setActiveEntities(entities);
  }
  return entities;
}

export function createDocumentQueryContext(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  traceLabel?: string
): DocumentQueryContext {
  const currentUri = normalizeUri(document.uri);
  const documentEntities = getDocumentEntities(currentUri, kb, hotContext);
  const currentMainObject = resolveCurrentObjectAtLine(currentUri, documentEntities, kb, position.line);
  const lines = document.getText().split(/\r?\n/);
  const context = getEventApiInvocationContext(lines, position) ?? getInvocationContext(lines, position);
  const resolvedTargets = context
    ? resolveTargetEntityDetailed(context, document.uri, kb, graph, {
      line: position.line,
      hotContext,
      traceLabel
    })
    : null;

  return {
    context,
    currentUri,
    documentEntities,
    currentMainObject,
    resolvedTargets,
    resolutionConfidence: resolvedTargets?.confidence,
    primaryResolutionReasonCode: resolvedTargets?.reasonCodes[0],
    invocationKind: resolvedTargets?.invocationKind,
    invocationRisk: resolvedTargets?.invocationRisk,
    hasResolutionAmbiguity: (resolvedTargets?.targets.length ?? 0) > 1,
    resolutionTargetCount: resolvedTargets?.targets.length ?? 0,
    resolutionEvidenceKinds: resolvedTargets?.evidence.map((entry) => entry.kind) ?? []
  };
}

export function resolveDocumentQueryTargets(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  traceLabel?: string
): ResolvedTargetInfo | null {
  return createDocumentQueryContext(document, position, kb, graph, hotContext, traceLabel).resolvedTargets;
}

export function resolveDocumentQualifierType(
  document: TextDocument,
  qualifier: string,
  position: Position,
  kb: KnowledgeBase
): string | undefined {
  const currentUri = normalizeUri(document.uri);
  const currentObject = resolveCurrentObjectAtLine(currentUri, getDocumentEntities(currentUri, kb), kb, position.line);
  return resolveQualifierType(qualifier, document.uri, kb, position.line, currentObject);
}