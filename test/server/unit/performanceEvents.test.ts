import * as assert from 'assert/strict';

import { RuntimeMetricsRegistry } from '../../../src/server/runtime/performanceEvents';

suite('unit/performanceEvents (Wave 08)', () => {
  test('acepta el esquema minimo sin lanzar excepciones', () => {
    const registry = new RuntimeMetricsRegistry();

    assert.doesNotThrow(() => {
      registry.record({
        feature: 'hover',
        lane: 'interactive',
        outcome: 'success',
      });
    });
  });

  test('preserva payloadBytes y resultSize sin serializar payload real', () => {
    const registry = new RuntimeMetricsRegistry();

    registry.record({
      feature: 'completion-resolve',
      lane: 'interactive',
      outcome: 'success',
      payloadBytes: 2048,
      resultSize: 12,
      payloadBudgetBytes: 4096,
      payloadBudgetExceeded: false,
    });

    const event = registry.snapshot().recentEvents[0];
    assert.equal(event?.payloadBytes, 2048);
    assert.equal(event?.resultSize, 12);
  });

  test('representa outcomes degraded, cancelled y error de forma explicita', () => {
    const registry = new RuntimeMetricsRegistry();

    registry.record({
      feature: 'hover',
      lane: 'interactive',
      outcome: 'degraded',
      fallbackKind: 'payload-budget-exceeded',
      payloadBudgetExceeded: true,
    });
    registry.record({
      feature: 'scheduler',
      lane: 'near',
      outcome: 'cancelled',
      cancelled: true,
      degradedReason: 'preempted-by-interactive',
    });
    registry.record({
      feature: 'worker-pool',
      lane: 'background',
      outcome: 'error',
      errorKind: 'worker-exit',
    });

    const events = registry.snapshot().recentEvents;
    assert.equal(events[0]?.payloadBudgetExceeded, true);
    assert.equal(events[1]?.cancelled, true);
    assert.equal(events[2]?.errorKind, 'worker-exit');
  });

  test('snapshot publica percentiles bounded de duration, payload y result size', () => {
    const registry = new RuntimeMetricsRegistry();

    for (const value of [10, 20, 30, 40]) {
      registry.record({
        feature: 'semanticWorkspaceManifest',
        lane: 'reporting',
        outcome: 'success',
        durationMs: value,
        payloadBytes: value * 10,
        resultSize: value / 10,
      });
    }

    const snapshot = registry.snapshot();
    assert.deepEqual(snapshot.durationMs, {
      samples: 4,
      avg: 25,
      max: 40,
      p50: 20,
      p95: 40,
      p99: 40,
    });
    assert.deepEqual(snapshot.payloadBytes, {
      samples: 4,
      avg: 250,
      max: 400,
      p50: 200,
      p95: 400,
      p99: 400,
    });
    assert.deepEqual(snapshot.resultSize, {
      samples: 4,
      avg: 2.5,
      max: 4,
      p50: 2,
      p95: 4,
      p99: 4,
    });
  });
});