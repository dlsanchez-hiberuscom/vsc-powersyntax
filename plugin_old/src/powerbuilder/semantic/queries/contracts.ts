import * as vscode from 'vscode';
import { CompletionContext, SignatureCallContext, SymbolContext } from '../../document/documentUtils';
import { PbSystemSymbolEntry } from '../../knowledge/types';
import { PbSymbol } from '../../models/pbSymbol';
import {
    PbSemanticAmbiguityCode,
    PbSemanticAmbiguityReason,
    PbSemanticEvidence,
    PbSemanticPrecision,
    PbSemanticQueryBaseResult,
} from '../contracts';
import { SemanticHoverContent } from '../hover/contracts';
import {
    SemanticReferenceQueryResult,
    SemanticRenameTarget,
    SemanticRenamePlan,
} from '../occurrences/contracts';
import { PbSemanticResolutionContext } from '../semanticContext';

export type SemanticQueryPrecision = PbSemanticPrecision;

export type SemanticAmbiguityCode = PbSemanticAmbiguityCode;

export type SemanticAmbiguityReason = PbSemanticAmbiguityReason;

export type SemanticQueryBaseResult = PbSemanticQueryBaseResult;

export type ResolveHoverSymbolContext = Pick<
    SymbolContext,
    | 'statement'
    | 'providedArgumentCount'
    | 'qualifiedOwner'
    | 'qualifiedOwnerExpression'
    | 'qualifier'
    | 'isDynamicDispatch'
    | 'dynamicDispatchKind'
    | 'isAncestorControlCall'
    | 'isAncestorReturnValue'
    | 'range'
> & {
    word?: string;
};

export interface ResolveHoverAtPositionArgs {
    uri: vscode.Uri;
    word?: string;
    document?: vscode.TextDocument;
    position?: vscode.Position;
    context?: ResolveHoverSymbolContext;
}

export interface ResolveHoverAtPositionResult extends SemanticQueryBaseResult {
    context?: ResolveHoverSymbolContext;
    primarySymbol?: PbSymbol;
    systemEntry?: PbSystemSymbolEntry;
    content?: SemanticHoverContent;
}

export interface ResolveSymbolAtPositionArgs {
    document: vscode.TextDocument;
    position: vscode.Position;
    context?: SymbolContext;
}

export interface ResolveSymbolAtPositionResult extends SemanticQueryBaseResult {
    context?: SymbolContext;
    symbols: PbSymbol[];
    primarySymbol?: PbSymbol;
}

export interface ResolveCallAtPositionArgs {
    document: vscode.TextDocument;
    position: vscode.Position;
    context?: SymbolContext;
}

export interface ResolveCallAtPositionResult extends SemanticQueryBaseResult {
    context?: SymbolContext;
    symbols: PbSymbol[];
    primarySymbol?: PbSymbol;
    systemEntry?: PbSystemSymbolEntry;
}

export interface ResolveCompletionAtPositionArgs {
    document: vscode.TextDocument;
    position: vscode.Position;
    context?: CompletionContext;
}

export interface ResolveCompletionAtPositionResult extends SemanticQueryBaseResult {
    context?: CompletionContext;
    symbols: PbSymbol[];
    systemEntries: PbSystemSymbolEntry[];
    ownerTypeNames: string[];
    isIncomplete: boolean;
}

export interface ResolveSignatureAtPositionArgs {
    document: vscode.TextDocument;
    position: vscode.Position;
    context?: SignatureCallContext;
}

export interface ResolveSignatureAtPositionResult extends SemanticQueryBaseResult {
    context?: SignatureCallContext;
    symbols: PbSymbol[];
    systemEntry?: PbSystemSymbolEntry;
    shouldProvideHelp: boolean;
}

export interface ResolveDefinitionArgs {
    word: string;
    uri: vscode.Uri;
    symbolContext?: PbSemanticResolutionContext;
}

export interface ResolveDefinitionResult extends SemanticQueryBaseResult {
    symbols: PbSymbol[];
    primarySymbol?: PbSymbol;
    locations: vscode.Location[];
}

export interface FindReferencesArgs {
    word: string;
    uri: vscode.Uri;
    includeDeclaration: boolean;
    symbolContext?: PbSemanticResolutionContext;
}

export type FindReferencesResult = SemanticReferenceQueryResult;

export interface ResolveReferencesResult extends SemanticQueryBaseResult {
    query: SemanticReferenceQueryResult;
    locations: vscode.Location[];
}

export interface PlanRenameArgs {
    word: string;
    uri: vscode.Uri;
    symbolContext?: PbSemanticResolutionContext;
}

export type PlanRenameResult = SemanticRenamePlan | undefined;

export interface ResolveRenameTargetArgs {
    word: string;
    uri: vscode.Uri;
    symbolContext?: PbSemanticResolutionContext;
}

export interface ResolveRenameTargetResult extends SemanticQueryBaseResult {
    canRename: boolean;
    renameTarget?: SemanticRenameTarget;
}

export interface ResolveLinkedEditingRangesArgs extends ResolveRenameTargetArgs {
    document?: vscode.TextDocument;
}

export interface ResolveLinkedEditingRangesResult extends SemanticQueryBaseResult {
    ranges: vscode.Range[];
}

export interface ResolveRenameEditsArgs extends ResolveRenameTargetArgs {
    newName: string;
}

export interface ResolveRenameEditsResult extends SemanticQueryBaseResult {
    renamePlan?: SemanticRenamePlan;
    edit?: vscode.WorkspaceEdit;
}

export interface ExplainAmbiguityArgs {
    word: string;
    uri: vscode.Uri;
    symbolContext?: PbSemanticResolutionContext;
}

export interface ExplainAmbiguityResult extends SemanticQueryBaseResult {
    symbols: PbSymbol[];
    primarySymbol?: PbSymbol;
}