import type { PbSystemSymbolDomain } from '../knowledge/system/types';

export type CatalogCorpusValidationFeature = 'hover' | 'completion' | 'diagnostics';
export type CatalogCorpusValidationStatus = 'hit' | 'miss' | 'ambiguous';

const CATALOG_CORPUS_VALIDATION_FEATURES: readonly CatalogCorpusValidationFeature[] = [
  'hover',
  'completion',
  'diagnostics',
];

export interface CatalogCorpusValidationProbe {
  corpus: string;
  label: string;
  domain: PbSystemSymbolDomain;
  feature: CatalogCorpusValidationFeature;
  status: CatalogCorpusValidationStatus;
  expected: string;
  actualMatches?: readonly string[];
  detail?: string;
  uri?: string;
  line?: number;
  durationMs?: number;
  budgetMs?: number;
}

export interface CatalogCorpusValidationDomainSummary {
  domain: PbSystemSymbolDomain;
  total: number;
  hits: number;
  misses: number;
  ambiguities: number;
}

export interface CatalogCorpusValidationFeatureSummary {
  feature: CatalogCorpusValidationFeature;
  total: number;
  hits: number;
  misses: number;
  ambiguities: number;
}

export interface CatalogCorpusValidationFinding {
  corpus: string;
  label: string;
  domain: PbSystemSymbolDomain;
  feature: CatalogCorpusValidationFeature;
  status: Exclude<CatalogCorpusValidationStatus, 'hit'>;
  expected: string;
  actualMatches: readonly string[];
  detail?: string;
  uri?: string;
  line?: number;
}

export interface CatalogCorpusBudgetViolation {
  corpus: string;
  label: string;
  domain: PbSystemSymbolDomain;
  feature: CatalogCorpusValidationFeature;
  durationMs: number;
  budgetMs: number;
  uri?: string;
  line?: number;
}

export interface CatalogCorpusValidationReport {
  totalProbes: number;
  hits: number;
  misses: number;
  ambiguities: number;
  byDomain: Partial<Record<PbSystemSymbolDomain, CatalogCorpusValidationDomainSummary>>;
  byFeature: Record<CatalogCorpusValidationFeature, CatalogCorpusValidationFeatureSummary>;
  findings: readonly CatalogCorpusValidationFinding[];
  budgetViolations: readonly CatalogCorpusBudgetViolation[];
}

function createFeatureSummary(
  feature: CatalogCorpusValidationFeature,
): CatalogCorpusValidationFeatureSummary {
  return {
    feature,
    total: 0,
    hits: 0,
    misses: 0,
    ambiguities: 0,
  };
}

function createDomainSummary(
  domain: PbSystemSymbolDomain,
): CatalogCorpusValidationDomainSummary {
  return {
    domain,
    total: 0,
    hits: 0,
    misses: 0,
    ambiguities: 0,
  };
}

export function buildCatalogCorpusValidationReport(
  probes: readonly CatalogCorpusValidationProbe[],
): CatalogCorpusValidationReport {
  const byDomain: Partial<Record<PbSystemSymbolDomain, CatalogCorpusValidationDomainSummary>> = {};
  const byFeature = Object.fromEntries(
    CATALOG_CORPUS_VALIDATION_FEATURES.map((feature) => [feature, createFeatureSummary(feature)]),
  ) as Record<CatalogCorpusValidationFeature, CatalogCorpusValidationFeatureSummary>;
  const findings: CatalogCorpusValidationFinding[] = [];
  const budgetViolations: CatalogCorpusBudgetViolation[] = [];
  let hits = 0;
  let misses = 0;
  let ambiguities = 0;

  for (const probe of probes) {
    const domainSummary = byDomain[probe.domain] ?? createDomainSummary(probe.domain);
    byDomain[probe.domain] = domainSummary;

    const featureSummary = byFeature[probe.feature];
    domainSummary.total += 1;
    featureSummary.total += 1;

    switch (probe.status) {
      case 'hit':
        hits += 1;
        domainSummary.hits += 1;
        featureSummary.hits += 1;
        break;
      case 'miss':
        misses += 1;
        domainSummary.misses += 1;
        featureSummary.misses += 1;
        findings.push({
          corpus: probe.corpus,
          label: probe.label,
          domain: probe.domain,
          feature: probe.feature,
          status: 'miss',
          expected: probe.expected,
          actualMatches: probe.actualMatches ?? [],
          ...(probe.detail ? { detail: probe.detail } : {}),
          ...(probe.uri ? { uri: probe.uri } : {}),
          ...(probe.line !== undefined ? { line: probe.line } : {}),
        });
        break;
      case 'ambiguous':
        ambiguities += 1;
        domainSummary.ambiguities += 1;
        featureSummary.ambiguities += 1;
        findings.push({
          corpus: probe.corpus,
          label: probe.label,
          domain: probe.domain,
          feature: probe.feature,
          status: 'ambiguous',
          expected: probe.expected,
          actualMatches: probe.actualMatches ?? [],
          ...(probe.detail ? { detail: probe.detail } : {}),
          ...(probe.uri ? { uri: probe.uri } : {}),
          ...(probe.line !== undefined ? { line: probe.line } : {}),
        });
        break;
    }

    if (
      probe.durationMs !== undefined
      && probe.budgetMs !== undefined
      && probe.durationMs > probe.budgetMs
    ) {
      budgetViolations.push({
        corpus: probe.corpus,
        label: probe.label,
        domain: probe.domain,
        feature: probe.feature,
        durationMs: probe.durationMs,
        budgetMs: probe.budgetMs,
        ...(probe.uri ? { uri: probe.uri } : {}),
        ...(probe.line !== undefined ? { line: probe.line } : {}),
      });
    }
  }

  return {
    totalProbes: probes.length,
    hits,
    misses,
    ambiguities,
    byDomain,
    byFeature,
    findings,
    budgetViolations,
  };
}