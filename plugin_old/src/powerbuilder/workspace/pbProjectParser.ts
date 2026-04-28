import * as vscode from 'vscode';
import { PbProjectDefinition, normalizeWorkspaceUriPath } from './pbProjectModel';

const APPLICATION_PATTERN = /<Application\b[^>]*Name="([^"]+)"/i;
const LIBRARIES_PATTERN = /<Libraries\b[^>]*AppEntry="([^"]*)"/i;
const LIBRARY_PATTERN = /<Library\b[^>]*Path="([^"]+)"/gi;

export class PbProjectParser {
    parseProjectDocument(
        document: vscode.TextDocument,
    ): PbProjectDefinition | undefined {
        return this.parseProjectText(
            document.uri,
            document.getText(),
        );
    }

    parseProjectText(
        uri: vscode.Uri,
        text: string,
    ): PbProjectDefinition | undefined {
        if (!this.looksLikePbProjectUri(uri)) {
            return undefined;
        }

        const projectDirectoryUri = this.getProjectDirectoryUri(uri);

        const applicationName = this.matchFirstGroup(
            text,
            APPLICATION_PATTERN,
        );

        const appEntry = this.matchFirstGroup(
            text,
            LIBRARIES_PATTERN,
        );

        const libraries = this.matchAllGroups(
            text,
            LIBRARY_PATTERN,
        );

        const appEntryUri = appEntry
            ? this.resolveProjectPath(projectDirectoryUri, appEntry)
            : undefined;

        const libraryUris = this.resolveProjectPaths(
            projectDirectoryUri,
            libraries,
        );

        return {
            uri,
            name: this.getProjectName(uri),
            projectDirectoryUri,
            applicationName: applicationName || undefined,
            appEntry: appEntry || undefined,
            appEntryUri,
            libraries,
            libraryUris,
        };
    }

    private matchFirstGroup(
        text: string,
        pattern: RegExp,
    ): string | undefined {
        const match = text.match(pattern);
        return match?.[1]?.trim();
    }

    private matchAllGroups(
        text: string,
        pattern: RegExp,
    ): string[] {
        const values: string[] = [];
        let match: RegExpExecArray | null;

        pattern.lastIndex = 0;

        while ((match = pattern.exec(text)) !== null) {
            const value = match[1]?.trim();

            if (value) {
                values.push(value);
            }
        }

        return values;
    }

    private getProjectName(uri: vscode.Uri): string {
        const path = uri.fsPath || uri.path;
        const parts = path.split(/[\\/]/);
        const fileName = parts[parts.length - 1] ?? path;

        return fileName.replace(/\.pbproj$/i, '');
    }

    private looksLikePbProjectUri(uri: vscode.Uri): boolean {
        const path = uri.fsPath || uri.path;
        return /\.pbproj$/i.test(path);
    }

    private getProjectDirectoryUri(uri: vscode.Uri): vscode.Uri {
        const normalizedPath = uri.path.replace(/\\/g, '/');
        const lastSlash = normalizedPath.lastIndexOf('/');

        return uri.with({
            path: lastSlash > 0
                ? normalizedPath.slice(0, lastSlash)
                : '/',
        });
    }

    private resolveProjectPaths(
        projectDirectoryUri: vscode.Uri,
        rawPaths: string[],
    ): vscode.Uri[] {
        const seen = new Set<string>();
        const resolved: vscode.Uri[] = [];

        for (const rawPath of rawPaths) {
            const uri = this.resolveProjectPath(projectDirectoryUri, rawPath);

            if (!uri) {
                continue;
            }

            const key = normalizeWorkspaceUriPath(uri);

            if (!seen.has(key)) {
                seen.add(key);
                resolved.push(uri);
            }
        }

        return resolved;
    }

    private resolveProjectPath(
        projectDirectoryUri: vscode.Uri,
        rawPath: string,
    ): vscode.Uri | undefined {
        const trimmed = rawPath.trim();

        if (!trimmed) {
            return undefined;
        }

        if (/^(?:[a-zA-Z]:[\\/]|\\\\)/.test(trimmed)) {
            return vscode.Uri.file(trimmed);
        }

        if (/^[\\/]/.test(trimmed)) {
            return projectDirectoryUri.with({
                path: trimmed.replace(/\\/g, '/'),
            });
        }

        const segments = trimmed
            .replace(/\\/g, '/')
            .split('/')
            .filter(segment => segment.length > 0);

        if (segments.length === 0) {
            return projectDirectoryUri;
        }

        return vscode.Uri.joinPath(projectDirectoryUri, ...segments);
    }
}