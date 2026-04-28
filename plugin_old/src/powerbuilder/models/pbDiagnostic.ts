import * as vscode from 'vscode';

export interface PbDiagnosticInfo {
    message: string;
    range: vscode.Range;
    severity: vscode.DiagnosticSeverity;
    code?: string;
}
