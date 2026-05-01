import {
    PbSystemSymbolEntry,
    PbSystemSymbolEntryDraft,
    PbSystemSymbolProvenance,
} from './types';
import type { EntityLineage } from '../types';

export function systemProvenanceToLineage(provenance: PbSystemSymbolProvenance): EntityLineage {
    return {
        sourceKind: 'system',
        authority: provenance.authority,
        phase: 'implementation',
        role: 'implementation',
        confidence: provenance.authority === 'official' || provenance.authority === 'curated' ? 'direct' : 'fallback',
    };
}

function inferProvenanceKind(
    dataset: PbSystemSymbolEntryDraft['dataset'],
): PbSystemSymbolProvenance['kind'] {
    if (dataset === 'manual-core') {
        return 'manual';
    }

    if (dataset === 'generated') {
        return 'generated';
    }

    if (dataset.startsWith('project:')) {
        return 'project';
    }

    if (dataset.startsWith('workspace:')) {
        return 'workspace';
    }

    return 'custom';
}

function inferProvenanceAuthority(
    dataset: PbSystemSymbolEntryDraft['dataset'],
): PbSystemSymbolProvenance['authority'] {
    if (dataset === 'manual-core') {
        return 'curated';
    }

    if (dataset === 'generated') {
        return 'official';
    }

    if (dataset.startsWith('project:')) {
        return 'project';
    }

    if (dataset.startsWith('workspace:')) {
        return 'workspace';
    }

    return 'custom';
}

function inferProvenanceVersion(
    entry: Pick<PbSystemSymbolEntryDraft, 'dataset' | 'source' | 'sourceUrl'>,
): string | undefined {
    const haystack = `${entry.source} ${entry.sourceUrl ?? ''}`.toLowerCase();

    if (
        entry.dataset === 'manual-core' ||
        entry.dataset === 'generated' ||
        haystack.includes('pb2025') ||
        haystack.includes('powerbuilder 2025')
    ) {
        return 'PowerBuilder 2025';
    }

    return undefined;
}

function finalizeSystemSymbolProvenance(
    entry: Pick<PbSystemSymbolEntryDraft, 'dataset' | 'source' | 'sourceUrl' | 'provenance'>,
): PbSystemSymbolProvenance {
    return {
        kind: entry.provenance?.kind ?? inferProvenanceKind(entry.dataset),
        authority: entry.provenance?.authority ?? inferProvenanceAuthority(entry.dataset),
        source: entry.provenance?.source?.trim() || entry.source.trim(),
        sourceUrl: entry.provenance?.sourceUrl?.trim() || entry.sourceUrl?.trim(),
        version: entry.provenance?.version?.trim() || inferProvenanceVersion(entry),
        generatedAt: entry.provenance?.generatedAt?.trim() || undefined,
    };
}

export function normalizeSystemSymbolName(value?: string): string | undefined {
    const normalized = value?.trim().replace(/\s+/g, ' ').toLowerCase();
    return normalized ? normalized : undefined;
}

export function normalizeOwnerTypeNames(ownerTypeNames?: readonly string[]): string[] {
    const values = new Set<string>();

    for (const ownerTypeName of ownerTypeNames ?? []) {
        const normalizedOwnerTypeName = normalizeSystemSymbolName(ownerTypeName);

        if (normalizedOwnerTypeName) {
            values.add(normalizedOwnerTypeName);
        }
    }

    return Array.from(values).sort();
}

export function buildSystemSymbolLookupKeys(
    name: string,
    lookupAliases?: readonly string[],
): string[] {
    const keys = new Set<string>();

    for (const value of [name, ...(lookupAliases ?? [])]) {
        const normalized = normalizeSystemSymbolName(value);

        if (normalized) {
            keys.add(normalized);
        }
    }

    return Array.from(keys);
}

export function buildSystemSymbolId(
    entry: Pick<
        PbSystemSymbolEntryDraft,
        'dataset' | 'domain' | 'kind' | 'namespace' | 'invocation' | 'name' | 'ownerTypes'
    >,
): string {
    const normalizedName = normalizeSystemSymbolName(entry.name) ?? 'unknown';
    const ownerKey = normalizeOwnerTypeNames(entry.ownerTypes).join('+') || 'all';

    return [
        entry.dataset,
        entry.domain,
        entry.kind,
        entry.namespace,
        entry.invocation,
        normalizedName,
        ownerKey,
    ].join(':');
}

export function finalizeSystemSymbolEntry(
    entry: PbSystemSymbolEntryDraft,
): PbSystemSymbolEntry {
    const normalizedName = normalizeSystemSymbolName(entry.name);

    if (!normalizedName) {
        throw new Error('System symbol entry requires a non-empty name.');
    }

    const normalizedOwnerTypes = normalizeOwnerTypeNames(entry.ownerTypes);
    const normalizedLookupAliases = buildSystemSymbolLookupKeys('', entry.lookupAliases)
        .filter(value => value.length > 0);
    const normalizedEntry: PbSystemSymbolEntryDraft = {
        ...entry,
        name: entry.name.trim(),
        category: entry.category.trim(),
        summary: entry.summary.trim(),
        source: entry.source.trim(),
        sourceUrl: entry.sourceUrl?.trim(),
        ownerTypes: normalizedOwnerTypes.length > 0 ? normalizedOwnerTypes : undefined,
        lookupAliases: normalizedLookupAliases.length > 0 ? normalizedLookupAliases : undefined,
    };
    const provenance = finalizeSystemSymbolProvenance(normalizedEntry);

    return {
        ...normalizedEntry,
        provenance,
        id: buildSystemSymbolId(normalizedEntry),
        normalizedName,
        lookupKeys: buildSystemSymbolLookupKeys(normalizedEntry.name, normalizedEntry.lookupAliases),
        normalizedOwnerTypes,
    };
}
