import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildPowerBuilderDependencyGraph } from '../../../src/server/features/dependencyGraph';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { buildSymbolKey } from '../../../src/server/knowledge/symbolKey';
import { EntityKind } from '../../../src/server/knowledge/types';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/dependencyGraph (B252)', () => {
  let kb: KnowledgeBase;
  let workspaceState: WorkspaceState;

  setup(() => {
    kb = new KnowledgeBase();
    workspaceState = new WorkspaceState();
  });

  function setupAnalyzedDocument(uri: string, content: string): TextDocument {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    workspaceState.addSourceFile(uri, 'pbl-folder-source');
    return document;
  }

  test('construye un grafo inmediato con dependencias resueltas, ambiguas y dependientes inversos', () => {
    const baseUri = 'file:///proj/lib_app.pbl/w_base.sru';
    const serviceUri = 'file:///proj/lib_app.pbl/n_service.sru';
    const focusUri = 'file:///proj/lib_app.pbl/w_main.srw';
    const dependentUri = 'file:///proj/lib_app.pbl/w_consumer.srw';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });

    setupAnalyzedDocument(baseUri, [
      'forward',
      'global type w_base from window',
      'end type',
      'end forward',
      'global type w_base from window',
      'end type',
    ].join('\r\n'));

    setupAnalyzedDocument(serviceUri, [
      'forward',
      'global type n_service from nonvisualobject',
      'end type',
      'end forward',
      'global type n_service from nonvisualobject',
      'end type',
    ].join('\r\n'));

    setupAnalyzedDocument(focusUri, [
      'forward',
      'global type w_main from w_base',
      'end type',
      'end forward',
      'global type w_main from w_base',
      'n_service inv_service',
      'public function n_missing_service of_build()',
      '  n_service ln_service',
      '  return ln_service',
      'end function',
      'end type',
    ].join('\r\n'));

    setupAnalyzedDocument(dependentUri, [
      'forward',
      'global type w_consumer from window',
      'end type',
      'end forward',
      'global type w_consumer from window',
      'w_main iw_main',
      'end type',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const graph = buildPowerBuilderDependencyGraph(
      {
        uri: focusUri,
        maxDependencies: 8,
        maxDependents: 8,
      },
      kb,
      workspaceState,
    );
    const focusEntity = kb.getEntitiesByUri(focusUri).find((entity) => entity.kind === EntityKind.Type && entity.name === 'w_main');
    const baseEntity = kb.getEntitiesByUri(baseUri).find((entity) => entity.kind === EntityKind.Type && entity.name === 'w_base');
    const serviceEntity = kb.getEntitiesByUri(serviceUri).find((entity) => entity.kind === EntityKind.Type && entity.name === 'n_service');

    assert.equal(graph.available, true);
    assert.equal(graph.focus?.objectName, 'w_main');
    assert.equal(graph.focus?.identityKey, focusEntity ? buildSymbolKey(focusEntity) : undefined);
    assert.equal(graph.scope, 'immediate-neighborhood');
    assert.ok(graph.nodes.some((node) => node.kind === 'focus-object' && node.uri === focusUri));
    assert.equal(graph.nodes.find((node) => node.kind === 'focus-object' && node.uri === focusUri)?.identityKey, focusEntity ? buildSymbolKey(focusEntity) : undefined);
    assert.ok(graph.nodes.some((node) => node.label === 'w_base' && node.resolution === 'resolved'));
    assert.equal(graph.nodes.find((node) => node.label === 'w_base')?.identityKey, baseEntity ? buildSymbolKey(baseEntity) : undefined);
    assert.ok(graph.nodes.some((node) => node.label === 'n_service' && node.resolution === 'resolved'));
    assert.equal(graph.nodes.find((node) => node.label === 'n_service')?.identityKey, serviceEntity ? buildSymbolKey(serviceEntity) : undefined);
    assert.ok(graph.nodes.some((node) => node.label === 'n_missing_service' && node.resolution === 'unresolved'));
    assert.equal(graph.nodes.find((node) => node.label === 'n_missing_service')?.identityKey, undefined);
    assert.ok(graph.nodes.some((node) => node.label === 'w_consumer' && node.kind === 'dependent-object'));
    assert.ok(graph.edges.some((edge) => edge.relation === 'inherits'));
    assert.ok(graph.edges.some((edge) => edge.relation === 'depends-on' && edge.reason.includes('datatype')));
    assert.ok(graph.edges.some((edge) => edge.relation === 'used-by'));
    assert.equal(graph.summary.dependentCount, 1);
    assert.equal(graph.summary.unresolvedDependencyCount, 1);
    assert.match(graph.mermaidFlowchart, /flowchart LR/);
    assert.match(graph.mermaidFlowchart, /used-by/);
  });
});