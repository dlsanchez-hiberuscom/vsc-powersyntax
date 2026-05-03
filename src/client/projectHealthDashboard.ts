import type {
  ApiDiagnosticsSnapshot,
  ApiSemanticWorkspaceManifest,
} from '../shared/publicApi';
import type { ProgressNotification } from '../shared/types';
import {
  buildStatusHealthReport,
  buildStatusStatsReport,
  formatStatusBarSummary,
  type RuntimeStatusStats,
} from './statusBarPresentation';
import { formatOrcaPackagingPolicyInline, formatOrcaStatusInline } from './build/orcaDetection';

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
  const lines: string[] = [
    '# PowerSyntax Project Health Dashboard',
    '',
    `Generado: ${dashboardTimestamp}`,
    '',
    '## Resumen',
  ];

  pushBullet(lines, 'Estado visible', formatStatusBarSummary(progress, stats));
  pushBullet(lines, 'Proyecto activo', formatActiveProject(stats));
  pushBullet(lines, 'Salud runtime', stats?.health ? `${stats.health.status} · ${stats.health.summary}` : undefined);
  pushBullet(lines, 'Build moderno', stats?.buildHealth ? `${stats.buildHealth.state} · ${stats.buildHealth.summary}` : undefined);
  pushBullet(lines, 'Workspace semántico', formatManifestSummary(manifest));
  pushBullet(lines, 'Diagnósticos', formatDiagnosticsTotals(diagnostics));
  pushBullet(lines, 'ORCA legacy', formatOrcaLegacy(stats));

  if (manifest) {
    lines.push('');
    lines.push('## Workspace semántico');
    pushBullet(lines, 'Readiness', [manifest.readiness.state, manifest.readiness.detail].filter((part): part is string => Boolean(part)).join(' · '));
    pushBullet(lines, 'Projects', manifest.projects.map((project) => `${project.name} (${project.kind}, ${project.fileCount} archivos)`).join(' · '));
    pushBullet(lines, 'Inheritance', `${manifest.inheritanceSummary.totalTypes} tipos · ${manifest.inheritanceSummary.roots} raíces`);
    pushBullet(lines, 'Source origins', formatSourceOriginSummary(manifest.sourceOriginSummary));
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