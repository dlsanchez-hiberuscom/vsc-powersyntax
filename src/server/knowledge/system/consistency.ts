/**
 * Catalog consistency report (Spec 046 / B132).
 *
 * @module knowledge/system/consistency
 */

import {
  PB_GENERATED_COMPLETENESS,
  PB_GENERATED_COMPLETENESS_MODE,
} from './generated/generatedCompleteness.generated';
import { getSystemSymbolLocalizationCatalogReport } from './localization';
import { PB_SYSTEM_SYMBOL_REGISTRY } from './registry/registry';
import type {
  PbCatalogLocale,
  PbSystemManualOverlayMode,
  PbSystemSymbolDataset,
  PbSystemSymbolDomain,
  PbSystemSymbolEntry,
  PbSystemSymbolKind,
  PbSystemSymbolProvenanceAuthority,
  PbSystemSymbolProvenanceKind,
} from './types';
import type {
  PbSystemSymbolLocalizationLocaleSummary,
  PbSystemSymbolLocalizationDomainCoverage,
  PbSystemSymbolLocalizationIncompleteOverlay,
  PbSystemSymbolLocalizationInvalidParameterTarget,
  PbSystemSymbolLocalizationOrphan,
  PbSystemSymbolLocalizationRecoveredTargetId,
} from './localization';

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

export interface CatalogCoverageMetric {
  covered: number;
  total: number;
  ratio: number;
}

export interface CatalogDatasetAdoptionMetrics {
  entryCount: number;
  signatureQuality: CatalogCoverageMetric;
  appliesToQuality: CatalogCoverageMetric;
  ownerTypesQuality: CatalogCoverageMetric;
  obsoleteDetectionQuality: CatalogCoverageMetric;
  eventIdCoverage: CatalogCoverageMetric;
  returnTypeCoverage: CatalogCoverageMetric;
  parameterDocsCoverage: CatalogCoverageMetric;
  hoverUsefulness: CatalogCoverageMetric;
  signatureHelpUsefulness: CatalogCoverageMetric;
}

export type CatalogAdoptionRecommendedPolicy =
  | 'generated-primary-with-manual-overlays'
  | 'manual-primary'
  | 'hybrid-by-domain';

export interface CatalogDomainAdoptionReport {
  domain: PbSystemSymbolDomain;
  officialCount: number;
  generatedCount: number;
  manualCount: number;
  duplicateCount: number;
  gapCount: number;
  overrideCount: number;
  enrichmentCount: number;
  candidateCount: number;
  scraperErrorCount: number;
  maintenanceCost: number;
  generated: CatalogDatasetAdoptionMetrics;
  manual: CatalogDatasetAdoptionMetrics;
  officialCoverage?: {
    measurement: string;
    coveredCount: number;
    missingCount: number;
  };
  recommendedPolicy: CatalogAdoptionRecommendedPolicy;
  rationale: readonly string[];
}

export interface CatalogAdoptionDecisionReport {
  completenessMode: string;
  officialDomains: readonly PbSystemSymbolDomain[];
  manualOnlyDomains: readonly PbSystemSymbolDomain[];
  domains: Partial<Record<PbSystemSymbolDomain, CatalogDomainAdoptionReport>>;
  summary: {
    officialCount: number;
    generatedCount: number;
    manualCount: number;
    duplicateCount: number;
    gapCount: number;
    overrideCount: number;
    enrichmentCount: number;
    candidateCount: number;
    scraperErrorCount: number;
    maintenanceCost: number;
    generated: CatalogDatasetAdoptionMetrics;
    manual: CatalogDatasetAdoptionMetrics;
    officialDomainsWithGaps: readonly PbSystemSymbolDomain[];
    recommendedPolicy: CatalogAdoptionRecommendedPolicy;
    rationale: readonly string[];
  };
}

export interface CatalogLocalizationAudit {
  locales: Partial<Record<PbCatalogLocale, PbSystemSymbolLocalizationLocaleSummary>>;
  domainCoverage: Partial<Record<PbCatalogLocale, Partial<Record<PbSystemSymbolDomain, PbSystemSymbolLocalizationDomainCoverage>>>>;
  incompleteOverlays: readonly PbSystemSymbolLocalizationIncompleteOverlay[];
  invalidParameterTargets: readonly PbSystemSymbolLocalizationInvalidParameterTarget[];
  recoveredTargetIds: readonly PbSystemSymbolLocalizationRecoveredTargetId[];
  orphanOverlays: readonly PbSystemSymbolLocalizationOrphan[];
}

export interface CatalogReport {
  total: number;
  duplicateIds: string[];
  missingSignatures: string[];
  emptyName: string[];
  invalidEnumeratedTypeNames: string[];
  manualGeneratedOverlapsWithoutOverlay: string[];
  manualOverlayModes: Partial<Record<PbSystemManualOverlayMode, number>>;
  domainCounts: Record<PbSystemSymbolDomain, number>;
  datasetCounts: Partial<Record<PbSystemSymbolDataset, number>>;
  kindCounts: Record<PbSystemSymbolKind, number>;
  provenance: CatalogProvenanceAudit;
  adoption: CatalogAdoptionDecisionReport;
  localization: CatalogLocalizationAudit;
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

type CatalogDatasetAdoptionAccumulator = {
  entryCount: number;
  signatureCovered: number;
  signatureTotal: number;
  appliesToCovered: number;
  appliesToTotal: number;
  ownerTypesCovered: number;
  ownerTypesTotal: number;
  obsoleteCovered: number;
  obsoleteTotal: number;
  eventIdCovered: number;
  eventIdTotal: number;
  returnTypeCovered: number;
  returnTypeTotal: number;
  parameterDocsCovered: number;
  parameterDocsTotal: number;
  hoverCovered: number;
  hoverTotal: number;
  signatureHelpCovered: number;
  signatureHelpTotal: number;
};

type GeneratedCompletenessDomain = keyof typeof PB_GENERATED_COMPLETENESS;
type GeneratedCompletenessEntry = (typeof PB_GENERATED_COMPLETENESS)[GeneratedCompletenessDomain];

const CALLABLE_KINDS = new Set<PbSystemSymbolKind>(['callable', 'event', 'statement']);
const APPLIES_TO_KINDS = new Set<PbSystemSymbolKind>(['callable', 'event', 'statement', 'datatype', 'system-type', 'enumerated-type']);
const GENERATED_COMPLETENESS_BY_DOMAIN = PB_GENERATED_COMPLETENESS as Partial<Record<PbSystemSymbolDomain, GeneratedCompletenessEntry>>;

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

function buildCoverageMetric(covered: number, total: number): CatalogCoverageMetric {
  return {
    covered,
    total,
    ratio: total === 0 ? 1 : covered / total,
  };
}

function createAdoptionAccumulator(): CatalogDatasetAdoptionAccumulator {
  return {
    entryCount: 0,
    signatureCovered: 0,
    signatureTotal: 0,
    appliesToCovered: 0,
    appliesToTotal: 0,
    ownerTypesCovered: 0,
    ownerTypesTotal: 0,
    obsoleteCovered: 0,
    obsoleteTotal: 0,
    eventIdCovered: 0,
    eventIdTotal: 0,
    returnTypeCovered: 0,
    returnTypeTotal: 0,
    parameterDocsCovered: 0,
    parameterDocsTotal: 0,
    hoverCovered: 0,
    hoverTotal: 0,
    signatureHelpCovered: 0,
    signatureHelpTotal: 0,
  };
}

function hasReturnType(entry: PbSystemSymbolEntry): boolean {
  if (entry.returnType?.trim()) {
    return true;
  }

  return entry.signatures.some(signature => Boolean(signature.returnType?.trim()));
}

function countSignatureParameters(entry: PbSystemSymbolEntry): { total: number; documented: number } {
  let total = 0;
  let documented = 0;

  for (const signature of entry.signatures) {
    for (const parameter of signature.parameters ?? []) {
      total += 1;
      if (parameter.documentation?.trim()) {
        documented += 1;
      }
    }
  }

  return { total, documented };
}

function hasHoverMetadata(entry: PbSystemSymbolEntry): boolean {
  const hasText = Boolean(entry.documentation?.trim() || entry.summary.trim());

  if (!hasText) {
    return false;
  }

  if (!CALLABLE_KINDS.has(entry.kind)) {
    return true;
  }

  return entry.signatures.length > 0;
}

function observeAdoptionMetrics(
  accumulator: CatalogDatasetAdoptionAccumulator,
  entry: PbSystemSymbolEntry,
): void {
  accumulator.entryCount += 1;
  accumulator.hoverTotal += 1;
  if (hasHoverMetadata(entry)) {
    accumulator.hoverCovered += 1;
  }

  if (CALLABLE_KINDS.has(entry.kind)) {
    accumulator.signatureTotal += 1;
    if (entry.signatures.length > 0) {
      accumulator.signatureCovered += 1;
    }

    accumulator.returnTypeTotal += 1;
    if (hasReturnType(entry)) {
      accumulator.returnTypeCovered += 1;
    }

    accumulator.signatureHelpTotal += 1;
    if (entry.signatures.length > 0 && (hasReturnType(entry) || entry.signatures.some(signature => (signature.parameters?.length ?? 0) > 0))) {
      accumulator.signatureHelpCovered += 1;
    }

    const parameterCounts = countSignatureParameters(entry);
    accumulator.parameterDocsTotal += parameterCounts.total;
    accumulator.parameterDocsCovered += parameterCounts.documented;
  }

  if (APPLIES_TO_KINDS.has(entry.kind)) {
    accumulator.appliesToTotal += 1;
    if ((entry.appliesTo?.length ?? 0) > 0) {
      accumulator.appliesToCovered += 1;
    }
  }

  if (entry.invocation === 'member' || entry.kind === 'event' || entry.domain === 'system-object-datatypes') {
    accumulator.ownerTypesTotal += 1;
    if ((entry.ownerTypes?.length ?? 0) > 0) {
      accumulator.ownerTypesCovered += 1;
    }
  }

  if (entry.obsolete) {
    accumulator.obsoleteTotal += 1;
    if (Boolean(entry.obsoleteMessage?.trim() || entry.replacement?.trim() || entry.risk === 'deprecated')) {
      accumulator.obsoleteCovered += 1;
    }
  }

  if (entry.kind === 'event') {
    accumulator.eventIdTotal += 1;
    if (Boolean(entry.eventId?.trim() || (entry.eventIds?.length ?? 0) > 0)) {
      accumulator.eventIdCovered += 1;
    }
  }
}

function finalizeAdoptionMetrics(
  entries: readonly PbSystemSymbolEntry[],
): CatalogDatasetAdoptionMetrics {
  const accumulator = createAdoptionAccumulator();

  for (const entry of entries) {
    observeAdoptionMetrics(accumulator, entry);
  }

  return {
    entryCount: accumulator.entryCount,
    signatureQuality: buildCoverageMetric(accumulator.signatureCovered, accumulator.signatureTotal),
    appliesToQuality: buildCoverageMetric(accumulator.appliesToCovered, accumulator.appliesToTotal),
    ownerTypesQuality: buildCoverageMetric(accumulator.ownerTypesCovered, accumulator.ownerTypesTotal),
    obsoleteDetectionQuality: buildCoverageMetric(accumulator.obsoleteCovered, accumulator.obsoleteTotal),
    eventIdCoverage: buildCoverageMetric(accumulator.eventIdCovered, accumulator.eventIdTotal),
    returnTypeCoverage: buildCoverageMetric(accumulator.returnTypeCovered, accumulator.returnTypeTotal),
    parameterDocsCoverage: buildCoverageMetric(accumulator.parameterDocsCovered, accumulator.parameterDocsTotal),
    hoverUsefulness: buildCoverageMetric(accumulator.hoverCovered, accumulator.hoverTotal),
    signatureHelpUsefulness: buildCoverageMetric(accumulator.signatureHelpCovered, accumulator.signatureHelpTotal),
  };
}

function countOverlayModes(
  entries: readonly PbSystemSymbolEntry[],
): Record<PbSystemManualOverlayMode, number> {
  const counts: Record<PbSystemManualOverlayMode, number> = {
    gap: 0,
    enrichment: 0,
    override: 0,
    candidate: 0,
  };

  for (const entry of entries) {
    if (entry.dataset !== 'manual-core' || !entry.manualOverlay) {
      continue;
    }

    counts[entry.manualOverlay.mode] += 1;
  }

  return counts;
}

function countLogicalDuplicatesInDomain(
  domain: PbSystemSymbolDomain,
  logicalBuckets: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>,
): number {
  let count = 0;

  for (const bucket of logicalBuckets.values()) {
    if (bucket.length === 0 || bucket[0].domain !== domain) {
      continue;
    }

    const hasManual = bucket.some(entry => entry.dataset === 'manual-core');
    const hasGenerated = bucket.some(entry => entry.dataset === 'generated');
    if (hasManual && hasGenerated) {
      count += 1;
    }
  }

  return count;
}

function buildDomainRecommendedPolicy(
  generatedCount: number,
  manualCount: number,
  officialCoverage: CatalogDomainAdoptionReport['officialCoverage'],
): CatalogAdoptionRecommendedPolicy {
  if (generatedCount === 0 && manualCount > 0) {
    return 'manual-primary';
  }

  if (officialCoverage && officialCoverage.missingCount > 0) {
    return 'hybrid-by-domain';
  }

  return 'generated-primary-with-manual-overlays';
}

export function buildCatalogConsistencyReport(): CatalogReport {
  const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries;
  const localization = getSystemSymbolLocalizationCatalogReport();
  const seen = new Map<string, number>();
  const entryById = new Map<string, PbSystemSymbolEntry>();
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

  for (const entry of entries) {
    entryById.set(entry.id, entry);
    seen.set(entry.id, (seen.get(entry.id) ?? 0) + 1);

    const logicalKey = buildLogicalOverlapKey(entry);
    const logicalBucket = logicalBuckets.get(logicalKey) ?? [];
    logicalBucket.push(entry);
    logicalBuckets.set(logicalKey, logicalBucket);

    if (entry.signatures.length === 0) {
      missingSignatures.push(entry.id);
    }
    if (!entry.name.trim()) {
      emptyName.push(entry.id);
    }
    if (entry.kind === 'enumerated-type' && entry.name.endsWith('!')) {
      invalidEnumeratedTypeNames.push(entry.id);
    }
    if (entry.dataset === 'manual-core' && entry.manualOverlay) {
      incrementCount(manualOverlayModes, entry.manualOverlay.mode);
    }

    domainCounts[entry.domain] = (domainCounts[entry.domain] ?? 0) + 1;
    datasetCounts[entry.dataset] = (datasetCounts[entry.dataset] ?? 0) + 1;
    kindCounts[entry.kind] = (kindCounts[entry.kind] ?? 0) + 1;

    incrementCount(provenanceByKind, entry.provenance.kind);
    incrementCount(provenanceByAuthority, entry.provenance.authority);

    if (entry.provenance.kind !== expectedProvenanceKind(entry.dataset)) {
      datasetKindMismatch.push(entry.id);
    }
    if (entry.provenance.authority !== expectedProvenanceAuthority(entry.dataset)) {
      datasetAuthorityMismatch.push(entry.id);
    }

    const domainSummary = getOrCreateDomainSummary(domainSummaries, entry.domain);
    domainSummary.entryCount += 1;
    domainSummary.datasets.add(entry.dataset);
    domainSummary.authorities.add(entry.provenance.authority);
    domainSummary.kinds.add(entry.provenance.kind);

    const source = entry.provenance.source.trim();
    if (source) {
      domainSummary.sources.add(source);
    } else {
      domainSummary.missingSourceCount += 1;
      missingSource.push(entry.id);
    }

    const version = entry.provenance.version?.trim();
    if (version) {
      withVersion += 1;
      domainSummary.versions.add(version);
    } else if (entry.provenance.authority === 'official' || entry.provenance.authority === 'curated') {
      domainSummary.missingVersionCount += 1;
      missingVersion.push(entry.id);
    }

    if (entry.provenance.generatedAt?.trim()) {
      withGeneratedAt += 1;
    } else if (entry.provenance.kind === 'generated') {
      missingGeneratedAtForGenerated.push(entry.id);
    }

    if (entry.provenance.authority === 'official' && !entry.provenance.sourceUrl?.trim()) {
      domainSummary.missingSourceUrlCount += 1;
      missingSourceUrlForOfficial.push(entry.id);
    }
  }

  const duplicateIds: string[] = [];
  for (const [id, occurrences] of seen) {
    if (occurrences > 1) {
      duplicateIds.push(id);
    }
  }

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

  const generatedScraperIssueIds = new Set<string>();
  for (const id of datasetAuthorityMismatch) {
    if (entryById.get(id)?.dataset === 'generated') {
      generatedScraperIssueIds.add(id);
    }
  }
  for (const id of datasetKindMismatch) {
    if (entryById.get(id)?.dataset === 'generated') {
      generatedScraperIssueIds.add(id);
    }
  }
  for (const id of missingSourceUrlForOfficial) {
    generatedScraperIssueIds.add(id);
  }
  for (const id of missingVersion) {
    if (entryById.get(id)?.dataset === 'generated') {
      generatedScraperIssueIds.add(id);
    }
  }
  for (const id of missingGeneratedAtForGenerated) {
    generatedScraperIssueIds.add(id);
  }

  const allDomains = new Set<PbSystemSymbolDomain>();
  for (const domain of Object.keys(domainCounts) as PbSystemSymbolDomain[]) {
    allDomains.add(domain);
  }
  for (const domain of Object.keys(GENERATED_COMPLETENESS_BY_DOMAIN) as PbSystemSymbolDomain[]) {
    allDomains.add(domain);
  }

  const adoptionDomains: Partial<Record<PbSystemSymbolDomain, CatalogDomainAdoptionReport>> = {};
  const manualOnlyDomains: PbSystemSymbolDomain[] = [];
  const officialDomains = Object.keys(GENERATED_COMPLETENESS_BY_DOMAIN)
    .sort((left, right) => left.localeCompare(right)) as PbSystemSymbolDomain[];

  for (const domain of Array.from(allDomains).sort((left, right) => left.localeCompare(right))) {
    const domainEntries = entries.filter(entry => entry.domain === domain);
    const domainGeneratedEntries = domainEntries.filter(entry => entry.dataset === 'generated');
    const domainManualEntries = domainEntries.filter(entry => entry.dataset === 'manual-core');
    const overlayCounts = countOverlayModes(domainManualEntries);
    const completenessEntry = GENERATED_COMPLETENESS_BY_DOMAIN[domain];
    const officialCoverage = completenessEntry
      ? {
          measurement: completenessEntry.measurement,
          coveredCount: completenessEntry.coveredCount,
          missingCount: completenessEntry.missingCount,
        }
      : undefined;
    const recommendedPolicy = buildDomainRecommendedPolicy(
      domainGeneratedEntries.length,
      domainManualEntries.length,
      officialCoverage,
    );
    const maintenanceCost = domainManualEntries.length
      + overlayCounts.gap
      + overlayCounts.enrichment
      + (overlayCounts.override * 2)
      + overlayCounts.candidate;
    const rationale: string[] = [];

    if (officialCoverage && officialCoverage.missingCount === 0) {
      rationale.push('generated completeness mantiene missingCount = 0 en este dominio.');
    }
    if (domainGeneratedEntries.length === 0 && domainManualEntries.length > 0) {
      rationale.push('no existe rail official generated para este dominio, así que manual-core sigue siendo la base operativa.');
      manualOnlyDomains.push(domain);
    }
    if (overlayCounts.gap > 0 || overlayCounts.enrichment > 0 || overlayCounts.override > 0) {
      rationale.push(`manualOverlay clasifica ${overlayCounts.gap} gaps, ${overlayCounts.enrichment} enrichments y ${overlayCounts.override} overrides en este dominio.`);
    }

    adoptionDomains[domain] = {
      domain,
      officialCount: completenessEntry?.officialCount ?? domainGeneratedEntries.length,
      generatedCount: domainGeneratedEntries.length,
      manualCount: domainManualEntries.length,
      duplicateCount: countLogicalDuplicatesInDomain(domain, logicalBuckets),
      gapCount: overlayCounts.gap,
      overrideCount: overlayCounts.override,
      enrichmentCount: overlayCounts.enrichment,
      candidateCount: overlayCounts.candidate,
      scraperErrorCount: domainGeneratedEntries.filter(entry => generatedScraperIssueIds.has(entry.id)).length,
      maintenanceCost,
      generated: finalizeAdoptionMetrics(domainGeneratedEntries),
      manual: finalizeAdoptionMetrics(domainManualEntries),
      officialCoverage,
      recommendedPolicy,
      rationale,
    };
  }

  const allGeneratedEntries = entries.filter(entry => entry.dataset === 'generated');
  const allManualEntries = entries.filter(entry => entry.dataset === 'manual-core');
  const officialDomainsWithGaps = officialDomains.filter(domain => (GENERATED_COMPLETENESS_BY_DOMAIN[domain]?.missingCount ?? 0) > 0);
  const adoptionRationale: string[] = [];

  if (officialDomainsWithGaps.length === 0) {
    adoptionRationale.push('generated mantiene missingCount = 0 en todos los dominios oficiales medidos.');
  }
  if (manualGeneratedOverlapsWithoutOverlay.length === 0) {
    adoptionRationale.push('todos los overlaps lógicos manual/generated quedan clasificados con manualOverlay.');
  }
  if (manualOnlyDomains.length > 0) {
    adoptionRationale.push(`los dominios sin rail oficial siguen siendo manual-primary: ${manualOnlyDomains.join(', ')}.`);
  }

  const adoptionRecommendedPolicy: CatalogAdoptionRecommendedPolicy = officialDomainsWithGaps.length === 0
    ? 'generated-primary-with-manual-overlays'
    : 'hybrid-by-domain';

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
    adoption: {
      completenessMode: PB_GENERATED_COMPLETENESS_MODE,
      officialDomains,
      manualOnlyDomains: manualOnlyDomains.sort((left, right) => left.localeCompare(right)),
      domains: adoptionDomains,
      summary: {
        officialCount: officialDomains.reduce((sum, domain) => sum + (GENERATED_COMPLETENESS_BY_DOMAIN[domain]?.officialCount ?? 0), 0),
        generatedCount: allGeneratedEntries.length,
        manualCount: allManualEntries.length,
        duplicateCount: Array.from(logicalBuckets.values()).filter(bucket => bucket.some(entry => entry.dataset === 'manual-core') && bucket.some(entry => entry.dataset === 'generated')).length,
        gapCount: manualOverlayModes.gap ?? 0,
        overrideCount: manualOverlayModes.override ?? 0,
        enrichmentCount: manualOverlayModes.enrichment ?? 0,
        candidateCount: manualOverlayModes.candidate ?? 0,
        scraperErrorCount: generatedScraperIssueIds.size,
        maintenanceCost: allManualEntries.length + (manualOverlayModes.gap ?? 0) + (manualOverlayModes.enrichment ?? 0) + ((manualOverlayModes.override ?? 0) * 2) + (manualOverlayModes.candidate ?? 0),
        generated: finalizeAdoptionMetrics(allGeneratedEntries),
        manual: finalizeAdoptionMetrics(allManualEntries),
        officialDomainsWithGaps,
        recommendedPolicy: adoptionRecommendedPolicy,
        rationale: adoptionRationale,
      },
    },
    localization,
  };
}
