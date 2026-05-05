import * as assert from 'assert/strict';

import {
  INTERACTIVE_TIMING_LOG_THRESHOLD_MS,
  shouldLogInteractiveTiming,
} from '../../../src/server/handlers/featureHandlers';

suite('unit/featureHandlers', () => {
  test('solo loguea timings interactivos cuando cruzan el presupuesto', () => {
    assert.equal(shouldLogInteractiveTiming(INTERACTIVE_TIMING_LOG_THRESHOLD_MS - 1), false);
    assert.equal(shouldLogInteractiveTiming(INTERACTIVE_TIMING_LOG_THRESHOLD_MS), true);
    assert.equal(shouldLogInteractiveTiming(INTERACTIVE_TIMING_LOG_THRESHOLD_MS + 10), true);
  });
});