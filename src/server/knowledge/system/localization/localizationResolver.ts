import { normalizeOwnerTypeNames, normalizeSystemSymbolName } from '../normalization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../registry/registry';
import type { PbSystemSymbolEntry } from '../types';
import { PB_SYSTEM_SYMBOL_LOCALIZATION_ES } from './es';
import type {
  PbCatalogLocale,
  PbResolvedSystemSymbolLocalizationOverlay,
  PbSystemSymbolLocalizationCatalogReport,
  PbSystemSymbolLocalizationIndex,
  PbSystemSymbolLocalizationLocaleSummary,
  PbSystemSymbolLocalizationOrphan,
  PbSystemSymbolLocalizationOrphanReason,
  PbSystemSymbolLocalizationOverlay,
  PbSystemSymbolLocalizationTargetKey,
} from './types';

const SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS: readonly PbSystemSymbolLocalizationOverlay[] = [
  ...PB_SYSTEM_SYMBOL_LOCALIZATION_ES,
];

type MutableLocaleSummary = {
  overlayCount: number;
  targetIdCount: number;
  targetKeyCount: number;
  reviewedCount: number;
  orphanCount: number;
};

function createEmptyLocaleSummary(): MutableLocaleSummary {
  return {
    overlayCount: 0,
    targetIdCount: 0,
    targetKeyCount: 0,
    reviewedCount: 0,
    orphanCount: 0,
  };
}

function cloneLocaleSummary(summary: PbSystemSymbolLocalizationLocaleSummary): MutableLocaleSummary {
  return {
    overlayCount: summary.overlayCount,
    targetIdCount: summary.targetIdCount,
    targetKeyCount: summary.targetKeyCount,
    reviewedCount: summary.reviewedCount,
    orphanCount: summary.orphanCount,
  };
}

function buildEntryTargetLookupKey(entry: PbSystemSymbolEntry): string {
  return [
    entry.domain,
    entry.kind,
    entry.namespace,
    entry.invocation,
    entry.normalizedName,
    entry.normalizedOwnerTypes.join('+') || 'all',
  ].join('|');
}

function selectCanonicalTargetEntryId(entries: readonly PbSystemSymbolEntry[]): string | undefined {
  const nonCandidateEntries = entries.filter(entry => entry.manualOverlay?.mode !== 'candidate');

  if (nonCandidateEntries.length === 0) {
    return undefined;
  }

  const manualOverride = nonCandidateEntries.find(
    entry => entry.dataset === 'manual-core' && entry.manualOverlay?.mode === 'override',
  );
  if (manualOverride) {
    return manualOverride.id;
  }

  const generatedEntry = nonCandidateEntries.find(entry => entry.dataset === 'generated');
  if (generatedEntry) {
    return generatedEntry.id;
  }

  return nonCandidateEntries[0]?.id;
}

function buildTargetKeyLookupKey(targetKey: PbSystemSymbolLocalizationTargetKey): string | undefined {
  const normalizedName = normalizeSystemSymbolName(targetKey.name);
  if (!normalizedName) {
    return undefined;
  }

  return [
    targetKey.domain,
    targetKey.kind,
    targetKey.namespace,
    targetKey.invocation,
    normalizedName,
    normalizeOwnerTypeNames(targetKey.ownerTypes).join('+') || 'all',
  ].join('|');
}

function buildEntryIdsByTargetKey(entries: readonly PbSystemSymbolEntry[]): Map<string, string[]> {
  const buckets = new Map<string, PbSystemSymbolEntry[]>();

  for (const entry of entries) {
    const lookupKey = buildEntryTargetLookupKey(entry);
    const bucket = buckets.get(lookupKey) ?? [];
    bucket.push(entry);
    buckets.set(lookupKey, bucket);
  }

  const entryIdsByTargetKey = new Map<string, string[]>();
  for (const [lookupKey, bucket] of buckets) {
    const canonicalTargetEntryId = selectCanonicalTargetEntryId(bucket);
    if (!canonicalTargetEntryId) {
      continue;
    }

    entryIdsByTargetKey.set(lookupKey, [canonicalTargetEntryId]);
  }

  return entryIdsByTargetKey;
}

function buildOrphan(
  overlay: PbSystemSymbolLocalizationOverlay,
  reason: PbSystemSymbolLocalizationOrphanReason,
  targetId: string | undefined,
): PbSystemSymbolLocalizationOrphan {
  return {
    locale: overlay.locale,
    reason,
    targetId,
    targetKey: overlay.targetKey,
  };
}

function buildOrphanSortKey(orphan: PbSystemSymbolLocalizationOrphan): string {
  const targetKey = orphan.targetKey
    ? [
        orphan.targetKey.domain,
        orphan.targetKey.kind,
        orphan.targetKey.namespace,
        orphan.targetKey.invocation,
        orphan.targetKey.name,
        orphan.targetKey.ownerTypes?.join('+') ?? '',
      ].join('|')
    : '';

  return [orphan.locale, orphan.reason, orphan.targetId ?? '', targetKey].join('|');
}

function resolveOverlayTargetId(
  overlay: PbSystemSymbolLocalizationOverlay,
  entryById: ReadonlyMap<string, PbSystemSymbolEntry>,
  entryIdsByTargetKey: ReadonlyMap<string, readonly string[]>,
): {
  targetEntryId?: string;
  orphanReason?: PbSystemSymbolLocalizationOrphanReason;
  normalizedTargetId?: string;
} {
  const normalizedTargetId = overlay.targetId?.trim() || undefined;
  const lookupKey = overlay.targetKey ? buildTargetKeyLookupKey(overlay.targetKey) : undefined;
  const targetIdsFromKey = lookupKey ? entryIdsByTargetKey.get(lookupKey) ?? [] : [];

  if (!normalizedTargetId && !overlay.targetKey) {
    return { orphanReason: 'missing-target' };
  }

  if (normalizedTargetId && !entryById.has(normalizedTargetId)) {
    return { orphanReason: 'missing-target-id', normalizedTargetId };
  }

  if (overlay.targetKey && !lookupKey) {
    return { orphanReason: 'missing-target-key', normalizedTargetId };
  }

  if (!normalizedTargetId) {
    if (targetIdsFromKey.length === 0) {
      return { orphanReason: 'missing-target-key' };
    }
    if (targetIdsFromKey.length > 1) {
      return { orphanReason: 'ambiguous-target-key' };
    }

    return { targetEntryId: targetIdsFromKey[0] };
  }

  if (!overlay.targetKey) {
    return { targetEntryId: normalizedTargetId, normalizedTargetId };
  }

  if (targetIdsFromKey.length === 0) {
    return { orphanReason: 'target-mismatch', normalizedTargetId };
  }
  if (targetIdsFromKey.length > 1) {
    return { orphanReason: 'ambiguous-target-key', normalizedTargetId };
  }
  if (targetIdsFromKey[0] !== normalizedTargetId) {
    return { orphanReason: 'target-mismatch', normalizedTargetId };
  }

  return { targetEntryId: normalizedTargetId, normalizedTargetId };
}

export function buildSystemSymbolLocalizationIndex(
  entries: readonly PbSystemSymbolEntry[],
  overlays: readonly PbSystemSymbolLocalizationOverlay[],
): PbSystemSymbolLocalizationIndex {
  const entryById = new Map(entries.map(entry => [entry.id, entry]));
  const entryIdsByTargetKey = buildEntryIdsByTargetKey(entries);
  const localeMaps = new Map<PbCatalogLocale, Map<string, PbResolvedSystemSymbolLocalizationOverlay>>();
  const localeSummaries: Partial<Record<PbCatalogLocale, MutableLocaleSummary>> = {};
  const orphanOverlays: PbSystemSymbolLocalizationOrphan[] = [];

  for (const overlay of overlays) {
    const summary = cloneLocaleSummary(localeSummaries[overlay.locale] ?? createEmptyLocaleSummary());
    summary.overlayCount += 1;
    if (overlay.targetId?.trim()) {
      summary.targetIdCount += 1;
    }
    if (overlay.targetKey) {
      summary.targetKeyCount += 1;
    }
    if (overlay.reviewed) {
      summary.reviewedCount += 1;
    }

    const { targetEntryId, orphanReason, normalizedTargetId } = resolveOverlayTargetId(
      overlay,
      entryById,
      entryIdsByTargetKey,
    );

    if (!targetEntryId || orphanReason) {
      summary.orphanCount += 1;
      orphanOverlays.push(buildOrphan(overlay, orphanReason ?? 'missing-target', normalizedTargetId));
      localeSummaries[overlay.locale] = summary;
      continue;
    }

    const localeMap = localeMaps.get(overlay.locale) ?? new Map<string, PbResolvedSystemSymbolLocalizationOverlay>();
    localeMap.set(targetEntryId, {
      ...overlay,
      targetEntryId,
      targetId: normalizedTargetId ?? overlay.targetId,
    });
    localeMaps.set(overlay.locale, localeMap);
    localeSummaries[overlay.locale] = summary;
  }

  const readonlyLocaleMaps = new Map<PbCatalogLocale, ReadonlyMap<string, PbResolvedSystemSymbolLocalizationOverlay>>();
  for (const [locale, localeMap] of localeMaps) {
    readonlyLocaleMaps.set(locale, localeMap);
  }

  const finalizedLocaleSummaries: Partial<Record<PbCatalogLocale, PbSystemSymbolLocalizationLocaleSummary>> = {};
  for (const [locale, summary] of Object.entries(localeSummaries) as [PbCatalogLocale, PbSystemSymbolLocalizationLocaleSummary][]) {
    finalizedLocaleSummaries[locale] = cloneLocaleSummary(summary);
  }

  return {
    locales: readonlyLocaleMaps,
    localeSummaries: finalizedLocaleSummaries,
    overlayCount: overlays.length,
    orphanOverlays: orphanOverlays.sort((left, right) => buildOrphanSortKey(left).localeCompare(buildOrphanSortKey(right))),
  };
}

let cachedSystemSymbolLocalizationIndex: PbSystemSymbolLocalizationIndex | undefined;

export function getSystemSymbolLocalizationIndex(): PbSystemSymbolLocalizationIndex {
  if (!cachedSystemSymbolLocalizationIndex) {
    cachedSystemSymbolLocalizationIndex = buildSystemSymbolLocalizationIndex(
      PB_SYSTEM_SYMBOL_REGISTRY.entries,
      SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS,
    );
  }

  return cachedSystemSymbolLocalizationIndex;
}

export function getSystemSymbolLocalizationOverlay(
  entryId: string,
  locale: PbCatalogLocale,
): PbResolvedSystemSymbolLocalizationOverlay | undefined {
  return getSystemSymbolLocalizationIndex().locales.get(locale)?.get(entryId);
}

export function getSystemSymbolLocalizationCatalogReport(): PbSystemSymbolLocalizationCatalogReport {
  const index = getSystemSymbolLocalizationIndex();

  return {
    locales: index.localeSummaries,
    orphanOverlays: index.orphanOverlays,
  };
}

export const PB_SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS = SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS;