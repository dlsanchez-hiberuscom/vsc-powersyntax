import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildCurrentObjectContext } from '../../../src/server/features/currentObjectContext';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/currentObjectContext (B217)', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let catalog: SystemCatalog;
  let workspaceState: WorkspaceState;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    catalog = new SystemCatalog();
    workspaceState = new WorkspaceState();
  });

  function setupAnalyzedDocument(uri: string, content: string): TextDocument {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    workspaceState.addSourceFile(uri);
    return document;
  }

  test('construye un context pack read-only con metadata, referencias, diagnostics y DataObject bindings', () => {
    const baseUri = 'file:///proj/lib_app.pbl/w_context_base.sru';
    const dataWindowUri = 'file:///proj/lib_app.pbl/d_sales_orders.srd';
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
      'integer ii_base_counter',
      'end type',
      'public function integer of_inherited();',
      '  return 42',
      'end function'
    ].join('\r\n'));

    setupAnalyzedDocument(dataWindowUri, [
      '$PBExportHeader$d_sales_orders.srd',
      'release 39;',
      'table(retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) " arguments=(("custarg", number)) )")'
    ].join('\r\n'));

    const document = setupAnalyzedDocument(mainUri, [
      'forward',
      'global type w_context from w_context_base',
      'end type',
      'end forward',
      'forward prototypes',
      'public function integer of_only_proto(string as_name)',
      'public subroutine of_build()',
      'end prototypes',
      'global type w_context from w_context_base',
      'end type',
      'event create;',
      '  call super::create',
      'end event',
      'public subroutine of_build();',
      '  datastore ids_orders',
      '  ids_orders.SetTrans(&',
      '    SQLCA)',
      '  ids_orders.DataObject = &',
      '    "d_sales_orders"',
      '  ids_orders.Retrieve(&',
      '    1, &',
      '    2)',
      '  of_inherited()',
      'end subroutine'
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const lines = document.getText().split(/\r?\n/);
    const inheritedCallLine = lines.findIndex((line) => line.includes('of_inherited()'));
    const inheritedCallCharacter = lines[inheritedCallLine].indexOf('of_inherited') + 2;

    const context = buildCurrentObjectContext(
      document,
      {
        line: inheritedCallLine,
        character: inheritedCallCharacter,
        maxExcerptLines: 12,
        maxReferencedSymbols: 8
      },
      kb,
      graph,
      catalog,
      { workspaceState }
    );

    assert.equal(context.available, true);
    assert.equal(context.objectInfo?.globalType, 'w_context');
    assert.equal(context.objectInfo?.objectKind, 'window');
    assert.equal(context.objectInfo?.library, 'file:///proj/lib_app.pbl');
    assert.equal(context.objectInfo?.project, 'file:///proj/app.pbt');
    assert.equal(context.objectInfo?.sourceOrigin, 'pbl-folder-source');
    assert.equal(context.projectContext?.name, 'app');
    assert.deepEqual(context.ancestorChain?.slice(0, 2).map((entry) => entry.name), ['w_context_base', 'window']);
    assert.ok(context.members?.functions.some((entry) => entry.name === 'of_build'));
    assert.ok(context.members?.prototypes.some((entry) => entry.name === 'of_only_proto'));
    assert.ok(context.members?.events.some((entry) => entry.name.toLowerCase() === 'create'));
    assert.ok(context.visibleVariables?.some((entry) => entry.name === 'ids_orders' && entry.scope === 'Local'));
    assert.ok(context.visibleVariables?.some((entry) => entry.name === 'ii_base_counter' && entry.scope === 'Instancia' && entry.relation === 'inherited'));
    assert.ok(context.referencedSymbols?.some((entry) => entry.target.name === 'of_inherited' && entry.reasonCode === 'member-hierarchy'));
    assert.equal(context.dataWindowBindings?.[0]?.dataObject, 'd_sales_orders');
    assert.equal(context.dataWindowBindings?.[0]?.retrieveArguments[0]?.name, 'custarg');
    assert.ok(context.diagnostics?.items.some((entry) => entry.message.includes('ids_orders.Retrieve(...)') && entry.message.includes('espera 1 argumento')));
    assert.equal(context.evidence?.primaryReasonCode, 'member-hierarchy');
    assert.ok(context.evidence?.evidenceKinds.includes('winner-target'));
    assert.ok(context.relatedFiles?.some((entry) => entry.uri === baseUri && entry.role === 'ancestor'));
    assert.ok(context.relatedFiles?.some((entry) => entry.uri === dataWindowUri && entry.role === 'datawindow'));
    assert.ok(context.sourceExcerpt?.text.includes('ids_orders.DataObject = &'));
  });

  test('prioriza el ancestro según project routing y library order en pbproj multi-PBL', () => {
    const preferredBaseUri = 'file:///proj/pfc libs/pfcmain.pbl/pfc_n_base.sru';
    const shadowBaseUri = 'file:///proj/pfc libs/pfemain.pbl/pfc_n_base.sru';
    const mainUri = 'file:///proj/pfc libs/app.pbl/n_child.sru';

    workspaceState.addTopologyEntry({
      kind: 'project',
      data: {
        uri: 'file:///proj/generic_pfc_app.pbproj',
        name: 'generic_pfc_app',
        libraries: [
          'file:///proj/pfc libs/pfcmain.pbl',
          'file:///proj/pfc libs/pfemain.pbl',
          'file:///proj/pfc libs/app.pbl',
        ]
      }
    });

    setupAnalyzedDocument(preferredBaseUri, [
      'forward',
      'global type pfc_n_base from nonvisualobject',
      'end type',
      'end forward',
      'global type pfc_n_base from nonvisualobject',
      'end type'
    ].join('\r\n'));

    setupAnalyzedDocument(shadowBaseUri, [
      'forward',
      'global type pfc_n_base from nonvisualobject',
      'end type',
      'end forward',
      'global type pfc_n_base from nonvisualobject',
      'end type'
    ].join('\r\n'));

    const document = setupAnalyzedDocument(mainUri, [
      'forward',
      'global type n_child from pfc_n_base',
      'end type',
      'end forward',
      'global type n_child from pfc_n_base',
      'end type'
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const context = buildCurrentObjectContext(
      document,
      undefined,
      kb,
      graph,
      catalog,
      { workspaceState }
    );

    assert.equal(context.available, true);
    assert.equal(context.objectInfo?.project, 'file:///proj/generic_pfc_app.pbproj');
    assert.equal(context.ancestorChain?.[0]?.name, 'pfc_n_base');
    assert.equal(context.ancestorChain?.[0]?.uri, preferredBaseUri);
    assert.ok(context.relatedFiles?.some((entry) => entry.uri === preferredBaseUri && entry.role === 'ancestor'));
  });

  test('marca ancestros nativos del lenguaje como systemType en la cadena de contexto', () => {
    const document = setupAnalyzedDocument('file:///proj/lib_app.pbl/pfc_n_crypterobject.sru', [
      'forward',
      'global type pfc_n_crypterobject from crypterobject',
      'end type',
      'end forward',
      'global type pfc_n_crypterobject from crypterobject',
      'end type'
    ].join('\r\n'));

    const context = buildCurrentObjectContext(
      document,
      undefined,
      kb,
      graph,
      catalog,
      { workspaceState }
    );

    assert.equal(context.available, true);
  assert.equal(context.objectInfo?.objectKind, 'userobject');
    assert.deepEqual(context.ancestorChain?.map((entry) => entry.name), ['crypterobject', 'powerobject']);
    assert.equal(context.ancestorChain?.[0]?.isSystemType, true);
    assert.equal(context.ancestorChain?.[1]?.isSystemType, true);
    assert.equal(context.ancestorChain?.[0]?.uri, undefined);
  });

  test('expone embedded SQL anchors con confidence y transaction target en el context pack', () => {
    const document = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_sql_context.srw', [
      'forward',
      'global type w_sql_context from window',
      'end type',
      'end forward',
      'global type w_sql_context from window',
      'end type',
      'event open();',
      '  long ll_order_id',
      '  CONNECT USING SQLCA;',
      '  SELECT order_id',
      '    INTO :ll_order_id',
      '    FROM sales_order;',
      'end event'
    ].join('\r\n'));

    const context = buildCurrentObjectContext(
      document,
      { line: 9, character: 4 },
      kb,
      graph,
      catalog,
      { workspaceState }
    );

    assert.equal(context.available, true);
    assert.equal(context.embeddedSqlAnchors?.length, 2);
    assert.deepEqual(context.embeddedSqlAnchors?.[0], {
      startLine: 8,
      endLine: 8,
      keyword: 'CONNECT',
      preview: ' CONNECT USING SQLCA;'.trimStart(),
      confidence: 'high',
      transactionTarget: 'SQLCA'
    });
    assert.deepEqual(context.embeddedSqlAnchors?.[1], {
      startLine: 9,
      endLine: 11,
      keyword: 'SELECT',
      preview: ' SELECT order_id INTO :ll_order_id FROM sales_order;'.trimStart(),
      confidence: 'high',
      transactionTarget: 'SQLCA'
    });
  });

  test('expone anchors para statements SQL adicionales sin confundir llamadas normales', () => {
    const document = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_sql_commit.srw', [
      'forward',
      'global type w_sql_commit from window',
      'end type',
      'end forward',
      'global type w_sql_commit from window',
      'end type',
      'event open();',
      '  COMMIT USING SQLCA;',
      '  open(w_child)',
      'end event'
    ].join('\r\n'));

    const context = buildCurrentObjectContext(
      document,
      { line: 7, character: 2 },
      kb,
      graph,
      catalog,
      { workspaceState }
    );

    assert.equal(context.available, true);
    assert.equal(context.embeddedSqlAnchors?.length, 1);
    assert.deepEqual(context.embeddedSqlAnchors?.[0], {
      startLine: 7,
      endLine: 7,
      keyword: 'COMMIT',
      preview: ' COMMIT USING SQLCA;'.trimStart(),
      confidence: 'medium',
      transactionTarget: 'SQLCA'
    });
  });

  test('expone policy de knowledge packs cuando un objeto custom hereda de un owner curado', () => {
    const document = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_browser_host.srw', [
      'forward',
      'global type w_browser_host from webbrowser',
      'end type',
      'end forward',
      'global type w_browser_host from webbrowser',
      'end type',
      'event open();',
      'end event'
    ].join('\r\n'));

    const context = buildCurrentObjectContext(
      document,
      { line: 6, character: 4 },
      kb,
      graph,
      catalog,
      { workspaceState }
    );

    assert.equal(context.available, true);
    assert.equal(context.frameworkKnowledgeConflict?.state, 'workspace-wins');
    assert.equal(context.frameworkKnowledgeConflict?.confidence, 'high');
    assert.ok(context.frameworkKnowledgeConflict?.matchedOwnerTypes.includes('webbrowser'));
    assert.ok(context.frameworkKnowledgeConflict?.packs.some((pack) => pack.id === 'appeon-webbrowser-webview2'));
  });

  test('hereda knowledge packs framework-specific desde ancestros del grafo local', () => {
    setupAnalyzedDocument('file:///proj/std_fc_pb_base_e.pbl/wn_controller_master.srw', [
      'forward',
      'global type wn_controller_master from window',
      'end type',
      'end forward',
      'global type wn_controller_master from window',
      'end type'
    ].join('\r\n'));

    setupAnalyzedDocument('file:///proj/oes_main.pbl/wn_controller_orderentry_e.srw', [
      'forward',
      'global type wn_controller_orderentry_e from wn_controller_master',
      'end type',
      'end forward',
      'global type wn_controller_orderentry_e from wn_controller_master',
      'end type'
    ].join('\r\n'));

    const document = setupAnalyzedDocument('file:///proj/oes_main.pbl/wn_controller_orderentry_custom.srw', [
      'forward',
      'global type wn_controller_orderentry_custom from wn_controller_orderentry_e',
      'end type',
      'end forward',
      'global type wn_controller_orderentry_custom from wn_controller_orderentry_e',
      'end type'
    ].join('\r\n'));

    const context = buildCurrentObjectContext(
      document,
      undefined,
      kb,
      graph,
      catalog,
      { workspaceState }
    );

    assert.equal(context.available, true);
    assert.equal(context.frameworkKnowledgeConflict?.state, 'workspace-wins');
    assert.ok(context.frameworkKnowledgeConflict?.matchedOwnerTypes.includes('wn_controller_master'));
    assert.ok(context.frameworkKnowledgeConflict?.packs.some((pack) => pack.id === 'std-controller-shells'));
  });
});