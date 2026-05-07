import {
  Hover,
  MarkupKind,
  Position
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { PbSystemSymbolEntry } from '../knowledge/system/types';
import type { HotContextCache } from '../knowledge/HotContextCache';
import {
  getDisplayDocumentation,
  getDisplayObsoleteMessage,
  getDisplayParameterDocumentation,
  getDisplayReturnDocumentation,
  getDisplaySummary,
  getDisplayUsageNotes,
  type DocumentationLocale,
} from '../knowledge/system/localization';
import { EntityKind } from '../knowledge/types';
import { resolveCatalogOwnerTypes } from './dataWindowBindingModel';
import { provideDataWindowHoverAdapter } from './dataWindowServingAdapters';
import { buildHierarchyInspection } from './hierarchyInspection';
import { summarizeDataWindowSafeMode } from './dataWindowSafeMode';
import { createSemanticQueryFacade } from './semanticQueryFacade';
import { formatHoverViewModel } from './hoverFormat';
import {
  buildLanguageHoverViewModel,
  buildPreformattedHoverViewModel,
  buildSystemHoverViewModel,
  buildUserHoverViewModel,
  type HoverNegativeReason,
  type HoverViewModel,
} from './hoverViewModel';
import type { ActiveDocumentServingSnapshot } from '../serving/activeDocumentServingSnapshot';
import { CharType, stripCommentsSmart } from '../utils/comments';
import { findPowerBuilderIdentifierSpan, type IdentifierSpan } from '../utils/pbIdentifier';

function buildLifecycleHoverBlock(
  entity: import('../knowledge/types').Entity,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  catalog: SystemCatalog
): string | null {
  if (entity.kind !== EntityKind.Event) {
    return null;
  }

  const eventName = entity.name.toLowerCase();
  if (!['create', 'destroy', 'constructor', 'destructor'].includes(eventName)) {
    return null;
  }

  const focusType = entity.ownerName ?? entity.containerName ?? entity.fileObjectName;
  if (!focusType) {
    return null;
  }

  const inspection = buildHierarchyInspection(focusType, graph, kb, catalog);
  const lines: string[] = ['', '**Lifecycle**'];

  if (eventName === 'create' || eventName === 'destroy') {
    const phase = inspection.lifecycle.find((entry) => entry.phase === eventName);
    if (!phase) {
      return null;
    }

    lines.push(`- Fase: ${phase.phase}`);
    lines.push(`- Declarado en: ${phase.declaredIn ?? 'origen desconocido'}`);
    lines.push(`- call super::${phase.phase}: ${phase.callsAncestor ? 'sí' : 'no'}`);
    lines.push(`- Hook: ${phase.triggersHook ? `${phase.triggersHook}${phase.hookResolved ? ` → ${phase.hookDeclaredIn ?? 'origen desconocido'}` : ' no resuelto'}` : 'sin trigger explícito'}`);
    for (const warning of phase.warnings) {
      lines.push(`- Warning: ${warning}`);
    }
    return lines.join('\n');
  }

  const relatedPhase = inspection.lifecycle.find((entry) => entry.triggersHook === eventName);
  if (!relatedPhase) {
    return null;
  }

  lines.push(`- Hook: ${eventName}`);
  lines.push(`- Disparado desde: ${relatedPhase.phase}`);
  lines.push(`- call super::${relatedPhase.phase}: ${relatedPhase.callsAncestor ? 'sí' : 'no'}`);
  lines.push(`- Declarado en hook: ${relatedPhase.hookDeclaredIn ?? 'origen desconocido'}`);
  for (const warning of relatedPhase.warnings) {
    lines.push(`- Warning: ${warning}`);
  }

  return lines.join('\n');
}

function buildDataWindowHoverBlock(
  entity: import('../knowledge/types').Entity,
  kb: KnowledgeBase
): string | null {
  if (entity.kind !== EntityKind.Type || (entity.baseTypeName ?? '').toLowerCase() !== 'datawindow') {
    return null;
  }

  const summary = summarizeDataWindowSafeMode(kb.getDocumentSnapshotReadonly(entity.uri));
  if (!summary) {
    return null;
  }

  const lines: string[] = ['', '**DataWindow Safe Mode**'];
  if (summary.retrieve) {
    lines.push(`- SQL base: \`${summary.retrieve}\``);
  }
  if (summary.retrieveArguments.length > 0) {
    lines.push(`- Args retrieve: ${summary.retrieveArguments.map((argument) => `\`${argument.label}\``).join(', ')}`);
  }
  if (summary.columns.length > 0) {
    const preview = summary.columns.slice(0, 4).map((column) => `\`${column.name}: ${column.type}\``).join(', ');
    const suffix = summary.columns.length > 4 ? ` (+${summary.columns.length - 4} más)` : '';
    lines.push(`- Columnas: ${preview}${suffix}`);
  }
  if (summary.bands.length > 0) {
    lines.push(`- Bandas: ${summary.bands.map((band) => `\`${band}\``).join(', ')}`);
  }

  return lines.join('\n');
}

type HoverPresentationResult =
  | { kind: 'viewmodel'; viewModel: HoverViewModel; cacheToken: string }
  | { kind: 'negative'; reason: HoverNegativeReason; cacheToken: string };

type HoverNegativeProbe = {
  reason: HoverNegativeReason;
  token: string;
  definitive: boolean;
};

type HoverTokenProbe = {
  token: IdentifierSpan;
  lineText: string;
};

function splitMarkdownBlock(block: string | null): string[] {
  return block
    ? block.split('\n').filter((line, index) => !(index === 0 && line.trim().length === 0))
    : [];
}

function extractHoverMarkdownValue(hover: Hover): string {
  if (typeof hover.contents === 'string') {
    return hover.contents;
  }
  if (Array.isArray(hover.contents)) {
    return hover.contents.map((entry) => typeof entry === 'string' ? entry : ('value' in entry ? entry.value : '')).join('\n');
  }
  return hover.contents.value;
}

function getDocumentLineText(document: TextDocument, line: number): string {
  if (line < 0 || line >= document.lineCount) {
    return '';
  }

  const start = Position.create(line, 0);
  const end = line < document.lineCount - 1
    ? Position.create(line + 1, 0)
    : Position.create(line, Number.MAX_SAFE_INTEGER);
  return document.getText({ start, end }).replace(/\r?\n$/, '');
}

function resolveHoverNegativeReason(
  document: TextDocument,
  position: Position,
  catalog: SystemCatalog,
  activeSnapshot?: ActiveDocumentServingSnapshot,
): HoverNegativeProbe | null {
  const lineText = activeSnapshot?.getLineText(position.line) ?? getDocumentLineText(document, position.line);
  const token = activeSnapshot?.getTokenAt(position)
    ?? findPowerBuilderIdentifierSpan(lineText, position.character, { allowCursorAfterIdentifier: true });
  const maskAtCursor = activeSnapshot?.getMaskedCharacterType(position)
    ?? stripCommentsSmart([lineText]).masks[0]?.[Math.min(Math.max(position.character, 0), Math.max(0, lineText.length - 1))];

  if (maskAtCursor === CharType.Comment) {
    return { reason: 'comment', token: 'comment', definitive: true };
  }
  if (maskAtCursor === CharType.String) {
    return { reason: 'string', token: 'string', definitive: false };
  }

  if (!token) {
    const probe = lineText[position.character] ?? lineText[Math.max(0, position.character - 1)] ?? '';
    return {
      reason: probe.trim().length === 0 ? 'whitespace' : 'separator',
      token: probe.trim().length === 0 ? 'whitespace' : probe,
      definitive: true,
    };
  }

  const languageSymbol = catalog.resolveLanguageSymbol(token.word);
  if (languageSymbol && (languageSymbol.kind === 'keyword' || languageSymbol.kind === 'reserved-word')) {
    return { reason: 'keyword', token: token.word.toLowerCase(), definitive: false };
  }

  return null;
}

function resolveHoverTokenProbe(
  document: TextDocument,
  position: Position,
  activeSnapshot?: ActiveDocumentServingSnapshot,
): HoverTokenProbe | null {
  const lineText = activeSnapshot?.getLineText(position.line) ?? getDocumentLineText(document, position.line);
  const token = activeSnapshot?.getTokenAt(position)
    ?? findPowerBuilderIdentifierSpan(lineText, position.character, { allowCursorAfterIdentifier: true });

  if (!token) {
    return null;
  }

  return {
    token,
    lineText,
  };
}

function isQualifiedHoverToken(probe: HoverTokenProbe): boolean {
  if (probe.token.start <= 0) {
    return false;
  }

  const previous = probe.lineText[probe.token.start - 1] ?? '';
  const beforePrevious = probe.lineText[probe.token.start - 2] ?? '';
  return previous === '.' || (previous === ':' && beforePrevious === ':');
}

function resolveCatalogHoverByToken(
  probe: HoverTokenProbe | null,
  catalog: SystemCatalog,
  documentationLocale: DocumentationLocale,
): HoverPresentationResult | null {
  if (!probe || isQualifiedHoverToken(probe)) {
    return null;
  }

  const cacheToken = probe.token.word.toLowerCase();
  const systemSymbols = catalog.findSystemSymbol(probe.token.word);
  if (systemSymbols.length > 0) {
    return {
      kind: 'viewmodel',
      viewModel: buildSystemHoverViewModel(systemSymbols[0], catalog, documentationLocale),
      cacheToken,
    };
  }

  const languageSymbol = catalog.resolveLanguageSymbol(probe.token.word);
  if (!languageSymbol) {
    return null;
  }

  if (languageSymbol.kind === 'keyword' || languageSymbol.kind === 'reserved-word') {
    return {
      kind: 'negative',
      reason: 'keyword',
      cacheToken,
    };
  }

  return {
    kind: 'viewmodel',
    viewModel: buildLanguageHoverViewModel(languageSymbol, catalog, documentationLocale),
    cacheToken,
  };
}

export function buildHoverPresentationResult(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  catalog: SystemCatalog,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  documentationLocale: DocumentationLocale = 'en',
  activeSnapshot?: ActiveDocumentServingSnapshot,
): HoverPresentationResult {
  const negativeProbe = resolveHoverNegativeReason(document, position, catalog, activeSnapshot);
  if (negativeProbe?.definitive) {
    return { kind: 'negative', reason: negativeProbe.reason, cacheToken: negativeProbe.token };
  }

  const tokenProbe = resolveHoverTokenProbe(document, position, activeSnapshot);

  const dataWindowHover = provideDataWindowHoverAdapter({
    document,
    position,
    kb,
    graph,
    systemCatalog: catalog,
    hotContext,
    activeSnapshot,
  });
  if (dataWindowHover) {
    return {
      kind: 'viewmodel',
      viewModel: buildPreformattedHoverViewModel(dataWindowHover.source, extractHoverMarkdownValue(dataWindowHover.hover)),
      cacheToken: activeSnapshot?.getTokenAt(position)?.word.toLowerCase() ?? dataWindowHover.fastContext.cacheKey,
    };
  }

  if (negativeProbe?.reason !== 'string') {
    const catalogFastPath = resolveCatalogHoverByToken(tokenProbe, catalog, documentationLocale);
    if (catalogFastPath) {
      return catalogFastPath;
    }
  }

  const semanticFacade = createSemanticQueryFacade({ kb, graph, systemCatalog: catalog, hotContext });
  const resolved = semanticFacade.resolveTargetInfo(document, position, { traceLabel: 'hover', consumer: 'hover' });
  const cacheToken = resolved?.context.identifier.toLowerCase() ?? tokenProbe?.token.word.toLowerCase() ?? 'hover';
  if (!resolved) {
    return { kind: 'negative', reason: negativeProbe?.reason ?? 'unresolved', cacheToken: negativeProbe?.token ?? cacheToken };
  }

  const userDefinitions = resolved.targets;
  if (userDefinitions.length > 0) {
    const definition = userDefinitions[0];
    const lifecycleLines = splitMarkdownBlock(buildLifecycleHoverBlock(definition, kb, graph, catalog));
    const dataWindowLines = splitMarkdownBlock(buildDataWindowHoverBlock(definition, kb));
    return {
      kind: 'viewmodel',
      viewModel: buildUserHoverViewModel(definition, {
        confidence: resolved.confidence,
        reasonCode: resolved.reasonCodes[0],
        ambiguous: resolved.targets.length > 1,
        ambiguityKind: resolved.ambiguityKind,
        targetCount: resolved.targets.length,
      }, {
        detailLines: [...lifecycleLines, ...dataWindowLines],
        locale: documentationLocale,
      }),
      cacheToken,
    };
  }

  const ownerType = resolved.context.qualifier
    ? semanticFacade.resolveReceiverType(document, resolved.context.qualifier, position).ownerType ?? undefined
    : undefined;
  const ownerTypes = resolveCatalogOwnerTypes(ownerType, graph);
  const ownerScopedSymbol = ownerTypes.length > 0
    ? catalog.resolveMemberFunctionForOwner(resolved.context.identifier, ownerTypes)
      ?? catalog.resolveEventForOwner(resolved.context.identifier, ownerTypes)
    : undefined;
  const systemSymbols = resolved.context.qualifier
    ? (ownerScopedSymbol ? [ownerScopedSymbol] : [])
    : catalog.findSystemSymbol(resolved.context.identifier);
  if (systemSymbols.length > 0) {
    return {
      kind: 'viewmodel',
      viewModel: buildSystemHoverViewModel(systemSymbols[0], catalog, documentationLocale),
      cacheToken,
    };
  }

  const langSymbol = catalog.resolveLanguageSymbol(resolved.context.identifier);
  if (langSymbol) {
    if (langSymbol.kind === 'keyword' || langSymbol.kind === 'reserved-word') {
      return { kind: 'negative', reason: 'keyword', cacheToken };
    }

    return {
      kind: 'viewmodel',
      viewModel: buildLanguageHoverViewModel(langSymbol, catalog, documentationLocale),
      cacheToken,
    };
  }

  return {
    kind: 'negative',
    reason: negativeProbe?.reason ?? 'unresolved',
    cacheToken: negativeProbe?.token ?? cacheToken,
  };
}

/**
 * Provee la información de Hover cuando el usuario pone el ratón sobre una palabra.
 */
export function provideHover(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  catalog: SystemCatalog,
  graph: InheritanceGraph,
  hotContext?: HotContextCache,
  documentationLocale: DocumentationLocale = 'en',
  activeSnapshot?: ActiveDocumentServingSnapshot,
): Hover | null {
  const presentation = buildHoverPresentationResult(
    document,
    position,
    kb,
    catalog,
    graph,
    hotContext,
    documentationLocale,
    activeSnapshot,
  );
  if (presentation.kind === 'negative') {
    return null;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: formatHoverViewModel(presentation.viewModel)
    }
  };
}
