import * as assert from 'assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { HotContextCache } from '../../../src/server/knowledge/HotContextCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';
import { ActiveDocumentServingSnapshot } from '../../../src/server/serving/activeDocumentServingSnapshot';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/activeDocumentServingSnapshot', () => {
  function buildSnapshot(locale: 'es' | 'en' = 'es') {
    const workspaceState = new WorkspaceState();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const hotContextCache = new HotContextCache();
    const systemCatalog = new SystemCatalog();
    const documentUri = 'file:///w_snapshot.srw';

    const document = TextDocument.create(documentUri, 'powerbuilder-window', 1, `
global type w_snapshot from window
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  datastore ids_orders
  ids_orders.DataObject = "d_orders"
end subroutine
    `);
    const analysis = analyzeDocument(document);
    documentCache.set(documentUri, {
      version: 1,
      symbols: [],
      facts: analysis.semanticFacts,
      scopes: analysis.scopes,
      snapshot: analysis.snapshot,
    });
    knowledgeBase.upsertDocument(documentUri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    knowledgeBase.upsertDocument('file:///d_orders.srd', [
      {
        id: 'd_orders',
        name: 'd_orders',
        kind: EntityKind.Type,
        baseTypeName: 'datawindow',
        uri: 'file:///d_orders.srd',
        line: 0,
        character: 0,
      },
    ], [], undefined);

    workspaceState.addSourceFile(documentUri, 'workspace-ws_objects');
    workspaceState.addSourceFile('file:///d_orders.srd', 'workspace-ws_objects');
    hotContextCache.setActive(documentUri, knowledgeBase.version);
    hotContextCache.setInheritedMembers('window', [
      {
        id: 'ue_open',
        name: 'ue_open',
        kind: EntityKind.Event,
        uri: documentUri,
        line: 0,
        character: 0,
      },
    ]);

    const snapshot = new ActiveDocumentServingSnapshot({
      document,
      knowledgeBase,
      documentCache,
      hotContextCache,
      inheritanceGraph: new InheritanceGraph(knowledgeBase),
      systemCatalog,
      workspaceState,
      locale,
    });

    return { snapshot, document };
  }

  test('expone token, scope, receiver, binding y hot members como vistas derivadas', () => {
    const { snapshot, document } = buildSnapshot();
    const lines = document.getText().split(/\r?\n/);
    const bindingLine = lines.findIndex((line) => line.includes('ids_orders.DataObject'));

    const token = snapshot.getTokenAt(Position.create(bindingLine, lines[bindingLine].indexOf('ids_orders') + 2));
    assert.equal(token?.word, 'ids_orders');

    const scope = snapshot.getScopeAt(Position.create(bindingLine, 4));
    assert.equal(scope.kind, 'Function');

    const receiver = snapshot.getReceiverAt(Position.create(bindingLine, lines[bindingLine].indexOf('DataObject') + 2));
    assert.equal(receiver.qualifier?.toLowerCase(), 'ids_orders');
    assert.equal(receiver.receiverType?.toLowerCase(), 'datastore');

    const binding = snapshot.getBindingAt(Position.create(bindingLine, lines[bindingLine].length));
    assert.equal(binding.state, 'resolved');
    assert.equal(binding.dataObject, 'd_orders');
    assert.equal(binding.targetUri, 'file:///d_orders.srd');

    const hotMembers = snapshot.getHotMembers('window');
    assert.equal(hotMembers.state, 'hot');
    assert.equal(hotMembers.members.length, 1);
  });

  test('deriva keys por locale y degrada a unknown/partial si no hay snapshot caliente', () => {
    const { snapshot: snapshotEs } = buildSnapshot('es');
    const { snapshot: snapshotEn } = buildSnapshot('en');

    const esKey = snapshotEs.buildCacheKey('hover-view-model', {
      cacheClass: 'view-model',
      pressureClass: 'hot',
      line: 9,
      character: 8,
    });
    const enKey = snapshotEn.buildCacheKey('hover-view-model', {
      cacheClass: 'view-model',
      pressureClass: 'hot',
      line: 9,
      character: 8,
    });

    assert.notEqual(esKey, enKey);

    const emptyKnowledgeBase = new KnowledgeBase();
    const emptySnapshot = new ActiveDocumentServingSnapshot({
      document: TextDocument.create('file:///empty.sru', 'powerbuilder', 1, 'MessageBox("A", "B")'),
      knowledgeBase: emptyKnowledgeBase,
      documentCache: new DocumentCache(),
      hotContextCache: new HotContextCache(),
      inheritanceGraph: new InheritanceGraph(emptyKnowledgeBase),
      systemCatalog: new SystemCatalog(),
      workspaceState: new WorkspaceState(),
      locale: 'es',
    });

    assert.equal(emptySnapshot.getBindingAt(Position.create(0, 0)).state, 'unknown');
    assert.equal(emptySnapshot.getHotMembers('window').state, 'partial');
  });
});