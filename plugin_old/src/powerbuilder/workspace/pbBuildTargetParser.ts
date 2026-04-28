import * as vscode from 'vscode';
import { PbBuildTargetKind, getPbBuildTargetKind } from '../build/buildTargetUtils';
import { normalizeWorkspaceUriPath } from './pbProjectModel';

type PbParsedBuildTargetKind = Exclude<PbBuildTargetKind, 'project'>;

export interface PbBuildTargetParseResult {
    uri: vscode.Uri;
    kind: PbParsedBuildTargetKind;
    referencedUris: vscode.Uri[];
}

const COMMENT_LINE_PATTERN = /^\s*(?:;|#|\/\/)/;
const SECTION_HEADER_PATTERN = /^\s*\[[^\]\r\n]+\]\s*$/;
const KEY_VALUE_PATTERN = /^\s*([A-Za-z][A-Za-z0-9_\-()[\]]*)\s*=\s*(.*?)\s*$/;
const REFERENCE_TOKEN_PATTERN = /"([^"\r\n]+\.(?:pbproj|pbw|pbsln|pbt))"|'([^'\r\n]+\.(?:pbproj|pbw|pbsln|pbt))'|((?:[a-zA-Z]:[\\/]|\\\\|\/|\.\.?[\\/])?[^\s"'=;,\r\n]+\.(?:pbproj|pbw|pbsln|pbt))/gi;

const ALLOWED_REFERENCE_KINDS: Record<PbParsedBuildTargetKind, readonly PbBuildTargetKind[]> = {
    solution: ['project', 'workspace', 'target-file'],
    workspace: ['project', 'target-file'],
    'target-file': ['project'],
};

const ALLOWED_REFERENCE_KEY_PATTERNS: Record<PbParsedBuildTargetKind, readonly RegExp[]> = {
    solution: [
        /^project(?:\d+|\[[^\]]+\]|\([^)]+\))?$/i,
        /^workspace(?:\d+|\[[^\]]+\]|\([^)]+\))?$/i,
        /^target(?:\d+|\[[^\]]+\]|\([^)]+\))?$/i,
    ],
    workspace: [
        /^project(?:\d+|\[[^\]]+\]|\([^)]+\))?$/i,
        /^target(?:\d+|\[[^\]]+\]|\([^)]+\))?$/i,
    ],
    'target-file': [
        /^project(?:\d+|\[[^\]]+\]|\([^)]+\))?$/i,
    ],
};

const ALLOWED_SECTION_NAMES: Record<PbParsedBuildTargetKind, readonly string[]> = {
    solution: ['solution'],
    workspace: ['workspace'],
    'target-file': ['target'],
};

export class PbBuildTargetParser {
    parseTargetText(
        uri: vscode.Uri,
        text: string,
    ): PbBuildTargetParseResult | undefined {
        const kind = getPbBuildTargetKind(uri);

        if (!kind || kind === 'project') {
            return undefined;
        }

        const targetDirectoryUri = this.getTargetDirectoryUri(uri);
        const referencedUris: vscode.Uri[] = [];
        const seen = new Set<string>();
        let currentSection: string | undefined;
        let hasExplicitSections = false;

        for (const line of text.split(/\r?\n/)) {
            const sectionName = this.tryParseSectionName(line);

            if (sectionName !== undefined) {
                hasExplicitSections = true;
                currentSection = sectionName;
                continue;
            }

            const rawReference = this.extractDeclaredReferenceValue(
                kind,
                line,
                hasExplicitSections ? currentSection : undefined,
            );

            if (!rawReference) {
                continue;
            }

            const referencedUri = this.resolveTargetPath(targetDirectoryUri, rawReference);

            if (!referencedUri || referencedUri.toString() === uri.toString()) {
                continue;
            }

            const referencedKind = getPbBuildTargetKind(referencedUri);

            if (!referencedKind || !ALLOWED_REFERENCE_KINDS[kind].includes(referencedKind)) {
                continue;
            }

            const referenceKey = normalizeWorkspaceUriPath(referencedUri);

            if (seen.has(referenceKey)) {
                continue;
            }

            seen.add(referenceKey);
            referencedUris.push(referencedUri);
        }

        return {
            uri,
            kind,
            referencedUris,
        };
    }

    private extractDeclaredReferenceValue(
        kind: PbParsedBuildTargetKind,
        line: string,
        currentSection?: string,
    ): string | undefined {
        if (COMMENT_LINE_PATTERN.test(line) || SECTION_HEADER_PATTERN.test(line)) {
            return undefined;
        }

        if (currentSection && !ALLOWED_SECTION_NAMES[kind].includes(currentSection)) {
            return undefined;
        }

        const keyValueMatch = KEY_VALUE_PATTERN.exec(line);

        if (!keyValueMatch) {
            return undefined;
        }

        const key = keyValueMatch[1].trim();

        if (!ALLOWED_REFERENCE_KEY_PATTERNS[kind].some(pattern => pattern.test(key))) {
            return undefined;
        }

        REFERENCE_TOKEN_PATTERN.lastIndex = 0;
        const match = REFERENCE_TOKEN_PATTERN.exec(keyValueMatch[2]);

        return match
            ? (match[1] ?? match[2] ?? match[3])
            : undefined;
    }

    private tryParseSectionName(line: string): string | undefined {
        const sectionMatch = SECTION_HEADER_PATTERN.exec(line);

        if (!sectionMatch) {
            return undefined;
        }

        return line
            .trim()
            .slice(1, -1)
            .trim()
            .toLowerCase();
    }

    private getTargetDirectoryUri(uri: vscode.Uri): vscode.Uri {
        const normalizedPath = uri.path.replace(/\\/g, '/');
        const lastSlash = normalizedPath.lastIndexOf('/');

        return uri.with({
            path: lastSlash > 0
                ? normalizedPath.slice(0, lastSlash)
                : '/',
        });
    }

    private resolveTargetPath(
        targetDirectoryUri: vscode.Uri,
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
            return targetDirectoryUri.with({
                path: trimmed.replace(/\\/g, '/'),
            });
        }

        const segments = trimmed
            .replace(/\\/g, '/')
            .split('/')
            .filter(segment => segment.length > 0);

        if (segments.length === 0) {
            return targetDirectoryUri;
        }

        return vscode.Uri.joinPath(targetDirectoryUri, ...segments);
    }
}