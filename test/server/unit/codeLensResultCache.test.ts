import * as assert from 'assert/strict';
import { CodeLensResultCache } from '../../../src/server/features/codeLensResultCache';

suite('unit/codeLensResultCache', () => {
  test('devuelve hits solo cuando uri y key coinciden', () => {
    const cache = new CodeLensResultCache<string>(2);
    cache.set('file:///a.sru', 'epoch-1', 'lenses-a');

    assert.equal(cache.get('file:///a.sru', 'epoch-1'), 'lenses-a');
    assert.equal(cache.get('file:///a.sru', 'epoch-2'), undefined);
    assert.deepEqual(cache.getStats(), {
      size: 1,
      capacity: 2,
      hits: 1,
      misses: 1,
      evictions: 0,
    });
  });

  test('mantiene LRU acotado y cuenta evictions', () => {
    const cache = new CodeLensResultCache<string>(2);
    cache.set('file:///a.sru', 'k', 'a');
    cache.set('file:///b.sru', 'k', 'b');
    assert.equal(cache.get('file:///a.sru', 'k'), 'a');
    cache.set('file:///c.sru', 'k', 'c');

    assert.equal(cache.get('file:///b.sru', 'k'), undefined);
    assert.equal(cache.get('file:///a.sru', 'k'), 'a');
    assert.equal(cache.get('file:///c.sru', 'k'), 'c');
    assert.equal(cache.getStats().evictions, 1);
  });

  test('invalida por uri o todo el cache sin reiniciar contadores', () => {
    const cache = new CodeLensResultCache<string>(2);
    cache.set('file:///a.sru', 'k', 'a');
    cache.set('file:///b.sru', 'k', 'b');
    cache.invalidate('file:///a.sru');

    assert.equal(cache.get('file:///a.sru', 'k'), undefined);
    assert.equal(cache.getStats().size, 1);
    cache.invalidate();
    assert.equal(cache.getStats().size, 0);
    assert.equal(cache.getStats().misses, 1);
  });
});