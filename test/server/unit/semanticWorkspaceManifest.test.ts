import * as assert from 'assert/strict';

import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildSemanticWorkspaceManifest } from '../../../src/server/features/semanticWorkspaceManifest';
import { buildDiagnosticsSnapshot } from '../../../src/server/features/diagnosticsSnapshot';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import type { SourceOrigin } from '../../../src/shared/sourceOrigin';

suite('unit/semanticWorkspaceManifest (B220)', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let workspaceState: WorkspaceState;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    workspaceState = new WorkspaceState();
  });

  function setupAnalyzedDocument(
    uri: string,
    content: string,
    sourceOrigin: SourceOrigin = 'unknown'
  ): TextDocument {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    workspaceState.addSourceFile(uri, sourceOrigin);
    return document;
  }

  test('exporta un manifiesto compacto y versionado del workspace sin incluir código bruto', () => {
    const baseUri = 'file:///proj/lib_app.pbl/w_context_base.sru';
    const mainUri = 'file:///proj/lib_app.pbl/w_context.srw';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl']
      }
    });

    setupAnalyzedDocument(baseUri, [
      'forward',
      'global type w_context_base from window',
      'end type',
      'end forward',
      'global type w_context_base from window',
      'end type'
    ].join('\r\n'), 'pbl-folder-source');

    setupAnalyzedDocument(mainUri, [
      'forward',
      'global type w_context from w_context_base',
      'end type',
      'end forward',
      'public function integer of_build();',
      '  return 1',
      'end function'
    ].join('\r\n'), 'pbl-folder-source');

    workspaceState.refreshProjectRouting();

    const diagnosticsSummary = buildDiagnosticsSnapshot(new Map([
      [mainUri, {
        diagnostics: [{
          severity: DiagnosticSeverity.Warning,
          source: 'PowerScript',
          code: 'SDX',
          message: 'warning demo',
          range: { start: { line: 4, character: 2 }, end: { line: 4, character: 9 } }
        }],
        projectKey: 'file:///proj/app.pbt',
        projectLabel: 'app',
        objectKey: 'w_context',
        objectLabel: 'w_context',
        sourceOrigin: 'pbl-folder-source'
      }]
    ]));

    const manifest = buildSemanticWorkspaceManifest(
      {
        maxObjects: 10,
        maxSymbols: 20,
      },
      kb,
      graph,
      workspaceState,
      diagnosticsSummary,
      { state: 'ready' }
    );

    assert.equal(manifest.schemaVersion, '1.0.0');
    assert.equal(manifest.projects[0]?.projectUri, 'file:///proj/app.pbt');
    assert.deepEqual(manifest.libraries, ['file:///proj/lib_app.pbl']);
    assert.ok(manifest.objects.some((entry) => entry.name === 'w_context'));
    assert.ok(manifest.inheritanceSummary.items.some((entry) => entry.name === 'w_context' && entry.baseType === 'w_context_base'));
    assert.ok(manifest.exportedSymbols.some((entry) => entry.name === 'w_context'));
    assert.equal(manifest.sourceOriginSummary['pbl-folder-source'], 2);
    assert.equal(manifest.readiness.state, 'ready');
    assert.equal(manifest.diagnosticsSummary?.documents[0]?.uri, mainUri);
    assert.equal(manifest.limits.objectsTruncated, false);
    assert.equal(manifest.limits.symbolsTruncated, false);
  });
});