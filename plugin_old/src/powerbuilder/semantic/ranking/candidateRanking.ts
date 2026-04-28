import * as vscode from 'vscode';
import { PbSymbol } from '../../models/pbSymbol';
import {
    PbSemanticEvidence,
    PbSemanticPrecision,
} from '../contracts';
import {
    getImplicitOwnerDistanceBonus,
    getNormalizedOwnerNames,
    getOwnerDistanceBonus,
    resolveOwnerResolution,
} from '../owners/ownerResolution';
import {
    filterSymbolsVisibleFromPosition,
    filterToHighestVariableMemberScope,
} from '../visibility/symbolVisibility';
import {
    ResolvePreferredSymbolsArgs,
    SemanticCandidateRankingResult,
    SemanticRankedCandidate,
    SemanticRankingScore,
} from './contracts';
import {
    getProjectPreferenceScore,
    resolveProjectPreference,
} from './projectPreference';
import {
    areSameCallable,
    compareSymbolsByPosition,
    dedupeSymbols,
    getCallableParameterCount,
    getContainingCallableSymbol,
    isCallableScopedSymbol,
    isCallableSymbol,
    normalizeIdentifier,
} from './shared';

export function resolvePreferredSymbols(
    args: ResolvePreferredSymbolsArgs,
): PbSymbol[] {
    return rankSemanticCandidates(args).candidates.map(candidate => candidate.symbol);
}

export function rankSemanticCandidates(
    args: ResolvePreferredSymbolsArgs,
): SemanticCandidateRankingResult {
    const normalizedWord = normalizeIdentifier(args.word);

    if (!normalizedWord) {
        return { candidates: [] };
    }

    if (
        args.symbolContext?.isDynamicDispatch ||
        args.symbolContext?.isAncestorControlCall ||
        args.symbolContext?.isAncestorReturnValue
    ) {
        return { candidates: [] };
    }

    const context = toRankingResolutionContext(args.symbolContext);
    const projectPreference = resolveProjectPreference(
        dedupeSymbols(
            args.index.findPreferredSymbols(normalizedWord, args.uri),
        ),
        args.libraryGraph,
        args.uri,
    );
    const baseCandidates = projectPreference.preferredSymbols;
    const declarationMatches = args.symbolContext?.range?.start
        ? filterToExactDeclarationMatches(
            baseCandidates,
            args.uri,
            args.symbolContext.range.start,
        )
        : [];

    if (declarationMatches.length > 0) {
        return buildDeclarationRankingResult(declarationMatches);
    }

    const visibilityFilteredCandidates = args.symbolContext?.range?.start
        ? filterSymbolsVisibleFromPosition(
            baseCandidates,
            args.index,
            args.uri,
            args.symbolContext.range.start,
        )
        : baseCandidates;
    const ownerResolution = resolveOwnerResolution(
        context,
        args.index,
        args.uri,
        args.symbolContext?.range?.start,
    );
    const localScopeMatches = filterByCallableScope(
        visibilityFilteredCandidates,
        context,
        args.index,
        args.uri,
        args.symbolContext?.range?.start,
    );
    const implicitMemberMatches = filterByImplicitOwnerContext(
        visibilityFilteredCandidates,
        ownerResolution.implicitOwnerNames,
    );
    const directOwnerMatches = filterByOwnerContext(
        visibilityFilteredCandidates,
        ownerResolution.resolvedOwnerNames,
    );
    const useUnqualifiedCallableSearchOrder = shouldUseUnqualifiedCallableSearchOrder(
        context,
        args.symbolContext?.providedArgumentCount,
    );

    const candidates = directOwnerMatches.length > 0
        ? directOwnerMatches
        : ownerResolution.hasExplicitOwner
            ? []
            : useUnqualifiedCallableSearchOrder
                ? visibilityFilteredCandidates
                : localScopeMatches.length > 0
                    ? localScopeMatches
                    : implicitMemberMatches.length > 0
                        ? implicitMemberMatches
                        : visibilityFilteredCandidates;
    const invocationAwareCandidates = filterByInvocationContext(
        candidates,
        args.symbolContext?.providedArgumentCount,
    );
    const searchOrderedCandidates = filterByUnqualifiedFunctionSearchOrder(
        invocationAwareCandidates,
        implicitMemberMatches,
        context,
        args.symbolContext?.providedArgumentCount,
    );

    const rankedCandidates = [...searchOrderedCandidates]
        .sort((left, right) => {
            const rightScore = getContextScore(
                right,
                context,
                args.index,
                args.uri,
                args.symbolContext?.range?.start,
                ownerResolution.implicitOwnerNames,
                args.symbolContext?.providedArgumentCount,
            );
            const leftScore = getContextScore(
                left,
                context,
                args.index,
                args.uri,
                args.symbolContext?.range?.start,
                ownerResolution.implicitOwnerNames,
                args.symbolContext?.providedArgumentCount,
            );
            const contextScoreDiff = rightScore.value - leftScore.value;

            if (contextScoreDiff !== 0) {
                return contextScoreDiff;
            }

            if (projectPreference.currentProject) {
                const projectScoreDiff =
                    getProjectPreferenceScore(right, args.libraryGraph, projectPreference.currentProject) -
                    getProjectPreferenceScore(left, args.libraryGraph, projectPreference.currentProject);

                if (projectScoreDiff !== 0) {
                    return projectScoreDiff;
                }
            }

            return compareSymbolsByPosition(left, right);
        })
        .map(symbol => buildRankedCandidate(
            symbol,
            args,
            context,
            projectPreference.currentProject,
            ownerResolution.implicitOwnerNames,
        ));

    return {
        primarySymbol: rankedCandidates.length === 1
            ? rankedCandidates[0].symbol
            : undefined,
        candidates: rankedCandidates,
    };
}

function buildDeclarationRankingResult(symbols: PbSymbol[]): SemanticCandidateRankingResult {
    const candidates = [...symbols]
        .sort(compareSymbolsByPosition)
        .map(symbol => ({
            symbol,
            score: Number.MAX_SAFE_INTEGER,
            precision: 'exact' as const,
            evidence: [
                buildRankingEvidence(
                    'declaration',
                    'exact',
                    'La selección cae exactamente sobre la declaración del símbolo.',
                ),
            ],
        }));

    return {
        primarySymbol: candidates.length === 1 ? candidates[0].symbol : undefined,
        candidates,
    };
}

function buildRankedCandidate(
    symbol: PbSymbol,
    args: ResolvePreferredSymbolsArgs,
    context: ReturnType<typeof toRankingResolutionContext>,
    currentProject: ReturnType<typeof resolveProjectPreference>['currentProject'],
    implicitOwnerNames: readonly string[],
): SemanticRankedCandidate {
    const score = getContextScore(
        symbol,
        context,
        args.index,
        args.uri,
        args.symbolContext?.range?.start,
        implicitOwnerNames,
        args.symbolContext?.providedArgumentCount,
    );
    const evidence = [...score.evidence];
    let totalScore = score.value;

    if (currentProject) {
        const projectScore = getProjectPreferenceScore(symbol, args.libraryGraph, currentProject);

        if (projectScore > 0) {
            totalScore += projectScore;
            evidence.push(buildRankingEvidence(
                'project-scope',
                score.precision === 'exact' ? 'exact' : 'compatible',
                'El símbolo pertenece al proyecto preferido para el archivo activo.',
            ));
        }
    }

    return {
        symbol,
        score: totalScore,
        precision: score.precision,
        evidence,
    };
}

function filterByOwnerContext(
    symbols: PbSymbol[],
    effectiveOwnerNames: readonly string[],
): PbSymbol[] {
    if (effectiveOwnerNames.length === 0) {
        return [];
    }

    return symbols.filter(symbol =>
        effectiveOwnerNames.some(owner =>
            getNormalizedOwnerNames(symbol).includes(owner),
        ),
    );
}

function filterByCallableScope(
    symbols: PbSymbol[],
    context: ReturnType<typeof toRankingResolutionContext>,
    index: ResolvePreferredSymbolsArgs['index'],
    uri: vscode.Uri,
    position?: vscode.Position,
): PbSymbol[] {
    if (normalizeIdentifier(context.qualifiedOwnerExpression ?? context.qualifiedOwner) || !position) {
        return [];
    }

    const currentCallable = index.findInnermostCallableAtPosition(uri, position);

    if (!currentCallable) {
        return [];
    }

    const callableScopedMatches = symbols.filter(symbol => {
        if (!isCallableScopedSymbol(symbol) || symbol.uri.toString() !== uri.toString()) {
            return false;
        }

        const containingCallable = getContainingCallableSymbol(symbol, index);
        return areSameCallable(containingCallable, currentCallable);
    });

    if (callableScopedMatches.length === 0) {
        return [];
    }

    const localMatches = callableScopedMatches.filter(symbol => symbol.declarationScope === 'local');
    return localMatches.length > 0 ? localMatches : callableScopedMatches;
}

function filterByImplicitOwnerContext(
    symbols: PbSymbol[],
    implicitOwnerNames: readonly string[],
): PbSymbol[] {
    if (implicitOwnerNames.length === 0) {
        return [];
    }

    return filterToHighestVariableMemberScope(symbols.filter(symbol =>
        !isCallableScopedSymbol(symbol) &&
        implicitOwnerNames.some(owner =>
            getNormalizedOwnerNames(symbol).includes(owner),
        ),
    ));
}

function filterByInvocationContext(
    symbols: PbSymbol[],
    providedArgumentCount?: number,
): PbSymbol[] {
    if (providedArgumentCount === undefined) {
        return symbols;
    }

    const callableCandidates = symbols.filter(isCallableSymbol);

    if (callableCandidates.length === 0) {
        return symbols;
    }

    const exactArityMatches = callableCandidates.filter(symbol =>
        getCallableParameterCount(symbol) === providedArgumentCount,
    );

    return exactArityMatches.length > 0
        ? exactArityMatches
        : callableCandidates;
}

function filterByUnqualifiedFunctionSearchOrder(
    symbols: PbSymbol[],
    implicitMemberMatches: PbSymbol[],
    context: ReturnType<typeof toRankingResolutionContext>,
    providedArgumentCount?: number,
): PbSymbol[] {
    if (!shouldUseUnqualifiedCallableSearchOrder(context, providedArgumentCount)) {
        return symbols;
    }

    const callableCandidates = symbols.filter(symbol =>
        symbol.kind === 'function' ||
        symbol.kind === 'global-function' ||
        symbol.kind === 'subroutine',
    );

    if (callableCandidates.length === 0) {
        return symbols;
    }

    const globalExternalCandidates = callableCandidates.filter(symbol =>
        symbol.isExternal && isGlobalCallableSymbol(symbol),
    );

    if (globalExternalCandidates.length > 0) {
        return globalExternalCandidates;
    }

    const globalCandidates = callableCandidates.filter(isGlobalCallableSymbol);

    if (globalCandidates.length > 0) {
        return globalCandidates;
    }

    const implicitOwnerCallableCandidates = filterByInvocationContext(
        implicitMemberMatches.filter(isCallableSymbol),
        providedArgumentCount,
    );

    if (implicitOwnerCallableCandidates.length > 0) {
        return implicitOwnerCallableCandidates;
    }

    const objectCandidates = callableCandidates.filter(symbol => !isGlobalCallableSymbol(symbol));

    return objectCandidates.length > 0
        ? objectCandidates
        : symbols;
}

function shouldUseUnqualifiedCallableSearchOrder(
    context: ReturnType<typeof toRankingResolutionContext>,
    providedArgumentCount?: number,
): boolean {
    return providedArgumentCount !== undefined &&
        !normalizeIdentifier(context.qualifiedOwnerExpression ?? context.qualifiedOwner) &&
        !context.qualifier;
}

function isGlobalCallableSymbol(symbol: PbSymbol): boolean {
    return symbol.kind === 'global-function';
}

function getContextScore(
    symbol: PbSymbol,
    context: ReturnType<typeof toRankingResolutionContext>,
    index: ResolvePreferredSymbolsArgs['index'],
    uri: vscode.Uri,
    position: vscode.Position | undefined,
    implicitOwnerNames: readonly string[],
    providedArgumentCount?: number,
): SemanticRankingScore {
    let value = 0;
    const evidence: PbSemanticEvidence[] = [];
    let precision: PbSemanticPrecision = 'compatible';
    const ownerResolution = resolveOwnerResolution(context, index, uri, position);

    if (
        ownerResolution.resolvedOwnerNames.length > 0 &&
        ownerResolution.resolvedOwnerNames.some(owner =>
            getNormalizedOwnerNames(symbol).includes(owner),
        )
    ) {
        value += 5000;
        precision = 'exact';
        evidence.push(buildRankingEvidence(
            'owner-match',
            'exact',
            'El candidato coincide con el owner semántico resuelto.',
        ));

        const ownerDistanceBonus = getOwnerDistanceBonus(
            symbol,
            context,
            index,
            uri,
            position,
        );

        if (ownerDistanceBonus > 0) {
            value += ownerDistanceBonus;
            evidence.push(buildRankingEvidence(
                'candidate-ranking',
                'exact',
                'La distancia en la jerarquía de owners mejora la prioridad del candidato.',
            ));
        }
    }

    if (context.qualifier === '::' && symbol.kind === 'event') {
        value += 75;
    }

    if (
        context.qualifier === '.' &&
        (
            symbol.kind === 'function' ||
            symbol.kind === 'global-function' ||
            symbol.kind === 'subroutine' ||
            symbol.kind === 'event' ||
            symbol.kind === 'variable' ||
            symbol.kind === 'constant'
        )
    ) {
        value += 40;
    }

    if (position) {
        const currentCallable = index.findInnermostCallableAtPosition(uri, position);

        if (
            implicitOwnerNames.length > 0 &&
            implicitOwnerNames.some(owner =>
                getNormalizedOwnerNames(symbol).includes(owner),
            )
        ) {
            value += 2500;
            evidence.push(buildRankingEvidence(
                'implicit-owner',
                precision === 'exact' ? 'exact' : 'compatible',
                'El candidato encaja con el owner implícito visible desde la posición.',
            ));

            const implicitOwnerDistanceBonus = getImplicitOwnerDistanceBonus(
                symbol,
                index,
                uri,
                position,
            );

            if (implicitOwnerDistanceBonus > 0) {
                value += implicitOwnerDistanceBonus;
                evidence.push(buildRankingEvidence(
                    'candidate-ranking',
                    precision === 'exact' ? 'exact' : 'compatible',
                    'La distancia al owner implícito refina el orden de candidatos.',
                ));
            }
        }

        if (currentCallable && isCallableScopedSymbol(symbol)) {
            const symbolCallable = getContainingCallableSymbol(symbol, index);

            if (areSameCallable(symbolCallable, currentCallable)) {
                value += symbol.declarationScope === 'local'
                    ? 4000
                    : 3500;
                precision = 'exact';
                evidence.push(buildRankingEvidence(
                    'callable-scope',
                    'exact',
                    'El candidato pertenece al callable activo y domina el scope local.',
                ));
            }
        }
    }

    if (
        providedArgumentCount !== undefined &&
        isCallableSymbol(symbol) &&
        getCallableParameterCount(symbol) === providedArgumentCount
    ) {
        value += 300;
        evidence.push(buildRankingEvidence(
            'arity-match',
            precision === 'exact' ? 'exact' : 'compatible',
            'La aridad del callable coincide con la invocación observada.',
        ));
    }

    return {
        value,
        precision,
        evidence,
    };
}

function filterToExactDeclarationMatches(
    symbols: PbSymbol[],
    uri: vscode.Uri,
    position: vscode.Position,
): PbSymbol[] {
    return symbols.filter(symbol =>
        symbol.uri.toString() === uri.toString() &&
        symbol.selectionRange.contains(position),
    );
}

function toRankingResolutionContext(
    symbolContext?: ResolvePreferredSymbolsArgs['symbolContext'],
) {
    return {
        qualifiedOwner: symbolContext?.qualifiedOwner,
        qualifiedOwnerExpression: symbolContext?.qualifiedOwnerExpression,
        qualifier: symbolContext?.qualifier,
        isDynamicDispatch: symbolContext?.isDynamicDispatch,
        dynamicDispatchKind: symbolContext?.dynamicDispatchKind,
        isAncestorControlCall: symbolContext?.isAncestorControlCall,
        isAncestorReturnValue: symbolContext?.isAncestorReturnValue,
    };
}

function buildRankingEvidence(
    kind: PbSemanticEvidence['kind'],
    precision: PbSemanticPrecision,
    detail: string,
): PbSemanticEvidence {
    return {
        kind,
        precision,
        detail,
    };
}