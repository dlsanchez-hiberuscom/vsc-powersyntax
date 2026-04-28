import { PB_GENERATED_OFFICIAL_COVERAGE } from '../generated/officialCoverage.generated';
import { PB_SYSTEM_SYMBOL_DATASET_SLICES } from '../registry/datasets';
import {
    PbSystemSymbolDatasetSlice,
    PbSystemSymbolDomain,
    PbSystemSymbolEntry,
} from '../types';
import {
    PbSystemSymbolCoverageReport,
    PbSystemSymbolOfficialCoverageReport,
} from './reportTypes';

const DOMAIN_ORDER: readonly PbSystemSymbolDomain[] = [
    'global-functions',
    'object-functions',
    'datawindow-functions',
    'system-events',
    'datawindow-events',
    'statements',
];

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

function buildOwnerTypeUniverseByDataset(
    entries: readonly PbSystemSymbolEntry[],
): Record<string, number> {
    const values = new Map<string, Set<string>>();

    for (const entry of entries) {
        const bucket = values.get(entry.dataset) ?? new Set<string>();

        for (const ownerType of entry.normalizedOwnerTypes) {
            bucket.add(ownerType);
        }

        values.set(entry.dataset, bucket);
    }

    return Object.fromEntries(
        Array.from(values.entries()).map(([dataset, ownerTypes]) => [dataset, ownerTypes.size]),
    );
}

function getOfficialCoverageForDomain(
    domain: PbSystemSymbolDomain,
): PbSystemSymbolOfficialCoverageReport | undefined {
    const officialCoverage = (
        PB_GENERATED_OFFICIAL_COVERAGE as Partial<Record<PbSystemSymbolDomain, PbSystemSymbolOfficialCoverageReport>>
    )[domain];

    return officialCoverage ? { ...officialCoverage } : undefined;
}

export function buildSystemSymbolCoverageReport(
    slices: readonly PbSystemSymbolDatasetSlice[] = PB_SYSTEM_SYMBOL_DATASET_SLICES,
    generatedAt: string = new Date().toISOString(),
): PbSystemSymbolCoverageReport {
    const entries = collectEntries(slices);
    const totalByDataset: Record<string, number> = {};
    const totalByNamespace: Record<string, number> = {};
    const ownerTypeUniverse = new Set<string>();

    for (const entry of entries) {
        incrementCount(totalByDataset, entry.dataset);
        incrementCount(totalByNamespace, entry.namespace);

        for (const ownerType of entry.normalizedOwnerTypes) {
            ownerTypeUniverse.add(ownerType);
        }
    }

    const families = DOMAIN_ORDER.map(domain => {
        const domainEntries = entries.filter(entry => entry.domain === domain);
        const byDataset: Record<string, number> = {};

        for (const entry of domainEntries) {
            incrementCount(byDataset, entry.dataset);
        }

        return {
            domain,
            integratedCount: domainEntries.length,
            byDataset,
            officialCoverage: getOfficialCoverageForDomain(domain),
        };
    });

    const objectEventCount = families.find(family => family.domain === 'system-events')?.integratedCount ?? 0;
    const dataWindowEventCount = families.find(family => family.domain === 'datawindow-events')?.integratedCount ?? 0;

    return {
        generatedAt,
        totalEntries: entries.length,
        totalByDataset,
        totalByNamespace,
        families,
        objectEventCount,
        dataWindowEventCount,
        combinedEventCount: objectEventCount + dataWindowEventCount,
        ownerTypeUniverseCount: ownerTypeUniverse.size,
        ownerTypeUniverseByDataset: buildOwnerTypeUniverseByDataset(entries),
        metadata: {
            obsoleteCount: entries.filter(entry => entry.obsolete).length,
            replacementCount: entries.filter(entry => !!entry.replacement).length,
            aliasCount: entries.filter(entry => (entry.lookupAliases?.length ?? 0) > 0).length,
            sourceUrlCount: entries.filter(entry => !!entry.sourceUrl).length,
            provenanceVersionCount: entries.filter(entry => !!entry.provenance.version).length,
            generatedAtCount: entries.filter(entry => !!entry.provenance.generatedAt).length,
        },
    };
}