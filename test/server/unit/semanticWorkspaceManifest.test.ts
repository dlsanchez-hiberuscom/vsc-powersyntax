import * as assert from 'assert/strict';

import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildSemanticWorkspaceManifest } from '../../../src/server/features/semanticWorkspaceManifest';
import { buildDiagnosticsSnapshot } from '../../../src/server/features/diagnosticsSnapshot';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { EntityKind } from '../../../src/server/knowledge/types';
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
    assert.deepEqual(
      manifest.objects.find((entry) => entry.name === 'w_context'),
      {
        name: 'w_context',
        uri: mainUri,
        baseType: 'w_context_base',
        projectUri: 'file:///proj/app.pbt',
        library: 'file:///proj/lib_app.pbl',
        objectKind: 'window',
        readiness: 'nearby-semantic-ready',
        sourceOrigin: 'pbl-folder-source'
      }
    );
    assert.ok(manifest.inheritanceSummary.items.some((entry) => entry.name === 'w_context' && entry.baseType === 'w_context_base'));
    assert.ok(manifest.exportedSymbols.some((entry) => entry.name === 'w_context'));
    assert.ok(manifest.knowledgePacks?.items.some((pack) => pack.id === 'appeon-webbrowser-webview2'));
    assert.equal(manifest.sourceOriginSummary['pbl-folder-source'], 2);
    assert.equal(manifest.readiness.state, 'ready');
    assert.equal(manifest.diagnosticsSummary?.documents[0]?.uri, mainUri);
    assert.equal(manifest.limits.objectsTruncated, false);
    assert.equal(manifest.limits.symbolsTruncated, false);
  });

  test('materializa proyectos legacy read-only cuando el workspace solo contiene una librería PBL', () => {
    const mainUri = 'file:///proj/lib_legacy.pbl/w_legacy.srw';

    workspaceState.addRoot('libraries', 'file:///proj/lib_legacy.pbl');

    setupAnalyzedDocument(mainUri, [
      'forward',
      'global type w_legacy from window',
      'end type',
      'end forward',
      'global type w_legacy from window',
      'end type'
    ].join('\r\n'), 'pbl-folder-source');

    workspaceState.refreshProjectRouting();

    const manifest = buildSemanticWorkspaceManifest(
      undefined,
      kb,
      graph,
      workspaceState,
      null,
      { state: 'ready', detail: 'legacy-read-only' }
    );

    assert.deepEqual(manifest.projects, [{
      projectUri: 'file:///proj/lib_legacy.pbl',
      kind: 'library',
      name: 'lib_legacy.pbl',
      libraries: ['file:///proj/lib_legacy.pbl'],
      fileCount: 1
    }]);
    assert.deepEqual(manifest.libraries, ['file:///proj/lib_legacy.pbl']);
    assert.deepEqual(manifest.objects.find((entry) => entry.name === 'w_legacy'), {
      name: 'w_legacy',
      uri: mainUri,
      baseType: 'window',
      projectUri: 'file:///proj/lib_legacy.pbl',
      library: 'file:///proj/lib_legacy.pbl',
      objectKind: 'window',
      readiness: 'nearby-semantic-ready',
      sourceOrigin: 'pbl-folder-source'
    });
  });

  test('prioriza source real en manifest cuando maxObjects trunca duplicados de orca-staging', () => {
    const stagedUri = 'file:///proj/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/n_shared.sru';
    const realUri = 'file:///proj/src/n_shared.sru';

    kb.upsertDocument(stagedUri, [{
      id: 'n_shared',
      name: 'n_shared',
      kind: EntityKind.Type,
      uri: stagedUri,
      line: 0,
      character: 0,
      baseTypeName: 'nonvisualobject',
      lineage: {
        sourceKind: 'document',
        sourceOrigin: 'orca-staging',
        authority: 'derived',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'direct'
      }
    }]);
    kb.upsertDocument(realUri, [{
      id: 'n_shared',
      name: 'n_shared',
      kind: EntityKind.Type,
      uri: realUri,
      line: 0,
      character: 0,
      baseTypeName: 'nonvisualobject',
      lineage: {
        sourceKind: 'document',
        sourceOrigin: 'solution-source',
        authority: 'derived',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'direct'
      }
    }]);
    workspaceState.addSourceFile(stagedUri, 'orca-staging');
    workspaceState.addSourceFile(realUri, 'solution-source');
    workspaceState.refreshProjectRouting();

    const manifest = buildSemanticWorkspaceManifest(
      {
        maxObjects: 1,
        maxSymbols: 10,
      },
      kb,
      graph,
      workspaceState,
      null,
      { state: 'ready' }
    );

    assert.equal(manifest.objects.length, 1);
    assert.equal(manifest.objects[0]?.uri, realUri);
    assert.equal(manifest.objects[0]?.sourceOrigin, 'solution-source');
  });
});