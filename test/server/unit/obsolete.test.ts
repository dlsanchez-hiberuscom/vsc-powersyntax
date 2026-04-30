import * as assert from 'assert/strict';
import { findObsoleteCalls } from '../../../src/server/features/obsoleteDetector';

suite('unit/obsolete (B074)', () => {
  test('detecta Yield()', () => {
    const diags = findObsoleteCalls('integer i\nYield()\n');
    assert.equal(diags.length, 1);
    assert.match(diags[0].message ?? '', /Yield/);
  });

  test('Yield en comentario no se reporta', () => {
    const diags = findObsoleteCalls('integer i // Yield()\n');
    assert.equal(diags.length, 0);
  });

  test('Halt y RunFork también', () => {
    const diags = findObsoleteCalls('Halt()\nRunFork("x")\n');
    assert.equal(diags.length, 2);
  });
});
