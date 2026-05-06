import * as assert from 'assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { clearDocumentAnalysisCache, getDocumentAnalysis, invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { createDataWindowFastContext } from '../../../src/server/features/dataWindowFastContext';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';

suite('unit/dataWindowFastContext (Bloque 6)', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let systemCatalog: SystemCatalog;

  setup(() => {
    clearDocumentAnalysisCache();
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    systemCatalog = new SystemCatalog();
  });

  teardown(() => {
    clearDocumentAnalysisCache();
  });

  function setupAnalyzedDocument(uri: string, content: string): TextDocument {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    invalidateDocumentAnalysis(uri);
    getDocumentAnalysis(document);
    return document;
  }

  test('expone DataWindow control con DataObject literal resuelto, columnas, properties y buffers oficiales', () => {
    setupAnalyzedDocument('file:///d_customer.srd', [
      '$PBExportHeader$d_customer.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(10) update=yes name=customer_id dbname="customer.customer_id") retrieve="SELECT customer_id FROM customer")',
    ].join('\r\n'));
    const document = setupAnalyzedDocument('file:///w_customer.srw', [
      'global type w_customer from window',
      'end type',
      '',
      'event open();',
      '  dw_customer.DataObject = "d_customer"',
      '  dw_customer.Retrieve()',
      'end event',
    ].join('\r\n'));

    const context = createDataWindowFastContext({
      document,
      position: Position.create(5, 15),
      kb,
      graph,
      systemCatalog,
      receiverName: 'dw_customer',
      receiverType: 'datawindow',
      sourceOrigin: 'workspace-ws_objects',
    });

    assert.equal(context.receiverKind, 'datawindow-control');
    assert.equal(context.binding.confidence, 'high');
    assert.deepEqual(context.binding.reasonCodes, ['dataobject-literal-resolved']);
    assert.equal(context.dataObjectName, 'd_customer');
    assert.deepEqual(context.columns.map((column) => column.name), ['customer_id']);
    assert.ok(context.propertyPaths.includes('DataWindow.Table.Select'));
    assert.deepEqual(context.buffers.map((buffer) => buffer.name).sort(), ['Delete!', 'Filter!', 'Primary!'].sort());
    assert.ok(context.builtIns.some((entry) => entry.name === 'Retrieve'));
    assert.match(context.cacheKey, /doc:1/);
    assert.match(context.cacheKey, /origin:workspace-ws_objects/);
    assert.match(context.cacheKey, /dataobject:d_customer/);
  });

  test('distingue DataStore y mantiene la misma ruta de DataObject literal', () => {
    setupAnalyzedDocument('file:///d_store_orders.srd', [
      '$PBExportHeader$d_store_orders.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=number name=order_id dbname="orders.order_id"))',
    ].join('\r\n'));
    const document = setupAnalyzedDocument('file:///n_store.sru', [
      'global type n_store from nonvisualobject',
      'end type',
      '',
      'public function integer of_load();',
      '  datastore lds_orders',
      '  lds_orders.DataObject = "d_store_orders"',
      '  lds_orders.Retrieve()',
      'end function',
    ].join('\r\n'));

    const context = createDataWindowFastContext({
      document,
      position: Position.create(6, 14),
      kb,
      graph,
      systemCatalog,
      receiverName: 'lds_orders',
      receiverType: 'datastore',
    });

    assert.equal(context.receiverKind, 'datastore');
    assert.equal(context.binding.confidence, 'high');
    assert.equal(context.dataObjectName, 'd_store_orders');
    assert.deepEqual(context.columns.map((column) => column.name), ['order_id']);
  });

  test('modela DataWindowChild obtenido por GetChild con confianza limitada', () => {
    setupAnalyzedDocument('file:///d_parent_fast.srd', [
      '$PBExportHeader$d_parent_fast.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states_fast"))',
    ].join('\r\n'));
    setupAnalyzedDocument('file:///d_states_fast.srd', [
      '$PBExportHeader$d_states_fast.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(2) name=state dbname="states.state"))',
    ].join('\r\n'));
    const document = setupAnalyzedDocument('file:///w_child_fast.srw', [
      'global type w_child_fast from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent_fast"',
      '  dw_parent.GetChild("state_id", dwc_state)',
      '  dwc_state.Retrieve()',
      'end event',
    ].join('\r\n'));

    const context = createDataWindowFastContext({
      document,
      position: Position.create(6, 12),
      kb,
      graph,
      systemCatalog,
      receiverName: 'dwc_state',
      receiverType: 'datawindowchild',
    });

    assert.equal(context.receiverKind, 'datawindowchild');
    assert.equal(context.binding.confidence, 'medium');
    assert.deepEqual(context.binding.reasonCodes, ['getchild-output-parameter']);
    assert.equal(context.dataObjectName, 'd_states_fast');
    assert.deepEqual(context.columns.map((column) => column.name), ['state']);
  });

  test('degrada DataObject dinamico a low confidence sin exponer columnas', () => {
    const document = setupAnalyzedDocument('file:///w_dynamic_dw.srw', [
      'global type w_dynamic_dw from window',
      'end type',
      '',
      'event open();',
      '  string ls_dataobject',
      '  dw_customer.DataObject = ls_dataobject',
      '  dw_customer.Retrieve()',
      'end event',
    ].join('\r\n'));

    const context = createDataWindowFastContext({
      document,
      position: Position.create(6, 15),
      kb,
      graph,
      systemCatalog,
      receiverName: 'dw_customer',
      receiverType: 'datawindow',
    });

    assert.equal(context.binding.state, 'dynamic');
    assert.equal(context.binding.confidence, 'low');
    assert.equal(context.binding.dynamic, true);
    assert.deepEqual(context.binding.reasonCodes, ['dataobject-dynamic-expression']);
    assert.deepEqual(context.columns, []);
    assert.deepEqual(context.computedFields, []);
    assert.deepEqual(context.propertyPaths, ['DataWindow.DataObject', 'DataWindow.Syntax', 'DataWindow.Table.Select', 'dddw.name']);
  });

  test('expone computed fields del DataWindow enlazado con dependencias seguras y sourceOrigin explicito', () => {
    setupAnalyzedDocument('file:///d_compute_fast.srd', [
      '$PBExportHeader$d_compute_fast.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=decimal(18,2) name=adjusted_hours dbname="emp.adjusted_hours")',
      ' column=(type=decimal(18,2) name=rate dbname="emp.rate") retrieve="SELECT adjusted_hours, rate FROM emp")',
      'compute(band=detail name=cc_total expression="adjusted_hours * rate")',
    ].join('\r\n'));
    const document = setupAnalyzedDocument('file:///w_compute_fast.srw', [
      'global type w_compute_fast from window',
      'end type',
      '',
      'event open();',
      '  dw_compute.DataObject = "d_compute_fast"',
      '  dw_compute.Retrieve()',
      'end event',
    ].join('\r\n'));

    const context = createDataWindowFastContext({
      document,
      position: Position.create(5, 15),
      kb,
      graph,
      systemCatalog,
      receiverName: 'dw_compute',
      receiverType: 'datawindow',
      sourceOrigin: 'workspace-ws_objects',
    });

    assert.equal(context.binding.confidence, 'high');
    assert.deepEqual(context.computedFields, [{
      name: 'cc_total',
      controlType: 'compute',
      propertyName: 'expression',
      expressionText: 'adjusted_hours * rate',
      dependencies: [
        { name: 'adjusted_hours', kind: 'table-column', sourceOrigin: 'datawindow-model' },
        { name: 'rate', kind: 'table-column', sourceOrigin: 'datawindow-model' },
      ],
      sourceOrigin: 'datawindow-model',
    }]);
  });

  test('usa cache caliente sin IO ni reanalisis completo', () => {
    setupAnalyzedDocument('file:///d_hot_fast.srd', [
      '$PBExportHeader$d_hot_fast.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(10) name=code dbname="codes.code"))',
    ].join('\r\n'));
    const document = setupAnalyzedDocument('file:///w_hot_fast.srw', [
      'global type w_hot_fast from window',
      'end type',
      '',
      'event open();',
      '  dw_hot.DataObject = "d_hot_fast"',
      '  dw_hot.Retrieve()',
      'end event',
    ].join('\r\n'));

    const nodeFs = require('node:fs') as typeof import('node:fs');
    const documentAnalysisModule = require('../../../src/server/analysis/documentAnalysis') as typeof import('../../../src/server/analysis/documentAnalysis');
    const originalReadFileSync = nodeFs.readFileSync;
    const originalReaddirSync = nodeFs.readdirSync;
    const originalAnalyzeDocument = documentAnalysisModule.analyzeDocument;
    let fsCalls = 0;
    let analyzeCalls = 0;

    nodeFs.readFileSync = ((...args: Parameters<typeof nodeFs.readFileSync>) => {
      fsCalls++;
      return originalReadFileSync(...args);
    }) as typeof nodeFs.readFileSync;
    nodeFs.readdirSync = ((...args: Parameters<typeof nodeFs.readdirSync>) => {
      fsCalls++;
      return originalReaddirSync(...args);
    }) as typeof nodeFs.readdirSync;
    documentAnalysisModule.analyzeDocument = ((...args: Parameters<typeof originalAnalyzeDocument>) => {
      analyzeCalls++;
      return originalAnalyzeDocument(...args);
    }) as typeof documentAnalysisModule.analyzeDocument;

    try {
      const context = createDataWindowFastContext({
        document,
        position: Position.create(5, 10),
        kb,
        graph,
        systemCatalog,
        receiverName: 'dw_hot',
        receiverType: 'datawindow',
      });
      assert.equal(context.binding.confidence, 'high');
    } finally {
      nodeFs.readFileSync = originalReadFileSync;
      nodeFs.readdirSync = originalReaddirSync;
      documentAnalysisModule.analyzeDocument = originalAnalyzeDocument;
    }

    assert.equal(fsCalls, 0);
    assert.equal(analyzeCalls, 0);
  });
});