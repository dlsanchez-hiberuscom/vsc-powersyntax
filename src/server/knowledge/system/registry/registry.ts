import { buildSystemSymbolIndexes } from '../indexes/buildIndexes';
import { PB_SYSTEM_CATALOG_CONFLICT_POLICY } from '../policy';
import {
    PbSystemSymbolEntry,
    PbSystemSymbolDatasetSlice,
    PbSystemSymbolRegistry,
} from '../types';
import { PB_SYSTEM_SYMBOL_DATASET_SLICES } from './datasets';

function buildLogicalOverlayKey(entry: PbSystemSymbolEntry): string {
    return [
        entry.domain,
        entry.kind,
        entry.namespace,
        entry.invocation,
        entry.enumValueOf ?? '',
        entry.normalizedName,
        entry.normalizedOwnerTypes.join('+') || 'all',
    ].join('|');
}

function resolveManualOverlays(entries: readonly PbSystemSymbolEntry[]): readonly PbSystemSymbolEntry[] {
    const generatedKeys = new Set(
        entries
            .filter(entry => entry.dataset === 'generated')
            .map(buildLogicalOverlayKey),
    );

    return entries.map(entry => {
        if (entry.dataset !== 'manual-core' || entry.manualOverlay) {
            return entry;
        }

        const logicalKey = buildLogicalOverlayKey(entry);
        const hasGeneratedMatch = generatedKeys.has(logicalKey);

        return {
            ...entry,
            manualOverlay: hasGeneratedMatch
                ? {
                    mode: 'enrichment',
                    reason: `Legacy manual-core entry overlaps the generated official catalog and remains classified as curated enrichment under ${PB_SYSTEM_CATALOG_CONFLICT_POLICY}.`,
                    evidence: [`generated-overlap:${logicalKey}`],
                    sourceUrl: entry.sourceUrl,
                    reviewedBy: 'B368',
                    targetKey: {
                        domain: entry.domain,
                        kind: entry.kind,
                        namespace: entry.namespace,
                        invocation: entry.invocation,
                        name: entry.name,
                        ownerTypes: entry.ownerTypes,
                    },
                }
                : {
                    mode: 'gap',
                    reason: 'Manual-core entry remains classified as a curated gap because the generated official catalog has no matching logical entry yet.',
                    evidence: [`manual-gap:${logicalKey}`],
                    sourceUrl: entry.sourceUrl,
                    reviewedBy: 'B368',
                },
        };
    });
}

export function createSystemSymbolRegistry(
    slices: readonly PbSystemSymbolDatasetSlice[],
): PbSystemSymbolRegistry {
    const baseEntries = slices.flatMap(slice => slice.entries);
    const entries = resolveManualOverlays(baseEntries);
    const entryById = new Map(entries.map(entry => [entry.id, entry]));
    const normalizedSlices = slices.map(slice => ({
        ...slice,
        entries: slice.entries.map(entry => entryById.get(entry.id) ?? entry),
    }));

    return {
        slices: normalizedSlices,
        entries,
        indexes: buildSystemSymbolIndexes(entries),
    };
}

export const PB_SYSTEM_SYMBOL_REGISTRY = createSystemSymbolRegistry(
    PB_SYSTEM_SYMBOL_DATASET_SLICES,
);