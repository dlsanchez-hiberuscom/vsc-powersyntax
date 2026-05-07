import type { ApiRuntimeMemoryReport } from '../../shared/publicApi';
import type { RuntimeWorkloadClass } from './backpressurePolicy';

export interface RuntimeMemoryAdaptiveReportLimits {
  semanticWorkspaceManifest: {
    maxObjects: number;
    maxSymbols: number;
  };
  crossProjectSymbolConflicts: {
    maxConflicts: number;
    maxCandidatesPerConflict: number;
  };
  workspaceMigrationAssistant: {
    maxRecommendations: number;
  };
  codeMetrics: {
    maxObjects: number;
  };
  technicalDebtReport: {
    maxObjects: number;
    maxHotspots: number;
    maxRecommendations: number;
  };
}

export interface RuntimeMemoryPressurePolicy {
  level: ApiRuntimeMemoryReport['status'];
  reason: string;
  triggerLayer?: ApiRuntimeMemoryReport['layers'][number]['layer'];
  purgeServingCache: boolean;
  allowServingCacheWrites: boolean;
  /** When true, the document cache should evict unpinned entries to reduce memory. */
  requestDocumentCacheEviction: boolean;
  deferredWorkloads: RuntimeWorkloadClass[];
  reportLimits?: RuntimeMemoryAdaptiveReportLimits;
}

const WARNING_LIMITS: RuntimeMemoryAdaptiveReportLimits = {
  semanticWorkspaceManifest: { maxObjects: 120, maxSymbols: 240 },
  crossProjectSymbolConflicts: { maxConflicts: 20, maxCandidatesPerConflict: 3 },
  workspaceMigrationAssistant: { maxRecommendations: 12 },
  codeMetrics: { maxObjects: 80 },
  technicalDebtReport: { maxObjects: 80, maxHotspots: 20, maxRecommendations: 12 },
};

const ERROR_LIMITS: RuntimeMemoryAdaptiveReportLimits = {
  semanticWorkspaceManifest: { maxObjects: 40, maxSymbols: 80 },
  crossProjectSymbolConflicts: { maxConflicts: 8, maxCandidatesPerConflict: 2 },
  workspaceMigrationAssistant: { maxRecommendations: 6 },
  codeMetrics: { maxObjects: 30 },
  technicalDebtReport: { maxObjects: 30, maxHotspots: 8, maxRecommendations: 6 },
};

const DEFERRED_WORKLOADS_ON_PRESSURE: RuntimeWorkloadClass[] = [
  'background-indexing',
  'maintenance',
  'ai-tooling',
];

/**
 * Warning level only defers heavy/optional workloads, NOT background-indexing.
 * This prevents the discovery deadlock (CACHE-P1-READINESS-DISCOVERY-DEADLOCK-01)
 * where deferring background-indexing prevents discovery from completing.
 */
const DEFERRED_WORKLOADS_ON_WARNING: RuntimeWorkloadClass[] = [
  'maintenance',
  'ai-tooling',
];

export function buildRuntimeMemoryPressurePolicy(report: ApiRuntimeMemoryReport): RuntimeMemoryPressurePolicy {
  const failingLayer = report.layers.find((layer) => layer.status === 'error');
  const warningLayer = report.layers.find((layer) => layer.status === 'warning');
  const triggerLayer = failingLayer?.layer ?? warningLayer?.layer;

  if (report.status === 'healthy') {
    return {
      level: 'healthy',
      reason: 'memory-healthy',
      purgeServingCache: false,
      allowServingCacheWrites: true,
      requestDocumentCacheEviction: false,
      deferredWorkloads: [],
    };
  }

  if (report.status === 'error') {
    return {
      level: 'error',
      reason: triggerLayer ? `memory-pressure:${triggerLayer}:error` : 'memory-pressure:error',
      ...(triggerLayer ? { triggerLayer } : {}),
      purgeServingCache: true,
      allowServingCacheWrites: false,
      requestDocumentCacheEviction: true,
      deferredWorkloads: [...DEFERRED_WORKLOADS_ON_PRESSURE],
      reportLimits: ERROR_LIMITS,
    };
  }

  // CACHE-P0-MEMORY-PRESSURE-GRADUATED-POLICY-01:
  // Warning level allows serving cache writes but requests document cache eviction.
  // This breaks the doom loop where document cache bloat permanently disabled serving cache.
  return {
    level: 'warning',
    reason: triggerLayer ? `memory-pressure:${triggerLayer}:warning` : 'memory-pressure:warning',
    ...(triggerLayer ? { triggerLayer } : {}),
    purgeServingCache: false,
    allowServingCacheWrites: true,
    requestDocumentCacheEviction: true,
    deferredWorkloads: [...DEFERRED_WORKLOADS_ON_WARNING],
    reportLimits: WARNING_LIMITS,
  };
}

export function isWorkloadDeferredByMemoryPressure(
  policy: RuntimeMemoryPressurePolicy,
  workload: RuntimeWorkloadClass,
): boolean {
  return policy.deferredWorkloads.includes(workload);
}

export function applyAdaptiveLimit(requested: unknown, cap: number, minValue = 0): number {
  const normalizedCap = Math.max(minValue, Math.trunc(cap));
  if (typeof requested !== 'number' || !Number.isFinite(requested)) {
    return normalizedCap;
  }

  return Math.min(normalizedCap, Math.max(minValue, Math.trunc(requested)));
}