import * as assert from 'assert/strict';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { provideLinkedEditingRanges } from '../../../src/server/features/linkedEditing';
import { createDocumentQueryContext } from '../../../src/server/features/queryContext';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';

function indexDocument(kb: KnowledgeBase, document: TextDocument): void {
  const analysis = analyzeDocument(document);
  kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);
}

suite('unit/linkedEditing (B342)', () => {
  test('publica rangos para un parámetro resoluble', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    const doc = TextDocument.create('file:///n_service.sru', 'powerbuilder', 1, [
      'global type n_service from nonvisualobject',
      'end type',
      'forward prototypes',
      'public function integer of_total(long al_value)',
      'end prototypes',
      'public function integer of_total(long al_value);',
      '  long ll_total',
      '  ll_total = al_value',
      '  return ll_total + al_value',
      'end function',
    ].join('\n'));

    indexDocument(kb, doc);

    const lineIndex = doc.getText().split(/\r?\n/).findIndex((line) => line.includes('public function integer of_total(long al_value);'));
    const position = Position.create(lineIndex, doc.getText().split(/\r?\n/)[lineIndex].indexOf('al_value') + 2);
    const result = provideLinkedEditingRanges(
      doc,
      position,
      kb,
      graph,
      undefined,
      createDocumentQueryContext(doc, position, kb, graph),
    );

    assert.ok(result);
    assert.equal(result?.ranges.length, 3);
  });

  test('publica rangos para una variable local resoluble', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    const doc = TextDocument.create('file:///w_calc.sru', 'powerbuilder', 1, [
      'global type w_calc from window',
      'end type',
      'event open();',
      '  long ll_total',
      '  ll_total = 1',
      '  MessageBox("demo", string(ll_total))',
      'end event',
    ].join('\n'));

    indexDocument(kb, doc);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('ll_total = 1'));
    const position = Position.create(lineIndex, lines[lineIndex].indexOf('ll_total') + 2);
    const result = provideLinkedEditingRanges(
      doc,
      position,
      kb,
      graph,
      undefined,
      createDocumentQueryContext(doc, position, kb, graph),
    );

    assert.ok(result);
    assert.equal(result?.ranges.length, 3);
  });

  test('no mezcla un local homónimo de otro callable', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    const doc = TextDocument.create('file:///n_dupe.sru', 'powerbuilder', 1, [
      'global type n_dupe from nonvisualobject',
      'end type',
      'forward prototypes',
      'public function long of_first()',
      'public function long of_second()',
      'end prototypes',
      'public function long of_first();',
      '  long ll_total',
      '  ll_total = 1',
      '  return ll_total',
      'end function',
      'public function long of_second();',
      '  long ll_total',
      '  ll_total = 2',
      '  return ll_total',
      'end function',
    ].join('\n'));

    indexDocument(kb, doc);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('ll_total = 1'));
    const position = Position.create(lineIndex, lines[lineIndex].indexOf('ll_total') + 2);
    const result = provideLinkedEditingRanges(
      doc,
      position,
      kb,
      graph,
      undefined,
      createDocumentQueryContext(doc, position, kb, graph),
    );

    assert.ok(result);
    assert.deepEqual(
      result?.ranges.map((range) => range.start.line),
      [7, 8, 9],
    );
  });
});