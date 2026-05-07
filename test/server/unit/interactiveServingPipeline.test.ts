import * as assert from 'assert/strict';

import { InteractiveServingStatsTracker } from '../../../src/server/runtime/interactiveServingStats';
import { RuntimeJournal } from '../../../src/server/runtime/runtimeJournal';
import { runInteractiveServingPipeline } from '../../../src/server/serving/interactiveServingPipeline';
import { InteractiveServingStaleGuard } from '../../../src/server/serving/staleGuard';

suite('unit/interactiveServingPipeline', () => {
  test('cache-hit evita provider y cache write en hot path', () => {
    const tracker = new InteractiveServingStatsTracker();
    const staleGuard = new InteractiveServingStaleGuard();
    let executeCalls = 0;
    let cacheWrites = 0;
    let memoryReliefCalls = 0;

    const cached = { label: 'cached' };
    const result = runInteractiveServingPipeline({
      feature: 'hover',
      cacheKey: 'hover-hot',
      readiness: { action: 'allow', reason: 'ready', blockedResult: null as { label: string } | null },
      requestState: {
        feature: 'hover',
        uri: 'file:///a.sru',
        documentVersion: 1,
        kbVersion: 3,
        documentFingerprint: 4,
        sourceOrigin: 'workspace-ws_objects',
        locale: 'es',
        contextKey: '1:1',
      },
      readCurrentState: () => ({
        feature: 'hover',
        uri: 'file:///a.sru',
        documentVersion: 1,
        kbVersion: 3,
        documentFingerprint: 4,
        sourceOrigin: 'workspace-ws_objects',
        locale: 'es',
        contextKey: '1:1',
      }),
      staleGuard,
      runtimeJournal: new RuntimeJournal(8),
      interactiveServingStats: tracker,
      ensureRuntimeMemoryPressureRelief: () => {
        memoryReliefCalls++;
      },
      getCachedResult: () => cached,
      execute: () => {
        executeCalls++;
        return { label: 'miss' };
      },
      writeCache: () => {
        cacheWrites++;
      },
    });

    assert.equal(result, cached);
    assert.equal(executeCalls, 0);
    assert.equal(cacheWrites, 0);
    assert.equal(memoryReliefCalls, 1);
    assert.deepEqual(tracker.snapshot().features.hover?.reasons, { 'cache-hit': 1 });
  });

  test('descarta resultados stale antes de escribir en cache', () => {
    const tracker = new InteractiveServingStatsTracker();
    const staleGuard = new InteractiveServingStaleGuard();
    let cacheWrites = 0;

    const state = {
      feature: 'completion' as const,
      uri: 'file:///a.sru',
      documentVersion: 1,
      kbVersion: 3,
      documentFingerprint: 4,
      sourceOrigin: 'workspace-ws_objects' as const,
      locale: 'es',
      contextKey: '4:8:1:.',
    };

    const result = runInteractiveServingPipeline({
      feature: 'completion',
      cacheKey: 'completion-stale',
      readiness: { action: 'allow', reason: 'ready', blockedResult: null as string[] | null },
      requestState: state,
      readCurrentState: () => state,
      staleGuard,
      runtimeJournal: new RuntimeJournal(8),
      interactiveServingStats: tracker,
      getCachedResult: () => undefined,
      execute: () => {
        staleGuard.begin({ ...state, contextKey: '4:9:1:.' });
        return ['one', 'two'];
      },
      writeCache: () => {
        cacheWrites++;
      },
    });

    assert.equal(result, null);
    assert.equal(cacheWrites, 0);
    assert.deepEqual(tracker.snapshot().features.completion?.reasons, { 'stale-discarded': 1 });
  });

  test('separa provider y formatter y marca payloads fuera de budget', () => {
    const tracker = new InteractiveServingStatsTracker();
    const staleGuard = new InteractiveServingStaleGuard();

    const result = runInteractiveServingPipeline({
      feature: 'hover',
      cacheKey: 'hover-format',
      readiness: { action: 'allow', reason: 'ready', blockedResult: null as { contents: string } | null },
      requestState: {
        feature: 'hover',
        uri: 'file:///a.sru',
        documentVersion: 1,
        kbVersion: 3,
        documentFingerprint: 4,
        sourceOrigin: 'workspace-ws_objects',
        locale: 'es',
        contextKey: '1:1',
      },
      readCurrentState: () => ({
        feature: 'hover',
        uri: 'file:///a.sru',
        documentVersion: 1,
        kbVersion: 3,
        documentFingerprint: 4,
        sourceOrigin: 'workspace-ws_objects',
        locale: 'es',
        contextKey: '1:1',
      }),
      staleGuard,
      runtimeJournal: new RuntimeJournal(8),
      interactiveServingStats: tracker,
      getCachedResult: () => undefined,
      resolve: () => ({ markdown: 'x'.repeat(6000) }),
      format: (resolved) => ({ contents: (resolved as { markdown: string }).markdown }),
      writeCache: () => undefined,
    });

    assert.equal(result?.contents.length, 6000);
    const lastEvent = tracker.snapshot().features.hover?.lastEvent;
    assert.ok((lastEvent?.providerMs ?? 0) >= 0);
    assert.ok((lastEvent?.formatterMs ?? 0) >= 0);
    assert.equal(lastEvent?.payloadBudgetBytes, 4096);
    assert.equal(lastEvent?.payloadBudgetExceeded, true);
  });

  test('registra completion-resolve separado de completion inicial y usa su payload budget', () => {
    const tracker = new InteractiveServingStatsTracker();
    const staleGuard = new InteractiveServingStaleGuard();

    const state = {
      feature: 'completion-resolve' as const,
      uri: 'file:///a.sru',
      documentVersion: 1,
      kbVersion: 3,
      documentFingerprint: 4,
      sourceOrigin: 'workspace-ws_objects' as const,
      locale: 'es',
      contextKey: 'system:abs',
    };

    const result = runInteractiveServingPipeline({
      feature: 'completion-resolve',
      cacheKey: 'completion-resolve-abs',
      readiness: { action: 'allow', reason: 'ready', blockedResult: { label: 'Abs', documentation: '' } },
      requestState: state,
      readCurrentState: () => state,
      staleGuard,
      runtimeJournal: new RuntimeJournal(8),
      interactiveServingStats: tracker,
      payloadBudgetFeature: 'completion-resolve',
      getCachedResult: () => undefined,
      execute: () => ({ label: 'Abs', documentation: 'x'.repeat(4500) }),
      writeCache: () => undefined,
    });

    assert.equal(result.label, 'Abs');
    assert.equal(tracker.snapshot().features.completion, undefined);
    const resolveStats = tracker.snapshot().features['completion-resolve'];
    assert.deepEqual(resolveStats?.reasons, { miss: 1 });
    assert.equal(resolveStats?.lastEvent?.payloadBudgetBytes, 4096);
    assert.equal(resolveStats?.lastEvent?.payloadBudgetExceeded, true);
  });

  test('descarta completion-resolve stale y devuelve el item original sin escribir cache', () => {
    const tracker = new InteractiveServingStatsTracker();
    const staleGuard = new InteractiveServingStaleGuard();
    let cacheWrites = 0;

    const originalItem = { label: 'Abs' };
    const state = {
      feature: 'completion-resolve' as const,
      uri: 'file:///a.sru',
      documentVersion: 1,
      kbVersion: 3,
      documentFingerprint: 4,
      sourceOrigin: 'workspace-ws_objects' as const,
      locale: 'es',
      contextKey: 'system:abs',
    };

    const result = runInteractiveServingPipeline({
      feature: 'completion-resolve',
      cacheKey: 'completion-resolve-stale',
      readiness: { action: 'allow', reason: 'ready', blockedResult: originalItem },
      requestState: state,
      readCurrentState: () => state,
      staleGuard,
      runtimeJournal: new RuntimeJournal(8),
      interactiveServingStats: tracker,
      getCachedResult: () => undefined,
      execute: () => {
        staleGuard.begin({ ...state, contextKey: 'system:messagebox' });
        return { label: 'Abs', documentation: 'resolved' };
      },
      writeCache: () => {
        cacheWrites++;
      },
    });

    assert.equal(result, originalItem);
    assert.equal(cacheWrites, 0);
    assert.deepEqual(tracker.snapshot().features['completion-resolve']?.reasons, { 'stale-discarded': 1 });
  });

  test('viewmodel-hit sirve early result sin ejecutar provider y puede materializar cache final', () => {
    const tracker = new InteractiveServingStatsTracker();
    const staleGuard = new InteractiveServingStaleGuard();
    let executeCalls = 0;
    let cacheWrites = 0;

    const result = runInteractiveServingPipeline({
      feature: 'hover',
      cacheKey: 'hover-viewmodel-hit',
      readiness: { action: 'allow', reason: 'ready', blockedResult: null as { contents: string } | null },
      requestState: {
        feature: 'hover',
        uri: 'file:///a.sru',
        documentVersion: 1,
        kbVersion: 3,
        documentFingerprint: 4,
        sourceOrigin: 'workspace-ws_objects',
        locale: 'es',
        contextKey: '1:1:messagebox',
      },
      readCurrentState: () => ({
        feature: 'hover',
        uri: 'file:///a.sru',
        documentVersion: 1,
        kbVersion: 3,
        documentFingerprint: 4,
        sourceOrigin: 'workspace-ws_objects',
        locale: 'es',
        contextKey: '1:1:messagebox',
      }),
      staleGuard,
      runtimeJournal: new RuntimeJournal(8),
      interactiveServingStats: tracker,
      getCachedResult: () => undefined,
      resolveEarlyResult: () => ({
        handled: true,
        reason: 'viewmodel-hit',
        result: { contents: 'cached-hover' },
        formatterMs: 0.25,
      }),
      execute: () => {
        executeCalls++;
        return { contents: 'miss-hover' };
      },
      writeCache: () => {
        cacheWrites++;
      },
    });

    assert.deepEqual(result, { contents: 'cached-hover' });
    assert.equal(executeCalls, 0);
    assert.equal(cacheWrites, 1);
    assert.deepEqual(tracker.snapshot().features.hover?.reasons, { 'viewmodel-hit': 1 });
  });

  test('negative-hit devuelve null y evita cache write final', () => {
    const tracker = new InteractiveServingStatsTracker();
    const staleGuard = new InteractiveServingStaleGuard();
    let executeCalls = 0;
    let cacheWrites = 0;

    const result = runInteractiveServingPipeline({
      feature: 'hover',
      cacheKey: 'hover-negative-hit',
      readiness: { action: 'allow', reason: 'ready', blockedResult: null as { contents: string } | null },
      requestState: {
        feature: 'hover',
        uri: 'file:///a.sru',
        documentVersion: 1,
        kbVersion: 3,
        documentFingerprint: 4,
        sourceOrigin: 'workspace-ws_objects',
        locale: 'es',
        contextKey: '1:1:whitespace',
      },
      readCurrentState: () => ({
        feature: 'hover',
        uri: 'file:///a.sru',
        documentVersion: 1,
        kbVersion: 3,
        documentFingerprint: 4,
        sourceOrigin: 'workspace-ws_objects',
        locale: 'es',
        contextKey: '1:1:whitespace',
      }),
      staleGuard,
      runtimeJournal: new RuntimeJournal(8),
      interactiveServingStats: tracker,
      getCachedResult: () => undefined,
      resolveEarlyResult: () => ({
        handled: true,
        reason: 'negative-hit',
        result: null,
        skipCacheWrite: true,
      }),
      execute: () => {
        executeCalls++;
        return { contents: 'miss-hover' };
      },
      writeCache: () => {
        cacheWrites++;
      },
    });

    assert.equal(result, null);
    assert.equal(executeCalls, 0);
    assert.equal(cacheWrites, 0);
    assert.deepEqual(tracker.snapshot().features.hover?.reasons, { 'negative-hit': 1 });
  });

  test('negative-hit reutiliza completion-resolve miss sin reejecutar provider', () => {
    const tracker = new InteractiveServingStatsTracker();
    const staleGuard = new InteractiveServingStaleGuard();
    let executeCalls = 0;
    let cacheWrites = 0;

    const originalItem = { label: 'Abs' };
    const state = {
      feature: 'completion-resolve' as const,
      uri: 'file:///a.sru',
      documentVersion: 1,
      kbVersion: 3,
      documentFingerprint: 4,
      sourceOrigin: 'workspace-ws_objects' as const,
      locale: 'es',
      contextKey: 'system:abs',
    };

    const result = runInteractiveServingPipeline({
      feature: 'completion-resolve',
      cacheKey: 'completion-resolve-negative-hit',
      readiness: { action: 'allow', reason: 'ready', blockedResult: originalItem },
      requestState: state,
      readCurrentState: () => state,
      staleGuard,
      runtimeJournal: new RuntimeJournal(8),
      interactiveServingStats: tracker,
      getCachedResult: () => undefined,
      resolveEarlyResult: () => ({
        handled: true,
        reason: 'negative-hit',
        result: originalItem,
        skipCacheWrite: true,
      }),
      execute: () => {
        executeCalls++;
        return { label: 'Abs', documentation: 'resolved' };
      },
      writeCache: () => {
        cacheWrites++;
      },
    });

    assert.equal(result, originalItem);
    assert.equal(executeCalls, 0);
    assert.equal(cacheWrites, 0);
    assert.deepEqual(tracker.snapshot().features['completion-resolve']?.reasons, { 'negative-hit': 1 });
  });
});