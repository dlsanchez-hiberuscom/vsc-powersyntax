import * as path from 'path';

import {
  PUBLIC_API_VERSION,
  type ApiBuildProfileMatrix,
  type ApiDiagnosticsSnapshot,
  type ApiPowerBuilderCodeMetrics,
  type ApiPowerBuilderTechnicalDebtReport,
  type ApiRuntimeHealthFinding,
  type ApiSemanticWorkspaceManifest,
  type ApiServerStats,
  type ApiWorkspaceCheckCatalogSummary,
  type ApiWorkspaceCheckFinding,
  type ApiWorkspaceCheckMode,
  type ApiWorkspaceCheckReport,
  type ApiWorkspaceCheckRequest,
  type ApiWorkspaceCheckUpgradeCompatibility,
  type ApiWorkspaceMigrationAssistant,
} from '../shared/publicApi';
import type { PowerSyntaxSettingsGovernanceReport } from './settingsGovernance';

type WorkspaceCheckSectionErrorKey = 'manifest' | 'catalog' | 'buildProfiles' | 'codeMetrics' | 'technicalDebt' | 'upgradeCompatibility';

export interface WorkspaceCheckBuildInput {
  request?: ApiWorkspaceCheckRequest;
  serverStats?: ApiServerStats;
  manifest?: ApiSemanticWorkspaceManifest;
  catalog?: ApiWorkspaceCheckCatalogSummary;
  settingsGovernance?: PowerSyntaxSettingsGovernanceReport;
  workspaceMigrationAssistant?: ApiWorkspaceMigrationAssistant;
  codeMetrics?: ApiPowerBuilderCodeMetrics;
  technicalDebt?: ApiPowerBuilderTechnicalDebtReport;
  buildProfiles?: ApiBuildProfileMatrix;
  sectionErrors?: Partial<Record<WorkspaceCheckSectionErrorKey, string>>;
}

export interface NormalizedWorkspaceCheckRequest {
  mode: ApiWorkspaceCheckMode;
  includeDiagnostics: boolean;
  includeCatalog: boolean;
  includeHealth: boolean;
  includeBuildProfiles: boolean;
  includeTechnicalDebt: boolean;
  includeCodeMetrics: boolean;
  includeManifest: boolean;
  includeUpgradeCompatibility: boolean;
  maxDiagnostics: number;
  maxFiles: number;
  maxFindings: number;
}

const SEVERITY_ORDER: Record<ApiWorkspaceCheckFinding['severity'], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function normalizeWorkspaceCheckRequest(request: ApiWorkspaceCheckRequest = {}): NormalizedWorkspaceCheckRequest {
  const mode = request.mode ?? 'quick';
  const defaults: Record<ApiWorkspaceCheckMode, Omit<NormalizedWorkspaceCheckRequest, 'mode'>> = {
    quick: {
      includeDiagnostics: true,
      includeCatalog: true,
      includeHealth: true,
      includeBuildProfiles: false,
      includeTechnicalDebt: false,
      includeCodeMetrics: false,
      includeManifest: true,
      includeUpgradeCompatibility: false,
      maxDiagnostics: 8,
      maxFiles: 8,
      maxFindings: 24,
    },
    full: {
      includeDiagnostics: true,
      includeCatalog: true,
      includeHealth: true,
      includeBuildProfiles: true,
      includeTechnicalDebt: true,
      includeCodeMetrics: true,
      includeManifest: true,
      includeUpgradeCompatibility: false,
      maxDiagnostics: 16,
      maxFiles: 16,
      maxFindings: 40,
    },
    catalog: {
      includeDiagnostics: false,
      includeCatalog: true,
      includeHealth: true,
      includeBuildProfiles: false,
      includeTechnicalDebt: false,
      includeCodeMetrics: false,
      includeManifest: true,
      includeUpgradeCompatibility: false,
      maxDiagnostics: 0,
      maxFiles: 8,
      maxFindings: 20,
    },
    diagnostics: {
      includeDiagnostics: true,
      includeCatalog: false,
      includeHealth: true,
      includeBuildProfiles: false,
      includeTechnicalDebt: false,
      includeCodeMetrics: false,
      includeManifest: true,
      includeUpgradeCompatibility: false,
      maxDiagnostics: 16,
      maxFiles: 12,
      maxFindings: 32,

    },
    upgrade: {
      includeDiagnostics: false,
      includeCatalog: false,
      includeHealth: true,
      includeBuildProfiles: false,
      includeTechnicalDebt: false,
      includeCodeMetrics: false,
      includeManifest: true,
      includeUpgradeCompatibility: true,
      maxDiagnostics: 0,
      maxFiles: 8,
      maxFindings: 24,
    },
  };

  const fallback = defaults[mode];
  return {
    mode,
    includeDiagnostics: request.includeDiagnostics ?? fallback.includeDiagnostics,
    includeCatalog: request.includeCatalog ?? fallback.includeCatalog,
    includeHealth: request.includeHealth ?? fallback.includeHealth,
    includeBuildProfiles: request.includeBuildProfiles ?? fallback.includeBuildProfiles,
    includeTechnicalDebt: request.includeTechnicalDebt ?? fallback.includeTechnicalDebt,
    includeCodeMetrics: request.includeCodeMetrics ?? fallback.includeCodeMetrics,
    includeManifest: request.includeManifest ?? fallback.includeManifest,
    includeUpgradeCompatibility: request.includeUpgradeCompatibility ?? fallback.includeUpgradeCompatibility,
    maxDiagnostics: clampNumber(request.maxDiagnostics, 0, 200, fallback.maxDiagnostics),
    maxFiles: clampNumber(request.maxFiles, 1, 200, fallback.maxFiles),
    maxFindings: clampNumber(request.maxFindings, 1, 200, fallback.maxFindings),
  };
}

export function buildUnavailableWorkspaceCheckReport(
  reason: string,
  request: ApiWorkspaceCheckRequest = {},
): ApiWorkspaceCheckReport {
  const normalized = normalizeWorkspaceCheckRequest(request);
  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    mode: normalized.mode,
    status: 'failed',
    available: false,
    reason,
    summary: {
      projectCount: 0,
      objectCount: 0,
      exportedSymbolCount: 0,
      diagnostics: { error: 0, warning: 0, info: 0, hint: 0 },
      catalogIssues: 0,
      blockingFindings: 1,
      warningFindings: 0,
      truncated: false,
    },
    findings: [
      {
        code: 'workspace-check-unavailable',
        severity: 'error',
        area: 'unknown',
        message: 'Workspace check no disponible.',
        detail: reason,
        suggestedAction: 'Abrir un workspace valido y reintentar.',
      },
    ],
    recommendedActions: ['Abrir un workspace valido y reintentar.'],
  };
}

function clampNumber(value: number | undefined, minValue: number, maxValue: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(maxValue, Math.max(minValue, Math.trunc(value)));
}

function trimDiagnosticsSnapshot(snapshot: ApiDiagnosticsSnapshot, maxFiles: number): ApiDiagnosticsSnapshot {
  return {
    ...snapshot,
    documents: snapshot.documents.slice(0, maxFiles),
    projects: snapshot.projects.slice(0, maxFiles),
  };
}

function catalogIssueCount(summary: ApiWorkspaceCheckCatalogSummary | undefined): number {
  if (!summary?.available) {
    return 0;
  }

  return (summary.duplicates ?? 0)
    + (summary.missingSignatures ?? 0)
    + (summary.invalidEnumTypes ?? 0)
    + (summary.orphanEnumValues ?? 0)
    + (summary.orphanLocalizationOverlays ?? 0)
    + (summary.generatedManualConflicts ?? 0)
    + (summary.adrCompliance?.issueCount ?? 0);
}

function formatCatalogAdrComplianceDetail(
  catalog: ApiWorkspaceCheckCatalogSummary,
): string | undefined {
  const compliance = catalog.adrCompliance;
  if (!compliance) {
    return undefined;
  }

  return [
    `policy=${compliance.recommendedPolicy}`,
    `officialDomains=${compliance.officialDomainCount}`,
    `manualPrimary=${compliance.manualPrimaryDomains.length}`,
    `officialGaps=${compliance.officialDomainsWithGaps.length}`,
    `coverageDrift=${compliance.officialCoverageDriftDomains.length}`,
    `scraperErrors=${compliance.scraperErrorCount}`,
    `candidateHotPath=${compliance.candidateHotPathViolations}`,
    `localizationPolicy=${compliance.localizationIncompleteOverlays + compliance.localizationInvalidParameterTargets + compliance.localizationRecoveredTargetIds}`,
  ].join(', ');
}

function uriLabel(uri: string | undefined): string {
  if (!uri) {
    return 'unknown';
  }

  try {
    if (uri.startsWith('file:')) {
      return path.basename(decodeURIComponent(new URL(uri).pathname));
    }
  } catch {
    // Fallback below.
  }

  const normalized = uri.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? uri;
}

function mapHealthArea(layer: string | undefined): ApiWorkspaceCheckFinding['area'] {
  switch (layer) {
    case 'readiness':
      return 'readiness';
    case 'indexer':
      return 'indexing';
    case 'queries':
      return 'semantic';
    case 'memory':
    case 'analysis-cache':
    case 'serving-cache':
    case 'hot-context':
    case 'code-lens-cache':
    case 'scheduler':
      return 'performance';
    default:
      return 'health';
  }
}

function addFinding(
  findings: ApiWorkspaceCheckFinding[],
  finding: ApiWorkspaceCheckFinding,
): void {
  findings.push(finding);
}

function addSectionErrorFindings(
  findings: ApiWorkspaceCheckFinding[],
  recommendedActions: Set<string>,
  sectionErrors: Partial<Record<WorkspaceCheckSectionErrorKey, string>> | undefined,
): void {
  if (!sectionErrors) {
    return;
  }

  for (const [key, detail] of Object.entries(sectionErrors) as Array<[WorkspaceCheckSectionErrorKey, string]>) {
    const area = key === 'catalog'
      ? 'catalog'
      : key === 'buildProfiles'
        ? 'build'
        : key === 'upgradeCompatibility'
          ? 'upgrade'
        : key === 'codeMetrics' || key === 'technicalDebt'
          ? 'semantic'
          : 'health';

    addFinding(findings, {
      code: `${key}-unavailable`,
      severity: 'warning',
      area,
      message: `La seccion ${key} no estuvo disponible durante el workspace check.`,
      detail,
    });
    recommendedActions.add(`Revisar la disponibilidad de ${key} y reintentar el workspace check.`);
  }
}

function addReadinessFinding(
  findings: ApiWorkspaceCheckFinding[],
  recommendedActions: Set<string>,
  readiness: ApiServerStats['readiness'] | undefined,
): void {
  const state = readiness?.state;
  if (!state || state === 'ready') {
    return;
  }

  const severity: ApiWorkspaceCheckFinding['severity'] = state === 'error'
    ? 'error'
    : state === 'degraded' || state === 'indexing' || state === 'discovering'
      ? 'warning'
      : 'info';

  addFinding(findings, {
    code: `readiness-${state}`,
    severity,
    area: state === 'degraded' ? 'indexing' : 'readiness',
    message: `Workspace readiness en estado ${state}.`,
    ...(readiness?.detail ? { detail: readiness.detail } : {}),
  });

  if (severity !== 'info') {
    recommendedActions.add('Esperar a que discovery/indexing llegue a ready o revisar la causa de degradacion del runtime.');
  }
}

function addHealthFindings(
  findings: ApiWorkspaceCheckFinding[],
  recommendedActions: Set<string>,
  health: ApiServerStats['health'] | undefined,
): void {
  if (!health) {
    return;
  }

  for (const finding of health.findings ?? []) {
    addFinding(findings, toWorkspaceCheckFinding(finding));
  }

  if (health.status === 'error') {
    recommendedActions.add('Resolver las findings de salud del runtime antes de cerrar el workspace.');
  } else if (health.status === 'warning') {
    recommendedActions.add('Revisar las findings de salud del runtime para reducir degradacion operacional.');
  }
}

function toWorkspaceCheckFinding(finding: ApiRuntimeHealthFinding): ApiWorkspaceCheckFinding {
  return {
    code: finding.code,
    severity: finding.severity,
    area: mapHealthArea(finding.layer),
    message: finding.message,
    ...(finding.detail ? { detail: finding.detail } : {}),
  };
}

function addDiagnosticsFindings(
  findings: ApiWorkspaceCheckFinding[],
  recommendedActions: Set<string>,
  diagnostics: ApiDiagnosticsSnapshot | undefined,
  maxDiagnosticFindings: number,
): boolean {
  if (!diagnostics) {
    return false;
  }

  let truncated = false;
  if (diagnostics.totals.error > 0) {
    addFinding(findings, {
      code: 'diagnostics-errors',
      severity: 'error',
      area: 'diagnostics',
      message: `${diagnostics.totals.error} diagnostics de error activos en el workspace.`,
      detail: `${diagnostics.totals.warning} warnings, ${diagnostics.totals.info} infos, ${diagnostics.totals.hint} hints.`,
    });
    recommendedActions.add('Resolver los diagnostics de error reportados por el plugin antes de cerrar cambios del workspace.');
  } else if (diagnostics.totals.warning > 0) {
    addFinding(findings, {
      code: 'diagnostics-warnings',
      severity: 'warning',
      area: 'diagnostics',
      message: `${diagnostics.totals.warning} diagnostics de warning activos en el workspace.`,
      detail: `${diagnostics.totals.info} infos, ${diagnostics.totals.hint} hints.`,
    });
  }

  const topDocuments = [...diagnostics.documents]
    .sort((left, right) => right.total - left.total)
    .slice(0, maxDiagnosticFindings);
  truncated = diagnostics.documents.length > topDocuments.length;

  for (const document of topDocuments) {
    if (document.total <= 0) {
      continue;
    }

    const severity: ApiWorkspaceCheckFinding['severity'] = (document.bySeverity.error ?? 0) > 0
      ? 'error'
      : (document.bySeverity.warning ?? 0) > 0
        ? 'warning'
        : 'info';

    addFinding(findings, {
      code: 'diagnostics-file-summary',
      severity,
      area: 'diagnostics',
      message: `${uriLabel(document.uri)} acumula ${document.total} diagnostics.`,
      detail: `${document.bySeverity.error ?? 0} error, ${document.bySeverity.warning ?? 0} warning, ${document.bySeverity.info ?? 0} info, ${document.bySeverity.hint ?? 0} hint.`,
      uri: document.uri,
      evidence: Object.keys(document.byCode).slice(0, 5),
    });
  }

  return truncated;
}

function addCatalogFindings(
  findings: ApiWorkspaceCheckFinding[],
  recommendedActions: Set<string>,
  catalog: ApiWorkspaceCheckCatalogSummary | undefined,
): void {
  if (!catalog?.available) {
    return;
  }

  const issueCount = catalogIssueCount(catalog);
  if (catalog.consistencyStatus === 'failed') {
    addFinding(findings, {
      code: 'catalog-consistency-failed',
      severity: 'error',
      area: 'catalog',
      message: `Catalog consistency fallo con ${issueCount} issues estructurales.`,
      detail: `duplicates=${catalog.duplicates ?? 0}, missingSignatures=${catalog.missingSignatures ?? 0}, generatedManualConflicts=${catalog.generatedManualConflicts ?? 0}.`,
    });
    recommendedActions.add('Corregir duplicateIds, missingSignatures o overlaps manual/generated antes de continuar sobre el catalogo.');
  }

  if (catalog.adrCompliance?.status === 'failed') {
    addFinding(findings, {
      code: 'catalog-adr-compliance-failed',
      severity: 'error',
      area: 'catalog',
      message: `El gate ADR-0001 del catalogo fallo con ${catalog.adrCompliance.issueCount} incidencias.`,
      detail: formatCatalogAdrComplianceDetail(catalog),
      evidence: [
        `policy:${catalog.adrCompliance.recommendedPolicy}`,
        `official-domains-with-gaps:${catalog.adrCompliance.officialDomainsWithGaps.length}`,
        `coverage-drift-domains:${catalog.adrCompliance.officialCoverageDriftDomains.length}`,
        `scraper-errors:${catalog.adrCompliance.scraperErrorCount}`,
        `candidate-hot-path:${catalog.adrCompliance.candidateHotPathViolations}`,
      ],
    });
    recommendedActions.add('Resolver drift de ADR-0001 antes de tratar el catalogo como source-of-truth estable.');
  }

  if (catalog.consistencyStatus === 'warning' || issueCount > 0) {
    addFinding(findings, {
      code: 'catalog-consistency-warning',
      severity: 'warning',
      area: 'catalog',
      message: `Catalogo con ${issueCount} issues no bloqueantes.`,
      detail: [
        `invalidEnumTypes=${catalog.invalidEnumTypes ?? 0}`,
        `orphanEnumValues=${catalog.orphanEnumValues ?? 0}`,
        `orphanLocalizationOverlays=${catalog.orphanLocalizationOverlays ?? 0}`,
        formatCatalogAdrComplianceDetail(catalog),
      ].filter((value): value is string => Boolean(value)).join(', '),
    });
    recommendedActions.add('Revisar las advertencias del catalogo para mantener source-of-truth y overlays alineados.');
  }
}

function addBuildFindings(
  findings: ApiWorkspaceCheckFinding[],
  recommendedActions: Set<string>,
  buildProfiles: ApiBuildProfileMatrix | undefined,
): void {
  if (!buildProfiles) {
    return;
  }

  for (const finding of buildProfiles.findings) {
    addFinding(findings, {
      code: finding.code,
      severity: finding.severity,
      area: 'build',
      message: finding.message,
      ...(finding.detail ? { detail: finding.detail } : {}),
    });
  }

  if ((buildProfiles.summary.invalidProfiles ?? 0) > 0 || (buildProfiles.summary.ambiguousProfiles ?? 0) > 0) {
    recommendedActions.add('Corregir perfiles de build invalidos o ambiguos antes de depender del carril PBAutoBuild.');
  }
}

const WORKSPACE_ARTIFACT_RECOMMENDATION_IDS = new Set([
  'source-control-artifacts',
  'local-artifact-noise',
  'legacy-orca-aliases',
]);

function hasPersistentRuntimeState(stats: ApiServerStats | undefined): boolean {
  return Boolean(
    stats?.persistence?.checkpointUri
    || stats?.persistence?.journalUri
    || stats?.persistence?.buildOrcaJournalUri
    || stats?.persistence?.servingSnapshot?.lastRestoredEntries
    || stats?.caches?.analysis?.size
    || stats?.caches?.serving?.size
  );
}

function countManagedSettingsOutOfProfile(settingsGovernance: PowerSyntaxSettingsGovernanceReport | undefined): number {
  if (!settingsGovernance) {
    return 0;
  }

  return settingsGovernance.managedSettings.filter((entry) => entry.matchesProfile === false).length;
}

function selectWorkspaceArtifactRecommendations(
  workspaceMigrationAssistant: ApiWorkspaceMigrationAssistant | undefined,
): ApiWorkspaceMigrationAssistant['recommendations'] {
  return (workspaceMigrationAssistant?.recommendations ?? []).filter((recommendation) =>
    WORKSPACE_ARTIFACT_RECOMMENDATION_IDS.has(recommendation.id)
  );
}

function summarizeSettingsConflicts(settingsGovernance: PowerSyntaxSettingsGovernanceReport | undefined): string | undefined {
  if (!settingsGovernance || settingsGovernance.conflicts.length === 0) {
    return undefined;
  }

  return settingsGovernance.conflicts
    .slice(0, 3)
    .map((conflict) => `${conflict.key}: ${conflict.message}`)
    .join(' | ');
}

function buildUpgradeCompatibilitySummary(
  serverStats: ApiServerStats,
  manifest: ApiSemanticWorkspaceManifest | undefined,
  settingsGovernance: PowerSyntaxSettingsGovernanceReport | undefined,
  workspaceMigrationAssistant: ApiWorkspaceMigrationAssistant | undefined,
): ApiWorkspaceCheckUpgradeCompatibility {
  const settingsConflicts = settingsGovernance?.conflicts.length ?? 0;
  const managedSettingsOutOfProfile = countManagedSettingsOutOfProfile(settingsGovernance);
  const hasPersistentState = hasPersistentRuntimeState(serverStats);
  const workspaceArtifactRecommendations = selectWorkspaceArtifactRecommendations(workspaceMigrationAssistant).length;

  return {
    reviewStatus: settingsConflicts > 0 || managedSettingsOutOfProfile > 0 || hasPersistentState || workspaceArtifactRecommendations > 0
      ? 'warning'
      : 'passed',
    currentApiVersion: PUBLIC_API_VERSION,
    ...(manifest ? { workspaceManifestSchemaVersion: manifest.schemaVersion } : {}),
    ...(serverStats.persistence?.policy ? { cachePolicyVersion: serverStats.persistence.policy.version } : {}),
    ...(serverStats.persistence?.restoreState ? { cacheRestoreState: serverStats.persistence.restoreState } : {}),
    ...(settingsGovernance?.selectedProfile ? { selectedProfile: settingsGovernance.selectedProfile } : {}),
    settingsConflicts,
    managedSettingsOutOfProfile,
    hasPersistentRuntimeState: hasPersistentState,
    workspaceArtifactRecommendations,
  };
}

function addUpgradeCompatibilityFindings(
  findings: ApiWorkspaceCheckFinding[],
  recommendedActions: Set<string>,
  serverStats: ApiServerStats,
  manifest: ApiSemanticWorkspaceManifest | undefined,
  settingsGovernance: PowerSyntaxSettingsGovernanceReport | undefined,
  workspaceMigrationAssistant: ApiWorkspaceMigrationAssistant | undefined,
  upgradeCompatibility: ApiWorkspaceCheckUpgradeCompatibility,
): void {
  const managedSettingsOutOfProfile = upgradeCompatibility.managedSettingsOutOfProfile;
  const workspaceArtifactRecommendations = selectWorkspaceArtifactRecommendations(workspaceMigrationAssistant);

  if (upgradeCompatibility.settingsConflicts > 0 || managedSettingsOutOfProfile > 0) {
    addFinding(findings, {
      code: 'upgrade-settings-profile-drift',
      severity: 'warning',
      area: 'upgrade',
      message: 'La configuración activa no está alineada con un perfil estable para comparar el upgrade.',
      detail: summarizeSettingsConflicts(settingsGovernance)
        ?? `selectedProfile=${upgradeCompatibility.selectedProfile ?? 'unknown'}, conflicts=${upgradeCompatibility.settingsConflicts}, outOfProfile=${managedSettingsOutOfProfile}`,
      evidence: [
        `selected-profile:${upgradeCompatibility.selectedProfile ?? 'unknown'}`,
        `settings-conflicts:${upgradeCompatibility.settingsConflicts}`,
        `managed-settings-out-of-profile:${managedSettingsOutOfProfile}`,
      ],
    });
    recommendedActions.add('Aplicar un profile vigente o documentar primero el drift de settings antes de comparar comportamiento entre versiones.');
  }

  if (upgradeCompatibility.hasPersistentRuntimeState) {
    addFinding(findings, {
      code: 'upgrade-runtime-cache-refresh',
      severity: 'warning',
      area: 'upgrade',
      message: 'El workspace conserva checkpoint, journal o caches persistentes de sesiones previas.',
      detail: [
        upgradeCompatibility.cacheRestoreState ? `restore=${upgradeCompatibility.cacheRestoreState}` : undefined,
        upgradeCompatibility.cachePolicyVersion !== undefined ? `cachePolicy=v${upgradeCompatibility.cachePolicyVersion}` : 'cachePolicy=unknown',
        serverStats.persistence?.checkpointUri ? 'checkpoint=yes' : undefined,
        serverStats.persistence?.journalUri ? 'journal=yes' : undefined,
        serverStats.caches?.analysis?.size !== undefined ? `analysisCache=${serverStats.caches.analysis.size}` : undefined,
        serverStats.caches?.serving?.size !== undefined ? `servingCache=${serverStats.caches.serving.size}` : undefined,
      ].filter((entry): entry is string => Boolean(entry)).join(' · '),
      evidence: [
        `restore-state:${upgradeCompatibility.cacheRestoreState ?? 'unknown'}`,
        `cache-policy:${upgradeCompatibility.cachePolicyVersion ?? 'unknown'}`,
        `analysis-cache-size:${serverStats.caches?.analysis?.size ?? 0}`,
        `serving-cache-size:${serverStats.caches?.serving?.size ?? 0}`,
      ],
    });
    recommendedActions.add('Inspeccionar y, si hace falta, regenerar manualmente `.vsc-powersyntax/runtime` antes de comparar un upgrade sobre estado persistido.');
  }

  if (workspaceArtifactRecommendations.length > 0) {
    addFinding(findings, {
      code: 'upgrade-workspace-artifacts',
      severity: 'warning',
      area: 'upgrade',
      message: 'El workspace sigue exponiendo artefactos locales o staging legacy que pueden contaminar la comparación entre versiones.',
      detail: workspaceArtifactRecommendations.map((recommendation) => recommendation.title).join(' | '),
      evidence: workspaceArtifactRecommendations.flatMap((recommendation) => recommendation.evidence).slice(0, 8),
    });
    recommendedActions.add('Limpiar o aislar artefactos locales y staging legacy antes de usar el upgrade checker como señal de compatibilidad real.');
  }

  addFinding(findings, {
    code: 'upgrade-version-review',
    severity: 'info',
    area: 'upgrade',
    message: 'Revisar apiVersion y schemaVersion exportados antes de reutilizar snapshots, bundles o caches antiguas.',
    detail: [
      `api=${upgradeCompatibility.currentApiVersion}`,
      `manifestSchema=${manifest?.schemaVersion ?? 'unknown'}`,
      `cachePolicy=${upgradeCompatibility.cachePolicyVersion ?? 'unknown'}`,
      `migrationAssistant=${workspaceMigrationAssistant?.schemaVersion ?? 'not-exported'}`,
    ].join(' · '),
    evidence: [
      `public-api-version:${upgradeCompatibility.currentApiVersion}`,
      `workspace-manifest-schema:${manifest?.schemaVersion ?? 'unknown'}`,
      `cache-policy:${upgradeCompatibility.cachePolicyVersion ?? 'unknown'}`,
      `migration-assistant-schema:${workspaceMigrationAssistant?.schemaVersion ?? 'not-exported'}`,
    ],
  });
  recommendedActions.add('Comparar apiVersion/schemaVersion del runtime, manifest y snapshots antes de mezclar artefactos exportados por versiones distintas.');
}

function addCodeMetricsFinding(
  findings: ApiWorkspaceCheckFinding[],
  recommendedActions: Set<string>,
  codeMetrics: ApiPowerBuilderCodeMetrics | undefined,
): void {
  if (!codeMetrics) {
    return;
  }

  if (codeMetrics.summary.totalDiagnostics > 0 || codeMetrics.summary.totalLifecycleWarnings > 0) {
    addFinding(findings, {
      code: 'code-metrics-hotspots',
      severity: 'warning',
      area: 'semantic',
      message: `Code metrics detecta ${codeMetrics.summary.totalDiagnostics} diagnostics agregados y ${codeMetrics.summary.totalLifecycleWarnings} lifecycle warnings.`,
      detail: `${codeMetrics.summary.totalObjects} objetos analizados, ${codeMetrics.summary.totalEmbeddedSqlStatements} sentencias SQL embebidas.`,
    });
    recommendedActions.add('Revisar hotspots de code metrics si el workspace check se usa como gate de cierre.');
  }
}

function addTechnicalDebtFinding(
  findings: ApiWorkspaceCheckFinding[],
  recommendedActions: Set<string>,
  technicalDebt: ApiPowerBuilderTechnicalDebtReport | undefined,
): void {
  if (!technicalDebt) {
    return;
  }

  if (technicalDebt.summary.totalRecommendations > 0) {
    const detailParts = [
      `obsolete=${technicalDebt.summary.obsoleteFindings}`,
      `dynamicSql=${technicalDebt.summary.dynamicSqlFindings}`,
      `external=${technicalDebt.summary.externalDependencyFindings}`,
      `modernIntegration=${technicalDebt.summary.modernIntegrationFindings ?? 0}`,
      `webUiIntegration=${technicalDebt.summary.webUiIntegrationFindings ?? 0}`,
      `dataWindowRisk=${technicalDebt.summary.dataWindowRiskFindings}`,
      summarizeExternalDependencyEvidence(technicalDebt),
      summarizeModernIntegrationEvidence(technicalDebt),
      summarizeWebUiIntegrationEvidence(technicalDebt),
    ].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

    addFinding(findings, {
      code: 'technical-debt-recommendations',
      severity: technicalDebt.summary.totalHotspots > 0 ? 'warning' : 'info',
      area: 'semantic',
      message: `Technical debt report publica ${technicalDebt.summary.totalRecommendations} recomendaciones y ${technicalDebt.summary.totalHotspots} hotspots.`,
      detail: `${detailParts.join(', ')}.`,
    });
    recommendedActions.add('Revisar hotspots y recomendaciones de deuda tecnica si el cambio toca modernizacion o riesgo legacy.');
  }
}

function summarizeExternalDependencyEvidence(technicalDebt: ApiPowerBuilderTechnicalDebtReport): string | null {
  const byKind: Record<'dll' | 'pbx' | 'unknown', number> = { dll: 0, pbx: 0, unknown: 0 };
  const aliases = new Set<string>();
  const impacts = new Set<string>();
  let consumers = 0;

  for (const hotspot of technicalDebt.hotspots) {
    if (!hotspot.categories.includes('external-dependency')) {
      continue;
    }

    for (const evidence of hotspot.evidence) {
      const kindMatch = /^external-kind:(dll|pbx|unknown)=(\d+)$/i.exec(evidence);
      if (kindMatch) {
        byKind[kindMatch[1].toLowerCase() as 'dll' | 'pbx' | 'unknown'] += Number(kindMatch[2]);
        continue;
      }

      const consumerMatch = /^external-consumers=(\d+)$/i.exec(evidence);
      if (consumerMatch) {
        consumers += Number(consumerMatch[1]);
        continue;
      }

      if (evidence.startsWith('external-alias:')) {
        aliases.add(evidence.slice('external-alias:'.length));
        continue;
      }

      const impactMatch = /^external-(?:risk|build-impact|orca-impact):(.+)$/i.exec(evidence);
      if (impactMatch) {
        impacts.add(impactMatch[1]);
      }
    }
  }

  const kindSummary = (['dll', 'pbx', 'unknown'] as const)
    .filter((kind) => byKind[kind] > 0)
    .map((kind) => `${kind}:${byKind[kind]}`)
    .join('|');

  if (!kindSummary && consumers === 0 && aliases.size === 0 && impacts.size === 0) {
    return null;
  }

  const parts = [
    kindSummary ? `externalKinds=${kindSummary}` : undefined,
    consumers > 0 ? `externalConsumers=${consumers}` : undefined,
    aliases.size > 0 ? `externalAliases=${aliases.size}` : undefined,
    impacts.size > 0 ? `externalImpact=${[...impacts].sort((left, right) => left.localeCompare(right)).join('|')}` : undefined,
  ].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

  return parts.length > 0 ? parts.join(', ') : null;
}

function summarizeModernIntegrationEvidence(technicalDebt: ApiPowerBuilderTechnicalDebtReport): string | null {
  const endpoints = new Set<string>();
  const patterns = new Set<string>();
  const surfaces = new Set<string>();
  const risks = new Set<string>();

  for (const hotspot of technicalDebt.hotspots) {
    if (!hotspot.categories.includes('modern-integration')) {
      continue;
    }

    for (const evidence of hotspot.evidence) {
      const surfaceMatch = /^integration-surface:(.+)$/i.exec(evidence);
      if (surfaceMatch) {
        surfaces.add(surfaceMatch[1]);
        continue;
      }

      const endpointMatch = /^integration-endpoint:(.+)$/i.exec(evidence);
      if (endpointMatch) {
        endpoints.add(endpointMatch[1]);
        continue;
      }

      const patternMatch = /^integration-pattern:(.+)$/i.exec(evidence);
      if (patternMatch) {
        patterns.add(patternMatch[1]);
        continue;
      }

      const riskMatch = /^integration-risk:(.+)$/i.exec(evidence);
      if (riskMatch) {
        risks.add(riskMatch[1]);
      }
    }
  }

  if (surfaces.size === 0 && endpoints.size === 0 && patterns.size === 0 && risks.size === 0) {
    return null;
  }

  const parts = [
    surfaces.size > 0 ? `modernSurfaces=${[...surfaces].sort((left, right) => left.localeCompare(right)).join('|')}` : undefined,
    endpoints.size > 0 ? `modernEndpoints=${endpoints.size}` : undefined,
    patterns.size > 0 ? `modernPatterns=${[...patterns].sort((left, right) => left.localeCompare(right)).join('|')}` : undefined,
    risks.size > 0 ? `modernRisk=${[...risks].sort((left, right) => left.localeCompare(right)).join('|')}` : undefined,
  ].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

  return parts.length > 0 ? parts.join(', ') : null;
}

function summarizeWebUiIntegrationEvidence(technicalDebt: ApiPowerBuilderTechnicalDebtReport): string | null {
  const surfaces = new Set<string>();
  const patterns = new Set<string>();
  const risks = new Set<string>();

  for (const hotspot of technicalDebt.hotspots) {
    if (!hotspot.categories.includes('web-ui-integration')) {
      continue;
    }

    for (const evidence of hotspot.evidence) {
      const surfaceMatch = /^web-ui-surface:(.+)$/i.exec(evidence);
      if (surfaceMatch) {
        surfaces.add(surfaceMatch[1]);
        continue;
      }

      const patternMatch = /^web-ui-pattern:(.+)$/i.exec(evidence);
      if (patternMatch) {
        patterns.add(patternMatch[1]);
        continue;
      }

      const riskMatch = /^web-ui-risk:(.+)$/i.exec(evidence);
      if (riskMatch) {
        risks.add(riskMatch[1]);
      }
    }
  }

  if (surfaces.size === 0 && patterns.size === 0 && risks.size === 0) {
    return null;
  }

  const parts = [
    surfaces.size > 0 ? `webUiSurfaces=${[...surfaces].sort((left, right) => left.localeCompare(right)).join('|')}` : undefined,
    patterns.size > 0 ? `webUiPatterns=${[...patterns].sort((left, right) => left.localeCompare(right)).join('|')}` : undefined,
    risks.size > 0 ? `webUiRisk=${[...risks].sort((left, right) => left.localeCompare(right)).join('|')}` : undefined,
  ].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);

  return parts.length > 0 ? parts.join(', ') : null;
}

function sortFindings(findings: readonly ApiWorkspaceCheckFinding[]): ApiWorkspaceCheckFinding[] {
  return [...findings].sort((left, right) => {
    const severityDelta = SEVERITY_ORDER[left.severity] - SEVERITY_ORDER[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    const areaDelta = left.area.localeCompare(right.area);
    if (areaDelta !== 0) {
      return areaDelta;
    }

    return left.message.localeCompare(right.message);
  });
}

export function buildWorkspaceCheckReport(input: WorkspaceCheckBuildInput): ApiWorkspaceCheckReport {
  const normalized = normalizeWorkspaceCheckRequest(input.request);
  if (!input.serverStats) {
    return buildUnavailableWorkspaceCheckReport('No se pudieron obtener las estadisticas base del runtime.', normalized);
  }

  const findings: ApiWorkspaceCheckFinding[] = [];
  const recommendedActions = new Set<string>();
  let truncated = false;
  const upgradeCompatibility = normalized.includeUpgradeCompatibility
    ? buildUpgradeCompatibilitySummary(
        input.serverStats,
        input.manifest,
        input.settingsGovernance,
        input.workspaceMigrationAssistant,
      )
    : undefined;

  addSectionErrorFindings(findings, recommendedActions, input.sectionErrors);
  addReadinessFinding(findings, recommendedActions, input.serverStats.readiness);

  if (normalized.includeHealth) {
    addHealthFindings(findings, recommendedActions, input.serverStats.health);
  }

  const diagnostics = normalized.includeDiagnostics && input.serverStats.diagnostics
    ? trimDiagnosticsSnapshot(input.serverStats.diagnostics, normalized.maxFiles)
    : undefined;
  const visibleDiagnosticsDocumentCount = diagnostics?.documents.length ?? 0;
  if (normalized.includeDiagnostics && input.serverStats.diagnostics) {
    truncated = addDiagnosticsFindings(
      findings,
      recommendedActions,
      input.serverStats.diagnostics,
      Math.min(normalized.maxDiagnostics, normalized.maxFiles),
    ) || truncated;
  }

  if (normalized.includeCatalog) {
    addCatalogFindings(findings, recommendedActions, input.catalog);
  }

  if (normalized.includeUpgradeCompatibility && upgradeCompatibility) {
    addUpgradeCompatibilityFindings(
      findings,
      recommendedActions,
      input.serverStats,
      input.manifest,
      input.settingsGovernance,
      input.workspaceMigrationAssistant,
      upgradeCompatibility,
    );
  }

  if (normalized.includeBuildProfiles) {
    addBuildFindings(findings, recommendedActions, input.buildProfiles);
  }

  if (normalized.includeCodeMetrics) {
    addCodeMetricsFinding(findings, recommendedActions, input.codeMetrics);
  }

  if (normalized.includeTechnicalDebt) {
    addTechnicalDebtFinding(findings, recommendedActions, input.technicalDebt);
  }

  const sortedFindings = sortFindings(findings);
  const visibleFindings = sortedFindings.slice(0, normalized.maxFindings);
  truncated = truncated || sortedFindings.length > visibleFindings.length;
  truncated = truncated
    || Boolean(input.manifest?.limits.objectsTruncated)
    || Boolean(input.manifest?.limits.symbolsTruncated)
    || Boolean(input.serverStats.diagnostics && (input.serverStats.diagnostics.documents.length > visibleDiagnosticsDocumentCount));

  const blockingFindings = sortedFindings.filter((finding) => finding.severity === 'error').length;
  const warningFindings = sortedFindings.filter((finding) => finding.severity === 'warning').length;
  const diagnosticsTotals = input.serverStats.diagnostics?.totals ?? { error: 0, warning: 0, info: 0, hint: 0 };
  const readinessState = normalized.includeHealth ? input.serverStats.readiness?.state : undefined;
  const healthStatus = normalized.includeHealth ? input.serverStats.health?.status : undefined;
  const catalogStatus = normalized.includeCatalog ? input.catalog?.consistencyStatus : undefined;
  const catalogAdrStatus = normalized.includeCatalog ? input.catalog?.adrCompliance?.status : undefined;
  const buildHasError = normalized.includeBuildProfiles && Boolean(input.buildProfiles?.findings.some((finding) => finding.severity === 'error'));
  const buildHasWarning = normalized.includeBuildProfiles && Boolean(input.buildProfiles?.findings.some((finding) => finding.severity === 'warning'));

  const failed = (normalized.includeDiagnostics && diagnosticsTotals.error > 0)
    || healthStatus === 'error'
    || readinessState === 'error'
    || catalogStatus === 'failed'
    || catalogAdrStatus === 'failed'
    || buildHasError;
  const warning = !failed && (
    (normalized.includeDiagnostics && diagnosticsTotals.warning > 0)
    || healthStatus === 'warning'
    || (readinessState !== undefined && readinessState !== 'ready')
    || catalogStatus === 'warning'
    || catalogAdrStatus === 'warning'
    || buildHasWarning
    || warningFindings > 0
  );

  return {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    apiVersion: PUBLIC_API_VERSION,
    mode: normalized.mode,
    status: failed ? 'failed' : warning ? 'warning' : 'passed',
    available: true,
    summary: {
      projectCount: input.manifest?.projects.length ?? (input.serverStats.projectModel?.projects ?? 0),
      objectCount: input.manifest?.inheritanceSummary.totalTypes ?? input.manifest?.objects.length ?? 0,
      exportedSymbolCount: input.manifest?.exportedSymbols.length ?? 0,
      diagnostics: { ...diagnosticsTotals },
      ...(healthStatus ? { healthStatus } : {}),
      ...(readinessState ? { readinessState } : {}),
      catalogIssues: catalogIssueCount(input.catalog),
      blockingFindings,
      warningFindings,
      ...(input.serverStats.persistence?.restoreState === 'restored' || input.serverStats.persistence?.restoreState === 'reused'
        ? { generatedFromCache: true }
        : {}),
      truncated,
    },
    ...(normalized.includeHealth && input.serverStats.readiness ? { readiness: input.serverStats.readiness } : {}),
    ...(normalized.includeHealth && input.serverStats.health ? { health: input.serverStats.health } : {}),
    ...(normalized.includeDiagnostics && diagnostics ? { diagnostics } : {}),
    ...(normalized.includeCatalog && input.catalog ? { catalog: input.catalog } : {}),
    ...(normalized.includeUpgradeCompatibility && upgradeCompatibility ? { upgradeCompatibility } : {}),
    ...(normalized.includeManifest && input.manifest ? { manifest: input.manifest } : {}),
    ...(normalized.includeCodeMetrics && input.codeMetrics ? { codeMetrics: input.codeMetrics } : {}),
    ...(normalized.includeTechnicalDebt && input.technicalDebt ? { technicalDebt: input.technicalDebt } : {}),
    ...(normalized.includeBuildProfiles && input.buildProfiles ? { buildProfiles: input.buildProfiles } : {}),
    findings: visibleFindings,
    recommendedActions: [...recommendedActions],
  };
}

function formatFindingsMarkdown(findings: readonly ApiWorkspaceCheckFinding[]): string[] {
  if (findings.length === 0) {
    return ['No findings.'];
  }

  return findings.map((finding) => {
    const location = finding.uri ? ` (${uriLabel(finding.uri)}${typeof finding.line === 'number' ? `:${finding.line + 1}` : ''})` : '';
    const detail = finding.detail ? ` - ${finding.detail}` : '';
    return `- [${finding.severity}] [${finding.area}] ${finding.message}${location}${detail}`;
  });
}

export function buildWorkspaceCheckMarkdown(report: ApiWorkspaceCheckReport): string {
  const lines = [
    '# Workspace Check',
    '',
    `- Status: ${report.status}`,
    `- Mode: ${report.mode}`,
    `- Available: ${report.available ? 'yes' : 'no'}`,
    `- Generated at: ${report.generatedAt}`,
    `- API version: ${report.apiVersion}`,
    '',
  ];

  if (!report.available) {
    lines.push(`Reason: ${report.reason ?? 'unknown'}`, '');
  }

  lines.push(
    '## Summary',
    '',
    `- Projects: ${report.summary.projectCount}`,
    `- Objects: ${report.summary.objectCount}`,
    `- Exported symbols: ${report.summary.exportedSymbolCount}`,
    `- Diagnostics: error=${report.summary.diagnostics.error}, warning=${report.summary.diagnostics.warning}, info=${report.summary.diagnostics.info}, hint=${report.summary.diagnostics.hint}`,
    `- Catalog issues: ${report.summary.catalogIssues}`,
    `- Blocking findings: ${report.summary.blockingFindings}`,
    `- Warning findings: ${report.summary.warningFindings}`,
    `- Truncated: ${report.summary.truncated ? 'yes' : 'no'}`,
  );

  if (report.summary.healthStatus) {
    lines.push(`- Health: ${report.summary.healthStatus}`);
  }
  if (report.summary.readinessState) {
    lines.push(`- Readiness: ${report.summary.readinessState}`);
  }
  if (typeof report.summary.generatedFromCache === 'boolean') {
    lines.push(`- Generated from cache: ${report.summary.generatedFromCache ? 'yes' : 'no'}`);
  }

  if (report.catalog) {
    lines.push('', '## Catalog', '', `- Consistency: ${report.catalog.consistencyStatus}`, `- Total entries: ${report.catalog.totalEntries ?? 0}`, `- Duplicates: ${report.catalog.duplicates ?? 0}`, `- Missing signatures: ${report.catalog.missingSignatures ?? 0}`, `- Invalid enum types: ${report.catalog.invalidEnumTypes ?? 0}`, `- Generated/manual conflicts: ${report.catalog.generatedManualConflicts ?? 0}`);

    if (report.catalog.adrCompliance) {
      lines.push(
        `- ADR-0001 compliance: ${report.catalog.adrCompliance.status}`,
        `- Recommended policy: ${report.catalog.adrCompliance.recommendedPolicy}`,
        `- Completeness mode: ${report.catalog.adrCompliance.completenessMode}`,
        `- Official domains: ${report.catalog.adrCompliance.officialDomainCount}`,
        `- Manual-primary domains: ${report.catalog.adrCompliance.manualPrimaryDomains.join(', ') || 'none'}`,
        `- Official domains with gaps: ${report.catalog.adrCompliance.officialDomainsWithGaps.join(', ') || 'none'}`,
        `- Coverage drift domains: ${report.catalog.adrCompliance.officialCoverageDriftDomains.join(', ') || 'none'}`,
        `- Overlay counts: gap=${report.catalog.adrCompliance.overlayCounts.gap}, enrichment=${report.catalog.adrCompliance.overlayCounts.enrichment}, override=${report.catalog.adrCompliance.overlayCounts.override}, candidate=${report.catalog.adrCompliance.overlayCounts.candidate}`,
        `- Provenance counts: official=${report.catalog.adrCompliance.officialEntries}, curated=${report.catalog.adrCompliance.curatedEntries}, generated=${report.catalog.adrCompliance.generatedEntries}, manual=${report.catalog.adrCompliance.manualEntries}`,
        `- ADR issues: ${report.catalog.adrCompliance.issueCount}`,
        `- Candidate hot path violations: ${report.catalog.adrCompliance.candidateHotPathViolations}`,
        `- Scraper errors: ${report.catalog.adrCompliance.scraperErrorCount}`,
        `- Localization policy drift: incomplete=${report.catalog.adrCompliance.localizationIncompleteOverlays}, invalidParameters=${report.catalog.adrCompliance.localizationInvalidParameterTargets}, recoveredTargetIds=${report.catalog.adrCompliance.localizationRecoveredTargetIds}`,
      );
    }
  }

  if (report.upgradeCompatibility) {
    lines.push(
      '',
      '## Upgrade Compatibility',
      '',
      `- Review status: ${report.upgradeCompatibility.reviewStatus}`,
      `- Current API version: ${report.upgradeCompatibility.currentApiVersion}`,
      `- Selected profile: ${report.upgradeCompatibility.selectedProfile ?? 'unknown'}`,
      `- Settings conflicts: ${report.upgradeCompatibility.settingsConflicts}`,
      `- Managed settings out of profile: ${report.upgradeCompatibility.managedSettingsOutOfProfile}`,
      `- Persistent runtime state: ${report.upgradeCompatibility.hasPersistentRuntimeState ? 'yes' : 'no'}`,
      `- Workspace artifact recommendations: ${report.upgradeCompatibility.workspaceArtifactRecommendations}`,
      `- Workspace manifest schema: ${report.upgradeCompatibility.workspaceManifestSchemaVersion ?? 'unknown'}`,
      `- Cache policy version: ${report.upgradeCompatibility.cachePolicyVersion ?? 'unknown'}`,
      `- Cache restore state: ${report.upgradeCompatibility.cacheRestoreState ?? 'unknown'}`,
    );
  }

  if (report.buildProfiles) {
    lines.push('', '## Build Profiles', '', `- Profiles: ${report.buildProfiles.summary.totalProfiles}`, `- Runnable: ${report.buildProfiles.summary.runnableProfiles}`, `- Invalid: ${report.buildProfiles.summary.invalidProfiles}`, `- Ambiguous: ${report.buildProfiles.summary.ambiguousProfiles}`, `- Tooling: ${report.buildProfiles.summary.toolingStatus}`, `- Health state: ${report.buildProfiles.summary.healthState}`);
  }

  if (report.recommendedActions.length > 0) {
    lines.push('', '## Recommended Actions', '', ...report.recommendedActions.map((action) => `- ${action}`));
  }

  lines.push('', '## Findings', '', ...formatFindingsMarkdown(report.findings));
  return `${lines.join('\n')}\n`;
}