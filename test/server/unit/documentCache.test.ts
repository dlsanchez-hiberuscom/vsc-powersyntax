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
      assert.equal(cache.size, 1);
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
  });
});
