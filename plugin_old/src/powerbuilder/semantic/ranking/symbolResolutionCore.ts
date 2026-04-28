import {
    PbResolutionContext,
    PbSymbolResolutionContext,
} from './contracts';
import { toSemanticOwnerContext } from '../semanticContext';

export type {
    OccurrenceMatchArgs,
    PbResolutionContext,
    PbSymbolResolutionContext,
    ResolvePreferredSymbolsArgs,
    SemanticCandidateRankingResult,
    SemanticOwnerResolutionResult,
    SemanticProjectPreferenceResult,
    SemanticRankedCandidate,
    SemanticRankingScore,
    SemanticVisibility,
    SemanticVisibilityResult,
} from './contracts';
export {
    rankSemanticCandidates,
    resolvePreferredSymbols,
} from './candidateRanking';
export {
    filterSymbolsToPreferredProject,
    getProjectPreferenceScore,
    isSymbolInProject,
    resolveProjectPreference,
    sortSymbolsByProjectPreference,
} from './projectPreference';
export {
    compareSymbolsByPosition,
    dedupeSymbols,
    getCallableParameterCount,
    getCallableParameterTypeKeys,
    getContainingCallableSymbol,
    isCallableScopedSymbol,
    isCallableSymbol,
    normalizeIdentifier,
} from './shared';
export {
    getImplicitOwnerDistanceBonus,
    getImplicitOwnerNamesAtPosition,
    getNormalizedOwnerNames,
    getOwnerDistanceBonus,
    getResolvedOwnerNames,
    resolveOwnerResolution,
    symbolMatchesOwnerNames,
} from '../owners/ownerResolution';
export {
    canSearchTextOccurrences,
    getLogicalSymbolKey,
    occurrenceMatchesResolvedSymbols,
} from '../occurrences/occurrenceMatching';
export {
    filterSymbolsVisibleFromPosition,
    filterToHighestVariableMemberScope,
    getMemberVariableScope,
    getSymbolVisibility,
    isMemberVariableSymbol,
    isSymbolVisibleFromPosition,
} from '../visibility/symbolVisibility';

export function toResolutionContext(
    symbolContext?: PbSymbolResolutionContext,
): PbResolutionContext {
    return toSemanticOwnerContext(symbolContext);
}