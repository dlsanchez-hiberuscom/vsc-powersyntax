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
  });
});
