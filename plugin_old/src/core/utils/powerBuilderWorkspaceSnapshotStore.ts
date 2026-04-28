import * as vscode from 'vscode';
import { PB_LANGUAGE_ID } from '../config/constants';

interface CachedSnapshotEntry {
    document: vscode.TextDocument;
    mtime: number;
    size: number;
}

interface LineInfo {
    readonly text: string;
    readonly startOffset: number;
    readonly endOffset: number;
}

export class PowerBuilderWorkspaceSnapshotStore {
    private static instance: PowerBuilderWorkspaceSnapshotStore;

    private readonly cache = new Map<string, CachedSnapshotEntry>();
    private readonly textDecoder = new TextDecoder('utf-8');

    static getInstance(): PowerBuilderWorkspaceSnapshotStore {
        if (!PowerBuilderWorkspaceSnapshotStore.instance) {
            PowerBuilderWorkspaceSnapshotStore.instance = new PowerBuilderWorkspaceSnapshotStore();
        }

        return PowerBuilderWorkspaceSnapshotStore.instance;
    }

    async getSnapshot(uri: vscode.Uri): Promise<vscode.TextDocument | undefined> {
        const openDocument = this.findOpenDocument(uri);

        if (openDocument) {
            return openDocument;
        }

        const key = uri.toString();
        const cached = this.cache.get(key);

        if (cached) {
            const currentStat = await this.getFileStat(uri);

            if (!currentStat) {
                this.cache.delete(key);
                return undefined;
            }

            if (
                cached.mtime === currentStat.mtime &&
                cached.size === currentStat.size
            ) {
                return cached.document;
            }
        }

        try {
            const fileStat = await this.getFileStat(uri);

            if (!fileStat) {
                return undefined;
            }

            const bytes = await vscode.workspace.fs.readFile(uri);
            const document = createSnapshotDocument(
                uri,
                this.textDecoder.decode(bytes),
            );

            this.cache.set(key, {
                document,
                mtime: fileStat.mtime,
                size: fileStat.size,
            });
            return document;
        } catch {
            return undefined;
        }
    }

    invalidate(uri: vscode.Uri): void {
        this.cache.delete(uri.toString());
    }

    getCacheEntryCount(): number {
        return this.cache.size;
    }

    getCacheEntries(): ReadonlyArray<{
        uri: vscode.Uri;
        mtime: number;
        size: number;
        lineCount: number;
    }> {
        return [...this.cache.values()]
            .map(entry => ({
                uri: entry.document.uri,
                mtime: entry.mtime,
                size: entry.size,
                lineCount: entry.document.lineCount,
            }))
            .sort((left, right) => left.uri.toString().localeCompare(right.uri.toString()));
    }

    clear(): void {
        this.cache.clear();
    }

    private findOpenDocument(uri: vscode.Uri): vscode.TextDocument | undefined {
        const key = uri.toString();

        return vscode.workspace.textDocuments.find(document =>
            document.uri.toString() === key,
        );
    }

    private async getFileStat(uri: vscode.Uri): Promise<vscode.FileStat | undefined> {
        try {
            return await vscode.workspace.fs.stat(uri);
        } catch {
            return undefined;
        }
    }
}

function createSnapshotDocument(
    uri: vscode.Uri,
    text: string,
): vscode.TextDocument {
    const lineInfos = buildLineInfos(text);

    return {
        uri,
        languageId: PB_LANGUAGE_ID,
        lineCount: lineInfos.length,
        isClosed: false,
        isDirty: false,
        eol: text.includes('\r\n')
            ? vscode.EndOfLine.CRLF
            : vscode.EndOfLine.LF,
        fileName: uri.fsPath || uri.path,
        getText: (range?: vscode.Range) => {
            if (!range) {
                return text;
            }

            const startOffset = offsetAt(range.start, lineInfos, text.length);
            const endOffset = offsetAt(range.end, lineInfos, text.length);
            return text.slice(startOffset, endOffset);
        },
        lineAt: (lineOrPosition: number | vscode.Position) => {
            const line = typeof lineOrPosition === 'number'
                ? lineOrPosition
                : lineOrPosition.line;
            const lineInfo = lineInfos[line];

            if (!lineInfo) {
                throw new RangeError(`Line ${line} is out of range`);
            }

            return {
                lineNumber: line,
                text: lineInfo.text,
                range: new vscode.Range(
                    new vscode.Position(line, 0),
                    new vscode.Position(line, lineInfo.text.length),
                ),
                rangeIncludingLineBreak: new vscode.Range(
                    new vscode.Position(line, 0),
                    positionAt(lineInfo.endOffset, lineInfos, text.length),
                ),
                firstNonWhitespaceCharacterIndex: lineInfo.text.search(/\S|$/),
                isEmptyOrWhitespace: lineInfo.text.trim().length === 0,
            } as vscode.TextLine;
        },
        offsetAt: (position: vscode.Position) => offsetAt(position, lineInfos, text.length),
        positionAt: (offset: number) => positionAt(offset, lineInfos, text.length),
        save: async () => false,
        validateRange: (range: vscode.Range) => new vscode.Range(
            clampPosition(range.start, lineInfos),
            clampPosition(range.end, lineInfos),
        ),
        validatePosition: (position: vscode.Position) => clampPosition(position, lineInfos),
    } as unknown as vscode.TextDocument;
}

function buildLineInfos(text: string): LineInfo[] {
    const normalizedLines = text.split(/\r?\n/);
    const infos: LineInfo[] = [];
    let searchOffset = 0;

    for (const lineText of normalizedLines) {
        const startOffset = searchOffset;
        const endOffset = startOffset + lineText.length;
        infos.push({
            text: lineText,
            startOffset,
            endOffset,
        });

        searchOffset = endOffset;

        if (searchOffset < text.length) {
            if (text.startsWith('\r\n', searchOffset)) {
                searchOffset += 2;
            } else if (text[searchOffset] === '\n') {
                searchOffset += 1;
            }
        }
    }

    if (infos.length === 0) {
        infos.push({
            text: '',
            startOffset: 0,
            endOffset: 0,
        });
    }

    return infos;
}

function offsetAt(
    position: vscode.Position,
    lineInfos: readonly LineInfo[],
    textLength: number,
): number {
    const line = Math.max(0, Math.min(position.line, lineInfos.length - 1));
    const lineInfo = lineInfos[line];
    const character = Math.max(0, Math.min(position.character, lineInfo.text.length));
    return Math.min(lineInfo.startOffset + character, textLength);
}

function positionAt(
    offset: number,
    lineInfos: readonly LineInfo[],
    textLength: number,
): vscode.Position {
    const clampedOffset = Math.max(0, Math.min(offset, textLength));

    for (let index = lineInfos.length - 1; index >= 0; index--) {
        const lineInfo = lineInfos[index];

        if (clampedOffset >= lineInfo.startOffset) {
            const character = Math.min(
                clampedOffset - lineInfo.startOffset,
                lineInfo.text.length,
            );
            return new vscode.Position(index, character);
        }
    }

    return new vscode.Position(0, 0);
}

function clampPosition(
    position: vscode.Position,
    lineInfos: readonly LineInfo[],
): vscode.Position {
    const line = Math.max(0, Math.min(position.line, lineInfos.length - 1));
    const character = Math.max(
        0,
        Math.min(position.character, lineInfos[line].text.length),
    );

    return new vscode.Position(line, character);
}