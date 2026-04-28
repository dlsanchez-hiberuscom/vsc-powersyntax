import * as vscode from 'vscode';
import {
    getSignatureCallContextAtPosition,
    getSymbolContextAtPosition,
    SignatureCallContext,
    SymbolContext,
} from '../../document/documentUtils';
import { PbSemanticResolutionContext } from '../semanticContext';
import {
    PbSemanticEvidence,
    PbSemanticPrecision,
} from '../contracts';
import {
    ResolveSymbolAtPositionResult,
    SemanticAmbiguityReason,
} from './contracts';

export function resolveSymbolQueryContext(
    document: vscode.TextDocument,
    position: vscode.Position,
    context?: SymbolContext,
): SymbolContext | undefined {
    return context ?? getSymbolContextAtPosition(document, position);
}

export function resolveSignatureQueryContext(
    document: vscode.TextDocument,
    position: vscode.Position,
    context?: SignatureCallContext,
): SignatureCallContext | undefined {
    return context ?? getSignatureCallContextAtPosition(document, position);
}

export function buildEmptyResolveSymbolResult(
    precision: PbSemanticPrecision,
    reasons: SemanticAmbiguityReason[],
    evidence: PbSemanticEvidence[] = [],
): ResolveSymbolAtPositionResult {
    return {
        context: undefined,
        symbols: [],
        primarySymbol: undefined,
        precision,
        reasons,
        evidence,
    };
}

export function toSemanticResolutionContext(
    context: Pick<
        SymbolContext,
        | 'qualifiedOwner'
        | 'qualifiedOwnerExpression'
        | 'qualifier'
        | 'isDynamicDispatch'
        | 'dynamicDispatchKind'
        | 'isAncestorControlCall'
        | 'isAncestorReturnValue'
        | 'providedArgumentCount'
        | 'range'
    >,
): PbSemanticResolutionContext {
    return {
        qualifiedOwner: context.qualifiedOwner,
        qualifiedOwnerExpression: context.qualifiedOwnerExpression,
        qualifier: context.qualifier,
        isDynamicDispatch: context.isDynamicDispatch,
        dynamicDispatchKind: context.dynamicDispatchKind,
        isAncestorControlCall: context.isAncestorControlCall,
        isAncestorReturnValue: context.isAncestorReturnValue,
        providedArgumentCount: context.providedArgumentCount,
        range: context.range,
    };
}