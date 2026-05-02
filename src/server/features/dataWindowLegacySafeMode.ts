import { DocumentSymbol, Hover, Location, MarkupKind, Position, Range, SymbolKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { resolveDataWindowDefinitionTargets } from './dataWindowBindingModel';
import {
  BAND_NAMES,
  buildDataWindowModel,
  extractAttribute,
  findUnquotedAttributeValueRange,
  rangeContains,
  rangeEndAfter,
  type DataWindowModel,
  type DataWindowRange,
} from './dataWindowModel';

export type { DataWindowModel as DataWindowLegacyModel } from './dataWindowModel';

export function buildDataWindowLegacyModel(document: TextDocument): DataWindowModel | null {
  return buildDataWindowModel(document);
}

export function provideDataWindowLegacyDefinition(document: TextDocument, position: Position, kb?: KnowledgeBase): Location | null {
  const model = buildDataWindowLegacyModel(document);
  if (!model) {
    return null;
  }

  const lineText = getLineText(document, position.line);
  const bandInfo = findUnquotedAttributeValueRange(lineText, 'band');
  if (bandInfo && rangeContains(toLegacyRange(position.line, bandInfo.startOffset, bandInfo.endOffset), position)) {
    const band = model.bands.find((entry) => entry.name.toLowerCase() === bandInfo.value.toLowerCase());
    if (band) {
      return Location.create(document.uri, toRange(band.selectionRange));
    }
  }

  if (kb) {
    const linkedReport = model.reports.find((entry) =>
      rangeContains(entry.selectionRange, position)
      || (entry.dataObjectRange ? rangeContains(entry.dataObjectRange, position) : false)
    );
    if (linkedReport?.dataObject) {
      const target = resolveSingleDataWindowLink(linkedReport.dataObject, kb);
      if (target) {
        return Location.create(target.uri, toRange(target.range));
      }
    }

    const linkedDropdown = model.tableColumns.find((entry) => entry.dddwRange && rangeContains(entry.dddwRange, position));
    if (linkedDropdown?.dddwName) {
      const target = resolveSingleDataWindowLink(linkedDropdown.dddwName, kb);
      if (target) {
        return Location.create(target.uri, toRange(target.range));
      }
    }
  }

  const sqlReference = model.sqlReferences.find((reference) => rangeContains(reference.range, position));
  if (sqlReference) {
    const tableColumn = model.tableColumns.find((entry) => entry.name.toLowerCase() === sqlReference.columnName.toLowerCase());
    if (tableColumn) {
      return Location.create(document.uri, toRange(tableColumn.selectionRange));
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
  if (bandInfo && BAND_NAMES.has(bandInfo.value.toLowerCase()) && rangeContains(toLegacyRange(position.line, bandInfo.startOffset, bandInfo.endOffset), position)) {
    return markdownHover([
      `**${bandInfo.value.toLowerCase()}**`,
      'Banda DataWindow',
      `Objeto: \`${model.objectName}\``,
    ], toLegacyRange(position.line, bandInfo.startOffset, bandInfo.endOffset));
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

  const dropdownColumn = model.tableColumns.find((entry) => entry.dddwRange && rangeContains(entry.dddwRange, position));
  const dropdownRange = dropdownColumn?.dddwRange;
  if (dropdownColumn?.dddwName && dropdownRange) {
    return markdownHover([
      `**${dropdownColumn.name}.dddw.name**`,
      'Relacion child DataWindow verificada',
      `DataObject hijo: \`${dropdownColumn.dddwName}\``,
      `Objeto: \`${model.objectName}\``,
    ], dropdownRange);
  }

  const report = model.reports.find((entry) =>
    rangeContains(entry.selectionRange, position)
    || (entry.dataObjectRange ? rangeContains(entry.dataObjectRange, position) : false)
  );
  if (report) {
    return markdownHover([
      `**${report.name}**`,
      'Control report DataWindow',
      report.dataObject ? `DataObject hijo: \`${report.dataObject}\`` : undefined,
      `Objeto: \`${model.objectName}\``,
    ], report.dataObjectRange ?? report.selectionRange);
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

  const root = DocumentSymbol.create(
    model.objectName,
    'DataWindow',
    SymbolKind.Class,
    toRange(model.rootRange),
    toRange(model.rootSelectionRange)
  );

  const rootChildren = model.bands.map((band) =>
    DocumentSymbol.create(band.name, band.detail ?? '', SymbolKind.Namespace, toRange(band.range), toRange(band.selectionRange))
  );
  root.children = rootChildren;

  if (model.tableColumns.length > 0 || model.retrieve) {
    const tableRange = buildCombinedRange(
      model.tableColumns.map((entry) => entry.range).concat(model.retrieve ? [model.retrieve.range] : [])
    );
    const tableStart = tableRange?.start ?? model.rootRange.start;
    const table = DocumentSymbol.create('table', 'tabla DataWindow', SymbolKind.Object, toRange(tableRange ?? model.rootRange), Range.create(tableStart.line, tableStart.character, tableStart.line, tableStart.character));
    const tableChildren = model.tableColumns.map((column) =>
      DocumentSymbol.create(column.name, column.detail ?? '', SymbolKind.Field, toRange(column.range), toRange(column.selectionRange))
    );
    table.children = tableChildren;
    if (model.retrieve) {
      tableChildren.push(
        DocumentSymbol.create('retrieve', model.retrieve.detail ?? '', SymbolKind.String, toRange(model.retrieve.range), toRange(model.retrieve.selectionRange))
      );
    }
    rootChildren.push(table);
  }

  if (model.reports.length > 0) {
    const controlsRange = buildCombinedRange(model.reports.map((entry) => entry.range)) ?? model.rootRange;
    const controls = DocumentSymbol.create('controls', 'controles DataWindow', SymbolKind.Namespace, toRange(controlsRange), toRange(model.reports[0].selectionRange));
    controls.children = model.reports.map((report) =>
      DocumentSymbol.create(report.name, report.detail ?? '', SymbolKind.Object, toRange(report.range), toRange(report.selectionRange))
    );
    rootChildren.push(controls);
  }

  return [root];
}

function getLineText(document: TextDocument, line: number): string {
  const lines = document.getText().split(/\r?\n/);
  return lines[line] ?? '';
}

function buildCombinedRange(ranges: DataWindowRange[]): DataWindowRange | null {
  if (ranges.length === 0) {
    return null;
  }

  return ranges.slice(1).reduce((combined, current) => rangeEndAfter(combined, current), ranges[0]);
}

function resolveSingleDataWindowLink(dataObjectName: string, kb: KnowledgeBase): { uri: string; range: DataWindowRange } | null {
  const targets = resolveDataWindowDefinitionTargets(dataObjectName, kb);
  if (targets.length !== 1) {
    return null;
  }

  return {
    uri: targets[0].uri,
    range: {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    },
  };
}

function toLegacyRange(line: number, startCharacter: number, endCharacter: number): DataWindowRange {
  return {
    start: { line, character: startCharacter },
    end: { line, character: endCharacter },
  };
}

function toRange(range: DataWindowRange): Range {
  return Range.create(range.start.line, range.start.character, range.end.line, range.end.character);
}

function markdownHover(lines: Array<string | undefined>, range: DataWindowRange): Hover {
  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: lines.filter((entry): entry is string => !!entry).join('\n\n'),
    },
    range: toRange(range),
  };
}