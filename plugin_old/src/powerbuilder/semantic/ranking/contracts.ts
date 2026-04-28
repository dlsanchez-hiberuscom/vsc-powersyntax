import * as vscode from 'vscode';
import { SymbolIndex } from '../../indexing/symbolIndex';
import { PbSymbol } from '../../models/pbSymbol';
import { PbLibraryGraph } from '../../workspace/pbLibraryGraph';
import { PbProjectDefinition } from '../../workspace/pbProjectModel';
import {
    PbSemanticEvidence,
    PbSemanticPrecision,
} from '../contracts';
import {
    PbSemanticOwnerContext,
    PbSemanticResolutionContext,
} from '../semanticContext';

export type PbResolutionContext = PbSemanticOwnerContext;

export type PbSymbolResolutionContext = PbSemanticResolutionContext;

export interface ResolvePreferredSymbolsArgs {
    index: SymbolIndex;
    libraryGraph: PbLibraryGraph;
    word: string;
    uri: vscode.Uri;
    symbolContext?: PbSymbolResolutionContext;
}

export interface OccurrenceMatchArgs {
    text: string;
    startOffset: number;
    matchLength: number;
    fileUri: vscode.Uri;
    requestUri: vscode.Uri;
    index: SymbolIndex;
    resolvedSymbols: PbSymbol[];
    context: PbResolutionContext;
}

export interface SemanticRankingScore {
    value: number;
    precision: PbSemanticPrecision;
    evidence: PbSemanticEvidence[];
}

export interface SemanticRankedCandidate {
    symbol: PbSymbol;
    score: number;
    precision: PbSemanticPrecision;
    evidence: PbSemanticEvidence[];
}

export interface SemanticCandidateRankingResult {
    primarySymbol?: PbSymbol;
    candidates: SemanticRankedCandidate[];
}

export type SemanticVisibility =
    | 'visible'
    | 'hidden-private'
    | 'hidden-protected';

export interface SemanticVisibilityResult {
    visibility: SemanticVisibility;
    isVisible: boolean;
    detail: string;
}

export interface SemanticProjectPreferenceResult {
    currentProject?: PbProjectDefinition;
    preferredSymbols: PbSymbol[];
}

export interface SemanticOwnerResolutionResult {
    rawOwner?: string;
    hasExplicitOwner: boolean;
    resolvedOwnerTypeNames: string[];
    resolvedOwnerNames: string[];
    implicitOwnerNames: string[];
}