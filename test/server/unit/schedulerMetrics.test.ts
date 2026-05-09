import * as assert from 'assert/strict';

import { TaskPriority, TaskScheduler } from '../../../src/server/runtime/scheduler';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

suite('unit/schedulerMetrics (Wave 08)', () => {
  test('expone snapshots bounded de cola y timing por lane', async () => {
    const scheduler = new TaskScheduler();

    try {
      const near = scheduler.enqueueNear({
        id: 'near-metrics',
        priority: TaskPriority.Near,
        execute: async () => {
          await delay(5);
        },
      });

      const background = scheduler.enqueueBackground({
        id: 'background-metrics',
        priority: TaskPriority.Background,
        execute: async () => {
          await delay(5);
        },
      });

      await near;
      await background;

      const status = scheduler.getStatus();
      assert.equal(status.metrics?.near?.enqueued, 1);
      assert.equal(status.metrics?.near?.completed, 1);
      assert.ok((status.metrics?.near?.lastRunMs ?? 0) >= 0);
      assert.equal(status.metrics?.background?.enqueued, 1);
      assert.equal(status.metrics?.background?.completed, 1);
      assert.ok((status.metrics?.background?.lastWaitMs ?? 0) >= 0);
    } finally {
      scheduler.shutdown();
    }
  });
});