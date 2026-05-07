import { estimateLspPayloadBytes, type InteractiveServingFeature, type InteractiveServingReason, type InteractiveServingStatsTracker } from '../runtime/interactiveServingStats';
import type { RuntimeJournal } from '../runtime/runtimeJournal';
import type { CancellationToken } from '../runtime/cancellation';

import {
  evaluateInteractivePayloadBudget,
  resolveInteractivePayloadBudgetFeature,
  type InteractivePayloadBudgetFeature,
} from './payloadBudget';
import {
  type InteractiveServingRequestState,
  type InteractiveServingStaleReason,
  type InteractiveServingStaleGuard,
} from './staleGuard';

export interface InteractiveServingPipelineReadiness<TResult> {
  action: string;
  reason: string;
  blockedResult: TResult;
  blocked?: boolean;
  warningMessage?: string;
}

export interface InteractiveServingPipelineTelemetry {
  totalMs: number;
  providerMs: number;
  formatterMs?: number;
  cacheWriteMs?: number;
}

export interface InteractiveServingPipelineEarlyResult<TResult, TCache = TResult> {
  handled: true;
  reason: Extract<InteractiveServingReason, 'viewmodel-hit' | 'negative-hit' | 'readiness-degraded'>;
  result: TResult;
  providerMs?: number;
  formatterMs?: number;
  skipCacheWrite?: boolean;
  cacheValue?: TCache;
}

export interface InteractiveServingPipelineRequest<TResult, TCache = TResult> {
  feature: InteractiveServingFeature;
  cacheKey: string;
  readiness: InteractiveServingPipelineReadiness<TResult>;
  requestState: InteractiveServingRequestState;
  readCurrentState: () => InteractiveServingRequestState;
  staleGuard: InteractiveServingStaleGuard;
  runtimeJournal: RuntimeJournal;
  interactiveServingStats: InteractiveServingStatsTracker;
  budgetMs?: number;
  kbVersion?: number;
  documentFingerprint?: number | string;
  locale?: string;
  payloadBudgetFeature?: InteractivePayloadBudgetFeature;
  allowCachedWhileBlocked?: boolean;
  cancellationToken?: CancellationToken | null;
  ensureRuntimeMemoryPressureRelief?: () => void;
  getCachedResult: () => TResult | undefined;
  resolveEarlyResult?: () => InteractiveServingPipelineEarlyResult<TResult, TCache> | undefined;
  execute?: () => TResult;
  resolve?: () => unknown;
  format?: (resolved: unknown) => TResult;
  onResolved?: (resolved: unknown) => void;
  shouldWriteCache?: (result: TResult, resolved?: unknown) => boolean;
  cacheValueFromResult?: (result: TResult, resolved?: unknown) => TCache;
  writeCache?: (value: TCache) => void;
  onBlocked?: (message: string) => void;
  onComputed?: (result: TResult, telemetry: InteractiveServingPipelineTelemetry) => void;
}

type InteractiveServingMetricDetail = Parameters<InteractiveServingStatsTracker['record']>[0] & {
  payloadBudgetBytes?: number;
  payloadBudgetExceeded?: boolean;
  staleReason?: InteractiveServingStaleReason;
};

function nowMs(): number {
  return performance.now();
}

export function recordInteractiveServingEvent(
  runtimeJournal: RuntimeJournal,
  interactiveServingStats: InteractiveServingStatsTracker,
  event: InteractiveServingMetricDetail
): void {
  interactiveServingStats.record(event);
  runtimeJournal.record({
    phase: 'serve',
    kind: 'interactive-serving',
    action: event.reason,
    label: event.feature,
    durationMs: event.totalMs,
    severity: event.reason === 'blocked' || event.reason === 'stale-discarded' ? 'warning' : 'info',
    detail: event,
  });
}

function resolvePayloadMetric(
  feature: InteractiveServingFeature,
  payloadBudgetFeature: InteractivePayloadBudgetFeature | undefined,
  value: unknown
): Pick<InteractiveServingMetricDetail, 'payloadBytes' | 'payloadBudgetBytes' | 'payloadBudgetExceeded'> {
  const payloadBytes = estimateLspPayloadBytes(value);
  const budgetEvaluation = evaluateInteractivePayloadBudget(
    payloadBudgetFeature ?? resolveInteractivePayloadBudgetFeature(feature),
    payloadBytes,
  );

  return {
    payloadBytes,
    payloadBudgetBytes: budgetEvaluation.budgetBytes,
    payloadBudgetExceeded: !budgetEvaluation.withinBudget,
  };
}

function resolveExecution<TResult>(request: InteractiveServingPipelineRequest<TResult, unknown>): {
  result: TResult;
  providerMs: number;
  formatterMs?: number;
  resolved?: unknown;
} {
  if (request.resolve && request.format) {
    const providerStartedAt = nowMs();
    const resolved = request.resolve();
    const providerMs = nowMs() - providerStartedAt;
    request.onResolved?.(resolved);

    const formatterStartedAt = nowMs();
    const result = request.format(resolved);
    const formatterMs = nowMs() - formatterStartedAt;

    return {
      result,
      providerMs,
      formatterMs,
      resolved,
    };
  }

  if (!request.execute) {
    throw new Error(`InteractiveServingPipeline requiere execute() o resolve()+format() para ${request.feature}.`);
  }

  const providerStartedAt = nowMs();
  const result = request.execute();
  return {
    result,
    providerMs: nowMs() - providerStartedAt,
  };
}

export function runInteractiveServingPipeline<TResult, TCache = TResult>(
  request: InteractiveServingPipelineRequest<TResult, TCache>
): TResult {
  const readinessBlocked = request.readiness.blocked ?? request.readiness.action === 'block';
  const requestToken = request.staleGuard.begin(request.requestState);

  request.ensureRuntimeMemoryPressureRelief?.();

  const cacheLookupStartedAt = nowMs();
  const cached = request.getCachedResult();
  if (cached !== undefined) {
    if (readinessBlocked && request.allowCachedWhileBlocked === false) {
      if (request.readiness.warningMessage) {
        request.onBlocked?.(request.readiness.warningMessage);
      }
      recordInteractiveServingEvent(request.runtimeJournal, request.interactiveServingStats, {
        feature: request.feature,
        reason: 'blocked',
        totalMs: nowMs() - cacheLookupStartedAt,
        locale: request.locale,
        kbVersion: request.kbVersion,
        documentFingerprint: request.documentFingerprint,
        budgetMs: request.budgetMs,
        readinessAction: request.readiness.action,
        readinessReason: request.readiness.reason,
      });
      return request.readiness.blockedResult;
    }

    recordInteractiveServingEvent(request.runtimeJournal, request.interactiveServingStats, {
      feature: request.feature,
      reason: 'cache-hit',
      totalMs: nowMs() - cacheLookupStartedAt,
      locale: request.locale,
      kbVersion: request.kbVersion,
      documentFingerprint: request.documentFingerprint,
      budgetMs: request.budgetMs,
      readinessAction: request.readiness.action,
      readinessReason: request.readiness.reason,
      ...resolvePayloadMetric(request.feature, request.payloadBudgetFeature, cached),
    });
    return cached;
  }

  if (readinessBlocked) {
    if (request.readiness.warningMessage) {
      request.onBlocked?.(request.readiness.warningMessage);
    }
    recordInteractiveServingEvent(request.runtimeJournal, request.interactiveServingStats, {
      feature: request.feature,
      reason: 'blocked',
      totalMs: 0,
      locale: request.locale,
      kbVersion: request.kbVersion,
      documentFingerprint: request.documentFingerprint,
      budgetMs: request.budgetMs,
      readinessAction: request.readiness.action,
      readinessReason: request.readiness.reason,
    });
    return request.readiness.blockedResult;
  }

  const earlyResult = request.resolveEarlyResult?.();
  if (earlyResult?.handled) {
    const earlyTotalMs = (earlyResult.providerMs ?? 0) + (earlyResult.formatterMs ?? 0);
    request.onComputed?.(earlyResult.result, {
      totalMs: earlyTotalMs,
      providerMs: earlyResult.providerMs ?? 0,
      ...(earlyResult.formatterMs !== undefined ? { formatterMs: earlyResult.formatterMs } : {}),
    });

    const staleBeforeWrite = request.staleGuard.check(requestToken, request.readCurrentState(), request.cancellationToken);
    if (staleBeforeWrite.stale) {
      recordInteractiveServingEvent(request.runtimeJournal, request.interactiveServingStats, {
        feature: request.feature,
        reason: 'stale-discarded',
        totalMs: earlyTotalMs,
        providerMs: earlyResult.providerMs,
        ...(earlyResult.formatterMs !== undefined ? { formatterMs: earlyResult.formatterMs } : {}),
        locale: request.locale,
        kbVersion: request.kbVersion,
        documentFingerprint: request.documentFingerprint,
        budgetMs: request.budgetMs,
        readinessAction: request.readiness.action,
        readinessReason: request.readiness.reason,
        staleReason: staleBeforeWrite.reason,
      });
      return request.readiness.blockedResult;
    }

    let cacheWriteMs: number | undefined;
    if (!earlyResult.skipCacheWrite && request.writeCache) {
      const cacheValue = earlyResult.cacheValue
        ?? request.cacheValueFromResult?.(earlyResult.result)
        ?? earlyResult.result as unknown as TCache;
      const cacheWriteStartedAt = nowMs();
      request.writeCache(cacheValue);
      cacheWriteMs = nowMs() - cacheWriteStartedAt;
    }

    recordInteractiveServingEvent(request.runtimeJournal, request.interactiveServingStats, {
      feature: request.feature,
      reason: earlyResult.reason,
      totalMs: earlyTotalMs + (cacheWriteMs ?? 0),
      ...(earlyResult.providerMs !== undefined ? { providerMs: earlyResult.providerMs } : {}),
      ...(earlyResult.formatterMs !== undefined ? { formatterMs: earlyResult.formatterMs } : {}),
      ...(cacheWriteMs !== undefined ? { cacheWriteMs } : {}),
      locale: request.locale,
      kbVersion: request.kbVersion,
      documentFingerprint: request.documentFingerprint,
      budgetMs: request.budgetMs,
      readinessAction: request.readiness.action,
      readinessReason: request.readiness.reason,
      ...resolvePayloadMetric(request.feature, request.payloadBudgetFeature, earlyResult.result),
    });

    return earlyResult.result;
  }

  const computed = resolveExecution(request as InteractiveServingPipelineRequest<TResult, unknown>);
  const totalMsBeforeCache = computed.providerMs + (computed.formatterMs ?? 0);
  request.onComputed?.(computed.result, {
    totalMs: totalMsBeforeCache,
    providerMs: computed.providerMs,
    ...(computed.formatterMs !== undefined ? { formatterMs: computed.formatterMs } : {}),
  });

  const staleBeforeWrite = request.staleGuard.check(requestToken, request.readCurrentState(), request.cancellationToken);
  if (staleBeforeWrite.stale) {
    recordInteractiveServingEvent(request.runtimeJournal, request.interactiveServingStats, {
      feature: request.feature,
      reason: 'stale-discarded',
      totalMs: totalMsBeforeCache,
      providerMs: computed.providerMs,
      ...(computed.formatterMs !== undefined ? { formatterMs: computed.formatterMs } : {}),
      locale: request.locale,
      kbVersion: request.kbVersion,
      documentFingerprint: request.documentFingerprint,
      budgetMs: request.budgetMs,
      readinessAction: request.readiness.action,
      readinessReason: request.readiness.reason,
      staleReason: staleBeforeWrite.reason,
    });
    return request.readiness.blockedResult;
  }

  let cacheWriteMs: number | undefined;
  if (request.writeCache && (request.shouldWriteCache?.(computed.result, computed.resolved) ?? true)) {
    const cacheValue = request.cacheValueFromResult
      ? request.cacheValueFromResult(computed.result, computed.resolved)
      : computed.result as unknown as TCache;
    const cacheWriteStartedAt = nowMs();
    request.writeCache(cacheValue);
    cacheWriteMs = nowMs() - cacheWriteStartedAt;
  }

  const staleBeforeReturn = request.staleGuard.check(requestToken, request.readCurrentState(), request.cancellationToken);
  if (staleBeforeReturn.stale) {
    recordInteractiveServingEvent(request.runtimeJournal, request.interactiveServingStats, {
      feature: request.feature,
      reason: 'stale-discarded',
      totalMs: totalMsBeforeCache + (cacheWriteMs ?? 0),
      providerMs: computed.providerMs,
      ...(computed.formatterMs !== undefined ? { formatterMs: computed.formatterMs } : {}),
      ...(cacheWriteMs !== undefined ? { cacheWriteMs } : {}),
      locale: request.locale,
      kbVersion: request.kbVersion,
      documentFingerprint: request.documentFingerprint,
      budgetMs: request.budgetMs,
      readinessAction: request.readiness.action,
      readinessReason: request.readiness.reason,
      staleReason: staleBeforeReturn.reason,
    });
    return request.readiness.blockedResult;
  }

  recordInteractiveServingEvent(request.runtimeJournal, request.interactiveServingStats, {
    feature: request.feature,
    reason: 'miss',
    totalMs: totalMsBeforeCache + (cacheWriteMs ?? 0),
    providerMs: computed.providerMs,
    ...(computed.formatterMs !== undefined ? { formatterMs: computed.formatterMs } : {}),
    ...(cacheWriteMs !== undefined ? { cacheWriteMs } : {}),
    locale: request.locale,
    kbVersion: request.kbVersion,
    documentFingerprint: request.documentFingerprint,
    budgetMs: request.budgetMs,
    readinessAction: request.readiness.action,
    readinessReason: request.readiness.reason,
    ...resolvePayloadMetric(request.feature, request.payloadBudgetFeature, computed.result),
  });

  return computed.result;
}