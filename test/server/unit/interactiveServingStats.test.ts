import * as assert from 'assert/strict';

import {
  estimateLspPayloadBytes,
  InteractiveServingStatsTracker,
} from '../../../src/server/runtime/interactiveServingStats';
import { RuntimeMetricsRegistry } from '../../../src/server/runtime/performanceEvents';

suite('unit/interactiveServingStats', () => {
  test('acumula métricas por feature y reason de forma read-only', () => {
    const tracker = new InteractiveServingStatsTracker(4);

    tracker.record({
      feature: 'hover',
      reason: 'cache-hit',
      totalMs: 1,
      payloadBytes: 32,
      locale: 'en',
      kbVersion: 4,
      documentFingerprint: 9,
      budgetMs: 50,
    });
    tracker.record({
      feature: 'hover',
      reason: 'miss',
      totalMs: 6,
      providerMs: 4,
      formatterMs: 1,
      cacheWriteMs: 0.5,
      payloadBytes: 48,
      locale: 'es',
      kbVersion: 4,
      documentFingerprint: 9,
      budgetMs: 50,
      readinessAction: 'allow',
    });

    const snapshot = tracker.snapshot();
    const hover = snapshot.features.hover;

    assert.ok(hover);
    assert.equal(hover?.requests, 2);
    assert.deepEqual(hover?.reasons, { 'cache-hit': 1, miss: 1 });
    assert.equal(hover?.payloadBytesMax, 48);
    assert.equal(hover?.lastEvent?.reason, 'miss');
    assert.equal(snapshot.recentEvents.length, 2);
  });

  test('estima payload LSP sin stringify profundo', () => {
    const payloadBytes = estimateLspPayloadBytes({
      contents: {
        kind: 'markdown',
        value: '**Hover**\n```powerbuilder\ninteger li_value\n```',
      },
      range: {
        start: { line: 1, character: 2 },
        end: { line: 1, character: 10 },
      },
    });

    assert.ok(payloadBytes > 20);
  });

  test('proyecta eventos runtime al snapshot interactivo compatible', () => {
    const tracker = new InteractiveServingStatsTracker(4);

    tracker.recordPerformanceEvent({
      feature: 'hover',
      lane: 'interactive',
      outcome: 'success',
      cacheOutcome: 'hit',
      durationMs: 2,
      payloadBytes: 24,
      payloadBudgetBytes: 4096,
      payloadBudgetExceeded: false,
    });

    const snapshot = tracker.snapshot();
    assert.equal(snapshot.features.hover?.requests, 1);
    assert.deepEqual(snapshot.features.hover?.reasons, { 'cache-hit': 1 });
    assert.equal(snapshot.features.hover?.lastEvent?.payloadBytes, 24);
  });

  test('runtime metrics registry conserva eventos minimos y bounded', () => {
    const registry = new RuntimeMetricsRegistry(2);

    registry.record({ feature: 'hover', lane: 'interactive', outcome: 'success' });
    registry.record({ feature: 'memory', lane: 'runtime', outcome: 'degraded', degradedReason: 'warning-threshold' });
    registry.record({ feature: 'worker-pool', lane: 'background', outcome: 'error', errorKind: 'worker-exit' });

    const snapshot = registry.snapshot();
    assert.equal(snapshot.totalRecorded, 3);
    assert.equal(snapshot.dropped, 1);
    assert.equal(snapshot.recentEvents.length, 2);
    assert.equal(snapshot.recentEvents[0]?.feature, 'memory');
    assert.equal(snapshot.recentEvents[1]?.errorKind, 'worker-exit');
  });
});