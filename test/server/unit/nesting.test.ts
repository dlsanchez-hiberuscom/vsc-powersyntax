import * as assert from 'assert/strict';
import { pickInnermost, compareByNesting } from '../../../src/server/parsing/nesting';

suite('unit/nesting (B099)', () => {
  test('pickInnermost selecciona el rango más anidado', () => {
    const parent = { startLine: 0, endLine: 10, name: 'parent' };
    const child = { startLine: 3, endLine: 5, name: 'child' };
    const w = pickInnermost([parent, child], 4);
    assert.equal(w?.name, 'child');
  });

  test('null si no contiene', () => {
    const a = { startLine: 0, endLine: 5, name: 'a' };
    assert.equal(pickInnermost([a], 9), null);
  });

  test('compareByNesting prefiere span menor', () => {
    assert.ok(
      compareByNesting({ startLine: 3, endLine: 5 }, { startLine: 0, endLine: 10 }) < 0
    );
  });
});
