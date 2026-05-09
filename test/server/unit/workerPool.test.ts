import * as assert from 'assert/strict';

import { WorkerPool } from '../../../src/server/indexer/workerPool';

suite('unit/workerPool (Wave 08)', () => {
  test('expone snapshot bounded con queue/busy/wait/run', async () => {
    const pool = new WorkerPool(1);

    try {
      const task = pool.runTask(
        'file:///worker_metrics.sru',
        'global type u_worker_metrics from nonvisualobject\nend type',
        'workspace-ws_objects',
        'structural',
      );

      const queued = pool.getStats();
      assert.ok(queued.totalWorkers >= 1);
      assert.ok(queued.queuedTasks >= 0);

      await task;

      const stats = pool.getStats();
      assert.equal(stats.completedTasks, 1);
      assert.equal(stats.failedTasks, 0);
      assert.ok((stats.lastRunMs ?? 0) >= 0);
      assert.ok((stats.lastWaitMs ?? 0) >= 0);
    } finally {
      pool.terminate();
    }
  });
});