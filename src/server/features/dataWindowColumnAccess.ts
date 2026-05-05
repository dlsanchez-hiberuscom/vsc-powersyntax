import { Hover, Location, MarkupKind, Position, Range } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { findNearestDataObjectLiteralBinding, resolveDataWindowDefinitionTargets } from './dataWindowBindingModel';
import {
  buildDataWindowModelFromSnapshot,
  rangeContains,
  type DataWindowModel,
  type DataWindowRange,
  type DataWindowTableColumnNode,
} from './dataWindowModel';

interface DataWindowColumnInvocation {
  targetName: string;
  methodName: string;
  columnName: string;
  columnRange: DataWindowRange;
  bufferName?: string;
}

interface DataWindowModelTarget {
  dataObjectName: string;
  uri: string;
  model: DataWindowModel;
}

export function providePowerScriptDataWindowColumnDefinition(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
): Location | null {
  const resolved = resolvePowerScriptDataWindowColumn(document, position, kb);
  if (!resolved) {
    return null;
  }

  return Location.create(resolved.target.uri, toRange(resolved.column.selectionRange));
}

export function providePowerScriptDataWindowColumnHover(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
): Hover | null {
  const resolved = resolvePowerScriptDataWindowColumn(document, position, kb);
  if (!resolved) {
    return null;
  }

  const lines = [
    `**${resolved.column.name}**`,
    `Columna DataWindow enlazada por \`${resolved.invocation.methodName}\``,
    resolved.column.detail,
    resolved.invocation.bufferName ? `Buffer: \`${resolved.invocation.bufferName}\`` : undefined,
    `DataObject destino: \`${resolved.target.dataObjectName}\``,
  ].filter((entry): entry is string => Boolean(entry));

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: lines.join('\n\n'),
    },
    range: toRange(resolved.invocation.columnRange),
  };
}

function resolvePowerScriptDataWindowColumn(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
): { invocation: DataWindowColumnInvocation; target: DataWindowModelTarget; column: DataWindowTableColumnNode } | null {
  const invocation = findDataWindowColumnInvocation(document, position);
  if (!invocation) {
    return null;
  }

  const target = resolveRootDataWindowTarget(document, position, kb, invocation);
  if (!target) {
    return null;
  }

  const column = target.model.tableColumns.find((entry) => entry.name.toLowerCase() === invocation.columnName.toLowerCase());
  if (!column) {
    return null;
  }

  return { invocation, target, column };
}

function resolveRootDataWindowTarget(
  document: TextDocument,
  position: Position,
  kb: KnowledgeBase,
  invocation: DataWindowColumnInvocation,
): DataWindowModelTarget | null {
  const boundDataObject = findNearestDataObjectLiteralBinding(document, invocation.targetName, position.line);
  if (!boundDataObject) {
    return null;
  }

  const targets = resolveDataWindowDefinitionTargets(boundDataObject, kb);
  if (targets.length !== 1) {
    return null;
  }

  const snapshot = kb.getDocumentSnapshot(targets[0].uri);
  const model = buildDataWindowModelFromSnapshot(snapshot);
  if (!model) {
    return null;
  }

  return {
    dataObjectName: boundDataObject,
    uri: targets[0].uri,
    model,
  };
}

function findDataWindowColumnInvocation(
  document: TextDocument,
  position: Position,
): DataWindowColumnInvocation | null {
  const lineText = getLineText(document, position.line);
  const invocationMatch = /\b([a-z_][\w$#%]*)\s*\.\s*(GetItem[\w$#%]*|SetItem[\w$#%]*)\s*\(/i.exec(lineText);
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

  const columnName = literal.value.trim();
  if (!columnName) {
    return null;
  }

  const columnRange: DataWindowRange = {
    start: { line: position.line, character: literal.startCharacter },
    end: { line: position.line, character: literal.endCharacter },
  };
  if (!rangeContains(columnRange, position)) {
    return null;
  }

  return {
    targetName: invocationMatch[1],
    methodName: invocationMatch[2],
    columnName,
    columnRange,
    bufferName: findEnumArgumentAfter(lineText, literal.endCharacter + 1),
  };
}

function findFirstStringLiteral(
  lineText: string,
  searchStart: number,
): { value: string; startCharacter: number; endCharacter: number } | null {
  for (let index = searchStart; index < lineText.length; index++) {
    const quote = lineText[index];
    if (quote !== '"' && quote !== '\'') {
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

function findEnumArgumentAfter(lineText: string, searchStart: number): string | undefined {
  const tail = lineText.slice(searchStart);
  const match = /^\s*,\s*([a-z_][\w$#%]*!)/i.exec(tail);
  return match?.[1];
}

function getLineText(document: TextDocument, line: number): string {
  return document.getText().split(/\r?\n/)[line] ?? '';
}

function toRange(range: DataWindowRange): Range {
  return Range.create(range.start.line, range.start.character, range.end.line, range.end.character);
}