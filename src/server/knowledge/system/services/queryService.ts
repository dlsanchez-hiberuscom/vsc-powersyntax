import { normalizeSystemSymbolName, normalizeOwnerTypeNames } from '../normalization';
import { isKnownNativeAncestorType } from '../nativeAncestors';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../registry/registry';
import { PbSystemSymbolDomain, PbSystemSymbolEntry, PbSystemSymbolKind } from '../types';

const DATAWINDOW_OWNER_TYPES = new Set(['datawindow', 'datawindowchild', 'datastore']);
const MEMBER_FUNCTION_DOMAINS: readonly PbSystemSymbolDomain[] = ['object-functions', 'datawindow-functions'];
const MEMBER_EVENT_DOMAINS: readonly PbSystemSymbolDomain[] = ['system-events', 'datawindow-events'];

export const PB_LANGUAGE_SYMBOL_RESOLUTION_PRIORITY: readonly PbSystemSymbolKind[] = [
    'reserved-word',
    'keyword',
    'pronoun',
    'datatype',
    'system-type',
    'enumerated-type',
    'system-global',
    'enumerated-value',
    'operator',
    'property',
    'constant',
];

function buildCompositeKey(left: string, right: string): string {
    return `${left}\u0000${right}`;
}

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

function lookupInCompositeLookupIndex(
    index: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>,
    left: string,
    name: string,
): readonly PbSystemSymbolEntry[] {
    const normalizedName = normalizeSystemSymbolName(name);

    if (!normalizedName) {
        return [];
    }

    return index.get(buildCompositeKey(left, normalizedName)) ?? [];
}

function lookupInOwnerTypeDomainIndex(
    ownerType: string,
    domain: PbSystemSymbolDomain,
): readonly PbSystemSymbolEntry[] {
    return PB_SYSTEM_SYMBOL_REGISTRY.indexes.byOwnerTypeAndDomain.get(buildCompositeKey(ownerType, domain)) ?? [];
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

function collectEntriesForOwnerDomains(
    ownerTypeNames: readonly string[],
    domains: readonly PbSystemSymbolDomain[],
): readonly PbSystemSymbolEntry[] {
    const normalizedOwnerTypeNames = normalizeOwnerTypeNames(ownerTypeNames);

    if (normalizedOwnerTypeNames.length === 0) {
        return dedupeEntries(domains.flatMap(domain => getEntriesForDomain(domain)));
    }

    return dedupeEntries(
        normalizedOwnerTypeNames.flatMap(ownerType =>
            domains.flatMap(domain => lookupInOwnerTypeDomainIndex(ownerType, domain)),
        ),
    );
}

export function listSystemSymbolsByDomain(
    domain: PbSystemSymbolEntry['domain'],
): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain(domain);
}

export function findEntriesByDomainAndLookupKey(
    domain: PbSystemSymbolEntry['domain'],
    name: string,
): readonly PbSystemSymbolEntry[] {
    return lookupInCompositeLookupIndex(PB_SYSTEM_SYMBOL_REGISTRY.indexes.byDomainAndLookupKey, domain, name);
}

export function findEntriesByKindAndLookupKey(
    kind: PbSystemSymbolEntry['kind'],
    name: string,
): readonly PbSystemSymbolEntry[] {
    return lookupInCompositeLookupIndex(PB_SYSTEM_SYMBOL_REGISTRY.indexes.byKindAndLookupKey, kind, name);
}

export function isKnownSystemOwnerType(name: string): boolean {
    const normalizedName = normalizeSystemSymbolName(name);

    return normalizedName !== undefined
        && (PB_SYSTEM_SYMBOL_REGISTRY.indexes.byOwnerType.has(normalizedName)
            || isKnownNativeAncestorType(normalizedName));
}

export function listSystemSymbols(): readonly PbSystemSymbolEntry[] {
    return PB_SYSTEM_SYMBOL_REGISTRY.entries;
}

export function getSystemCatalogSize(): number {
    return PB_SYSTEM_SYMBOL_REGISTRY.entries.length;
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
    return findEntriesByDomainAndLookupKey('global-functions', name)[0];
}

export function resolveSystemObjectFunction(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('object-functions', name)[0];
}

export function resolveSystemObjectFunctionForOwner(
    name: string,
    ownerTypeNames: readonly string[],
): PbSystemSymbolEntry | undefined {
    return sortEntriesByOwnerMatch(
        findEntriesByDomainAndLookupKey('object-functions', name),
        ownerTypeNames,
    )[0];
}

export function resolveSystemDataWindowFunction(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('datawindow-functions', name)[0];
}

export function resolveSystemDataWindowFunctionForOwner(
    name: string,
    ownerTypeNames: readonly string[],
): PbSystemSymbolEntry | undefined {
    return sortEntriesByOwnerMatch(
        findEntriesByDomainAndLookupKey('datawindow-functions', name),
        ownerTypeNames,
    )[0];
}

export function findApplicableMembersForOwnerType(
    ownerTypeNames: readonly string[],
): readonly PbSystemSymbolEntry[] {
    return dedupeEntries(
        sortEntriesByOwnerMatch(
            collectEntriesForOwnerDomains(ownerTypeNames, MEMBER_FUNCTION_DOMAINS),
            ownerTypeNames,
        ),
    );
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
        ...findEntriesByDomainAndLookupKey('object-functions', name),
        ...findEntriesByDomainAndLookupKey('datawindow-functions', name),
    ], ownerTypeNames))[0];
}

export function resolveSystemObjectEvent(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('system-events', name)[0];
}

export function resolveSystemDataWindowEvent(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('datawindow-events', name)[0];
}

export function findApplicableEventsForOwnerType(
    ownerTypeNames: readonly string[],
): readonly PbSystemSymbolEntry[] {
    return dedupeEntries(
        sortEntriesByOwnerMatch(
            collectEntriesForOwnerDomains(ownerTypeNames, MEMBER_EVENT_DOMAINS),
            ownerTypeNames,
        ),
    );
}

export function resolveSystemEventForOwner(
    name: string,
    ownerTypeNames: readonly string[],
): PbSystemSymbolEntry | undefined {
    return sortEntriesByOwnerMatch(
        findEntriesByKindAndLookupKey('event', name),
        ownerTypeNames,
    )[0];
}

export function listSystemEventsForOwner(
    ownerTypeNames: readonly string[],
): readonly PbSystemSymbolEntry[] {
    return findApplicableEventsForOwnerType(ownerTypeNames);
}

export function resolveSystemEvent(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByKindAndLookupKey('event', name)[0];
}

export function resolveSystemStatement(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('statements', name)[0];
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

// -- Catalog v2: language construct queries --

export function listKeywords(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('keywords');
}

export function listReservedWords(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('reserved-words');
}

export function listDatatypes(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('datatypes');
}

export function listSystemTypes(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('system-object-datatypes');
}

export function listEnumeratedTypes(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('enumerated-types');
}

export function listPronouns(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('pronouns');
}

export function listOperators(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('operators');
}

export function listEnumeratedValues(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('enumerated-values');
}

export function listSystemGlobals(): readonly PbSystemSymbolEntry[] {
    return getEntriesForDomain('system-globals');
}

export function resolveKeyword(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('keywords', name)[0];
}

export function resolveReservedWord(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('reserved-words', name)[0];
}

export function resolveDatatype(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByKindAndLookupKey('datatype', name)[0]
        ?? findEntriesByKindAndLookupKey('system-type', name)[0]
        ?? findEntriesByKindAndLookupKey('enumerated-type', name)[0];
}

export function resolveEnumeratedType(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('enumerated-types', name)[0];
}

export function resolveEnumeratedValue(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('enumerated-values', name)[0];
}

export function resolveSystemGlobal(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('system-globals', name)[0];
}

export function resolvePronoun(name: string): PbSystemSymbolEntry | undefined {
    return findEntriesByDomainAndLookupKey('pronouns', name)[0];
}

export function listValuesForEnumeratedType(typeName: string): readonly PbSystemSymbolEntry[] {
    const normalizedTypeName = normalizeSystemSymbolName(typeName);

    if (!normalizedTypeName) {
        return [];
    }

    return PB_SYSTEM_SYMBOL_REGISTRY.indexes.byEnumValueOf.get(normalizedTypeName) ?? [];
}

export function resolveEnumValueForExpectedType(
    valueName: string,
    typeName: string,
): PbSystemSymbolEntry | undefined {
    const normalizedValueName = normalizeSystemSymbolName(valueName);

    if (!normalizedValueName) {
        return undefined;
    }

    return listValuesForEnumeratedType(typeName)
        .find(entry => entry.lookupKeys.includes(normalizedValueName));
}

/**
 * Resuelve un nombre como símbolo de lenguaje (keyword, reserved word, datatype,
 * system type, pronoun, system global, operator, enumerated value).
 * No busca callables/events/statements — para esos usar findSystemSymbolsByLookupKey.
 */
export function resolveLanguageSymbol(name: string): PbSystemSymbolEntry | undefined {
    for (const kind of PB_LANGUAGE_SYMBOL_RESOLUTION_PRIORITY) {
        const match = findEntriesByKindAndLookupKey(kind, name)[0];

        if (match) {
            return match;
        }
    }

    return undefined;
}

