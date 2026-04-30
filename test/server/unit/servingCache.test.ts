import * as assert from 'assert/strict';
import { ServingCache, makeKey } from '../../../src/server/knowledge/ServingCache';

suite('unit/ServingCache', () => {
  test('makeKey produce claves estables y diferenciadas', () => {
    const a = makeKey({ feature: 'hover', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 5 });
    const b = makeKey({ feature: 'hover', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 5 });
    const c = makeKey({ feature: 'hover', uri: 'file:///a.sru', line: 1, character: 3, kbVersion: 5 });
    const d = makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 5 });

    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.notEqual(a, d);
  });

  test('makeKey incluye extra y kbVersion', () => {
    const k1 = makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 5, extra: '.' });
    const k2 = makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 5, extra: ',' });
    const k3 = makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 6, extra: '.' });
    assert.notEqual(k1, k2);
    assert.notEqual(k1, k3);
  });

  test('get/set funciona', () => {
    const cache = new ServingCache<string>();
    cache.set('a', 'A');
    assert.equal(cache.get('a'), 'A');
    assert.equal(cache.get('missing'), undefined);
  });

  test('LRU evicta el más antiguo al superar maxEntries', () => {
    const cache = new ServingCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4); // expulsa 'a'

    assert.equal(cache.size(), 3);
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('d'), 4);
  });

  test('get reordena LRU (mantiene la entrada como reciente)', () => {
    const cache = new ServingCache<number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Acceder a 'a' debería evitar que sea evictada al insertar 'd'.
    cache.get('a');
    cache.set('d', 4);

    assert.equal(cache.get('a'), 1);
    assert.equal(cache.get('b'), undefined);
  });

  test('invalidate(uri) elimina solo entradas de esa URI', () => {
    const cache = new ServingCache<string>();
    const k1 = makeKey({ feature: 'hover', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 1 });
    const k2 = makeKey({ feature: 'hover', uri: 'file:///b.sru', line: 1, character: 2, kbVersion: 1 });
    cache.set(k1, 'A');
    cache.set(k2, 'B');

    cache.invalidate('file:///a.sru');

    assert.equal(cache.get(k1), undefined);
    assert.equal(cache.get(k2), 'B');
  });

  test('invalidate() borra todo', () => {
    const cache = new ServingCache<string>();
    cache.set('a', 'A');
    cache.set('b', 'B');

    cache.invalidate();
    assert.equal(cache.size(), 0);
  });
});
