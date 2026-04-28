import * as vscode from 'vscode';
import { SymbolIndex } from '../../indexing/symbolIndex';
import { PbSymbol } from '../../models/pbSymbol';

const CALLABLE_PARAMETER_NAME_PATTERN = /([a-zA-Z_$#%][\w$#%-]*)(?:\s*\[\s*\])?\s*$/i;

export function normalizeIdentifier(value?: string): string | undefined {
    const trimmed = value?.trim().toLowerCase();
    return trimmed ? trimmed : undefined;
}

export function compareSymbolsByPosition(left: PbSymbol, right: PbSymbol): number {
    const uriComparison = left.uri.toString().localeCompare(right.uri.toString());

    if (uriComparison !== 0) {
        return uriComparison;
    }

    if (left.range.start.line !== right.range.start.line) {
        return left.range.start.line - right.range.start.line;
    }

    return left.range.start.character - right.range.start.character;
}

export function areSameCallable(
    left: PbSymbol | undefined,
    right: PbSymbol | undefined,
): boolean {
    if (!left || !right) {
        return false;
    }

    return left.uri.toString() === right.uri.toString() &&
        (normalizeIdentifier(left.signature) ?? normalizeIdentifier(left.name) ?? '') ===
        (normalizeIdentifier(right.signature) ?? normalizeIdentifier(right.name) ?? '') &&
        left.range.start.line === right.range.start.line &&
        left.range.start.character === right.range.start.character;
}

export function isCallableScopedSymbol(symbol: PbSymbol): boolean {
    return symbol.declarationScope === 'parameter' || symbol.declarationScope === 'local';
}

export function isCallableSymbol(symbol: PbSymbol): boolean {
    return symbol.kind === 'function'
        || symbol.kind === 'global-function'
        || symbol.kind === 'subroutine'
        || symbol.kind === 'event';
}

export function getContainingCallableSymbol(
    symbol: PbSymbol,
    index: SymbolIndex,
): PbSymbol | undefined {
    return index.findInnermostCallableAtPosition(
        symbol.uri,
        symbol.selectionRange.start,
    );
}

export function dedupeSymbols(symbols: PbSymbol[]): PbSymbol[] {
    const seen = new Set<string>();
    const result: PbSymbol[] = [];

    for (const symbol of symbols) {
        const key = [
            symbol.uri.toString(),
            normalizeIdentifier(symbol.name) ?? '',
            symbol.kind,
            symbol.parent ?? '',
            symbol.range.start.line,
            symbol.range.start.character,
            symbol.range.end.line,
            symbol.range.end.character,
            symbol.signature ?? '',
            symbol.containerSignature ?? '',
            symbol.declarationScope ?? '',
            symbol.isPrototype ? 'prototype' : 'implementation',
            symbol.implementationKind ?? '',
            symbol.ownerName ?? '',
            symbol.isExternal ? 'external' : 'internal',
            symbol.externalLibraryName ?? '',
            symbol.externalName ?? '',
        ].join('|');

        if (!seen.has(key)) {
            seen.add(key);
            result.push(symbol);
        }
    }

    return result;
}

export function getCallableParameterCount(symbol: PbSymbol): number {
    if (typeof symbol.parameterCount === 'number') {
        return symbol.parameterCount;
    }

    return getCallableParameterTypeKeys(symbol).length;
}

export function getCallableParameterTypeKeys(symbol: PbSymbol): string[] {
    const signature = symbol.signature?.trim();

    if (!signature) {
        return [];
    }

    const openParenIndex = signature.indexOf('(');
    const closeParenIndex = signature.lastIndexOf(')');

    if (openParenIndex < 0 || closeParenIndex <= openParenIndex) {
        return [];
    }

    const parameters = signature.slice(openParenIndex + 1, closeParenIndex).trim();

    if (!parameters) {
        return [];
    }

    return parameters
        .split(',')
        .map(parameter => normalizeCallableParameterType(parameter))
        .filter((parameter): parameter is string => !!parameter);
}

function normalizeCallableParameterType(parameter: string): string | undefined {
    const normalizedParameter = parameter
        .replace(/\s*\[\s*\]/g, '[]')
        .replace(/\s+/g, ' ')
        .trim();

    if (!normalizedParameter) {
        return undefined;
    }

    const nameMatch = normalizedParameter.match(CALLABLE_PARAMETER_NAME_PATTERN);

    if (!nameMatch) {
        return normalizedParameter.toLowerCase();
    }

    const nameIndex = normalizedParameter
        .toLowerCase()
        .lastIndexOf(nameMatch[1].toLowerCase());

    if (nameIndex < 0) {
        return normalizedParameter.toLowerCase();
    }

    const beforeName = normalizedParameter.slice(0, nameIndex);
    const afterName = normalizedParameter.slice(nameIndex + nameMatch[1].length);
    const typePart = `${beforeName} ${afterName}`
        .replace(/\s+/g, ' ')
        .trim();

    return (typePart || normalizedParameter).toLowerCase();
}