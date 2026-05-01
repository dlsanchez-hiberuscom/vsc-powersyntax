import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { resolveTargetEntityDetailed, type ResolvedTargetInfo } from '../knowledge/resolution/semanticQueryService';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { HotContextCache } from '../knowledge/HotContextCache';
import { getInvocationContext } from '../utils/invocationContext';

export function resolveDocumentQueryTargets(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  traceLabel?: string
): ResolvedTargetInfo | null {
  const lines = document.getText().split(/\r?\n/);
  const context = getInvocationContext(lines, position);
  if (!context) {
    return null;
  }

  return resolveTargetEntityDetailed(context, document.uri, kb, graph, {
    line: position.line,
    hotContext,
    traceLabel
  });
}