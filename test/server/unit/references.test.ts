import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Position } from 'vscode-languageserver/node';
import { provideReferences } from '../../../src/server/features/references';
import { createDocumentQueryContext } from '../../../src/server/features/queryContext';
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

  test('respeta límites PowerBuilder en identificadores con $, # y %', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    const doc = TextDocument.create('file:///x_special.sru', 'powerbuilder', 1, 'uf_total$\nuf_total$helper\nsvc#main.uf_total$()\nuf_total%');
    const refs = provideReferences(doc, Position.create(0, 8), kb, graph, [
      { uri: 'file:///x_special.sru', content: doc.getText() }
    ]);
    const lines = refs.map((ref) => ref.range.start.line);
    assert.deepEqual(lines, [0, 2], 'debe encontrar el símbolo exacto y la invocación cualificada, no prefijos parciales');
  });

  test('ignora strings y comentarios al buscar ocurrencias textuales', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    kb.beginBatchUpdate();
    kb.upsertDocument('file:///def.sru', [
      { id: 'foo', name: 'foo', kind: EntityKind.Function, uri: 'file:///def.sru', line: 5, character: 10 }
    ]);
    kb.endBatchUpdate();

    const doc = TextDocument.create('file:///use.sru', 'powerbuilder', 1,
      'foo()\nstring ls_msg = "foo should not count"\n// foo tampoco\nmessagebox("x", "foo")'
    );

    const refs = provideReferences(doc, Position.create(0, 1), kb, graph, [
      { uri: doc.uri, content: doc.getText() }
    ]);

    const uses = refs.filter((ref) => ref.uri === doc.uri);
    assert.equal(uses.length, 1, 'solo la invocación real debe contar');
    assert.equal(uses[0].range.start.line, 0);
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

  test('provideReferences reutiliza un queryContext precalculado sin cambiar la declaración elegida', () => {
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
    const position = Position.create(callLine, lines[callLine].indexOf('of_add') + 1);
    const queryContext = createDocumentQueryContext(doc, position, kb, graph);

    const refs = provideReferences(
      doc,
      position,
      kb,
      graph,
      [{ uri: doc.uri, content: doc.getText() }],
      { includeDeclaration: true },
      undefined,
      queryContext
    );
    const decls = refs.filter((ref) => ref.uri !== doc.uri);

    assert.equal(decls.length, 1);
    assert.equal(decls[0].uri, 'file:///n_cst_math.sru');
  });

  test('no mezcla ocurrencias textuales de familias homónimas en owners distintos', () => {
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
public subroutine of_test()
  of_add()
end subroutine
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
      [
        { uri: doc.uri, content: doc.getText() },
        { uri: mathDoc.uri, content: mathDoc.getText() },
        { uri: otherDoc.uri, content: otherDoc.getText() }
      ]
    );

    assert.ok(refs.some((ref) => ref.uri === 'file:///n_cst_math.sru'), 'Debe conservar la familia resuelta.');
    assert.ok(!refs.some((ref) => ref.uri === 'file:///n_cst_other.sru'), 'No debe mezclar owners homónimos por texto.');
  });

  test('degrada a definiciones cuando detecta referencias dinámicas en strings', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    const objectDoc = TextDocument.create('file:///w_order.sru', 'powerbuilder', 1, `
global type w_order from window
end type
forward prototypes
public subroutine of_run()
end prototypes
public subroutine of_run();
end subroutine
    `);
    const useDoc = TextDocument.create('file:///use.sru', 'powerbuilder', 1, `
Open("w_order")
w_order lw_order
lw_order.of_run()
    `);

    for (const document of [objectDoc, useDoc]) {
      const analysis = analyzeDocument(document);
      kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);
    }

    const lines = useDoc.getText().split(/\r?\n/);
    const callLine = lines.findIndex((line) => line.includes('lw_order.of_run()'));
    const refs = provideReferences(
      useDoc,
      Position.create(callLine, lines[callLine].indexOf('of_run') + 1),
      kb,
      graph,
      [
        { uri: objectDoc.uri, content: objectDoc.getText() },
        { uri: useDoc.uri, content: useDoc.getText() }
      ]
    );

    assert.deepEqual(
      refs
        .map((ref) => `${ref.uri}:${ref.range.start.line}:${ref.range.start.character}`)
        .sort(),
      ['file:///w_order.sru:4:18', 'file:///w_order.sru:6:18']
    );
  });

  test('resuelve referencias desde TriggerEvent/PostEvent con literal estable del evento', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    const document = TextDocument.create('file:///w_events.srw', 'powerbuilder', 1, `
global type w_main from window
end type

type cb_ok from commandbutton within w_main
end type

on w_main.cb_ok.clicked
  cb_ok.PostEvent("clicked")
  TriggerEvent(cb_ok, "clicked")
end on
    `);

    const analysis = analyzeDocument(document);
    kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);

    const lines = document.getText().split(/\r?\n/);
    const postLine = lines.findIndex((line) => line.includes('PostEvent'));
    const refs = provideReferences(
      document,
      Position.create(postLine, lines[postLine].indexOf('clicked') + 1),
      kb,
      graph,
      [{ uri: document.uri, content: document.getText() }]
    );

    assert.deepEqual(
      refs
        .map((ref) => `${ref.uri}:${ref.range.start.line}:${ref.range.start.character}`)
        .sort(),
      [
        'file:///w_events.srw:7:16',
        'file:///w_events.srw:8:19',
        'file:///w_events.srw:9:23'
      ]
    );
  });

  test('degrada referencias de external function a la declaración nativa', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    const document = TextDocument.create('file:///w_native.srw', 'powerbuilder', 1, `
global type w_native from window
end type
forward prototypes
public function long of_external (string as_input) library "kernel32.dll" alias for "OfExternal";
public subroutine of_test()
end prototypes
public subroutine of_test();
  of_external("abc")
end subroutine
    `);

    const analysis = analyzeDocument(document);
    kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);

    const lines = document.getText().split(/\r?\n/);
    const callLine = lines.findIndex((line) => line.includes('of_external("abc")'));
    const refs = provideReferences(
      document,
      Position.create(callLine, lines[callLine].indexOf('of_external') + 1),
      kb,
      graph,
      [{ uri: document.uri, content: document.getText() }]
    );

    assert.deepEqual(
      refs.map((ref) => `${ref.uri}:${ref.range.start.line}`).sort(),
      ['file:///w_native.srw:4']
    );
  });

  test('no mezcla referencias de source real con orca-staging cuando la familia canónica resuelta es la real', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    const realDoc = TextDocument.create('file:///proj/src/n_cst_math.sru', 'powerbuilder', 1, `
global type n_cst_math from nonvisualobject
end type
forward prototypes
public function integer of_add()
end prototypes
public function integer of_add();
  return 1
end function
    `);
    const stagedDoc = TextDocument.create('file:///proj/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/n_cst_math.sru', 'powerbuilder', 1, `
global type n_cst_math from nonvisualobject
end type
forward prototypes
public function integer of_add()
end prototypes
public function integer of_add();
  return 2
end function
    `);
    const useDoc = TextDocument.create('file:///proj/src/u_test.sru', 'powerbuilder', 1, `
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

    kb.upsertDocument(realDoc.uri, analyzeDocument(realDoc, { sourceOrigin: 'solution-source' }).semanticFacts, analyzeDocument(realDoc, { sourceOrigin: 'solution-source' }).scopes);
    kb.upsertDocument(stagedDoc.uri, analyzeDocument(stagedDoc, { sourceOrigin: 'orca-staging' }).semanticFacts, analyzeDocument(stagedDoc, { sourceOrigin: 'orca-staging' }).scopes);
    kb.upsertDocument(useDoc.uri, analyzeDocument(useDoc).semanticFacts, analyzeDocument(useDoc).scopes);

    const lines = useDoc.getText().split(/\r?\n/);
    const callLine = lines.findIndex((line) => line.includes('calc.of_add()'));
    const position = Position.create(callLine, lines[callLine].indexOf('of_add') + 1);
    const refs = provideReferences(
      useDoc,
      position,
      kb,
      graph,
      [
        { uri: useDoc.uri, content: useDoc.getText() },
        { uri: realDoc.uri, content: realDoc.getText() },
        { uri: stagedDoc.uri, content: stagedDoc.getText() }
      ],
      { includeDeclaration: true },
      undefined,
      createDocumentQueryContext(useDoc, position, kb, graph)
    );

    assert.ok(refs.some((ref) => ref.uri === realDoc.uri), 'Debe conservar la surface real.');
    assert.ok(refs.some((ref) => ref.uri === useDoc.uri), 'Debe conservar la invocación real.');
    assert.ok(!refs.some((ref) => ref.uri === stagedDoc.uri), 'No debe mezclar la surface de orca-staging.');
  });
});
