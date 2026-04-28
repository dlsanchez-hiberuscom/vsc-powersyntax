import * as vscode from 'vscode';

export interface PbProjectDefinition {
    uri: vscode.Uri;
    name: string;
    projectDirectoryUri: vscode.Uri;
    applicationName?: string;
    appEntry?: string;
    appEntryUri?: vscode.Uri;
    libraries: string[];
    libraryUris: vscode.Uri[];
}

export function normalizeWorkspaceUriPath(uri: vscode.Uri | string): string {
    const path = typeof uri === 'string'
        ? uri
        : uri.path;

    return path
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
        .replace(/\/$/, '')
        .toLowerCase();
}