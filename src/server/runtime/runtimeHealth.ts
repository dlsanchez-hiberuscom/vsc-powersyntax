import type { ApiRuntimeHealthFinding, ApiRuntimeHealthReport, ApiServerStats } from '../../shared/publicApi';

const CAPACITY_WARNING_RATIO = 0.85;
const SERVING_MISS_WARNING_RATIO = 0.6;
const SERVING_MISS_MIN_LOOKUPS = 10;

function pushFinding(
  findings: ApiRuntimeHealthFinding[],
  checkedLayers: Set<string>,
  finding: ApiRuntimeHealthFinding
): void {
  checkedLayers.add(finding.layer);
  findings.push(finding);
}

function checkCapacityBudget(
  findings: ApiRuntimeHealthFinding[],
  checkedLayers: Set<string>,
  layer: string,
  codePrefix: string,
  size: number | undefined,
  capacity: number | undefined,
  label: string
): void {
  if (typeof size !== 'number' || typeof capacity !== 'number' || capacity <= 0) {
    return;
  }

  const ratio = size / capacity;
  if (ratio >= 1) {
    pushFinding(findings, checkedLayers, {
      code: `${codePrefix}-capacity-exceeded`,
      layer,
      severity: 'error',
      message: `${label} superó su budget (${size}/${capacity})`,
    });
    return;
  }

  if (ratio >= CAPACITY_WARNING_RATIO) {
    pushFinding(findings, checkedLayers, {
      code: `${codePrefix}-capacity-near-limit`,
      layer,
      severity: 'warning',
      message: `${label} cerca del budget (${size}/${capacity})`,
    });
  }
}

export function buildRuntimeHealthReport(
  stats: ApiServerStats & { diagnostics?: ApiServerStats['diagnostics'] | null }
): ApiRuntimeHealthReport {
  const findings: ApiRuntimeHealthFinding[] = [];
  const checkedLayers = new Set<string>();

  if (stats.readiness?.state === 'degraded') {
    pushFinding(findings, checkedLayers, {
      code: 'runtime-degraded',
      layer: 'readiness',
      severity: 'error',
      message: 'runtime degradado',
      ...(stats.readiness.detail ? { detail: stats.readiness.detail } : {}),
    });
  }

  if (stats.indexer?.degraded) {
    pushFinding(findings, checkedLayers, {
      code: 'indexer-degraded',
      layer: 'indexer',
      severity: 'warning',
      message: 'indexador degradado',
      ...(stats.indexer.phase ? { detail: stats.indexer.phase } : {}),
    });
  }

  if (typeof stats.scheduler?.pendingNear === 'number' && stats.scheduler.pendingNear > 0) {
    pushFinding(findings, checkedLayers, {
      code: 'scheduler-near-backlog',
      layer: 'scheduler',
      severity: 'info',
      message: `cola near ${stats.scheduler.pendingNear}`,
    });
  }

  if (typeof stats.scheduler?.pendingBackground === 'number' && stats.scheduler.pendingBackground > 0) {
    pushFinding(findings, checkedLayers, {
      code: 'scheduler-background-backlog',
      layer: 'scheduler',
      severity: 'info',
      message: `cola background ${stats.scheduler.pendingBackground}`,
    });
  }

  if (typeof stats.projectModel?.orphanFiles === 'number' && stats.projectModel.orphanFiles > 0) {
    pushFinding(findings, checkedLayers, {
      code: 'project-model-orphans',
      layer: 'project-model',
      severity: 'warning',
      message: `${stats.projectModel.orphanFiles} huérfanos`,
    });
  }

  if (stats.persistence?.restoreState === 'rebuilt') {
    pushFinding(findings, checkedLayers, {
      code: 'persistence-rebuilt',
      layer: 'persistence',
      severity: 'warning',
      message: 'warm resume reconstruido',
      ...(stats.persistence.restoreReason ? { detail: stats.persistence.restoreReason } : {}),
    });
  }

  if (stats.persistence?.workspaceKey && !stats.persistence.checkpointUri) {
    pushFinding(findings, checkedLayers, {
      code: 'persistence-missing-checkpoint',
      layer: 'persistence',
      severity: 'warning',
      message: 'persistencia sin checkpoint listo',
    });
  }

  checkCapacityBudget(
    findings,
    checkedLayers,
    'analysis-cache',
    'analysis-cache',
    stats.caches?.analysis?.size,
    stats.caches?.analysis?.capacity,
    'analysis cache'
  );
  checkCapacityBudget(
    findings,
    checkedLayers,
    'serving-cache',
    'serving-cache',
    stats.caches?.serving?.size,
    stats.caches?.serving?.capacity,
    'serving cache'
  );
  checkCapacityBudget(
    findings,
    checkedLayers,
    'hot-context',
    'hot-context',
    stats.caches?.hotContext?.inheritedTypes,
    stats.caches?.hotContext?.capacity,
    'hot context cache'
  );

  const servingHits = stats.caches?.serving?.hits ?? 0;
  const servingMisses = stats.caches?.serving?.misses ?? 0;
  const totalServingLookups = servingHits + servingMisses;
  if (totalServingLookups >= SERVING_MISS_MIN_LOOKUPS && totalServingLookups > 0) {
    const missRatio = servingMisses / totalServingLookups;
    if (missRatio >= SERVING_MISS_WARNING_RATIO) {
      pushFinding(findings, checkedLayers, {
        code: 'serving-cache-low-hit-ratio',
        layer: 'serving-cache',
        severity: 'warning',
        message: `serving cache con hit ratio bajo (${servingHits}/${servingMisses})`,
      });
    }
  }

  if (stats.lastQueryTrace?.confidence === 'low') {
    pushFinding(findings, checkedLayers, {
      code: 'query-low-confidence',
      layer: 'queries',
      severity: 'warning',
      message: `último query con confidence low (${stats.lastQueryTrace.label ?? 'unknown'})`,
    });
  }

  if (stats.lastQueryTrace?.hasAmbiguity) {
    pushFinding(findings, checkedLayers, {
      code: 'query-ambiguity',
      layer: 'queries',
      severity: 'warning',
      message: `último query ambiguo (${stats.lastQueryTrace.label ?? 'unknown'})`,
    });
  }

  const counts = findings.reduce(
    (acc, finding) => {
      acc[finding.severity]++;
      return acc;
    },
    { info: 0, warning: 0, error: 0 }
  );

  const status = counts.error > 0
    ? 'error'
    : counts.warning > 0
      ? 'warning'
      : 'healthy';

  return {
    status,
    summary: findings.length > 0
      ? findings.map((finding) => finding.message).join(' · ')
      : 'sin degradación visible en stats',
    findings,
    counts,
    checkedLayers: [...checkedLayers],
  };
}