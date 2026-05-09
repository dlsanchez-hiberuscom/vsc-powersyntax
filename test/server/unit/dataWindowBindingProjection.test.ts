import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { clearDocumentAnalysisCache, invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { collectDataObjectBindingsProjection } from '../../../src/server/features/dataWindowBindingProjection';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';

suite('unit/dataWindowBindingProjection (Wave 07)', () => {
  let kb: KnowledgeBase;

  setup(() => {
    clearDocumentAnalysisCache();
    kb = new KnowledgeBase();
  });

  teardown(() => {
    clearDocumentAnalysisCache();
  });

  function setupAnalyzedDocument(uri: string, content: string) {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    return analysis.snapshot;
  }

  test('aplica cap por consumer read-only sin alterar el collector bruto', () => {
    const snapshot = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_projection_bindings.srw', [
      'forward',
      'global type w_projection_bindings from window',
      'end type',
      'end forward',
      'global type w_projection_bindings from window',
      'end type',
      'event open();',
      ...Array.from({ length: 20 }, (_, index) => `  ids_${index + 1}.DataObject = "d_projection_${index + 1}"`),
      'end event',
    ].join('\r\n'));

    const projection = collectDataObjectBindingsProjection(snapshot, kb, {
      consumer: 'current-object-context',
    });

    assert.equal(projection.bindings.length, 12);
    assert.equal(projection.receipt.totalBindings, 20);
    assert.equal(projection.receipt.emittedBindings, 12);
    assert.equal(projection.receipt.maxBindings, 12);
    assert.equal(projection.receipt.truncated, true);
    assert.equal(projection.receipt.truncatedReason, 'datawindow-binding-cap:current-object-context');
  });

  test('permite lectura unbounded solo para consumers de debug profundo', () => {
    const snapshot = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_projection_bindings_debug.srw', [
      'forward',
      'global type w_projection_bindings_debug from window',
      'end type',
      'end forward',
      'global type w_projection_bindings_debug from window',
      'end type',
      'event open();',
      ...Array.from({ length: 20 }, (_, index) => `  ids_${index + 1}.DataObject = "d_projection_${index + 1}"`),
      'end event',
    ].join('\r\n'));

    const projection = collectDataObjectBindingsProjection(snapshot, kb, {
      consumer: 'debug/deep-report',
      allowUnbounded: true,
    });

    assert.equal(projection.bindings.length, 20);
    assert.equal(projection.receipt.totalBindings, 20);
    assert.equal(projection.receipt.emittedBindings, 20);
    assert.equal(projection.receipt.unbounded, true);
    assert.equal(projection.receipt.maxBindings, undefined);
    assert.equal(projection.receipt.truncated, false);
  });
});