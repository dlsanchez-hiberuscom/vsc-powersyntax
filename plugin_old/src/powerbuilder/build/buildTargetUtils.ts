import * as path from 'path';
import * as vscode from 'vscode';

export type PbBuildTargetKind = 'project' | 'workspace' | 'solution' | 'target-file';

const BUILD_TARGET_KIND_BY_EXTENSION: Record<string, PbBuildTargetKind> = {
    '.pbproj': 'project',
    '.pbw': 'workspace',
    '.pbsln': 'solution',
    '.pbt': 'target-file',
};

export function getPbBuildTargetKind(
    uriOrPath: vscode.Uri | string,
): PbBuildTargetKind | undefined {
    const targetPath = typeof uriOrPath === 'string'
        ? uriOrPath
        : (uriOrPath.fsPath || uriOrPath.path);

    return BUILD_TARGET_KIND_BY_EXTENSION[path.extname(targetPath).toLowerCase()];
}

export function isPbBuildTargetUri(uri: vscode.Uri): boolean {
    return !!getPbBuildTargetKind(uri);
}

export function isPbBuildTargetPath(targetPath: string): boolean {
    return !!getPbBuildTargetKind(targetPath);
}

export function buildPbAutoBuildArgs(uriOrPath: vscode.Uri | string): string[] {
    const targetPath = typeof uriOrPath === 'string'
        ? uriOrPath
        : (uriOrPath.fsPath || uriOrPath.path);

    return ['/pbc', '/c', targetPath];
}