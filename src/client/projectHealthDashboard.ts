import type {
  ApiDiagnosticsSnapshot,
  ApiSemanticWorkspaceManifest,
} from '../shared/publicApi';
import type { ProgressNotification } from '../shared/types';
import { buildProjectSupportMatrix } from './projectSupportMatrix';
import {
  buildStatusHealthReport,
  buildStatusStatsReport,
  formatStatusBarSummary,
  type RuntimeStatusStats,
} from './statusBarPresentation';
import { formatOrcaPackagingPolicyInline, formatOrcaStatusInline } from './build/orcaDetection';

export type EnterpriseHealthDimensionKey =
  | 'readiness'
  | 'diagnostics'
  | 'build'
  | 'orca'
  | 'cache'
  | 'source-origin'
  | 'performance'
  | 'support-matrix';

export type EnterpriseHealthStatus = 'healthy' | 'warning' | 'critical';

export interface EnterpriseHealthDimensionScore {
  key: EnterpriseHealthDimensionKey;
  label: string;
  weight: number;
  score: number;
  status: EnterpriseHealthStatus;
  summary: string;
}

export interface EnterpriseHealthScorecard {
  schemaVersion: '1.0.0';
  total: number;
  max: number;
  status: EnterpriseHealthStatus;
  summary: string;
  dimensions: readonly EnterpriseHealthDimensionScore[];
}

const ENTERPRISE_HEALTH_WEIGHTS: Record<EnterpriseHealthDimensionKey, number> = {
  readiness: 20,
  diagnostics: 15,
  build: 15,
  orca: 10,
  cache: 10,
  'source-origin': 10,
  performance: 10,
  'support-matrix': 10,
};

function pushBullet(lines: string[], label: string, value?: string): void {
  if (!value) {
    return;
  }

  lines.push(`- ${label}: ${value}`);
}

function formatDiagnosticsTotals(snapshot?: ApiDiagnosticsSnapshot | null): string | undefined {
  if (!snapshot) {
    return undefined;
  }

  return [
    `${snapshot.totals.error} error`,
    `${snapshot.totals.warning} warning`,
    `${snapshot.totals.info} info`,
    `${snapshot.totals.hint} hint`,
  ].join(' · ');
}

function topCountEntries(source: Record<string, number> | undefined, limit = 5): string[] {
  if (!source) {
    return [];
  }

  return Object.entries(source)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([key, count]) => `${key}: ${count}`);
}

function formatSourceOriginSummary(summary: Record<string, number> | undefined): string | undefined {
  if (!summary) {
    return undefined;
  }

  const parts = Object.entries(summary)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([sourceOrigin, count]) => `${sourceOrigin} ${count}`);

  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function formatBuildFiles(stats?: RuntimeStatusStats): string | undefined {
  const buildFiles = stats?.buildFiles;
  if (!buildFiles) {
    return undefined;
  }

  return [
    typeof buildFiles.total === 'number' ? `${buildFiles.total} total` : undefined,
    typeof buildFiles.usable === 'number' ? `${buildFiles.usable} utilizables` : undefined,
    typeof buildFiles.invalid === 'number' ? `${buildFiles.invalid} inválidos` : undefined,
    typeof buildFiles.ambiguous === 'number' ? `${buildFiles.ambiguous} ambiguos` : undefined,
  ].filter((part): part is string => Boolean(part)).join(' · ');
}

function formatOrcaLegacy(stats?: RuntimeStatusStats): string | undefined {
  const tooling = formatOrcaStatusInline(stats?.orcaTooling);
  const runnerState = stats?.orcaRunner?.state;
  const runner = runnerState && runnerState !== 'idle'
    ? stats?.orcaRunner?.detail ? `${runnerState} · ${stats.orcaRunner.detail}` : runnerState
    : undefined;

  return [tooling, runner].filter((part): part is string => Boolean(part)).join(' · ') || 'ORCA no detectado';
}

function formatActiveProject(stats?: RuntimeStatusStats): string | undefined {
  const project = stats?.workspace?.activeProject;
  if (!project?.name) {
    return undefined;
  }

  const parts = [
    project.kind,
    typeof project.files?.length === 'number' ? `${project.files.length} archivos` : undefined,
    typeof project.libraries?.length === 'number' ? `${project.libraries.length} librerías` : undefined,
  ].filter((part): part is string => Boolean(part));

  return `${project.name}${parts.length > 0 ? ` · ${parts.join(' · ')}` : ''}`;
}

function formatManifestSummary(manifest?: ApiSemanticWorkspaceManifest): string | undefined {
  if (!manifest) {
    return undefined;
  }

  return [
    `${manifest.projects.length} proyectos`,
    `${manifest.libraries.length} librerías`,
    `${manifest.objects.length} objetos exportados`,
    `${manifest.inheritanceSummary.totalTypes} tipos`,
  ].join(' · ');
}

function formatFindingList(
  findings: Array<{ severity: string; layer: string; message: string }> | undefined,
  limit: number,
): string[] {
  if (!findings || findings.length === 0) {
    return [];
  }

  return findings.slice(0, limit).map((finding) => `- ${finding.severity.toUpperCase()} [${finding.layer}] ${finding.message}`);
}

function formatSupportLevel(value: 'supported' | 'read-only' | 'conditional'): string {
  switch (value) {
    case 'supported':
      return 'soportado';
    case 'read-only':
      return 'read-only';
    default:
      return 'condicional';
  }
}

function formatSupportStatus(value: 'active' | 'present' | 'available' | 'unavailable'): string {
  switch (value) {
    case 'active':
      return 'activo';
    case 'present':
      return 'presente';
    case 'available':
      return 'disponible';
    default:
      return 'no disponible';
  }
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function clampScore(score: number, weight: number): number {
  return Math.max(0, Math.min(weight, Math.round(score)));
}

function deriveDimensionStatus(score: number, weight: number): EnterpriseHealthStatus {
  if (weight <= 0) {
    return 'critical';
  }

  const ratio = score / weight;
  if (ratio >= 0.75) {
    return 'healthy';
  }
  if (ratio >= 0.45) {
    return 'warning';
  }
  return 'critical';
}

function createEnterpriseDimension(
  key: EnterpriseHealthDimensionKey,
  label: string,
  score: number,
  summary: string,
): EnterpriseHealthDimensionScore {
  const weight = ENTERPRISE_HEALTH_WEIGHTS[key];
  const clampedScore = clampScore(score, weight);
  return {
    key,
    label,
    weight,
    score: clampedScore,
    status: deriveDimensionStatus(clampedScore, weight),
    summary,
  };
}

function formatEnterpriseStatus(value: EnterpriseHealthStatus): string {
  switch (value) {
    case 'healthy':
      return 'saludable';
    case 'warning':
      return 'atención';
    default:
      return 'crítico';
  }
}

function summarizeWeakDimensions(dimensions: readonly EnterpriseHealthDimensionScore[]): string {
  const weakDimensions = [...dimensions]
    .filter((dimension) => dimension.status !== 'healthy')
    .sort((left, right) => (left.score / left.weight) - (right.score / right.weight))
    .slice(0, 3)
    .map((dimension) => dimension.label.toLowerCase());

  return weakDimensions.length > 0
    ? `vigilar ${weakDimensions.join(', ')}`
    : 'sin gaps operativos relevantes';
}

function getHealthFindingsByLayer(
  stats: RuntimeStatusStats | undefined,
  layers: readonly string[],
): Array<{ severity: string; layer: string; message: string }> {
  const layerSet = new Set(layers);
  return (stats?.health?.findings ?? []).filter((finding) => layerSet.has(finding.layer));
}

function scoreReadiness(
  stats?: RuntimeStatusStats,
  manifest?: ApiSemanticWorkspaceManifest,
): EnterpriseHealthDimensionScore {
  const state = manifest?.readiness.state ?? stats?.readiness?.state;
  const detail = manifest?.readiness.detail ?? stats?.readiness?.detail;
  const summary = [state ?? 'sin snapshot', detail].filter((part): part is string => Boolean(part)).join(' · ');

  switch (state) {
    case 'ready':
      return createEnterpriseDimension('readiness', 'Readiness', 20, summary || 'runtime listo');
    case 'indexing':
      return createEnterpriseDimension('readiness', 'Readiness', 14, summary || 'indexación en curso');
    case 'discovering':
      return createEnterpriseDimension('readiness', 'Readiness', 12, summary || 'discovery en curso');
    case 'partial':
      return createEnterpriseDimension('readiness', 'Readiness', 10, summary || 'readiness parcial');
    case 'degraded':
      return createEnterpriseDimension('readiness', 'Readiness', 4, summary || 'runtime degradado');
    case 'idle':
      return createEnterpriseDimension('readiness', 'Readiness', 8, summary || 'runtime en espera');
    default:
      return createEnterpriseDimension('readiness', 'Readiness', 8, summary || 'sin snapshot de readiness');
  }
}

function scoreDiagnostics(
  stats?: RuntimeStatusStats,
  manifest?: ApiSemanticWorkspaceManifest,
): EnterpriseHealthDimensionScore {
  const diagnostics = manifest?.diagnosticsSummary ?? stats?.diagnostics;
  if (!diagnostics) {
    return createEnterpriseDimension('diagnostics', 'Diagnósticos', 8, 'sin snapshot diagnóstico');
  }

  const penalty = (
    diagnostics.totals.error * 3
    + diagnostics.totals.warning
    + diagnostics.totals.info * 0.25
    + diagnostics.totals.hint * 0.25
  );
  const summary = [
    diagnostics.totals.error > 0 ? `${diagnostics.totals.error} error` : undefined,
    diagnostics.totals.warning > 0 ? `${diagnostics.totals.warning} warning` : undefined,
    diagnostics.totals.info > 0 ? `${diagnostics.totals.info} info` : undefined,
    diagnostics.totals.hint > 0 ? `${diagnostics.totals.hint} hint` : undefined,
  ].filter((part): part is string => Boolean(part)).join(' · ');

  return createEnterpriseDimension(
    'diagnostics',
    'Diagnósticos',
    ENTERPRISE_HEALTH_WEIGHTS.diagnostics - penalty,
    summary || 'sin diagnósticos publicados',
  );
}

function scoreBuild(stats?: RuntimeStatusStats): EnterpriseHealthDimensionScore {
  const buildHealth = stats?.buildHealth;
  if (!buildHealth) {
    return createEnterpriseDimension('build', 'Build', 7, stats?.buildTooling?.detail ?? 'sin snapshot de build moderno');
  }

  const score = buildHealth.state === 'ready'
    ? 15
    : buildHealth.state === 'running'
      ? 12
      : buildHealth.state === 'attention'
        ? 9
        : 5;

  return createEnterpriseDimension(
    'build',
    'Build',
    score,
    `${buildHealth.state} · ${buildHealth.summary}`,
  );
}

function scoreOrca(stats?: RuntimeStatusStats): EnterpriseHealthDimensionScore {
  const orcaTooling = stats?.orcaTooling;
  if (!orcaTooling) {
    return createEnterpriseDimension('orca', 'ORCA', 7, 'sin snapshot ORCA');
  }

  let score = orcaTooling.status === 'available'
    ? 10
    : orcaTooling.status === 'missing'
      ? 7
      : 4;
  if (stats?.orcaRunner?.state === 'failed') {
    score -= 2;
  }

  return createEnterpriseDimension(
    'orca',
    'ORCA',
    score,
    `${orcaTooling.status} · ${orcaTooling.detail}`,
  );
}

function scoreCache(stats?: RuntimeStatusStats): EnterpriseHealthDimensionScore {
  const findings = getHealthFindingsByLayer(stats, ['analysis-cache', 'serving-cache', 'hot-context', 'persistence']);
  if (!stats?.caches && !stats?.persistence && findings.length === 0) {
    return createEnterpriseDimension('cache', 'Cache', 6, 'sin snapshot de cache/persistencia');
  }

  let score = ENTERPRISE_HEALTH_WEIGHTS.cache;
  for (const finding of findings) {
    score -= finding.severity === 'error'
      ? 4
      : finding.severity === 'warning'
        ? 2
        : 1;
  }

  const summary = findings.length > 0
    ? findings.slice(0, 2).map((finding) => finding.message).join(' · ')
    : 'analysis/serving/hot-context sin findings activos';

  return createEnterpriseDimension('cache', 'Cache', score, summary);
}

function scoreSourceOrigin(
  stats?: RuntimeStatusStats,
  manifest?: ApiSemanticWorkspaceManifest,
): EnterpriseHealthDimensionScore {
  const summary = manifest?.sourceOriginSummary ?? stats?.workspace?.sourceOrigins;
  const entries = Object.entries(summary ?? {});
  if (entries.length === 0) {
    return createEnterpriseDimension('source-origin', 'Source origin', 5, 'sin inventario de sourceOrigin');
  }

  const totals = entries.reduce((accumulator, [, count]) => accumulator + count, 0);
  const canonical = (summary?.['solution-source'] ?? 0) + (summary?.['workspace-ws_objects'] ?? 0) + (summary?.['pbl-folder-source'] ?? 0);
  const readOnly = (summary?.['manual-export-source'] ?? 0) + (summary?.['orca-staging'] ?? 0) + (summary?.['pbl-dump-source'] ?? 0);
  const nonCanonical = (summary?.generated ?? 0) + (summary?.backup ?? 0) + (summary?.unknown ?? 0);
  const penalty = Math.round((readOnly / Math.max(1, totals)) * 3) + Math.round((nonCanonical / Math.max(1, totals)) * 5);

  return createEnterpriseDimension(
    'source-origin',
    'Source origin',
    ENTERPRISE_HEALTH_WEIGHTS['source-origin'] - penalty,
    `${canonical}/${totals} canónicos · ${readOnly} read-only · ${nonCanonical} no canónicos`,
  );
}

function scorePerformance(stats?: RuntimeStatusStats): EnterpriseHealthDimensionScore {
  const memoryStatus = stats?.memory?.status;
  const hasPerformanceSnapshot = Boolean(stats?.scheduler || stats?.memory || stats?.indexer);
  if (!hasPerformanceSnapshot) {
    return createEnterpriseDimension('performance', 'Performance', 5, 'sin snapshot de scheduler/memory/indexer');
  }

  if (!stats?.scheduler && !stats?.memory) {
    return createEnterpriseDimension(
      'performance',
      'Performance',
      stats?.indexer?.degraded ? 3 : 6,
      stats?.indexer?.degraded ? 'indexer degradado · sin scheduler/memory' : 'snapshot parcial: sin scheduler/memory',
    );
  }

  let score = ENTERPRISE_HEALTH_WEIGHTS.performance;
  const summaryParts: string[] = [];

  if (stats?.indexer?.degraded) {
    score -= 3;
    summaryParts.push('indexer degradado');
  }
  if ((stats?.scheduler?.pendingNear ?? 0) > 0) {
    score -= 1;
    summaryParts.push(`near ${stats?.scheduler?.pendingNear}`);
  }
  if ((stats?.scheduler?.pendingBackground ?? 0) > 0) {
    score -= 1;
    summaryParts.push(`background ${stats?.scheduler?.pendingBackground}`);
  }
  if (stats?.scheduler?.throttledBackgroundWorkload || stats?.scheduler?.throttledBackgroundReason) {
    score -= 1;
    summaryParts.push('background throttled');
  }
  if (memoryStatus === 'warning') {
    score -= 2;
    summaryParts.push('memoria cerca del budget');
  } else if (memoryStatus === 'error') {
    score -= 4;
    summaryParts.push('memoria fuera de budget');
  }

  return createEnterpriseDimension(
    'performance',
    'Performance',
    score,
    summaryParts.join(' · ') || 'sin backlog ni presión de memoria visibles',
  );
}

function scoreSupportMatrix(
  stats?: RuntimeStatusStats,
  manifest?: ApiSemanticWorkspaceManifest,
): EnterpriseHealthDimensionScore {
  const supportMatrix = buildProjectSupportMatrix(stats, manifest);
  const activeEntry = supportMatrix.items.find((item) => item.status === 'active');
  if (activeEntry) {
    const score = activeEntry.supportLevel === 'supported'
      ? 10
      : activeEntry.supportLevel === 'read-only'
        ? 6
        : 5;

    return createEnterpriseDimension(
      'support-matrix',
      'Support matrix',
      score,
      `${activeEntry.label} · ${formatSupportLevel(activeEntry.supportLevel)} · ${formatSupportStatus(activeEntry.status)}`,
    );
  }

  const hasSupportedMode = supportMatrix.items.some((item) => item.supportLevel === 'supported' && item.status !== 'unavailable');
  return createEnterpriseDimension(
    'support-matrix',
    'Support matrix',
    hasSupportedMode ? 6 : 5,
    hasSupportedMode ? 'modo soportado disponible pero no activo' : 'sin modo soportado activo',
  );
}

export function buildEnterpriseHealthScorecard(
  stats?: RuntimeStatusStats,
  manifest?: ApiSemanticWorkspaceManifest,
): EnterpriseHealthScorecard {
  const dimensions: EnterpriseHealthDimensionScore[] = [
    scoreReadiness(stats, manifest),
    scoreDiagnostics(stats, manifest),
    scoreBuild(stats),
    scoreOrca(stats),
    scoreCache(stats),
    scoreSourceOrigin(stats, manifest),
    scorePerformance(stats),
    scoreSupportMatrix(stats, manifest),
  ];
  const total = dimensions.reduce((accumulator, dimension) => accumulator + dimension.score, 0);
  const max = dimensions.reduce((accumulator, dimension) => accumulator + dimension.weight, 0);
  const status: EnterpriseHealthStatus = total >= 85
    ? 'healthy'
    : total >= 65
      ? 'warning'
      : 'critical';

  return {
    schemaVersion: '1.0.0',
    total,
    max,
    status,
    summary: summarizeWeakDimensions(dimensions),
    dimensions,
  };
}

export function buildProjectHealthDashboardMarkdown(
  progress: ProgressNotification,
  stats?: RuntimeStatusStats,
  manifest?: ApiSemanticWorkspaceManifest,
  generatedAt = new Date().toISOString(),
): string {
  const dashboardTimestamp = manifest
    ? new Date(manifest.generatedAt).toISOString()
    : generatedAt;
  const diagnostics = manifest?.diagnosticsSummary ?? stats?.diagnostics;
  const enterpriseHealth = buildEnterpriseHealthScorecard(stats, manifest);
  const lines: string[] = [
    '# PowerSyntax Project Health Dashboard',
    '',
    `Generado: ${dashboardTimestamp}`,
    '',
    '## Resumen',
  ];

  pushBullet(lines, 'Estado visible', formatStatusBarSummary(progress, stats));
  pushBullet(lines, 'Proyecto activo', formatActiveProject(stats));
  pushBullet(lines, 'Enterprise health score', `${enterpriseHealth.total}/${enterpriseHealth.max} · ${formatEnterpriseStatus(enterpriseHealth.status)} · ${enterpriseHealth.summary}`);
  pushBullet(lines, 'Salud runtime', stats?.health ? `${stats.health.status} · ${stats.health.summary}` : undefined);
  pushBullet(lines, 'Build moderno', stats?.buildHealth ? `${stats.buildHealth.state} · ${stats.buildHealth.summary}` : undefined);
  pushBullet(lines, 'Workspace semántico', formatManifestSummary(manifest));
  pushBullet(lines, 'Diagnósticos', formatDiagnosticsTotals(diagnostics));
  pushBullet(lines, 'ORCA legacy', formatOrcaLegacy(stats));

  lines.push('');
  lines.push('## Enterprise health score');
  pushBullet(lines, 'Estado', formatEnterpriseStatus(enterpriseHealth.status));
  pushBullet(lines, 'Score total', `${enterpriseHealth.total}/${enterpriseHealth.max}`);
  pushBullet(lines, 'Resumen', enterpriseHealth.summary);
  lines.push('| Dimensión | Estado | Score | Resumen |');
  lines.push('| --- | --- | --- | --- |');
  for (const dimension of enterpriseHealth.dimensions) {
    lines.push(`| ${escapeTableCell(dimension.label)} | ${escapeTableCell(formatEnterpriseStatus(dimension.status))} | ${escapeTableCell(`${dimension.score}/${dimension.weight}`)} | ${escapeTableCell(dimension.summary)} |`);
  }

  if (manifest) {
    lines.push('');
    lines.push('## Workspace semántico');
    pushBullet(lines, 'Readiness', [manifest.readiness.state, manifest.readiness.detail].filter((part): part is string => Boolean(part)).join(' · '));
    pushBullet(lines, 'Projects', manifest.projects.map((project) => `${project.name} (${project.kind}, ${project.fileCount} archivos)`).join(' · '));
    pushBullet(lines, 'Inheritance', `${manifest.inheritanceSummary.totalTypes} tipos · ${manifest.inheritanceSummary.roots} raíces`);
    pushBullet(lines, 'Source origins', formatSourceOriginSummary(manifest.sourceOriginSummary));
  }

  const supportMatrix = buildProjectSupportMatrix(stats, manifest);
  lines.push('');
  lines.push('## Matriz de soporte');
  pushBullet(lines, 'Modo actual', supportMatrix.currentMode);
  lines.push('| Superficie | Soporte | Estado actual | Detalle | Límites |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const entry of supportMatrix.items) {
    lines.push(`| ${escapeTableCell(entry.label)} | ${escapeTableCell(formatSupportLevel(entry.supportLevel))} | ${escapeTableCell(formatSupportStatus(entry.status))} | ${escapeTableCell(entry.detail)} | ${escapeTableCell(entry.limitations)} |`);
  }

  lines.push('');
  lines.push('## Runtime');
  pushBullet(lines, 'Workspace', [stats?.workspace?.mode, typeof stats?.workspace?.files === 'number' ? `${stats.workspace.files} archivos` : undefined].filter((part): part is string => Boolean(part)).join(' · '));
  pushBullet(lines, 'Readiness', [stats?.readiness?.state, stats?.readiness?.detail].filter((part): part is string => Boolean(part)).join(' · '));
  pushBullet(lines, 'Indexer', [stats?.indexer?.phase, typeof stats?.indexer?.current === 'number' && typeof stats?.indexer?.total === 'number' ? `${stats.indexer.current}/${stats.indexer.total}` : undefined, stats?.indexer?.degraded ? 'degraded' : undefined].filter((part): part is string => Boolean(part)).join(' · '));
  pushBullet(lines, 'Project model', [typeof stats?.projectModel?.projects === 'number' ? `${stats.projectModel.projects} proyectos` : undefined, typeof stats?.projectModel?.libraries === 'number' ? `${stats.projectModel.libraries} librerías` : undefined, typeof stats?.projectModel?.orphanFiles === 'number' ? `${stats.projectModel.orphanFiles} huérfanos` : undefined].filter((part): part is string => Boolean(part)).join(' · '));
  pushBullet(lines, 'Cachés', [stats?.caches?.analysis ? `analysis ${stats.caches.analysis.size ?? 0}/${stats.caches.analysis.capacity ?? 0}` : undefined, stats?.caches?.serving ? `serving ${stats.caches.serving.size ?? 0}/${stats.caches.serving.capacity ?? 0}` : undefined, stats?.caches?.documents ? `documents ${stats.caches.documents.size ?? 0}` : undefined, stats?.caches?.hotContext ? `hot ${stats.caches.hotContext.inheritedTypes ?? 0}/${stats.caches.hotContext.capacity ?? 0}` : undefined].filter((part): part is string => Boolean(part)).join(' · '));
  pushBullet(lines, 'Persistencia', [stats?.persistence?.workspaceKey ? 'warm resume configurado' : undefined, stats?.persistence?.checkpointUri ? 'checkpoint listo' : undefined, stats?.persistence?.journalUri ? 'journal listo' : undefined, stats?.persistence?.restoreState].filter((part): part is string => Boolean(part)).join(' · '));
  pushBullet(lines, 'Memoria', stats?.memory ? `${stats.memory.status} · ${Math.round((stats.memory.totalEstimatedBytes / Math.max(1, stats.memory.totalBudgetBytes)) * 100)}% del budget` : undefined);

  lines.push('');
  lines.push('## Diagnósticos');
  if (diagnostics) {
    pushBullet(lines, 'Totales', formatDiagnosticsTotals(diagnostics));
    const topCodes = topCountEntries(diagnostics.byCode);
    if (topCodes.length > 0) {
      lines.push('- Top códigos:');
      for (const entry of topCodes) {
        lines.push(`  - ${entry}`);
      }
    }
  } else {
    lines.push('- Sin snapshot diagnóstico disponible.');
  }

  lines.push('');
  lines.push('## Build');
  pushBullet(lines, 'Tooling', stats?.buildTooling ? `${stats.buildTooling.status} · ${stats.buildTooling.detail}` : 'sin datos');
  pushBullet(lines, 'Build files', formatBuildFiles(stats));
  pushBullet(lines, 'Estado', stats?.buildHealth ? `${stats.buildHealth.state} · ${stats.buildHealth.summary}` : undefined);
  pushBullet(lines, 'Runner', stats?.buildRunner ? `${stats.buildRunner.state}${stats.buildRunner.buildFileUri ? ` · ${stats.buildRunner.buildFileUri}` : ''}` : undefined);
  pushBullet(lines, 'ORCA capability', stats?.orcaTooling ? `${stats.orcaTooling.status} · ${stats.orcaTooling.detail}` : 'sin datos');
  pushBullet(lines, 'ORCA packaging', formatOrcaPackagingPolicyInline(stats?.orcaTooling));
  pushBullet(lines, 'ORCA runner', stats?.orcaRunner ? `${stats.orcaRunner.state}${stats.orcaRunner.scriptUri ? ` · ${stats.orcaRunner.scriptUri}` : ''}` : undefined);

  const runtimeFindings = formatFindingList(stats?.health?.findings, 6);
  if (runtimeFindings.length > 0) {
    lines.push('');
    lines.push('## Findings runtime');
    lines.push(...runtimeFindings);
  }

  const buildFindings = formatFindingList(stats?.buildHealth?.findings, 6);
  if (buildFindings.length > 0) {
    lines.push('');
    lines.push('## Findings build');
    lines.push(...buildFindings);
  }

  if (stats) {
    lines.push('');
    lines.push('## Reporte de salud del runtime');
    lines.push('```text');
    lines.push(buildStatusHealthReport(progress, stats));
    lines.push('```');
    lines.push('');
    lines.push('## Reporte técnico del runtime');
    lines.push('```text');
    lines.push(buildStatusStatsReport(stats));
    lines.push('```');
  }

  return lines.join('\n');
}