import * as assert from 'assert/strict';

import { RuntimeEventLoopMonitor } from '../../../src/server/runtime/eventLoopMonitor';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

suite('unit/eventLoopMonitor (Wave 08)', () => {
  test('puede start/stop sin handles persistentes y devuelve snapshot bounded', async () => {
    const monitor = new RuntimeEventLoopMonitor(10);

    monitor.start();
    await delay(20);
    const activeSnapshot = monitor.snapshot();
    assert.equal(activeSnapshot.enabled, true);
    assert.equal(activeSnapshot.resolutionMs, 10);
    assert.ok((activeSnapshot.utilization ?? 0) >= 0);

    monitor.stop();
    const stoppedSnapshot = monitor.snapshot();
    assert.equal(stoppedSnapshot.enabled, false);
  });
});