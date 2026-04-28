import * as vscode from 'vscode';
import {
    PB_DATAWINDOW_FILE_EXTENSION,
    PB_FILE_EXTENSIONS,
    PB_IDE_SAFE_FILE_EXTENSIONS,
    PB_LANGUAGE_ID,
} from '../config/constants';

const ALL_POWERBUILDER_GLOB_SUFFIX = PB_FILE_EXTENSIONS
    .map(extension => extension.slice(1))
    .join(',');

const IDE_SAFE_POWERBUILDER_GLOB_SUFFIX = PB_IDE_SAFE_FILE_EXTENSIONS
    .map(extension => extension.slice(1))
    .join(',');

export function getPowerBuilderFileExtension(
    uri: vscode.Uri,
): string | undefined {
    const path = uri.fsPath || uri.path;
    const match = path.match(/\.[^.\\/]+$/);
    return match?.[0]?.toLowerCase();
}

export function isPowerBuilderUri(uri: vscode.Uri): boolean {
    const extension = getPowerBuilderFileExtension(uri);
    return extension ? PB_FILE_EXTENSIONS.includes(extension) : false;
}

export function isDataWindowUri(uri: vscode.Uri): boolean {
    return getPowerBuilderFileExtension(uri) === PB_DATAWINDOW_FILE_EXTENSION;
}

export function isIdeSafePowerBuilderUri(
    uri: vscode.Uri,
    dataWindowExperimentalIdeEnabled: boolean,
): boolean {
    if (!isPowerBuilderUri(uri)) {
        return false;
    }

    return dataWindowExperimentalIdeEnabled || !isDataWindowUri(uri);
}

export function isIdeSafePowerBuilderDocument(
    document: vscode.TextDocument,
    dataWindowExperimentalIdeEnabled: boolean,
): boolean {
    if (document.languageId !== PB_LANGUAGE_ID) {
        return false;
    }

    return isIdeSafePowerBuilderUri(
        document.uri,
        dataWindowExperimentalIdeEnabled,
    );
}

export function filterIdeSafePowerBuilderUris(
    uris: vscode.Uri[],
    dataWindowExperimentalIdeEnabled: boolean,
): vscode.Uri[] {
    return uris.filter(uri =>
        isIdeSafePowerBuilderUri(uri, dataWindowExperimentalIdeEnabled),
    );
}

export function getAllPowerBuilderFileGlob(): string {
    return `**/*.{${ALL_POWERBUILDER_GLOB_SUFFIX}}`;
}

export function getIdeSafePowerBuilderFileGlob(
    dataWindowExperimentalIdeEnabled: boolean,
): string {
    if (dataWindowExperimentalIdeEnabled) {
        return getAllPowerBuilderFileGlob();
    }

    return `**/*.{${IDE_SAFE_POWERBUILDER_GLOB_SUFFIX}}`;
}

export async function findIdeSafePowerBuilderFilesInRoots(
    roots: readonly vscode.Uri[],
    dataWindowExperimentalIdeEnabled: boolean,
    _excludeGlob?: string,
): Promise<vscode.Uri[]> {
    if (roots.length === 0) {
        return [];
    }

    const deduped = new Map<string, vscode.Uri>();

    for (const root of roots) {
        await collectIdeSafePowerBuilderFiles(
            root,
            dataWindowExperimentalIdeEnabled,
            deduped,
        );
    }

    return Array.from(deduped.values());
}

async function collectIdeSafePowerBuilderFiles(
    root: vscode.Uri,
    dataWindowExperimentalIdeEnabled: boolean,
    deduped: Map<string, vscode.Uri>,
): Promise<void> {
    try {
        const entries = await vscode.workspace.fs.readDirectory(root);

        for (const [name, fileType] of entries) {
            const childUri = vscode.Uri.joinPath(root, name);

            if ((fileType & vscode.FileType.Directory) !== 0) {
                await collectIdeSafePowerBuilderFiles(
                    childUri,
                    dataWindowExperimentalIdeEnabled,
                    deduped,
                );

                continue;
            }

            if (
                (fileType & vscode.FileType.File) !== 0 &&
                isIdeSafePowerBuilderUri(
                    childUri,
                    dataWindowExperimentalIdeEnabled,
                )
            ) {
                deduped.set(childUri.toString(), childUri);
            }
        }
    } catch {
        // Ignorar raíces no accesibles o que no sean directorios navegables.
    }
}