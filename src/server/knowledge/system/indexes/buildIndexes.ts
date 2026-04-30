import {
    PbSystemSymbolEntry,
    PbSystemSymbolIndexes,
} from '../types';

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

    return index;
}

export function buildSystemSymbolIndexes(
    entries: readonly PbSystemSymbolEntry[],
): PbSystemSymbolIndexes {
    return {
        byId: new Map(entries.map(entry => [entry.id, entry])),
        byName: groupEntriesByKey(entries, entry => [entry.normalizedName]),
        byLookupKey: groupEntriesByKey(entries, entry => entry.lookupKeys),
        byNamespace: groupEntriesByKey(entries, entry => [entry.namespace]),
        byKind: groupEntriesByKey(entries, entry => [entry.kind]),
        byInvocation: groupEntriesByKey(entries, entry => [entry.invocation]),
        byDomain: groupEntriesByKey(entries, entry => [entry.domain]),
        byDataset: groupEntriesByKey(entries, entry => [entry.dataset]),
        byOwnerType: groupEntriesByKey(entries, entry => entry.normalizedOwnerTypes),
    };
}