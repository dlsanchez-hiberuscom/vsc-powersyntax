import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';
import type { TextDocuments } from 'vscode-languageserver/node';

import {
  buildCurrentServingRequestState,
  INTERACTIVE_TIMING_LOG_THRESHOLD_MS,
  registerSemanticTokensHandler,
  shouldLogInteractiveTiming,
} from '../../../src/server/handlers/featureHandlers';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';

type SemanticTokensHandler = (params: { textDocument: { uri: string }; previousResultId?: string }) => { data: number[]; resultId?: string; edits?: unknown[] };

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

  test('semantic tokens handler hace full fallback tras change/close al evacuar result state', () => {
    const uri = 'file:///feature_handlers_tokens.sru';
    const document = TextDocument.create(uri, 'powerbuilder', 1, [
      'global type n_tokens from nonvisualobject',
      'end type',
    ].join('\n'));
    const kb = new KnowledgeBase();
    const catalog = new SystemCatalog();
    const graph = new InheritanceGraph(kb);

    let onFull: SemanticTokensHandler | undefined;
    let onDelta: SemanticTokensHandler | undefined;
    let onDidClose: ((event: { document: TextDocument }) => void) | undefined;
    let onDidChangeContent: ((event: { document: TextDocument }) => void) | undefined;

    const documents = {
      get(targetUri: string) {
        return targetUri === uri ? document : undefined;
      },
      onDidClose(callback: (event: { document: TextDocument }) => void): void {
        onDidClose = callback;
      },
      onDidChangeContent(callback: (event: { document: TextDocument }) => void): void {
        onDidChangeContent = callback;
      },
    } as unknown as TextDocuments<TextDocument>;

    const connection = {
      console: {
        log(): void {},
        error(): void {},
      },
      languages: {
        semanticTokens: {
          on(callback: SemanticTokensHandler): void {
            onFull = callback;
          },
          onDelta(callback: SemanticTokensHandler): void {
            onDelta = callback;
          },
        },
      },
    } as never;

    registerSemanticTokensHandler({
      connection,
      documents,
      scheduler: {
        runInteractive<T>(options: { execute: () => T }): T {
          return options.execute();
        },
      } as never,
      knowledgeBase: kb,
      inheritanceGraph: graph,
      systemCatalog: catalog,
      firstInvocation: { isFirst: () => false } as never,
      serverStartTime: performance.now(),
      isSemanticallyServedDocument: () => true,
    } as never);

    const full = onFull?.({ textDocument: { uri } });
    assert.ok(full && typeof full.resultId === 'string' && full.resultId.length > 0, 'full semantic tokens debe registrar resultId');

    const compatibleDelta = onDelta?.({ textDocument: { uri }, previousResultId: full.resultId });
    assert.ok(compatibleDelta && Array.isArray(compatibleDelta.edits), 'delta compatible debe reutilizar el estado actual');

    onDidChangeContent?.({ document });
    const afterChange = onDelta?.({ textDocument: { uri }, previousResultId: full.resultId });
    assert.ok(afterChange && 'data' in afterChange, 'tras change debe degradar a full fallback');
    assert.ok(!('edits' in afterChange), 'tras change no debe devolver delta reuse');

    const refreshed = onFull?.({ textDocument: { uri } });
    assert.ok(refreshed && typeof refreshed.resultId === 'string');

    onDidClose?.({ document });
    const afterClose = onDelta?.({ textDocument: { uri }, previousResultId: refreshed.resultId });
    assert.ok(afterClose && 'data' in afterClose, 'tras close debe degradar a full fallback');
    assert.ok(!('edits' in afterClose), 'tras close no debe devolver delta reuse');
  });
});