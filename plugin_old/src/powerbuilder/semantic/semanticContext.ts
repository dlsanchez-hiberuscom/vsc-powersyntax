import * as vscode from 'vscode';
import type { SymbolContext } from '../document/documentUtils';

export type PbSemanticDispatchKind = 'function' | 'event';

export interface PbSemanticOwnerContext {
    qualifiedOwner?: string;
    qualifiedOwnerExpression?: string;
    qualifier?: '.' | '::';
    isDynamicDispatch?: boolean;
    dynamicDispatchKind?: PbSemanticDispatchKind;
    isAncestorControlCall?: boolean;
    isAncestorReturnValue?: boolean;
}

export type PbSemanticResolutionContext = Pick<
    SymbolContext,
    | 'qualifiedOwner'
    | 'qualifiedOwnerExpression'
    | 'qualifier'
    | 'isDynamicDispatch'
    | 'dynamicDispatchKind'
    | 'isAncestorControlCall'
    | 'isAncestorReturnValue'
> & {
    providedArgumentCount?: number;
    range?: vscode.Range;
};

export function toSemanticOwnerContext(
    symbolContext?: Pick<
        PbSemanticResolutionContext,
        | 'qualifiedOwner'
        | 'qualifiedOwnerExpression'
        | 'qualifier'
        | 'isDynamicDispatch'
        | 'dynamicDispatchKind'
        | 'isAncestorControlCall'
        | 'isAncestorReturnValue'
    >,
): PbSemanticOwnerContext {
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