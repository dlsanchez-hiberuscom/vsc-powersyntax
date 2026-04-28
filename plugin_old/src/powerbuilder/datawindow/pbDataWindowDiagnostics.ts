import * as vscode from 'vscode';
import { PB_DIAGNOSTIC_CODES } from '../constants/pbDiagnosticMessages';
import { PbDiagnosticInfo } from '../models/pbDiagnostic';
import { PbDataWindowParser } from './pbDataWindowParser';
import {
    buildDataWindowSqlSemantics,
    findLinkedTableColumnNode,
} from './pbDataWindowSqlSemantics';

export function analyzeDataWindowDiagnostics(
    document: vscode.TextDocument,
    parser: PbDataWindowParser = new PbDataWindowParser(),
): PbDiagnosticInfo[] {
    const semantics = buildDataWindowSqlSemantics(document, parser);
    const diagnostics: PbDiagnosticInfo[] = [];

    for (const reference of semantics.selectColumnReferences) {
        if (findLinkedTableColumnNode(semantics, reference)) {
            continue;
        }

        diagnostics.push({
            message: `El retrieve referencia la columna '${reference.columnName}', pero table(column=...) no la publica con evidencia fuerte.`,
            range: reference.range,
            severity: vscode.DiagnosticSeverity.Warning,
            code: PB_DIAGNOSTIC_CODES.DATAWINDOW_SQL_UNKNOWN_COLUMN,
        });
    }

    return diagnostics;
}