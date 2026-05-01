import * as assert from 'assert/strict';
import { createReadinessTracker } from '../../../src/server/workspace/readiness';

suite('unit/readiness (B128)', () => {
  test('transiciones legales', () => {
    const t = createReadinessTracker();
    assert.equal(t.transition('discovering'), true);
    assert.equal(t.transition('indexing'), true);
    assert.equal(t.transition('ready'), true);
  });

  test('mismo estado no transiciona', () => {
    const t = createReadinessTracker('ready');
    assert.equal(t.transition('ready'), false);
  });

  test('error siempre permitido', () => {
    const t = createReadinessTracker('discovering');
    assert.equal(t.transition('error', 'boom'), true);
    assert.equal(t.getState(), 'error');
  });

  test('listeners reciben el cambio', () => {
    const t = createReadinessTracker();
    let last = '';
    t.onChange((s) => { last = s; });
    t.transition('indexing');
    assert.equal(last, 'indexing');
  });

  test('ready→indexing permitido (re-index)', () => {
    const t = createReadinessTracker('ready');
    assert.equal(t.transition('indexing'), true);
  });

  test('degraded conserva detalle', () => {
    const t = createReadinessTracker('indexing');
    assert.equal(t.transition('degraded', 'skipped-files'), true);
    assert.equal(t.getState(), 'degraded');
    assert.equal(t.getDetail(), 'skipped-files');
  });
});
