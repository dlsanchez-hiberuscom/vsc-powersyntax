/**
 * Audit: garantiza que el módulo `codeMasking` se exporta y mantiene
 * su contrato (`maskDocument`) sin regresiones.
 *
 * Spec 055 / B138.
 */

import * as assert from 'assert/strict';
import { maskDocument } from '../../../src/server/parsing/codeMasking';

suite('unit/codeMaskingAudit (B138)', () => {
  test('maskDocument enmascara strings y comentarios', () => {
    const src = 'a = "hola" // mundo\nb = /* x */ 1\n';
    const out = maskDocument(src);
    // Mismo length que el original.
    assert.equal(out.length, src.length);
    // Los identificadores fuera de strings/comentarios siguen vivos.
    assert.ok(out.includes('a ='));
    assert.ok(out.includes('b ='));
    // El contenido del comentario y del string no debe revelar texto del original.
    assert.ok(!out.includes('hola'));
    assert.ok(!out.includes('mundo'));
  });

  test('maskDocument preserva line breaks', () => {
    const src = 'foo\n"bar"\nbaz\n';
    const out = maskDocument(src);
    assert.equal(out.split('\n').length, src.split('\n').length);
  });
});
