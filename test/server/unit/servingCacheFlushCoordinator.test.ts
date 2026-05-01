import * as assert from 'assert/strict';

import { ServingCacheFlushCoordinator } from '../../../src/server/cache/servingCacheFlushCoordinator';

suite('unit/ServingCacheFlushCoordinator', () => {
  test('no flushea cuando está limpio', async () => {
    let flushCount = 0;
    const coordinator = new ServingCacheFlushCoordinator(async () => {
      flushCount += 1;
    });

    assert.equal(await coordinator.flushIfDirty(), false);
    assert.equal(flushCount, 0);
  });

  test('flushea cuando está dirty', async () => {
    let flushCount = 0;
    const coordinator = new ServingCacheFlushCoordinator(async () => {
      flushCount += 1;
    });

    coordinator.markDirty();

    assert.equal(await coordinator.flushIfDirty(), true);
    assert.equal(flushCount, 1);
    assert.equal(await coordinator.flushIfDirty(), false);
  });

  test('si vuelve a ensuciarse durante el flush converge con una segunda pasada', async () => {
    let flushCount = 0;
    let firstPass = true;

    const coordinator = new ServingCacheFlushCoordinator(async () => {
      flushCount += 1;
      if (firstPass) {
        firstPass = false;
        coordinator.markDirty();
      }
    });

    coordinator.markDirty();

    assert.equal(await coordinator.flushIfDirty(), true);
    assert.equal(flushCount, 2);
    assert.equal(await coordinator.flushIfDirty(), false);
  });
});