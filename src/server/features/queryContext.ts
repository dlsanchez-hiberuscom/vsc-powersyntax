import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { resolveQualifierType, resolveTargetEntityDetailed, type ResolvedTargetInfo } from '../knowledge/resolution/semanticQueryService';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { Entity, EntityKind } from '../knowledge/types';
import { normalizeUri } from '../system/uriUtils';
import { getInvocationContext, type InvocationContext } from '../utils/invocationContext';

export interface DocumentQueryContext {
  context: InvocationContext | null;
  currentUri: string;
  documentEntities: Entity[];
  currentMainObject: Entity | undefined;
  resolvedTargets: ResolvedTargetInfo | null;
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
  const currentMainObject = documentEntities.find((entity) => entity.kind === EntityKind.Type);
  const lines = document.getText().split(/\r?\n/);
  const context = getInvocationContext(lines, position);

  return {
    context,
    currentUri,
    documentEntities,
    currentMainObject,
    resolvedTargets: context
      ? resolveTargetEntityDetailed(context, document.uri, kb, graph, {
        line: position.line,
        hotContext,
        traceLabel
      })
      : null
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
  return resolveQualifierType(qualifier, document.uri, kb, position.line);
}