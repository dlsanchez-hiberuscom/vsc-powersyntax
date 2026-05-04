import * as assert from 'assert/strict';

import { createManagedRuntimeWorkloads } from '../../../src/server/runtime/managedRuntimeWorkloads';
import { TaskScheduler } from '../../../src/server/runtime/scheduler';

suite('unit/managedRuntimeWorkloads (B354)', () => {
  test('runNearContextWorkload usa workload near-context y respeta ids secuenciales', async () => {
    const scheduler = new TaskScheduler();
    const workloads = createManagedRuntimeWorkloads(scheduler);
    const order: string[] = [];

    const firstPromise = workloads.runNearContextWorkload('current-object-context', () => {
      order.push('first');
      return 'first-result';
    });
    const secondPromise = workloads.runNearContextWorkload('dependency-graph', () => {
      order.push('second');
      return 'second-result';
    });

    assert.equal(await firstPromise, 'first-result');
    assert.equal(await secondPromise, 'second-result');
    assert.deepEqual(order, ['first', 'second']);
  });

  test('runExportReportingWorkload ejecuta el callback en background sin dejar workloads pendientes', async () => {
    const scheduler = new TaskScheduler();
    const workloads = createManagedRuntimeWorkloads(scheduler);

    const result = await workloads.runExportReportingWorkload('technical-debt-report', () => 'ok');

    assert.equal(result, 'ok');
    assert.equal(scheduler.getStatus().pendingWorkloads['export-reporting'] ?? 0, 0);
  });

  test('runMaintenanceWorkload ejecuta el callback en background sin dejar workloads pendientes', async () => {
    const scheduler = new TaskScheduler();
    const workloads = createManagedRuntimeWorkloads(scheduler);

    const result = await workloads.runMaintenanceWorkload('semantic-cache-maintenance', () => 'done');

    assert.equal(result, 'done');
    assert.equal(scheduler.getStatus().pendingWorkloads['maintenance'] ?? 0, 0);
  });
});