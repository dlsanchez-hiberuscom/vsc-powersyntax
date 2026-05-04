import { CompletionItem, CompletionItemKind, Hover, Location, MarkupKind, Position, Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { normalizeSystemSymbolName } from '../knowledge/system/normalization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../knowledge/system/registry/registry';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';
import { findNearestDataObjectLiteralBinding, resolveDataWindowDefinitionTargets } from './dataWindowBindingModel';
import {
  buildDataWindowModelFromSnapshot,
  type DataWindowModel,
  type DataWindowRange,
  rangeContains,
} from './dataWindowModel';

interface DataWindowPropertyInvocation {
  targetName: string;
  mode: 'describe' | 'modify' | 'object' | 'getchild';
  path: string;
  pathRange: DataWindowRange;
}

interface ResolvedDataWindowProperty {
  kind: 'dataobject' | 'syntax' | 'table-select' | 'dddw-name';
  path: string;
  breadcrumbs: string[];
  targetDataObject?: string;
  targetUri?: string;
  targetRange?: DataWindowRange;
  statement?: string;
}

interface DataWindowModelTarget {
  dataObjectName: string;
  uri: string;
  model: DataWindowModel;
}

export interface PowerScriptDataWindowPropertyInspection {
  invocation: {
    targetName: string;
    mode: DataWindowPropertyInvocation['mode'];
    path: string;
    pathRange: DataWindowRange;
  };
  resolved: ResolvedDataWindowProperty | null;
}

interface DataWindowCompletionSuggestion {
  label: string;
  kind: CompletionItemKind;
  detail: string;
}

const DATAWINDOW_PROPERTIES_DOMAIN = 'datawindow-properties';
const DATAWINDOW_PROPERTY_ENTRIES = PB_SYSTEM_SYMBOL_REGISTRY.indexes.byDomain.get(DATAWINDOW_PROPERTIES_DOMAIN) ?? [];

function buildCompositeKey(left: string, right: string): string {
  return `${left}\u0000${right}`;
}

function lookupDataWindowPropertyEntry(path: string): PbSystemSymbolEntry | undefined {
  const normalizedPath = normalizeSystemSymbolName(path);
  if (!normalizedPath) {
    return undefined;
  }

  return PB_SYSTEM_SYMBOL_REGISTRY.indexes.byDomainAndLookupKey.get(
    buildCompositeKey(DATAWINDOW_PROPERTIES_DOMAIN, normalizedPath),
  )?.[0];
}

function toDataWindowCompletionSuggestion(
  entry: PbSystemSymbolEntry,
  label: string,
  kind: CompletionItemKind,
): DataWindowCompletionSuggestion {
  return {
    label,
    kind,
    detail: entry.summary,
  };
}

function collectCatalogChildSuggestions(
  parentPath: string,
  kind: CompletionItemKind,
): DataWindowCompletionSuggestion[] {
  const normalizedParentPath = normalizeSystemSymbolName(parentPath);
  if (!normalizedParentPath) {
    return [];
  }

  const seen = new Set<string>();
  const suggestions: DataWindowCompletionSuggestion[] = [];

  for (const entry of DATAWINDOW_PROPERTY_ENTRIES) {
    if (entry.normalizedName === normalizedParentPath) {
      continue;
    }

    if (!entry.normalizedName.startsWith(`${normalizedParentPath}.`)) {
      continue;
    }

    const suffix = entry.name.slice(parentPath.length + 1);
    const separatorIndex = suffix.indexOf('.');
    const childSegment = separatorIndex >= 0 ? suffix.slice(0, separatorIndex) : suffix;
    const childKey = childSegment.toLowerCase();

    if (!childSegment || seen.has(childKey)) {
      continue;
    }

    const childEntry = lookupDataWindowPropertyEntry(`${parentPath}.${childSegment}`);
    if (!childEntry) {
      continue;
    }

    seen.add(childKey);
    suggestions.push(toDataWindowCompletionSuggestion(childEntry, childSegment, kind));
  }

  return suggestions;
}

function getCanonicalDataWindowPropertyPath(
  resolved: ResolvedDataWindowProperty,
): string | null {
  if (resolved.kind === 'dataobject') {
    return 'DataWindow.DataObject';
  }

  if (resolved.kind === 'syntax') {
    return 'DataWindow.Syntax';
  }

  if (resolved.kind === 'table-select') {
    return 'DataWindow.Table.Select';
  }

  if (resolved.kind === 'dddw-name') {
    return 'dddw.name';
  }

  return null;
}

export function providePowerScriptDataWindowPropertyCompletion(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
): CompletionItem[] | null {
  const invocation = findDataWindowPropertyInvocation(document, position);
  if (!invocation) {
    return null;
  }

  const cache = new Map<string, DataWindowModelTarget | null>();
  const root = resolveRootDataWindowTarget(document, position, kb, invocation, cache);
  if (!root) {
    return null;
  }

  const prefixLength = Math.max(0, Math.min(invocation.path.length, position.character - invocation.pathRange.start.character));
  const typedPath = invocation.path.slice(0, prefixLength).replace(/\s*\.\s*/g, '.');
  const suggestions = collectCompletionSuggestions(typedPath, root, kb, cache);
  if (suggestions.length === 0) {
    return null;
  }

  return suggestions.map((suggestion) => ({
    label: suggestion.label,
    kind: suggestion.kind,
    detail: suggestion.detail,
    sortText: `0_dw_${suggestion.label.toLowerCase()}`,
  }));
}

export function inspectPowerScriptDataWindowProperty(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
): PowerScriptDataWindowPropertyInspection | null {
  const invocation = findDataWindowPropertyInvocation(document, position);
  if (!invocation) {
    return null;
  }

  const cache = new Map<string, DataWindowModelTarget | null>();
  const root = resolveRootDataWindowTarget(document, position, kb, invocation, cache);
  if (!root) {
    return null;
  }

  return {
    invocation,
    resolved: resolvePropertyPath(invocation.path, root, kb, cache, []),
  };
}

export function providePowerScriptDataWindowPropertyDefinition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
): Location | null {
  const invocation = findDataWindowPropertyInvocation(document, position);
  if (!invocation) {
    return null;
  }

  const resolved = resolvePowerScriptDataWindowProperty(document, position, kb, invocation);
  if (!resolved?.targetUri || !resolved.targetRange) {
    return null;
  }

  return Location.create(resolved.targetUri, toRange(resolved.targetRange));
}

export function providePowerScriptDataWindowPropertyHover(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
): Hover | null {
  const invocation = findDataWindowPropertyInvocation(document, position);
  if (!invocation) {
    return null;
  }

  const resolved = resolvePowerScriptDataWindowProperty(document, position, kb, invocation);
  if (!resolved) {
    return null;
  }

  const canonicalPath = getCanonicalDataWindowPropertyPath(resolved);
  const catalogEntry = canonicalPath ? lookupDataWindowPropertyEntry(canonicalPath) : undefined;

  const lines: Array<string | undefined> = [
    `**${resolved.path}**`,
    catalogEntry?.summary
      ?? (resolved.kind === 'dddw-name'
        ? 'Relacion child DataWindow verificada'
        : 'Propiedad avanzada DataWindow'),
    resolved.breadcrumbs.length > 0 ? `Ruta: \`${resolved.breadcrumbs.join(' > ')}\`` : undefined,
    resolved.targetDataObject ? `DataObject destino: \`${resolved.targetDataObject}\`` : undefined,
    resolved.statement ? '```sql' : undefined,
    resolved.statement,
    resolved.statement ? '```' : undefined,
  ];

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: lines.filter((entry): entry is string => !!entry).join('\n\n'),
    },
    range: toRange(invocation.pathRange),
  };
}

function resolvePowerScriptDataWindowProperty(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  invocation: DataWindowPropertyInvocation,
): ResolvedDataWindowProperty | null {
  const cache = new Map<string, DataWindowModelTarget | null>();
  const root = resolveRootDataWindowTarget(document, position, kb, invocation, cache);
  if (!root) {
    return null;
  }

  return resolvePropertyPath(invocation.path, root, kb, cache, []);
}

function resolveRootDataWindowTarget(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  invocation: DataWindowPropertyInvocation,
  cache: Map<string, DataWindowModelTarget | null>,
): DataWindowModelTarget | null {
  const boundDataObject = findNearestDataObjectLiteralBinding(document, invocation.targetName, position.line);
  if (!boundDataObject) {
    return null;
  }
  return resolveSingleDataWindowTarget(boundDataObject, kb, cache);
}

function collectCompletionSuggestions(
  typedPath: string,
  current: DataWindowModelTarget,
  kb: KnowledgeBase,
  cache: Map<string, DataWindowModelTarget | null>,
): DataWindowCompletionSuggestion[] {
  const normalizedTypedPath = typedPath.trim();
  const endsWithDot = normalizedTypedPath.endsWith('.');
  const separatorIndex = endsWithDot
    ? normalizedTypedPath.length - 1
    : normalizedTypedPath.lastIndexOf('.');
  const parentPath = separatorIndex >= 0
    ? normalizedTypedPath.slice(0, separatorIndex)
    : '';
  const segmentPrefix = separatorIndex >= 0
    ? normalizedTypedPath.slice(separatorIndex + 1)
    : normalizedTypedPath;
  const candidates = resolveCompletionCandidates(parentPath, current, kb, cache);
  const lowerPrefix = segmentPrefix.toLowerCase();

  return candidates.filter((candidate) => candidate.label.toLowerCase().startsWith(lowerPrefix));
}

function resolveCompletionCandidates(
  path: string,
  current: DataWindowModelTarget,
  kb: KnowledgeBase,
  cache: Map<string, DataWindowModelTarget | null>,
): DataWindowCompletionSuggestion[] {
  const normalizedPath = path.trim().replace(/\s*\.\s*/g, '.');
  const lowerPath = normalizedPath.toLowerCase();

  if (!normalizedPath) {
    const rootDataWindowProperty = lookupDataWindowPropertyEntry('DataWindow');
    return uniqueCompletionSuggestions([
      ...current.model.reports.map((report) => ({
        label: report.name,
        kind: CompletionItemKind.Field,
        detail: 'Report child DataWindow',
      })),
      ...current.model.tableColumns.map((column) => ({
        label: column.name,
        kind: CompletionItemKind.Field,
        detail: column.dddwName ? 'DataWindow column with dropdown child' : 'DataWindow column',
      })),
      ...(rootDataWindowProperty
        ? [toDataWindowCompletionSuggestion(rootDataWindowProperty, 'DataWindow', CompletionItemKind.Class)]
        : []),
    ]);
  }

  if (lowerPath === 'datawindow') {
    return collectCatalogChildSuggestions('DataWindow', CompletionItemKind.Property);
  }

  if (lowerPath === 'datawindow.table') {
    return collectCatalogChildSuggestions('DataWindow.Table', CompletionItemKind.Property);
  }

  if (!normalizedPath.includes('.')) {
    const report = current.model.reports.find((entry) => entry.name.toLowerCase() === lowerPath);
    if (report?.dataObject) {
      const child = resolveSingleDataWindowTarget(report.dataObject, kb, cache);
      if (!child) {
        return [
          { label: 'DataWindow', kind: CompletionItemKind.Class, detail: 'Child DataWindow property namespace' },
        ];
      }

      return resolveCompletionCandidates('', child, kb, cache);
    }

    const tableColumn = current.model.tableColumns.find((entry) => entry.name.toLowerCase() === lowerPath);
    if (!tableColumn?.dddwName) {
      return [];
    }

    const columnSuggestions: DataWindowCompletionSuggestion[] = [];
    const dataWindowEntry = lookupDataWindowPropertyEntry('DataWindow');
    const dddwEntry = lookupDataWindowPropertyEntry('dddw');

    if (dataWindowEntry) {
      columnSuggestions.push(toDataWindowCompletionSuggestion(dataWindowEntry, 'DataWindow', CompletionItemKind.Class));
    }

    if (dddwEntry) {
      columnSuggestions.push(toDataWindowCompletionSuggestion(dddwEntry, 'dddw', CompletionItemKind.Property));
    }

    return columnSuggestions;
  }

  const separatorIndex = normalizedPath.indexOf('.');
  const head = normalizedPath.slice(0, separatorIndex);
  const tail = normalizedPath.slice(separatorIndex + 1);
  const lowerTail = tail.toLowerCase();

  const report = current.model.reports.find((entry) => entry.name.toLowerCase() === head.toLowerCase());
  if (report?.dataObject) {
    const child = resolveSingleDataWindowTarget(report.dataObject, kb, cache);
    if (!child) {
      return [];
    }
    return resolveCompletionCandidates(tail, child, kb, cache);
  }

  const tableColumn = current.model.tableColumns.find((entry) => entry.name.toLowerCase() === head.toLowerCase());
  if (!tableColumn?.dddwName) {
    return [];
  }

  if (lowerTail === 'dddw') {
    return collectCatalogChildSuggestions('dddw', CompletionItemKind.Property);
  }

  const child = resolveSingleDataWindowTarget(tableColumn.dddwName, kb, cache);
  if (!child) {
    return [];
  }

  return resolveCompletionCandidates(tail, child, kb, cache);
}

function uniqueCompletionSuggestions(suggestions: DataWindowCompletionSuggestion[]): DataWindowCompletionSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = suggestion.label.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function resolvePropertyPath(
  path: string,
  current: DataWindowModelTarget,
  kb: KnowledgeBase,
  cache: Map<string, DataWindowModelTarget | null>,
  breadcrumbs: string[],
  fullPath = path,
): ResolvedDataWindowProperty | null {
  const normalizedPath = path.trim();
  const lowerPath = normalizedPath.toLowerCase();

  if (lowerPath === 'datawindow.syntax' && lookupDataWindowPropertyEntry('DataWindow.Syntax')) {
    return {
      kind: 'syntax',
      path: fullPath,
      breadcrumbs,
      targetDataObject: current.dataObjectName,
      targetUri: current.uri,
      targetRange: current.model.rootSelectionRange,
    };
  }

  if (lowerPath === 'datawindow.dataobject' && lookupDataWindowPropertyEntry('DataWindow.DataObject')) {
    return {
      kind: 'dataobject',
      path: fullPath,
      breadcrumbs,
      targetDataObject: current.dataObjectName,
      targetUri: current.uri,
      targetRange: current.model.rootSelectionRange,
    };
  }

  if (lowerPath === 'datawindow.table.select' && lookupDataWindowPropertyEntry('DataWindow.Table.Select')) {
    if (!current.model.retrieve) {
      return null;
    }

    return {
      kind: 'table-select',
      path: fullPath,
      breadcrumbs,
      targetDataObject: current.dataObjectName,
      targetUri: current.uri,
      targetRange: current.model.retrieve.selectionRange,
      statement: current.model.retrieve.statement,
    };
  }

  if (!normalizedPath.includes('.')) {
    const directChild = resolveDirectChildReference(normalizedPath, current, kb, cache, fullPath, breadcrumbs);
    if (directChild) {
      return directChild;
    }
    return null;
  }

  const separatorIndex = normalizedPath.indexOf('.');

  const head = normalizedPath.slice(0, separatorIndex);
  const tail = normalizedPath.slice(separatorIndex + 1);

  const report = current.model.reports.find((entry) => entry.name.toLowerCase() === head.toLowerCase());
  if (report?.dataObject) {
    const child = resolveSingleDataWindowTarget(report.dataObject, kb, cache);
    if (!child) {
      return null;
    }

    return resolvePropertyPath(tail, child, kb, cache, [...breadcrumbs, head], fullPath);
  }

  const tableColumn = current.model.tableColumns.find((entry) => entry.name.toLowerCase() === head.toLowerCase());
  if (!tableColumn) {
    return null;
  }

  if (tail.toLowerCase() === 'dddw.name' && lookupDataWindowPropertyEntry('dddw.name')) {
    return {
      kind: 'dddw-name',
      path: fullPath,
      breadcrumbs: [...breadcrumbs, head],
      targetDataObject: tableColumn.dddwName,
      targetUri: tableColumn.dddwName ? resolveSingleDataWindowTarget(tableColumn.dddwName, kb, cache)?.uri : undefined,
      targetRange: tableColumn.dddwName ? resolveSingleDataWindowTarget(tableColumn.dddwName, kb, cache)?.model.rootSelectionRange : undefined,
    };
  }

  if (!tableColumn.dddwName) {
    return null;
  }

  const child = resolveSingleDataWindowTarget(tableColumn.dddwName, kb, cache);
  if (!child) {
    return null;
  }

  return resolvePropertyPath(tail, child, kb, cache, [...breadcrumbs, head], fullPath);
}

function resolveDirectChildReference(
  name: string,
  current: DataWindowModelTarget,
  kb: KnowledgeBase,
  cache: Map<string, DataWindowModelTarget | null>,
  fullPath: string,
  breadcrumbs: string[],
): ResolvedDataWindowProperty | null {
  const report = current.model.reports.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  if (report?.dataObject) {
    const child = resolveSingleDataWindowTarget(report.dataObject, kb, cache);
    return {
      kind: 'dddw-name',
      path: fullPath,
      breadcrumbs: [...breadcrumbs, name],
      targetDataObject: report.dataObject,
      targetUri: child?.uri,
      targetRange: child?.model.rootSelectionRange,
    };
  }

  const tableColumn = current.model.tableColumns.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  if (!tableColumn?.dddwName) {
    return null;
  }

  const child = resolveSingleDataWindowTarget(tableColumn.dddwName, kb, cache);
  return {
    kind: 'dddw-name',
    path: fullPath,
    breadcrumbs: [...breadcrumbs, name],
    targetDataObject: tableColumn.dddwName,
    targetUri: child?.uri,
    targetRange: child?.model.rootSelectionRange,
  };
}

function resolveSingleDataWindowTarget(
  dataObjectName: string,
  kb: KnowledgeBase,
  cache: Map<string, DataWindowModelTarget | null>,
): DataWindowModelTarget | null {
  const cacheKey = dataObjectName.toLowerCase();
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) ?? null;
  }

  const targets = resolveDataWindowDefinitionTargets(dataObjectName, kb);
  if (targets.length !== 1) {
    cache.set(cacheKey, null);
    return null;
  }

  const target = targets[0];
  const model = buildDataWindowModelFromSnapshot(kb.getDocumentSnapshot(target.uri));
  if (!model) {
    cache.set(cacheKey, null);
    return null;
  }

  const resolved: DataWindowModelTarget = {
    dataObjectName,
    uri: target.uri,
    model,
  };
  cache.set(cacheKey, resolved);
  return resolved;
}

function findDataWindowPropertyInvocation(
  document: TextDocument,
  position: Position,
): DataWindowPropertyInvocation | null {
  const objectInvocation = findDirectObjectInvocation(document, position);
  if (objectInvocation) {
    return objectInvocation;
  }

  const getChildInvocation = findGetChildInvocation(document, position);
  if (getChildInvocation) {
    return getChildInvocation;
  }

  const lineText = getLineText(document, position.line);
  const invocationMatch = /\b([a-z_][\w$#%]*)\s*\.\s*(Describe|Modify)\s*\(/i.exec(lineText);
  if (!invocationMatch) {
    return null;
  }

  const openParenIndex = lineText.indexOf('(', invocationMatch.index);
  if (openParenIndex < 0) {
    return null;
  }

  const literal = findFirstStringLiteral(lineText, openParenIndex + 1);
  if (!literal) {
    return null;
  }

  const mode = invocationMatch[2].toLowerCase() === 'modify' ? 'modify' : 'describe';
  const path = mode === 'modify'
    ? literal.value.split('=')[0]?.trim() ?? ''
    : literal.value.trim();
  if (!path) {
    return null;
  }

  const propertyOffset = literal.value.indexOf(path);
  const pathRange: DataWindowRange = {
    start: { line: position.line, character: literal.startCharacter + Math.max(0, propertyOffset) },
    end: { line: position.line, character: literal.startCharacter + Math.max(0, propertyOffset) + path.length },
  };
  if (!rangeContains(pathRange, position)) {
    return null;
  }

  return {
    targetName: invocationMatch[1],
    mode,
    path,
    pathRange,
  };
}

function findDirectObjectInvocation(
  document: TextDocument,
  position: Position,
): DataWindowPropertyInvocation | null {
  const lineText = getLineText(document, position.line);
  const pattern = /\b([a-z_][\w$#%]*)\s*\.\s*object\s*\.\s*([a-z_][\w$#%]*(?:\s*\.\s*[a-z_][\w$#%]*)*)/ig;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(lineText)) !== null) {
    const rawPath = match[2];
    const pathStart = lineText.indexOf(rawPath, match.index);
    if (pathStart < 0) {
      continue;
    }
    const pathRange: DataWindowRange = {
      start: { line: position.line, character: pathStart },
      end: { line: position.line, character: pathStart + rawPath.length },
    };
    if (!rangeContains(pathRange, position)) {
      continue;
    }

    return {
      targetName: match[1],
      mode: 'object',
      path: rawPath.replace(/\s*\.\s*/g, '.'),
      pathRange,
    };
  }

  return null;
}

function findGetChildInvocation(
  document: TextDocument,
  position: Position,
): DataWindowPropertyInvocation | null {
  const lineText = getLineText(document, position.line);
  const invocationMatch = /\b([a-z_][\w$#%]*)\s*\.\s*GetChild\s*\(/i.exec(lineText);
  if (!invocationMatch) {
    return null;
  }

  const openParenIndex = lineText.indexOf('(', invocationMatch.index);
  if (openParenIndex < 0) {
    return null;
  }

  const literal = findFirstStringLiteral(lineText, openParenIndex + 1);
  if (!literal) {
    return null;
  }

  const pathRange: DataWindowRange = {
    start: { line: position.line, character: literal.startCharacter },
    end: { line: position.line, character: literal.endCharacter },
  };
  if (!rangeContains(pathRange, position)) {
    return null;
  }

  const path = literal.value.trim();
  if (!path) {
    return null;
  }

  return {
    targetName: invocationMatch[1],
    mode: 'getchild',
    path,
    pathRange,
  };
}

function findFirstStringLiteral(
  lineText: string,
  searchStart: number,
): { value: string; startCharacter: number; endCharacter: number } | null {
  for (let index = searchStart; index < lineText.length; index++) {
    const quote = lineText[index];
    if (quote !== '"' && quote !== "'") {
      continue;
    }

    let value = '';
    for (let cursor = index + 1; cursor < lineText.length; cursor++) {
      const current = lineText[cursor];
      if (current === '~' && cursor + 1 < lineText.length) {
        value += lineText[cursor + 1];
        cursor++;
        continue;
      }
      if (current === quote) {
        return {
          value,
          startCharacter: index + 1,
          endCharacter: cursor,
        };
      }
      value += current;
    }

    return null;
  }

  return null;
}

function getLineText(document: TextDocument, line: number): string {
  return document.getText().split(/\r?\n/)[line] ?? '';
}

function toRange(range: DataWindowRange): Range {
  return Range.create(range.start.line, range.start.character, range.end.line, range.end.character);
}