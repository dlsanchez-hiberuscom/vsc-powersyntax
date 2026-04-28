import * as assert from 'assert/strict';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/knowledge', () => {
  suite('KnowledgeBase', () => {
    test('upsertDocument indexa símbolos globales', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///test.sru';
      const facts = [
        { id: 'f_test', name: 'f_test', kind: EntityKind.Function, uri },
        { id: 'u_test', name: 'u_test', kind: EntityKind.Type, uri }
      ];

      kb.upsertDocument(uri, facts);
      
      const f = kb.findDefinition('f_test');
      assert.ok(f);
      assert.equal(f?.name, 'f_test');
      assert.equal(f?.kind, EntityKind.Function);

      const u = kb.findDefinition('U_TEST'); // Case insensitive
      assert.ok(u);
      assert.equal(u?.name, 'u_test');
    });

    test('upsertDocument limpia conocimiento previo del mismo archivo', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///test.sru';
      
      kb.upsertDocument(uri, [{ id: 'old', name: 'old', kind: EntityKind.Function, uri }]);
      kb.upsertDocument(uri, [{ id: 'new', name: 'new', kind: EntityKind.Function, uri }]);

      assert.equal(kb.findDefinition('old'), null);
      assert.ok(kb.findDefinition('new'));
    });

    test('removeDocument elimina todo el conocimiento de un archivo', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///test.sru';
      kb.upsertDocument(uri, [{ id: 'f1', name: 'f1', kind: EntityKind.Function, uri }]);
      
      kb.removeDocument(uri);
      assert.equal(kb.findDefinition('f1'), null);
    });
  });
});
