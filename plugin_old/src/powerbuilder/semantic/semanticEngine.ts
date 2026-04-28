import * as vscode from 'vscode';
import {
    CompletionContext,
    getCompletionContextAtPosition,
    getSymbolContextAtPosition,
    SymbolContext,
} from '../document/documentUtils';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbSymbol } from '../models/pbSymbol';
import { PbLibraryGraph } from '../workspace/pbLibraryGraph';
import {
    getImplicitOwnerNamesAtPosition,
    getNormalizedOwnerNames,
    symbolMatchesOwnerNames,
} from './owners/ownerResolution';
import {
    getLogicalSymbolKey,
} from './occurrences/occurrenceMatching';
import {
    filterSymbolsToPreferredProject,
    getContainingCallableSymbol,
    isCallableScopedSymbol,
    resolvePreferredSymbols,
} from './ranking';
import {
    filterSymbolsVisibleFromPosition,
    getMemberVariableScope,
    isMemberVariableSymbol,
} from './visibility/symbolVisibility';
import { getInheritanceGraph } from './inheritanceGraph';
import {
    resolveOwnerTypeNamesAtPosition,
    resolveSystemMemberAtPosition,
} from './binding/systemMemberBinding';
import {
    SemanticReferenceQueryResult,
    SemanticRenamePlan,
    SemanticRenameTarget,
} from './occurrences/contracts';
import { PbSystemSymbolEntry } from '../knowledge/types';
import { PbSemanticResolutionContext } from './semanticContext';
import {
    SemanticOccurrenceEngine,
} from './semanticOccurrences';

export interface SemanticResolutionResult {
    context?: SymbolContext;
    symbols: PbSymbol[];
}

export interface SemanticCompletionResult {
    context?: CompletionContext;
    symbols: PbSymbol[];
}

interface OwnerResolutionContext {
    qualifiedOwner?: string;
    qualifiedOwnerExpression?: string;
    qualifier?: '.' | '::';
    isDynamicDispatch?: boolean;
    dynamicDispatchKind?: 'function' | 'event';
    isAncestorControlCall?: boolean;
}

interface CompletionRankingContext {
    ownerNames: readonly string[];
    uri: vscode.Uri;
    position: vscode.Position;
    currentCallable?: PbSymbol;
}

export class SemanticEngine {
    private readonly libraryGraph = PbLibraryGraph.getInstance();
    private readonly occurrenceEngine: SemanticOccurrenceEngine;

    constructor(private readonly index: SymbolIndex) {
        this.occurrenceEngine = new SemanticOccurrenceEngine(index);
    }

    async findReferences(
        word: string,
        uri: vscode.Uri,
        includeDeclaration: boolean,
        symbolContext?: PbSemanticResolutionContext,
    ): Promise<SemanticReferenceQueryResult> {
        return this.occurrenceEngine.findReferences({
            word,
            uri,
            includeDeclaration,
            symbolContext,
        });
    }

    resolveRenameTarget(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
    ): SemanticRenameTarget | undefined {
        return this.occurrenceEngine.resolveRenameTarget(
            word,
            uri,
            symbolContext,
        );
    }

    async planRename(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
    ): Promise<SemanticRenamePlan | undefined> {
        return this.occurrenceEngine.planRename(
            word,
            uri,
            symbolContext,
        );
    }

    resolvePreferredSymbols(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
    ): PbSymbol[] {
        return resolvePreferredSymbols({
            index: this.index,
            libraryGraph: this.libraryGraph,
            word,
            uri,
            symbolContext,
        });
    }

    resolveSafePrimarySymbol(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
    ): PbSymbol | undefined {
        const candidates = this.resolvePreferredSymbols(
            word,
            uri,
            symbolContext,
        );

        if (candidates.length === 0) {
            return undefined;
        }

        if (this.hasSinglePrimaryCandidate(candidates)) {
            return candidates[0];
        }

        if (symbolContext?.range?.start) {
            const position = symbolContext.range.start;
            const currentCallable = this.index.findInnermostCallableAtPosition(uri, position);

            if (currentCallable) {
                const scopedCandidates = candidates.filter(symbol =>
                    this.isSymbolAccessibleInCallable(symbol, uri, currentCallable),
                );
                if (this.hasSinglePrimaryCandidate(scopedCandidates)) {
                    return scopedCandidates[0];
                }
            }

            const implicitOwnerNames = getImplicitOwnerNamesAtPosition(
                this.index,
                uri,
                position,
            );
            const memberCandidates = candidates.filter(symbol =>
                !isCallableScopedSymbol(symbol) &&
                symbolMatchesOwnerNames(symbol, implicitOwnerNames),
            );
            if (this.hasSinglePrimaryCandidate(memberCandidates)) {
                return memberCandidates[0];
            }
        }

        return undefined;
    }

    resolveAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): SemanticResolutionResult {
        const context = getSymbolContextAtPosition(document, position);

        if (!context) {
            return { symbols: [] };
        }

        return {
            context,
            symbols: this.resolvePreferredSymbols(
                context.word,
                document.uri,
                {
                    ...context,
                    range: context.range,
                },
            ),
        };
    }

    resolveCompletionAtPosition(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): SemanticCompletionResult {
        const context = getCompletionContextAtPosition(document, position);
        const projectSymbols = filterSymbolsToPreferredProject(
            this.index.getAllSymbols(),
            this.libraryGraph,
            document.uri,
        );

        if (!context) {
            return {
                symbols: this.orderCompletionSymbols(projectSymbols, ''),
            };
        }

        if (context.isDynamicDispatch || context.isAncestorControlCall) {
            return {
                context,
                symbols: [],
            };
        }

        const orderedSymbols = context.isQualifiedAccess
            ? this.collectQualifiedCompletionSymbols(document.uri, position, context, projectSymbols)
            : this.collectUnqualifiedCompletionSymbols(document.uri, position, projectSymbols);

        return {
            context,
            symbols: this.orderCompletionSymbols(orderedSymbols, context.word),
        };
    }

    resolveOwnerNamesAtPosition(
        uri: vscode.Uri,
        position: vscode.Position,
        context?: OwnerResolutionContext,
    ): string[] {
        return resolveOwnerTypeNamesAtPosition({
            index: this.index,
            uri,
            position,
            context,
        });
    }

    resolveSystemMemberForPosition(
        word: string,
        uri: vscode.Uri,
        position: vscode.Position,
        context?: OwnerResolutionContext,
    ): PbSystemSymbolEntry | undefined {
        return resolveSystemMemberAtPosition({
            index: this.index,
            word,
            uri,
            position,
            context,
        });
    }

    matchesSystemMemberAt(
        document: vscode.TextDocument,
        position: vscode.Position,
        targetEntry: PbSystemSymbolEntry,
    ): boolean {
        const context = getSymbolContextAtPosition(document, position);

        if (!context) {
            return false;
        }

        const entry = this.resolveSystemMemberForPosition(
            context.word,
            document.uri,
            position,
            context,
        );

        if (!entry) {
            return false;
        }

        return this.getSystemEntryKey(entry) === this.getSystemEntryKey(targetEntry);
    }

    matchesTargetSymbolsAt(
        document: vscode.TextDocument,
        position: vscode.Position,
        targetSymbols: PbSymbol[],
    ): boolean {
        if (targetSymbols.length === 0) {
            return false;
        }

        const targetKeys = new Set(
            targetSymbols.map(symbol => getLogicalSymbolKey(symbol)),
        );
        const resolution = this.resolveAtPosition(document, position);

        return resolution.symbols.some(symbol =>
            targetKeys.has(getLogicalSymbolKey(symbol)),
        );
    }

    private collectQualifiedCompletionSymbols(
        uri: vscode.Uri,
        position: vscode.Position,
        context: CompletionContext,
        symbols: PbSymbol[],
    ): PbSymbol[] {
        const ownerNames = context.qualifiedOwner
            ? this.resolveOwnerNamesAtPosition(uri, position, context)
            : [];

        if (ownerNames.length === 0) {
            return [];
        }

        const visibleSymbols = filterSymbolsVisibleFromPosition(
            symbols,
            this.index,
            uri,
            position,
        );
        const matchingSymbols = visibleSymbols.filter(symbol => {
            if (isCallableScopedSymbol(symbol)) {
                return false;
            }

            if (!symbolMatchesOwnerNames(symbol, ownerNames)) {
                return false;
            }

            if (context.qualifier === '::') {
                return symbol.kind === 'event'
                    || symbol.kind === 'function'
                    || symbol.kind === 'global-function'
                    || symbol.kind === 'subroutine';
            }

            return true;
        });

        return this.prioritizeCompletionSymbols(matchingSymbols, {
            ownerNames,
            uri,
            position,
        });
    }

    private collectUnqualifiedCompletionSymbols(
        uri: vscode.Uri,
        position: vscode.Position,
        symbols: PbSymbol[],
    ): PbSymbol[] {
        const currentCallable = this.index.findInnermostCallableAtPosition(uri, position);
        const visibleSymbols = filterSymbolsVisibleFromPosition(
            symbols,
            this.index,
            uri,
            position,
        );
        const callableSymbols = currentCallable
            ? symbols.filter(symbol =>
                this.isSymbolAccessibleInCallable(symbol, uri, currentCallable),
            )
            : [];
        const implicitOwnerNames = getImplicitOwnerNamesAtPosition(
            this.index,
            uri,
            position,
        );
        const memberSymbols = visibleSymbols.filter(symbol =>
            !isCallableScopedSymbol(symbol) &&
            symbolMatchesOwnerNames(symbol, implicitOwnerNames),
        );
        const globalSymbols = visibleSymbols.filter(symbol =>
            this.isGlobalCompletionSymbol(symbol),
        );
        const typeSymbols = visibleSymbols.filter(symbol =>
            symbol.kind === 'type' || symbol.kind === 'structure',
        );

        return this.prioritizeCompletionSymbols([
            ...callableSymbols,
            ...memberSymbols,
            ...globalSymbols,
            ...typeSymbols,
            ...visibleSymbols,
        ], {
            ownerNames: implicitOwnerNames,
            uri,
            position,
            currentCallable,
        });
    }

    private orderCompletionSymbols(
        symbols: PbSymbol[],
        word: string,
    ): PbSymbol[] {
        const prefix = word.trim().toLowerCase();
        const deduped = this.dedupeCompletionSymbols(symbols);
        const filtered = prefix
            ? deduped.filter(symbol =>
                symbol.name.toLowerCase().includes(prefix),
            )
            : deduped;
        const startsWith = filtered.filter(symbol =>
            !prefix || symbol.name.toLowerCase().startsWith(prefix),
        );
        const contains = filtered.filter(symbol =>
            prefix && !symbol.name.toLowerCase().startsWith(prefix),
        );

        return prefix
            ? [...startsWith, ...contains]
            : filtered;
    }

    private dedupeCompletionSymbols(symbols: PbSymbol[]): PbSymbol[] {
        const map = new Map<string, PbSymbol>();

        for (const symbol of symbols) {
            const key = this.getCompletionFamilyKey(symbol);
            const existing = map.get(key);

            if (!existing) {
                map.set(key, symbol);
                continue;
            }

            if (existing.isPrototype && !symbol.isPrototype) {
                map.set(key, symbol);
                continue;
            }

            if (
                existing.implementationKind !== 'implementation' &&
                symbol.implementationKind === 'implementation'
            ) {
                map.set(key, symbol);
            }
        }

        return Array.from(map.values());
    }

    private prioritizeCompletionSymbols(
        symbols: PbSymbol[],
        context: CompletionRankingContext,
    ): PbSymbol[] {
        return [...symbols].sort((left, right) => {
            const scoreDifference =
                this.getCompletionScore(right, context) - this.getCompletionScore(left, context);

            if (scoreDifference !== 0) {
                return scoreDifference;
            }

            return this.compareCompletionPosition(left, right);
        });
    }

    private getCompletionScore(
        symbol: PbSymbol,
        context: CompletionRankingContext,
    ): number {
        let score = 0;

        if (context.currentCallable && this.isSymbolAccessibleInCallable(symbol, context.uri, context.currentCallable)) {
            score += symbol.declarationScope === 'local'
                ? 12000
                : 11500;
        }

        if (
            context.ownerNames.length > 0 &&
            !isCallableScopedSymbol(symbol) &&
            symbolMatchesOwnerNames(symbol, context.ownerNames)
        ) {
            score += 8000;

            const ownerDistance = this.getCompletionOwnerDistance(symbol, context.ownerNames);

            if (Number.isFinite(ownerDistance)) {
                score += Math.max(0, 1000 - (ownerDistance * 75));
            }

            if (isMemberVariableSymbol(symbol)) {
                const scope = getMemberVariableScope(symbol);
                score += scope === 'shared'
                    ? 225
                    : scope === 'global'
                        ? 150
                        : 75;
            }
        }

        if (symbol.uri.toString() === context.uri.toString()) {
            score += 100;
        }

        if (symbol.implementationKind === 'implementation') {
            score += 20;
        }

        if (!symbol.isPrototype) {
            score += 10;
        }

        if (this.isGlobalCompletionSymbol(symbol)) {
            score += 25;
        }

        return score;
    }

    private getCompletionOwnerDistance(
        symbol: PbSymbol,
        ownerNames: readonly string[],
    ): number {
        const inheritanceGraph = getInheritanceGraph(this.index);
        const symbolOwnerNames = getNormalizedOwnerNames(symbol);
        let bestDistance = Number.POSITIVE_INFINITY;

        for (const ownerName of ownerNames) {
            for (const symbolOwnerName of symbolOwnerNames) {
                const distance = inheritanceGraph.getTypeDistance(ownerName, symbolOwnerName);

                if (distance < bestDistance) {
                    bestDistance = distance;
                }
            }
        }

        return bestDistance;
    }

    private getCompletionFamilyKey(symbol: PbSymbol): string {
        return [
            symbol.name.toLowerCase(),
            symbol.kind,
        ].join('|');
    }

    private compareCompletionPosition(left: PbSymbol, right: PbSymbol): number {
        const uriComparison = left.uri.toString().localeCompare(right.uri.toString());

        if (uriComparison !== 0) {
            return uriComparison;
        }

        if (left.selectionRange.start.line !== right.selectionRange.start.line) {
            return left.selectionRange.start.line - right.selectionRange.start.line;
        }

        return left.selectionRange.start.character - right.selectionRange.start.character;
    }

    private isSymbolAccessibleInCallable(
        symbol: PbSymbol,
        uri: vscode.Uri,
        currentCallable: PbSymbol,
    ): boolean {
        if (!isCallableScopedSymbol(symbol) || symbol.uri.toString() !== uri.toString()) {
            return false;
        }

        const containingCallable = getContainingCallableSymbol(symbol, this.index);

        return !!containingCallable &&
            containingCallable.uri.toString() === currentCallable.uri.toString() &&
            getLogicalSymbolKey(containingCallable) === getLogicalSymbolKey(currentCallable);
    }

    private isGlobalCompletionSymbol(symbol: PbSymbol): boolean {
        if (isCallableScopedSymbol(symbol)) {
            return false;
        }

        if (symbol.kind === 'global-function') {
            return true;
        }

        if (symbol.kind === 'type' || symbol.kind === 'structure') {
            return false;
        }

        return !symbol.parent && !symbol.containerName && !symbol.ownerName;
    }

    private hasSinglePrimaryCandidate(symbols: PbSymbol[]): boolean {
        if (symbols.length === 0) {
            return false;
        }

        const logicalKeys = new Set(
            symbols.map(symbol => getLogicalSymbolKey(symbol)),
        );
        const uris = new Set(
            symbols.map(symbol => symbol.uri.toString()),
        );

        return logicalKeys.size === 1 && uris.size === 1;
    }

    private getSystemEntryKey(entry: PbSystemSymbolEntry): string {
        return [
            entry.name.toLowerCase(),
            entry.kind,
            entry.namespace,
            entry.category,
            entry.sourceUrl ?? '',
        ].join('|');
    }
}