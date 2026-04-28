import * as vscode from 'vscode';
import { PbDataWindowParser } from './pbDataWindowParser';
import {
    buildDataWindowSqlSemantics,
    findLinkedTableColumnNode,
} from './pbDataWindowSqlSemantics';

const SHOW_OBJECT_INFO_COMMAND = 'powerbuilder.showObjectInfo';

export function provideDataWindowCodeLenses(
    document: vscode.TextDocument,
    parser: PbDataWindowParser = new PbDataWindowParser(),
): vscode.CodeLens[] {
    const parseResult = parser.parseDocument(document);
    const sqlSemantics = buildDataWindowSqlSemantics(document, parser);
    const lenses: vscode.CodeLens[] = [];
    const linkedColumnNames = new Set<string>();
    let linkedReferenceCount = 0;

    for (const reference of sqlSemantics.selectColumnReferences) {
        const linkedNode = findLinkedTableColumnNode(sqlSemantics, reference);

        if (!linkedNode) {
            continue;
        }

        linkedReferenceCount++;

        if (linkedColumnNames.has(linkedNode.name.toLowerCase())) {
            continue;
        }

        linkedColumnNames.add(linkedNode.name.toLowerCase());
        lenses.push(createCodeLens(
            linkedNode.selectionRange,
            'Usada en retrieve SQL',
        ));
    }

    if (sqlSemantics.retrieveNode) {
        const unresolvedCount = sqlSemantics.selectColumnReferences.length - linkedReferenceCount;
        const parts = [`Retrieve SQL: ${linkedReferenceCount} enlazadas`];

        if (unresolvedCount > 0) {
            parts.push(`${unresolvedCount} pendientes`);
        }

        lenses.push(createCodeLens(
            sqlSemantics.retrieveNode.selectionRange,
            parts.join(' · '),
        ));
    }

    const tableNode = sqlSemantics.tableNode;

    if (tableNode) {
        lenses.push(createCodeLens(
            tableNode.selectionRange,
            `${parseResult.metadata.tableColumnNames.length} columnas tabla · ${parseResult.metadata.displayColumnCount} visuales`,
        ));
    }

    return lenses;
}

function createCodeLens(range: vscode.Range, title: string): vscode.CodeLens {
    return new vscode.CodeLens(range, {
        title,
        command: SHOW_OBJECT_INFO_COMMAND,
    });
}