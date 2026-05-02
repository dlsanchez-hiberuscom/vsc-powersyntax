import { TextDocument } from 'vscode-languageserver-textdocument';

import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';

export interface DataWindowPosition {
  line: number;
  character: number;
}

export interface DataWindowRange {
  start: DataWindowPosition;
  end: DataWindowPosition;
}

export interface DataWindowPositionLike {
  line: number;
  character: number;
}

interface DataWindowBaseNode {
  name: string;
  detail?: string;
  range: DataWindowRange;
  selectionRange: DataWindowRange;
}

export interface DataWindowBandNode extends DataWindowBaseNode {
  kind: 'band';
}

export interface DataWindowTableColumnNode extends DataWindowBaseNode {
  kind: 'table-column';
  type?: string;
  dbName?: string;
  update?: string;
  dddwName?: string;
  dddwRange?: DataWindowRange;
}

export interface DataWindowRetrieveNode extends DataWindowBaseNode {
  kind: 'retrieve';
  statement: string;
}

export interface DataWindowReportNode extends DataWindowBaseNode {
  kind: 'report';
  dataObject?: string;
  dataObjectRange?: DataWindowRange;
}

export interface DataWindowSqlReference {
  rawText: string;
  columnName: string;
  qualifiedTableName?: string;
  range: DataWindowRange;
}

export interface DataWindowModel {
  objectName: string;
  rootRange: DataWindowRange;
  rootSelectionRange: DataWindowRange;
  bands: DataWindowBandNode[];
  tableColumns: DataWindowTableColumnNode[];
  reports: DataWindowReportNode[];
  retrieve?: DataWindowRetrieveNode;
  sqlReferences: DataWindowSqlReference[];
}

const BAND_NAMES = new Set(['header', 'summary', 'footer', 'detail']);

export function buildDataWindowModel(document: TextDocument): DataWindowModel | null {
  return buildDataWindowModelFromText(document.uri, document.getText());
}

export function buildDataWindowModelFromSnapshot(snapshot: SemanticDocumentSnapshot | null): DataWindowModel | null {
  if (!snapshot) {
    return null;
  }

  return buildDataWindowModelFromText(snapshot.uri, snapshot.maskedText.lines.join('\n'));
}

export function buildDataWindowModelFromText(uri: string, text: string): DataWindowModel | null {
  if (!uri.toLowerCase().endsWith('.srd')) {
    return null;
  }

  const lines = text.split(/\r?\n/);
  const objectName = inferDataWindowObjectName(uri);
  if (!objectName) {
    return null;
  }

  const bands: DataWindowBandNode[] = [];
  const tableColumns: DataWindowTableColumnNode[] = [];
  const reports: DataWindowReportNode[] = [];
  let retrieve: DataWindowRetrieveNode | undefined;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const lineText = lines[lineIndex] ?? '';
    const trimmed = lineText.trim();

    const bandMatch = trimmed.match(/^(header|summary|footer|detail)\(/i);
    if (bandMatch) {
      const bandName = bandMatch[1].toLowerCase();
      const startCharacter = lineText.toLowerCase().indexOf(bandName);
      bands.push({
        name: bandName,
        kind: 'band',
        detail: 'banda DataWindow',
        range: createRange(lineIndex, 0, lineIndex, lineText.length),
        selectionRange: createRange(lineIndex, startCharacter, lineIndex, startCharacter + bandName.length),
      });
      continue;
    }

    if (/^table\(/i.test(trimmed)) {
      const block = extractParenthesizedBlock(lines, lineIndex);
      const tableText = block.text;
      const columnSegments = extractNamedBlockSegments(tableText, 'column');
      for (const segment of columnSegments) {
        const nameInfo = findUnquotedAttributeValueRange(segment.text, 'name');
        if (!nameInfo?.value) {
          continue;
        }

        const type = extractAttribute(segment.text, 'type');
        const dbName = extractAttribute(segment.text, 'dbname');
        const update = extractAttribute(segment.text, 'update');
        const dddwInfo = findQuotedAttributeValueRange(segment.text, 'dddw.name')
          ?? findUnquotedAttributeValueRange(segment.text, 'dddw.name');

        tableColumns.push({
          name: nameInfo.value,
          kind: 'table-column',
          type,
          dbName,
          update,
          dddwName: dddwInfo?.value,
          dddwRange: dddwInfo
            ? blockOffsetRangeToDataWindowRange(
              tableText,
              lineIndex,
              segment.startOffset + dddwInfo.startOffset,
              segment.startOffset + dddwInfo.endOffset,
            )
            : undefined,
          detail: buildTableColumnDetail(segment.text),
          range: block.range,
          selectionRange: blockOffsetRangeToDataWindowRange(
            tableText,
            lineIndex,
            segment.startOffset + nameInfo.startOffset,
            segment.startOffset + nameInfo.endOffset,
          ),
        });
      }

      const retrieveInfo = findQuotedAttributeValueRange(tableText, 'retrieve');
      if (retrieveInfo?.value) {
        retrieve = {
          name: 'retrieve',
          kind: 'retrieve',
          detail: truncateRetrieveStatement(retrieveInfo.value),
          statement: retrieveInfo.value,
          range: block.range,
          selectionRange: blockOffsetRangeToDataWindowRange(tableText, lineIndex, retrieveInfo.startOffset, retrieveInfo.endOffset),
        };
      }

      lineIndex = block.endLine;
      continue;
    }

    if (/^report\(/i.test(trimmed)) {
      const block = extractParenthesizedBlock(lines, lineIndex);
      const nameInfo = findUnquotedAttributeValueRange(block.text, 'name');
      if (nameInfo?.value) {
        const dataObjectInfo = findQuotedAttributeValueRange(block.text, 'dataobject')
          ?? findUnquotedAttributeValueRange(block.text, 'dataobject');
        reports.push({
          name: nameInfo.value,
          kind: 'report',
          detail: dataObjectInfo?.value
            ? `Control report · DataObject: \`${dataObjectInfo.value}\``
            : 'Control report DataWindow',
          dataObject: dataObjectInfo?.value,
          dataObjectRange: dataObjectInfo
            ? blockOffsetRangeToDataWindowRange(block.text, lineIndex, dataObjectInfo.startOffset, dataObjectInfo.endOffset)
            : undefined,
          range: block.range,
          selectionRange: blockOffsetRangeToDataWindowRange(block.text, lineIndex, nameInfo.startOffset, nameInfo.endOffset),
        });
      }

      lineIndex = block.endLine;
    }
  }

  return {
    objectName,
    rootRange: createRange(0, 0, Math.max(0, lines.length - 1), lines[lines.length - 1]?.length ?? 0),
    rootSelectionRange: createRange(0, 0, 0, (lines[0] ?? '').length),
    bands,
    tableColumns,
    reports,
    retrieve,
    sqlReferences: retrieve ? parseSimpleSelectColumnReferences(retrieve) : [],
  };
}

export function inferDataWindowObjectName(uri: string): string | undefined {
  const normalized = uri.replace(/\\/g, '/');
  const basename = normalized.slice(normalized.lastIndexOf('/') + 1);
  return basename.toLowerCase().endsWith('.srd') ? basename.slice(0, -4) : undefined;
}

export function extractAttribute(text: string, attributeName: string): string | undefined {
  return findQuotedAttributeValueRange(text, attributeName)?.value
    ?? findUnquotedAttributeValueRange(text, attributeName)?.value;
}

export function findQuotedAttributeValueRange(
  text: string,
  attributeName: string,
): { value: string; startOffset: number; endOffset: number } | undefined {
  const matcher = new RegExp(`${escapeRegex(attributeName)}="([^"]*)"`, 'i');
  const match = matcher.exec(text);
  if (!match || match.index == null) {
    return undefined;
  }

  const value = match[1] ?? '';
  const startOffset = match.index + attributeName.length + 2;
  return { value, startOffset, endOffset: startOffset + value.length };
}

export function findUnquotedAttributeValueRange(
  text: string,
  attributeName: string,
): { value: string; startOffset: number; endOffset: number } | undefined {
  const matcher = new RegExp(`${escapeRegex(attributeName)}=([^\\s)]+)`, 'i');
  const match = matcher.exec(text);
  if (!match || match.index == null) {
    return undefined;
  }

  const value = match[1] ?? '';
  const startOffset = match.index + attributeName.length + 1;
  return { value, startOffset, endOffset: startOffset + value.length };
}

export function rangeContains(range: DataWindowRange, position: DataWindowPositionLike): boolean {
  if (position.line < range.start.line || position.line > range.end.line) {
    return false;
  }
  if (position.line === range.start.line && position.character < range.start.character) {
    return false;
  }
  if (position.line === range.end.line && position.character > range.end.character) {
    return false;
  }
  return true;
}

export function rangeEndAfter(left: DataWindowRange, right: DataWindowRange): DataWindowRange {
  const startsEarlier = left.start.line < right.start.line
    || (left.start.line === right.start.line && left.start.character <= right.start.character);
  const endsLater = left.end.line > right.end.line
    || (left.end.line === right.end.line && left.end.character >= right.end.character);

  return {
    start: startsEarlier ? left.start : right.start,
    end: endsLater ? left.end : right.end,
  };
}

function createRange(startLine: number, startCharacter: number, endLine: number, endCharacter: number): DataWindowRange {
  return {
    start: { line: startLine, character: startCharacter },
    end: { line: endLine, character: endCharacter },
  };
}

function extractParenthesizedBlock(lines: string[], startLine: number): { text: string; endLine: number; range: DataWindowRange } {
  const collected: string[] = [];
  let depth = 0;
  let endLine = startLine;
  let started = false;

  for (let line = startLine; line < lines.length; line++) {
    const text = lines[line] ?? '';
    collected.push(text);
    for (const char of text) {
      if (char === '(') {
        depth++;
        started = true;
      } else if (char === ')') {
        depth--;
      }
    }
    endLine = line;
    if (started && depth <= 0) {
      break;
    }
  }

  return {
    text: collected.join('\n'),
    endLine,
    range: createRange(startLine, 0, endLine, (lines[endLine] ?? '').length),
  };
}

function extractNamedBlockSegments(
  text: string,
  blockName: string,
): Array<{ text: string; startOffset: number }> {
  const segments: Array<{ text: string; startOffset: number }> = [];
  const marker = `${blockName}=(`.toLowerCase();
  const lower = text.toLowerCase();
  let searchIndex = 0;

  while (searchIndex < text.length) {
    const start = lower.indexOf(marker, searchIndex);
    if (start < 0) {
      break;
    }

    const openParen = start + blockName.length + 1;
    const body = extractBalancedParenthesesContent(text, openParen);
    if (!body) {
      break;
    }

    segments.push({ text: body, startOffset: openParen + 1 });
    searchIndex = openParen + body.length + 2;
  }

  return segments;
}

function extractBalancedParenthesesContent(text: string, openParen: number): string | null {
  if (text[openParen] !== '(') {
    return null;
  }

  let depth = 0;
  for (let index = openParen; index < text.length; index++) {
    const current = text[index];
    if (current === '(') {
      depth++;
      continue;
    }
    if (current === ')') {
      depth--;
      if (depth === 0) {
        return text.slice(openParen + 1, index);
      }
    }
  }

  return null;
}

function buildTableColumnDetail(text: string): string {
  const type = extractAttribute(text, 'type');
  const dbName = extractAttribute(text, 'dbname');
  const update = extractAttribute(text, 'update');
  const dddwName = extractAttribute(text, 'dddw.name');
  return [
    type ? `Tipo: \`${type}\`` : undefined,
    dbName ? `Mapeo remoto: \`${dbName}\`` : undefined,
    update ? `Update: \`${update}\`` : undefined,
    dddwName ? `DDDW: \`${dddwName}\`` : undefined,
  ].filter((value): value is string => !!value).join(' · ');
}

function truncateRetrieveStatement(statement: string): string {
  return statement.length > 120 ? `${statement.slice(0, 117)}...` : statement;
}

function blockOffsetRangeToDataWindowRange(text: string, baseLine: number, startOffset: number, endOffset: number): DataWindowRange {
  return {
    start: blockOffsetToPosition(text, baseLine, startOffset),
    end: blockOffsetToPosition(text, baseLine, endOffset),
  };
}

function blockOffsetToPosition(text: string, baseLine: number, offset: number): DataWindowPosition {
  let line = baseLine;
  let character = 0;
  for (let index = 0; index < offset; index++) {
    if (text[index] === '\n') {
      line++;
      character = 0;
    } else {
      character++;
    }
  }

  return { line, character };
}

function parseSimpleSelectColumnReferences(retrieve: DataWindowRetrieveNode): DataWindowSqlReference[] {
  const selectClause = findSelectClause(retrieve.statement);
  if (!selectClause) {
    return [];
  }

  const references: DataWindowSqlReference[] = [];
  const segments = splitTopLevelCommaSegments(selectClause.text, selectClause.startOffset);

  for (const segment of segments) {
    const reference = tryParseSimpleSelectColumnReference(segment.text, segment.startOffset);
    if (!reference) {
      continue;
    }

    references.push({
      rawText: reference.rawText,
      columnName: reference.columnName,
      qualifiedTableName: reference.qualifiedTableName,
      range: {
        start: offsetWithinStringToPosition(retrieve.statement, retrieve.selectionRange.start, reference.startOffset),
        end: offsetWithinStringToPosition(retrieve.statement, retrieve.selectionRange.start, reference.endOffset),
      },
    });
  }

  return references;
}

function findSelectClause(retrieveText: string): { text: string; startOffset: number } | undefined {
  const selectMatch = retrieveText.match(/^\s*select\b/i);
  if (!selectMatch) {
    return undefined;
  }

  const selectStart = selectMatch[0].length;
  let inQuote = false;
  let depth = 0;
  for (let index = selectStart; index < retrieveText.length; index++) {
    const current = retrieveText[index];
    const next = retrieveText.slice(index, index + 4).toLowerCase();
    if (current === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (inQuote) {
      continue;
    }
    if (current === '(') {
      depth++;
      continue;
    }
    if (current === ')') {
      if (depth > 0) {
        depth--;
      }
      continue;
    }
    if (depth === 0 && next === 'from' && isKeywordBoundary(retrieveText, index, 4)) {
      const raw = retrieveText.slice(selectStart, index);
      const trimmed = raw.trim();
      return trimmed.length > 0
        ? { text: trimmed, startOffset: selectStart + raw.search(/\S/) }
        : undefined;
    }
  }

  return undefined;
}

function splitTopLevelCommaSegments(
  text: string,
  baseOffset: number,
): Array<{ text: string; startOffset: number; endOffset: number }> {
  const segments: Array<{ text: string; startOffset: number; endOffset: number }> = [];
  let segmentStart = 0;
  let inQuote = false;
  let depth = 0;

  for (let index = 0; index < text.length; index++) {
    const current = text[index];
    if (current === '"') {
      inQuote = !inQuote;
      continue;
    }
    if (inQuote) {
      continue;
    }
    if (current === '(') {
      depth++;
      continue;
    }
    if (current === ')') {
      if (depth > 0) {
        depth--;
      }
      continue;
    }
    if (current !== ',' || depth !== 0) {
      continue;
    }
    pushSegment(segments, text, segmentStart, index, baseOffset);
    segmentStart = index + 1;
  }

  pushSegment(segments, text, segmentStart, text.length, baseOffset);
  return segments;
}

function pushSegment(
  segments: Array<{ text: string; startOffset: number; endOffset: number }>,
  text: string,
  start: number,
  end: number,
  baseOffset: number,
): void {
  const raw = text.slice(start, end);
  const first = raw.search(/\S/);
  if (first < 0) {
    return;
  }
  const last = findLastNonWhitespaceIndex(raw);
  segments.push({
    text: raw.slice(first, last + 1),
    startOffset: baseOffset + start + first,
    endOffset: baseOffset + start + last + 1,
  });
}

function tryParseSimpleSelectColumnReference(
  text: string,
  startOffset: number,
): { rawText: string; columnName: string; qualifiedTableName?: string; startOffset: number; endOffset: number } | undefined {
  const withoutDistinct = text.replace(/^distinct\s+/i, '').trim();
  if (!withoutDistinct || withoutDistinct === '*' || /\*$/.test(withoutDistinct)) {
    return undefined;
  }

  const aliasLess = withoutDistinct.replace(/\s+as\s+[a-z_][\w$#%]*$/i, '').trim();
  if (!/^(?:[a-z_][\w$#%]*\.)?[a-z_][\w$#%]*$/i.test(aliasLess)) {
    return undefined;
  }

  const tokenStart = text.toLowerCase().indexOf(aliasLess.toLowerCase());
  const parts = aliasLess.split('.');
  return {
    rawText: aliasLess,
    columnName: parts[parts.length - 1],
    qualifiedTableName: parts.length > 1 ? parts.slice(0, -1).join('.') : undefined,
    startOffset: startOffset + Math.max(tokenStart, 0),
    endOffset: startOffset + Math.max(tokenStart, 0) + aliasLess.length,
  };
}

function offsetWithinStringToPosition(text: string, base: DataWindowPosition, offset: number): DataWindowPosition {
  let line = base.line;
  let character = base.character;
  for (let index = 0; index < offset; index++) {
    if (text[index] === '\n') {
      line++;
      character = 0;
    } else {
      character++;
    }
  }

  return { line, character };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function findLastNonWhitespaceIndex(value: string): number {
  for (let index = value.length - 1; index >= 0; index--) {
    if (!/\s/.test(value[index])) {
      return index;
    }
  }
  return -1;
}

function isKeywordBoundary(text: string, start: number, length: number): boolean {
  const previous = start > 0 ? text[start - 1] : '';
  const next = start + length < text.length ? text[start + length] : '';
  return !/[a-z0-9_]/i.test(previous) && !/[a-z0-9_]/i.test(next);
}

export { BAND_NAMES };