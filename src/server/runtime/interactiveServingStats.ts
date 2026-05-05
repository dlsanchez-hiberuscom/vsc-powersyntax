export type InteractiveServingFeature =
  | 'hover'
  | 'completion'
  | 'completion-resolve'
  | 'signatureHelp'
  | 'definition'
  | 'references'
  | 'documentSymbols'
  | 'semanticTokens';

export type InteractiveServingReason =
  | 'cache-hit'
  | 'viewmodel-hit'
  | 'negative-hit'
  | 'miss'
  | 'blocked'
  | 'readiness-degraded'
  | 'stale-discarded'
  | 'unknown';

export interface InteractiveServingMetricEvent {
  feature: InteractiveServingFeature;
  reason: InteractiveServingReason;
  totalMs: number;
  providerMs?: number;
  formatterMs?: number;
  cacheWriteMs?: number;
  payloadBytes?: number;
  payloadBudgetBytes?: number;
  payloadBudgetExceeded?: boolean;
  locale?: string;
  kbVersion?: number;
  semanticEpoch?: number;
  budgetMs?: number;
  readinessAction?: string;
  readinessReason?: string;
  staleReason?: string;
  ts?: number;
}

export interface InteractiveServingFeatureStats {
  requests: number;
  reasons: Record<string, number>;
  totalMsAvg: number;
  providerMsAvg?: number;
  formatterMsAvg?: number;
  cacheWriteMsAvg?: number;
  payloadBytesAvg?: number;
  payloadBytesMax?: number;
  payloadBudgetExceeded?: number;
  lastEvent?: InteractiveServingMetricEvent;
}

export interface InteractiveServingStatsSnapshot {
  features: Partial<Record<InteractiveServingFeature, InteractiveServingFeatureStats>>;
  recentEvents: InteractiveServingMetricEvent[];
}

type MutableFeatureStats = {
  requests: number;
  reasons: Map<string, number>;
  totalMsSum: number;
  providerMsSum: number;
  providerSamples: number;
  formatterMsSum: number;
  formatterSamples: number;
  cacheWriteMsSum: number;
  cacheWriteSamples: number;
  payloadBytesSum: number;
  payloadSamples: number;
  payloadBytesMax: number;
  payloadBudgetExceeded: number;
  lastEvent?: InteractiveServingMetricEvent;
};

const DEFAULT_RECENT_EVENT_CAPACITY = 32;
const MAX_PAYLOAD_ESTIMATE_DEPTH = 3;
const MAX_PAYLOAD_ESTIMATE_NODES = 512;

function cloneMetricEvent(event: InteractiveServingMetricEvent): InteractiveServingMetricEvent {
  return {
    feature: event.feature,
    reason: event.reason,
    totalMs: event.totalMs,
    ...(event.providerMs !== undefined ? { providerMs: event.providerMs } : {}),
    ...(event.formatterMs !== undefined ? { formatterMs: event.formatterMs } : {}),
    ...(event.cacheWriteMs !== undefined ? { cacheWriteMs: event.cacheWriteMs } : {}),
    ...(event.payloadBytes !== undefined ? { payloadBytes: event.payloadBytes } : {}),
    ...(event.payloadBudgetBytes !== undefined ? { payloadBudgetBytes: event.payloadBudgetBytes } : {}),
    ...(event.payloadBudgetExceeded !== undefined ? { payloadBudgetExceeded: event.payloadBudgetExceeded } : {}),
    ...(event.locale ? { locale: event.locale } : {}),
    ...(event.kbVersion !== undefined ? { kbVersion: event.kbVersion } : {}),
    ...(event.semanticEpoch !== undefined ? { semanticEpoch: event.semanticEpoch } : {}),
    ...(event.budgetMs !== undefined ? { budgetMs: event.budgetMs } : {}),
    ...(event.readinessAction ? { readinessAction: event.readinessAction } : {}),
    ...(event.readinessReason ? { readinessReason: event.readinessReason } : {}),
    ...(event.staleReason ? { staleReason: event.staleReason } : {}),
    ts: event.ts,
  };
}

function toAverage(total: number, samples: number): number | undefined {
  if (samples <= 0) {
    return undefined;
  }

  return total / samples;
}

function createMutableFeatureStats(): MutableFeatureStats {
  return {
    requests: 0,
    reasons: new Map<string, number>(),
    totalMsSum: 0,
    providerMsSum: 0,
    providerSamples: 0,
    formatterMsSum: 0,
    formatterSamples: 0,
    cacheWriteMsSum: 0,
    cacheWriteSamples: 0,
    payloadBytesSum: 0,
    payloadSamples: 0,
    payloadBytesMax: 0,
    payloadBudgetExceeded: 0,
  };
}

export class InteractiveServingStatsTracker {
  private readonly featureStats = new Map<InteractiveServingFeature, MutableFeatureStats>();
  private readonly recentEvents: InteractiveServingMetricEvent[] = [];

  constructor(private readonly maxRecentEvents = DEFAULT_RECENT_EVENT_CAPACITY) {}

  record(event: InteractiveServingMetricEvent): void {
    const normalized: InteractiveServingMetricEvent = {
      ...event,
      totalMs: Number.isFinite(event.totalMs) ? event.totalMs : 0,
      ts: event.ts ?? Date.now(),
    };

    let stats = this.featureStats.get(normalized.feature);
    if (!stats) {
      stats = createMutableFeatureStats();
      this.featureStats.set(normalized.feature, stats);
    }

    stats.requests++;
    stats.totalMsSum += normalized.totalMs;
    stats.reasons.set(normalized.reason, (stats.reasons.get(normalized.reason) ?? 0) + 1);

    if (typeof normalized.providerMs === 'number') {
      stats.providerMsSum += normalized.providerMs;
      stats.providerSamples++;
    }

    if (typeof normalized.formatterMs === 'number') {
      stats.formatterMsSum += normalized.formatterMs;
      stats.formatterSamples++;
    }

    if (typeof normalized.cacheWriteMs === 'number') {
      stats.cacheWriteMsSum += normalized.cacheWriteMs;
      stats.cacheWriteSamples++;
    }

    if (typeof normalized.payloadBytes === 'number') {
      stats.payloadBytesSum += normalized.payloadBytes;
      stats.payloadSamples++;
      stats.payloadBytesMax = Math.max(stats.payloadBytesMax, normalized.payloadBytes);
    }

    if (normalized.payloadBudgetExceeded) {
      stats.payloadBudgetExceeded++;
    }

    stats.lastEvent = cloneMetricEvent(normalized);
    this.recentEvents.push(cloneMetricEvent(normalized));
    if (this.recentEvents.length > this.maxRecentEvents) {
      this.recentEvents.shift();
    }
  }

  snapshot(limit = this.maxRecentEvents): InteractiveServingStatsSnapshot {
    const features: Partial<Record<InteractiveServingFeature, InteractiveServingFeatureStats>> = {};

    for (const [feature, stats] of this.featureStats.entries()) {
      features[feature] = {
        requests: stats.requests,
        reasons: Object.fromEntries(stats.reasons.entries()),
        totalMsAvg: stats.requests > 0 ? stats.totalMsSum / stats.requests : 0,
        ...(stats.providerSamples > 0 ? { providerMsAvg: toAverage(stats.providerMsSum, stats.providerSamples) } : {}),
        ...(stats.formatterSamples > 0 ? { formatterMsAvg: toAverage(stats.formatterMsSum, stats.formatterSamples) } : {}),
        ...(stats.cacheWriteSamples > 0 ? { cacheWriteMsAvg: toAverage(stats.cacheWriteMsSum, stats.cacheWriteSamples) } : {}),
        ...(stats.payloadSamples > 0 ? {
          payloadBytesAvg: toAverage(stats.payloadBytesSum, stats.payloadSamples),
          payloadBytesMax: stats.payloadBytesMax,
        } : {}),
        ...(stats.payloadBudgetExceeded > 0 ? { payloadBudgetExceeded: stats.payloadBudgetExceeded } : {}),
        ...(stats.lastEvent ? { lastEvent: cloneMetricEvent(stats.lastEvent) } : {}),
      };
    }

    return {
      features,
      recentEvents: this.recentEvents.slice(-Math.max(0, limit)).map(cloneMetricEvent),
    };
  }
}

type PayloadEstimateState = {
  nodes: number;
  seen: Set<unknown>;
};

function estimateValueBytes(value: unknown, depth: number, state: PayloadEstimateState): number {
  if (value === null || value === undefined) {
    return 0;
  }

  if (state.nodes >= MAX_PAYLOAD_ESTIMATE_NODES || depth > MAX_PAYLOAD_ESTIMATE_DEPTH) {
    return 0;
  }

  state.nodes++;

  switch (typeof value) {
    case 'string':
      return value.length;
    case 'number':
      return 8;
    case 'boolean':
      return 4;
    case 'object':
      break;
    default:
      return 0;
  }

  if (state.seen.has(value)) {
    return 0;
  }
  state.seen.add(value);

  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + estimateValueBytes(item, depth + 1, state), 0);
  }

  let total = 0;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    total += key.length;
    total += estimateValueBytes(child, depth + 1, state);
  }
  return total;
}

export function estimateLspPayloadBytes(value: unknown): number {
  return estimateValueBytes(value, 0, { nodes: 0, seen: new Set<unknown>() });
}