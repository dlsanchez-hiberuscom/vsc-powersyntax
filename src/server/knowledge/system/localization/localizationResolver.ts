import { normalizeOwnerTypeNames, normalizeSystemSymbolName } from '../normalization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../registry/registry';
import type { PbSystemSymbolEntry } from '../types';
import { PB_SYSTEM_SYMBOL_LOCALIZATION_ES } from './es';
import { PB_SYSTEM_SYMBOL_LOCALIZATION_SCHEMA_VERSION } from './schema';
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
  PbSystemSymbolLocalizationMissingFieldsByDomain,
  PbSystemSymbolLocalizationOrphan,
  PbSystemSymbolLocalizationOrphanReason,
  PbSystemSymbolLocalizationOverlay,
  PbSystemSymbolLocalizationRecoveredTargetId,
  PbSystemSymbolLocalizationSchemaIssue,
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

function buildLookupKeyBase(
  domain: string,
  kind: string,
  namespace: string,
  invocation: string,
  normalizedName: string,
): string {
  return [domain, kind, namespace, invocation, normalizedName].join('|');
}

function buildLookupKeyWithOwnerTypes(
  domain: string,
  kind: string,
  namespace: string,
  invocation: string,
  normalizedName: string,
  normalizedOwnerTypes: readonly string[],
): string {
  return [buildLookupKeyBase(domain, kind, namespace, invocation, normalizedName), normalizedOwnerTypes.join('+') || 'all'].join('|');
}

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
  return buildLookupKeyWithOwnerTypes(
    entry.domain,
    entry.kind,
    entry.namespace,
    entry.invocation,
    entry.normalizedName,
    entry.normalizedOwnerTypes,
  );
}

function buildBaseEntryTargetLookupKey(entry: PbSystemSymbolEntry): string {
  return buildLookupKeyBase(
    entry.domain,
    entry.kind,
    entry.namespace,
    entry.invocation,
    entry.normalizedName,
  );
}

const GENERATED_CANONICAL_TARGET_KEYS = new Set<string>([
  'global-functions|callable|powerscript|global|abs',
  'global-functions|callable|powerscript|global|isnull',
  'global-functions|callable|powerscript|global|len',
  'enumerated-types|enumerated-type|powerbuilder-runtime|global|saveastype',
  'enumerated-values|enumerated-value|powerbuilder-runtime|global|primary!',
  'system-object-datatypes|system-type|powerbuilder-runtime|global|datastore',
  'system-object-datatypes|system-type|powerbuilder-runtime|global|httpclient',
  'statements|statement|powerscript|global|if...then',
  'statements|statement|powerscript|global|choose case',
  'statements|statement|powerscript|global|for...next',
  'keywords|keyword|powerscript|global|for',
  'reserved-words|reserved-word|powerscript|global|true',
]);

function shouldPreferGeneratedCanonicalTarget(entries: readonly PbSystemSymbolEntry[]): boolean {
  const generatedEntry = entries.find(entry => entry.dataset === 'generated');
  if (!generatedEntry) {
    return false;
  }

  return GENERATED_CANONICAL_TARGET_KEYS.has(buildBaseEntryTargetLookupKey(generatedEntry));
}

function selectCanonicalTargetEntryId(entries: readonly PbSystemSymbolEntry[]): string | undefined {
  const nonCandidateEntries = entries.filter(entry => entry.manualOverlay?.mode !== 'candidate');

  if (nonCandidateEntries.length === 0) {
    return undefined;
  }

  const generatedEntry = nonCandidateEntries.find(entry => entry.dataset === 'generated');
  if (generatedEntry && shouldPreferGeneratedCanonicalTarget(nonCandidateEntries)) {
    return generatedEntry.id;
  }

  const manualOverride = nonCandidateEntries.find(
    entry => entry.dataset === 'manual-core' && entry.manualOverlay?.mode === 'override',
  );
  if (manualOverride) {
    return manualOverride.id;
  }

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

  return buildLookupKeyWithOwnerTypes(
    targetKey.domain,
    targetKey.kind,
    targetKey.namespace,
    targetKey.invocation,
    normalizedName,
    normalizeOwnerTypeNames(targetKey.ownerTypes),
  );
}

function buildBaseTargetKeyLookupKey(targetKey: PbSystemSymbolLocalizationTargetKey): string | undefined {
  const normalizedName = normalizeSystemSymbolName(targetKey.name);
  if (!normalizedName) {
    return undefined;
  }

  return buildLookupKeyBase(
    targetKey.domain,
    targetKey.kind,
    targetKey.namespace,
    targetKey.invocation,
    normalizedName,
  );
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

function buildEntryIdsByBaseTargetKey(entries: readonly PbSystemSymbolEntry[]): Map<string, string[]> {
  const exactBuckets = new Map<string, PbSystemSymbolEntry[]>();

  for (const entry of entries) {
    const lookupKey = buildEntryTargetLookupKey(entry);
    const bucket = exactBuckets.get(lookupKey) ?? [];
    bucket.push(entry);
    exactBuckets.set(lookupKey, bucket);
  }

  const entryIdsByBaseTargetKey = new Map<string, string[]>();
  for (const bucket of exactBuckets.values()) {
    const canonicalTargetEntryId = selectCanonicalTargetEntryId(bucket);
    if (!canonicalTargetEntryId) {
      continue;
    }

    const baseLookupKey = buildBaseEntryTargetLookupKey(bucket[0]);
    const baseBucket = entryIdsByBaseTargetKey.get(baseLookupKey) ?? [];
    if (!baseBucket.includes(canonicalTargetEntryId)) {
      baseBucket.push(canonicalTargetEntryId);
      entryIdsByBaseTargetKey.set(baseLookupKey, baseBucket);
    }
  }

  return entryIdsByBaseTargetKey;
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

function buildCanonicalAliasEntryIds(
  canonicalEntryIdAliases: ReadonlyMap<string, string>,
): ReadonlyMap<string, readonly string[]> {
  const aliasEntryIdsByCanonicalId = new Map<string, string[]>();

  for (const [entryId, canonicalEntryId] of canonicalEntryIdAliases) {
    const aliasEntryIds = aliasEntryIdsByCanonicalId.get(canonicalEntryId) ?? [];
    aliasEntryIds.push(entryId);
    aliasEntryIdsByCanonicalId.set(canonicalEntryId, aliasEntryIds);
  }

  return aliasEntryIdsByCanonicalId;
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

function extractSignatureParameterLabel(token: string): string | undefined {
  const cleanedToken = token
    .replace(/[{}]/g, ' ')
    .replace(/\s*=\s*.+$/, '')
    .trim();
  if (!cleanedToken) {
    return undefined;
  }

  const parts = cleanedToken.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return undefined;
  }

  const candidate = parts[parts.length - 1]
    ?.replace(/^\*+/, '')
    .replace(/\[\]$/g, '')
    .trim();
  return candidate ? candidate : undefined;
}

function inferSignatureParameterKeys(signatureLabel: string): readonly string[] {
  const start = signatureLabel.indexOf('(');
  const end = signatureLabel.lastIndexOf(')');
  if (start < 0 || end <= start + 1) {
    return [];
  }

  const rawParameterList = signatureLabel.slice(start + 1, end);
  const parameterKeys: string[] = [];
  for (const token of rawParameterList.split(',')) {
    const parameterLabel = extractSignatureParameterLabel(token);
    const parameterKey = normalizeLookupText(parameterLabel);
    if (parameterKey) {
      parameterKeys.push(parameterKey);
    }
  }

  return parameterKeys;
}

function buildSignatureParameterKeys(signature: PbSystemSymbolEntry['signatures'][number]): ReadonlySet<string> {
  const parameterKeys = new Set<string>();

  for (const parameter of signature.parameters ?? []) {
    const parameterKey = normalizeLookupText(parameter.label);
    if (parameterKey) {
      parameterKeys.add(parameterKey);
    }
  }

  if (parameterKeys.size > 0) {
    return parameterKeys;
  }

  for (const parameterKey of inferSignatureParameterKeys(signature.label)) {
    parameterKeys.add(parameterKey);
  }

  return parameterKeys;
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

    validParametersBySignature.set(signatureKey, new Set(buildSignatureParameterKeys(signature)));
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

function buildRecoveredTargetIdSortKey(recovery: PbSystemSymbolLocalizationRecoveredTargetId): string {
  return [
    recovery.locale,
    recovery.domain,
    recovery.targetName,
    recovery.previousTargetId,
    recovery.targetEntryId,
  ].join('|');
}

function buildSchemaIssueSortKey(issue: PbSystemSymbolLocalizationSchemaIssue): string {
  return [
    issue.locale,
    issue.code,
    issue.domain ?? '',
    issue.targetName ?? '',
    issue.targetEntryId ?? '',
    issue.targetId ?? '',
    (issue.details ?? []).join('+'),
  ].join('|');
}

function buildMissingFieldsByDomainSortKey(summary: PbSystemSymbolLocalizationMissingFieldsByDomain): string {
  return [summary.locale, summary.domain].join('|');
}

function recordMissingFieldsByDomain(
  summaries: Map<string, Map<PbSystemSymbolLocalizationMissingField, number>>,
  locale: PbCatalogLocale,
  domain: PbSystemSymbolEntry['domain'],
  missingFields: readonly PbSystemSymbolLocalizationMissingField[],
): void {
  const key = `${locale}|${domain}`;
  const counts = summaries.get(key) ?? new Map<PbSystemSymbolLocalizationMissingField, number>();

  for (const field of missingFields) {
    counts.set(field, (counts.get(field) ?? 0) + 1);
  }

  summaries.set(key, counts);
}

function finalizeMissingFieldsByDomain(
  summaries: Map<string, Map<PbSystemSymbolLocalizationMissingField, number>>,
): readonly PbSystemSymbolLocalizationMissingFieldsByDomain[] {
  const finalized: PbSystemSymbolLocalizationMissingFieldsByDomain[] = [];

  for (const [key, fieldCounts] of summaries.entries()) {
    const [locale, domain] = key.split('|') as [PbCatalogLocale, PbSystemSymbolEntry['domain']];
    const materializedCounts: Partial<Record<PbSystemSymbolLocalizationMissingField, number>> = {};

    for (const [field, count] of fieldCounts.entries()) {
      materializedCounts[field] = count;
    }

    finalized.push({
      locale,
      domain,
      fieldCounts: materializedCounts,
    });
  }

  return finalized.sort((left, right) => buildMissingFieldsByDomainSortKey(left).localeCompare(buildMissingFieldsByDomainSortKey(right)));
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
  entryIdsByBaseTargetKey: ReadonlyMap<string, readonly string[]>,
): {
  targetEntryId?: string;
  orphanReason?: PbSystemSymbolLocalizationOrphanReason;
  normalizedTargetId?: string;
  recoveredTargetEntryId?: string;
} {
  const normalizedTargetId = overlay.targetId?.trim() || undefined;
  const lookupKey = overlay.targetKey ? buildTargetKeyLookupKey(overlay.targetKey) : undefined;
  const targetIdsFromKey = lookupKey ? entryIdsByTargetKey.get(lookupKey) ?? [] : [];
  const baseLookupKey = overlay.targetKey ? buildBaseTargetKeyLookupKey(overlay.targetKey) : undefined;
  const fallbackTargetIdsFromBaseKey = targetIdsFromKey.length === 0 && baseLookupKey
    ? entryIdsByBaseTargetKey.get(baseLookupKey) ?? []
    : [];
  const resolvedTargetIdsFromKey = targetIdsFromKey.length > 0 ? targetIdsFromKey : fallbackTargetIdsFromBaseKey;

  if (!normalizedTargetId && !overlay.targetKey) {
    return { orphanReason: 'missing-target' };
  }

  if (overlay.targetKey && !lookupKey) {
    return { orphanReason: 'missing-target-key', normalizedTargetId };
  }

  if (!normalizedTargetId) {
    if (resolvedTargetIdsFromKey.length === 0) {
      return { orphanReason: 'missing-target-key' };
    }
    if (resolvedTargetIdsFromKey.length > 1) {
      return { orphanReason: 'ambiguous-target-key' };
    }

    return { targetEntryId: resolvedTargetIdsFromKey[0] };
  }

  if (!entryById.has(normalizedTargetId)) {
    if (!overlay.targetKey) {
      return { orphanReason: 'missing-target-id', normalizedTargetId };
    }
    if (resolvedTargetIdsFromKey.length === 0) {
      return { orphanReason: 'missing-target-id', normalizedTargetId };
    }
    if (resolvedTargetIdsFromKey.length > 1) {
      return { orphanReason: 'ambiguous-target-key', normalizedTargetId };
    }

    return {
      targetEntryId: resolvedTargetIdsFromKey[0],
      normalizedTargetId,
      recoveredTargetEntryId: resolvedTargetIdsFromKey[0],
    };
  }

  if (!overlay.targetKey) {
    return { targetEntryId: normalizedTargetId, normalizedTargetId };
  }

  if (resolvedTargetIdsFromKey.length === 0) {
    return { orphanReason: 'target-mismatch', normalizedTargetId };
  }
  if (resolvedTargetIdsFromKey.length > 1) {
    return { orphanReason: 'ambiguous-target-key', normalizedTargetId };
  }
  if (resolvedTargetIdsFromKey[0] !== normalizedTargetId) {
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
  const entryIdsByBaseTargetKey = buildEntryIdsByBaseTargetKey(entries);
  const canonicalEntryIdAliases = buildCanonicalEntryIdAliases(entries);
  const canonicalAliasEntryIds = buildCanonicalAliasEntryIds(canonicalEntryIdAliases);
  const totalTargetCountsByDomain = buildCanonicalTargetCountsByDomain(entries);
  const localeMaps = new Map<PbCatalogLocale, Map<string, PbResolvedSystemSymbolLocalizationOverlay>>();
  const localeSummaries: Partial<Record<PbCatalogLocale, MutableLocaleSummary>> = {};
  const domainCoverage: Partial<Record<PbCatalogLocale, Partial<Record<PbSystemSymbolEntry['domain'], MutableDomainCoverage>>>> = {};
  const incompleteOverlays: PbSystemSymbolLocalizationIncompleteOverlay[] = [];
  const missingFieldsByDomain = new Map<string, Map<PbSystemSymbolLocalizationMissingField, number>>();
  const invalidParameterTargets: PbSystemSymbolLocalizationInvalidParameterTarget[] = [];
  const recoveredTargetIds: PbSystemSymbolLocalizationRecoveredTargetId[] = [];
  const schemaIssues: PbSystemSymbolLocalizationSchemaIssue[] = [];
  const orphanOverlays: PbSystemSymbolLocalizationOrphan[] = [];

  for (const overlay of overlays) {
    const summary = cloneLocaleSummary(localeSummaries[overlay.locale] ?? createEmptyLocaleSummary());
    const reviewedIssueDetails: string[] = [];
    summary.overlayCount += 1;
    if (overlay.targetId?.trim()) {
      summary.targetIdCount += 1;
    }
    if (overlay.targetKey) {
      summary.targetKeyCount += 1;
    }
    if (overlay.reviewed === true) {
      summary.reviewedCount += 1;
    }
    if (!overlay.source?.trim()) {
      schemaIssues.push({
        locale: overlay.locale,
        code: 'missing-source',
        targetId: overlay.targetId,
        targetKey: overlay.targetKey,
      });
    }
    if (typeof overlay.reviewed !== 'boolean') {
      schemaIssues.push({
        locale: overlay.locale,
        code: 'missing-reviewed',
        targetId: overlay.targetId,
        targetKey: overlay.targetKey,
      });
    }

    const { targetEntryId, orphanReason, normalizedTargetId, recoveredTargetEntryId } = resolveOverlayTargetId(
      overlay,
      entryById,
      entryIdsByTargetKey,
      entryIdsByBaseTargetKey,
    );

    if (!targetEntryId || orphanReason) {
      if (overlay.reviewed === true) {
        reviewedIssueDetails.push(`orphan:${orphanReason ?? 'missing-target'}`);
        schemaIssues.push({
          locale: overlay.locale,
          code: 'reviewed-with-issues',
          targetId: normalizedTargetId ?? overlay.targetId,
          targetKey: overlay.targetKey,
          details: Array.from(new Set(reviewedIssueDetails)).sort(),
        });
      }
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

    if (normalizedTargetId && recoveredTargetEntryId && recoveredTargetEntryId !== normalizedTargetId) {
      recoveredTargetIds.push({
        locale: overlay.locale,
        previousTargetId: normalizedTargetId,
        targetEntryId: targetEntry.id,
        targetName: targetEntry.name,
        domain: targetEntry.domain,
        targetKey: overlay.targetKey,
      });
      if (overlay.reviewed === true) {
        reviewedIssueDetails.push(`recovered-target-id:${normalizedTargetId}`);
      }
    }

    const localeMap = localeMaps.get(overlay.locale) ?? new Map<string, PbResolvedSystemSymbolLocalizationOverlay>();
    const localizedTargetIds = canonicalAliasEntryIds.get(effectiveTargetEntryId) ?? [targetEntryId];
    for (const localizedTargetId of localizedTargetIds) {
      localeMap.set(localizedTargetId, {
        ...overlay,
        targetEntryId: localizedTargetId,
        targetId: normalizedTargetId ?? overlay.targetId,
      });
    }
    localeMaps.set(overlay.locale, localeMap);

    const localeCoverage = domainCoverage[overlay.locale] ?? {};
    const targetCoverage = localeCoverage[targetEntry.domain] ?? createDomainCoverage(totalTargetCountsByDomain.get(targetEntry.domain) ?? 0);
    targetCoverage.localizedTargetIds.add(targetEntry.id);
    if (overlay.reviewed === true) {
      targetCoverage.reviewedTargetIds.add(targetEntry.id);
    }
    localeCoverage[targetEntry.domain] = targetCoverage;
    domainCoverage[overlay.locale] = localeCoverage;

    const missingFields = collectIncompleteFields(targetEntry, overlay);
    if (missingFields.length > 0) {
      recordMissingFieldsByDomain(missingFieldsByDomain, overlay.locale, targetEntry.domain, missingFields);
      incompleteOverlays.push({
        locale: overlay.locale,
        targetEntryId: targetEntry.id,
        targetName: targetEntry.name,
        domain: targetEntry.domain,
        targetId: normalizedTargetId ?? overlay.targetId,
        targetKey: overlay.targetKey,
        missingFields,
      });
      if (overlay.reviewed === true) {
        reviewedIssueDetails.push(`missing-fields:${missingFields.join(',')}`);
      }
    }

    const overlayInvalidParameterTargets = collectInvalidParameterTargets(targetEntry, overlay);
    invalidParameterTargets.push(...overlayInvalidParameterTargets);
    if (overlay.reviewed === true && overlayInvalidParameterTargets.length > 0) {
      reviewedIssueDetails.push(`invalid-parameter-targets:${overlayInvalidParameterTargets.map(issue => `${issue.signatureLabel}->${issue.parameterName}`).join('|')}`);
    }
    if (overlay.reviewed === true && reviewedIssueDetails.length > 0) {
      schemaIssues.push({
        locale: overlay.locale,
        code: 'reviewed-with-issues',
        targetId: normalizedTargetId ?? overlay.targetId,
        targetKey: overlay.targetKey,
        targetEntryId: targetEntry.id,
        targetName: targetEntry.name,
        domain: targetEntry.domain,
        details: Array.from(new Set(reviewedIssueDetails)).sort(),
      });
    }
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
    schemaVersion: PB_SYSTEM_SYMBOL_LOCALIZATION_SCHEMA_VERSION,
    locales: readonlyLocaleMaps,
    localeSummaries: finalizedLocaleSummaries,
    domainCoverage: finalizedDomainCoverage,
    incompleteOverlays: incompleteOverlays.sort((left, right) => buildIncompleteOverlaySortKey(left).localeCompare(buildIncompleteOverlaySortKey(right))),
    missingFieldsByDomain: finalizeMissingFieldsByDomain(missingFieldsByDomain),
    invalidParameterTargets: invalidParameterTargets.sort((left, right) => buildInvalidParameterTargetSortKey(left).localeCompare(buildInvalidParameterTargetSortKey(right))),
    recoveredTargetIds: recoveredTargetIds.sort((left, right) => buildRecoveredTargetIdSortKey(left).localeCompare(buildRecoveredTargetIdSortKey(right))),
    schemaIssues: schemaIssues.sort((left, right) => buildSchemaIssueSortKey(left).localeCompare(buildSchemaIssueSortKey(right))),
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
    schemaVersion: index.schemaVersion,
    locales: index.localeSummaries,
    domainCoverage: index.domainCoverage,
    incompleteOverlays: index.incompleteOverlays,
    missingFieldsByDomain: index.missingFieldsByDomain,
    invalidParameterTargets: index.invalidParameterTargets,
    recoveredTargetIds: index.recoveredTargetIds,
    schemaIssues: index.schemaIssues,
    orphanOverlays: index.orphanOverlays,
  };
}

export const PB_SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS = SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS;