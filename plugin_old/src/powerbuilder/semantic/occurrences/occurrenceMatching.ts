import { findQualifiedOwnerBeforeText } from '../../document/documentUtils';
import { PbSymbol } from '../../models/pbSymbol';
import {
    getNormalizedOwnerNames,
    getResolvedOwnerNames,
} from '../owners/ownerResolution';
import {
    OccurrenceMatchArgs,
    PbResolutionContext,
} from '../ranking/contracts';
import {
    getCallableParameterCount,
    getCallableParameterTypeKeys,
    isCallableSymbol,
    normalizeIdentifier,
} from '../ranking/shared';
import {
    getMemberVariableScope,
    isMemberVariableSymbol,
} from '../visibility/symbolVisibility';

interface OccurrenceContext {
    ownerName?: string;
    qualifier?: '.' | '::';
}

export function canSearchTextOccurrences(
    symbols: PbSymbol[],
    context: PbResolutionContext,
): boolean {
    if (symbols.length === 0) {
        return false;
    }

    if (
        context.isDynamicDispatch ||
        context.isAncestorControlCall ||
        context.isAncestorReturnValue
    ) {
        return false;
    }

    if (normalizeIdentifier(context.qualifiedOwnerExpression ?? context.qualifiedOwner)) {
        return true;
    }

    const logicalKeys = new Set(
        symbols.map(symbol => getLogicalSymbolKey(symbol)),
    );

    return logicalKeys.size === 1;
}

export function occurrenceMatchesResolvedSymbols(
    args: OccurrenceMatchArgs,
): boolean {
    const occurrence = getOccurrenceContext(
        args.text,
        args.startOffset,
    );

    const explicitOwnerNames = getResolvedOwnerNames(
        args.context,
        args.index,
        args.requestUri,
    );

    if (explicitOwnerNames.length > 0) {
        if (!occurrence.ownerName || !occurrence.qualifier) {
            return false;
        }

        const normalizedOccurrenceOwner = normalizeIdentifier(occurrence.ownerName);
        const rawOwner = normalizeIdentifier(args.context.qualifiedOwner);

        if (!normalizedOccurrenceOwner) {
            return false;
        }

        return explicitOwnerNames.includes(normalizedOccurrenceOwner) || normalizedOccurrenceOwner === rawOwner;
    }

    if (!occurrence.ownerName) {
        return true;
    }

    const normalizedOccurrenceOwner = normalizeIdentifier(occurrence.ownerName);

    if (!normalizedOccurrenceOwner) {
        return true;
    }

    if (
        args.resolvedSymbols.some(symbol =>
            getNormalizedOwnerNames(symbol).includes(normalizedOccurrenceOwner),
        )
    ) {
        return true;
    }

    if (normalizedOccurrenceOwner === 'this') {
        const occurrenceFileObjectName = normalizeIdentifier(
            args.index.getPrimaryFileObjectName(args.fileUri),
        );

        if (!occurrenceFileObjectName) {
            return false;
        }

        return args.resolvedSymbols.some(symbol =>
            normalizeIdentifier(symbol.fileObjectName) === occurrenceFileObjectName,
        );
    }

    return false;
}

export function getLogicalSymbolKey(symbol: PbSymbol): string {
    const owners = getNormalizedOwnerNames(symbol)
        .sort()
        .join('&');
    const callableIdentity = getCallableIdentityKey(symbol);
    const variableIdentity = getVariableIdentityKey(symbol);
    const externalIdentity = getExternalCallableIdentityKey(symbol);

    return [
        normalizeIdentifier(symbol.name) ?? '',
        normalizeIdentifier(symbol.kind) ?? '',
        normalizeIdentifier(symbol.declarationScope) ?? '',
        owners,
        normalizeIdentifier(symbol.fileObjectName) ?? '',
        normalizeIdentifier(symbol.containerSignature) ?? '',
        callableIdentity,
        variableIdentity,
        externalIdentity,
    ].join('|');
}

function getVariableIdentityKey(symbol: PbSymbol): string {
    if (!isMemberVariableSymbol(symbol)) {
        return '';
    }

    return normalizeIdentifier(symbol.access) ?? getMemberVariableScope(symbol);
}

function getExternalCallableIdentityKey(symbol: PbSymbol): string {
    if (!symbol.isExternal) {
        return '';
    }

    return [
        'external',
        normalizeIdentifier(symbol.externalLibraryName) ?? '',
        normalizeIdentifier(symbol.externalName) ?? '',
    ].join(':');
}

function getCallableIdentityKey(symbol: PbSymbol): string {
    if (!isCallableSymbol(symbol)) {
        return '';
    }

    return [
        getCallableParameterCount(symbol),
        getCallableParameterTypeKeys(symbol).join(','),
    ].join(':');
}

function getOccurrenceContext(
    text: string,
    startOffset: number,
): OccurrenceContext {
    const lookBehindStart = Math.max(0, startOffset - 200);
    const prefix = text.slice(lookBehindStart, startOffset);

    const ownerInfo = findQualifiedOwnerBeforeText(prefix, true);

    if (!ownerInfo) {
        return {};
    }

    return {
        ownerName: ownerInfo.owner,
        qualifier: ownerInfo.qualifier,
    };
}