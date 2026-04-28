import * as vscode from 'vscode';
import {
    getSymbolContextAtPosition,
    parseOwnerExpressionSegments,
} from '../document/documentUtils';
import {
    getConfig,
    getIndexingExcludeGlob,
    isExcludedUri,
} from '../../core/config/extensionConfiguration';
import {
    createCodeMask,
    isCodeRange,
} from '../../core/utils/powerScriptLexingUtils';
import {
    filterIdeSafePowerBuilderUris,
    findIdeSafePowerBuilderFilesInRoots,
    getIdeSafePowerBuilderFileGlob,
} from '../../core/utils/powerBuilderFileUtils';
import { isPbIdentifierChar } from '../grammar/pbIdentifier';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbSymbol } from '../models/pbSymbol';
import { PbLibraryGraph } from '../workspace/pbLibraryGraph';
import { PowerBuilderWorkspaceSnapshotStore } from '../workspace/powerBuilderWorkspaceSnapshotStore';
import { PbProjectDefinition } from '../workspace/pbProjectModel';
import {
    canSearchTextOccurrences,
    getLogicalSymbolKey,
    occurrenceMatchesResolvedSymbols,
} from './occurrences/occurrenceMatching';
import {
    getResolvedOwnerNames,
} from './owners/ownerResolution';
import {
    getContainingCallableSymbol,
    isCallableScopedSymbol,
    rankSemanticCandidates,
    resolvePreferredSymbols,
    sortSymbolsByProjectPreference,
    SemanticRankedCandidate,
} from './ranking';
import {
    PbSemanticResolutionContext,
    toSemanticOwnerContext,
} from './semanticContext';
import { resolveSystemMemberAtPosition } from './binding/systemMemberBinding';
import {
    SemanticEvidence,
    SemanticEvidencePrecision,
    SemanticOccurrence,
    SemanticOccurrenceEvidenceKind,
    SemanticReferenceQueryArgs,
    SemanticReferenceQueryResult,
    SemanticRenamePlan,
    SemanticRenameTarget,
} from './occurrences/contracts';
import { PbSystemSymbolEntry } from '../knowledge/types';

export type {
    SemanticEvidence,
    SemanticEvidencePrecision,
    SemanticOccurrence,
    SemanticOccurrenceEvidenceKind,
    SemanticReferenceQueryArgs,
    SemanticReferenceQueryResult,
    SemanticRenamePlan,
    SemanticRenameTarget,
} from './occurrences/contracts';

export class SemanticOccurrenceEngine {
    private readonly libraryGraph = PbLibraryGraph.getInstance();
    private readonly snapshotStore = PowerBuilderWorkspaceSnapshotStore.getInstance();

    constructor(private readonly index: SymbolIndex) {}

    async findReferences(
        args: SemanticReferenceQueryArgs,
    ): Promise<SemanticReferenceQueryResult> {
        const normalizedWord = args.word.trim();
        const currentProject = args.currentProjectOverride
            ?? this.libraryGraph.getPreferredProjectForSourceFile(args.uri);

        if (!normalizedWord) {
            return {
                resolvedSymbols: [],
                occurrences: [],
                currentProject,
            };
        }

        const rankedCandidates = args.resolvedSymbolsOverride
            ? undefined
            : rankSemanticCandidates({
                index: this.index,
                libraryGraph: this.libraryGraph,
                word: normalizedWord,
                uri: args.uri,
                symbolContext: args.symbolContext,
            }).candidates;
        const rankedSymbols = rankedCandidates?.map(candidate => candidate.symbol) ?? [];
        const resolvedSymbols = args.resolvedSymbolsOverride
            ? this.getEffectiveResolvedSymbols(
                args.resolvedSymbolsOverride,
                args.uri,
                currentProject,
                args.symbolContext,
            )
            : this.getEffectiveResolvedSymbols(
                rankedSymbols,
                args.uri,
                currentProject,
                args.symbolContext,
                rankedCandidates,
            );
        const systemMember = args.systemMemberOverride
            ?? (
                args.symbolContext?.range?.start
                    ? this.resolveSystemMemberAt(
                        normalizedWord,
                        args.uri,
                        args.symbolContext.range.start,
                        args.symbolContext,
                    )
                    : undefined
            );
        const occurrences: SemanticOccurrence[] = [];
        const seen = new Set<string>();
        const declarationKeys = new Set<string>(
            resolvedSymbols.map(symbol =>
                this.getOccurrenceKey(symbol.uri, symbol.selectionRange),
            ),
        );
        const callableScoped = resolvedSymbols.some(isCallableScopedSymbol);

        if (args.includeDeclaration && !systemMember) {
            for (const symbol of resolvedSymbols) {
                this.addOccurrence(
                    occurrences,
                    seen,
                    this.buildDeclarationOccurrence(symbol, currentProject, callableScoped),
                );
            }
        }

        if (
            !canSearchTextOccurrences(
                resolvedSymbols,
                toSemanticOwnerContext(args.symbolContext),
            ) &&
            !systemMember
        ) {
            return {
                resolvedSymbols,
                occurrences,
                systemMember,
                currentProject,
            };
        }

        if (callableScoped) {
            await this.collectCallableScopedSymbolOccurrences({
                word: normalizedWord,
                family: resolvedSymbols,
                includeDeclaration: args.includeDeclaration,
                declarationKeys,
                currentProject,
                occurrences,
                seen,
            });

            return {
                resolvedSymbols,
                occurrences,
                systemMember,
                currentProject,
            };
        }

        const files = await this.getSearchFiles(currentProject);

        if (systemMember) {
            await this.collectSystemMemberOccurrences({
                word: normalizedWord,
                files,
                includeDeclaration: args.includeDeclaration,
                requestUri: args.uri,
                symbolContext: args.symbolContext,
                systemMember,
                currentProject,
                occurrences,
                seen,
            });

            return {
                resolvedSymbols,
                occurrences,
                systemMember,
                currentProject,
            };
        }

        const orderedSymbols = currentProject
            ? sortSymbolsByProjectPreference(
                resolvedSymbols,
                this.libraryGraph,
                currentProject,
            )
            : resolvedSymbols;

        await this.collectWorkspaceSymbolOccurrences({
            word: normalizedWord,
            files,
            requestUri: args.uri,
            symbolContext: args.symbolContext,
            includeDeclaration: args.includeDeclaration,
            declarationKeys,
            targetSymbols: orderedSymbols,
            currentProject,
            occurrences,
            seen,
        });

        return {
            resolvedSymbols,
            occurrences,
            systemMember,
            currentProject,
        };
    }

    resolveRenameTarget(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
    ): SemanticRenameTarget | undefined {
        const normalizedWord = word.trim();

        if (!normalizedWord) {
            return undefined;
        }

        const currentProject = this.libraryGraph.getPreferredProjectForSourceFile(uri);
        const rankedCandidates = rankSemanticCandidates({
            index: this.index,
            libraryGraph: this.libraryGraph,
            word: normalizedWord,
            uri,
            symbolContext,
        }).candidates.filter(candidate => !candidate.symbol.isPrototype);
        let implementationCandidates = this.getEffectiveResolvedSymbols(
            rankedCandidates.map(candidate => candidate.symbol),
            uri,
            currentProject,
            symbolContext,
            rankedCandidates,
        ).filter(symbol => !symbol.isPrototype);

        if (currentProject) {
            const projectCandidates = implementationCandidates.filter(symbol =>
                this.libraryGraph.isSourceFileInProject(
                    symbol.uri,
                    currentProject,
                ),
            );

            if (projectCandidates.length > 0) {
                implementationCandidates = projectCandidates;
            }
        }

        if (implementationCandidates.length === 0) {
            return undefined;
        }

        if (implementationCandidates.some(symbol => symbol.isExternal)) {
            return undefined;
        }

        const logicalKeys = new Set(
            implementationCandidates.map(symbol => getLogicalSymbolKey(symbol)),
        );

        if (logicalKeys.size !== 1) {
            return undefined;
        }

        const target = implementationCandidates[0];
        const targetLogicalKey = getLogicalSymbolKey(target);

        let family = this.index
            .findSymbolByName(normalizedWord)
            .filter(symbol => getLogicalSymbolKey(symbol) === targetLogicalKey);

        if (currentProject) {
            const projectFamily = family.filter(symbol =>
                this.libraryGraph.isSourceFileInProject(
                    symbol.uri,
                    currentProject,
                ),
            );

            if (projectFamily.length > 0) {
                family = projectFamily;
            }
        }

        if (family.length === 0) {
            family = [target];
        }

        return {
            target,
            family,
            currentProject,
        };
    }

    async planRename(
        word: string,
        uri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
    ): Promise<SemanticRenamePlan | undefined> {
        const renameTarget = this.resolveRenameTarget(
            word,
            uri,
            symbolContext,
        );

        if (!renameTarget) {
            return undefined;
        }

        if (!canSearchTextOccurrences(renameTarget.family, toSemanticOwnerContext(symbolContext))) {
            return undefined;
        }

        const query = await this.findReferences({
            word,
            uri,
            includeDeclaration: true,
            symbolContext,
            resolvedSymbolsOverride: renameTarget.family,
            currentProjectOverride: renameTarget.currentProject,
        });

        return {
            ...renameTarget,
            occurrences: query.occurrences,
        };
    }

    private async collectWorkspaceSymbolOccurrences(args: {
        word: string;
        files: readonly vscode.Uri[];
        requestUri: vscode.Uri;
        symbolContext?: PbSemanticResolutionContext;
        includeDeclaration: boolean;
        declarationKeys: Set<string>;
        targetSymbols: PbSymbol[];
        currentProject?: PbProjectDefinition;
        occurrences: SemanticOccurrence[];
        seen: Set<string>;
    }): Promise<void> {
        const regex = new RegExp(this.escapeRegex(args.word), 'gi');

        for (const fileUri of args.files) {
            try {
                const document = await this.snapshotStore.getSnapshot(fileUri);

                if (!document) {
                    continue;
                }

                this.index.indexDocument(document, { silent: true });
                const text = document.getText();
                const codeMask = createCodeMask(text);

                regex.lastIndex = 0;

                let match: RegExpExecArray | null;

                while ((match = regex.exec(text)) !== null) {
                    const startOffset = match.index;
                    const matchLength = match[0].length;

                    if (!isCodeRange(codeMask, startOffset, matchLength)) {
                        continue;
                    }

                    if (!this.isIdentifierBoundary(text, startOffset - 1, startOffset + matchLength)) {
                        continue;
                    }

                    const start = document.positionAt(startOffset);

                    if (!this.matchesTargetSymbolsAt({
                        document,
                        text,
                        startOffset,
                        matchLength,
                        position: start,
                        requestUri: args.requestUri,
                        symbolContext: args.symbolContext,
                        targetSymbols: args.targetSymbols,
                    })) {
                        continue;
                    }

                    const end = document.positionAt(startOffset + matchLength);
                    const range = new vscode.Range(start, end);
                    const isDeclaration = args.declarationKeys.has(
                        this.getOccurrenceKey(fileUri, range),
                    );

                    if (!args.includeDeclaration && isDeclaration) {
                        continue;
                    }

                    this.addOccurrence(
                        args.occurrences,
                        args.seen,
                        this.buildSymbolOccurrence(
                            fileUri,
                            range,
                            isDeclaration,
                            args.currentProject,
                            false,
                        ),
                    );
                }
            } catch {
                // Ignorar archivos no accesibles.
            }
        }
    }

    private async collectCallableScopedSymbolOccurrences(args: {
        word: string;
        family: PbSymbol[];
        includeDeclaration: boolean;
        declarationKeys: Set<string>;
        currentProject?: PbProjectDefinition;
        occurrences: SemanticOccurrence[];
        seen: Set<string>;
    }): Promise<void> {
        const scope = this.getCallableScope(args.family);

        if (!scope) {
            return;
        }

        const document = await this.snapshotStore.getSnapshot(scope.uri);

        if (!document) {
            return;
        }

        this.index.indexDocument(document, { silent: true });
        const text = document.getText();
        const codeMask = createCodeMask(text);
        const startOffset = document.offsetAt(scope.range.start);
        const endOffset = document.offsetAt(scope.range.end);
        const regex = new RegExp(this.escapeRegex(args.word), 'gi');

        regex.lastIndex = startOffset;

        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
            const matchStartOffset = match.index;
            const matchLength = match[0].length;

            if (matchStartOffset < startOffset) {
                continue;
            }

            if (matchStartOffset + matchLength > endOffset) {
                break;
            }

            if (!isCodeRange(codeMask, matchStartOffset, matchLength)) {
                continue;
            }

            if (!this.isIdentifierBoundary(text, matchStartOffset - 1, matchStartOffset + matchLength)) {
                continue;
            }

            const start = document.positionAt(matchStartOffset);

            if (!this.matchesTargetSymbolsAt({
                document,
                text,
                startOffset: matchStartOffset,
                matchLength,
                position: start,
                requestUri: scope.uri,
                symbolContext: undefined,
                targetSymbols: args.family,
            })) {
                continue;
            }

            const end = document.positionAt(matchStartOffset + matchLength);
            const range = new vscode.Range(start, end);
            const isDeclaration = args.declarationKeys.has(
                this.getOccurrenceKey(scope.uri, range),
            );

            if (!args.includeDeclaration && isDeclaration) {
                continue;
            }

            this.addOccurrence(
                args.occurrences,
                args.seen,
                this.buildSymbolOccurrence(
                    scope.uri,
                    range,
                    isDeclaration,
                    args.currentProject,
                    true,
                ),
            );
        }
    }

    private async collectSystemMemberOccurrences(args: {
        word: string;
        files: readonly vscode.Uri[];
        includeDeclaration: boolean;
        requestUri: vscode.Uri;
        symbolContext?: PbSemanticResolutionContext;
        systemMember: PbSystemSymbolEntry;
        currentProject?: PbProjectDefinition;
        occurrences: SemanticOccurrence[];
        seen: Set<string>;
    }): Promise<void> {
        const regex = new RegExp(this.escapeRegex(args.word), 'gi');

        for (const fileUri of args.files) {
            try {
                const document = await this.snapshotStore.getSnapshot(fileUri);

                if (!document) {
                    continue;
                }

                this.index.indexDocument(document, { silent: true });

                const text = document.getText();
                const codeMask = createCodeMask(text);

                regex.lastIndex = 0;

                let match: RegExpExecArray | null;

                while ((match = regex.exec(text)) !== null) {
                    const startOffset = match.index;
                    const matchLength = match[0].length;

                    if (!isCodeRange(codeMask, startOffset, matchLength)) {
                        continue;
                    }

                    if (!this.isIdentifierBoundary(text, startOffset - 1, startOffset + matchLength)) {
                        continue;
                    }

                    const start = document.positionAt(startOffset);

                    if (!this.matchesSystemMemberAt(document, start, args.systemMember)) {
                        continue;
                    }

                    const end = document.positionAt(startOffset + matchLength);
                    const range = new vscode.Range(start, end);

                    if (
                        !args.includeDeclaration &&
                        this.isCurrentRequestedOccurrence(
                            fileUri,
                            range,
                            args.requestUri,
                            args.symbolContext,
                        )
                    ) {
                        continue;
                    }

                    this.addOccurrence(
                        args.occurrences,
                        args.seen,
                        this.buildSystemMemberOccurrence(
                            fileUri,
                            range,
                            args.currentProject,
                        ),
                    );
                }
            } catch {
                // Ignorar archivos no accesibles.
            }
        }
    }

    private async getSearchFiles(
        currentProject?: PbProjectDefinition,
    ): Promise<vscode.Uri[]> {
        const dataWindowExperimentalIdeEnabled = getConfig().dataWindowExperimentalIdeEnabled;

        let files = currentProject
            ? await findIdeSafePowerBuilderFilesInRoots(
                this.libraryGraph.getProjectSourceRoots(currentProject),
                dataWindowExperimentalIdeEnabled,
                getIndexingExcludeGlob(),
            )
            : [];

        if (files.length === 0) {
            files = await vscode.workspace.findFiles(
                getIdeSafePowerBuilderFileGlob(dataWindowExperimentalIdeEnabled),
                getIndexingExcludeGlob(),
            );
        }

        files = filterIdeSafePowerBuilderUris(
            files.filter(fileUri => !isExcludedUri(fileUri)),
            dataWindowExperimentalIdeEnabled,
        );

        if (!currentProject) {
            return files;
        }

        const projectFiles = files.filter(fileUri =>
            this.libraryGraph.isSourceFileInProject(fileUri, currentProject),
        );

        return this.libraryGraph.sortUrisByProjectPreference(
            projectFiles,
            currentProject,
        );
    }

    private buildDeclarationOccurrence(
        symbol: PbSymbol,
        currentProject: PbProjectDefinition | undefined,
        callableScoped: boolean,
    ): SemanticOccurrence {
        const evidence: SemanticEvidence[] = [
            {
                kind: 'declaration',
                precision: 'exact',
                detail: 'Declaración indexada de la familia semántica objetivo.',
            },
            {
                kind: 'symbol-family',
                precision: 'exact',
                detail: 'La identidad lógica del símbolo ya fue resuelta antes del barrido.',
            },
        ];

        if (callableScoped) {
            evidence.push({
                kind: 'callable-scope',
                precision: 'exact',
                detail: 'La familia queda limitada al callable que contiene la declaración.',
            });
        }

        if (currentProject) {
            evidence.push({
                kind: 'project-scope',
                precision: 'compatible',
                detail: 'La familia se acota al proyecto preferido del archivo origen.',
            });
        }

        return {
            uri: symbol.uri,
            range: symbol.selectionRange,
            isDeclaration: true,
            evidence,
        };
    }

    private buildSymbolOccurrence(
        uri: vscode.Uri,
        range: vscode.Range,
        isDeclaration: boolean,
        currentProject: PbProjectDefinition | undefined,
        callableScoped: boolean,
    ): SemanticOccurrence {
        const evidence: SemanticEvidence[] = [
            {
                kind: 'text-prefilter',
                precision: 'heuristic',
                detail: 'La búsqueda textual solo se usa como prefiltro sobre código ejecutable.',
            },
            {
                kind: 'symbol-family',
                precision: 'exact',
                detail: 'La resolución semántica en la posición confirma la misma familia lógica.',
            },
        ];

        if (callableScoped) {
            evidence.push({
                kind: 'callable-scope',
                precision: 'exact',
                detail: 'La ocurrencia se valida dentro del callable exacto de la familia.',
            });
        }

        if (currentProject) {
            evidence.push({
                kind: 'project-scope',
                precision: 'compatible',
                detail: 'La búsqueda queda limitada al proyecto preferido del archivo origen.',
            });
        }

        if (isDeclaration) {
            evidence.push({
                kind: 'declaration',
                precision: 'exact',
                detail: 'La ocurrencia coincide con una declaración indexada de la familia.',
            });
        }

        return {
            uri,
            range,
            isDeclaration,
            evidence,
        };
    }

    private buildSystemMemberOccurrence(
        uri: vscode.Uri,
        range: vscode.Range,
        currentProject: PbProjectDefinition | undefined,
    ): SemanticOccurrence {
        const evidence: SemanticEvidence[] = [
            {
                kind: 'text-prefilter',
                precision: 'heuristic',
                detail: 'La búsqueda textual solo reduce candidatos antes de validar el miembro del sistema.',
            },
            {
                kind: 'system-member',
                precision: 'exact',
                detail: 'El owner tipado y la query semántica confirman el miembro integrado exacto.',
            },
        ];

        if (currentProject) {
            evidence.push({
                kind: 'project-scope',
                precision: 'compatible',
                detail: 'La búsqueda queda limitada al proyecto preferido del archivo origen.',
            });
        }

        return {
            uri,
            range,
            isDeclaration: false,
            evidence,
        };
    }

    private addOccurrence(
        occurrences: SemanticOccurrence[],
        seen: Set<string>,
        occurrence: SemanticOccurrence,
    ): void {
        const key = this.getOccurrenceKey(occurrence.uri, occurrence.range);

        if (!seen.has(key)) {
            seen.add(key);
            occurrences.push(occurrence);
        }
    }

    private matchesTargetSymbolsAt(args: {
        document: vscode.TextDocument;
        text: string;
        startOffset: number;
        matchLength: number;
        position: vscode.Position;
        requestUri: vscode.Uri;
        symbolContext?: PbSemanticResolutionContext;
        targetSymbols: PbSymbol[];
    }): boolean {
        if (args.targetSymbols.length === 0) {
            return false;
        }

        const targetKeys = new Set(
            args.targetSymbols.map(symbol => getLogicalSymbolKey(symbol)),
        );

        if (this.resolveSymbolsAt(args.document, args.position).some(symbol =>
            targetKeys.has(getLogicalSymbolKey(symbol)),
        )) {
            return true;
        }

        if (
            !args.symbolContext ||
            (!args.symbolContext.qualifiedOwner && !args.symbolContext.qualifiedOwnerExpression)
        ) {
            return false;
        }

        const ownerExpressionSegments = args.symbolContext.qualifiedOwnerExpression
            ? parseOwnerExpressionSegments(args.symbolContext.qualifiedOwnerExpression)
            : undefined;

        if (!ownerExpressionSegments || ownerExpressionSegments.length <= 1) {
            return false;
        }

        return occurrenceMatchesResolvedSymbols({
            text: args.text,
            startOffset: args.startOffset,
            matchLength: args.matchLength,
            fileUri: args.document.uri,
            requestUri: args.requestUri,
            index: this.index,
            resolvedSymbols: args.targetSymbols,
            context: toSemanticOwnerContext(args.symbolContext),
        });
    }

    private matchesSystemMemberAt(
        document: vscode.TextDocument,
        position: vscode.Position,
        targetEntry: PbSystemSymbolEntry,
    ): boolean {
        const context = getSymbolContextAtPosition(document, position);

        if (!context) {
            return false;
        }

        const entry = this.resolveSystemMemberAt(
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

    private resolveSymbolsAt(
        document: vscode.TextDocument,
        position: vscode.Position,
    ): PbSymbol[] {
        const context = getSymbolContextAtPosition(document, position);

        if (!context) {
            return [];
        }

        return resolvePreferredSymbols({
            index: this.index,
            libraryGraph: this.libraryGraph,
            word: context.word,
            uri: document.uri,
            symbolContext: {
                ...context,
                range: context.range,
            },
        });
    }

    private resolveSystemMemberAt(
        word: string,
        uri: vscode.Uri,
        position: vscode.Position,
        symbolContext?: PbSemanticResolutionContext,
    ): PbSystemSymbolEntry | undefined {
        return resolveSystemMemberAtPosition({
            index: this.index,
            word,
            uri,
            position,
            context: symbolContext,
        });
    }

    private getEffectiveResolvedSymbols(
        symbols: PbSymbol[],
        uri: vscode.Uri,
        currentProject?: PbProjectDefinition,
        symbolContext?: PbSemanticResolutionContext,
        rankedCandidates?: SemanticRankedCandidate[],
    ): PbSymbol[] {
        const projectScopedSymbols = currentProject
            ? symbols.filter(symbol =>
                this.libraryGraph.isSourceFileInProject(symbol.uri, currentProject),
            )
            : [];
        const projectScopedRankedCandidates = currentProject
            ? rankedCandidates?.filter(candidate =>
                this.libraryGraph.isSourceFileInProject(candidate.symbol.uri, currentProject),
            )
            : undefined;
        const effectiveSymbols = projectScopedSymbols.length > 0
            ? projectScopedSymbols
            : symbols;
        const effectiveRankedCandidates = projectScopedSymbols.length > 0
            ? projectScopedRankedCandidates
            : rankedCandidates;

        return this.collapseOwnerAwareTargetFamily(
            effectiveSymbols,
            uri,
            symbolContext,
            effectiveRankedCandidates,
        );
    }

    private collapseOwnerAwareTargetFamily(
        symbols: PbSymbol[],
        uri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
        rankedCandidates?: SemanticRankedCandidate[],
    ): PbSymbol[] {
        if (symbols.length <= 1 || !symbolContext?.range?.start) {
            return symbols;
        }

        if (!symbolContext.qualifiedOwner && !symbolContext.qualifiedOwnerExpression) {
            return symbols;
        }

        const resolvedOwnerNames = getResolvedOwnerNames(
            toSemanticOwnerContext(symbolContext),
            this.index,
            uri,
            symbolContext.range.start,
        );

        if (resolvedOwnerNames.length === 0) {
            return symbols;
        }

        const dominantFamilyKey = this.getDominantOwnerAwareFamilyKey(
            symbols,
            rankedCandidates,
        );

        if (!dominantFamilyKey) {
            return symbols;
        }

        const dominantFamily = symbols.filter(symbol =>
            getLogicalSymbolKey(symbol) === dominantFamilyKey,
        );

        return dominantFamily.length > 0
            ? dominantFamily
            : symbols;
    }

    private getDominantOwnerAwareFamilyKey(
        symbols: PbSymbol[],
        rankedCandidates?: SemanticRankedCandidate[],
    ): string | undefined {
        const logicalFamilyCount = new Set(
            symbols.map(symbol => getLogicalSymbolKey(symbol)),
        ).size;

        if (logicalFamilyCount <= 1) {
            return getLogicalSymbolKey(symbols[0]);
        }

        if (!rankedCandidates || rankedCandidates.length === 0) {
            return undefined;
        }

        const families = new Map<string, { score: number; order: number }>();

        rankedCandidates.forEach((candidate, index) => {
            const familyKey = getLogicalSymbolKey(candidate.symbol);
            const current = families.get(familyKey);

            if (!current || candidate.score > current.score) {
                families.set(familyKey, {
                    score: candidate.score,
                    order: current?.order ?? index,
                });
                return;
            }

            if (candidate.score === current.score && index < current.order) {
                current.order = index;
            }
        });

        const orderedFamilies = Array.from(families.entries())
            .sort((left, right) => {
                const scoreDiff = right[1].score - left[1].score;

                if (scoreDiff !== 0) {
                    return scoreDiff;
                }

                return left[1].order - right[1].order;
            });

        if (orderedFamilies.length === 0) {
            return undefined;
        }

        if (orderedFamilies.length === 1) {
            return orderedFamilies[0][0];
        }

        return orderedFamilies[0][1].score > orderedFamilies[1][1].score
            ? orderedFamilies[0][0]
            : undefined;
    }

    private getCallableScope(
        symbols: PbSymbol[],
    ): { uri: vscode.Uri; range: vscode.Range } | undefined {
        const scopedSymbol = symbols.find(symbol => isCallableScopedSymbol(symbol));

        if (!scopedSymbol) {
            return undefined;
        }

        const callableSymbol = getContainingCallableSymbol(scopedSymbol, this.index);

        if (!callableSymbol) {
            return undefined;
        }

        return {
            uri: callableSymbol.uri,
            range: callableSymbol.range,
        };
    }

    private isCurrentRequestedOccurrence(
        uri: vscode.Uri,
        range: vscode.Range,
        requestUri: vscode.Uri,
        symbolContext?: PbSemanticResolutionContext,
    ): boolean {
        if (!symbolContext?.range) {
            return false;
        }

        return uri.toString() === requestUri.toString() &&
            range.isEqual(symbolContext.range);
    }

    private getOccurrenceKey(
        uri: vscode.Uri,
        range: vscode.Range,
    ): string {
        return [
            uri.toString(),
            range.start.line,
            range.start.character,
            range.end.line,
            range.end.character,
        ].join(':');
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

    private escapeRegex(value: string): string {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private isIdentifierBoundary(
        text: string,
        beforeIndex: number,
        afterIndex: number,
    ): boolean {
        const before = beforeIndex >= 0 ? text[beforeIndex] : '';
        const after = afterIndex < text.length ? text[afterIndex] : '';

        return !isPbIdentifierChar(before) && !isPbIdentifierChar(after);
    }
}