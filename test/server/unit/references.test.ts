import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position } from 'vscode-languageserver/node';
import { provideReferences } from '../../../src/server/features/references';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';

suite('unit/references (B023)', () => {
  test('encuentra definición + ocurrencias textuales', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    kb.beginBatchUpdate();
    kb.upsertDocument('file:///def.sru', [
      { id: 'foo', name: 'foo', kind: EntityKind.Function, uri: 'file:///def.sru', line: 5, character: 10 }
    ]);
    kb.endBatchUpdate();

    const doc = TextDocument.create('file:///use.sru', 'powerbuilder', 1,
      'integer i\nfoo()\nfoo() // y otro foo aqui\nfoobar() // no debe contar'
    );
    const sources = [{ uri: 'file:///use.sru', content: doc.getText() }];

    const refs = provideReferences(doc, Position.create(1, 1), kb, graph, sources);
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
    const graph = new InheritanceGraph(kb);
    const doc = TextDocument.create('file:///x.sru', 'powerbuilder', 1, 'integer xyz');
    const refs = provideReferences(doc, Position.create(0, 9), kb, graph, [
      { uri: 'file:///x.sru', content: doc.getText() }
    ]);
    // Solo el match textual del propio "xyz".
    assert.equal(refs.length, 1);
  });

  test('respeta word boundary', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    const doc = TextDocument.create('file:///x.sru', 'powerbuilder', 1, 'foo\nfoobar\nfoo_bar\n_foo');
    const refs = provideReferences(doc, Position.create(0, 1), kb, graph, [
      { uri: 'file:///x.sru', content: doc.getText() }
    ]);
    assert.equal(refs.length, 1, 'solo la línea 0 hace match');
  });

  test('usa el motor semántico compartido para elegir la declaración correcta en accesos cualificados', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    const mathDoc = TextDocument.create('file:///n_cst_math.sru', 'powerbuilder', 1, `
global type n_cst_math from nonvisualobject
end type
forward prototypes
public function integer of_add()
end prototypes
public function integer of_add();
  return 1
end function
    `);
    const otherDoc = TextDocument.create('file:///n_cst_other.sru', 'powerbuilder', 1, `
global type n_cst_other from nonvisualobject
end type
forward prototypes
public function integer of_add()
end prototypes
public function integer of_add();
  return 2
end function
    `);
    const doc = TextDocument.create('file:///use.sru', 'powerbuilder', 1, `
global type u_test from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  n_cst_math calc
  calc.of_add()
end subroutine
    `);

    kb.upsertDocument(mathDoc.uri, analyzeDocument(mathDoc).semanticFacts, analyzeDocument(mathDoc).scopes);
    kb.upsertDocument(otherDoc.uri, analyzeDocument(otherDoc).semanticFacts, analyzeDocument(otherDoc).scopes);
    kb.upsertDocument(doc.uri, analyzeDocument(doc).semanticFacts, analyzeDocument(doc).scopes);

    const lines = doc.getText().split(/\r?\n/);
    const callLine = lines.findIndex((line) => line.includes('calc.of_add()'));
    const refs = provideReferences(
      doc,
      Position.create(callLine, lines[callLine].indexOf('of_add') + 1),
      kb,
      graph,
      [{ uri: doc.uri, content: doc.getText() }]
    );
    const decls = refs.filter((ref) => ref.uri !== doc.uri);

    assert.equal(decls.length, 1);
    assert.equal(decls[0].uri, 'file:///n_cst_math.sru');
  });
});
