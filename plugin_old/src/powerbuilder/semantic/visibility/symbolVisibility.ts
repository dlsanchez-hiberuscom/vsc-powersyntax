import * as vscode from 'vscode';
import { SymbolIndex } from '../../indexing/symbolIndex';
import { PbSymbol } from '../../models/pbSymbol';
import { getInheritanceGraph } from '../inheritanceGraph';
import { SemanticVisibilityResult } from '../ranking/contracts';
import {
    isCallableScopedSymbol,
    normalizeIdentifier,
} from '../ranking/shared';

const MEMBER_VARIABLE_SCOPE_PRIORITY: Record<string, number> = {
    shared: 3,
    global: 2,
    instance: 1,
};

export function filterSymbolsVisibleFromPosition(
    symbols: PbSymbol[],
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): PbSymbol[] {
    return symbols.filter(symbol => isSymbolVisibleFromPosition(symbol, index, uri, position));
}

export function getSymbolVisibility(
    symbol: PbSymbol,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): SemanticVisibilityResult {
    if (!isMemberVariableSymbol(symbol)) {
        return {
            visibility: 'visible',
            isVisible: true,
            detail: 'El símbolo no está sujeto a visibilidad de miembro variable.',
        };
    }

    const visibility = getMemberVariableVisibility(symbol);

    if (!visibility || visibility === 'public') {
        return {
            visibility: 'visible',
            isVisible: true,
            detail: 'El miembro es público o no declara una restricción explícita.',
        };
    }

    const declaringTypeName = getDeclaringTypeName(symbol);
    const currentTypeName = getCurrentTypeNameAtPosition(index, uri, position);

    if (!declaringTypeName || !currentTypeName) {
        return {
            visibility: 'visible',
            isVisible: true,
            detail: 'No hay contexto tipado suficiente para bloquear la visibilidad.',
        };
    }

    const distance = getInheritanceGraph(index).getTypeDistance(
        currentTypeName,
        declaringTypeName,
    );

    if (visibility === 'private') {
        return distance === 0
            ? {
                visibility: 'visible',
                isVisible: true,
                detail: 'El miembro privado pertenece al mismo tipo declarado.',
            }
            : {
                visibility: 'hidden-private',
                isVisible: false,
                detail: 'El miembro privado no es visible fuera del tipo que lo declara.',
            };
    }

    return Number.isFinite(distance)
        ? {
            visibility: 'visible',
            isVisible: true,
            detail: 'El miembro protected es visible en la jerarquía actual.',
        }
        : {
            visibility: 'hidden-protected',
            isVisible: false,
            detail: 'El miembro protected queda fuera de la jerarquía visible.',
        };
}

export function isSymbolVisibleFromPosition(
    symbol: PbSymbol,
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): boolean {
    return getSymbolVisibility(symbol, index, uri, position).isVisible;
}

export function filterToHighestVariableMemberScope(symbols: PbSymbol[]): PbSymbol[] {
    const memberVariableSymbols = symbols.filter(isMemberVariableSymbol);

    if (memberVariableSymbols.length === 0) {
        return symbols;
    }

    let highestPriority = Number.NEGATIVE_INFINITY;

    for (const symbol of memberVariableSymbols) {
        highestPriority = Math.max(highestPriority, getMemberVariableScopePriority(symbol));
    }

    const bestVariableSymbols = memberVariableSymbols.filter(symbol =>
        getMemberVariableScopePriority(symbol) === highestPriority,
    );
    const nonVariableSymbols = symbols.filter(symbol => !isMemberVariableSymbol(symbol));

    return nonVariableSymbols.length > 0
        ? [...nonVariableSymbols, ...bestVariableSymbols]
        : bestVariableSymbols;
}

export function isMemberVariableSymbol(symbol: PbSymbol): boolean {
    return !isCallableScopedSymbol(symbol) &&
        (symbol.kind === 'variable' || symbol.kind === 'constant');
}

export function getMemberVariableScope(symbol: PbSymbol): string {
    const normalizedAccess = normalizeIdentifier(symbol.access);

    if (normalizedAccess === 'shared' || normalizedAccess === 'global') {
        return normalizedAccess;
    }

    return 'instance';
}

function getCurrentTypeNameAtPosition(
    index: SymbolIndex,
    uri: vscode.Uri,
    position: vscode.Position,
): string | undefined {
    const currentType = index.findInnermostTypeAtPosition(uri, position);

    if (currentType?.name) {
        return currentType.name;
    }

    return index.getPrimaryFileObjectName(uri);
}

function getDeclaringTypeName(symbol: PbSymbol): string | undefined {
    return symbol.fileObjectName ?? symbol.parent ?? symbol.containerName;
}

function getMemberVariableScopePriority(symbol: PbSymbol): number {
    return MEMBER_VARIABLE_SCOPE_PRIORITY[getMemberVariableScope(symbol)] ?? 0;
}

function getMemberVariableVisibility(symbol: PbSymbol): 'public' | 'protected' | 'private' | undefined {
    const normalizedAccess = normalizeIdentifier(symbol.access);

    if (
        normalizedAccess === 'private' ||
        normalizedAccess === 'privateread' ||
        normalizedAccess === 'privatewrite'
    ) {
        return 'private';
    }

    if (
        normalizedAccess === 'protected' ||
        normalizedAccess === 'protectedread' ||
        normalizedAccess === 'protectedwrite'
    ) {
        return 'protected';
    }

    if (normalizedAccess === 'public') {
        return 'public';
    }

    return undefined;
}