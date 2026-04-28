import * as assert from 'assert/strict';

import {
  CancellationToken_None,
  createCancellationSource
} from '../../../src/server/runtime/cancellation';

suite('unit/cancellation', () => {
  test('CancellationToken_None nunca se cancela', () => {
    assert.equal(CancellationToken_None.isCancelled, false);
    
    // No debería lanzar error ni hacer nada
    CancellationToken_None.onCancelled(() => {
      assert.fail('Never should be called');
    });
  });

  test('CancellationSource crea un token cancelable', () => {
    const source = createCancellationSource();
    assert.equal(source.token.isCancelled, false);

    source.cancel();
    assert.equal(source.token.isCancelled, true);
  });

  test('CancellationSource invoca callbacks al cancelar', () => {
    const source = createCancellationSource();
    let called = 0;

    source.token.onCancelled(() => {
      called++;
    });

    source.token.onCancelled(() => {
      called++;
    });

    source.cancel();
    assert.equal(called, 2);
  });

  test('CancellationSource invoca callback inmediatamente si ya está cancelado', () => {
    const source = createCancellationSource();
    source.cancel();

    let called = false;
    source.token.onCancelled(() => {
      called = true;
    });

    assert.equal(called, true);
  });

  test('CancellationSource maneja errores en callbacks', () => {
    const source = createCancellationSource();
    let secondCalled = false;

    source.token.onCancelled(() => {
      throw new Error('Callback failed');
    });

    source.token.onCancelled(() => {
      secondCalled = true;
    });

    // No debería lanzar el error hacia arriba y debería llamar al segundo callback
    source.cancel();
    
    assert.equal(secondCalled, true);
  });
});
