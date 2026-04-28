import * as assert from 'assert/strict';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/knowledge', () => {
  suite('KnowledgeBase', () => {
    test('upsertDocument indexa símbolos globales', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///test.sru';
      const facts = [
        { id: 'f_test', name: 'f_test', kind: EntityKind.Function, uri, line: 10, character: 0 },
        { id: 'u_test', name: 'u_test', kind: EntityKind.Type, uri, line: 20, character: 0 }
      ];

      kb.upsertDocument(uri, facts);
      
      const f = kb.findDefinition('f_test');
      assert.ok(f);
      assert.equal(f?.name, 'f_test');
      assert.equal(f?.kind, EntityKind.Function);
      assert.equal(f?.line, 10);

      const u = kb.findDefinition('U_TEST'); // Case insensitive
      assert.ok(u);
      assert.equal(u?.name, 'u_test');
    });

    test('upsertDocument limpia conocimiento previo del mismo archivo', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///test.sru';
      
      kb.upsertDocument(uri, [{ id: 'old', name: 'old', kind: EntityKind.Function, uri, line: 1, character: 0 }]);
      kb.upsertDocument(uri, [{ id: 'new', name: 'new', kind: EntityKind.Function, uri, line: 5, character: 0 }]);

      assert.equal(kb.findDefinition('old'), null);
      assert.ok(kb.findDefinition('new'));
    });

    test('removeDocument elimina todo el conocimiento de un archivo', () => {
      const kb = new KnowledgeBase();
      const uri = 'file:///test.sru';
      kb.upsertDocument(uri, [{ id: 'f1', name: 'f1', kind: EntityKind.Function, uri, line: 1, character: 0 }]);
      
      kb.removeDocument(uri);
      assert.equal(kb.findDefinition('f1'), null);
    });

    test('soporta múltiples archivos con el mismo nombre de símbolo (D1)', () => {
      const kb = new KnowledgeBase();
      const uriA = 'file:///w_main.sru';
      const uriB = 'file:///w_detail.sru';

      kb.upsertDocument(uriA, [{ id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: uriA, line: 10, character: 0 }]);
      kb.upsertDocument(uriB, [{ id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: uriB, line: 20, character: 0 }]);

      // Ambas definiciones deben existir
      const all = kb.findAllDefinitions('of_SetData');
      assert.equal(all.length, 2);

      // findDefinition devuelve la primera
      const first = kb.findDefinition('of_SetData');
      assert.ok(first);
    });

    test('removeDocument no elimina entidades de otros archivos con el mismo nombre (D1)', () => {
      const kb = new KnowledgeBase();
      const uriA = 'file:///w_main.sru';
      const uriB = 'file:///w_detail.sru';

      kb.upsertDocument(uriA, [{ id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: uriA, line: 10, character: 0 }]);
      kb.upsertDocument(uriB, [{ id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: uriB, line: 20, character: 0 }]);

      // Eliminar archivo A
      kb.removeDocument(uriA);

      // La entidad de archivo B debe sobrevivir
      const all = kb.findAllDefinitions('of_SetData');
      assert.equal(all.length, 1);
      assert.equal(all[0].uri, uriB);
    });
  });
});
