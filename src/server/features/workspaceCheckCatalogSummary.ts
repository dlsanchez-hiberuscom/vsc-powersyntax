import type {
  ApiCatalogAdoptionRecommendedPolicy,
  ApiWorkspaceCheckCatalogAdrComplianceSummary,
  ApiWorkspaceCheckCatalogSummary,
} from '../../shared/publicApi';

import { buildCatalogConsistencyReport } from '../knowledge/system/consistency';
import { PB_GENERATED_OFFICIAL_COVERAGE } from '../knowledge/system/generated/officialCoverage.generated';
import { listCatalogPolicyResolvedEntriesForAudit } from '../knowledge/system/services/queryService';

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

type OfficialCoverageDomain = keyof typeof PB_GENERATED_OFFICIAL_COVERAGE;
type OfficialCoverageEntry = (typeof PB_GENERATED_OFFICIAL_COVERAGE)[OfficialCoverageDomain];

const OFFICIAL_COVERAGE_BY_DOMAIN = PB_GENERATED_OFFICIAL_COVERAGE as Partial<Record<string, OfficialCoverageEntry>>;

function buildOfficialCoverageDriftDomains(
  report: ReturnType<typeof buildCatalogConsistencyReport>,
): string[] {
  const driftDomains: string[] = [];

  for (const domain of Object.keys(OFFICIAL_COVERAGE_BY_DOMAIN).sort((left, right) => left.localeCompare(right))) {
    const domainReport = report.adoption.domains[domain as keyof typeof report.adoption.domains];
    const coverage = domainReport?.officialCoverage;
    const generatedCoverage = OFFICIAL_COVERAGE_BY_DOMAIN[domain];

    if (!coverage || !generatedCoverage) {
      driftDomains.push(domain);
      continue;
    }

    if (
      coverage.measurement !== generatedCoverage.measurement
      || coverage.coveredCount !== generatedCoverage.coveredCount
      || coverage.missingCount !== generatedCoverage.missingCount
      || domainReport?.officialCount !== generatedCoverage.officialCount
    ) {
      driftDomains.push(domain);
    }
  }

  return driftDomains;
}

function buildAdrComplianceStatus(
  issueCount: number,
  candidateCount: number,
): ApiWorkspaceCheckCatalogAdrComplianceSummary['status'] {
  if (issueCount > 0) {
    return 'failed';
  }

  if (candidateCount > 0) {
    return 'warning';
  }

  return 'passed';
}

function cloneAdrCompliance(
  summary: ApiWorkspaceCheckCatalogAdrComplianceSummary,
): ApiWorkspaceCheckCatalogAdrComplianceSummary {
  return {
    ...summary,
    manualPrimaryDomains: [...summary.manualPrimaryDomains],
    officialDomainsWithGaps: [...summary.officialDomainsWithGaps],
    officialCoverageDriftDomains: [...summary.officialCoverageDriftDomains],
    overlayCounts: { ...summary.overlayCounts },
  };
}

function cloneWorkspaceCheckCatalogSummary(
  summary: ApiWorkspaceCheckCatalogSummary,
): ApiWorkspaceCheckCatalogSummary {
  return {
    ...summary,
    ...(summary.adrCompliance ? { adrCompliance: cloneAdrCompliance(summary.adrCompliance) } : {}),
  };
}

export function buildWorkspaceCheckCatalogSummary(): ApiWorkspaceCheckCatalogSummary {
  if (cachedSummary) {
    return cloneWorkspaceCheckCatalogSummary(cachedSummary);
  }

  const report = buildCatalogConsistencyReport();
  const officialCoverageDriftDomains = buildOfficialCoverageDriftDomains(report);
  const candidateHotPathViolations = listCatalogPolicyResolvedEntriesForAudit()
    .filter((entry) => entry.manualOverlay?.mode === 'candidate')
    .length;
  const adrIssueCount = report.adoption.summary.officialDomainsWithGaps.length
    + officialCoverageDriftDomains.length
    + report.adoption.summary.scraperErrorCount
    + candidateHotPathViolations
    + report.localization.incompleteOverlays.length
    + report.localization.invalidParameterTargets.length
    + report.localization.recoveredTargetIds.length;

  const adrCompliance: ApiWorkspaceCheckCatalogAdrComplianceSummary = {
    status: buildAdrComplianceStatus(adrIssueCount, report.adoption.summary.candidateCount),
    issueCount: adrIssueCount,
    recommendedPolicy: report.adoption.summary.recommendedPolicy as ApiCatalogAdoptionRecommendedPolicy,
    completenessMode: report.adoption.completenessMode,
    officialDomainCount: report.adoption.officialDomains.length,
    manualPrimaryDomains: [...report.adoption.manualOnlyDomains],
    officialDomainsWithGaps: [...report.adoption.summary.officialDomainsWithGaps],
    officialCoverageDriftDomains,
    overlayCounts: {
      gap: report.adoption.summary.gapCount,
      enrichment: report.adoption.summary.enrichmentCount,
      override: report.adoption.summary.overrideCount,
      candidate: report.adoption.summary.candidateCount,
    },
    candidateCount: report.adoption.summary.candidateCount,
    candidateHotPathViolations,
    scraperErrorCount: report.adoption.summary.scraperErrorCount,
    localizationIncompleteOverlays: report.localization.incompleteOverlays.length,
    localizationInvalidParameterTargets: report.localization.invalidParameterTargets.length,
    localizationRecoveredTargetIds: report.localization.recoveredTargetIds.length,
    officialEntries: report.provenance.byAuthority.official ?? 0,
    curatedEntries: report.provenance.byAuthority.curated ?? 0,
    generatedEntries: report.provenance.byKind.generated ?? 0,
    manualEntries: report.provenance.byKind.manual ?? 0,
  };

  cachedSummary = {
    available: true,
    totalEntries: report.total,
    duplicates: report.duplicateIds.length,
    missingSignatures: report.missingSignatures.length,
    invalidEnumTypes: report.invalidEnumeratedTypeNames.length,
    orphanLocalizationOverlays: report.localization.orphanOverlays.length,
    generatedManualConflicts: report.manualGeneratedOverlapsWithoutOverlay.length,
    consistencyStatus: toConsistencyStatus({
      duplicates: report.duplicateIds.length,
      missingSignatures: report.missingSignatures.length,
      invalidEnumTypes: report.invalidEnumeratedTypeNames.length,
      generatedManualConflicts: report.manualGeneratedOverlapsWithoutOverlay.length,
      officialDomainsWithGaps: report.adoption.summary.officialDomainsWithGaps.length,
    }),
    adrCompliance,
  };

  return cloneWorkspaceCheckCatalogSummary(cachedSummary);
}