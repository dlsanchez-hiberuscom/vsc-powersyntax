/**
 * Catalog consistency report (Spec 046 / B132).
 *
 * @module knowledge/system/consistency
 */

import { PB_SYSTEM_SYMBOL_REGISTRY } from './registry/registry';
import type {
  PbSystemManualOverlayMode,
  PbSystemSymbolDataset,
  PbSystemSymbolDomain,
  PbSystemSymbolEntry,
  PbSystemSymbolKind,
  PbSystemSymbolProvenanceAuthority,
  PbSystemSymbolProvenanceKind,
} from './types';

export interface CatalogDomainProvenanceSummary {
  entryCount: number;
  datasets: readonly PbSystemSymbolDataset[];
  authorities: readonly PbSystemSymbolProvenanceAuthority[];
  kinds: readonly PbSystemSymbolProvenanceKind[];
  sources: readonly string[];
  versions: readonly string[];
  missingSourceCount: number;
  missingSourceUrlCount: number;
  missingVersionCount: number;
}

export interface CatalogProvenanceAudit {
  byKind: Partial<Record<PbSystemSymbolProvenanceKind, number>>;
  byAuthority: Partial<Record<PbSystemSymbolProvenanceAuthority, number>>;
  withVersion: number;
  withGeneratedAt: number;
  datasetAuthorityMismatch: string[];
  datasetKindMismatch: string[];
  missingSource: string[];
  missingSourceUrlForOfficial: string[];
  missingVersion: string[];
  missingGeneratedAtForGenerated: string[];
  domainSummaries: Partial<Record<PbSystemSymbolDomain, CatalogDomainProvenanceSummary>>;
}

export interface CatalogReport {
  total: number;
  duplicateIds: string[];
  missingSignatures: string[]; // ids
  emptyName: string[]; // ids
  invalidEnumeratedTypeNames: string[]; // ids
  manualGeneratedOverlapsWithoutOverlay: string[]; // logical keys
  manualOverlayModes: Partial<Record<PbSystemManualOverlayMode, number>>;
  domainCounts: Record<PbSystemSymbolDomain, number>;
  datasetCounts: Partial<Record<PbSystemSymbolDataset, number>>;
  kindCounts: Record<PbSystemSymbolKind, number>;
  provenance: CatalogProvenanceAudit;
}

type MutableCatalogDomainProvenanceSummary = {
  entryCount: number;
  datasets: Set<PbSystemSymbolDataset>;
  authorities: Set<PbSystemSymbolProvenanceAuthority>;
  kinds: Set<PbSystemSymbolProvenanceKind>;
  sources: Set<string>;
  versions: Set<string>;
  missingSourceCount: number;
  missingSourceUrlCount: number;
  missingVersionCount: number;
};

function incrementCount(
  counts: Record<string, number>,
  key: string,
): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function sortValues<T extends string>(values: Iterable<T>): T[] {
  return Array.from(values).sort((left, right) => left.localeCompare(right));
}

function expectedProvenanceKind(
  dataset: PbSystemSymbolEntry['dataset'],
): PbSystemSymbolProvenanceKind {
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

function expectedProvenanceAuthority(
  dataset: PbSystemSymbolEntry['dataset'],
): PbSystemSymbolProvenanceAuthority {
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

function getOrCreateDomainSummary(
  domainSummaries: Record<string, MutableCatalogDomainProvenanceSummary>,
  domain: PbSystemSymbolDomain,
): MutableCatalogDomainProvenanceSummary {
  const summary = domainSummaries[domain];

  if (summary) {
    return summary;
  }

  const created: MutableCatalogDomainProvenanceSummary = {
    entryCount: 0,
    datasets: new Set<PbSystemSymbolDataset>(),
    authorities: new Set<PbSystemSymbolProvenanceAuthority>(),
    kinds: new Set<PbSystemSymbolProvenanceKind>(),
    sources: new Set<string>(),
    versions: new Set<string>(),
    missingSourceCount: 0,
    missingSourceUrlCount: 0,
    missingVersionCount: 0,
  };

  domainSummaries[domain] = created;
  return created;
}

function buildLogicalOverlapKey(entry: Pick<PbSystemSymbolEntry, 'domain' | 'kind' | 'namespace' | 'invocation' | 'enumValueOf' | 'normalizedName' | 'normalizedOwnerTypes'>): string {
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

export function buildCatalogConsistencyReport(): CatalogReport {
  const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries;
  const seen = new Map<string, number>();
  const logicalBuckets = new Map<string, PbSystemSymbolEntry[]>();
  const missingSignatures: string[] = [];
  const emptyName: string[] = [];
  const invalidEnumeratedTypeNames: string[] = [];
  const manualOverlayModes: Partial<Record<PbSystemManualOverlayMode, number>> = {};
  const domainCounts: Record<string, number> = {};
  const datasetCounts: Record<string, number> = {};
  const kindCounts: Record<string, number> = {};
  const provenanceByKind: Record<string, number> = {};
  const provenanceByAuthority: Record<string, number> = {};
  const datasetAuthorityMismatch: string[] = [];
  const datasetKindMismatch: string[] = [];
  const missingSource: string[] = [];
  const missingSourceUrlForOfficial: string[] = [];
  const missingVersion: string[] = [];
  const missingGeneratedAtForGenerated: string[] = [];
  const domainSummaries: Record<string, MutableCatalogDomainProvenanceSummary> = {};
  let withVersion = 0;
  let withGeneratedAt = 0;

  for (const e of entries) {
    seen.set(e.id, (seen.get(e.id) ?? 0) + 1);
    const logicalKey = buildLogicalOverlapKey(e);
    const logicalBucket = logicalBuckets.get(logicalKey) ?? [];
    logicalBucket.push(e);
    logicalBuckets.set(logicalKey, logicalBucket);
    if (!e.signatures || e.signatures.length === 0) missingSignatures.push(e.id);
    if (!e.name || !e.name.trim()) emptyName.push(e.id);
    if (e.kind === 'enumerated-type' && e.name.endsWith('!')) invalidEnumeratedTypeNames.push(e.id);
    if (e.dataset === 'manual-core' && e.manualOverlay) {
      incrementCount(manualOverlayModes, e.manualOverlay.mode);
    }
    domainCounts[e.domain] = (domainCounts[e.domain] ?? 0) + 1;
    datasetCounts[e.dataset] = (datasetCounts[e.dataset] ?? 0) + 1;
    kindCounts[e.kind] = (kindCounts[e.kind] ?? 0) + 1;

    incrementCount(provenanceByKind, e.provenance.kind);
    incrementCount(provenanceByAuthority, e.provenance.authority);

    if (e.provenance.kind !== expectedProvenanceKind(e.dataset)) {
      datasetKindMismatch.push(e.id);
    }

    if (e.provenance.authority !== expectedProvenanceAuthority(e.dataset)) {
      datasetAuthorityMismatch.push(e.id);
    }

    const domainSummary = getOrCreateDomainSummary(domainSummaries, e.domain);
    domainSummary.entryCount += 1;
    domainSummary.datasets.add(e.dataset);
    domainSummary.authorities.add(e.provenance.authority);
    domainSummary.kinds.add(e.provenance.kind);

    const source = e.provenance.source.trim();
    if (source) {
      domainSummary.sources.add(source);
    } else {
      domainSummary.missingSourceCount += 1;
      missingSource.push(e.id);
    }

    const version = e.provenance.version?.trim();
    if (version) {
      withVersion += 1;
      domainSummary.versions.add(version);
    } else if (e.provenance.authority === 'official' || e.provenance.authority === 'curated') {
      domainSummary.missingVersionCount += 1;
      missingVersion.push(e.id);
    }

    if (e.provenance.generatedAt?.trim()) {
      withGeneratedAt += 1;
    } else if (e.provenance.kind === 'generated') {
      missingGeneratedAtForGenerated.push(e.id);
    }

    if (e.provenance.authority === 'official' && !e.provenance.sourceUrl?.trim()) {
      domainSummary.missingSourceUrlCount += 1;
      missingSourceUrlForOfficial.push(e.id);
    }
  }

  const duplicateIds: string[] = [];
  for (const [id, n] of seen) if (n > 1) duplicateIds.push(id);

  const manualGeneratedOverlapsWithoutOverlay: string[] = [];
  for (const [logicalKey, bucket] of logicalBuckets) {
    const hasManual = bucket.some(entry => entry.dataset === 'manual-core');
    const hasGenerated = bucket.some(entry => entry.dataset === 'generated');

    if (!hasManual || !hasGenerated) {
      continue;
    }

    const manualEntriesWithoutOverlay = bucket.filter(entry => entry.dataset === 'manual-core' && !entry.manualOverlay);

    if (manualEntriesWithoutOverlay.length > 0) {
      manualGeneratedOverlapsWithoutOverlay.push(logicalKey);
    }
  }

  const finalizedDomainSummaries: Partial<Record<PbSystemSymbolDomain, CatalogDomainProvenanceSummary>> = {};
  for (const [domain, summary] of Object.entries(domainSummaries)) {
    finalizedDomainSummaries[domain as PbSystemSymbolDomain] = {
      entryCount: summary.entryCount,
      datasets: sortValues(summary.datasets),
      authorities: sortValues(summary.authorities),
      kinds: sortValues(summary.kinds),
      sources: sortValues(summary.sources),
      versions: sortValues(summary.versions),
      missingSourceCount: summary.missingSourceCount,
      missingSourceUrlCount: summary.missingSourceUrlCount,
      missingVersionCount: summary.missingVersionCount,
    };
  }

  return {
    total: entries.length,
    duplicateIds,
    missingSignatures,
    emptyName,
    invalidEnumeratedTypeNames,
    manualGeneratedOverlapsWithoutOverlay: manualGeneratedOverlapsWithoutOverlay.sort((left, right) => left.localeCompare(right)),
    manualOverlayModes,
    domainCounts: domainCounts as Record<PbSystemSymbolDomain, number>,
    datasetCounts: datasetCounts as Partial<Record<PbSystemSymbolDataset, number>>,
    kindCounts: kindCounts as Record<PbSystemSymbolKind, number>,
    provenance: {
      byKind: provenanceByKind as Partial<Record<PbSystemSymbolProvenanceKind, number>>,
      byAuthority: provenanceByAuthority as Partial<Record<PbSystemSymbolProvenanceAuthority, number>>,
      withVersion,
      withGeneratedAt,
      datasetAuthorityMismatch,
      datasetKindMismatch,
      missingSource,
      missingSourceUrlForOfficial,
      missingVersion,
      missingGeneratedAtForGenerated,
      domainSummaries: finalizedDomainSummaries,
    },
  };
}
