import * as vscode from 'vscode';
import { PbDataWindowNode, PbDataWindowParser } from './pbDataWindowParser';

export interface PbDataWindowSqlColumnReference {
    rawText: string;
    columnName: string;
    qualifiedTableName?: string;
    range: vscode.Range;
}

export interface PbDataWindowSqlSemantics {
    retrieveNode?: PbDataWindowNode;
    tableNode?: PbDataWindowNode;
    tableColumnsByName: ReadonlyMap<string, PbDataWindowNode>;
    selectColumnReferences: readonly PbDataWindowSqlColumnReference[];
}

export function buildDataWindowSqlSemantics(
    document: vscode.TextDocument,
    parser: PbDataWindowParser = new PbDataWindowParser(),
): PbDataWindowSqlSemantics {
    const parseResult = parser.parseDocument(document);
    const rootChildren = parseResult.root.children ?? [];
    const tableNode = rootChildren.find(node => node.kind === 'table');
    const retrieveNode = tableNode?.children?.find(node => node.kind === 'retrieve');
    const tableColumnsByName = new Map<string, PbDataWindowNode>();

    for (const child of tableNode?.children ?? []) {
        if (child.kind !== 'table-column') {
            continue;
        }

        tableColumnsByName.set(child.name.trim().toLowerCase(), child);
    }

    return {
        retrieveNode,
        tableNode,
        tableColumnsByName,
        selectColumnReferences: retrieveNode && parseResult.metadata.retrieveStatement
            ? parseSimpleSelectColumnReferences(
                document,
                retrieveNode.selectionRange,
                parseResult.metadata.retrieveStatement,
            )
            : [],
    };
}

export function findDataWindowSqlColumnAtPosition(
    semantics: PbDataWindowSqlSemantics,
    position: vscode.Position,
): PbDataWindowSqlColumnReference | undefined {
    return semantics.selectColumnReferences.find(reference => reference.range.contains(position));
}

export function findLinkedTableColumnNode(
    semantics: PbDataWindowSqlSemantics,
    reference: PbDataWindowSqlColumnReference,
): PbDataWindowNode | undefined {
    return semantics.tableColumnsByName.get(reference.columnName.trim().toLowerCase());
}

function parseSimpleSelectColumnReferences(
    document: vscode.TextDocument,
    retrieveRange: vscode.Range,
    retrieveText: string,
): PbDataWindowSqlColumnReference[] {
    const selectClause = findSelectClause(retrieveText);

    if (!selectClause) {
        return [];
    }

    const baseOffset = document.offsetAt(retrieveRange.start);
    const references: PbDataWindowSqlColumnReference[] = [];
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
            range: new vscode.Range(
                document.positionAt(baseOffset + reference.startOffset),
                document.positionAt(baseOffset + reference.endOffset),
            ),
        });
    }

    return references;
}

function findSelectClause(
    retrieveText: string,
): { text: string; startOffset: number } | undefined {
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
            const clauseText = retrieveText.slice(selectStart, index).trim();

            return clauseText.length > 0
                ? {
                    text: clauseText,
                    startOffset: selectStart + retrieveText.slice(selectStart, index).search(/\S/),
                }
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
    const rawText = text.slice(start, end);
    const firstNonWhitespace = rawText.search(/\S/);

    if (firstNonWhitespace < 0) {
        return;
    }

    const lastNonWhitespace = findLastNonWhitespaceIndex(rawText);

    segments.push({
        text: rawText.slice(firstNonWhitespace, lastNonWhitespace + 1),
        startOffset: baseOffset + start + firstNonWhitespace,
        endOffset: baseOffset + start + lastNonWhitespace + 1,
    });
}

function tryParseSimpleSelectColumnReference(
    text: string,
    startOffset: number,
): {
    rawText: string;
    columnName: string;
    qualifiedTableName?: string;
    startOffset: number;
    endOffset: number;
} | undefined {
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

function isKeywordBoundary(
    text: string,
    start: number,
    length: number,
): boolean {
    const previous = start > 0 ? text[start - 1] : '';
    const next = start + length < text.length ? text[start + length] : '';

    return !/[a-z0-9_]/i.test(previous) && !/[a-z0-9_]/i.test(next);
}