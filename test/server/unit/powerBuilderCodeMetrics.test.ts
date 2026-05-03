import * as assert from 'assert/strict';

import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildDiagnosticsSnapshot } from '../../../src/server/features/diagnosticsSnapshot';
import { buildPowerBuilderCodeMetrics } from '../../../src/server/features/powerBuilderCodeMetrics';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import type { SourceOrigin } from '../../../src/shared/sourceOrigin';

suite('unit/powerBuilderCodeMetrics (B260)', () => {
  let kb: KnowledgeBase;
  let workspaceState: WorkspaceState;

  setup(() => {
    kb = new KnowledgeBase();
    workspaceState = new WorkspaceState();
  });

  function setupAnalyzedDocument(
    uri: string,
    content: string,
    sourceOrigin: SourceOrigin = 'pbl-folder-source'
  ): TextDocument {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    workspaceState.addSourceFile(uri, sourceOrigin);
    return document;
  }

  test('agrega métricas defendibles por objeto desde snapshots y facts ya indexados', () => {
    const baseUri = 'file:///proj/lib_app.pbl/w_base.sru';
    const focusUri = 'file:///proj/lib_app.pbl/w_report.srw';
    const dataWindowUri = 'file:///proj/lib_app.pbl/d_orders.srd';

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
      '',
      'event open();',
      'end event',
    ].join('\r\n'));

    setupAnalyzedDocument(dataWindowUri, [
      '$PBExportHeader$d_orders.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT order_id, customer_id FROM sales_order")',
    ].join('\r\n'));

    setupAnalyzedDocument(focusUri, [
      'forward prototypes',
      'function int MessageBeep(int ai_type) library "user32.dll" alias for "MessageBeep"',
      'end prototypes',
      'forward',
      'global type w_report from w_base',
      'end type',
      'end forward',
      'global type w_report from w_base',
      'end type',
      '',
      'event open();',
      '  CONNECT USING SQLCA;',
      '  dw_orders.DataObject = "d_orders"',
      '  if IsValid(dw_orders) then',
      '    SELECT order_id',
      '    INTO :ll_order_id',
      '    FROM sales_order;',
      '  end if',
      'end event',
      '',
      'public function integer of_calculate(integer ai_value);',
      '  if ai_value > 0 then',
      '    ai_value = ai_value + 1',
      '  end if',
      '  return ai_value',
      'end function',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const metrics = buildPowerBuilderCodeMetrics(undefined, kb, workspaceState, null);
    const focusObject = metrics.objects.find((entry) => entry.name === 'w_report');

    assert.equal(metrics.schemaVersion, '1.0.0');
    assert.equal(metrics.summary.totalProjects, 1);
    assert.equal(metrics.summary.totalLibraries, 1);
    assert.equal(metrics.summary.totalObjects, 3);
    assert.ok(focusObject);
    assert.equal(focusObject?.projectUri, 'file:///proj/app.pbt');
    assert.equal(focusObject?.library, 'file:///proj/lib_app.pbl');
    assert.equal(focusObject?.metrics.functions, 2);
    assert.equal(focusObject?.metrics.events, 1);
    assert.equal(focusObject?.metrics.embeddedSqlStatements, 1);
    assert.equal(focusObject?.metrics.linkedDataWindows, 1);
    assert.equal(focusObject?.metrics.externalDependencies, 1);
    assert.deepEqual(focusObject?.embeddedSqlAnchors, [{
      startLine: 14,
      endLine: 16,
      keyword: 'SELECT',
      preview: 'SELECT order_id INTO :ll_order_id FROM sales_order;',
      confidence: 'high',
      transactionTarget: 'SQLCA'
    }]);
    assert.ok((focusObject?.metrics.approximateComplexity ?? 0) >= 2);
  });

  test('resume lifecycle warnings, diagnósticos por área y footprint build/ORCA', () => {
    const focusUri = 'file:///proj/lib_app.pbl/w_report.srw';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });
    workspaceState.addBuildFileCandidate({
      uri: 'file:///proj/build/app-build.json',
      hasBuildPlan: true,
      referencedProjectUris: ['file:///proj/app.pbt'],
    });

    setupAnalyzedDocument(focusUri, [
      'forward',
      'global type w_report from window',
      'end type',
      'end forward',
      'global type w_report from window',
      'end type',
    ].join('\r\n'));
    workspaceState.addSourceFile('file:///proj/orca-staging/lib_app.pbl-source/n_orca_helper.sru', 'orca-staging');
    workspaceState.refreshProjectRouting();

    const diagnosticsSummary = buildDiagnosticsSnapshot(new Map([
      [focusUri, {
        diagnostics: [
          {
            severity: DiagnosticSeverity.Warning,
            source: 'PowerScript',
            code: 'missing-super-create',
            message: 'missing super create',
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 5 } },
          },
          {
            severity: DiagnosticSeverity.Warning,
            source: 'PowerScript',
            code: 'dataobject-dynamic',
            message: 'dynamic dataobject',
            range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } },
          },
          {
            severity: DiagnosticSeverity.Information,
            source: 'PowerScript',
            code: 'native-dependency',
            message: 'native dependency',
            range: { start: { line: 2, character: 0 }, end: { line: 2, character: 5 } },
          },
        ],
        projectKey: 'file:///proj/app.pbt',
        projectLabel: 'app',
        objectKey: 'w_report',
        objectLabel: 'w_report',
        sourceOrigin: 'pbl-folder-source',
      }],
    ]));

    const metrics = buildPowerBuilderCodeMetrics(undefined, kb, workspaceState, diagnosticsSummary);
    const focusObject = metrics.objects.find((entry) => entry.name === 'w_report');

    assert.ok(focusObject);
    assert.equal(focusObject?.metrics.lifecycleWarnings, 1);
    assert.equal(focusObject?.metrics.diagnostics, 3);
    assert.deepEqual(metrics.diagnostics.byArea, [
      { area: 'datawindow', total: 1 },
      { area: 'external', total: 1 },
      { area: 'lifecycle', total: 1 },
    ]);
    assert.equal(metrics.footprint.build.total, 1);
    assert.equal(metrics.footprint.build.usable, 1);
    assert.equal(metrics.footprint.orca.stagedFiles, 1);
  });
});