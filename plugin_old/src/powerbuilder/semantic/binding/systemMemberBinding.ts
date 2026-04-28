import * as vscode from 'vscode';
import { SignatureCallContext } from '../../document/documentUtils';
import { SymbolIndex } from '../../indexing/symbolIndex';
import {
    resolveSystemEventForOwner,
    resolveSystemGlobalFunction,
    resolveSystemMemberFunctionForOwner,
} from '../../knowledge/services/queryService';
import { PbSystemSymbolEntry } from '../../knowledge/types';
import { getResolvedOwnerNames } from '../owners/ownerResolution';

export interface PbSemanticOwnerLookupContext {
    qualifiedOwner?: string;
    qualifiedOwnerExpression?: string;
    qualifier?: '.' | '::';
    isDynamicDispatch?: boolean;
    isAncestorControlCall?: boolean;
}

export interface PbSemanticSystemMemberLookupArgs {
    index: SymbolIndex;
    word: string;
    uri: vscode.Uri;
    position: vscode.Position;
    context?: PbSemanticOwnerLookupContext;
}

export interface PbSemanticSystemCallLookupArgs {
    index: SymbolIndex;
    uri: vscode.Uri;
    position: vscode.Position;
    context: Pick<
        SignatureCallContext,
        'name' | 'qualifiedOwner' | 'qualifiedOwnerExpression' | 'qualifier' | 'isDynamicDispatch' | 'isAncestorControlCall'
    >;
}

export function resolveOwnerTypeNamesAtPosition(
    args: Omit<PbSemanticSystemMemberLookupArgs, 'word'>,
): string[] {
    const { context, index, uri, position } = args;

    if (context?.isAncestorControlCall || !context?.qualifiedOwner) {
        return [];
    }

    return getResolvedOwnerNames(
        {
            qualifiedOwner: context.qualifiedOwner,
            qualifiedOwnerExpression: context.qualifiedOwnerExpression,
            qualifier: context.qualifier,
        },
        index,
        uri,
        position,
    );
}

export function resolveSystemMemberAtPosition(
    args: PbSemanticSystemMemberLookupArgs,
): PbSystemSymbolEntry | undefined {
    const { context, index, position, uri, word } = args;

    if (
        context?.isDynamicDispatch ||
        context?.isAncestorControlCall ||
        !context?.qualifiedOwner ||
        !context.qualifier
    ) {
        return undefined;
    }

    const ownerTypeNames = resolveOwnerTypeNamesAtPosition({
        context,
        index,
        uri,
        position,
    });

    if (ownerTypeNames.length === 0) {
        return undefined;
    }

    return context.qualifier === '::'
        ? resolveSystemEventForOwner(word, ownerTypeNames)
        : resolveSystemMemberFunctionForOwner(word, ownerTypeNames);
}

export function resolveSystemCallAtPosition(
    args: PbSemanticSystemCallLookupArgs,
): PbSystemSymbolEntry | undefined {
    const { context, index, position, uri } = args;

    if (context.isDynamicDispatch || context.isAncestorControlCall) {
        return undefined;
    }

    if (!context.qualifiedOwner) {
        return resolveSystemGlobalFunction(context.name);
    }

    if (!context.qualifier) {
        return undefined;
    }

    const ownerTypeNames = resolveOwnerTypeNamesAtPosition({
        context,
        index,
        uri,
        position,
    });

    if (ownerTypeNames.length === 0) {
        return undefined;
    }

    return context.qualifier === '::'
        ? resolveSystemEventForOwner(context.name, ownerTypeNames)
        : resolveSystemMemberFunctionForOwner(context.name, ownerTypeNames);
}