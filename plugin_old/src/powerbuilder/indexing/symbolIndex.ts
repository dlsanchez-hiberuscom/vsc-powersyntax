import * as vscode from 'vscode';
import { PbSymbol } from '../models/pbSymbol';
import { PbDocumentParser } from '../parsing/pbDocumentParser';
import {
    PowerScriptDocumentModelCache,
    getDocumentVersionKey,
} from '../document/powerScriptDocumentModel';
import { PowerBuilderWorkspaceSnapshotStore } from '../workspace/powerBuilderWorkspaceSnapshotStore';

export interface IndexDocumentOptions {
    silent?: boolean;
}

interface CachedDocumentSymbols {
    versionKey: string;
    symbols: PbSymbol[];
}

export class SymbolIndex {
    private static instance: SymbolIndex;

    private readonly fileSymbols = new Map<string, PbSymbol[]>();
    private readonly parser = new PbDocumentParser();
    private readonly documentModelCache = PowerScriptDocumentModelCache.getInstance();
    private readonly snapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance();
    private readonly parsedDocumentCache = new Map<string, CachedDocumentSymbols>();

    private readonly onDidChangeEmitter = new vscode.EventEmitter<void>();
    readonly onDidChange = this.onDidChangeEmitter.event;

    private initialWorkspaceIndexingStarted = false;
    private initialWorkspaceIndexingCompleted = false;

    private batchDepth = 0;
    private hasPendingChange = false;

    static getInstance(): SymbolIndex {
        if (!SymbolIndex.instance) {
            SymbolIndex.instance = new SymbolIndex();
        }

        return SymbolIndex.instance;
    }

    markInitialWorkspaceIndexingStarted(): void {
        this.initialWorkspaceIndexingStarted = true;
        this.initialWorkspaceIndexingCompleted = false;
        this.notifyChanged();
    }

    markInitialWorkspaceIndexingCompleted(): void {
        this.initialWorkspaceIndexingStarted = true;
        this.initialWorkspaceIndexingCompleted = true;
        this.notifyChanged();
    }

    get isInitialWorkspaceIndexing(): boolean {
        return (
            this.initialWorkspaceIndexingStarted &&
            !this.initialWorkspaceIndexingCompleted
        );
    }

    get hasCompletedInitialWorkspaceIndexing(): boolean {
        return this.initialWorkspaceIndexingCompleted;
    }

    beginBatchUpdate(): void {
        this.batchDepth++;
    }

    endBatchUpdate(): void {
        if (this.batchDepth > 0) {
            this.batchDepth--;
        }

        if (this.batchDepth === 0 && this.hasPendingChange) {
            this.hasPendingChange = false;
            this.onDidChangeEmitter.fire();
        }
    }

    indexDocument(
        document: vscode.TextDocument,
        options: IndexDocumentOptions = {},
    ): PbSymbol[] {
        const cacheKey = document.uri.toString();
        const versionKey = getDocumentVersionKey(document);
        const cached = this.parsedDocumentCache.get(cacheKey);

        if (cached && cached.versionKey === versionKey) {
            this.fileSymbols.set(cacheKey, cached.symbols);

            if (!options.silent) {
                this.notifyChanged();
            }

            return cached.symbols;
        }

        const symbols = this.parser.parse(document);

        this.fileSymbols.set(cacheKey, symbols);
        this.parsedDocumentCache.set(cacheKey, {
            versionKey,
            symbols,
        });

        if (!options.silent) {
            this.notifyChanged();
        }

        return symbols;
    }

    indexFromUri(uri: vscode.Uri, text: string): PbSymbol[] {
        const lines = text.split(/\r?\n/);

        const fakeDocument = {
            uri,
            version: 0,
            getText: () => text,
            lineAt: (line: number) => ({ text: lines[line] ?? '' }),
            lineCount: lines.length,
            languageId: 'powerbuilder',
        } as unknown as vscode.TextDocument;

        return this.indexDocument(fakeDocument);
    }

    removeFile(uri: vscode.Uri): void {
        const key = uri.toString();
        this.parsedDocumentCache.delete(key);
        this.documentModelCache.invalidate(uri);
        this.snapshotStore.invalidate(uri);

        if (this.fileSymbols.delete(key)) {
            this.notifyChanged();
        }
    }

    getSymbolsForFile(uri: vscode.Uri): PbSymbol[] {
        return this.fileSymbols.get(uri.toString()) ?? [];
    }

    getAllSymbols(): PbSymbol[] {
        const all: PbSymbol[] = [];

        for (const symbols of this.fileSymbols.values()) {
            all.push(...symbols);
        }

        return all;
    }

    getIndexedUris(): vscode.Uri[] {
        return Array.from(this.fileSymbols.keys()).map(key => vscode.Uri.parse(key));
    }

    findSymbolByName(name: string): PbSymbol[] {
        const normalizedName = this.normalize(name);

        return this.getAllSymbols().filter(
            symbol => this.normalize(symbol.name) === normalizedName,
        );
    }

    findSymbolCandidates(name: string): PbSymbol[] {
        return this.findSymbolByName(name);
    }

    findImplementationSymbols(name: string): PbSymbol[] {
        return this.findSymbolByName(name).filter(symbol => !symbol.isPrototype);
    }

    findSymbolsAtPosition(uri: vscode.Uri, position: vscode.Position): PbSymbol[] {
        return this.getSymbolsForFile(uri)
            .filter(symbol => symbol.range.contains(position))
            .sort((left, right) => this.compareByNesting(left, right));
    }

    findInnermostCallableAtPosition(
        uri: vscode.Uri,
        position: vscode.Position,
    ): PbSymbol | undefined {
        return this.findSymbolsAtPosition(uri, position).find(symbol =>
            symbol.kind === 'function' ||
            symbol.kind === 'global-function' ||
            symbol.kind === 'subroutine' ||
            symbol.kind === 'event',
        );
    }

    findInnermostTypeAtPosition(
        uri: vscode.Uri,
        position: vscode.Position,
    ): PbSymbol | undefined {
        return this.findSymbolsAtPosition(uri, position).find(symbol =>
            symbol.kind === 'type' || symbol.kind === 'structure',
        );
    }

    findPreferredSymbols(name: string, uri: vscode.Uri): PbSymbol[] {
        const candidates = this.findSymbolCandidates(name);
        const currentFileObjectName = this.getPrimaryFileObjectName(uri);

        return this.uniqueSymbols(candidates).sort((left, right) => {
            return (
                this.getSymbolScore(right, uri, currentFileObjectName) -
                this.getSymbolScore(left, uri, currentFileObjectName)
            ) || this.compareByPosition(left, right);
        });
    }

    findBestSymbol(name: string, uri: vscode.Uri): PbSymbol | undefined {
        return this.findPreferredSymbols(name, uri)[0];
    }

    getPrimaryFileObjectName(uri: vscode.Uri): string | undefined {
        const rootSymbol = this.getPrimaryFileObjectSymbol(uri);

        if (rootSymbol) {
            return rootSymbol.name;
        }

        const fallbackType = this.getSymbolsForFile(uri).find(symbol =>
            (symbol.kind === 'type' || symbol.kind === 'structure') &&
            !symbol.parent,
        );

        return fallbackType?.name;
    }

    getPrimaryFileObjectSymbol(uri: vscode.Uri): PbSymbol | undefined {
        const symbols = this.getSymbolsForFile(uri);

        return symbols.find(symbol =>
            symbol.containerKind === 'file-object' &&
            (symbol.kind === 'type' || symbol.kind === 'structure') &&
            !symbol.parent,
        );
    }

    getAncestorTypeNames(uri: vscode.Uri): string[] {
        const rootSymbol = this.getPrimaryFileObjectSymbol(uri);

        if (!rootSymbol?.baseTypeName) {
            return [];
        }

        const queue = [rootSymbol.baseTypeName];
        const seen = new Set<string>();
        const result: string[] = [];

        while (queue.length > 0) {
            const current = queue.shift();
            const normalizedCurrent = this.normalize(current ?? '');

            if (!normalizedCurrent || seen.has(normalizedCurrent)) {
                continue;
            }

            seen.add(normalizedCurrent);
            result.push(current!);

            const matchingBaseTypes = this.findSymbolByName(current!).filter(symbol =>
                (symbol.kind === 'type' || symbol.kind === 'structure') &&
                !symbol.parent,
            );

            for (const matchingBaseType of matchingBaseTypes) {
                if (matchingBaseType.baseTypeName) {
                    queue.push(matchingBaseType.baseTypeName);
                }
            }
        }

        return result;
    }

    searchSymbols(query: string): PbSymbol[] {
        const normalizedQuery = this.normalize(query);

        return this.getAllSymbols().filter(symbol =>
            this.normalize(symbol.name).includes(normalizedQuery),
        );
    }

    clear(): void {
        const hadState =
            this.fileSymbols.size > 0 ||
            this.parsedDocumentCache.size > 0 ||
            this.initialWorkspaceIndexingStarted ||
            this.initialWorkspaceIndexingCompleted;

        if (!hadState) {
            return;
        }

        this.fileSymbols.clear();
        this.parsedDocumentCache.clear();
        this.documentModelCache.clear();
        this.snapshotStore.clear();
        this.initialWorkspaceIndexingStarted = false;
        this.initialWorkspaceIndexingCompleted = false;
        this.notifyChanged();
    }

    get fileCount(): number {
        return this.fileSymbols.size;
    }

    get symbolCount(): number {
        let count = 0;

        for (const symbols of this.fileSymbols.values()) {
            count += symbols.length;
        }

        return count;
    }

    private getSymbolScore(
        symbol: PbSymbol,
        currentUri: vscode.Uri,
        currentFileObjectName: string | undefined,
    ): number {
        let score = 0;

        if (symbol.uri.toString() === currentUri.toString()) {
            score += 1000;
        }

        if (!symbol.isPrototype) {
            score += 200;
        }

        if (
            currentFileObjectName &&
            symbol.parent &&
            this.normalize(symbol.parent) === this.normalize(currentFileObjectName)
        ) {
            score += 50;
        }

        if (
            currentFileObjectName &&
            symbol.fileObjectName &&
            this.normalize(symbol.fileObjectName) === this.normalize(currentFileObjectName)
        ) {
            score += 25;
        }

        if (symbol.implementationKind === 'on-handler') {
            score += 10;
        }

        if (symbol.implementationKind === 'qualified-event') {
            score += 8;
        }

        if (
            symbol.kind === 'function' ||
            symbol.kind === 'subroutine' ||
            symbol.kind === 'event' ||
            symbol.kind === 'global-function'
        ) {
            score += 5;
        }

        return score;
    }

    private uniqueSymbols(symbols: PbSymbol[]): PbSymbol[] {
        const seen = new Set<string>();
        const result: PbSymbol[] = [];

        for (const symbol of symbols) {
            const key = [
                symbol.uri.toString(),
                symbol.name.toLowerCase(),
                symbol.kind,
                symbol.parent ?? '',
                symbol.range.start.line,
                symbol.range.start.character,
                symbol.range.end.line,
                symbol.range.end.character,
                symbol.signature ?? '',
                symbol.containerSignature ?? '',
                symbol.declarationScope ?? '',
                symbol.baseTypeName ?? '',
                symbol.isPrototype ? 'prototype' : 'implementation',
                symbol.implementationKind ?? '',
                symbol.ownerName ?? '',
                symbol.isExternal ? 'external' : 'internal',
                symbol.externalLibraryName ?? '',
                symbol.externalName ?? '',
            ].join('|');

            if (!seen.has(key)) {
                seen.add(key);
                result.push(symbol);
            }
        }

        return result;
    }

    private compareByPosition(left: PbSymbol, right: PbSymbol): number {
        const uriComparison = left.uri.toString().localeCompare(right.uri.toString());

        if (uriComparison !== 0) {
            return uriComparison;
        }

        if (left.range.start.line !== right.range.start.line) {
            return left.range.start.line - right.range.start.line;
        }

        return left.range.start.character - right.range.start.character;
    }

    private compareByNesting(left: PbSymbol, right: PbSymbol): number {
        const leftSpan = this.getRangeSpan(left.range);
        const rightSpan = this.getRangeSpan(right.range);

        if (leftSpan !== rightSpan) {
            return leftSpan - rightSpan;
        }

        return this.compareByPosition(left, right);
    }

    private getRangeSpan(range: vscode.Range): number {
        const lineSpan = range.end.line - range.start.line;
        const characterSpan = range.end.character - range.start.character;
        return (lineSpan * 100000) + characterSpan;
    }

    private normalize(value: string): string {
        return value.trim().toLowerCase();
    }

    private notifyChanged(): void {
        if (this.batchDepth > 0) {
            this.hasPendingChange = true;
            return;
        }

        this.onDidChangeEmitter.fire();
    }
}