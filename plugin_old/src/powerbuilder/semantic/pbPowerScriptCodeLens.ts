import * as vscode from 'vscode';
import { getSymbolContextAtPosition } from '../document/documentUtils';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbSymbol } from '../models/pbSymbol';
import { getInheritanceGraph } from './inheritanceGraph';
import { SemanticQueryService } from './queries/semanticQueryService';

const SHOW_REFERENCES_COMMAND = 'editor.action.showReferences';
const CALLABLE_CODELENS_KINDS = new Set<PbSymbol['kind']>([
    'function',
    'subroutine',
    'event',
    'global-function',
]);

export async function providePowerScriptCodeLenses(
    document: vscode.TextDocument,
    index: SymbolIndex = SymbolIndex.getInstance(),
    semanticQueries: SemanticQueryService = new SemanticQueryService(index),
): Promise<vscode.CodeLens[]> {
    index.indexDocument(document, { silent: true });

    const symbols = dedupeCallableCodeLensSymbols(
        index
            .getSymbolsForFile(document.uri)
            .filter(isCallableCodeLensCandidate),
    )
        .sort((left, right) => {
            if (left.selectionRange.start.line !== right.selectionRange.start.line) {
                return left.selectionRange.start.line - right.selectionRange.start.line;
            }

            return left.selectionRange.start.character - right.selectionRange.start.character;
        });
    const lenses: vscode.CodeLens[] = [];

    for (const symbol of symbols) {
        const declarationPosition = resolveSymbolNamePosition(document, symbol);
        const context = declarationPosition
            ? getSymbolContextAtPosition(document, declarationPosition)
            : undefined;

        if (!context?.word) {
            continue;
        }

        const references = await semanticQueries.resolveReferences({
            word: context.word,
            uri: document.uri,
            includeDeclaration: false,
            symbolContext: context,
        });

        if (references.locations.length === 0) {
            lenses.push(...buildInheritanceCodeLenses(symbol, context.range, index));
            continue;
        }

        lenses.push(new vscode.CodeLens(context.range, {
            title: formatReferenceCountTitle(references.locations.length),
            command: SHOW_REFERENCES_COMMAND,
            arguments: [document.uri, declarationPosition, references.locations],
        }));
        lenses.push(...buildInheritanceCodeLenses(symbol, context.range, index));
    }

    return lenses;
}

function isCallableCodeLensCandidate(symbol: PbSymbol): boolean {
    return CALLABLE_CODELENS_KINDS.has(symbol.kind)
        && !symbol.isPrototype;
}

function formatReferenceCountTitle(referenceCount: number): string {
    return referenceCount === 1
        ? '1 referencia'
        : `${referenceCount} referencias`;
}

function buildInheritanceCodeLenses(
    symbol: PbSymbol,
    anchorRange: vscode.Range,
    index: SymbolIndex,
): vscode.CodeLens[] {
    const ownerTypeName = getCallableOwnerTypeName(symbol);

    if (!ownerTypeName || symbol.kind === 'global-function') {
        return [];
    }

    const graph = getInheritanceGraph(index);
    const hierarchy = graph.getTypeHierarchy(ownerTypeName);
    const directAncestorTypeName = hierarchy.length > 1
        ? hierarchy[1]
        : undefined;
    const lenses: vscode.CodeLens[] = [];

    if (directAncestorTypeName) {
        const ancestorSymbol = findCallableInOwner(index, directAncestorTypeName, symbol);

        if (ancestorSymbol) {
            lenses.push(new vscode.CodeLens(anchorRange, {
                title: `Sobrescribe ${directAncestorTypeName}.${symbol.name}`,
                command: 'vscode.open',
                arguments: [ancestorSymbol.uri, { selection: ancestorSymbol.selectionRange }],
            }));
        }
    }

    const derivedLocations = graph
        .getDirectDerivedTypes(ownerTypeName)
        .map(derivedType => findCallableInOwner(index, derivedType.name, symbol))
        .filter((candidate): candidate is PbSymbol => !!candidate)
        .map(candidate => new vscode.Location(candidate.uri, candidate.selectionRange));

    if (derivedLocations.length > 0) {
        lenses.push(new vscode.CodeLens(anchorRange, {
            title: formatDerivedOverrideTitle(derivedLocations.length),
            command: SHOW_REFERENCES_COMMAND,
            arguments: [symbol.uri, anchorRange.start, derivedLocations],
        }));
    }

    return lenses;
}

function dedupeCallableCodeLensSymbols(symbols: readonly PbSymbol[]): PbSymbol[] {
    const byKey = new Map<string, PbSymbol>();

    for (const symbol of symbols) {
        const key = [
            symbol.kind,
            symbol.name.toLowerCase(),
            symbol.signature?.toLowerCase() ?? '',
            symbol.uri.toString(),
        ].join('::');
        const existing = byKey.get(key);

        if (!existing) {
            byKey.set(key, symbol);
            continue;
        }

        if (shouldPreferCodeLensSymbol(symbol, existing)) {
            byKey.set(key, symbol);
        }
    }

    return Array.from(byKey.values());
}

function resolveSymbolNamePosition(
    document: vscode.TextDocument,
    symbol: PbSymbol,
): vscode.Position | undefined {
    const selectionText = document.getText(symbol.selectionRange);
    const nameOffset = selectionText.toLowerCase().indexOf(symbol.name.toLowerCase());

    if (nameOffset < 0) {
        return undefined;
    }

    return document.positionAt(document.offsetAt(symbol.selectionRange.start) + nameOffset);
}

function shouldPreferCodeLensSymbol(candidate: PbSymbol, current: PbSymbol): boolean {
    if (current.isPrototype && !candidate.isPrototype) {
        return true;
    }

    if (
        current.implementationKind !== 'implementation' &&
        candidate.implementationKind === 'implementation'
    ) {
        return true;
    }

    return false;
}

function getCallableOwnerTypeName(symbol: PbSymbol): string | undefined {
    return symbol.fileObjectName ?? symbol.parent ?? symbol.containerName;
}

function findCallableInOwner(
    index: SymbolIndex,
    ownerTypeName: string,
    target: PbSymbol,
): PbSymbol | undefined {
    const ownerKey = ownerTypeName.toLowerCase();
    const matches = dedupeCallableCodeLensSymbols(
        index
            .findSymbolByName(target.name)
            .filter(candidate =>
                isCallableCodeLensCandidate(candidate) &&
                getCallableOwnerTypeName(candidate)?.toLowerCase() === ownerKey &&
                hasMatchingCallableIdentity(candidate, target),
            ),
    );

    return matches[0];
}

function hasMatchingCallableIdentity(left: PbSymbol, right: PbSymbol): boolean {
    if (left.kind !== right.kind) {
        return false;
    }

    const leftSignature = left.signature?.trim().toLowerCase();
    const rightSignature = right.signature?.trim().toLowerCase();

    if (leftSignature && rightSignature) {
        return leftSignature === rightSignature;
    }

    if (
        left.parameterCount !== undefined &&
        right.parameterCount !== undefined
    ) {
        return left.parameterCount === right.parameterCount;
    }

    return left.name.toLowerCase() === right.name.toLowerCase();
}

function formatDerivedOverrideTitle(derivedCount: number): string {
    return derivedCount === 1
        ? 'Heredado por 1'
        : `Heredado por ${derivedCount}`;
}