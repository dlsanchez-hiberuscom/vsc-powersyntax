import { type Position, type TextEdit, type WorkspaceEdit } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import type { HotContextCache } from '../knowledge/HotContextCache';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { EntityKind, type Entity } from '../knowledge/types';
import type { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { hasBlockingDynamicStringReference } from './dynamicStringReferences';
import { validateRenameTarget } from './renamePreflight';
import { provideReferences, type ReferenceSource } from './references';
import { createDocumentQueryContext, type DocumentQueryContext } from './queryContext';

export interface RenameProviderResult {
  edit: WorkspaceEdit | null;
  reason?: string;
}

function isSafeRenameTarget(target: Entity, queryContext: DocumentQueryContext): boolean {
  if (queryContext.hasResolutionAmbiguity || queryContext.resolutionTargetCount !== 1) {
    return false;
  }

  switch (queryContext.primaryResolutionReasonCode) {
    case 'local-scope':
      return target.kind === EntityKind.Variable && (target.scope === 'Local' || target.scope === 'Argumento');
    case 'qualifier-type':
    case 'member-hierarchy':
      if (target.kind === EntityKind.Variable) {
        return target.scope === 'Instancia';
      }
      return target.kind === EntityKind.Function || target.kind === EntityKind.Subroutine || target.kind === EntityKind.Event;
    default:
      return false;
  }
}

function buildWorkspaceEdit(locations: ReturnType<typeof provideReferences>, newName: string): WorkspaceEdit | null {
  const changes: Record<string, TextEdit[]> = {};

  for (const location of locations) {
    const edits = changes[location.uri] ?? [];
    edits.push({
      range: location.range,
      newText: newName
    });
    changes[location.uri] = edits;
  }

  return Object.keys(changes).length > 0 ? { changes } : null;
}

export function provideRename(
  document: TextDocument,
  position: Position,
  newName: string,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  sources: Iterable<ReferenceSource>,
  systemCatalog?: SystemCatalog,
  hotContext?: HotContextCache,
  queryContext?: DocumentQueryContext
): RenameProviderResult {
  const preflight = validateRenameTarget(newName, { systemCatalog });
  if (!preflight.ok) {
    return { edit: null, reason: preflight.reason };
  }

  const resolvedQueryContext = queryContext ?? createDocumentQueryContext(document, position, kb, graph, hotContext, 'rename');
  const target = resolvedQueryContext.resolvedTargets?.targets[0];
  if (resolvedQueryContext.invocationRisk === 'dynamic' || resolvedQueryContext.invocationRisk === 'fallback') {
    return {
      edit: null,
      reason: `rename bloqueado por invocationRisk=${resolvedQueryContext.invocationRisk}.`
    };
  }
  if (target?.isExternal) {
    return {
      edit: null,
      reason: 'rename no admite dependencias nativas externas sin implementación interna segura.'
    };
  }

  if (!target || !isSafeRenameTarget(target, resolvedQueryContext)) {
    return {
      edit: null,
      reason: 'rename solo admite variables locales, parámetros o miembros con resolución semántica única.'
    };
  }

  const blockingHit = hasBlockingDynamicStringReference(target.name, sources);
  if (blockingHit) {
    return {
      edit: null,
      reason: `rename bloqueado por referencia ${blockingHit.classification} en string dinámico${blockingHit.api ? ` (${blockingHit.api})` : ''}.`
    };
  }

  const locations = provideReferences(
    document,
    position,
    kb,
    graph,
    sources,
    { includeDeclaration: true },
    hotContext,
    resolvedQueryContext
  );

  return { edit: buildWorkspaceEdit(locations, newName) };
}