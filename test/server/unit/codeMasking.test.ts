import * as assert from 'assert/strict';
import { maskLine, maskDocument } from '../../../src/server/parsing/codeMasking';

suite('unit/codeMasking (B092)', () => {
  test('maskLine elimina // y strings', () => {
    const out = maskLine('foo("bar") // comment');
    assert.equal(/bar/.test(out), false);
    assert.equal(/comment/.test(out), false);
    assert.equal(out.length, 'foo("bar") // comment'.length);
  });

  test('maskDocument respeta saltos de línea', () => {
    const src = 'a = 1\nb = "x"\n// note\n';
    const out = maskDocument(src);
    assert.equal(out.length, src.length);
    assert.equal(out.split('\n').length, src.split('\n').length);
    assert.equal(/x/.test(out), false);
    assert.equal(/note/.test(out), false);
  });

  test('maskDocument soporta /* */ multilinea', () => {
    const src = 'a /* foo\nbar */ b';
    const out = maskDocument(src);
    assert.equal(out.length, src.length);
    assert.equal(/foo/.test(out), false);
    assert.equal(/bar/.test(out), false);
    assert.match(out, /^a/);
    assert.match(out, /b$/);
  });
});
