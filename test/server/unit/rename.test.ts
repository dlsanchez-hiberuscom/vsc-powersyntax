import * as assert from 'assert/strict';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { createDocumentQueryContext } from '../../../src/server/features/queryContext';
import { provideRename } from '../../../src/server/features/rename';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind } from '../../../src/server/knowledge/types';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';

suite('unit/rename (B032)', () => {
  test('renombra parámetros locales dentro de su scope semántico', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    const doc = TextDocument.create('file:///w_calc.sru', 'powerbuilder', 1, `
global type w_calc from window
end type
forward prototypes
public function integer of_sum(integer ai_value)
end prototypes
public function integer of_sum(integer ai_value);
  return ai_value + ai_value
end function
    `);

    const analysis = analyzeDocument(doc);
    kb.upsertDocument(doc.uri, analysis.semanticFacts, analysis.scopes);

    const lines = doc.getText().split(/\r?\n/);
    const useLine = lines.findIndex((line) => line.includes('return ai_value + ai_value'));
    const position = Position.create(useLine, lines[useLine].indexOf('ai_value') + 1);

    const rename = provideRename(
      doc,
      position,
      'ai_total',
      kb,
      graph,
      [{ uri: doc.uri, content: doc.getText() }],
      undefined,
      undefined,
      createDocumentQueryContext(doc, position, kb, graph)
    );

    assert.ok(rename.edit?.changes?.[doc.uri]);
    assert.equal(rename.edit?.changes?.[doc.uri]?.length, 3);
  });

  test('renombra miembros tipados cross-file sin mezclar owners homónimos', () => {
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
    const useDoc = TextDocument.create('file:///use.sru', 'powerbuilder', 1, `
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

    for (const document of [mathDoc, otherDoc, useDoc]) {
      const analysis = analyzeDocument(document);
      kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);
    }

    const lines = useDoc.getText().split(/\r?\n/);
    const callLine = lines.findIndex((line) => line.includes('calc.of_add()'));
    const position = Position.create(callLine, lines[callLine].indexOf('of_add') + 1);
    const rename = provideRename(
      useDoc,
      position,
      'of_total',
      kb,
      graph,
      [
        { uri: useDoc.uri, content: useDoc.getText() },
        { uri: mathDoc.uri, content: mathDoc.getText() },
        { uri: otherDoc.uri, content: otherDoc.getText() }
      ],
      undefined,
      undefined,
      createDocumentQueryContext(useDoc, position, kb, graph)
    );

    assert.ok(rename.edit?.changes?.['file:///n_cst_math.sru']);
    assert.ok(rename.edit?.changes?.['file:///use.sru']);
    assert.equal(rename.edit?.changes?.['file:///n_cst_other.sru'], undefined);
  });

  test('bloquea rename cuando la resolución cae en global fallback', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    kb.upsertDocument('file:///global.sru', [
      { id: 'gf_foo', name: 'gf_foo', kind: EntityKind.Function, uri: 'file:///global.sru', line: 1, character: 0 }
    ]);
    const doc = TextDocument.create('file:///use.sru', 'powerbuilder', 1, 'gf_foo()');
    const position = Position.create(0, 1);

    const rename = provideRename(
      doc,
      position,
      'gf_bar',
      kb,
      graph,
      [{ uri: doc.uri, content: doc.getText() }],
      undefined,
      undefined,
      createDocumentQueryContext(doc, position, kb, graph)
    );

    assert.equal(rename.edit, null);
    assert.match(rename.reason ?? '', /solo admite/i);
  });

  test('bloquea rename sobre external function sin implementación interna', () => {
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
    const position = Position.create(callLine, lines[callLine].indexOf('of_external') + 1);
    const rename = provideRename(
      document,
      position,
      'of_external_renamed',
      kb,
      graph,
      [{ uri: document.uri, content: document.getText() }],
      undefined,
      undefined,
      createDocumentQueryContext(document, position, kb, graph)
    );

    assert.equal(rename.edit, null);
    assert.match(rename.reason ?? '', /dependencias nativas externas/i);
  });

  test('bloquea rename cuando detecta referencias dinámicas en strings', () => {
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
public subroutine of_emit()
  this.PostEvent("of_add")
end subroutine
    `);
    const useDoc = TextDocument.create('file:///use.sru', 'powerbuilder', 1, `
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

    for (const document of [mathDoc, useDoc]) {
      const analysis = analyzeDocument(document);
      kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);
    }

    const lines = useDoc.getText().split(/\r?\n/);
    const callLine = lines.findIndex((line) => line.includes('calc.of_add()'));
    const position = Position.create(callLine, lines[callLine].indexOf('of_add') + 1);
    const rename = provideRename(
      useDoc,
      position,
      'of_total',
      kb,
      graph,
      [
        { uri: useDoc.uri, content: useDoc.getText() },
        { uri: mathDoc.uri, content: mathDoc.getText() }
      ],
      undefined,
      undefined,
      createDocumentQueryContext(useDoc, position, kb, graph)
    );

    assert.equal(rename.edit, null);
    assert.match(rename.reason ?? '', /string dinámico/i);
  });

  test('rename no arrastra edits de orca-staging cuando la familia canónica resuelta es la real', () => {
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
    const rename = provideRename(
      useDoc,
      position,
      'of_total',
      kb,
      graph,
      [
        { uri: useDoc.uri, content: useDoc.getText() },
        { uri: realDoc.uri, content: realDoc.getText() },
        { uri: stagedDoc.uri, content: stagedDoc.getText() }
      ],
      undefined,
      undefined,
      createDocumentQueryContext(useDoc, position, kb, graph)
    );

    assert.ok(rename.edit?.changes?.[realDoc.uri]);
    assert.ok(rename.edit?.changes?.[useDoc.uri]);
    assert.equal(rename.edit?.changes?.[stagedDoc.uri], undefined);
  });
});