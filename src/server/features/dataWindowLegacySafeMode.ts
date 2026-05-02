import { DocumentSymbol, Hover, Location, MarkupKind, Position, Range, SymbolKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

type DataWindowLegacyNodeKind = 'band' | 'table-column' | 'retrieve';

interface DataWindowLegacyNode {
  name: string;
  kind: DataWindowLegacyNodeKind;
  detail?: string;
  range: Range;
  selectionRange: Range;
}

interface DataWindowLegacySqlReference {
  rawText: string;
  columnName: string;
  qualifiedTableName?: string;
  range: Range;
}

export interface DataWindowLegacyModel {
  objectName: string;
  bands: DataWindowLegacyNode[];
  tableColumns: DataWindowLegacyNode[];
  retrieve?: DataWindowLegacyNode & { statement: string };
  sqlReferences: DataWindowLegacySqlReference[];
}

const BAND_NAMES = new Set(['header', 'summary', 'footer', 'detail']);

export function buildDataWindowLegacyModel(document: TextDocument): DataWindowLegacyModel | null {
  if (!document.uri.toLowerCase().endsWith('.srd')) {
    return null;
  }

  const lines = document.getText().split(/\r?\n/);
  const objectName = inferDataWindowObjectName(document.uri);
  if (!objectName) {
    return null;
  }

  const bands: DataWindowLegacyNode[] = [];
  const tableColumns: DataWindowLegacyNode[] = [];
  let retrieve: (DataWindowLegacyNode & { statement: string }) | undefined;

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
        range: Range.create(lineIndex, 0, lineIndex, lineText.length),
        selectionRange: Range.create(lineIndex, startCharacter, lineIndex, startCharacter + bandName.length),
      });
      continue;
    }

    if (/^table\(/i.test(trimmed)) {
      const block = extractParenthesizedBlock(lines, lineIndex);
      const tableText = block.text;
      const columnSegments = extractNamedBlockSegments(tableText, 'column');
      for (const segment of columnSegments) {
        const nameInfo = findUnquotedAttributeValueRange(segment.text, 'name');
        const type = extractAttribute(segment.text, 'type');
        if (!nameInfo?.value || !type) {
          continue;
        }

        tableColumns.push({
          name: nameInfo.value,
          kind: 'table-column',
          detail: buildTableColumnDetail(segment.text),
          range: block.range,
          selectionRange: blockOffsetRangeToDocumentRange(
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
          selectionRange: blockOffsetRangeToDocumentRange(tableText, lineIndex, retrieveInfo.startOffset, retrieveInfo.endOffset),
        };
      }

      lineIndex = block.endLine;
    }
  }

  return {
    objectName,
    bands,
    tableColumns,
    retrieve,
    sqlReferences: retrieve ? parseSimpleSelectColumnReferences(document, retrieve.selectionRange, retrieve.statement) : [],
  };
}

export function provideDataWindowLegacyDefinition(document: TextDocument, position: Position): Location | null {
  const model = buildDataWindowLegacyModel(document);
  if (!model) {
    return null;
  }

  const lineText = getLineText(document, position.line);
  const bandInfo = findUnquotedAttributeValueRange(lineText, 'band');
  if (bandInfo && rangeContains(toLineRange(position.line, bandInfo.startOffset, bandInfo.endOffset), position)) {
    const band = model.bands.find((entry) => entry.name.toLowerCase() === bandInfo.value.toLowerCase());
    if (band) {
      return Location.create(document.uri, band.selectionRange);
    }
  }

  const sqlReference = model.sqlReferences.find((reference) => rangeContains(reference.range, position));
  if (sqlReference) {
    const tableColumn = model.tableColumns.find((entry) => entry.name.toLowerCase() === sqlReference.columnName.toLowerCase());
    if (tableColumn) {
      return Location.create(document.uri, tableColumn.selectionRange);
    }
  }

  return null;
}

export function provideDataWindowLegacyHover(document: TextDocument, position: Position): Hover | null {
  const model = buildDataWindowLegacyModel(document);
  if (!model) {
    return null;
  }

  const lineText = getLineText(document, position.line);
  const bandDeclaration = model.bands.find((entry) => rangeContains(entry.selectionRange, position));
  if (bandDeclaration) {
    const height = extractAttribute(lineText, 'height');
    const color = extractAttribute(lineText, 'color');
    return markdownHover([
      `**${bandDeclaration.name}**`,
      'Banda DataWindow',
      height ? `Altura: \`${height}\`` : undefined,
      color ? `Color: \`${color}\`` : undefined,
      `Objeto: \`${model.objectName}\``,
    ], bandDeclaration.selectionRange);
  }

  const bandInfo = findUnquotedAttributeValueRange(lineText, 'band');
  if (bandInfo && BAND_NAMES.has(bandInfo.value.toLowerCase()) && rangeContains(toLineRange(position.line, bandInfo.startOffset, bandInfo.endOffset), position)) {
    return markdownHover([
      `**${bandInfo.value.toLowerCase()}**`,
      'Banda DataWindow',
      `Objeto: \`${model.objectName}\``,
    ], toLineRange(position.line, bandInfo.startOffset, bandInfo.endOffset));
  }

  const tableColumn = model.tableColumns.find((entry) => rangeContains(entry.selectionRange, position));
  if (tableColumn) {
    return markdownHover([
      `**${tableColumn.name}**`,
      'Columna de tabla DataWindow',
      tableColumn.detail,
      `Objeto: \`${model.objectName}\``,
    ], tableColumn.selectionRange);
  }

  if (model.retrieve && rangeContains(model.retrieve.selectionRange, position)) {
    return markdownHover([
      '**retrieve**',
      'SQL segura de DataWindow',
      '```sql',
      model.retrieve.statement,
      '```',
      model.tableColumns.length > 0 ? `Columnas de tabla: ${model.tableColumns.map((entry) => `\`${entry.name}\``).join(', ')}` : undefined,
      `Objeto: \`${model.objectName}\``,
    ], model.retrieve.selectionRange);
  }

  const sqlReference = model.sqlReferences.find((reference) => rangeContains(reference.range, position));
  if (sqlReference) {
    const tableColumnNode = model.tableColumns.find((entry) => entry.name.toLowerCase() === sqlReference.columnName.toLowerCase());
    return markdownHover([
      `**${sqlReference.columnName}**`,
      'Columna SQL del retrieve DataWindow',
      `Expresión SQL: \`${sqlReference.rawText}\``,
      tableColumnNode?.detail,
      `Objeto: \`${model.objectName}\``,
    ], sqlReference.range);
  }

  return null;
}

export function buildDataWindowLegacyDocumentSymbols(document: TextDocument): DocumentSymbol[] {
  const model = buildDataWindowLegacyModel(document);
  if (!model) {
    return [];
  }

  const lines = document.getText().split(/\r?\n/);
  const root = DocumentSymbol.create(
    model.objectName,
    'DataWindow',
    SymbolKind.Class,
    Range.create(0, 0, Math.max(0, lines.length - 1), lines[lines.length - 1]?.length ?? 0),
    Range.create(0, 0, 0, model.objectName.length)
  );

  root.children = model.bands.map((band) =>
    DocumentSymbol.create(band.name, band.detail ?? '', SymbolKind.Namespace, band.range, band.selectionRange)
  );

  if (model.tableColumns.length > 0 || model.retrieve) {
    const tableStart = model.tableColumns[0]?.range.start ?? model.retrieve?.range.start ?? Position.create(0, 0);
    const tableEnd = model.retrieve?.range.end ?? model.tableColumns[model.tableColumns.length - 1]?.range.end ?? tableStart;
    const table = DocumentSymbol.create('table', 'tabla DataWindow', SymbolKind.Object, Range.create(tableStart, tableEnd), Range.create(tableStart, tableStart));
    table.children = model.tableColumns.map((column) =>
      DocumentSymbol.create(column.name, column.detail ?? '', SymbolKind.Field, column.range, column.selectionRange)
    );
    if (model.retrieve) {
      table.children.push(
        DocumentSymbol.create('retrieve', model.retrieve.detail ?? '', SymbolKind.String, model.retrieve.range, model.retrieve.selectionRange)
      );
    }
    root.children.push(table);
  }

  return [root];
}

function inferDataWindowObjectName(uri: string): string | undefined {
  const normalized = uri.replace(/\\/g, '/');
  const basename = normalized.slice(normalized.lastIndexOf('/') + 1);
  return basename.toLowerCase().endsWith('.srd') ? basename.slice(0, -4) : undefined;
}

function getLineText(document: TextDocument, line: number): string {
  const lines = document.getText().split(/\r?\n/);
  return lines[line] ?? '';
}

function extractParenthesizedBlock(lines: string[], startLine: number): { text: string; endLine: number; range: Range } {
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
    range: Range.create(startLine, 0, endLine, (lines[endLine] ?? '').length),
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

function extractAttribute(text: string, attributeName: string): string | undefined {
  return findQuotedAttributeValueRange(text, attributeName)?.value
    ?? findUnquotedAttributeValueRange(text, attributeName)?.value;
}

function findQuotedAttributeValueRange(
  text: string,
  attributeName: string,
): { value: string; startOffset: number; endOffset: number } | undefined {
  const matcher = new RegExp(`${attributeName}="([^"]*)"`, 'i');
  const match = matcher.exec(text);
  if (!match || match.index == null) {
    return undefined;
  }

  const value = match[1] ?? '';
  const startOffset = match.index + attributeName.length + 2;
  return { value, startOffset, endOffset: startOffset + value.length };
}

function findUnquotedAttributeValueRange(
  text: string,
  attributeName: string,
): { value: string; startOffset: number; endOffset: number } | undefined {
  const matcher = new RegExp(`${attributeName}=([^\\s)]+)`, 'i');
  const match = matcher.exec(text);
  if (!match || match.index == null) {
    return undefined;
  }

  const value = match[1] ?? '';
  const startOffset = match.index + attributeName.length + 1;
  return { value, startOffset, endOffset: startOffset + value.length };
}

function buildTableColumnDetail(text: string): string {
  const type = extractAttribute(text, 'type');
  const dbName = extractAttribute(text, 'dbname');
  const update = extractAttribute(text, 'update');
  return [
    type ? `Tipo: \`${type}\`` : undefined,
    dbName ? `Mapeo remoto: \`${dbName}\`` : undefined,
    update ? `Update: \`${update}\`` : undefined,
  ].filter((value): value is string => !!value).join(' · ');
}

function truncateRetrieveStatement(statement: string): string {
  return statement.length > 120 ? `${statement.slice(0, 117)}...` : statement;
}

function blockOffsetRangeToDocumentRange(text: string, baseLine: number, startOffset: number, endOffset: number): Range {
  return Range.create(
    blockOffsetToPosition(text, baseLine, startOffset),
    blockOffsetToPosition(text, baseLine, endOffset),
  );
}

function blockOffsetToPosition(text: string, baseLine: number, offset: number): Position {
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

  return Position.create(line, character);
}

function parseSimpleSelectColumnReferences(
  document: TextDocument,
  retrieveRange: Range,
  retrieveText: string,
): DataWindowLegacySqlReference[] {
  const selectClause = findSelectClause(retrieveText);
  if (!selectClause) {
    return [];
  }

  const baseOffset = document.offsetAt(retrieveRange.start);
  const references: DataWindowLegacySqlReference[] = [];
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
      range: Range.create(document.positionAt(baseOffset + reference.startOffset), document.positionAt(baseOffset + reference.endOffset)),
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

function toLineRange(line: number, startCharacter: number, endCharacter: number): Range {
  return Range.create(line, startCharacter, line, endCharacter);
}

function rangeContains(range: Range, position: Position): boolean {
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

function markdownHover(lines: Array<string | undefined>, range: Range): Hover {
  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: lines.filter((entry): entry is string => !!entry).join('\n\n'),
    },
    range,
  };
}