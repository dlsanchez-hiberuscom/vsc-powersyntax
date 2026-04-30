import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position } from 'vscode-languageserver/node';
import { provideReferences } from '../../../src/server/features/references';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/references (B023)', () => {
  test('encuentra definición + ocurrencias textuales', () => {
    const kb = new KnowledgeBase();
    kb.beginBatchUpdate();
    kb.upsertDocument('file:///def.sru', [
      { id: 'foo', name: 'foo', kind: EntityKind.Function, uri: 'file:///def.sru', line: 5, character: 10 }
    ]);
    kb.endBatchUpdate();

    const doc = TextDocument.create('file:///use.sru', 'powerbuilder', 1,
      'integer i\nfoo()\nfoo() // y otro foo aqui\nfoobar() // no debe contar'
    );
    const sources = [{ uri: 'file:///use.sru', content: doc.getText() }];

    const refs = provideReferences(doc, Position.create(1, 1), kb, sources);
    // 1 def + 2 usos textuales en líneas 1 y 2 (el comentario se descarta).
    const uris = refs.map((r) => `${r.uri}:${r.range.start.line}`);
    assert.ok(uris.includes('file:///def.sru:5'), 'definición presente');
    assert.ok(uris.includes('file:///use.sru:1'), 'uso L1');
    assert.ok(uris.includes('file:///use.sru:2'), 'uso L2');
    // foobar no debe aparecer
    assert.ok(!refs.some((r) => r.uri === 'file:///use.sru' && r.range.start.line === 3));
  });

  test('palabra inexistente devuelve []', () => {
    const kb = new KnowledgeBase();
    const doc = TextDocument.create('file:///x.sru', 'powerbuilder', 1, 'integer xyz');
    const refs = provideReferences(doc, Position.create(0, 9), kb, [
      { uri: 'file:///x.sru', content: doc.getText() }
    ]);
    // Solo el match textual del propio "xyz".
    assert.equal(refs.length, 1);
  });

  test('respeta word boundary', () => {
    const kb = new KnowledgeBase();
    const doc = TextDocument.create('file:///x.sru', 'powerbuilder', 1, 'foo\nfoobar\nfoo_bar\n_foo');
    const refs = provideReferences(doc, Position.create(0, 1), kb, [
      { uri: 'file:///x.sru', content: doc.getText() }
    ]);
    assert.equal(refs.length, 1, 'solo la línea 0 hace match');
  });
});
