import {
    PbSystemSymbolEntry,
    PbSystemSymbolIndexes,
} from '../types';
import { normalizeSystemSymbolName } from '../normalization';

function freezeBuckets<T extends string>(
    index: Map<T, PbSystemSymbolEntry[]>,
): ReadonlyMap<T, readonly PbSystemSymbolEntry[]> {
    return new Map(
        Array.from(index.entries(), ([key, bucket]) => [key, Object.freeze([...bucket])]),
    );
}

function buildCompositeKey(left: string, right: string): string {
    return `${left}\u0000${right}`;
}

function groupEntriesByKey<T extends string>(
    entries: readonly PbSystemSymbolEntry[],
    getKeys: (entry: PbSystemSymbolEntry) => readonly T[],
): ReadonlyMap<T, readonly PbSystemSymbolEntry[]> {
    const index = new Map<T, PbSystemSymbolEntry[]>();

    for (const entry of entries) {
        for (const key of getKeys(entry)) {
            const bucket = index.get(key) ?? [];
            bucket.push(entry);
            index.set(key, bucket);
        }
    }

    return freezeBuckets(index);
}

function groupEntriesByPair(
    entries: readonly PbSystemSymbolEntry[],
    getPairs: (entry: PbSystemSymbolEntry) => readonly (readonly [string, string])[],
): ReadonlyMap<string, readonly PbSystemSymbolEntry[]> {
    const index = new Map<string, PbSystemSymbolEntry[]>();

    for (const entry of entries) {
        for (const [left, right] of getPairs(entry)) {
            const key = buildCompositeKey(left, right);
            const bucket = index.get(key) ?? [];
            bucket.push(entry);
            index.set(key, bucket);
        }
    }

    return freezeBuckets(index);
}

function getEnumeratedTypeKeys(entry: PbSystemSymbolEntry): readonly string[] {
    if (entry.kind !== 'enumerated-value' && entry.domain !== 'datawindow-constants') {
        return [];
    }

    const derivedTypeName = entry.enumValueOf ?? entry.valueType;
    const normalizedTypeName = normalizeSystemSymbolName(derivedTypeName);

    return normalizedTypeName ? [normalizedTypeName] : [];
}

export function buildSystemSymbolIndexes(
    entries: readonly PbSystemSymbolEntry[],
): PbSystemSymbolIndexes {
    return {
        byId: new Map(entries.map(entry => [entry.id, entry])),
        byName: groupEntriesByKey(entries, entry => [entry.normalizedName]),
        byLookupKey: groupEntriesByKey(entries, entry => entry.lookupKeys),
        byDomainAndLookupKey: groupEntriesByPair(
            entries,
            entry => entry.lookupKeys.map(lookupKey => [entry.domain, lookupKey] as const),
        ),
        byKindAndLookupKey: groupEntriesByPair(
            entries,
            entry => entry.lookupKeys.map(lookupKey => [entry.kind, lookupKey] as const),
        ),
        byEnumValueOf: groupEntriesByKey(entries, getEnumeratedTypeKeys),
        byNamespace: groupEntriesByKey(entries, entry => [entry.namespace]),
        byKind: groupEntriesByKey(entries, entry => [entry.kind]),
        byInvocation: groupEntriesByKey(entries, entry => [entry.invocation]),
        byDomain: groupEntriesByKey(entries, entry => [entry.domain]),
        byDataset: groupEntriesByKey(entries, entry => [entry.dataset]),
        byOwnerType: groupEntriesByKey(entries, entry => entry.normalizedOwnerTypes),
        byOwnerTypeAndDomain: groupEntriesByPair(
            entries,
            entry => entry.normalizedOwnerTypes.map(ownerType => [ownerType, entry.domain] as const),
        ),
    };
}