import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  getDocumentEntities,
  resolveQualifierType,
  type QueryAmbiguityKind,
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
import { getDocumentLineText } from '../utils/documentLineText';
import { getEventApiInvocationContext, getInvocationContext, type InvocationContext } from '../utils/invocationContext';
import { getQueryConsumerPolicy, getQueryConsumerPolicyByLabel, type QueryConsumerId } from './queryScopePolicy';

export interface DocumentQueryContext {
  context: InvocationContext | null;
  currentUri: string;
  documentEntities: Entity[];
  currentMainObject: Entity | undefined;
  resolvedTargets: ResolvedTargetInfo | null;
  resolutionConfidence?: QueryResolutionConfidence;
  ambiguityKind?: QueryAmbiguityKind;
  primaryResolutionReasonCode?: QueryReasonCode;
  invocationKind?: QueryInvocationKind;
  invocationRisk?: QueryInvocationRisk;
  hasResolutionAmbiguity: boolean;
  resolutionTargetCount: number;
  resolutionEvidenceKinds: QueryEvidenceEntry['kind'][];
}

export function createDocumentQueryContext(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  traceLabel?: string,
  consumer?: QueryConsumerId
): DocumentQueryContext {
  const currentUri = normalizeUri(document.uri);
  const documentEntities = getDocumentEntities(currentUri, kb, hotContext);
  const currentMainObject = resolveCurrentObjectAtLine(currentUri, documentEntities, kb, position.line);
  const lineText = getDocumentLineText(document, position.line);
  const context = getEventApiInvocationContext([lineText], { line: 0, character: position.character })
    ?? getInvocationContext([lineText], { line: 0, character: position.character });
  const policy = consumer ? getQueryConsumerPolicy(consumer) : getQueryConsumerPolicyByLabel(traceLabel);
  const resolvedTargets = context
    ? resolveTargetEntityDetailed(context, document.uri, kb, graph, {
      line: position.line,
      hotContext,
      traceLabel,
      ...(policy ? { budgetMs: policy.budgetMs, sourceOriginPolicy: policy } : {})
    })
    : null;

  return {
    context,
    currentUri,
    documentEntities,
    currentMainObject,
    resolvedTargets,
    resolutionConfidence: resolvedTargets?.confidence,
    ambiguityKind: resolvedTargets?.ambiguityKind,
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
  traceLabel?: string,
  consumer?: QueryConsumerId
): ResolvedTargetInfo | null {
  return createDocumentQueryContext(document, position, kb, graph, hotContext, traceLabel, consumer).resolvedTargets;
}

export function resolveDocumentQualifierType(
  document: TextDocument,
  qualifier: string,
  position: Position,
  kb: KnowledgeBase,
  hotContext?: HotContextCache
): string | undefined {
  const currentUri = normalizeUri(document.uri);
  const currentObject = resolveCurrentObjectAtLine(currentUri, getDocumentEntities(currentUri, kb, hotContext), kb, position.line);
  return resolveQualifierType(qualifier, document.uri, kb, position.line, currentObject, hotContext);
}