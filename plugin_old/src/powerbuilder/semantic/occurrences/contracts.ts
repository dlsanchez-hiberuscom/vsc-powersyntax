import * as vscode from 'vscode';
import { PbSystemSymbolEntry } from '../../knowledge/types';
import { PbSymbol } from '../../models/pbSymbol';
import { PbProjectDefinition } from '../../workspace/pbProjectModel';
import {
    PbSemanticEvidence,
    PbSemanticEvidenceKind,
    PbSemanticPrecision,
} from '../contracts';
import { PbSemanticResolutionContext } from '../semanticContext';

export type SemanticEvidencePrecision = PbSemanticPrecision;

export type SemanticOccurrenceEvidenceKind = Extract<
    PbSemanticEvidenceKind,
    | 'declaration'
    | 'symbol-family'
    | 'system-member'
    | 'text-prefilter'
    | 'callable-scope'
    | 'project-scope'
>;

export type SemanticEvidence = PbSemanticEvidence;

export interface SemanticOccurrence {
    uri: vscode.Uri;
    range: vscode.Range;
    isDeclaration: boolean;
    evidence: SemanticEvidence[];
}

export interface SemanticReferenceQueryArgs {
    word: string;
    uri: vscode.Uri;
    includeDeclaration: boolean;
    symbolContext?: PbSemanticResolutionContext;
    resolvedSymbolsOverride?: PbSymbol[];
    systemMemberOverride?: PbSystemSymbolEntry;
    currentProjectOverride?: PbProjectDefinition;
}

export interface SemanticReferenceQueryResult {
    resolvedSymbols: PbSymbol[];
    occurrences: SemanticOccurrence[];
    systemMember?: PbSystemSymbolEntry;
    currentProject?: PbProjectDefinition;
}

export interface SemanticRenameTarget {
    target: PbSymbol;
    family: PbSymbol[];
    currentProject?: PbProjectDefinition;
}

export interface SemanticRenamePlan extends SemanticRenameTarget {
    occurrences: SemanticOccurrence[];
}