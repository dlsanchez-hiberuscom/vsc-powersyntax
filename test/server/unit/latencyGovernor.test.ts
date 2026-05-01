import * as assert from 'assert/strict';

import { createLatencyGovernor } from '../../../src/server/runtime/latencyGovernor';

suite('unit/latencyGovernor', () => {
  test('reduce presupuesto cuando la latencia supera el objetivo', () => {
    const governor = createLatencyGovernor({ initialBudgetMs: 50, minBudgetMs: 20, maxBudgetMs: 80, targetLatencyMs: 40, stepMs: 10 });

    governor.recordElapsedMs(70);

    assert.equal(governor.getBudgetMs(), 40);
    assert.equal(governor.getSnapshot().overloaded, true);
  });

  test('aumenta presupuesto cuando la latencia cae claramente por debajo del objetivo', () => {
    const governor = createLatencyGovernor({ initialBudgetMs: 40, minBudgetMs: 20, maxBudgetMs: 80, targetLatencyMs: 40, stepMs: 10 });

    governor.recordElapsedMs(15);

    assert.equal(governor.getBudgetMs(), 50);
    assert.equal(governor.getSnapshot().overloaded, false);
  });
});