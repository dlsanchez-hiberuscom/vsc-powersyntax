import * as assert from 'assert';
import { Position } from 'vscode-languageserver/node';
import { getInvocationContext } from '../../../src/server/utils/invocationContext';

suite('server/utils/invocationContext', () => {
  const lines = [
    'of_init()',                                 // 0
    'this.of_init()',                            // 1
    'super::of_init()',                          // 2
    'lnv_service  .  of_init()',                 // 3
    'w_main::of_close()',                        // 4
    'dw_1.object.data[1].value'                  // 5
  ];

  test('Extrae identifier sin cualificador', () => {
    const ctx = getInvocationContext(lines, Position.create(0, 3));
    assert.deepStrictEqual(ctx, { identifier: 'of_init' });
  });

  test('Extrae this como cualificador', () => {
    const ctx = getInvocationContext(lines, Position.create(1, 8));
    assert.deepStrictEqual(ctx, { identifier: 'of_init', qualifier: 'this' });
  });

  test('Extrae super como cualificador', () => {
    const ctx = getInvocationContext(lines, Position.create(2, 9));
    assert.deepStrictEqual(ctx, { identifier: 'of_init', qualifier: 'super' });
  });

  test('Extrae variable con espacios', () => {
    const ctx = getInvocationContext(lines, Position.create(3, 20));
    assert.deepStrictEqual(ctx, { identifier: 'of_init', qualifier: 'lnv_service' });
  });

  test('Extrae cualificador con doble punto estático', () => {
    const ctx = getInvocationContext(lines, Position.create(4, 12));
    assert.deepStrictEqual(ctx, { identifier: 'of_close', qualifier: 'w_main' });
  });

  test('Extrae cualificador en expresiones concatenadas', () => {
    // Si estamos en "data", el cualificador inmediato es "object"
    const ctx = getInvocationContext(lines, Position.create(5, 14));
    assert.deepStrictEqual(ctx, { identifier: 'data', qualifier: 'object' });
  });
});
