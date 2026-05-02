import * as assert from 'assert/strict';
import { ServingCache, kbVersionFromKey, makeKey } from '../../../src/server/knowledge/ServingCache';

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

  test('makeKey cubre de forma estable los query types interactivos soportados', () => {
    const hover = makeKey({ feature: 'hover', uri: 'file:///a.sru', line: 4, character: 8, kbVersion: 3 });
    const definition = makeKey({ feature: 'definition', uri: 'file:///a.sru', line: 4, character: 8, kbVersion: 3 });
    const signatureHelp = makeKey({ feature: 'signatureHelp', uri: 'file:///a.sru', line: 4, character: 8, kbVersion: 3 });
    const completion = makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 4, character: 8, kbVersion: 3, extra: '1|.' });

    assert.notEqual(hover, definition);
    assert.notEqual(definition, signatureHelp);
    assert.notEqual(signatureHelp, completion);
    assert.equal(
      completion,
      makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 4, character: 8, kbVersion: 3, extra: '1|.' })
    );
  });

  test('get/set funciona', () => {
    const cache = new ServingCache<string>();
    cache.set('a', 'A');
    assert.equal(cache.get('a'), 'A');
    assert.equal(cache.get('missing'), undefined);
  });

  test('getStats hace observable el hit ratio y las evictions', () => {
    const cache = new ServingCache<string>(2);
    cache.set('a', 'A');
    cache.set('b', 'B');

    assert.equal(cache.get('a'), 'A');
    assert.equal(cache.get('missing'), undefined);

    cache.set('c', 'C');

    assert.deepEqual(cache.getStats(), {
      size: 2,
      capacity: 2,
      hits: 1,
      misses: 1,
      evictions: 1,
      ttlMs: 0
    });
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

  test('observer recibe hits, misses e invalidaciones con métricas acumuladas', () => {
    const events: Array<{ action: string; removed?: number; hits: number; misses: number }> = [];
    const cache = new ServingCache<string>(4, 0, (event) => {
      events.push({
        action: event.action,
        removed: event.removed,
        hits: event.hits,
        misses: event.misses,
      });
    });
    const key = makeKey({ feature: 'hover', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 1 });

    cache.set(key, 'A');
    cache.get(key);
    cache.get('missing');
    cache.invalidate('file:///a.sru');

    assert.deepEqual(events.map((event) => event.action), ['set', 'hit', 'miss', 'invalidate']);
    assert.equal(events[1].hits, 1);
    assert.equal(events[2].misses, 1);
    assert.equal(events[3].removed, 1);
  });

  test('exportEntries y restoreEntries preservan LRU y copia defensiva', () => {
    const cache = new ServingCache<{ label: string }>(3);
    cache.set('a', { label: 'A' });
    cache.set('b', { label: 'B' });
    cache.get('a');

    const exported = cache.exportEntries();

    const restored = new ServingCache<{ label: string }>(3);
    restored.restoreEntries(exported);

    exported[0].value.label = 'mutated';

    assert.deepEqual(
      restored.exportEntries().map((entry) => [entry.key, entry.value.label]),
      [['b', 'B'], ['a', 'A']]
    );
    assert.deepEqual(
      cache.exportEntries().map((entry) => [entry.key, entry.value.label]),
      [['b', 'B'], ['a', 'A']]
    );

    restored.set('c', { label: 'C' });
    restored.set('d', { label: 'D' });

    assert.deepEqual(restored.exportEntries().map((entry) => entry.key), ['a', 'c', 'd']);
  });

  test('kbVersionFromKey extrae la epoch de una clave válida y degrada en claves inválidas', () => {
    const validKey = makeKey({ feature: 'hover', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 7, extra: '.' });

    assert.equal(kbVersionFromKey(validKey), 7);
    assert.equal(kbVersionFromKey('hover|file:///a.sru|1|2|not-a-number|.'), null);
    assert.equal(kbVersionFromKey('invalid-key'), null);
  });
});
