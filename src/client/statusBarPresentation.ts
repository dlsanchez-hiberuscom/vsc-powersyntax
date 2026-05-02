import type { ApiServerStats } from '../shared/publicApi';
import type { ProgressNotification, ProgressPass } from '../shared/types';

export interface RuntimeStatusProjectSnapshot {
  readiness?: string;
  projectName?: string;
  totalFiles?: number;
  indexedFiles?: number;
  pass?: ProgressPass;
  skippedFiles?: number;
  failedFiles?: number;
}

export interface RuntimeStatusActiveProject {
  projectUri?: string;
  kind?: string;
  name?: string;
  libraries?: string[];
  files?: string[];
}

export interface RuntimeStatusStats extends ApiServerStats {
  workspace?: {
    mode?: string;
    files?: number;
    activeProject?: RuntimeStatusActiveProject;
  };
  projectStatus?: {
    summary?: string;
    snapshot?: RuntimeStatusProjectSnapshot;
  };
}

function formatProgressFallback(progress: ProgressNotification): string {
  switch (progress.phase) {
    case 'discovering':
      return 'descubriendo workspace';
    case 'indexing': {
      const passLabel = progress.pass === 'structural'
        ? 'estructural'
        : progress.pass === 'enriched'
          ? 'semántico'
          : 'indexando';
      return typeof progress.total === 'number' && progress.total > 0
        ? `${passLabel} ${progress.current ?? 0}/${progress.total}`
        : passLabel;
    }
    case 'degraded':
      return 'degradado';
    case 'partial':
      return 'parcial';
    case 'ready':
      return 'listo';
    case 'idle':
      return 'en espera';
  }
}

function formatProjectSummary(stats?: RuntimeStatusStats): string | undefined {
  const summary = stats?.projectStatus?.summary?.trim();
  if (summary) {
    return summary;
  }

  const project = stats?.workspace?.activeProject;
  if (project?.name) {
    return `${project.name} — ${stats?.readiness?.state === 'ready' ? 'listo' : 'en espera'}`;
  }

  const mode = stats?.workspace?.mode;
  const files = stats?.workspace?.files;
  if (mode || typeof files === 'number') {
    const modeLabel = mode ?? 'workspace';
    return typeof files === 'number'
      ? `${modeLabel} — ${files} archivos`
      : `${modeLabel} — en espera`;
  }

  return undefined;
}

function formatPersistenceState(stats?: RuntimeStatusStats): string | undefined {
  const state = stats?.persistence?.restoreState;
  if (!state) {
    return undefined;
  }

  if (state === 'restored') {
    return typeof stats?.persistence?.restoredDocuments === 'number'
      ? `restored ${stats.persistence.restoredDocuments} docs`
      : 'restored';
  }

  if (state === 'rebuilt') {
    return stats?.persistence?.restoreReason
      ? `rebuilt (${stats.persistence.restoreReason})`
      : 'rebuilt';
  }

  return 'reused';
}

function formatServingSnapshotState(stats?: RuntimeStatusStats): string | undefined {
  const restoredEntries = stats?.persistence?.servingSnapshot?.lastRestoredEntries;
  if (typeof restoredEntries !== 'number' || restoredEntries <= 0) {
    return undefined;
  }

  return `serving ${restoredEntries} entries`;
}

function formatCountPair(size?: number, capacity?: number): string | undefined {
  if (typeof size !== 'number') {
    return undefined;
  }
  return typeof capacity === 'number' ? `${size}/${capacity}` : `${size}`;
}

function formatServingCacheStats(stats?: RuntimeStatusStats): string | undefined {
  const serving = stats?.caches?.serving;
  if (!serving) {
    return undefined;
  }

  const parts: string[] = [];
  const sizeLabel = formatCountPair(serving.size, serving.capacity);
  if (sizeLabel) {
    parts.push(`serving ${sizeLabel}`);
  }

  const hits = serving.hits ?? 0;
  const misses = serving.misses ?? 0;
  const totalLookups = hits + misses;
  if (totalLookups > 0) {
    parts.push(`hit ${Math.round((hits / totalLookups) * 100)}% (${hits}/${misses})`);
  }

  if (typeof serving.evictions === 'number' && serving.evictions > 0) {
    parts.push(`evict ${serving.evictions}`);
  }

  return parts.length > 0 ? parts.join(' · ') : undefined;
}

function pushIfPresent(lines: string[], label: string, value?: string): void {
  if (!value) {
    return;
  }
  lines.push(`- ${label}: ${value}`);
}

function formatHealthCounts(stats?: RuntimeStatusStats): string | undefined {
  const counts = stats?.health?.counts;
  if (!counts) {
    return undefined;
  }

  return `${counts.warning} warning · ${counts.error} error · ${counts.info} info`;
}

function formatRuntimeJournal(stats?: RuntimeStatusStats): string | undefined {
  const journal = stats?.runtimeJournal;
  if (!journal || journal.events.length === 0) {
    return undefined;
  }

  const lastEvent = journal.events[journal.events.length - 1];
  return `${journal.events.length}/${journal.total} eventos · ${lastEvent.phase}/${lastEvent.action}`;
}

export function formatStatusBarSummary(
  progress: ProgressNotification,
  stats?: RuntimeStatusStats
): string {
  return formatProjectSummary(stats) ?? progress.message?.trim() ?? formatProgressFallback(progress);
}

export function buildStatusTooltipMarkdown(
  progress: ProgressNotification,
  stats?: RuntimeStatusStats
): string {
  const lines: string[] = ['**VSC PowerSyntax**', ''];
  pushIfPresent(lines, 'Estado', formatStatusBarSummary(progress, stats));

  const activeProject = stats?.workspace?.activeProject;
  if (activeProject?.name) {
    const fileCount = activeProject.files?.length;
    const libraryCount = activeProject.libraries?.length;
    const details = [activeProject.kind, typeof fileCount === 'number' ? `${fileCount} archivos` : undefined, typeof libraryCount === 'number' ? `${libraryCount} librerías` : undefined]
      .filter((part): part is string => Boolean(part));
    pushIfPresent(lines, 'Proyecto activo', `${activeProject.name}${details.length > 0 ? ` · ${details.join(' · ')}` : ''}`);
  }

  const workspaceParts = [stats?.workspace?.mode, typeof stats?.workspace?.files === 'number' ? `${stats.workspace.files} archivos` : undefined]
    .filter((part): part is string => Boolean(part));
  pushIfPresent(lines, 'Workspace', workspaceParts.join(' · '));

  const modelParts = [
    typeof stats?.projectModel?.projects === 'number' ? `${stats.projectModel.projects} proyectos` : undefined,
    typeof stats?.projectModel?.libraries === 'number' ? `${stats.projectModel.libraries} librerías` : undefined,
    typeof stats?.projectModel?.orphanFiles === 'number' ? `${stats.projectModel.orphanFiles} huérfanos` : undefined,
  ].filter((part): part is string => Boolean(part));
  pushIfPresent(lines, 'Project model', modelParts.join(' · '));

  const cacheParts = [
    stats?.caches?.analysis ? `analysis ${formatCountPair(stats.caches.analysis.size, stats.caches.analysis.capacity)}` : undefined,
    formatServingCacheStats(stats),
    stats?.caches?.documents && typeof stats.caches.documents.size === 'number' ? `documents ${stats.caches.documents.size}` : undefined,
    stats?.caches?.hotContext ? `hot ${formatCountPair(stats.caches.hotContext.inheritedTypes, stats.caches.hotContext.capacity)}` : undefined,
  ].filter((part): part is string => Boolean(part));
  pushIfPresent(lines, 'Cachés', cacheParts.join(' · '));

  const persistenceParts = [
    stats?.persistence?.workspaceKey ? 'warm resume configurado' : undefined,
    stats?.persistence?.checkpointUri ? 'checkpoint listo' : undefined,
    stats?.persistence?.journalUri ? 'journal listo' : undefined,
    formatPersistenceState(stats),
    formatServingSnapshotState(stats),
  ].filter((part): part is string => Boolean(part));
  pushIfPresent(lines, 'Persistencia', persistenceParts.join(' · ') || 'sin snapshot persistente');

  const trace = stats?.lastQueryTrace;
  if (trace?.label) {
    const traceParts = [
      trace.label,
      trace.confidence,
      typeof trace.targetCount === 'number' ? `${trace.targetCount} targets` : undefined,
      trace.primaryReasonCode,
    ].filter((part): part is string => Boolean(part));
    pushIfPresent(lines, 'Último query', traceParts.join(' · '));
  }

  lines.push('');
  lines.push('[Stats](command:vscPowerSyntax.showStatusStats) | [Salud](command:vscPowerSyntax.showStatusHealth) | [Build](command:workbench.action.tasks.build) | [Jerarquía](command:vscPowerSyntax.inspectHierarchy) | [Reiniciar](command:vscPowerSyntax.restartServer)');

  return lines.join('\n');
}

export function buildStatusStatsReport(stats?: RuntimeStatusStats): string {
  if (!stats) {
    return 'No hay estadísticas disponibles del servidor.';
  }

  const lines: string[] = ['[PowerSyntax] Stats'];
  pushIfPresent(lines, 'Readiness', [stats.readiness?.state, stats.readiness?.detail].filter((part): part is string => Boolean(part)).join(' · '));
  pushIfPresent(lines, 'Resumen proyecto', stats.projectStatus?.summary);
  pushIfPresent(lines, 'Workspace', [stats.workspace?.mode, typeof stats.workspace?.files === 'number' ? `${stats.workspace.files} archivos` : undefined].filter((part): part is string => Boolean(part)).join(' · '));
  pushIfPresent(lines, 'Project model', [
    typeof stats.projectModel?.projects === 'number' ? `${stats.projectModel.projects} proyectos` : undefined,
    typeof stats.projectModel?.libraries === 'number' ? `${stats.projectModel.libraries} librerías` : undefined,
    typeof stats.projectModel?.orphanFiles === 'number' ? `${stats.projectModel.orphanFiles} huérfanos` : undefined,
  ].filter((part): part is string => Boolean(part)).join(' · '));
  pushIfPresent(lines, 'Scheduler', [
    typeof stats.scheduler?.pendingNear === 'number' ? `near ${stats.scheduler.pendingNear}` : undefined,
    typeof stats.scheduler?.pendingBackground === 'number' ? `background ${stats.scheduler.pendingBackground}` : undefined,
    typeof stats.scheduler?.interactiveBusy === 'boolean' ? `interactiveBusy ${stats.scheduler.interactiveBusy}` : undefined,
  ].filter((part): part is string => Boolean(part)).join(' · '));
  pushIfPresent(lines, 'Cachés', [
    stats.caches?.analysis ? `analysis ${formatCountPair(stats.caches.analysis.size, stats.caches.analysis.capacity)}` : undefined,
    formatServingCacheStats(stats),
    stats.caches?.documents && typeof stats.caches.documents.size === 'number' ? `documents ${stats.caches.documents.size}` : undefined,
    stats.caches?.hotContext ? `hot ${formatCountPair(stats.caches.hotContext.inheritedTypes, stats.caches.hotContext.capacity)}` : undefined,
  ].filter((part): part is string => Boolean(part)).join(' · '));
  pushIfPresent(lines, 'Persistencia', [
    stats.persistence?.workspaceKey,
    stats.persistence?.checkpointUri ? 'checkpoint' : undefined,
    stats.persistence?.journalUri ? 'journal' : undefined,
    formatPersistenceState(stats),
    formatServingSnapshotState(stats),
  ].filter((part): part is string => Boolean(part)).join(' · '));
  pushIfPresent(lines, 'Salud', stats.health ? [stats.health.status, formatHealthCounts(stats)].filter((part): part is string => Boolean(part)).join(' · ') : undefined);
  pushIfPresent(lines, 'Journal', formatRuntimeJournal(stats));
  return lines.join('\n');
}

export function buildStatusHealthReport(
  progress: ProgressNotification,
  stats?: RuntimeStatusStats
): string {
  if (!stats) {
    return 'No hay datos de salud del runtime disponibles.';
  }

  const lines: string[] = ['[PowerSyntax] Salud del runtime'];
  pushIfPresent(lines, 'Estado', formatStatusBarSummary(progress, stats));
  pushIfPresent(lines, 'Readiness', [stats.readiness?.state, stats.readiness?.detail].filter((part): part is string => Boolean(part)).join(' · '));
  pushIfPresent(lines, 'Indexer', [stats.indexer?.phase, typeof stats.indexer?.current === 'number' && typeof stats.indexer?.total === 'number' ? `${stats.indexer.current}/${stats.indexer.total}` : undefined].filter((part): part is string => Boolean(part)).join(' · '));
  pushIfPresent(lines, 'Resumen', stats.health?.summary ?? 'sin degradación visible en stats');
  pushIfPresent(lines, 'Checks', formatHealthCounts(stats));
  if (stats.health?.findings?.length) {
    for (const finding of stats.health.findings.slice(0, 5)) {
      lines.push(`- ${finding.severity.toUpperCase()} [${finding.layer}] ${finding.message}`);
    }
  }
  pushIfPresent(lines, 'Journal', formatRuntimeJournal(stats));
  pushIfPresent(lines, 'Persistencia', [formatPersistenceState(stats), formatServingSnapshotState(stats)].filter((part): part is string => Boolean(part)).join(' · '));
  pushIfPresent(lines, 'Último query', stats.lastQueryTrace?.label ? [stats.lastQueryTrace.label, stats.lastQueryTrace.confidence, stats.lastQueryTrace.primaryReasonCode].filter((part): part is string => Boolean(part)).join(' · ') : undefined);
  return lines.join('\n');
}