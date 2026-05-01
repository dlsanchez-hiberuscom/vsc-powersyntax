import * as assert from 'assert/strict';

import { cacheServingResult, invalidateServingCacheEntries } from '../../../src/server/cache/servingCacheRuntime';
import { ServingCache } from '../../../src/server/knowledge/ServingCache';

suite('unit/servingCacheRuntime', () => {
  test('cacheServingResult guarda el valor aunque no haya coordinador', () => {
    const cache = new ServingCache<{ label: string }>();

    cacheServingResult(cache, 'hover|file:///a.sru|1|2|5|', { label: 'A' });

    assert.deepEqual(cache.exportEntries(), [{ key: 'hover|file:///a.sru|1|2|5|', value: { label: 'A' }, insertedAt: undefined }]);
  });

  test('cacheServingResult marca dirty y pide flush cuando hay coordinador', () => {
    const cache = new ServingCache<{ label: string }>();
    let markedDirty = 0;
    let flushCalls = 0;

    cacheServingResult(
      cache,
      'hover|file:///a.sru|1|2|5|',
      { label: 'A' },
      {
        markDirty() {
          markedDirty += 1;
        },
        async flushIfDirty() {
          flushCalls += 1;
          return true;
        }
      }
    );

    assert.equal(markedDirty, 1);
    assert.equal(flushCalls, 1);
    assert.deepEqual(cache.exportEntries(), [{ key: 'hover|file:///a.sru|1|2|5|', value: { label: 'A' }, insertedAt: undefined }]);
  });

  test('invalidateServingCacheEntries invalida URIs concretas y pide flush', () => {
    const cache = new ServingCache<{ label: string }>();
    cache.set('hover|file:///a.sru|1|2|5|', { label: 'A' });
    cache.set('definition|file:///b.sru|3|1|5|', { label: 'B' });

    let markedDirty = 0;
    let flushCalls = 0;

    invalidateServingCacheEntries(cache, ['file:///a.sru'], {
      markDirty() {
        markedDirty += 1;
      },
      async flushIfDirty() {
        flushCalls += 1;
        return true;
      }
    });

    assert.equal(markedDirty, 1);
    assert.equal(flushCalls, 1);
    assert.deepEqual(cache.exportEntries(), [{ key: 'definition|file:///b.sru|3|1|5|', value: { label: 'B' }, insertedAt: undefined }]);
  });

  test('invalidateServingCacheEntries vacia la cache completa sin URIs', () => {
    const cache = new ServingCache<{ label: string }>();
    cache.set('hover|file:///a.sru|1|2|5|', { label: 'A' });

    invalidateServingCacheEntries(cache);

    assert.deepEqual(cache.exportEntries(), []);
  });
});