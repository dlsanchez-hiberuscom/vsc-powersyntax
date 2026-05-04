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
} from '../shared/publicApi';

type WorkspaceCheckSectionErrorKey = 'manifest' | 'catalog' | 'buildProfiles' | 'codeMetrics' | 'technicalDebt';

export interface WorkspaceCheckBuildInput {
  request?: ApiWorkspaceCheckRequest;
  serverStats?: ApiServerStats;
  manifest?: ApiSemanticWorkspaceManifest;
  catalog?: ApiWorkspaceCheckCatalogSummary;
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
      maxDiagnostics: 16,
      maxFiles: 12,
      maxFindings: 32,
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
    + (summary.generatedManualConflicts ?? 0);
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
    return;
  }

  if (catalog.consistencyStatus === 'warning' || issueCount > 0) {
    addFinding(findings, {
      code: 'catalog-consistency-warning',
      severity: 'warning',
      area: 'catalog',
      message: `Catalogo con ${issueCount} issues no bloqueantes.`,
      detail: `invalidEnumTypes=${catalog.invalidEnumTypes ?? 0}, orphanEnumValues=${catalog.orphanEnumValues ?? 0}, orphanLocalizationOverlays=${catalog.orphanLocalizationOverlays ?? 0}.`,
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
    addFinding(findings, {
      code: 'technical-debt-recommendations',
      severity: technicalDebt.summary.totalHotspots > 0 ? 'warning' : 'info',
      area: 'semantic',
      message: `Technical debt report publica ${technicalDebt.summary.totalRecommendations} recomendaciones y ${technicalDebt.summary.totalHotspots} hotspots.`,
      detail: `obsolete=${technicalDebt.summary.obsoleteFindings}, dynamicSql=${technicalDebt.summary.dynamicSqlFindings}, dataWindowRisk=${technicalDebt.summary.dataWindowRiskFindings}.`,
    });
    recommendedActions.add('Revisar hotspots y recomendaciones de deuda tecnica si el cambio toca modernizacion o riesgo legacy.');
  }
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
  const buildHasError = normalized.includeBuildProfiles && Boolean(input.buildProfiles?.findings.some((finding) => finding.severity === 'error'));
  const buildHasWarning = normalized.includeBuildProfiles && Boolean(input.buildProfiles?.findings.some((finding) => finding.severity === 'warning'));

  const failed = (normalized.includeDiagnostics && diagnosticsTotals.error > 0)
    || healthStatus === 'error'
    || readinessState === 'error'
    || catalogStatus === 'failed'
    || buildHasError;
  const warning = !failed && (
    (normalized.includeDiagnostics && diagnosticsTotals.warning > 0)
    || healthStatus === 'warning'
    || (readinessState !== undefined && readinessState !== 'ready')
    || catalogStatus === 'warning'
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