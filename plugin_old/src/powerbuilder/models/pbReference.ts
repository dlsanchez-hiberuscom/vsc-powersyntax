import * as vscode from 'vscode';

export interface PbReference {
    symbol: string;
    uri: vscode.Uri;
    range: vscode.Range;
}
