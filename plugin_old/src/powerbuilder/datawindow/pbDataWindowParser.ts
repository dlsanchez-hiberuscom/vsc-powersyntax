import * as vscode from 'vscode';

export type PbDataWindowNodeKind =
    | 'datawindow'
    | 'band'
    | 'table'
    | 'table-column'
    | 'retrieve'
    | 'text'
    | 'column-control';

export interface PbDataWindowNode {
    name: string;
    kind: PbDataWindowNodeKind;
    detail?: string;
    range: vscode.Range;
    selectionRange: vscode.Range;
    children?: PbDataWindowNode[];
}

export interface PbDataWindowMetadata {
    objectName: string;
    bandNames: string[];
    tableColumnNames: string[];
    textCount: number;
    displayColumnCount: number;
    retrieveStatement?: string;
}

export interface PbDataWindowParseResult {
    root: PbDataWindowNode;
    metadata: PbDataWindowMetadata;
}

interface PbDataWindowTextRange {
    startOffset: number;
    endOffset: number;
}

interface PbDataWindowBlockSegment {
    text: string;
    startOffset: number;
    endOffset: number;
}

const BAND_NAMES = ['header', 'summary', 'footer', 'detail'];

export class PbDataWindowParser {
    parseDocument(document: vscode.TextDocument): PbDataWindowParseResult {
        return this.parseText(document.uri, document.getText());
    }

    parseText(uri: vscode.Uri, text: string): PbDataWindowParseResult {
        const lines = text.split(/\r?\n/);
        const objectName = this.extractObjectName(lines, uri);
        const metadata: PbDataWindowMetadata = {
            objectName,
            bandNames: [],
            tableColumnNames: [],
            textCount: 0,
            displayColumnCount: 0,
            retrieveStatement: undefined,
        };

        const children: PbDataWindowNode[] = [];
        const fullRange = this.createFullRange(lines);
        const root = this.createNode(
            objectName,
            'datawindow',
            'DataWindow',
            fullRange,
            new vscode.Range(0, 0, 0, Math.max(objectName.length, 1)),
        );

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const lineText = lines[lineIndex] ?? '';
            const trimmed = lineText.trim();

            if (!trimmed) {
                continue;
            }

            const bandMatch = trimmed.match(/^(header|summary|footer|detail)\(/i);

            if (bandMatch) {
                const bandName = bandMatch[1].toLowerCase();
                metadata.bandNames.push(bandName);
                children.push(this.createLineNode(
                    lineIndex,
                    lineText,
                    bandName,
                    'band',
                    'banda DataWindow',
                ));
                continue;
            }

            if (/^table\(/i.test(trimmed)) {
                const block = this.extractParenthesizedBlock(lines, lineIndex);
                const tableNode = this.createRangeNode(
                    lineIndex,
                    block.endLine,
                    lines,
                    'table',
                    'table',
                    'tabla DataWindow',
                );
                const tableChildren: PbDataWindowNode[] = [];
                const tableColumns = this.extractNamedBlockSegments(block.text, 'column');

                for (const tableColumn of tableColumns) {
                    const columnName = this.extractAttribute(tableColumn.text, 'name');

                    if (!columnName) {
                        continue;
                    }

                    metadata.tableColumnNames.push(columnName);
                    const columnNameRange = this.findAttributeValueRange(
                        tableColumn.text,
                        'name',
                    );
                    tableChildren.push(this.createNode(
                        columnName,
                        'table-column',
                        this.buildTableColumnDetail(tableColumn.text),
                        tableNode.range,
                        columnNameRange
                            ? this.blockOffsetRangeToDocumentRange(
                                block.text,
                                lineIndex,
                                tableColumn.startOffset + columnNameRange.startOffset,
                                tableColumn.startOffset + columnNameRange.endOffset,
                            )
                            : tableNode.selectionRange,
                    ));
                }

                const retrieveStatement = this.extractAttribute(block.text, 'retrieve');

                if (retrieveStatement) {
                    metadata.retrieveStatement = retrieveStatement;
                    const retrieveRange = this.findAttributeValueRange(
                        block.text,
                        'retrieve',
                    );
                    tableChildren.push(this.createNode(
                        'retrieve',
                        'retrieve',
                        this.truncateRetrieveStatement(retrieveStatement),
                        tableNode.range,
                        retrieveRange
                            ? this.blockOffsetRangeToDocumentRange(
                                block.text,
                                lineIndex,
                                retrieveRange.startOffset,
                                retrieveRange.endOffset,
                            )
                            : tableNode.selectionRange,
                    ));
                }

                tableNode.children = tableChildren;
                children.push(tableNode);
                lineIndex = block.endLine;
                continue;
            }

            if (/^text\(/i.test(trimmed)) {
                metadata.textCount++;
                const textLabel = this.extractAttribute(trimmed, 'text') || `text#${metadata.textCount}`;
                const bandName = this.extractAttribute(trimmed, 'band');

                children.push(this.createLineNode(
                    lineIndex,
                    lineText,
                    textLabel,
                    'text',
                    bandName
                        ? `texto · banda ${bandName}`
                        : 'texto DataWindow',
                ));
                continue;
            }

            if (/^column\(/i.test(trimmed)) {
                metadata.displayColumnCount++;
                const id = this.extractAttribute(trimmed, 'id') || String(metadata.displayColumnCount);
                const bandName = this.extractAttribute(trimmed, 'band');

                children.push(this.createLineNode(
                    lineIndex,
                    lineText,
                    `column#${id}`,
                    'column-control',
                    bandName
                        ? `columna visual · banda ${bandName}`
                        : 'columna visual DataWindow',
                ));
            }
        }

        root.children = children;

        return {
            root,
            metadata: {
                ...metadata,
                bandNames: this.sortBands(metadata.bandNames),
            },
        };
    }
}

export function buildDataWindowDocumentSymbols(
    result: PbDataWindowParseResult,
): vscode.DocumentSymbol[] {
    return [toDocumentSymbol(result.root)];
}

function toDocumentSymbol(node: PbDataWindowNode): vscode.DocumentSymbol {
    const symbol = new vscode.DocumentSymbol(
        node.name,
        node.detail ?? '',
        mapDataWindowKind(node.kind),
        node.range,
        node.selectionRange,
    );

    for (const child of node.children ?? []) {
        symbol.children.push(toDocumentSymbol(child));
    }

    return symbol;
}

function mapDataWindowKind(kind: PbDataWindowNodeKind): vscode.SymbolKind {
    switch (kind) {
        case 'datawindow':
            return vscode.SymbolKind.Class;
        case 'band':
            return vscode.SymbolKind.Namespace;
        case 'table':
            return vscode.SymbolKind.Object;
        case 'table-column':
            return vscode.SymbolKind.Field;
        case 'retrieve':
            return vscode.SymbolKind.String;
        case 'text':
            return vscode.SymbolKind.String;
        case 'column-control':
            return vscode.SymbolKind.Property;
        default:
            return vscode.SymbolKind.Object;
    }
}

declare module './pbDataWindowParser' {
    interface PbDataWindowParser {
        extractObjectName(lines: string[], uri: vscode.Uri): string;
        createFullRange(lines: string[]): vscode.Range;
        createNode(
            name: string,
            kind: PbDataWindowNodeKind,
            detail: string | undefined,
            range: vscode.Range,
            selectionRange: vscode.Range,
        ): PbDataWindowNode;
        createLineNode(
            lineIndex: number,
            lineText: string,
            name: string,
            kind: PbDataWindowNodeKind,
            detail: string,
        ): PbDataWindowNode;
        createRangeNode(
            startLine: number,
            endLine: number,
            lines: string[],
            name: string,
            selectionToken: string,
            detail: string,
        ): PbDataWindowNode;
        extractParenthesizedBlock(lines: string[], startLine: number): { text: string; endLine: number };
        extractNamedBlockSegments(text: string, blockName: string): PbDataWindowBlockSegment[];
        extractNamedBlocks(text: string, blockName: string): string[];
        findAttributeValueRange(text: string, attributeName: string): PbDataWindowTextRange | undefined;
        blockOffsetRangeToDocumentRange(
            text: string,
            startLine: number,
            startOffset: number,
            endOffset: number,
        ): vscode.Range;
        extractAttribute(text: string, attributeName: string): string | undefined;
        buildTableColumnDetail(text: string): string;
        truncateRetrieveStatement(statement: string): string;
        sortBands(bands: string[]): string[];
    }
}

PbDataWindowParser.prototype.extractObjectName = function (lines: string[], uri: vscode.Uri): string {
    const header = lines[0] ?? '';
    const headerMatch = header.match(/^\$PBExportHeader\$(.+?)\.srd$/i);

    if (headerMatch?.[1]) {
        return headerMatch[1];
    }

    const path = uri.path.split('/');
    const fileName = path[path.length - 1] ?? 'datawindow';
    return fileName.replace(/\.srd$/i, '');
};

PbDataWindowParser.prototype.createFullRange = function (lines: string[]): vscode.Range {
    if (lines.length === 0) {
        return new vscode.Range(0, 0, 0, 0);
    }

    const lastLineIndex = lines.length - 1;
    return new vscode.Range(0, 0, lastLineIndex, (lines[lastLineIndex] ?? '').length);
};

PbDataWindowParser.prototype.createNode = function (
    name: string,
    kind: PbDataWindowNodeKind,
    detail: string | undefined,
    range: vscode.Range,
    selectionRange: vscode.Range,
): PbDataWindowNode {
    return {
        name,
        kind,
        detail,
        range,
        selectionRange,
        children: [],
    };
};

PbDataWindowParser.prototype.createLineNode = function (
    lineIndex: number,
    lineText: string,
    name: string,
    kind: PbDataWindowNodeKind,
    detail: string,
): PbDataWindowNode {
    const startCharacter = Math.max(0, lineText.toLowerCase().indexOf(name.toLowerCase()));
    const endCharacter = startCharacter >= 0
        ? startCharacter + name.length
        : lineText.length;

    return this.createNode(
        name,
        kind,
        detail,
        new vscode.Range(lineIndex, 0, lineIndex, lineText.length),
        new vscode.Range(lineIndex, Math.max(0, startCharacter), lineIndex, Math.max(Math.max(0, startCharacter), endCharacter)),
    );
};

PbDataWindowParser.prototype.createRangeNode = function (
    startLine: number,
    endLine: number,
    lines: string[],
    name: string,
    selectionToken: string,
    detail: string,
): PbDataWindowNode {
    const startLineText = lines[startLine] ?? '';
    const selectionStart = Math.max(0, startLineText.toLowerCase().indexOf(selectionToken.toLowerCase()));

    return this.createNode(
        name,
        name === 'table' ? 'table' : 'datawindow',
        detail,
        new vscode.Range(startLine, 0, endLine, (lines[endLine] ?? '').length),
        new vscode.Range(startLine, selectionStart, startLine, selectionStart + selectionToken.length),
    );
};

PbDataWindowParser.prototype.extractParenthesizedBlock = function (lines: string[], startLine: number): { text: string; endLine: number } {
    let depth = 0;
    let inQuote = false;
    const parts: string[] = [];
    let endLine = startLine;

    for (let lineIndex = startLine; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex] ?? '';
        parts.push(line);

        for (let index = 0; index < line.length; index++) {
            const ch = line[index];

            if (ch === '"') {
                inQuote = !inQuote;
                continue;
            }

            if (inQuote) {
                continue;
            }

            if (ch === '(') {
                depth++;
            }

            if (ch === ')') {
                depth--;
            }
        }

        endLine = lineIndex;

        if (depth <= 0) {
            break;
        }
    }

    return {
        text: parts.join('\n'),
        endLine,
    };
};

PbDataWindowParser.prototype.extractNamedBlocks = function (text: string, blockName: string): string[] {
    return this.extractNamedBlockSegments(text, blockName).map(segment => segment.text);
};

PbDataWindowParser.prototype.extractNamedBlockSegments = function (
    text: string,
    blockName: string,
): PbDataWindowBlockSegment[] {
    const marker = `${blockName}=(`;
    const blocks: PbDataWindowBlockSegment[] = [];
    let searchIndex = 0;

    while (searchIndex < text.length) {
        const markerIndex = text.indexOf(marker, searchIndex);

        if (markerIndex < 0) {
            break;
        }

        let cursor = markerIndex + marker.length;
        let depth = 1;
        let inQuote = false;

        while (cursor < text.length && depth > 0) {
            const ch = text[cursor];

            if (ch === '"') {
                inQuote = !inQuote;
                cursor++;
                continue;
            }

            if (!inQuote) {
                if (ch === '(') {
                    depth++;
                } else if (ch === ')') {
                    depth--;
                }
            }

            cursor++;
        }

        blocks.push({
            text: text.slice(markerIndex + marker.length, Math.max(markerIndex + marker.length, cursor - 1)),
            startOffset: markerIndex,
            endOffset: cursor,
        });
        searchIndex = cursor;
    }

    return blocks;
};

PbDataWindowParser.prototype.findAttributeValueRange = function (
    text: string,
    attributeName: string,
): PbDataWindowTextRange | undefined {
    const attributeIndex = text.toLowerCase().indexOf(`${attributeName.toLowerCase()}=`);

    if (attributeIndex < 0) {
        return undefined;
    }

    let cursor = attributeIndex + attributeName.length + 1;

    if (text[cursor] === '"') {
        const startOffset = cursor + 1;
        const endQuote = text.indexOf('"', startOffset);

        return {
            startOffset,
            endOffset: endQuote >= 0 ? endQuote : text.length,
        };
    }

    const startOffset = cursor;
    let depth = 0;

    while (cursor < text.length) {
        const ch = text[cursor];

        if (ch === '(') {
            depth++;
        } else if (ch === ')') {
            if (depth === 0) {
                break;
            }

            depth--;
        }

        if (
            depth === 0 &&
            /\s/.test(ch) &&
            /\s+[a-z][\w.]*=/i.test(text.slice(cursor))
        ) {
            break;
        }

        cursor++;
    }

    let endOffset = cursor;

    while (endOffset > startOffset && /\s/.test(text[endOffset - 1] ?? '')) {
        endOffset--;
    }

    return endOffset > startOffset
        ? { startOffset, endOffset }
        : undefined;
};

PbDataWindowParser.prototype.blockOffsetRangeToDocumentRange = function (
    text: string,
    startLine: number,
    startOffset: number,
    endOffset: number,
): vscode.Range {
    return new vscode.Range(
        dataWindowOffsetToPosition(text, startLine, startOffset),
        dataWindowOffsetToPosition(text, startLine, endOffset),
    );
};

PbDataWindowParser.prototype.extractAttribute = function (text: string, attributeName: string): string | undefined {
    const attributeIndex = text.toLowerCase().indexOf(`${attributeName.toLowerCase()}=`);

    if (attributeIndex < 0) {
        return undefined;
    }

    let cursor = attributeIndex + attributeName.length + 1;

    if (text[cursor] === '"') {
        cursor++;
        const endQuote = text.indexOf('"', cursor);
        return endQuote >= 0
            ? text.slice(cursor, endQuote)
            : text.slice(cursor);
    }

    let depth = 0;
    let result = '';

    while (cursor < text.length) {
        const ch = text[cursor];

        if (ch === '(') {
            depth++;
        } else if (ch === ')') {
            if (depth === 0) {
                break;
            }

            depth--;
        }

        if (
            depth === 0 &&
            /\s/.test(ch) &&
            /\s+[a-z][\w.]*=/i.test(text.slice(cursor))
        ) {
            break;
        }

        result += ch;
        cursor++;
    }

    const trimmed = result.trim();
    return trimmed || undefined;
};

PbDataWindowParser.prototype.buildTableColumnDetail = function (text: string): string {
    const type = this.extractAttribute(text, 'type');
    return type
        ? `columna tabla · ${type}`
        : 'columna tabla';
};

PbDataWindowParser.prototype.truncateRetrieveStatement = function (statement: string): string {
    const normalized = statement.replace(/\s+/g, ' ').trim();
    return normalized.length > 120
        ? `${normalized.slice(0, 117)}...`
        : normalized;
};

PbDataWindowParser.prototype.sortBands = function (bands: string[]): string[] {
    return [...bands].sort((left, right) => BAND_NAMES.indexOf(left) - BAND_NAMES.indexOf(right));
};

function dataWindowOffsetToPosition(
    text: string,
    startLine: number,
    offset: number,
): vscode.Position {
    const normalizedOffset = Math.max(0, Math.min(offset, text.length));
    const prefix = text.slice(0, normalizedOffset);
    const parts = prefix.split('\n');

    return new vscode.Position(
        startLine + parts.length - 1,
        (parts[parts.length - 1] ?? '').length,
    );
}