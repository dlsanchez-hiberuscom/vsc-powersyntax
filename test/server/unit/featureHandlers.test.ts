import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  buildCurrentServingRequestState,
  INTERACTIVE_TIMING_LOG_THRESHOLD_MS,
  shouldLogInteractiveTiming,
} from '../../../src/server/handlers/featureHandlers';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';

suite('unit/featureHandlers', () => {
  test('solo loguea timings interactivos cuando cruzan el presupuesto', () => {
    assert.equal(shouldLogInteractiveTiming(INTERACTIVE_TIMING_LOG_THRESHOLD_MS - 1), false);
    assert.equal(shouldLogInteractiveTiming(INTERACTIVE_TIMING_LOG_THRESHOLD_MS), true);
    assert.equal(shouldLogInteractiveTiming(INTERACTIVE_TIMING_LOG_THRESHOLD_MS + 10), true);
  });

  test('reconstruye el estado interactivo con fingerprint por documento', () => {
    const uri = 'file:///feature_handlers_current_state.sru';
    const document = TextDocument.create(uri, 'powerbuilder', 7, [
      'global type feature_handlers_current_state from window',
      'end type',
      '',
      'forward prototypes',
      'public function integer of_test()'
    ].join('\n'));
    const kb = new KnowledgeBase();
    const catalog = new SystemCatalog();
    const graph = new InheritanceGraph(kb);

    invalidateDocumentAnalysis(uri);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);

    const state = buildCurrentServingRequestState({
      feature: 'hover',
      document,
      knowledgeBase: kb,
      documentCache: { getSnapshot: () => null } as never,
      inheritanceGraph: graph,
      systemCatalog: catalog,
      workspaceState: {
        getSourceOrigin: () => 'workspace',
        inferSourceOriginForUri: () => 'workspace',
      } as never,
      locale: 'es',
      contextKey: '4:15',
    });

    assert.equal(state.documentFingerprint, analysis.snapshot.fingerprint);
    assert.notEqual(String(state.documentFingerprint), String(kb.semanticEpoch));
    assert.equal(state.locale, 'es');
    assert.equal(state.contextKey, '4:15');
  });
});