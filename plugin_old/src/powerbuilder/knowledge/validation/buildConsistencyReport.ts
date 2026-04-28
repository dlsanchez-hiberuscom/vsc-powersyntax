import { PB_SYSTEM_SYMBOL_DATASET_SLICES } from '../registry/datasets';
import { PbSystemSymbolDatasetSlice, PbSystemSymbolEntry } from '../types';
import { PbSystemSymbolConsistencyReport } from './reportTypes';
import { validateSystemSymbolCatalog } from './validateSystemSymbolCatalog';

function collectEntries(
    slices: readonly PbSystemSymbolDatasetSlice[],
): readonly PbSystemSymbolEntry[] {
    return slices.flatMap(slice => slice.entries);
}

function incrementCount(
    counts: Record<string, number>,
    key: string,
): void {
    counts[key] = (counts[key] ?? 0) + 1;
}

function buildExactIdentityKey(entry: PbSystemSymbolEntry): string {
    return [
        entry.domain,
        entry.kind,
        entry.namespace,
        entry.invocation,
        entry.normalizedName,
        entry.normalizedOwnerTypes.join('+') || 'all',
    ].join('|');
}

function buildSharedNameKey(entry: PbSystemSymbolEntry): string {
    return [entry.domain, entry.normalizedName].join('|');
}

export function buildSystemSymbolConsistencyReport(
    slices: readonly PbSystemSymbolDatasetSlice[] = PB_SYSTEM_SYMBOL_DATASET_SLICES,
    generatedAt: string = new Date().toISOString(),
): PbSystemSymbolConsistencyReport {
    const entries = collectEntries(slices);
    const validation = validateSystemSymbolCatalog(slices);
    const validationByCode: Record<string, number> = {};
    const provenanceByKind: Record<string, number> = {};
    const provenanceByAuthority: Record<string, number> = {};
    const identities = new Map<string, Set<string>>();
    const sharedNames = new Map<string, Set<string>>();
    const sharedNamesByDomain: Record<string, number> = {};

    for (const issue of validation.issues) {
        incrementCount(validationByCode, issue.code);
    }

    for (const entry of entries) {
        incrementCount(provenanceByKind, entry.provenance.kind);
        incrementCount(provenanceByAuthority, entry.provenance.authority);

        const identityDatasets = identities.get(buildExactIdentityKey(entry)) ?? new Set<string>();
        identityDatasets.add(entry.dataset);
        identities.set(buildExactIdentityKey(entry), identityDatasets);

        const sharedNameDatasets = sharedNames.get(buildSharedNameKey(entry)) ?? new Set<string>();
        sharedNameDatasets.add(entry.dataset);
        sharedNames.set(buildSharedNameKey(entry), sharedNameDatasets);
    }

    let sharedNamesAcrossDatasets = 0;

    for (const [key, datasets] of sharedNames.entries()) {
        if (datasets.size < 2) {
            continue;
        }

        sharedNamesAcrossDatasets += 1;
        const [domain] = key.split('|');
        incrementCount(sharedNamesByDomain, domain);
    }

    return {
        generatedAt,
        validation: {
            ok: validation.ok,
            issueCount: validation.issues.length,
            byCode: validationByCode,
        },
        slices: slices.map(slice => ({
            key: `${slice.dataset}:${slice.domain}`,
            count: slice.entries.length,
        })),
        provenance: {
            byKind: provenanceByKind,
            byAuthority: provenanceByAuthority,
            withVersion: entries.filter(entry => !!entry.provenance.version).length,
            withGeneratedAt: entries.filter(entry => !!entry.provenance.generatedAt).length,
            missingGeneratedAt: entries.filter(
                entry => entry.provenance.kind === 'generated' && !entry.provenance.generatedAt,
            ).length,
        },
        overlaps: {
            exactIdentityAcrossDatasets: Array.from(identities.values())
                .filter(datasets => datasets.size > 1).length,
            sharedNamesAcrossDatasets,
            sharedNamesByDomain,
        },
    };
}