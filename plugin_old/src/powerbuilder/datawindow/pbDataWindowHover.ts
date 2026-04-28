import * as vscode from 'vscode';
import { PbDataWindowParser } from './pbDataWindowParser';
import {
    buildDataWindowSqlSemantics,
    findDataWindowSqlColumnAtPosition,
    findLinkedTableColumnNode,
    PbDataWindowSqlSemantics,
} from './pbDataWindowSqlSemantics';

const DATAWINDOW_BAND_NAMES = ['header', 'summary', 'footer', 'detail'] as const;

export function provideDataWindowHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    parser: PbDataWindowParser = new PbDataWindowParser(),
): vscode.Hover | undefined {
    const parseResult = parser.parseDocument(document);
    const sqlSemantics = buildDataWindowSqlSemantics(document, parser);
    const lineText = document.lineAt(position.line).text;

    return findBandDeclarationHover(lineText, position, parser, parseResult.metadata.objectName)
        ?? findBandAttributeHover(lineText, position, parseResult.metadata.objectName)
        ?? findTableColumnHover(lineText, position, parser, parseResult.metadata.objectName)
        ?? findRetrieveColumnHover(document, position, parser, parseResult.metadata.objectName, sqlSemantics)
        ?? findRetrieveHover(lineText, position, parser, parseResult.metadata)
        ?? findTextControlHover(lineText, position, parser, parseResult.metadata.objectName)
        ?? findDisplayColumnHover(lineText, position, parser, parseResult.metadata.objectName);
}

function findRetrieveColumnHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    parser: PbDataWindowParser,
    objectName: string,
    sqlSemantics: PbDataWindowSqlSemantics,
): vscode.Hover | undefined {
    const reference = findDataWindowSqlColumnAtPosition(sqlSemantics, position);

    if (!reference) {
        return undefined;
    }

    const linkedTableColumn = findLinkedTableColumnNode(sqlSemantics, reference);

    if (!linkedTableColumn) {
        return undefined;
    }

    const lineText = document.lineAt(linkedTableColumn.selectionRange.start.line).text;
    const remoteName = parser.extractAttribute(lineText, 'dbname');
    const type = parser.extractAttribute(lineText, 'type');
    const isUpdatable = parser.extractAttribute(lineText, 'update');
    const remoteParts = remoteName?.split('.');
    const remoteTable = remoteParts && remoteParts.length > 1
        ? remoteParts.slice(0, -1).join('.')
        : reference.qualifiedTableName;
    const remoteColumn = remoteParts && remoteParts.length > 1
        ? remoteParts[remoteParts.length - 1]
        : remoteName;
    const lines = [
        `**${reference.columnName}**`,
        'Columna SQL del retrieve DataWindow',
        `Expresión SQL: \`${reference.rawText}\``,
    ];

    if (type) {
        lines.push(`Tipo: \`${type}\``);
    }

    if (remoteName) {
        lines.push(`Mapeo remoto: \`${remoteName}\``);
    }

    if (remoteTable) {
        lines.push(`Tabla remota: \`${remoteTable}\``);
    }

    if (remoteColumn && remoteColumn !== remoteName) {
        lines.push(`Columna remota: \`${remoteColumn}\``);
    }

    if (isUpdatable) {
        lines.push(`Update: \`${isUpdatable}\``);
    }

    lines.push(`Objeto: \`${objectName}\``);

    return new vscode.Hover(
        new vscode.MarkdownString(lines.join('\n\n')),
        reference.range,
    );
}

function findBandDeclarationHover(
    lineText: string,
    position: vscode.Position,
    parser: PbDataWindowParser,
    objectName: string,
): vscode.Hover | undefined {
    const bandMatch = lineText.match(/^\s*(header|summary|footer|detail)\(/i);

    if (!bandMatch?.[1]) {
        return undefined;
    }

    const bandName = bandMatch[1].toLowerCase();
    const bandStart = lineText.toLowerCase().indexOf(bandName);
    const bandRange = new vscode.Range(
        position.line,
        bandStart,
        position.line,
        bandStart + bandName.length,
    );

    if (!bandRange.contains(position)) {
        return undefined;
    }

    const height = parser.extractAttribute(lineText, 'height');
    const color = parser.extractAttribute(lineText, 'color');
    const lines = [
        `**${bandName}**`,
        'Banda DataWindow',
    ];

    if (height) {
        lines.push(`Altura: \`${height}\``);
    }

    if (color) {
        lines.push(`Color: \`${color}\``);
    }

    lines.push(`Objeto: \`${objectName}\``);

    return new vscode.Hover(new vscode.MarkdownString(lines.join('\n\n')), bandRange);
}

function findBandAttributeHover(
    lineText: string,
    position: vscode.Position,
    objectName: string,
): vscode.Hover | undefined {
    const range = findUnquotedAttributeValueRange(
        lineText,
        position.line,
        'band',
    );

    if (!range || !range.contains(position)) {
        return undefined;
    }

    const bandName = lineText.slice(range.start.character, range.end.character).trim().toLowerCase();

    if (!DATAWINDOW_BAND_NAMES.includes(bandName as typeof DATAWINDOW_BAND_NAMES[number])) {
        return undefined;
    }

    const kind = /^\s*text\(/i.test(lineText)
        ? 'texto'
        : /^\s*column\(/i.test(lineText)
            ? 'columna visual'
            : 'elemento';

    return new vscode.Hover(
        new vscode.MarkdownString([
            `**${bandName}**`,
            'Banda DataWindow',
            `Uso: ${kind} en banda \`${bandName}\``,
            `Objeto: \`${objectName}\``,
        ].join('\n\n')),
        range,
    );
}

function findTableColumnHover(
    lineText: string,
    position: vscode.Position,
    parser: PbDataWindowParser,
    objectName: string,
): vscode.Hover | undefined {
    if (!/\bcolumn=\(/i.test(lineText)) {
        return undefined;
    }

    const nameRange = findUnquotedAttributeValueRange(lineText, position.line, 'name');
    const dbNameRange = findQuotedAttributeValueRange(lineText, position.line, 'dbname');

    if (
        (!nameRange || !nameRange.contains(position)) &&
        (!dbNameRange || !dbNameRange.contains(position))
    ) {
        return undefined;
    }

    const columnName = parser.extractAttribute(lineText, 'name');
    const remoteName = parser.extractAttribute(lineText, 'dbname');
    const type = parser.extractAttribute(lineText, 'type');
    const isUpdatable = parser.extractAttribute(lineText, 'update');
    const title = columnName ?? remoteName ?? 'column';
    const targetRange = dbNameRange && dbNameRange.contains(position)
        ? dbNameRange
        : nameRange ?? dbNameRange;

    if (!targetRange) {
        return undefined;
    }

    const remoteParts = remoteName?.split('.');
    const remoteTable = remoteParts && remoteParts.length > 1
        ? remoteParts.slice(0, -1).join('.')
        : undefined;
    const remoteColumn = remoteParts && remoteParts.length > 1
        ? remoteParts[remoteParts.length - 1]
        : remoteName;
    const lines = [
        `**${title}**`,
        'Columna de tabla DataWindow',
    ];

    if (type) {
        lines.push(`Tipo: \`${type}\``);
    }

    if (remoteName) {
        lines.push(`Mapeo remoto: \`${remoteName}\``);
    }

    if (remoteTable) {
        lines.push(`Tabla remota: \`${remoteTable}\``);
    }

    if (remoteColumn && remoteColumn !== remoteName) {
        lines.push(`Columna remota: \`${remoteColumn}\``);
    }

    if (isUpdatable) {
        lines.push(`Update: \`${isUpdatable}\``);
    }

    lines.push(`Objeto: \`${objectName}\``);

    return new vscode.Hover(
        new vscode.MarkdownString(lines.join('\n\n')),
        targetRange,
    );
}

function findRetrieveHover(
    lineText: string,
    position: vscode.Position,
    parser: PbDataWindowParser,
    metadata: ReturnType<PbDataWindowParser['parseDocument']>['metadata'],
): vscode.Hover | undefined {
    const range = findQuotedAttributeValueRange(
        lineText,
        position.line,
        'retrieve',
    );

    if (!range || !range.contains(position)) {
        return undefined;
    }

    const retrieveStatement = parser.extractAttribute(lineText, 'retrieve') ?? metadata.retrieveStatement;

    if (!retrieveStatement) {
        return undefined;
    }

    const markdown = [
        '**retrieve**',
        'SQL segura de DataWindow',
        '```sql',
        retrieveStatement,
        '```',
        `Objeto: \`${metadata.objectName}\``,
        metadata.tableColumnNames.length > 0
            ? `Columnas de tabla: ${metadata.tableColumnNames.map(column => `\`${column}\``).join(', ')}`
            : undefined,
    ].filter((value): value is string => !!value).join('\n\n');

    return new vscode.Hover(new vscode.MarkdownString(markdown), range);
}

function findDisplayColumnHover(
    lineText: string,
    position: vscode.Position,
    parser: PbDataWindowParser,
    objectName: string,
): vscode.Hover | undefined {
    if (!/^\s*column\(/i.test(lineText)) {
        return undefined;
    }

    const idRange = findUnquotedAttributeValueRange(lineText, position.line, 'id');
    const formatRange = findQuotedAttributeValueRange(lineText, position.line, 'format');
    const targetRange = formatRange?.contains(position)
        ? formatRange
        : idRange?.contains(position)
            ? idRange
            : undefined;

    if (!targetRange) {
        return undefined;
    }

    const columnId = parser.extractAttribute(lineText, 'id');
    const bandName = parser.extractAttribute(lineText, 'band');
    const alignment = parser.extractAttribute(lineText, 'alignment');
    const x = parser.extractAttribute(lineText, 'x');
    const y = parser.extractAttribute(lineText, 'y');
    const width = parser.extractAttribute(lineText, 'width');
    const height = parser.extractAttribute(lineText, 'height');
    const format = parser.extractAttribute(lineText, 'format');

    if (!columnId) {
        return undefined;
    }

    return new vscode.Hover(
        new vscode.MarkdownString([
            `**column#${columnId}**`,
            'Columna visual DataWindow',
            bandName ? `Banda: \`${bandName}\`` : undefined,
            alignment ? `Alineación: \`${alignment}\`` : undefined,
            format ? `Formato: \`${format}\`` : undefined,
            formatLayoutLine(width, height),
            formatPositionLine(x, y),
            `Objeto: \`${objectName}\``,
        ].filter((value): value is string => !!value).join('\n\n')),
        targetRange,
    );
}

function findTextControlHover(
    lineText: string,
    position: vscode.Position,
    parser: PbDataWindowParser,
    objectName: string,
): vscode.Hover | undefined {
    if (!/^\s*text\(/i.test(lineText)) {
        return undefined;
    }

    const textRange = findQuotedAttributeValueRange(lineText, position.line, 'text');

    if (!textRange || !textRange.contains(position)) {
        return undefined;
    }

    const textLabel = parser.extractAttribute(lineText, 'text');

    if (!textLabel) {
        return undefined;
    }

    const bandName = parser.extractAttribute(lineText, 'band');
    const alignment = parser.extractAttribute(lineText, 'alignment');
    const x = parser.extractAttribute(lineText, 'x');
    const y = parser.extractAttribute(lineText, 'y');
    const width = parser.extractAttribute(lineText, 'width');
    const height = parser.extractAttribute(lineText, 'height');

    return new vscode.Hover(
        new vscode.MarkdownString([
            `**${textLabel}**`,
            'Texto DataWindow',
            bandName ? `Banda: \`${bandName}\`` : undefined,
            alignment ? `Alineación: \`${alignment}\`` : undefined,
            formatLayoutLine(width, height),
            formatPositionLine(x, y),
            `Objeto: \`${objectName}\``,
        ].filter((value): value is string => !!value).join('\n\n')),
        textRange,
    );
}

function formatLayoutLine(
    width: string | undefined,
    height: string | undefined,
): string | undefined {
    if (!width && !height) {
        return undefined;
    }

    if (width && height) {
        return `Tamaño: \`${width} x ${height}\``;
    }

    return `Tamaño: \`${width ?? height}\``;
}

function formatPositionLine(
    x: string | undefined,
    y: string | undefined,
): string | undefined {
    if (!x && !y) {
        return undefined;
    }

    if (x && y) {
        return `Posición: \`x=${x}, y=${y}\``;
    }

    return `Posición: \`${x ? `x=${x}` : `y=${y}`}\``;
}

function findQuotedAttributeValueRange(
    text: string,
    line: number,
    attributeName: string,
): vscode.Range | undefined {
    const matcher = new RegExp(`${attributeName}="([^"]*)"`, 'i');
    const match = text.match(matcher);

    if (!match || match.index === undefined) {
        return undefined;
    }

    const attributeStart = match.index + attributeName.length + 2;
    const value = match[1] ?? '';

    return new vscode.Range(
        line,
        attributeStart,
        line,
        attributeStart + value.length,
    );
}

function findUnquotedAttributeValueRange(
    text: string,
    line: number,
    attributeName: string,
): vscode.Range | undefined {
    const matcher = new RegExp(`${attributeName}=([^\s)]+)`, 'i');
    const match = text.match(matcher);

    if (!match || match.index === undefined) {
        return undefined;
    }

    const attributeStart = match.index + attributeName.length + 1;
    const value = match[1] ?? '';

    return new vscode.Range(
        line,
        attributeStart,
        line,
        attributeStart + value.length,
    );
}