import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildObjectExplorerProjection } from '../../../src/server/features/objectExplorerProjection';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import type { SourceOrigin } from '../../../src/shared/sourceOrigin';

suite('unit/objectExplorerProjection (B383)', () => {
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
    sourceOrigin: SourceOrigin = 'pbl-folder-source',
  ): TextDocument {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    workspaceState.addSourceFile(uri, sourceOrigin);
    return document;
  }

  test('pagina roots por proyecto y expone nextCursor', () => {
    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///workspace-a/app.pbt',
        name: 'app-a',
        libraries: ['file:///workspace-a/lib_a.pbl'],
      },
    });
    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///workspace-b/app.pbt',
        name: 'app-b',
        libraries: ['file:///workspace-b/lib_b.pbl'],
      },
    });
    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///workspace-c/app.pbt',
        name: 'app-c',
        libraries: ['file:///workspace-c/lib_c.pbl'],
      },
    });

    setupAnalyzedDocument('file:///workspace-a/lib_a.pbl/w_a.srw', [
      'forward',
      'global type w_a from window',
      'end type',
      'end forward',
      'global type w_a from window',
      'end type',
    ].join('\r\n'));
    setupAnalyzedDocument('file:///workspace-b/lib_b.pbl/w_b.srw', [
      'forward',
      'global type w_b from window',
      'end type',
      'end forward',
      'global type w_b from window',
      'end type',
    ].join('\r\n'));
    setupAnalyzedDocument('file:///workspace-c/lib_c.pbl/w_c.srw', [
      'forward',
      'global type w_c from window',
      'end type',
      'end forward',
      'global type w_c from window',
      'end type',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const firstPage = buildObjectExplorerProjection({
      scope: 'workspace',
      pageSize: 1,
    }, kb, workspaceState, { state: 'ready' });
    const secondPage = buildObjectExplorerProjection({
      scope: 'workspace',
      pageSize: 1,
      cursor: firstPage.projection.pageInfo?.nextCursor,
    }, kb, workspaceState, { state: 'ready' });

    assert.equal(firstPage.nodes.length, 1);
    assert.equal(firstPage.nodes[0]?.type, 'project');
    assert.equal(firstPage.projection.state, 'paged');
    assert.equal(firstPage.projection.pageInfo?.hasMore, true);
    assert.equal(firstPage.projection.pageInfo?.nextCursor, '1');

    assert.equal(secondPage.nodes.length, 1);
    assert.equal(secondPage.nodes[0]?.type, 'project');
    assert.notEqual(firstPage.nodes[0]?.id, secondPage.nodes[0]?.id);
  });

  test('pagina hijos por path de kind con ids estables y receipt paged', () => {
    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });

    for (const name of ['w_alpha', 'w_beta', 'w_gamma']) {
      setupAnalyzedDocument(`file:///proj/lib_app.pbl/${name}.srw`, [
        'forward',
        `global type ${name} from window`,
        'end type',
        'end forward',
        `global type ${name} from window`,
        'end type',
      ].join('\r\n'));
    }

    workspaceState.refreshProjectRouting();

    const firstPage = buildObjectExplorerProjection({
      scope: 'workspace',
      parentId: 'kind:file:///proj/app.pbt:file:///proj/lib_app.pbl:window',
      parentPath: {
        projectUri: 'file:///proj/app.pbt',
        library: 'file:///proj/lib_app.pbl',
        objectKind: 'window',
      },
      pageSize: 2,
    }, kb, workspaceState, { state: 'ready' });
    const secondPage = buildObjectExplorerProjection({
      scope: 'workspace',
      parentId: 'kind:file:///proj/app.pbt:file:///proj/lib_app.pbl:window',
      parentPath: {
        projectUri: 'file:///proj/app.pbt',
        library: 'file:///proj/lib_app.pbl',
        objectKind: 'window',
      },
      pageSize: 2,
      cursor: firstPage.projection.pageInfo?.nextCursor,
    }, kb, workspaceState, { state: 'ready' });

    assert.deepEqual(
      firstPage.nodes.map((node) => node.id),
      [
        'object:file:///proj/lib_app.pbl/w_alpha.srw',
        'object:file:///proj/lib_app.pbl/w_beta.srw',
      ],
    );
    assert.equal(firstPage.projection.pageInfo?.hasMore, true);
    assert.equal(firstPage.projection.pageInfo?.nextCursor, '2');
    assert.equal(secondPage.nodes.length, 1);
    assert.equal(secondPage.nodes[0]?.id, 'object:file:///proj/lib_app.pbl/w_gamma.srw');
    assert.equal(secondPage.projection.pageInfo?.hasMore, false);
  });
});