import * as assert from 'assert/strict';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { provideDefinition } from '../../../src/server/features/definition';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/definition', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);

    kb.beginBatchUpdate();
    // w_base con of_setdata
    kb.upsertDocument('file:///w_base.sru', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base.sru', line: 0, character: 0 },
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, containerName: 'w_base', uri: 'file:///w_base.sru', line: 10, character: 4 }
    ]);
    
    // w_main hereda de w_base, sobrescribe of_setdata
    kb.upsertDocument('file:///w_main.sru', [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, baseTypeName: 'w_base', uri: 'file:///w_main.sru', line: 0, character: 0 },
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, containerName: 'w_main', uri: 'file:///w_main.sru', line: 20, character: 4 },
      // Una variable local de tipo w_base
      { id: 'lw_window', name: 'lw_window', kind: EntityKind.Variable, datatype: 'w_base', containerName: 'w_main', uri: 'file:///w_main.sru', line: 5, character: 0 }
    ]);
    kb.endBatchUpdate();
  });

  test('provideDefinition returns null if no valid identifier under cursor', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  =  ');
    const loc = provideDefinition(doc, Position.create(0, 2), kb, graph);
    assert.equal(loc, null);
  });

  test('provideDefinition returns null if identifier not in KB', () => {
    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  of_unknown()  ');
    const loc = provideDefinition(doc, Position.create(0, 5), kb, graph);
    assert.equal(loc, null);
  });

  test('provideDefinition: unqualified method resolves to current object hierarchy (nearest override)', () => {
    // Si estamos en w_main y llamamos of_SetData() sin cualificador, debería ir a w_main.of_SetData.
    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  of_SetData()  ');
    
    const loc = provideDefinition(doc, Position.create(0, 5), kb, graph);
    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///w_main.sru');
      assert.equal(loc.range.start.line, 20);
    }
  });

  test('provideDefinition: super::method resolves strictly to ancestor implementation', () => {
    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  super::of_SetData()  ');
    
    const loc = provideDefinition(doc, Position.create(0, 12), kb, graph);
    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      // Debe saltar a w_base, ignorando el of_SetData de w_main
      assert.equal(loc.uri, 'file:///w_base.sru');
      assert.equal(loc.range.start.line, 10);
    }
  });

  test('provideDefinition: variable.method resolves to variable datatype hierarchy', () => {
    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  lw_window.of_SetData()  ');
    
    const loc = provideDefinition(doc, Position.create(0, 15), kb, graph);
    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      // lw_window es de tipo w_base, debe ir al of_SetData de w_base
      assert.equal(loc.uri, 'file:///w_base.sru');
    }
  });

  test('provideDefinition: fallback to global search if no qualifier and not found in hierarchy', () => {
    // Definimos una global_func en otro archivo
    kb.upsertDocument('file:///global.srf', [
      { id: 'global_func', name: 'global_func', kind: EntityKind.Function, uri: 'file:///global.srf', line: 1, character: 0 }
    ]);

    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  global_func()  ');
    const loc = provideDefinition(doc, Position.create(0, 5), kb, graph);
    
    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///global.srf');
    }
  });
});

