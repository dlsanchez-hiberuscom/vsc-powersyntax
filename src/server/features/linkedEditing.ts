import { type LinkedEditingRanges, type Position } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import type { HotContextCache } from '../knowledge/HotContextCache';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import type { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { EntityKind, type Entity } from '../knowledge/types';
import { PB_IDENTIFIER_SOURCE } from '../parsing/grammar';
import { createDocumentQueryContext, type DocumentQueryContext } from './queryContext';
import { provideReferences } from './references';

function isSafeLinkedEditingTarget(target: Entity, queryContext: DocumentQueryContext): boolean {
  if (queryContext.hasResolutionAmbiguity || queryContext.resolutionTargetCount !== 1) {
    return false;
  }

  if (queryContext.primaryResolutionReasonCode !== 'local-scope') {
    return false;
  }

  return target.kind === EntityKind.Variable && (target.scope === 'Local' || target.scope === 'Argumento');
}

export function provideLinkedEditingRanges(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  queryContext?: DocumentQueryContext,
): LinkedEditingRanges | null {
  const resolvedQueryContext = queryContext ?? createDocumentQueryContext(document, position, kb, graph, hotContext, 'linked-editing');
  const target = resolvedQueryContext.resolvedTargets?.targets[0];

  if (
    !target
    || resolvedQueryContext.invocationRisk === 'dynamic'
    || resolvedQueryContext.invocationRisk === 'fallback'
    || !isSafeLinkedEditingTarget(target, resolvedQueryContext)
  ) {
    return null;
  }

  const ranges = provideReferences(
    document,
    position,
    kb,
    graph,
    [{ uri: document.uri, content: document.getText() }],
    { includeDeclaration: true },
    hotContext,
    resolvedQueryContext,
  ).filter((location) => location.uri === document.uri)
    .map((location) => location.range);

  if (ranges.length < 2) {
    return null;
  }

  return {
    ranges,
    wordPattern: PB_IDENTIFIER_SOURCE,
  };
}