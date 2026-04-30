import * as assert from 'assert/strict';
import { stripCommentsAndStrings } from '../../../src/server/features/diagnostics';

suite('unit/diagnostics.unused (B034)', () => {
  test('strip elimina comentario //', () => {
    const out = stripCommentsAndStrings('integer i // foo bar');
    assert.equal(/foo/.test(out), false);
    assert.equal(out.startsWith('integer i '), true);
  });

  test('strip vacía contenido de strings', () => {
    const out = stripCommentsAndStrings('messagebox("foo", "bar")');
    assert.equal(/foo/.test(out), false);
    assert.equal(/bar/.test(out), false);
    assert.ok(out.includes('messagebox'));
  });

  test('strip preserva longitud y posiciones', () => {
    const input = 'a = "foo"';
    const out = stripCommentsAndStrings(input);
    assert.equal(out.length, input.length);
  });
});
