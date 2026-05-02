import { Hover, Location, MarkupKind, Position, Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { findNearestDataObjectLiteralBinding, resolveDataWindowDefinitionTargets } from './dataWindowBindingModel';
import {
  buildDataWindowModelFromSnapshot,
  type DataWindowModel,
  type DataWindowRange,
  rangeContains,
} from './dataWindowModel';

interface DataWindowPropertyInvocation {
  targetName: string;
  mode: 'describe' | 'modify';
  path: string;
  pathRange: DataWindowRange;
}

interface ResolvedDataWindowProperty {
  kind: 'dataobject' | 'table-select' | 'dddw-name';
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

  const lines: Array<string | undefined> = [
    `**${resolved.path}**`,
    resolved.kind === 'table-select'
      ? 'Propiedad avanzada DataWindow'
      : resolved.kind === 'dddw-name'
        ? 'Relacion child DataWindow verificada'
        : 'Propiedad avanzada DataWindow',
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
  const boundDataObject = findNearestDataObjectLiteralBinding(document, invocation.targetName, position.line);
  if (!boundDataObject) {
    return null;
  }

  const cache = new Map<string, DataWindowModelTarget | null>();
  const root = resolveSingleDataWindowTarget(boundDataObject, kb, cache);
  if (!root) {
    return null;
  }

  return resolvePropertyPath(invocation.path, root, kb, cache, []);
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

  if (lowerPath === 'datawindow.dataobject') {
    return {
      kind: 'dataobject',
      path: fullPath,
      breadcrumbs,
      targetDataObject: current.dataObjectName,
      targetUri: current.uri,
      targetRange: current.model.rootSelectionRange,
    };
  }

  if (lowerPath === 'datawindow.table.select') {
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

  const separatorIndex = normalizedPath.indexOf('.');
  if (separatorIndex < 0) {
    return null;
  }

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

  if (tail.toLowerCase() === 'dddw.name') {
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