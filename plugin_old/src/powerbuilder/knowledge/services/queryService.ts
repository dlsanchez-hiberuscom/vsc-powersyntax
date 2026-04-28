import { normalizeSystemSymbolName, normalizeOwnerTypeNames } from '../normalization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../registry/registry';
import { PbSystemSymbolEntry } from '../types';

const DATAWINDOW_OWNER_TYPES = new Set(['datawindow', 'datawindowchild', 'datastore']);

function lookupInIndex(
    index: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>,
    name: string,
): readonly PbSystemSymbolEntry[] {
    const normalizedName = normalizeSystemSymbolName(name);

    if (!normalizedName) {
        return [];
    }

    return index.get(normalizedName) ?? [];
}

function getOwnerMatchScore(
    entry: Pick<PbSystemSymbolEntry, 'normalizedOwnerTypes'>,
    ownerTypeNames: readonly string[],
): number {
    const normalizedOwnerTypeNames = normalizeOwnerTypeNames(ownerTypeNames);
    const entryOwnerTypes = entry.normalizedOwnerTypes;

    if (normalizedOwnerTypeNames.length === 0) {
        return entryOwnerTypes.length > 0 ? -1 : 0;
    }

    if (entryOwnerTypes.length === 0) {
        return 0;
    }

    let bestScore = -1;

    for (const entryOwnerType of entryOwnerTypes) {
        const matchIndex = normalizedOwnerTypeNames.indexOf(entryOwnerType);

        if (matchIndex >= 0) {
            bestScore = Math.max(bestScore, 1000 - matchIndex);
        }
    }

    return bestScore;
}

function dedupeEntries(
    entries: readonly PbSystemSymbolEntry[],
): readonly PbSystemSymbolEntry[] {
    const seen = new Set<string>();
    const result: PbSystemSymbolEntry[] = [];

    for (const entry of entries) {
        if (!seen.has(entry.id)) {
            seen.add(entry.id);
            result.push(entry);
        }
    }

    return result;
}

function getDomainMatchPriority(
    entry: Pick<PbSystemSymbolEntry, 'domain'>,
    ownerTypeNames: readonly string[],
): number {
    const normalizedOwnerTypeNames = normalizeOwnerTypeNames(ownerTypeNames);
    const isDataWindowContext = normalizedOwnerTypeNames.some(ownerType => DATAWINDOW_OWNER_TYPES.has(ownerType));

    if (!isDataWindowContext) {
        return 0;
    }

    return entry.domain === 'datawindow-functions' || entry.domain === 'datawindow-events'
        ? 1
        : 0;
}

function sortEntriesByOwnerMatch(
    entries: readonly PbSystemSymbolEntry[],
    ownerTypeNames: readonly string[],
): readonly PbSystemSymbolEntry[] {
    return [...entries]
        .map((entry, index) => ({
            entry,
            index,
            domainPriority: getDomainMatchPriority(entry, ownerTypeNames),
            ownerScore: getOwnerMatchScore(entry, ownerTypeNames),
        }))
        .filter(item => item.ownerScore >= 0)
        .sort((left, right) => {
            if (right.ownerScore !== left.ownerScore) {
                return right.ownerScore - left.ownerScore;
            }

            if (right.domainPriority !== left.domainPriority) {
                return right.domainPriority - left.domainPriority;
            }

            return left.index - right.index;
        })
        .map(item => item.entry);
}

function getEntriesForDomain(domain: PbSystemSymbolEntry['domain']): readonly PbSystemSymbolEntry[] {
    return PB_SYSTEM_SYMBOL_REGISTRY.indexes.byDomain.get(domain) ?? [];
}

function findEntriesInDomain(
    domain: PbSystemSymbolEntry['domain'],
    name: string,
): readonly PbSystemSymbolEntry[] {
    return lookupInIndex(PB_SYSTEM_SYMBOL_REGISTRY.indexes.byLookupKey, name)
        .filter(entry => entry.domain === domain);
}

export function listSystemSymbols(): readonly PbSystemSymbolEntry[] {
    return PB_SYSTEM_SYMBOL_REGISTRY.entries;
}

export function findSystemSymbolsByName(name: string): readonly PbSystemSymbolEntry[] {
    return lookupInIndex(PB_SYSTEM_SYMBOL_REGISTRY.indexes.byName, name);
}

export function findSystemSymbolsByLookupKey(name: string): readonly PbSystemSymbolEntry[] {
    return lookupInIndex(PB_SYSTEM_SYMBOL_REGISTRY.indexes.byLookupKey, name);
}

export function listSystemSymbolsByNamespace(
    namespace: PbSystemSymbolEntry['namespace'],
): readonly PbSystemSymbolEntry[] {
    return PB_SYSTEM_SYMBOL_REGISTRY.indexes.byNamespace.get(namespace) ?? [];
}

export function listSystemSymbolsByKind(
    kind: PbSystemSymbolEntry['kind'],
): readonly PbSystemSymbolEntry[] {
    return PB_SYSTEM_SYMBOL_REGISTRY.indexes.byKind.get(kind) ?? [];
}

export function listSystemSymbolsByDataset(
    dataset: PbSystemSymbolEntry['dataset'],
): readonly PbSystemSymbolEntry[] {
    return PB_SYSTEM_SYMBOL_REGISTRY.indexes.byDataset.get(dataset) ?? [];
}

export function listSystemGlobalFunctions(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('global-functions');
}

export function listSystemObjectFunctions(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('object-functions');
}

export function listSystemDataWindowFunctions(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('datawindow-functions');
}

export function listSystemObjectEvents(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('system-events');
}

export function listSystemDataWindowEvents(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('datawindow-events');
}

export function listSystemEvents(): readonly PbSystemSymbolEntry[] {
    return [
        ...listSystemObjectEvents(),
        ...listSystemDataWindowEvents(),
    ];
}

export function listSystemStatements(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('statements');
}

export function resolveSystemGlobalFunction(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesInDomain('global-functions', name)[0];
}

export function resolveSystemObjectFunction(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesInDomain('object-functions', name)[0];
}

export function resolveSystemObjectFunctionForOwner(
    name: string,
    ownerTypeNames: readonly string[],
): PbSystemSymbolEntry | undefined {
    return sortEntriesByOwnerMatch(
        findEntriesInDomain('object-functions', name),
        ownerTypeNames,
    )[0];
}

export function resolveSystemDataWindowFunction(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesInDomain('datawindow-functions', name)[0];
}

export function resolveSystemDataWindowFunctionForOwner(
    name: string,
    ownerTypeNames: readonly string[],
): PbSystemSymbolEntry | undefined {
    return sortEntriesByOwnerMatch(
        findEntriesInDomain('datawindow-functions', name),
        ownerTypeNames,
    )[0];
}

export function findApplicableMembersForOwnerType(
    ownerTypeNames: readonly string[],
): readonly PbSystemSymbolEntry[] {
    return dedupeEntries(sortEntriesByOwnerMatch([
        ...listSystemObjectFunctions(),
        ...listSystemDataWindowFunctions(),
    ], ownerTypeNames));
}

export function listSystemMemberFunctionsForOwner(
    ownerTypeNames: readonly string[],
): readonly PbSystemSymbolEntry[] {
    return findApplicableMembersForOwnerType(ownerTypeNames);
}

export function resolveSystemMemberFunctionForOwner(
    name: string,
    ownerTypeNames: readonly string[],
): PbSystemSymbolEntry | undefined {
    return dedupeEntries(sortEntriesByOwnerMatch([
        ...findEntriesInDomain('object-functions', name),
        ...findEntriesInDomain('datawindow-functions', name),
    ], ownerTypeNames))[0];
}

export function resolveSystemObjectEvent(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesInDomain('system-events', name)[0];
}

export function resolveSystemDataWindowEvent(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesInDomain('datawindow-events', name)[0];
}

export function findApplicableEventsForOwnerType(
    ownerTypeNames: readonly string[],
): readonly PbSystemSymbolEntry[] {
    return dedupeEntries(sortEntriesByOwnerMatch(listSystemEvents(), ownerTypeNames));
}

export function resolveSystemEventForOwner(
    name: string,
    ownerTypeNames: readonly string[],
): PbSystemSymbolEntry | undefined {
    return sortEntriesByOwnerMatch(
        lookupInIndex(PB_SYSTEM_SYMBOL_REGISTRY.indexes.byLookupKey, name)
            .filter(entry => entry.kind === 'event'),
        ownerTypeNames,
    )[0];
}

export function listSystemEventsForOwner(
    ownerTypeNames: readonly string[],
): readonly PbSystemSymbolEntry[] {
    return findApplicableEventsForOwnerType(ownerTypeNames);
}

export function resolveSystemEvent(name: string): PbSystemSymbolEntry | undefined {
    return lookupInIndex(PB_SYSTEM_SYMBOL_REGISTRY.indexes.byLookupKey, name)
        .filter(entry => entry.kind === 'event')[0];
}

export function resolveSystemStatement(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesInDomain('statements', name)[0];
}

export function resolveSystemAlias(name: string): readonly PbSystemSymbolEntry[] {
    const normalizedName = normalizeSystemSymbolName(name);

    if (!normalizedName) {
        return [];
    }

    return lookupInIndex(PB_SYSTEM_SYMBOL_REGISTRY.indexes.byLookupKey, name)
        .filter(entry => (entry.lookupAliases ?? []).includes(normalizedName));
}

function resolveSystemSymbol(name: string): PbSystemSymbolEntry | undefined {
    return lookupInIndex(PB_SYSTEM_SYMBOL_REGISTRY.indexes.byLookupKey, name)[0];
}

export function isObsoleteSymbol(
    entryOrName: PbSystemSymbolEntry | string,
): boolean {
    const entry = typeof entryOrName === 'string'
        ? resolveSystemSymbol(entryOrName)
        : entryOrName;

    return entry?.obsolete === true;
}

export function resolveReplacement(
    entryOrName: PbSystemSymbolEntry | string,
): string | undefined {
    const entry = typeof entryOrName === 'string'
        ? resolveSystemSymbol(entryOrName)
        : entryOrName;

    return entry?.replacement;
}
