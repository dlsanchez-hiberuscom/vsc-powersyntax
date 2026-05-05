import * as assert from 'assert/strict';
import { ServingCache, kbVersionFromKey, makeKey } from '../../../src/server/knowledge/ServingCache';
import { buildInteractiveServingCacheKey } from '../../../src/server/serving/cacheKeyContract';

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
      ttlMs: 0,
      byFeature: {
        hover: { size: 0, capacity: 1, hits: 0, misses: 0, evictions: 0 },
        completion: { size: 0, capacity: 1, hits: 0, misses: 0, evictions: 0 },
        signatureHelp: { size: 0, capacity: 0, hits: 0, misses: 0, evictions: 0 },
        definition: { size: 0, capacity: 0, hits: 0, misses: 0, evictions: 0 }
      }
    });
  });

  test('particiona la LRU por feature para evitar que completion expulse hover', () => {
    const cache = new ServingCache<string>(8);
    const hoverA = makeKey({ feature: 'hover', uri: 'file:///a.sru', line: 1, character: 1, kbVersion: 1, extra: 'a' });
    const hoverB = makeKey({ feature: 'hover', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 1, extra: 'b' });
    const completionA = makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 1, character: 1, kbVersion: 1, extra: 'a' });
    const completionB = makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 1, character: 2, kbVersion: 1, extra: 'b' });
    const completionC = makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 1, character: 3, kbVersion: 1, extra: 'c' });
    const completionD = makeKey({ feature: 'completion', uri: 'file:///a.sru', line: 1, character: 4, kbVersion: 1, extra: 'd' });

    cache.set(hoverA, 'hover-a');
    cache.set(hoverB, 'hover-b');
    cache.set(completionA, 'completion-a');
    cache.set(completionB, 'completion-b');
    cache.set(completionC, 'completion-c');
    cache.set(completionD, 'completion-d');

    assert.equal(cache.get(hoverA), 'hover-a');
    assert.equal(cache.get(hoverB), 'hover-b');
    assert.equal(cache.get(completionA), undefined);
    assert.equal(cache.get(completionB), 'completion-b');
    assert.equal(cache.get(completionC), 'completion-c');
    assert.equal(cache.get(completionD), 'completion-d');
    assert.equal(cache.getStats().byFeature.completion.evictions, 1);
    assert.equal(cache.getStats().byFeature.hover.size, 2);
  });

  test('acepta claves estructuradas del contrato nuevo para partición e invalidación', () => {
    const cache = new ServingCache<string>(8);
    const hoverKey = buildInteractiveServingCacheKey({
      cacheClass: 'serving',
      feature: 'hover',
      pressureClass: 'hot',
      uri: 'file:///a.sru',
      documentVersion: 1,
      kbVersion: 7,
      semanticEpoch: 9,
      sourceOrigin: 'workspace-ws_objects',
      locale: 'es',
      line: 4,
      character: 8,
    });
    const completionKey = buildInteractiveServingCacheKey({
      cacheClass: 'serving',
      feature: 'completion',
      pressureClass: 'heavy',
      uri: 'file:///a.sru',
      documentVersion: 1,
      kbVersion: 7,
      semanticEpoch: 9,
      sourceOrigin: 'workspace-ws_objects',
      locale: 'es',
      line: 4,
      character: 8,
      triggerKind: 1,
      triggerCharacter: '.',
    });

    cache.set(hoverKey, 'hover');
    cache.set(completionKey, 'completion');

    assert.equal(cache.get(hoverKey), 'hover');
    assert.equal(cache.get(completionKey), 'completion');
    assert.equal(cache.getStats().byFeature.hover.size, 1);
    assert.equal(cache.getStats().byFeature.completion.size, 1);

    cache.invalidate('file:///a.sru');

    assert.equal(cache.size(), 0);
    assert.equal(cache.getStats().byFeature.hover.size, 0);
    assert.equal(cache.getStats().byFeature.completion.size, 0);
  });

  test('claves estructuradas aislan sourceOrigin, locale y semanticEpoch sin colisionar', () => {
    const cache = new ServingCache<string>(32);
    const base = {
      cacheClass: 'serving' as const,
      feature: 'hover' as const,
      pressureClass: 'hot' as const,
      uri: 'file:///a.sru',
      documentVersion: 1,
      kbVersion: 7,
      semanticEpoch: 9,
      sourceOrigin: 'workspace-ws_objects' as const,
      locale: 'es',
      line: 4,
      character: 8,
    };
    const workspaceEs = buildInteractiveServingCacheKey(base);
    const solutionEs = buildInteractiveServingCacheKey({ ...base, sourceOrigin: 'solution-source' });
    const workspaceEn = buildInteractiveServingCacheKey({ ...base, locale: 'en' });
    const nextEpoch = buildInteractiveServingCacheKey({ ...base, semanticEpoch: 10 });
    const otherUri = buildInteractiveServingCacheKey({ ...base, uri: 'file:///b.sru' });

    cache.set(workspaceEs, 'workspace-es');
    cache.set(solutionEs, 'solution-es');
    cache.set(workspaceEn, 'workspace-en');
    cache.set(nextEpoch, 'workspace-es-epoch-10');
    cache.set(otherUri, 'other-uri');

    assert.equal(cache.get(workspaceEs), 'workspace-es');
    assert.equal(cache.get(solutionEs), 'solution-es');
    assert.equal(cache.get(workspaceEn), 'workspace-en');
    assert.equal(cache.get(nextEpoch), 'workspace-es-epoch-10');

    cache.invalidate('file:///a.sru');

    assert.equal(cache.get(workspaceEs), undefined);
    assert.equal(cache.get(solutionEs), undefined);
    assert.equal(cache.get(workspaceEn), undefined);
    assert.equal(cache.get(nextEpoch), undefined);
    assert.equal(cache.get(otherUri), 'other-uri');
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
    const structuredKey = buildInteractiveServingCacheKey({
      cacheClass: 'serving',
      feature: 'hover',
      pressureClass: 'hot',
      uri: 'file:///a.sru',
      documentVersion: 1,
      kbVersion: 8,
      semanticEpoch: 9,
      sourceOrigin: 'workspace-ws_objects',
      locale: 'en',
      line: 1,
      character: 2,
    });

    assert.equal(kbVersionFromKey(validKey), 7);
    assert.equal(kbVersionFromKey(structuredKey), 8);
    assert.equal(kbVersionFromKey('hover|file:///a.sru|1|2|not-a-number|.'), null);
    assert.equal(kbVersionFromKey('invalid-key'), null);
  });
});
