import * as vscode from 'vscode';
import { SymbolIndex } from '../indexing/symbolIndex';
import { PbSymbol } from '../models/pbSymbol';

const GRAPH_CACHE = new WeakMap<SymbolIndex, InheritanceGraph>();

export function getInheritanceGraph(index: SymbolIndex): InheritanceGraph {
    let graph = GRAPH_CACHE.get(index);

    if (!graph) {
        graph = new InheritanceGraph(index);
        GRAPH_CACHE.set(index, graph);
    }

    return graph;
}

export class InheritanceGraph {
    private readonly ancestorCache = new Map<string, string[]>();
    private readonly hierarchyCache = new Map<string, string[]>();
    private readonly derivedTypeCache = new Map<string, PbSymbol[]>();
    private readonly memberCache = new Map<string, PbSymbol[]>();

    constructor(private readonly index: SymbolIndex) {
        this.index.onDidChange(() => {
            this.clear();
        });
    }

    clear(): void {
        this.ancestorCache.clear();
        this.hierarchyCache.clear();
        this.derivedTypeCache.clear();
        this.memberCache.clear();
    }

    getAncestors(typeName: string): string[] {
        const normalizedTypeName = normalize(typeName);

        if (!normalizedTypeName) {
            return [];
        }

        const cached = this.ancestorCache.get(normalizedTypeName);

        if (cached) {
            return [...cached];
        }

        const queue = this.findTypeSymbols(typeName)
            .map(symbol => symbol.baseTypeName)
            .filter((candidate): candidate is string => !!normalize(candidate));
        const seen = new Set<string>();
        const ancestors: string[] = [];

        while (queue.length > 0) {
            const current = queue.shift();
            const normalizedCurrent = normalize(current);

            if (!normalizedCurrent || seen.has(normalizedCurrent)) {
                continue;
            }

            seen.add(normalizedCurrent);
            ancestors.push(current!);

            for (const symbol of this.findTypeSymbols(current!)) {
                if (symbol.baseTypeName && normalize(symbol.baseTypeName)) {
                    queue.push(symbol.baseTypeName);
                }
            }
        }

        this.ancestorCache.set(normalizedTypeName, ancestors);
        return [...ancestors];
    }

    getTypeHierarchy(typeName: string): string[] {
        const normalizedTypeName = normalize(typeName);

        if (!normalizedTypeName) {
            return [];
        }

        const cached = this.hierarchyCache.get(normalizedTypeName);

        if (cached) {
            return [...cached];
        }

        const hierarchy = [typeName, ...this.getAncestors(typeName)];
        this.hierarchyCache.set(normalizedTypeName, hierarchy);
        return [...hierarchy];
    }

    getTypeHierarchyAtPosition(
        uri: vscode.Uri,
        position: vscode.Position,
    ): string[] {
        const currentType = this.index.findInnermostTypeAtPosition(uri, position);

        if (currentType?.name) {
            return this.getTypeHierarchy(currentType.name);
        }

        const primaryFileObjectName = this.index.getPrimaryFileObjectName(uri);
        return primaryFileObjectName
            ? this.getTypeHierarchy(primaryFileObjectName)
            : [];
    }

    getDirectDerivedTypes(typeName: string): PbSymbol[] {
        const normalizedTypeName = normalize(typeName);

        if (!normalizedTypeName) {
            return [];
        }

        const cached = this.derivedTypeCache.get(normalizedTypeName);

        if (cached) {
            return [...cached];
        }

        const derivedTypes = dedupeSymbols(this.index.getAllSymbols().filter(symbol =>
            (symbol.kind === 'type' || symbol.kind === 'structure') &&
            !symbol.parent &&
            normalize(symbol.baseTypeName) === normalizedTypeName,
        )).sort((left, right) => {
            const nameDiff = (normalize(left.name) ?? '').localeCompare(normalize(right.name) ?? '');

            if (nameDiff !== 0) {
                return nameDiff;
            }

            return left.uri.toString().localeCompare(right.uri.toString());
        });

        this.derivedTypeCache.set(normalizedTypeName, derivedTypes);
        return [...derivedTypes];
    }

    getMembers(typeName: string): PbSymbol[] {
        const normalizedTypeName = normalize(typeName);

        if (!normalizedTypeName) {
            return [];
        }

        const cached = this.memberCache.get(normalizedTypeName);

        if (cached) {
            return [...cached];
        }

        const members: PbSymbol[] = [];

        for (const ownerName of this.getTypeHierarchy(typeName)) {
            const normalizedOwnerName = normalize(ownerName);

            if (!normalizedOwnerName) {
                continue;
            }

            for (const symbol of this.index.getAllSymbols()) {
                if (!isSemanticMemberSymbol(symbol)) {
                    continue;
                }

                if (getNormalizedOwnerNames(symbol).includes(normalizedOwnerName)) {
                    members.push(symbol);
                }
            }
        }

        const deduped = dedupeSymbols(members);
        this.memberCache.set(normalizedTypeName, deduped);
        return [...deduped];
    }

    getTypeDistance(
        fromTypeName: string,
        targetTypeName: string,
    ): number {
        const normalizedTargetTypeName = normalize(targetTypeName);

        if (!normalizedTargetTypeName) {
            return Number.POSITIVE_INFINITY;
        }

        const hierarchy = this.getTypeHierarchy(fromTypeName);

        for (let index = 0; index < hierarchy.length; index++) {
            if (normalize(hierarchy[index]) === normalizedTargetTypeName) {
                return index;
            }
        }

        return Number.POSITIVE_INFINITY;
    }

    private findTypeSymbols(typeName: string): PbSymbol[] {
        return this.index.findSymbolByName(typeName).filter(symbol =>
            symbol.kind === 'type' || symbol.kind === 'structure',
        );
    }
}

function isSemanticMemberSymbol(symbol: PbSymbol): boolean {
    if (symbol.kind === 'type' || symbol.kind === 'structure') {
        return false;
    }

    return symbol.declarationScope !== 'local' && symbol.declarationScope !== 'parameter';
}

function getNormalizedOwnerNames(symbol: PbSymbol): string[] {
    const values = new Set<string>();

    for (const candidate of [
        symbol.parent,
        symbol.containerName,
        symbol.fileObjectName,
        symbol.ownerName,
    ]) {
        const normalizedCandidate = normalize(candidate);

        if (normalizedCandidate) {
            values.add(normalizedCandidate);
        }
    }

    return Array.from(values);
}

function dedupeSymbols(symbols: PbSymbol[]): PbSymbol[] {
    const seen = new Set<string>();
    const result: PbSymbol[] = [];

    for (const symbol of symbols) {
        const key = [
            symbol.uri.toString(),
            normalize(symbol.name) ?? '',
            symbol.kind,
            symbol.parent ?? '',
            symbol.range.start.line,
            symbol.range.start.character,
            symbol.range.end.line,
            symbol.range.end.character,
            symbol.signature ?? '',
            symbol.containerSignature ?? '',
            symbol.declarationScope ?? '',
            symbol.baseTypeName ?? '',
            symbol.isPrototype ? 'prototype' : 'implementation',
            symbol.implementationKind ?? '',
            symbol.ownerName ?? '',
        ].join('|');

        if (!seen.has(key)) {
            seen.add(key);
            result.push(symbol);
        }
    }

    return result;
}

function normalize(value?: string): string | undefined {
    const trimmed = value?.trim().toLowerCase();
    return trimmed ? trimmed : undefined;
}