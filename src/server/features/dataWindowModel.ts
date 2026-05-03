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

export interface DataWindowRetrieveArgument {
  name: string;
  type: string;
  label: string;
}

export interface DataWindowReportNode extends DataWindowBaseNode {
  kind: 'report';
  dataObject?: string;
  dataObjectRange?: DataWindowRange;
}

export interface DataWindowControlNode extends DataWindowBaseNode {
  kind: 'control';
  controlType: string;
  band?: string;
  id?: string;
}

export type DataWindowExpressionDependencyKind = 'table-column' | 'control' | 'unresolved';

export interface DataWindowExpressionDependency {
  name: string;
  kind: DataWindowExpressionDependencyKind;
}

export interface DataWindowExpressionNode extends DataWindowBaseNode {
  kind: 'expression';
  ownerName?: string;
  controlType: string;
  propertyName: string;
  rawValue: string;
  expressionText: string;
  staticValue?: string;
  dependencies: DataWindowExpressionDependency[];
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
  controls: DataWindowControlNode[];
  expressions: DataWindowExpressionNode[];
  retrieve?: DataWindowRetrieveNode;
  retrieveArguments: DataWindowRetrieveArgument[];
  sqlReferences: DataWindowSqlReference[];
}

const BAND_NAMES = new Set(['header', 'summary', 'footer', 'detail']);

const DATAWINDOW_EXPRESSION_STOP_WORDS = new Set([
  'all',
  'and',
  'asc',
  'desc',
  'false',
  'for',
  'group',
  'not',
  'null',
  'or',
  'true',
]);

interface DataWindowExpressionCandidate {
  ownerName?: string;
  controlType: string;
  propertyName: string;
  rawValue: string;
  expressionText: string;
  staticValue?: string;
  range: DataWindowRange;
  selectionRange: DataWindowRange;
}

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
  const controls: DataWindowControlNode[] = [];
  const expressionCandidates: DataWindowExpressionCandidate[] = [];
  let retrieve: DataWindowRetrieveNode | undefined;
  let retrieveArguments: DataWindowRetrieveArgument[] = [];

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

      retrieveArguments = extractRetrieveArguments(tableText);

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
      continue;
    }

    const controlMatch = trimmed.match(/^([a-z][\w.]*)\(/i);
    if (controlMatch) {
      const controlType = controlMatch[1].toLowerCase();
      if (!BAND_NAMES.has(controlType) && controlType !== 'datawindow' && controlType !== 'table' && controlType !== 'report') {
        const block = extractParenthesizedBlock(lines, lineIndex);
        const control = buildDataWindowControlNode(block.text, lineIndex, block.range, controlType);
        if (control) {
          controls.push(control);
        }

        expressionCandidates.push(...extractDataWindowExpressionCandidates(block.text, lineIndex, controlType));
        lineIndex = block.endLine;
        continue;
      }
    }
  }

  const tableColumnNames = new Set(tableColumns.map((column) => column.name.toLowerCase()));
  const controlNames = new Set(controls.map((control) => control.name.toLowerCase()));
  const expressions = expressionCandidates.map((candidate) => buildDataWindowExpressionNode(candidate, tableColumnNames, controlNames));

  return {
    objectName,
    rootRange: createRange(0, 0, Math.max(0, lines.length - 1), lines[lines.length - 1]?.length ?? 0),
    rootSelectionRange: createRange(0, 0, 0, (lines[0] ?? '').length),
    bands,
    tableColumns,
    reports,
    controls,
    expressions,
    retrieve,
    retrieveArguments,
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

function findAttributeValueRange(
  text: string,
  attributeName: string,
): { value: string; startOffset: number; endOffset: number } | undefined {
  return findQuotedAttributeValueRange(text, attributeName)
    ?? findUnquotedAttributeValueRange(text, attributeName);
}

export function findQuotedAttributeValueRange(
  text: string,
  attributeName: string,
): { value: string; startOffset: number; endOffset: number } | undefined {
  const matcher = new RegExp(`${escapeRegex(attributeName)}\\s*=\\s*"`, 'i');
  const match = matcher.exec(text);
  if (!match || match.index == null) {
    return undefined;
  }

  const startOffset = match.index + match[0].length;
  let endOffset = startOffset;
  while (endOffset < text.length) {
    if (text[endOffset] === '"' && text[endOffset - 1] !== '~') {
      break;
    }
    endOffset++;
  }

  if (endOffset >= text.length) {
    return undefined;
  }

  const value = unescapeDataWindowQuotedValue(text.slice(startOffset, endOffset));
  return { value, startOffset, endOffset };
}

export function findUnquotedAttributeValueRange(
  text: string,
  attributeName: string,
): { value: string; startOffset: number; endOffset: number } | undefined {
  const matcher = new RegExp(`${escapeRegex(attributeName)}\\s*=\\s*`, 'i');
  const match = matcher.exec(text);
  if (!match || match.index == null) {
    return undefined;
  }

  const startOffset = match.index + match[0].length;
  let endOffset = startOffset;
  let depth = 0;

  while (endOffset < text.length) {
    const current = text[endOffset];
    if (current === '(') {
      depth++;
      endOffset++;
      continue;
    }
    if (current === ')') {
      if (depth === 0) {
        break;
      }
      depth--;
      endOffset++;
      continue;
    }
    if (/\s/.test(current) && depth === 0) {
      break;
    }
    endOffset++;
  }

  const value = text.slice(startOffset, endOffset).trim();
  return value ? { value, startOffset, endOffset } : undefined;
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

function buildDataWindowControlNode(
  text: string,
  baseLine: number,
  blockRange: DataWindowRange,
  controlType: string,
): DataWindowControlNode | null {
  const nameInfo = findAttributeValueRange(text, 'name');
  if (!nameInfo?.value) {
    return null;
  }

  const band = extractAttribute(text, 'band');
  const id = extractAttribute(text, 'id');

  return {
    name: nameInfo.value,
    kind: 'control',
    controlType,
    band,
    id,
    detail: buildControlDetail(controlType, band, id),
    range: blockRange,
    selectionRange: blockOffsetRangeToDataWindowRange(text, baseLine, nameInfo.startOffset, nameInfo.endOffset),
  };
}

function buildControlDetail(controlType: string, band?: string, id?: string): string {
  return [
    `Control ${controlType}`,
    band ? `Band: \`${band}\`` : undefined,
    id ? `Id: \`${id}\`` : undefined,
  ].filter((value): value is string => !!value).join(' · ');
}

function extractDataWindowExpressionCandidates(
  text: string,
  baseLine: number,
  controlType: string,
): DataWindowExpressionCandidate[] {
  const candidates: DataWindowExpressionCandidate[] = [];
  const ownerName = extractAttribute(text, 'name');

  for (const attribute of extractQuotedAttributeAssignments(text)) {
    const metadata = classifyDataWindowExpressionAttribute(attribute.name, attribute.value);
    if (!metadata) {
      continue;
    }

    candidates.push({
      ownerName,
      controlType,
      propertyName: attribute.name.toLowerCase(),
      rawValue: attribute.value,
      expressionText: metadata.expressionText,
      ...(metadata.staticValue ? { staticValue: metadata.staticValue } : {}),
      range: blockOffsetRangeToDataWindowRange(text, baseLine, attribute.valueStartOffset, attribute.valueEndOffset),
      selectionRange: blockOffsetRangeToDataWindowRange(
        text,
        baseLine,
        attribute.valueStartOffset + metadata.expressionStartOffset,
        attribute.valueStartOffset + metadata.expressionEndOffset,
      ),
    });
  }

  return candidates;
}

function classifyDataWindowExpressionAttribute(
  attributeName: string,
  value: string,
): { expressionText: string; staticValue?: string; expressionStartOffset: number; expressionEndOffset: number } | undefined {
  const trimmedAttribute = attributeName.toLowerCase();
  if (trimmedAttribute === 'expression') {
    const expressionText = value.trim();
    if (!expressionText) {
      return undefined;
    }

    const trimStart = value.indexOf(expressionText);
    return {
      expressionText,
      expressionStartOffset: trimStart >= 0 ? trimStart : 0,
      expressionEndOffset: trimStart >= 0 ? trimStart + expressionText.length : value.length,
    };
  }

  const markerOffset = value.indexOf('~t');
  if (markerOffset < 0) {
    return undefined;
  }

  const expressionText = value.slice(markerOffset + 2).trim();
  if (!expressionText || !looksLikeDataWindowExpression(expressionText)) {
    return undefined;
  }

  const expressionStartOffset = value.indexOf(expressionText, markerOffset + 2);
  const staticValue = value.slice(0, markerOffset).trim();
  return {
    expressionText,
    ...(staticValue ? { staticValue } : {}),
    expressionStartOffset: expressionStartOffset >= 0 ? expressionStartOffset : markerOffset + 2,
    expressionEndOffset: (expressionStartOffset >= 0 ? expressionStartOffset : markerOffset + 2) + expressionText.length,
  };
}

function looksLikeDataWindowExpression(value: string): boolean {
  return /[A-Za-z_][\w$#%]*|[()=<>+\-*/]/.test(value);
}

function extractQuotedAttributeAssignments(
  text: string,
): Array<{ name: string; value: string; valueStartOffset: number; valueEndOffset: number }> {
  const assignments: Array<{ name: string; value: string; valueStartOffset: number; valueEndOffset: number }> = [];
  const matcher = /([A-Za-z_][\w.]*)\s*=\s*"/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(text)) !== null) {
    const name = match[1];
    const valueStartOffset = match.index + match[0].length;
    let valueEndOffset = valueStartOffset;

    while (valueEndOffset < text.length) {
      if (text[valueEndOffset] === '"' && text[valueEndOffset - 1] !== '~') {
        break;
      }
      valueEndOffset++;
    }

    if (valueEndOffset >= text.length) {
      break;
    }

    assignments.push({
      name,
      value: unescapeDataWindowQuotedValue(text.slice(valueStartOffset, valueEndOffset)),
      valueStartOffset,
      valueEndOffset,
    });
    matcher.lastIndex = valueEndOffset + 1;
  }

  return assignments;
}

function buildDataWindowExpressionNode(
  candidate: DataWindowExpressionCandidate,
  tableColumnNames: ReadonlySet<string>,
  controlNames: ReadonlySet<string>,
): DataWindowExpressionNode {
  const dependencies = extractDataWindowExpressionDependencies(candidate.expressionText, tableColumnNames, controlNames);
  return {
    name: buildDataWindowExpressionName(candidate),
    kind: 'expression',
    ownerName: candidate.ownerName,
    controlType: candidate.controlType,
    propertyName: candidate.propertyName,
    rawValue: candidate.rawValue,
    expressionText: candidate.expressionText,
    ...(candidate.staticValue ? { staticValue: candidate.staticValue } : {}),
    dependencies,
    detail: buildDataWindowExpressionDetail(candidate, dependencies),
    range: candidate.range,
    selectionRange: candidate.selectionRange,
  };
}

function buildDataWindowExpressionName(candidate: DataWindowExpressionCandidate): string {
  return `${candidate.ownerName ?? candidate.controlType}.${candidate.propertyName}`;
}

function buildDataWindowExpressionDetail(
  candidate: DataWindowExpressionCandidate,
  dependencies: readonly DataWindowExpressionDependency[],
): string {
  const ownerLabel = candidate.ownerName ? `${candidate.controlType} \`${candidate.ownerName}\`` : `control ${candidate.controlType}`;
  const parts = [`Expresión ${candidate.propertyName} en ${ownerLabel}`];
  if (dependencies.length > 0) {
    parts.push(`Deps: ${dependencies.map((dependency) => `\`${dependency.name}\``).join(', ')}`);
  }
  return parts.join(' · ');
}

function extractDataWindowExpressionDependencies(
  expressionText: string,
  tableColumnNames: ReadonlySet<string>,
  controlNames: ReadonlySet<string>,
): DataWindowExpressionDependency[] {
  const masked = maskDataWindowExpressionText(expressionText);
  const dependencies: DataWindowExpressionDependency[] = [];
  const seen = new Set<string>();
  const matcher = /\b[A-Za-z_][\w$#%]*(?:\.[A-Za-z_][\w$#%]*)*\b/g;
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(masked)) !== null) {
    const rawToken = match[0];
    const previous = match.index > 0 ? masked[match.index - 1] : '';
    if (previous === '.' || previous === ':') {
      continue;
    }

    const nextNonWhitespace = findNextNonWhitespaceCharacter(masked, match.index + rawToken.length);
    if (nextNonWhitespace === '(') {
      continue;
    }

    const dependencyName = rawToken.includes('.')
      ? rawToken.slice(rawToken.lastIndexOf('.') + 1)
      : rawToken;
    const normalized = dependencyName.toLowerCase();
    if (!normalized || DATAWINDOW_EXPRESSION_STOP_WORDS.has(normalized) || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    let kind: DataWindowExpressionDependencyKind = 'unresolved';
    if (tableColumnNames.has(normalized)) {
      kind = 'table-column';
    } else if (controlNames.has(normalized)) {
      kind = 'control';
    }

    dependencies.push({
      name: dependencyName,
      kind,
    });
  }

  return dependencies;
}

function maskDataWindowExpressionText(expressionText: string): string {
  const withoutBlockComments = expressionText.replace(/\/\*[\s\S]*?\*\//g, (segment) => ' '.repeat(segment.length));
  return maskQuotedSqlLiterals(withoutBlockComments);
}

function findNextNonWhitespaceCharacter(text: string, startOffset: number): string | undefined {
  for (let index = startOffset; index < text.length; index++) {
    if (!/\s/.test(text[index])) {
      return text[index];
    }
  }

  return undefined;
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

function extractRetrieveArguments(text: string): DataWindowRetrieveArgument[] {
  const normalizedText = text.replace(/~"/g, '"');
  const byArgumentsClause = extractArgumentsClause(normalizedText);
  if (byArgumentsClause.length > 0) {
    return byArgumentsClause;
  }

  return extractArgEntries(normalizedText);
}

function extractArgumentsClause(text: string): DataWindowRetrieveArgument[] {
  const match = /\barguments\s*=\s*\(/i.exec(text);
  if (!match) {
    return [];
  }

  const openParen = text.indexOf('(', match.index);
  if (openParen < 0) {
    return [];
  }

  const clause = extractBalancedParenthesesContent(text, openParen);
  return clause ? parseArgumentsClause(clause) : [];
}

function parseArgumentsClause(clause: string): DataWindowRetrieveArgument[] {
  const args: DataWindowRetrieveArgument[] = [];
  const pattern = /\(\s*"([^"]+)"\s*,\s*([A-Za-z_][\w$#%]*)\s*\)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(clause)) !== null) {
    const name = match[1].trim();
    const type = match[2].trim();
    if (!name || !type) {
      continue;
    }

    args.push({
      name,
      type,
      label: `${type} ${name}`,
    });
  }

  return args;
}

function extractArgEntries(text: string): DataWindowRetrieveArgument[] {
  const args: DataWindowRetrieveArgument[] = [];
  const seen = new Set<string>();
  const pattern = /ARG\s*\(([^)]*)\)/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    const body = match[1];
    const nameMatch = /NAME\s*=\s*"([^"]+)"/i.exec(body);
    const typeMatch = /TYPE\s*=\s*([A-Za-z_][\w$#%]*)/i.exec(body);
    const name = nameMatch?.[1]?.trim();
    const type = typeMatch?.[1]?.trim();
    if (!name || !type) {
      continue;
    }

    const key = `${name.toLowerCase()}:${type.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    args.push({
      name,
      type,
      label: `${type} ${name}`,
    });
  }

  return args;
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
  const aliasContext = buildTableAliasContext(retrieve.statement);
  const defaultTableName = aliasContext.sourceTables.length === 1
    ? aliasContext.sourceTables[0]
    : undefined;
  const parsedReferences: Array<{
    rawText: string;
    columnName: string;
    qualifiedTableName?: string;
    startOffset: number;
    endOffset: number;
  }> = [];

  const selectClause = findSelectClause(retrieve.statement);
  if (selectClause) {
    const segments = splitTopLevelCommaSegments(selectClause.text, selectClause.startOffset);

    for (const segment of segments) {
      const reference = tryParseSimpleSqlReferenceToken(
        segment.text,
        segment.startOffset,
        aliasContext.aliases,
        defaultTableName,
      );
      if (!reference) {
        continue;
      }

      parsedReferences.push(reference);
    }
  }

  for (const clause of findJoinConditionClauses(retrieve.statement)) {
    parsedReferences.push(...parseConditionClauseReferences(
      clause.text,
      clause.startOffset,
      aliasContext.aliases,
      defaultTableName,
    ));
  }

  const whereClause = findClauseAfterKeyword(retrieve.statement, 'where', ['group', 'order', 'having', 'union']);
  if (whereClause) {
    parsedReferences.push(...parseConditionClauseReferences(
      whereClause.text,
      whereClause.startOffset,
      aliasContext.aliases,
      defaultTableName,
    ));
  }

  return parsedReferences.map((reference) => ({
    rawText: reference.rawText,
    columnName: reference.columnName,
    ...(reference.qualifiedTableName ? { qualifiedTableName: reference.qualifiedTableName } : {}),
    range: {
      start: offsetWithinStringToPosition(retrieve.statement, retrieve.selectionRange.start, reference.startOffset),
      end: offsetWithinStringToPosition(retrieve.statement, retrieve.selectionRange.start, reference.endOffset),
    },
  }));
}

function findSelectClause(retrieveText: string): { text: string; startOffset: number; endOffset: number } | undefined {
  const selectMatch = retrieveText.match(/^\s*select\b/i);
  if (!selectMatch) {
    return undefined;
  }

  const selectStart = selectMatch[0].length;
  const fromOffset = findTopLevelKeyword(retrieveText, selectStart, 'from');
  if (fromOffset < 0) {
    return undefined;
  }

  const raw = retrieveText.slice(selectStart, fromOffset);
  const first = raw.search(/\S/);
  if (first < 0) {
    return undefined;
  }
  const last = findLastNonWhitespaceIndex(raw);
  return {
    text: raw.slice(first, last + 1),
    startOffset: selectStart + first,
    endOffset: selectStart + last + 1,
  };
}

function findClauseAfterKeyword(
  text: string,
  keyword: string,
  stopKeywords: readonly string[],
  startSearch = 0,
): { text: string; startOffset: number; endOffset: number } | undefined {
  const keywordOffset = findTopLevelKeyword(text, startSearch, keyword);
  if (keywordOffset < 0) {
    return undefined;
  }

  let startOffset = keywordOffset + keyword.length;
  while (startOffset < text.length && /\s/.test(text[startOffset])) {
    startOffset++;
  }

  let endOffset = text.length;
  for (const stopKeyword of stopKeywords) {
    const stopOffset = findTopLevelKeyword(text, startOffset, stopKeyword);
    if (stopOffset >= 0 && stopOffset < endOffset) {
      endOffset = stopOffset;
    }
  }

  const raw = text.slice(startOffset, endOffset);
  const first = raw.search(/\S/);
  if (first < 0) {
    return undefined;
  }
  const last = findLastNonWhitespaceIndex(raw);
  return {
    text: raw.slice(first, last + 1),
    startOffset: startOffset + first,
    endOffset: startOffset + last + 1,
  };
}

function findJoinConditionClauses(text: string): Array<{ text: string; startOffset: number; endOffset: number }> {
  const clauses: Array<{ text: string; startOffset: number; endOffset: number }> = [];
  let startSearch = 0;

  while (startSearch < text.length) {
    const clause = findClauseAfterKeyword(text, 'on', ['join', 'where', 'group', 'order', 'having', 'union'], startSearch);
    if (!clause) {
      break;
    }

    clauses.push(clause);
    startSearch = clause.endOffset;
  }

  return clauses;
}

function buildTableAliasContext(statement: string): { aliases: Map<string, string>; sourceTables: string[] } {
  const aliases = new Map<string, string>();
  const sourceTables: string[] = [];
  const maskedStatement = maskQuotedSqlLiterals(statement);
  const pattern = /\b(?:from|join)\s+([A-Za-z_][\w$#%]*(?:\.[A-Za-z_][\w$#%]*)*)(?:\s+(?:as\s+)?([A-Za-z_][\w$#%]*))?/gi;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(maskedStatement)) !== null) {
    const tableName = match[1];
    let alias: string | undefined = match[2]?.trim();
    if (alias && SQL_ALIAS_STOP_WORDS.has(alias.toLowerCase())) {
      alias = undefined;
    }

    sourceTables.push(tableName);
    aliases.set(tableName.toLowerCase(), tableName);
    if (alias) {
      aliases.set(alias.toLowerCase(), tableName);
    }
  }

  return {
    aliases,
    sourceTables: [...new Set(sourceTables)],
  };
}

function parseConditionClauseReferences(
  text: string,
  baseOffset: number,
  aliases: ReadonlyMap<string, string>,
  defaultTableName: string | undefined,
): Array<{
  rawText: string;
  columnName: string;
  qualifiedTableName?: string;
  startOffset: number;
  endOffset: number;
}> {
  const maskedText = maskQuotedSqlLiterals(text);
  if (isComplexSqlConditionClause(maskedText)) {
    return [];
  }
  const references: Array<{
    rawText: string;
    columnName: string;
    qualifiedTableName?: string;
    startOffset: number;
    endOffset: number;
  }> = [];
  const pattern = /\b[A-Za-z_][\w$#%]*(?:\.[A-Za-z_][\w$#%]*)*\b/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(maskedText)) !== null) {
    const token = match[0];
    const tokenStart = match.index;
    if (shouldIgnoreSqlConditionToken(maskedText, token, tokenStart)) {
      continue;
    }

    const reference = tryParseSimpleSqlReferenceToken(
      token,
      baseOffset + tokenStart,
      aliases,
      defaultTableName,
    );
    if (!reference) {
      continue;
    }

    references.push(reference);
  }

  return references;
}

function isComplexSqlConditionClause(text: string): boolean {
  return /\b(select|exists|case|union)\b/i.test(text);
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

function tryParseSimpleSqlReferenceToken(
  text: string,
  startOffset: number,
  aliases: ReadonlyMap<string, string>,
  defaultTableName: string | undefined,
): { rawText: string; columnName: string; qualifiedTableName?: string; startOffset: number; endOffset: number } | undefined {
  const withoutDistinct = text.replace(/^distinct\s+/i, '').trim();
  if (!withoutDistinct || withoutDistinct === '*' || /\*$/.test(withoutDistinct)) {
    return undefined;
  }

  const aliasLess = stripSqlSelectAlias(withoutDistinct);
  if (!/^[a-z_][\w$#%]*(?:\.[a-z_][\w$#%]*)*$/i.test(aliasLess)) {
    return undefined;
  }

  const tokenStart = text.toLowerCase().indexOf(aliasLess.toLowerCase());
  const parts = aliasLess.split('.');
  const qualifier = parts.length > 1
    ? resolveQualifiedTableName(parts.slice(0, -1).join('.'), aliases)
    : defaultTableName;
  return {
    rawText: aliasLess,
    columnName: parts[parts.length - 1],
    ...(qualifier ? { qualifiedTableName: qualifier } : {}),
    startOffset: startOffset + Math.max(tokenStart, 0),
    endOffset: startOffset + Math.max(tokenStart, 0) + aliasLess.length,
  };
}

function stripSqlSelectAlias(text: string): string {
  const asLess = text.replace(/\s+as\s+[a-z_][\w$#%]*$/i, '').trim();
  const bareAliasMatch = /^(.*?)(?:\s+)([a-z_][\w$#%]*)$/i.exec(asLess);
  if (!bareAliasMatch) {
    return asLess;
  }

  const candidate = bareAliasMatch[1].trim();
  return /^[a-z_][\w$#%]*(?:\.[a-z_][\w$#%]*)*$/i.test(candidate)
    ? candidate
    : asLess;
}

function resolveQualifiedTableName(qualifier: string, aliases: ReadonlyMap<string, string>): string {
  const parts = qualifier.split('.');
  const resolved = aliases.get(parts[0].toLowerCase());
  if (!resolved) {
    return qualifier;
  }

  return [resolved, ...parts.slice(1)].join('.');
}

function shouldIgnoreSqlConditionToken(text: string, token: string, tokenStart: number): boolean {
  if (SQL_REFERENCE_IGNORED_TOKENS.has(token.toLowerCase())) {
    return true;
  }

  const previous = tokenStart > 0 ? text[tokenStart - 1] : '';
  if (previous === ':' || previous === '@') {
    return true;
  }

  if (!token.includes('.')) {
    const nextNonWhitespace = findNextNonWhitespace(text, tokenStart + token.length);
    if (nextNonWhitespace === '(') {
      return true;
    }
  }

  return false;
}

function findNextNonWhitespace(text: string, startOffset: number): string {
  for (let index = startOffset; index < text.length; index++) {
    if (!/\s/.test(text[index])) {
      return text[index];
    }
  }

  return '';
}

function maskQuotedSqlLiterals(text: string): string {
  let quote: '"' | '\'' | null = null;
  let masked = '';

  for (let index = 0; index < text.length; index++) {
    const current = text[index];
    if (!quote && (current === '"' || current === '\'')) {
      quote = current;
      masked += ' ';
      continue;
    }

    if (quote) {
      masked += ' ';
      if (current === quote) {
        quote = null;
      }
      continue;
    }

    masked += current;
  }

  return masked;
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

function unescapeDataWindowQuotedValue(value: string): string {
  return value.replace(/~"/g, '"');
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

function findTopLevelKeyword(text: string, startOffset: number, keyword: string): number {
  let quote: '"' | '\'' | null = null;
  let depth = 0;

  for (let index = startOffset; index < text.length; index++) {
    const current = text[index];
    if (!quote && (current === '"' || current === '\'')) {
      quote = current;
      continue;
    }
    if (quote) {
      if (current === quote) {
        quote = null;
      }
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

    if (
      depth === 0
      && text.slice(index, index + keyword.length).toLowerCase() === keyword
      && isKeywordBoundary(text, index, keyword.length)
    ) {
      return index;
    }
  }

  return -1;
}

const SQL_ALIAS_STOP_WORDS = new Set([
  'where',
  'group',
  'order',
  'having',
  'union',
  'join',
  'on',
  'inner',
  'left',
  'right',
  'full',
  'outer',
  'cross',
]);

const SQL_REFERENCE_IGNORED_TOKENS = new Set([
  'select',
  'distinct',
  'from',
  'join',
  'on',
  'where',
  'group',
  'order',
  'by',
  'having',
  'union',
  'all',
  'and',
  'or',
  'not',
  'is',
  'null',
  'in',
  'like',
  'between',
  'exists',
  'as',
  'inner',
  'left',
  'right',
  'full',
  'outer',
  'cross',
  'case',
  'when',
  'then',
  'else',
  'end',
  'asc',
  'desc',
  'true',
  'false',
]);

export { BAND_NAMES };