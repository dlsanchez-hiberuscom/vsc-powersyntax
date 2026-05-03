import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildDataWindowSqlLineage } from '../../../src/server/features/dataWindowSqlLineage';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';

suite('unit/dataWindowSqlLineage (B253)', () => {
  let kb: KnowledgeBase;

  setup(() => {
    kb = new KnowledgeBase();
  });

  function setupAnalyzedDocument(uri: string, content: string): TextDocument {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    return document;
  }

  test('recorre retrieve, report children y dropdown children con degradación honesta cuando falta un target', () => {
    setupAnalyzedDocument('file:///d_parent.srd', [
      '$PBExportHeader$d_parent.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(10) update=yes name=status_id dbname="sales.status_id" dddw.name="d_status") retrieve="SELECT parent_id, status_id FROM parent")',
      'report(name=rpt_orders dataobject="d_orders")',
      'report(name=rpt_missing dataobject="d_missing")',
    ].join('\r\n'));
    setupAnalyzedDocument('file:///d_orders.srd', [
      '$PBExportHeader$d_orders.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT order_id, order_status FROM orders")',
    ].join('\r\n'));
    setupAnalyzedDocument('file:///d_status.srd', [
      '$PBExportHeader$d_status.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT status_id, status_label FROM statuses")',
    ].join('\r\n'));
    const script = setupAnalyzedDocument('file:///w_parent.srw', [
      'global type w_parent from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent"',
      '  dw_parent.Retrieve()',
      'end event',
    ].join('\r\n'));

    const line = script.getText().split(/\r?\n/).findIndex((entry) => entry.includes('Retrieve()'));
    const lineage = buildDataWindowSqlLineage({
      uri: script.uri,
      line,
      maxDepth: 4,
    }, kb);

    assert.equal(lineage.available, true);
    assert.equal(lineage.source.kind, 'script-binding');
    assert.equal(lineage.source.dataObject, 'd_parent');
    assert.equal(lineage.lineage?.dataObject, 'd_parent');
    assert.match(lineage.lineage?.statement ?? '', /SELECT parent_id, status_id FROM parent/);
    assert.equal(lineage.lineage?.sqlReferences.length, 2);
    assert.ok(lineage.lineage?.children.some((child) => child.relation === 'report-child' && child.dataObject === 'd_orders' && child.state === 'resolved'));
    assert.ok(lineage.lineage?.children.some((child) => child.relation === 'dropdown-child' && child.dataObject === 'd_status' && child.state === 'resolved'));
    assert.ok(lineage.lineage?.children.some((child) => child.dataObject === 'd_missing' && child.state === 'missing'));
    assert.equal(lineage.summary.unresolvedLinks, 1);
    assert.equal(lineage.summary.totalStatements, 3);
    assert.equal(lineage.summary.maxDepthReached, false);
  });

  test('B288 expone aliases, joins simples y where básico en el lineage SQL read-only', () => {
    setupAnalyzedDocument('file:///d_customer_orders.srd', [
      '$PBExportHeader$d_customer_orders.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT c.customer_id AS customer_id, o.status FROM customer c JOIN orders o ON o.customer_id = c.customer_id WHERE o.status = :status AND c.deleted = 0")',
    ].join('\r\n'));
    const script = setupAnalyzedDocument('file:///w_customer_orders.srw', [
      'global type w_customer_orders from window',
      'end type',
      '',
      'event open();',
      '  dw_orders.DataObject = "d_customer_orders"',
      '  dw_orders.Retrieve() ',
      'end event',
    ].join('\r\n'));

    const line = script.getText().split(/\r?\n/).findIndex((entry) => entry.includes('Retrieve()'));
    const lineage = buildDataWindowSqlLineage({
      uri: script.uri,
      line,
      maxDepth: 2,
    }, kb);

    assert.equal(lineage.available, true);
    assert.deepEqual(
      lineage.lineage?.sqlReferences.map((entry) => ({ rawText: entry.rawText, qualifiedTableName: entry.qualifiedTableName, columnName: entry.columnName })),
      [
        { rawText: 'c.customer_id', qualifiedTableName: 'customer', columnName: 'customer_id' },
        { rawText: 'o.status', qualifiedTableName: 'orders', columnName: 'status' },
        { rawText: 'o.customer_id', qualifiedTableName: 'orders', columnName: 'customer_id' },
        { rawText: 'c.customer_id', qualifiedTableName: 'customer', columnName: 'customer_id' },
        { rawText: 'o.status', qualifiedTableName: 'orders', columnName: 'status' },
        { rawText: 'c.deleted', qualifiedTableName: 'customer', columnName: 'deleted' },
      ]
    );
  });
});