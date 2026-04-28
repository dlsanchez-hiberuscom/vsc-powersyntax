import * as assert from 'assert/strict';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { provideDefinition } from '../../../src/server/features/definition';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/definition', () => {
  let kb: KnowledgeBase;

  setup(() => {
    kb = new KnowledgeBase();
    kb.upsertDocument('file:///w_main.sru', [
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: 'file:///w_main.sru', line: 10, character: 4 }
    ]);
    kb.upsertDocument('file:///w_detail.sru', [
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, uri: 'file:///w_detail.sru', line: 20, character: 4 }
    ]);
  });

  test('provideDefinition returns null if no valid identifier under cursor', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  =  ');
    const loc = provideDefinition(doc, Position.create(0, 2), kb);
    assert.equal(loc, null);
  });

  test('provideDefinition returns null if identifier not in KB', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  of_unknown()  ');
    const loc = provideDefinition(doc, Position.create(0, 5), kb);
    assert.equal(loc, null);
  });

  test('provideDefinition returns single Location if unique definition', () => {
    kb.upsertDocument('file:///n_cst.sru', [
      { id: 'of_unique', name: 'of_Unique', kind: EntityKind.Function, uri: 'file:///n_cst.sru', line: 5, character: 0 }
    ]);
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  of_Unique()  ');
    
    const loc = provideDefinition(doc, Position.create(0, 5), kb);
    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///n_cst.sru');
      assert.equal(loc.range.start.line, 5);
      assert.equal(loc.range.start.character, 0);
    }
  });

  test('provideDefinition returns Location[] if multiple definitions (overloading)', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  of_SetData()  ');
    
    const locs = provideDefinition(doc, Position.create(0, 5), kb);
    assert.ok(Array.isArray(locs));
    if (Array.isArray(locs)) {
      assert.equal(locs.length, 2);
      assert.ok(locs.some(l => l.uri === 'file:///w_main.sru'));
      assert.ok(locs.some(l => l.uri === 'file:///w_detail.sru'));
    }
  });

  test('provideDefinition extracts correctly with prefixes (this., parent.)', () => {
    kb.upsertDocument('file:///n_cst.sru', [
      { id: 'of_do', name: 'of_do', kind: EntityKind.Function, uri: 'file:///n_cst.sru', line: 5, character: 0 }
    ]);
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  this.of_do()  ');
    
    // Position on 'of_do'
    const loc = provideDefinition(doc, Position.create(0, 8), kb);
    assert.ok(loc && !Array.isArray(loc));
  });
});
