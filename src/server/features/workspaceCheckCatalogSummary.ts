import type { ApiWorkspaceCheckCatalogSummary } from '../../shared/publicApi';

import { PB_GENERATED_COMPLETENESS } from '../knowledge/system/generated/generatedCompleteness.generated';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../knowledge/system/registry/registry';
import type { PbSystemSymbolEntry } from '../knowledge/system/types';

function buildLogicalOverlapKey(
  entry: Pick<PbSystemSymbolEntry, 'domain' | 'kind' | 'namespace' | 'invocation' | 'enumValueOf' | 'normalizedName' | 'normalizedOwnerTypes'>,
): string {
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

function toConsistencyStatus(summary: {
  duplicates: number;
  missingSignatures: number;
  invalidEnumTypes: number;
  generatedManualConflicts: number;
  officialDomainsWithGaps: number;
}): ApiWorkspaceCheckCatalogSummary['consistencyStatus'] {
  if (
    summary.duplicates > 0
    || summary.missingSignatures > 0
    || summary.generatedManualConflicts > 0
  ) {
    return 'failed';
  }

  if (summary.invalidEnumTypes > 0 || summary.officialDomainsWithGaps > 0) {
    return 'warning';
  }

  return 'passed';
}

let cachedSummary: ApiWorkspaceCheckCatalogSummary | undefined;

export function buildWorkspaceCheckCatalogSummary(): ApiWorkspaceCheckCatalogSummary {
  if (cachedSummary) {
    return { ...cachedSummary };
  }

  const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries;
  const seenIds = new Map<string, number>();
  const logicalBuckets = new Map<string, { hasGenerated: boolean; hasManualWithoutOverlay: boolean }>();
  let missingSignatures = 0;
  let invalidEnumTypes = 0;

  for (const entry of entries) {
    seenIds.set(entry.id, (seenIds.get(entry.id) ?? 0) + 1);

    if (entry.signatures.length === 0) {
      missingSignatures += 1;
    }

    if (entry.kind === 'enumerated-type' && entry.name.endsWith('!')) {
      invalidEnumTypes += 1;
    }

    const logicalKey = buildLogicalOverlapKey(entry);
    const bucket = logicalBuckets.get(logicalKey) ?? { hasGenerated: false, hasManualWithoutOverlay: false };
    if (entry.dataset === 'generated') {
      bucket.hasGenerated = true;
    }
    if (entry.dataset === 'manual-core' && !entry.manualOverlay) {
      bucket.hasManualWithoutOverlay = true;
    }
    logicalBuckets.set(logicalKey, bucket);
  }

  let duplicates = 0;
  for (const occurrences of seenIds.values()) {
    if (occurrences > 1) {
      duplicates += 1;
    }
  }

  let generatedManualConflicts = 0;
  for (const bucket of logicalBuckets.values()) {
    if (bucket.hasGenerated && bucket.hasManualWithoutOverlay) {
      generatedManualConflicts += 1;
    }
  }

  const officialDomainsWithGaps = Object.values(PB_GENERATED_COMPLETENESS).reduce((total, entry) => {
    return total + (entry.missingCount > 0 ? 1 : 0);
  }, 0);

  cachedSummary = {
    available: true,
    totalEntries: entries.length,
    duplicates,
    missingSignatures,
    invalidEnumTypes,
    generatedManualConflicts,
    consistencyStatus: toConsistencyStatus({
      duplicates,
      missingSignatures,
      invalidEnumTypes,
      generatedManualConflicts,
      officialDomainsWithGaps,
    }),
  };

  return { ...cachedSummary };
}