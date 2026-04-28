import * as vscode from 'vscode';
import { PbDataWindowParser, PbDataWindowNode } from './pbDataWindowParser';
import {
    buildDataWindowSqlSemantics,
    findDataWindowSqlColumnAtPosition,
    findLinkedTableColumnNode,
} from './pbDataWindowSqlSemantics';

export function provideDataWindowDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    parser: PbDataWindowParser = new PbDataWindowParser(),
): vscode.Location[] | undefined {
    const sqlSemantics = buildDataWindowSqlSemantics(document, parser);
    const sqlReference = findDataWindowSqlColumnAtPosition(sqlSemantics, position);
    const linkedTableColumn = sqlReference
        ? findLinkedTableColumnNode(sqlSemantics, sqlReference)
        : undefined;

    if (linkedTableColumn) {
        return [new vscode.Location(document.uri, linkedTableColumn.selectionRange)];
    }

    const lineText = document.lineAt(position.line).text;
    const bandRange = findUnquotedAttributeValueRange(
        lineText,
        position.line,
        'band',
    );

    if (!bandRange || !bandRange.contains(position)) {
        return undefined;
    }

    const bandName = lineText
        .slice(bandRange.start.character, bandRange.end.character)
        .trim()
        .toLowerCase();
    const parseResult = parser.parseDocument(document);
    const bandNode = (parseResult.root.children ?? []).find(node =>
        node.kind === 'band' &&
        node.name.toLowerCase() === bandName,
    );

    if (!bandNode) {
        return undefined;
    }

    return [new vscode.Location(document.uri, bandNode.selectionRange)];
}

export function findDataWindowNodeByName(
    nodes: readonly PbDataWindowNode[],
    kind: PbDataWindowNode['kind'],
    name: string,
): PbDataWindowNode | undefined {
    return nodes.find(node =>
        node.kind === kind &&
        node.name.toLowerCase() === name.toLowerCase(),
    );
}

function findUnquotedAttributeValueRange(
    text: string,
    line: number,
    attributeName: string,
): vscode.Range | undefined {
    const matcher = new RegExp(`${attributeName}=([^\\s)]+)`, 'i');
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