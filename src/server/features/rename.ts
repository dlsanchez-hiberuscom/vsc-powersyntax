import { type Position, type TextEdit, type WorkspaceEdit } from 'vscode-languageserver/node';
import type { TextDocument } from 'vscode-languageserver-textdocument';

import type { HotContextCache } from '../knowledge/HotContextCache';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { EntityKind } from '../knowledge/types';
import type { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { hasBlockingDynamicStringReference } from './dynamicStringReferences';
import { validateRenameTarget } from './renamePreflight';
import { provideReferences, type ReferenceSource } from './references';
import { createDocumentQueryContext, type DocumentQueryContext } from './queryContext';
import { createSemanticQueryFacade } from './semanticQueryFacade';
import type { SemanticQueryResult } from '../knowledge/resolution/semanticQueryResult';

export interface RenameProviderResult {
  edit: WorkspaceEdit | null;
  reason?: string;
}

function collectSemanticQueryTargets(result: SemanticQueryResult | null): ReadonlyArray<NonNullable<SemanticQueryResult['target']>> {
  if (!result) {
    return [];
  }

  return [
    result.target,
    ...(result.alternatives?.ambiguousTargets ?? []),
    ...(result.alternatives?.fallbackTargets ?? []),
  ].filter((target): target is NonNullable<SemanticQueryResult['target']> => target !== null);
}

type ReferenceLocation = ReturnType<typeof provideReferences>[number];

function isSafeRenameTarget(result: SemanticQueryResult): boolean {
  if ((result.alternatives?.ambiguousTargets?.length ?? 0) > 0) {
    return false;
  }

  const target = result.target;
  if (!target) {
    return false;
  }

  const reason = result.reasons[0];
  switch (reason) {
    case 'local-scope':
      return target.kind === EntityKind.Variable && (target.scope === 'Local' || target.scope === 'Argumento');

    case 'qualifier-type':
    case 'member-hierarchy':
      if (target.kind === EntityKind.Variable) {
        return target.scope === 'Instancia';
      }

      return target.kind === EntityKind.Function
        || target.kind === EntityKind.Subroutine
        || target.kind === EntityKind.Event;

    default:
      return false;
  }
}

function getReferenceLocationKey(location: ReferenceLocation): string {
  const { uri, range } = location;

  return [
    uri,
    range.start.line,
    range.start.character,
    range.end.line,
    range.end.character,
  ].join(':');
}

function compareTextEdits(left: TextEdit, right: TextEdit): number {
  return left.range.start.line - right.range.start.line
    || left.range.start.character - right.range.start.character
    || left.range.end.line - right.range.end.line
    || left.range.end.character - right.range.end.character;
}

function buildWorkspaceEdit(locations: ReturnType<typeof provideReferences>, newName: string): WorkspaceEdit | null {
  const changes: Record<string, TextEdit[]> = {};
  const seen = new Set<string>();

  for (const location of locations) {
    const key = getReferenceLocationKey(location);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    const edits = changes[location.uri] ?? [];
    edits.push({
      range: location.range,
      newText: newName,
    });
    changes[location.uri] = edits;
  }

  for (const edits of Object.values(changes)) {
    edits.sort(compareTextEdits);
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

  const semanticFacade = createSemanticQueryFacade({ kb, graph, systemCatalog, hotContext });
  const result = semanticFacade.resolveTarget(document, position, { consumer: 'rename', traceLabel: 'rename' });
  const target = result.target;

  let unrestrictedTargetResult: SemanticQueryResult | null = null;
  const getUnrestrictedTargetResult = () => {
    if (unrestrictedTargetResult) {
      return unrestrictedTargetResult;
    }

    unrestrictedTargetResult = semanticFacade.resolveTarget(document, position, { traceLabel: 'rename-preflight' });
    return unrestrictedTargetResult;
  };

  if (result.invocationRisk === 'dynamic' || result.invocationRisk === 'fallback') {
    const unrestricted = getUnrestrictedTargetResult();
    const resolvesExternalDependency = unrestricted?.invocationRisk === 'external'
      || collectSemanticQueryTargets(unrestricted).some((candidate) => candidate.isExternal);

    if (resolvesExternalDependency) {
      return {
        edit: null,
        reason: 'rename no soporta dependencias nativas externas sin una implementación interna segura.',
      };
    }

    return {
      edit: null,
      reason: `rename blocked by invocationRisk=${result.invocationRisk}.`,
    };
  }

  if (target?.isExternal) {
    return {
      edit: null,
      reason: 'rename no soporta dependencias nativas externas sin una implementación interna segura.',
    };
  }

  if (!target || !isSafeRenameTarget(result)) {
    return {
      edit: null,
      reason: 'rename solo admite variables locales, parámetros o miembros con resolución semántica única.',
    };
  }

  const blockingHit = hasBlockingDynamicStringReference(target.name, sources);
  if (blockingHit) {
    return {
      edit: null,
      reason: `rename bloqueado por referencia ${blockingHit.classification} en string dinámico${blockingHit.api ? ` (${blockingHit.api})` : ''}.`,
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
    queryContext ?? createDocumentQueryContext(document, position, kb, graph, hotContext)
  );

  const edit = buildWorkspaceEdit(locations, newName);
  if (!edit) {
    return {
      edit: null,
      reason: 'rename no encontró referencias editables.',
    };
  }

  return { edit };
}