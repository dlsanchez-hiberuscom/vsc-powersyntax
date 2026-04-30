import * as assert from 'assert/strict';
import { parsePblMeta } from '../../../src/server/workspace/pblmeta';

suite('unit/pblmeta (B131)', () => {
  test('detecta entradas básicas', () => {
    const meta = parsePblMeta('w_main.srw\nu_logger.sru\n');
    assert.equal(meta.length, 2);
    assert.equal(meta[0].type, 'srw');
    assert.equal(meta[1].name, 'u_logger');
  });

  test('soporta comentarios y líneas en blanco', () => {
    const meta = parsePblMeta('; cabecera\n\nw_main.srw ; ventana principal\n');
    assert.equal(meta.length, 1);
    assert.equal(meta[0].comment, 'ventana principal');
  });

  test('ignora líneas inválidas', () => {
    assert.equal(parsePblMeta('basura sin punto\n').length, 0);
  });
});
