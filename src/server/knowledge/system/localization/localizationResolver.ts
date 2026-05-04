import { normalizeOwnerTypeNames, normalizeSystemSymbolName } from '../normalization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../registry/registry';
import type { PbSystemSymbolEntry } from '../types';
import { PB_SYSTEM_SYMBOL_LOCALIZATION_ES } from './es';
import type {
  PbCatalogLocale,
  PbResolvedSystemSymbolLocalizationOverlay,
  PbSystemSymbolLocalizationCatalogReport,
  PbSystemSymbolLocalizationDomainCoverage,
  PbSystemSymbolLocalizationIncompleteOverlay,
  PbSystemSymbolLocalizationIndex,
  PbSystemSymbolLocalizationInvalidParameterTarget,
  PbSystemSymbolLocalizationLocaleSummary,
  PbSystemSymbolLocalizationMissingField,
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

type MutableDomainCoverage = {
  totalTargetCount: number;
  localizedTargetIds: Set<string>;
  reviewedTargetIds: Set<string>;
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

function createDomainCoverage(totalTargetCount: number): MutableDomainCoverage {
  return {
    totalTargetCount,
    localizedTargetIds: new Set<string>(),
    reviewedTargetIds: new Set<string>(),
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

function buildCanonicalEntryIdAliases(entries: readonly PbSystemSymbolEntry[]): ReadonlyMap<string, string> {
  const buckets = new Map<string, PbSystemSymbolEntry[]>();

  for (const entry of entries) {
    const lookupKey = buildEntryTargetLookupKey(entry);
    const bucket = buckets.get(lookupKey) ?? [];
    bucket.push(entry);
    buckets.set(lookupKey, bucket);
  }

  const canonicalEntryIdByEntryId = new Map<string, string>();
  for (const bucket of buckets.values()) {
    const canonicalTargetEntryId = selectCanonicalTargetEntryId(bucket);
    if (!canonicalTargetEntryId) {
      continue;
    }

    for (const entry of bucket) {
      canonicalEntryIdByEntryId.set(entry.id, canonicalTargetEntryId);
    }
  }

  return canonicalEntryIdByEntryId;
}

function buildCanonicalTargetCountsByDomain(entries: readonly PbSystemSymbolEntry[]): Map<PbSystemSymbolEntry['domain'], number> {
  const buckets = new Map<string, PbSystemSymbolEntry[]>();

  for (const entry of entries) {
    const lookupKey = buildEntryTargetLookupKey(entry);
    const bucket = buckets.get(lookupKey) ?? [];
    bucket.push(entry);
    buckets.set(lookupKey, bucket);
  }

  const countsByDomain = new Map<PbSystemSymbolEntry['domain'], number>();
  for (const bucket of buckets.values()) {
    const canonicalTargetEntryId = selectCanonicalTargetEntryId(bucket);
    if (!canonicalTargetEntryId) {
      continue;
    }

    const domain = bucket[0]?.domain;
    if (!domain) {
      continue;
    }

    countsByDomain.set(domain, (countsByDomain.get(domain) ?? 0) + 1);
  }

  return countsByDomain;
}

function normalizeLookupText(value?: string): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : undefined;
}

function hasNonEmptyText(value?: string): boolean {
  return Boolean(value?.trim());
}

function hasNonEmptyList(values?: readonly string[]): boolean {
  return Boolean(values?.some(value => value.trim()));
}

function buildDocumentedParameterTargets(entry: PbSystemSymbolEntry): ReadonlyMap<string, ReadonlySet<string>> {
  const parametersBySignature = new Map<string, Set<string>>();

  for (const signature of entry.signatures) {
    const signatureKey = normalizeLookupText(signature.label);
    if (!signatureKey) {
      continue;
    }

    const documentedParameters = parametersBySignature.get(signatureKey) ?? new Set<string>();
    for (const parameter of signature.parameters ?? []) {
      if (!hasNonEmptyText(parameter.documentation)) {
        continue;
      }

      const parameterKey = normalizeLookupText(parameter.label);
      if (!parameterKey) {
        continue;
      }

      documentedParameters.add(parameterKey);
    }

    if (documentedParameters.size > 0) {
      parametersBySignature.set(signatureKey, documentedParameters);
    }
  }

  return parametersBySignature;
}

function buildOverlayParameterTargets(overlay: PbSystemSymbolLocalizationOverlay): ReadonlyMap<string, ReadonlySet<string>> {
  const parametersBySignature = new Map<string, Set<string>>();

  for (const parameter of overlay.parameters ?? []) {
    if (!hasNonEmptyText(parameter.documentation)) {
      continue;
    }

    const signatureKey = normalizeLookupText(parameter.signatureLabel);
    const parameterKey = normalizeLookupText(parameter.parameterName);
    if (!signatureKey || !parameterKey) {
      continue;
    }

    const documentedParameters = parametersBySignature.get(signatureKey) ?? new Set<string>();
    documentedParameters.add(parameterKey);
    parametersBySignature.set(signatureKey, documentedParameters);
  }

  return parametersBySignature;
}

function collectIncompleteFields(
  entry: PbSystemSymbolEntry,
  overlay: PbSystemSymbolLocalizationOverlay,
): PbSystemSymbolLocalizationMissingField[] {
  const missingFields: PbSystemSymbolLocalizationMissingField[] = [];

  if (hasNonEmptyText(entry.summary) && !hasNonEmptyText(overlay.text?.summary)) {
    missingFields.push('summary');
  }
  if (hasNonEmptyText(entry.documentation) && !hasNonEmptyText(overlay.text?.documentation)) {
    missingFields.push('documentation');
  }
  if (hasNonEmptyText(entry.obsoleteMessage) && !hasNonEmptyText(overlay.text?.obsoleteMessage)) {
    missingFields.push('obsoleteMessage');
  }
  if (hasNonEmptyText(entry.returnDocumentation) && !hasNonEmptyText(overlay.text?.returnDocumentation)) {
    missingFields.push('returnDocumentation');
  }
  if (hasNonEmptyList(entry.usageNotes) && !hasNonEmptyList(overlay.text?.usageNotes)) {
    missingFields.push('usageNotes');
  }

  const documentedParameterTargets = buildDocumentedParameterTargets(entry);
  if (documentedParameterTargets.size > 0) {
    const overlayParameterTargets = buildOverlayParameterTargets(overlay);
    const missingParameterDocumentation = Array.from(documentedParameterTargets.entries()).some(
      ([signatureKey, documentedParameters]) => {
        const localizedParameters = overlayParameterTargets.get(signatureKey) ?? new Set<string>();
        return Array.from(documentedParameters).some(parameterKey => !localizedParameters.has(parameterKey));
      },
    );

    if (missingParameterDocumentation) {
      missingFields.push('parameterDocumentation');
    }
  }

  return missingFields;
}

function collectInvalidParameterTargets(
  entry: PbSystemSymbolEntry,
  overlay: PbSystemSymbolLocalizationOverlay,
): PbSystemSymbolLocalizationInvalidParameterTarget[] {
  if (!overlay.parameters || overlay.parameters.length === 0) {
    return [];
  }

  const validParametersBySignature = new Map<string, Set<string>>();
  for (const signature of entry.signatures) {
    const signatureKey = normalizeLookupText(signature.label);
    if (!signatureKey) {
      continue;
    }

    const parameterNames = new Set<string>();
    for (const parameter of signature.parameters ?? []) {
      const parameterKey = normalizeLookupText(parameter.label);
      if (parameterKey) {
        parameterNames.add(parameterKey);
      }
    }

    validParametersBySignature.set(signatureKey, parameterNames);
  }

  const issues: PbSystemSymbolLocalizationInvalidParameterTarget[] = [];
  for (const parameter of overlay.parameters) {
    const signatureKey = normalizeLookupText(parameter.signatureLabel);
    const parameterKey = normalizeLookupText(parameter.parameterName);
    const validParameters = signatureKey ? validParametersBySignature.get(signatureKey) : undefined;
    if (!signatureKey || !parameterKey || !validParameters || !validParameters.has(parameterKey)) {
      issues.push({
        locale: overlay.locale,
        targetEntryId: entry.id,
        targetName: entry.name,
        domain: entry.domain,
        targetId: overlay.targetId,
        targetKey: overlay.targetKey,
        signatureLabel: parameter.signatureLabel,
        parameterName: parameter.parameterName,
      });
    }
  }

  return issues;
}

function buildIncompleteOverlaySortKey(overlay: PbSystemSymbolLocalizationIncompleteOverlay): string {
  return [
    overlay.locale,
    overlay.domain,
    overlay.targetName,
    overlay.targetEntryId,
    overlay.missingFields.join('+'),
  ].join('|');
}

function buildInvalidParameterTargetSortKey(issue: PbSystemSymbolLocalizationInvalidParameterTarget): string {
  return [
    issue.locale,
    issue.domain,
    issue.targetName,
    issue.signatureLabel,
    issue.parameterName,
  ].join('|');
}

function finalizeDomainCoverage(
  coverageByDomain: Partial<Record<PbSystemSymbolEntry['domain'], MutableDomainCoverage>>,
  totalTargetCountsByDomain: ReadonlyMap<PbSystemSymbolEntry['domain'], number>,
): Partial<Record<PbSystemSymbolEntry['domain'], PbSystemSymbolLocalizationDomainCoverage>> {
  const finalized: Partial<Record<PbSystemSymbolEntry['domain'], PbSystemSymbolLocalizationDomainCoverage>> = {};

  for (const [domain, totalTargetCount] of totalTargetCountsByDomain.entries()) {
    const coverage = coverageByDomain[domain] ?? createDomainCoverage(totalTargetCount);
    const localizedTargetCount = coverage.localizedTargetIds.size;
    const reviewedTargetCount = coverage.reviewedTargetIds.size;

    finalized[domain] = {
      domain,
      totalTargetCount,
      localizedTargetCount,
      reviewedTargetCount,
      localizedRatio: totalTargetCount === 0 ? 1 : localizedTargetCount / totalTargetCount,
      reviewedRatio: totalTargetCount === 0 ? 1 : reviewedTargetCount / totalTargetCount,
    };
  }

  return finalized;
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
  const canonicalEntryIdAliases = buildCanonicalEntryIdAliases(entries);
  const totalTargetCountsByDomain = buildCanonicalTargetCountsByDomain(entries);
  const localeMaps = new Map<PbCatalogLocale, Map<string, PbResolvedSystemSymbolLocalizationOverlay>>();
  const localeSummaries: Partial<Record<PbCatalogLocale, MutableLocaleSummary>> = {};
  const domainCoverage: Partial<Record<PbCatalogLocale, Partial<Record<PbSystemSymbolEntry['domain'], MutableDomainCoverage>>>> = {};
  const incompleteOverlays: PbSystemSymbolLocalizationIncompleteOverlay[] = [];
  const invalidParameterTargets: PbSystemSymbolLocalizationInvalidParameterTarget[] = [];
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

    const effectiveTargetEntryId = canonicalEntryIdAliases.get(targetEntryId) ?? targetEntryId;
    const targetEntry = entryById.get(effectiveTargetEntryId) ?? entryById.get(targetEntryId);
    if (!targetEntry) {
      summary.orphanCount += 1;
      orphanOverlays.push(buildOrphan(overlay, 'missing-target-id', normalizedTargetId));
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

    const localeCoverage = domainCoverage[overlay.locale] ?? {};
    const targetCoverage = localeCoverage[targetEntry.domain] ?? createDomainCoverage(totalTargetCountsByDomain.get(targetEntry.domain) ?? 0);
    targetCoverage.localizedTargetIds.add(targetEntry.id);
    if (overlay.reviewed) {
      targetCoverage.reviewedTargetIds.add(targetEntry.id);
    }
    localeCoverage[targetEntry.domain] = targetCoverage;
    domainCoverage[overlay.locale] = localeCoverage;

    const missingFields = collectIncompleteFields(targetEntry, overlay);
    if (missingFields.length > 0) {
      incompleteOverlays.push({
        locale: overlay.locale,
        targetEntryId: targetEntry.id,
        targetName: targetEntry.name,
        domain: targetEntry.domain,
        targetId: normalizedTargetId ?? overlay.targetId,
        targetKey: overlay.targetKey,
        missingFields,
      });
    }

    invalidParameterTargets.push(...collectInvalidParameterTargets(targetEntry, overlay));
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

  const finalizedDomainCoverage: Partial<Record<PbCatalogLocale, Partial<Record<PbSystemSymbolEntry['domain'], PbSystemSymbolLocalizationDomainCoverage>>>> = {};
  for (const locale of Object.keys(localeSummaries) as PbCatalogLocale[]) {
    finalizedDomainCoverage[locale] = finalizeDomainCoverage(domainCoverage[locale] ?? {}, totalTargetCountsByDomain);
  }

  return {
    locales: readonlyLocaleMaps,
    localeSummaries: finalizedLocaleSummaries,
    domainCoverage: finalizedDomainCoverage,
    incompleteOverlays: incompleteOverlays.sort((left, right) => buildIncompleteOverlaySortKey(left).localeCompare(buildIncompleteOverlaySortKey(right))),
    invalidParameterTargets: invalidParameterTargets.sort((left, right) => buildInvalidParameterTargetSortKey(left).localeCompare(buildInvalidParameterTargetSortKey(right))),
    overlayCount: overlays.length,
    orphanOverlays: orphanOverlays.sort((left, right) => buildOrphanSortKey(left).localeCompare(buildOrphanSortKey(right))),
  };
}

let cachedSystemSymbolLocalizationIndex: PbSystemSymbolLocalizationIndex | undefined;
let cachedCanonicalEntryIdAliases: ReadonlyMap<string, string> | undefined;

export function getSystemSymbolLocalizationIndex(): PbSystemSymbolLocalizationIndex {
  if (!cachedSystemSymbolLocalizationIndex) {
    cachedSystemSymbolLocalizationIndex = buildSystemSymbolLocalizationIndex(
      PB_SYSTEM_SYMBOL_REGISTRY.entries,
      SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS,
    );
    cachedCanonicalEntryIdAliases = buildCanonicalEntryIdAliases(PB_SYSTEM_SYMBOL_REGISTRY.entries);
  }

  return cachedSystemSymbolLocalizationIndex;
}

export function getSystemSymbolLocalizationOverlay(
  entryId: string,
  locale: PbCatalogLocale,
): PbResolvedSystemSymbolLocalizationOverlay | undefined {
  const index = getSystemSymbolLocalizationIndex();
  const localeMap = index.locales.get(locale);
  if (!localeMap) {
    return undefined;
  }

  const directOverlay = localeMap.get(entryId);
  if (directOverlay) {
    return directOverlay;
  }

  const canonicalEntryId = cachedCanonicalEntryIdAliases?.get(entryId);
  return canonicalEntryId ? localeMap.get(canonicalEntryId) : undefined;
}

export function getSystemSymbolLocalizationCatalogReport(): PbSystemSymbolLocalizationCatalogReport {
  const index = getSystemSymbolLocalizationIndex();

  return {
    locales: index.localeSummaries,
    domainCoverage: index.domainCoverage,
    incompleteOverlays: index.incompleteOverlays,
    invalidParameterTargets: index.invalidParameterTargets,
    orphanOverlays: index.orphanOverlays,
  };
}

export const PB_SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS = SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS;