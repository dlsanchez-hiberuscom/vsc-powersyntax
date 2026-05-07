import * as assert from 'assert/strict';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/knowledge', () => {
  suite('DocumentCache', () => {
    test('guarda y recupera entradas correctamente', () => {
      const cache = new DocumentCache();
      const uri = 'file:///test.sru';
      const entry = {
        version: 'hash1',
        symbols: [],
        facts: [{ id: 'f_test', name: 'f_test', kind: EntityKind.Function, uri, line: 0, character: 0 }],
        scopes: []
      };

      cache.set(uri, entry);
      assert.deepEqual(cache.get(uri), entry);
      assert.deepEqual(cache.getSnapshot(uri), undefined);
      assert.equal(cache.size, 1);
    });

    test('recupera snapshot semántico cuando existe', () => {
      const cache = new DocumentCache();
      const uri = 'file:///snapshot.sru';
      cache.set(uri, {
        version: 'hash2',
        symbols: [],
        facts: [],
        scopes: [],
        snapshot: {
          uri,
          version: 1,
          fingerprint: 123,
          identity: `${uri}@123`,
          pass: 'enriched',
          readiness: 'nearby-semantic-ready',
          containerModel: { sections: [], typeBlocks: [] },
          symbols: [],
          scopes: [],
          logicalStatements: [],
          maskedText: { lines: [], masks: [] },
          controlBlocks: []
        }
      });

      assert.ok(cache.getSnapshot(uri));
      assert.equal(cache.getSnapshot(uri)?.fingerprint, 123);
    });

    test('valida correctamente por version/hash', () => {
      const cache = new DocumentCache();
      const uri = 'file:///test.sru';
      cache.set(uri, { version: 'v1', symbols: [], facts: [], scopes: [] });

      assert.ok(cache.isValid(uri, 'v1'));
      assert.ok(!cache.isValid(uri, 'v2'));
      assert.ok(!cache.isValid('file:///other.sru', 'v1'));
    });

    test('invalida entradas', () => {
      const cache = new DocumentCache();
      const uri = 'file:///test.sru';
      cache.set(uri, { version: 'v1', symbols: [], facts: [], scopes: [] });
      
      cache.invalidate(uri);
      assert.equal(cache.get(uri), undefined);
    });

    test('exporta y restaura registros con version persistente', () => {
      const cache = new DocumentCache();
      const uri = 'file:///persist.sru';
      cache.set(uri, { version: 'hash-persist', symbols: [], facts: [], scopes: [] });

      const exported = cache.exportDocumentRecords();
      const restored = new DocumentCache();
      restored.restoreDocumentRecords(exported);

      assert.ok(restored.isValid(uri, 'hash-persist'));
      assert.equal(restored.get(uri)?.symbols.length, 0);
    });

    test('restoreDocumentRecords copia defensivamente el input', () => {
      const cache = new DocumentCache();
      const records = [{ uri: 'file:///persist.sru', version: 'hash-persist', facts: [], scopes: [] }];

      cache.restoreDocumentRecords(records);
      records[0].version = 'mutated';

      assert.ok(cache.isValid('file:///persist.sru', 'hash-persist'));
    });

    test('set y get no exponen referencias mutables', () => {
      const cache = new DocumentCache();
      const uri = 'file:///mutable.sru';
      const entry = {
        version: 'hash-live',
        symbols: [],
        facts: [{ id: 'f_live', name: 'f_live', kind: EntityKind.Function, uri, line: 0, character: 0 }],
        scopes: [],
        snapshot: {
          uri,
          version: 1,
          fingerprint: 1,
          identity: `${uri}@1`,
          pass: 'enriched' as const,
          readiness: 'nearby-semantic-ready' as const,
          containerModel: { sections: [], typeBlocks: [] },
          symbols: [{ id: 'f_live', name: 'f_live', kind: EntityKind.Function, uri, line: 0, character: 0 }],
          scopes: [],
          logicalStatements: [],
          maskedText: { lines: ['x'], masks: [new Uint8Array([0])] },
          controlBlocks: []
        }
      };

      cache.set(uri, entry);
      entry.facts[0].name = 'mutated-outside';

      const readA = cache.get(uri)!;
      readA.facts[0].name = 'mutated-read';
      readA.snapshot!.symbols[0].name = 'mutated-snapshot';

      const readB = cache.get(uri)!;
      assert.equal(readB.facts[0].name, 'f_live');
      assert.equal(readB.snapshot!.symbols[0].name, 'f_live');
    });

    test('getStats expone strings internados y los libera al invalidar', () => {
      const cache = new DocumentCache();
      const uri = 'file:///compact-cache.sru';

      cache.set(uri, {
        version: 'hash-compact',
        symbols: [],
        facts: [
          { id: 'w_cache.of_init', name: 'of_init', kind: EntityKind.Function, uri, line: 0, character: 0, containerName: 'w_cache' },
          { id: 'w_cache.of_run', name: 'of_run', kind: EntityKind.Function, uri, line: 3, character: 0, containerName: 'w_cache' }
        ],
        scopes: [],
        snapshot: {
          uri,
          version: 1,
          fingerprint: 7,
          identity: `${uri}@7`,
          pass: 'enriched',
          readiness: 'nearby-semantic-ready',
          containerModel: { sections: [], typeBlocks: [{ name: 'w_cache', startLine: 0, endLine: 10 }] },
          symbols: [
            { id: 'w_cache.of_init', name: 'of_init', kind: EntityKind.Function, uri, line: 0, character: 0, containerName: 'w_cache' }
          ],
          scopes: [],
          logicalStatements: [],
          maskedText: { lines: [], masks: [] },
          controlBlocks: []
        }
      });

      assert.ok(cache.getStats().internedStrings > 0);

      cache.invalidate(uri);
      assert.equal(cache.getStats().internedStrings, 0);
    });

    // ===================================================================
    // CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01 — New LRU + pin tests
    // ===================================================================

    test('respeta maxEntries y evicta entradas unpinned por LRU', () => {
      const cache = new DocumentCache(3);
      cache.set('file:///a.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.set('file:///b.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.set('file:///c.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });

      assert.equal(cache.size, 3);

      // Adding 4th entry should evict oldest (a.sru)
      cache.set('file:///d.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      assert.equal(cache.size, 3);
      assert.equal(cache.get('file:///a.sru'), undefined, 'Oldest unpinned entry should be evicted');
      assert.ok(cache.get('file:///b.sru'), 'b.sru should remain');
      assert.ok(cache.get('file:///d.sru'), 'd.sru should exist');
    });

    test('pinned entries nunca se evictan por LRU', () => {
      const cache = new DocumentCache(3);
      cache.set('file:///a.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.set('file:///b.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.set('file:///c.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });

      // Pin a.sru (oldest)
      cache.pin('file:///a.sru');

      // Adding 4th entry: a.sru is pinned, so b.sru (next oldest unpinned) is evicted
      cache.set('file:///d.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      assert.equal(cache.size, 3);
      assert.ok(cache.get('file:///a.sru'), 'Pinned a.sru should survive');
      assert.equal(cache.get('file:///b.sru'), undefined, 'Unpinned b.sru should be evicted');
      assert.ok(cache.get('file:///c.sru'), 'c.sru should remain');
      assert.ok(cache.get('file:///d.sru'), 'd.sru should exist');
    });

    test('unpin permite eviction posterior', () => {
      const cache = new DocumentCache(3);
      cache.set('file:///a.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.pin('file:///a.sru');
      cache.set('file:///b.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.set('file:///c.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });

      // At capacity 3 with a pinned. Adding d evicts b (oldest unpinned)
      cache.set('file:///d.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      assert.ok(cache.isValid('file:///a.sru', 'v1'), 'a.sru is pinned, should survive');
      assert.equal(cache.isValid('file:///b.sru', 'v1'), false, 'b.sru unpinned and oldest');
      assert.ok(cache.isValid('file:///c.sru', 'v1'), 'c.sru should remain');
      assert.ok(cache.isValid('file:///d.sru', 'v1'), 'd.sru should exist');

      // Now unpin a, add e — a should be evictable (oldest in LRU)
      cache.unpin('file:///a.sru');
      cache.set('file:///e.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      assert.equal(cache.isValid('file:///a.sru', 'v1'), false, 'Unpinned a.sru should now be evicted');
      assert.ok(cache.isValid('file:///c.sru', 'v1'), 'c.sru should remain');
      assert.ok(cache.isValid('file:///d.sru', 'v1'), 'd.sru should remain');
      assert.ok(cache.isValid('file:///e.sru', 'v1'), 'e.sru should exist');
    });

    test('isPinned reporta estado correcto', () => {
      const cache = new DocumentCache();
      const uri = 'file:///test.sru';
      assert.equal(cache.isPinned(uri), false);

      cache.pin(uri);
      assert.equal(cache.isPinned(uri), true);

      cache.unpin(uri);
      assert.equal(cache.isPinned(uri), false);
    });

    test('getStats reporta capacity, pinnedCount y evictions', () => {
      const cache = new DocumentCache(2);
      cache.set('file:///a.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.pin('file:///a.sru');
      cache.set('file:///b.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });

      let stats = cache.getStats();
      assert.equal(stats.size, 2);
      assert.equal(stats.capacity, 2);
      assert.equal(stats.pinnedCount, 1);
      assert.equal(stats.evictions, 0);

      // Trigger eviction
      cache.set('file:///c.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      stats = cache.getStats();
      assert.equal(stats.size, 2);
      assert.equal(stats.evictions, 1);
      assert.equal(stats.pinnedCount, 1);
    });

    test('evictUnpinned reduce tamaño al target solicitado', () => {
      const cache = new DocumentCache(10);
      for (let i = 0; i < 8; i++) {
        cache.set(`file:///${i}.sru`, { version: 'v1', symbols: [], facts: [], scopes: [] });
      }
      cache.pin('file:///0.sru');
      cache.pin('file:///7.sru');

      assert.equal(cache.size, 8);

      const evicted = cache.evictUnpinned(3);
      assert.equal(evicted, 5); // 8 - 3 = 5 unpinned evicted
      assert.equal(cache.size, 3);
      assert.ok(cache.get('file:///0.sru'), 'Pinned 0 should survive');
      assert.ok(cache.get('file:///7.sru'), 'Pinned 7 should survive');
    });

    test('LRU get() refresca el orden de eviction', () => {
      const cache = new DocumentCache(3);
      cache.set('file:///a.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.set('file:///b.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.set('file:///c.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });

      // Touch a.sru via get() — moves it to end of LRU
      cache.get('file:///a.sru');

      // Now add d.sru — b.sru should be evicted (oldest untouched), not a.sru
      cache.set('file:///d.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      assert.ok(cache.get('file:///a.sru'), 'a.sru was touched, should survive');
      assert.equal(cache.get('file:///b.sru'), undefined, 'b.sru is oldest untouched, should be evicted');
    });

    test('clear limpia pinned y cache completamente', () => {
      const cache = new DocumentCache(10);
      cache.set('file:///a.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.pin('file:///a.sru');

      cache.clear();
      assert.equal(cache.size, 0);
      assert.equal(cache.isPinned('file:///a.sru'), false);
      assert.equal(cache.getStats().pinnedCount, 0);
    });

    test('invalidate también quita el pin', () => {
      const cache = new DocumentCache(10);
      const uri = 'file:///a.sru';
      cache.set(uri, { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.pin(uri);
      assert.equal(cache.isPinned(uri), true);

      cache.invalidate(uri);
      assert.equal(cache.isPinned(uri), false);
      assert.equal(cache.get(uri), undefined);
    });

    test('set en URI existente refresca posición LRU', () => {
      const cache = new DocumentCache(3);
      cache.set('file:///a.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.set('file:///b.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      cache.set('file:///c.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });

      // Re-set a.sru with updated version — should move to end
      cache.set('file:///a.sru', { version: 'v2', symbols: [], facts: [], scopes: [] });

      // Add d.sru — b.sru should be evicted (now oldest)
      cache.set('file:///d.sru', { version: 'v1', symbols: [], facts: [], scopes: [] });
      assert.ok(cache.get('file:///a.sru'), 'Re-set a.sru should be refreshed');
      assert.equal(cache.get('file:///b.sru'), undefined, 'b.sru should be evicted');
      assert.equal(cache.get('file:///a.sru')?.version, 'v2', 'a.sru should have updated version');
    });
  });
});
