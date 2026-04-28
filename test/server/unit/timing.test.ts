import * as assert from 'assert/strict';

import {
  measureMs,
  measureMsAsync,
  formatTiming,
  FirstInvocationTracker
} from '../../../src/server/runtime/timing';

suite('unit/timing', () => {
  test('measureMs mide el tiempo de ejecución síncrono', () => {
    const { result, elapsedMs } = measureMs(() => {
      let sum = 0;
      for (let i = 0; i < 10000; i++) {
        sum += i;
      }
      return sum;
    });

    assert.equal(typeof result, 'number');
    assert.equal(typeof elapsedMs, 'number');
    assert.ok(elapsedMs >= 0);
  });

  test('measureMsAsync mide el tiempo de ejecución asíncrono', async () => {
    const { result, elapsedMs } = await measureMsAsync(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 'done';
    });

    assert.equal(result, 'done');
    assert.ok(elapsedMs >= 5);
  });

  test('formatTiming formatea correctamente el tiempo', () => {
    const formatted = formatTiming('test', 12.3456);
    assert.equal(formatted, '[TIMING] test: 12.35ms');
  });

  test('FirstInvocationTracker rastrea correctamente la primera llamada', () => {
    const tracker = new FirstInvocationTracker();

    assert.equal(tracker.isFirst('hover'), true);
    assert.equal(tracker.isFirst('hover'), false);
    assert.equal(tracker.isFirst('hover'), false);

    assert.equal(tracker.isFirst('symbols'), true);
    assert.equal(tracker.isFirst('symbols'), false);

    tracker.reset();
    assert.equal(tracker.isFirst('hover'), true);
  });
});
