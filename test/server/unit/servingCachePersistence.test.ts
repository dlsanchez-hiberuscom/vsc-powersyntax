import * as assert from 'assert/strict';

import { ServingCache } from '../../../src/server/knowledge/ServingCache';
import {
  persistServingCacheSnapshot,
  restoreServingCacheSnapshot
} from '../../../src/server/cache/servingCachePersistence';

suite('unit/servingCachePersistence', () => {
  test('persistServingCacheSnapshot exporta entradas al store', async () => {
    const cache = new ServingCache<{ label: string }>();
    cache.set('hover|file:///a.sru|1|2|5|', { label: 'A' });

    const captured: Array<{ key: string; value: { label: string } }> = [];
    await persistServingCacheSnapshot(cache, {
      async persistServingCacheSnapshot(entries) {
        captured.push(...entries as Array<{ key: string; value: { label: string } }>);
      }
    }, 5);

    assert.deepEqual(captured, [{ key: 'hover|file:///a.sru|1|2|5|', value: { label: 'A' }, insertedAt: undefined }]);
  });

  test('persistServingCacheSnapshot filtra entradas por epoch activa', async () => {
    const cache = new ServingCache<{ label: string }>();
    cache.set('hover|file:///a.sru|1|2|5|', { label: 'A' });
    cache.set('definition|file:///b.sru|3|1|4|', { label: 'stale' });
    cache.set('invalid-key', { label: 'invalid' });

    const captured: Array<{ key: string; value: { label: string } }> = [];
    await persistServingCacheSnapshot(cache, {
      async persistServingCacheSnapshot(entries) {
        captured.push(...entries as Array<{ key: string; value: { label: string } }>);
      }
    }, 5);

    assert.deepEqual(captured, [{ key: 'hover|file:///a.sru|1|2|5|', value: { label: 'A' }, insertedAt: undefined }]);
  });

  test('restoreServingCacheSnapshot rehidrata ServingCache desde el store', async () => {
    const cache = new ServingCache<{ label: string }>();
    await restoreServingCacheSnapshot(cache, {
      async loadServingCacheSnapshot<T>() {
        return [{ key: 'definition|file:///b.sru|3|1|5|', value: { label: 'B' } }] as unknown as Array<{ key: string; value: T }>;
      }
    }, 5);

    assert.deepEqual(cache.exportEntries(), [{ key: 'definition|file:///b.sru|3|1|5|', value: { label: 'B' }, insertedAt: undefined }]);
  });

  test('restoreServingCacheSnapshot filtra entradas por epoch esperada', async () => {
    const cache = new ServingCache<{ label: string }>();
    await restoreServingCacheSnapshot(cache, {
      async loadServingCacheSnapshot<T>() {
        return [
          { key: 'definition|file:///b.sru|3|1|5|', value: { label: 'B' } },
          { key: 'hover|file:///a.sru|1|2|4|', value: { label: 'stale' } },
          { key: 'invalid-key', value: { label: 'invalid' } }
        ] as unknown as Array<{ key: string; value: T }>;
      }
    }, 5);

    assert.deepEqual(cache.exportEntries(), [{ key: 'definition|file:///b.sru|3|1|5|', value: { label: 'B' }, insertedAt: undefined }]);
  });
});