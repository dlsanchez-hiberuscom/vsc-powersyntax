import * as assert from 'assert/strict';

import {
  estimateLspPayloadBytes,
  InteractiveServingStatsTracker,
} from '../../../src/server/runtime/interactiveServingStats';

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
      semanticEpoch: 9,
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
      semanticEpoch: 9,
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
});