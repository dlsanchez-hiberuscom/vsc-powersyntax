export type PerformanceEventFeature =
  | 'hover'
  | 'completion'
  | 'completion-resolve'
  | 'signatureHelp'
  | 'definition'
  | 'references'
  | 'documentSymbols'
  | 'semanticTokens'
  | 'objectExplorer'
  | 'semanticWorkspaceManifest'
  | 'scheduler'
  | 'worker-pool'
  | 'event-loop'
  | 'memory'
  | 'workspace-indexer'
  | 'performance-gate';

export type PerformanceEventLane = 'interactive' | 'near' | 'background' | 'maintenance' | 'reporting' | 'runtime';

export type PerformanceEventOutcome = 'success' | 'blocked' | 'degraded' | 'cancelled' | 'error';

export type PerformanceEventCacheOutcome = 'hit' | 'miss' | 'viewmodel-hit' | 'negative-hit' | 'stale-hit';

export interface PerformanceEvent {
  feature: PerformanceEventFeature;
  lane: PerformanceEventLane;
  outcome: PerformanceEventOutcome;
  ts?: number;
  traceId?: string;
  uri?: string;
  documentVersion?: number;
  documentFingerprint?: number | string;
  locale?: string;
  workspaceId?: string;
  projectId?: string;
  semanticEpoch?: number;
  kbVersion?: number;
  durationMs?: number;
  waitMs?: number;
  runMs?: number;
  providerMs?: number;
  formatterMs?: number;
  cacheWriteMs?: number;
  cacheOutcome?: PerformanceEventCacheOutcome;
  fallbackKind?: string;
  cancelled?: boolean;
  errorKind?: string;
  payloadBytes?: number;
  resultSize?: number;
  budgetMs?: number;
  payloadBudgetBytes?: number;
  payloadBudgetExceeded?: boolean;
  degradedReason?: string;
  staleReason?: string;
}

export interface RuntimeMetricsDistributionSnapshot {
  samples: number;
  avg: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface RuntimeMetricsSnapshot {
  totalRecorded: number;
  dropped: number;
  recentEvents: PerformanceEvent[];
  durationMs?: RuntimeMetricsDistributionSnapshot;
  payloadBytes?: RuntimeMetricsDistributionSnapshot;
  resultSize?: RuntimeMetricsDistributionSnapshot;
}

export interface PerformanceEventRecorder {
  record(event: PerformanceEvent): void;
  snapshot(limit?: number): RuntimeMetricsSnapshot;
}

const DEFAULT_RECENT_EVENT_CAPACITY = 64;

function percentile(values: readonly number[], percentileRank: number): number {
  const index = Math.min(
    values.length - 1,
    Math.max(0, Math.ceil((percentileRank / 100) * values.length) - 1),
  );
  return values[index];
}

function toDistributionSnapshot(values: readonly number[]): RuntimeMetricsDistributionSnapshot | undefined {
  if (values.length === 0) {
    return undefined;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const sum = sorted.reduce((total, value) => total + value, 0);
  return {
    samples: sorted.length,
    avg: sum / sorted.length,
    max: sorted[sorted.length - 1],
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
  };
}

function cloneDistributionSnapshot(
  snapshot: RuntimeMetricsDistributionSnapshot | undefined,
): RuntimeMetricsDistributionSnapshot | undefined {
  return snapshot
    ? {
      samples: snapshot.samples,
      avg: snapshot.avg,
      max: snapshot.max,
      p50: snapshot.p50,
      p95: snapshot.p95,
      p99: snapshot.p99,
    }
    : undefined;
}

function clonePerformanceEvent(event: PerformanceEvent): PerformanceEvent {
  return {
    feature: event.feature,
    lane: event.lane,
    outcome: event.outcome,
    ...(event.ts !== undefined ? { ts: event.ts } : {}),
    ...(event.traceId ? { traceId: event.traceId } : {}),
    ...(event.uri ? { uri: event.uri } : {}),
    ...(event.documentVersion !== undefined ? { documentVersion: event.documentVersion } : {}),
    ...(event.documentFingerprint !== undefined ? { documentFingerprint: event.documentFingerprint } : {}),
    ...(event.locale ? { locale: event.locale } : {}),
    ...(event.workspaceId ? { workspaceId: event.workspaceId } : {}),
    ...(event.projectId ? { projectId: event.projectId } : {}),
    ...(event.semanticEpoch !== undefined ? { semanticEpoch: event.semanticEpoch } : {}),
    ...(event.kbVersion !== undefined ? { kbVersion: event.kbVersion } : {}),
    ...(event.durationMs !== undefined ? { durationMs: event.durationMs } : {}),
    ...(event.waitMs !== undefined ? { waitMs: event.waitMs } : {}),
    ...(event.runMs !== undefined ? { runMs: event.runMs } : {}),
    ...(event.providerMs !== undefined ? { providerMs: event.providerMs } : {}),
    ...(event.formatterMs !== undefined ? { formatterMs: event.formatterMs } : {}),
    ...(event.cacheWriteMs !== undefined ? { cacheWriteMs: event.cacheWriteMs } : {}),
    ...(event.cacheOutcome ? { cacheOutcome: event.cacheOutcome } : {}),
    ...(event.fallbackKind ? { fallbackKind: event.fallbackKind } : {}),
    ...(event.cancelled !== undefined ? { cancelled: event.cancelled } : {}),
    ...(event.errorKind ? { errorKind: event.errorKind } : {}),
    ...(event.payloadBytes !== undefined ? { payloadBytes: event.payloadBytes } : {}),
    ...(event.resultSize !== undefined ? { resultSize: event.resultSize } : {}),
    ...(event.budgetMs !== undefined ? { budgetMs: event.budgetMs } : {}),
    ...(event.payloadBudgetBytes !== undefined ? { payloadBudgetBytes: event.payloadBudgetBytes } : {}),
    ...(event.payloadBudgetExceeded !== undefined ? { payloadBudgetExceeded: event.payloadBudgetExceeded } : {}),
    ...(event.degradedReason ? { degradedReason: event.degradedReason } : {}),
    ...(event.staleReason ? { staleReason: event.staleReason } : {}),
  };
}

export class RuntimeMetricsRegistry implements PerformanceEventRecorder {
  private readonly recentEvents: PerformanceEvent[] = [];
  private totalRecorded = 0;
  private dropped = 0;

  constructor(private readonly maxRecentEvents = DEFAULT_RECENT_EVENT_CAPACITY) {}

  record(event: PerformanceEvent): void {
    const normalized: PerformanceEvent = {
      ...event,
      ts: event.ts ?? Date.now(),
      ...(typeof event.durationMs === 'number' && Number.isFinite(event.durationMs)
        ? { durationMs: event.durationMs }
        : {}),
      ...(typeof event.waitMs === 'number' && Number.isFinite(event.waitMs)
        ? { waitMs: event.waitMs }
        : {}),
      ...(typeof event.runMs === 'number' && Number.isFinite(event.runMs)
        ? { runMs: event.runMs }
        : {}),
      ...(typeof event.providerMs === 'number' && Number.isFinite(event.providerMs)
        ? { providerMs: event.providerMs }
        : {}),
      ...(typeof event.formatterMs === 'number' && Number.isFinite(event.formatterMs)
        ? { formatterMs: event.formatterMs }
        : {}),
      ...(typeof event.cacheWriteMs === 'number' && Number.isFinite(event.cacheWriteMs)
        ? { cacheWriteMs: event.cacheWriteMs }
        : {}),
    };

    this.totalRecorded++;
    if (this.recentEvents.length >= this.maxRecentEvents) {
      this.recentEvents.shift();
      this.dropped++;
    }
    this.recentEvents.push(clonePerformanceEvent(normalized));
  }

  snapshot(limit = this.maxRecentEvents): RuntimeMetricsSnapshot {
    const recentEvents = this.recentEvents.slice(-Math.max(0, limit)).map(clonePerformanceEvent);
    const durationMs = toDistributionSnapshot(
      recentEvents
        .map((event) => event.durationMs)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
    );
    const payloadBytes = toDistributionSnapshot(
      recentEvents
        .map((event) => event.payloadBytes)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
    );
    const resultSize = toDistributionSnapshot(
      recentEvents
        .map((event) => event.resultSize)
        .filter((value): value is number => typeof value === 'number' && Number.isFinite(value)),
    );

    return {
      totalRecorded: this.totalRecorded,
      dropped: this.dropped,
      recentEvents,
      ...(durationMs ? { durationMs: cloneDistributionSnapshot(durationMs) } : {}),
      ...(payloadBytes ? { payloadBytes: cloneDistributionSnapshot(payloadBytes) } : {}),
      ...(resultSize ? { resultSize: cloneDistributionSnapshot(resultSize) } : {}),
    };
  }
}