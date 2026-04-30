import * as assert from 'assert/strict';
import { maskDocument } from '../../../src/server/parsing/codeMasking';

suite('unit/nestedComments (B089)', () => {
  test('default: cierre temprano', () => {
    const src = '/* a /* b */ c */';
    const masked = maskDocument(src);
    // Tras el primer */, "c */" queda como código → 'c' visible.
    assert.match(masked, /c/);
  });

  test('nested:true cierra solo en depth 0', () => {
    const src = '/* a /* b */ c */ x';
    const masked = maskDocument(src, { nested: true });
    // Todo el bloque enmascarado, solo queda ' x' al final.
    assert.equal(masked.trim(), 'x');
  });
});
