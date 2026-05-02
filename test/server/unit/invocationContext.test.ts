import * as assert from 'assert';
import { Position } from 'vscode-languageserver/node';
import { getEventApiInvocationContext, getInvocationContext } from '../../../src/server/utils/invocationContext';

suite('server/utils/invocationContext', () => {
  const lines = [
    'of_init()',                                 // 0
    'this.of_init()',                            // 1
    'super::of_init()',                          // 2
    'parent.of_init()',                          // 3
    'ancestor::ue_save()',                       // 4
    'lnv_service  .  of_init()',                 // 5
    'w_main::of_close()',                        // 6
    'dw_1.object.data[1].value',                 // 7
    'svc#main.uf_done%()',                       // 8
    'this.of_total$()'                           // 9
  ];

  test('Extrae identifier sin cualificador', () => {
    const ctx = getInvocationContext(lines, Position.create(0, 3));
    assert.deepStrictEqual(ctx, { identifier: 'of_init' });
  });

  test('Extrae this como cualificador', () => {
    const ctx = getInvocationContext(lines, Position.create(1, 8));
    assert.deepStrictEqual(ctx, { identifier: 'of_init', qualifier: 'this', separator: '.' });
  });

  test('Extrae super como cualificador', () => {
    const ctx = getInvocationContext(lines, Position.create(2, 9));
    assert.deepStrictEqual(ctx, { identifier: 'of_init', qualifier: 'super', separator: '::' });
  });

  test('Extrae parent como cualificador', () => {
    const ctx = getInvocationContext(lines, Position.create(3, 10));
    assert.deepStrictEqual(ctx, { identifier: 'of_init', qualifier: 'parent', separator: '.' });
  });

  test('Extrae ancestor con doble punto', () => {
    const ctx = getInvocationContext(lines, Position.create(4, 12));
    assert.deepStrictEqual(ctx, { identifier: 'ue_save', qualifier: 'ancestor', separator: '::' });
  });

  test('Extrae variable con espacios', () => {
    const ctx = getInvocationContext(lines, Position.create(5, 20));
    assert.deepStrictEqual(ctx, { identifier: 'of_init', qualifier: 'lnv_service', separator: '.' });
  });

  test('Extrae cualificador con doble punto estático', () => {
    const ctx = getInvocationContext(lines, Position.create(6, 12));
    assert.deepStrictEqual(ctx, { identifier: 'of_close', qualifier: 'w_main', separator: '::' });
  });

  test('Extrae cualificador en expresiones concatenadas', () => {
    // Si estamos en "data", el cualificador inmediato es "object"
    const ctx = getInvocationContext(lines, Position.create(7, 14));
    assert.deepStrictEqual(ctx, { identifier: 'data', qualifier: 'object', separator: '.' });
  });

  test('Extrae evento desde TriggerEvent(this, "create")', () => {
    const ctx = getEventApiInvocationContext(['TriggerEvent(this, "create")'], Position.create(0, 22));
    assert.deepStrictEqual(ctx, { identifier: 'create', qualifier: 'this' });
  });

  test('Extrae evento desde cb_ok.PostEvent("clicked")', () => {
    const ctx = getEventApiInvocationContext(['cb_ok.PostEvent("clicked")'], Position.create(0, 18));
    assert.deepStrictEqual(ctx, { identifier: 'clicked', qualifier: 'cb_ok', separator: '.' });
  });

  test('Reconoce qualifiers e identifiers con $, # y %', () => {
    const ctx = getInvocationContext(lines, Position.create(8, 15));
    assert.deepStrictEqual(ctx, { identifier: 'uf_done%', qualifier: 'svc#main', separator: '.' });
  });

  test('Reconoce un símbolo con sufijo $ al final del identificador', () => {
    const ctx = getInvocationContext(lines, Position.create(9, 13));
    assert.deepStrictEqual(ctx, { identifier: 'of_total$', qualifier: 'this', separator: '.' });
  });
});
