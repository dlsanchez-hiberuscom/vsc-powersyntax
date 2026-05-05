import * as assert from 'assert/strict';

import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildDiagnosticsSnapshot } from '../../../src/server/features/diagnosticsSnapshot';
import { buildPowerBuilderTechnicalDebtReport } from '../../../src/server/features/powerBuilderTechnicalDebtReport';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import type { SourceOrigin } from '../../../src/shared/sourceOrigin';

suite('unit/powerBuilderTechnicalDebtReport (B261)', () => {
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

  test('prioriza hotspots defendibles de modernización por objeto', () => {
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

    setupAnalyzedDocument(dataWindowUri, [
      '$PBExportHeader$d_orders.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT order_id FROM sales_order")',
    ].join('\r\n'));

    setupAnalyzedDocument(focusUri, [
      'forward prototypes',
      'function int MessageBeep(int ai_type) library "user32.dll" alias for "MessageBeep"',
      'end prototypes',
      'forward',
      'global type w_report from window',
      'end type',
      'end forward',
      'global type w_report from window',
      'end type',
      '',
      'event open();',
      '  CONNECT USING SQLCA;',
      '  string ls_sql',
      '  dw_orders.DataObject = "d_orders"',
      '  if IsValid(dw_orders) then',
      '    SELECT order_id',
      '      INTO :ll_order_id',
      '      FROM sales_order;',
      '    ls_sql = "SELECT order_id FROM sales_order WHERE order_id = " + string(1)',
      '    prepare sqlsa from :ls_sql;',
      '  end if',
      '  if Len(ls_sql) > 0 then',
      '    Yield()',
      '  end if',
      'end event',
      '',
      'public function integer of_calculate(integer ai_value);',
      '  if ai_value > 0 then',
      '    ai_value = ai_value + 1',
      '  end if',
      '  if ai_value > 10 then',
      '    ai_value = ai_value - 1',
      '  end if',
      '  return ai_value',
      'end function',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const diagnosticsSummary = buildDiagnosticsSnapshot(new Map([
      [focusUri, {
        diagnostics: [
          {
            severity: DiagnosticSeverity.Warning,
            source: 'PowerScript',
            code: 'SD7',
            message: 'obsolete runtime helper',
            range: { start: { line: 18, character: 4 }, end: { line: 18, character: 9 } },
          },
          {
            severity: DiagnosticSeverity.Warning,
            source: 'PowerScript',
            code: 'dataobject-dynamic',
            message: 'dynamic dataobject',
            range: { start: { line: 12, character: 2 }, end: { line: 12, character: 20 } },
          },
          {
            severity: DiagnosticSeverity.Information,
            source: 'PowerScript',
            code: 'native-dependency',
            message: 'native dependency',
            range: { start: { line: 0, character: 0 }, end: { line: 0, character: 8 } },
          },
        ],
        projectKey: 'file:///proj/app.pbt',
        projectLabel: 'app',
        objectKey: 'w_report',
        objectLabel: 'w_report',
        sourceOrigin: 'pbl-folder-source',
      }],
    ]));

    const report = buildPowerBuilderTechnicalDebtReport(undefined, kb, workspaceState, diagnosticsSummary);
    const hotspot = report.hotspots.find((entry) => entry.name === 'w_report');

    assert.equal(report.schemaVersion, '1.0.0');
    assert.equal(report.summary.totalHotspots, 1);
    assert.equal(report.summary.obsoleteFindings, 1);
    assert.equal(report.summary.dynamicSqlFindings, 1);
    assert.equal(report.summary.externalDependencyFindings, 1);
    assert.equal(report.summary.dataWindowRiskFindings, 1);
    assert.equal(report.summary.complexObjectFindings, 1);
    assert.ok(hotspot);
    assert.equal(hotspot?.priority, 'high');
    assert.equal(hotspot?.confidence, 'high');
    assert.ok(hotspot?.categories.includes('obsolete'));
    assert.ok(hotspot?.categories.includes('dynamic-sql'));
    assert.ok(hotspot?.categories.includes('external-dependency'));
    assert.ok(hotspot?.categories.includes('datawindow-risk'));
    assert.ok(hotspot?.categories.includes('complexity'));
    assert.ok(hotspot?.evidence.some((entry) => entry.includes('diagnostic:SD7')));
    assert.ok(hotspot?.evidence.some((entry) => entry.includes('dynamic-sql:prepare')));
    assert.ok(hotspot?.evidence.some((entry) => entry.includes('sql-anchor:select:16-18')));
    assert.deepEqual(hotspot?.embeddedSqlAnchors, [{
      startLine: 15,
      endLine: 17,
      keyword: 'SELECT',
      preview: 'SELECT order_id INTO :ll_order_id FROM sales_order;',
      confidence: 'high',
      transactionTarget: 'SQLCA'
    }]);
    assert.ok(hotspot?.recommendations.some((entry) => /obsolete|sql dinámico|datawindow/i.test(entry)));
  });

  test('publica riesgo lifecycle específico cuando faltan super calls o hooks resolubles', () => {
    const focusUri = 'file:///proj/lib_app.pbl/w_lifecycle.srw';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });

    setupAnalyzedDocument(focusUri, [
      'forward',
      'global type w_lifecycle from window',
      'end type',
      'end forward',
      'global type w_lifecycle from window',
      'end type',
      'event open();',
      'end event',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const diagnosticsSummary = buildDiagnosticsSnapshot(new Map([
      [focusUri, {
        diagnostics: [
          {
            severity: DiagnosticSeverity.Warning,
            source: 'PowerScript',
            code: 'missing-super-create',
            message: 'missing super create',
            range: { start: { line: 6, character: 0 }, end: { line: 6, character: 8 } },
          },
          {
            severity: DiagnosticSeverity.Warning,
            source: 'PowerScript',
            code: 'missing-trigger-constructor',
            message: 'missing constructor trigger',
            range: { start: { line: 6, character: 0 }, end: { line: 6, character: 8 } },
          },
          {
            severity: DiagnosticSeverity.Warning,
            source: 'PowerScript',
            code: 'unresolved-destructor',
            message: 'unresolved destructor hook',
            range: { start: { line: 6, character: 0 }, end: { line: 6, character: 8 } },
          },
        ],
        projectKey: 'file:///proj/app.pbt',
        projectLabel: 'app',
        objectKey: 'w_lifecycle',
        objectLabel: 'w_lifecycle',
        sourceOrigin: 'pbl-folder-source',
      }],
    ]));

    const report = buildPowerBuilderTechnicalDebtReport(undefined, kb, workspaceState, diagnosticsSummary);
    const hotspot = report.hotspots.find((entry) => entry.name === 'w_lifecycle');

    assert.ok(hotspot);
    assert.equal(report.summary.lifecycleRiskFindings, 3);
    assert.ok(hotspot?.categories.includes('lifecycle-risk'));
    assert.equal(hotspot?.metrics.lifecycleWarnings, 3);
    assert.ok(hotspot?.evidence.includes('diagnostic:lifecycle-missing-super=1'));
    assert.ok(hotspot?.evidence.includes('diagnostic:lifecycle-missing-trigger=1'));
    assert.ok(hotspot?.evidence.includes('diagnostic:lifecycle-unresolved-hook=1'));
    assert.ok(hotspot?.recommendations.some((entry) => /lifecycle|ancestor|hook/i.test(entry)));
  });

  test('desglosa dependencias externas por tipo y alias en el hotspot nativo', () => {
    const focusUri = 'file:///proj/lib_app.pbl/w_native.srw';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });

    setupAnalyzedDocument(focusUri, [
      'forward prototypes',
      'function int MessageBeep(int ai_type) library "user32.dll" alias for "MessageBeep"',
      'subroutine PBXCall() library "native_driver.pbx" alias for "PBXEntry"',
      'function int Mystery() library "legacy.bin"',
      'end prototypes',
      'forward',
      'global type w_native from window',
      'end type',
      'end forward',
      'global type w_native from window',
      'end type',
      'event open();',
      '  MessageBeep(1)',
      '  PBXCall()',
      '  Mystery()',
      'end event',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const report = buildPowerBuilderTechnicalDebtReport(undefined, kb, workspaceState, null);
    const hotspot = report.hotspots.find((entry) => entry.name === 'w_native');

    assert.ok(hotspot);
    assert.ok(hotspot?.categories.includes('external-dependency'));
    assert.equal(hotspot?.metrics.externalDependencies, 3);
    assert.ok(hotspot?.evidence.includes('external-consumers=3'));
    assert.ok(hotspot?.evidence.includes('external-kind:dll=1'));
    assert.ok(hotspot?.evidence.includes('external-kind:pbx=1'));
    assert.ok(hotspot?.evidence.includes('external-kind:unknown=1'));
    assert.ok(hotspot?.evidence.includes('external-alias:PBXEntry'));
    assert.ok(hotspot?.evidence.includes('external-risk:native-runtime'));
    assert.ok(hotspot?.evidence.includes('external-build-impact:manual-native-deployment'));
    assert.ok(hotspot?.evidence.includes('external-risk:pbni-runtime-surface'));
    assert.ok(hotspot?.evidence.includes('external-orca-impact:manual-pbx-packaging'));
  });

  test('publica integración HTTP/REST/JSON como hotspot moderno visible', () => {
    const focusUri = 'file:///proj/lib_app.pbl/n_http_json_usage.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });

    setupAnalyzedDocument(focusUri, [
      'forward',
      'global type n_http_json_usage from httpclient',
      'end type',
      'end forward',
      'global type n_http_json_usage from httpclient',
      'restclient inv_rest',
      'jsonparser inv_parser',
      'jsongenerator inv_writer',
      'event open();',
      '  integer li_rc',
      '  li_rc = inv_rest.Get("https://api.example.test/orders/42?token=secret")',
      '  inv_rest.SetRequestHeader("Authorization", "Bearer super-secret")',
      '  inv_rest.SetRequestHeader("Content-Type", "application/json")',
      'end event',
      'end type',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const report = buildPowerBuilderTechnicalDebtReport(undefined, kb, workspaceState, null);
    const hotspot = report.hotspots.find((entry) => entry.name === 'n_http_json_usage');

    assert.ok(hotspot);
    assert.ok(hotspot?.categories.includes('modern-integration'));
    assert.equal(hotspot?.metrics.httpIntegrationUsages, 2);
    assert.equal(hotspot?.metrics.jsonIntegrationUsages, 2);
    assert.ok(hotspot?.evidence.includes('metric:httpIntegrationUsages=2'));
    assert.ok(hotspot?.evidence.includes('metric:jsonIntegrationUsages=2'));
    assert.ok(hotspot?.evidence.includes('integration-endpoint:https://redacted-host/...'));
    assert.ok(hotspot?.evidence.includes('integration-pattern:http-verb:get'));
    assert.ok(hotspot?.evidence.includes('integration-pattern:authorization-header'));
    assert.ok(hotspot?.evidence.includes('integration-pattern:content-type-header'));
    assert.ok(hotspot?.evidence.includes('integration-pattern:json-payload'));
    assert.ok(hotspot?.evidence.every((entry) => !entry.includes('api.example.test')));
    assert.ok(hotspot?.evidence.every((entry) => !entry.includes('orders/42')));
    assert.ok(hotspot?.evidence.every((entry) => !entry.includes('token=secret')));
    assert.ok(hotspot?.evidence.every((entry) => !entry.includes('super-secret')));
    assert.equal(report.summary.modernIntegrationFindings, 4);
    assert.ok(hotspot?.recommendations.some((entry) => /HTTP|REST|JSON|redact/i.test(entry)));
  });

  test('redacta endpoints host:puerto sin esquema cuando el hotspot moderno los expone', () => {
    const focusUri = 'file:///proj/lib_app.pbl/n_http_hostless_usage.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });

    setupAnalyzedDocument(focusUri, [
      'forward',
      'global type n_http_hostless_usage from httpclient',
      'end type',
      'end forward',
      'global type n_http_hostless_usage from httpclient',
      'restclient inv_rest',
      'event open();',
      '  inv_rest.SetRequestUri("localhost:8080/api/orders/42?token=secret")',
      'end event',
      'end type',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const report = buildPowerBuilderTechnicalDebtReport(undefined, kb, workspaceState, null);
    const hotspot = report.hotspots.find((entry) => entry.name === 'n_http_hostless_usage');

    assert.ok(hotspot);
    assert.ok(hotspot?.evidence.includes('integration-endpoint:http://redacted-host/...'));
    assert.ok(hotspot?.evidence.every((entry) => !entry.includes('localhost:8080')));
    assert.ok(hotspot?.evidence.every((entry) => !entry.includes('orders/42')));
    assert.ok(hotspot?.evidence.every((entry) => !entry.includes('token=secret')));
  });

  test('publica patrones WebBrowser/WebView2 como hotspot visible de interop web', () => {
    const focusUri = 'file:///proj/lib_app.pbl/w_browser_host.srw';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });

    setupAnalyzedDocument(focusUri, [
      'forward',
      'global type w_browser_host from window',
      'end type',
      'end forward',
      'global type w_browser_host from window',
      'webbrowser wb_shell',
      'end type',
      'event open();',
      '  wb_shell.Navigate("https://portal.example.test/home")',
      '  wb_shell.EvaluateJavascriptAsync("window.chrome.webview.postMessage(\'ready\')")',
      '  li_rc = WebBrowserSet("remote-debugging-port", "8210")',
      'end event',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const report = buildPowerBuilderTechnicalDebtReport(undefined, kb, workspaceState, null);
    const hotspot = report.hotspots.find((entry) => entry.name === 'w_browser_host');

    assert.ok(hotspot);
    assert.ok(hotspot?.categories.includes('web-ui-integration'));
    assert.equal(hotspot?.metrics.webBrowserUsages, 1);
    assert.ok(hotspot?.evidence.includes('metric:webBrowserUsages=1'));
    assert.ok(hotspot?.evidence.includes('web-ui-surface:webbrowser'));
    assert.ok(hotspot?.evidence.includes('web-ui-pattern:navigation'));
    assert.ok(hotspot?.evidence.includes('web-ui-pattern:script-bridge'));
    assert.ok(hotspot?.evidence.includes('web-ui-pattern:remote-debugging'));
    assert.ok(hotspot?.evidence.includes('web-ui-risk:no-content-inspection'));
    assert.equal(report.summary.webUiIntegrationFindings, 1);
    assert.ok(hotspot?.recommendations.some((entry) => /WebView2|JavaScript|web/i.test(entry)));
  });

  test('resume riesgos sourceOrigin y ORCA/PBL con recomendaciones accionables', () => {
    workspaceState.addRoot('libraries', 'file:///legacy/lib_legacy.pbl');
    workspaceState.addSourceFile('file:///legacy/lib_legacy.pbl/w_legacy.srw', 'pbl-folder-source');
    workspaceState.addSourceFile('file:///legacy/orca-staging/lib_legacy.pbl-source/w_stage.srw', 'orca-staging');
    workspaceState.registerLibrarySourceAlias('file:///legacy/lib_legacy.pbl', 'file:///legacy/orca-staging/lib_legacy.pbl-source');
    workspaceState.refreshProjectRouting();

    const report = buildPowerBuilderTechnicalDebtReport(undefined, kb, workspaceState, null);

    assert.ok(report.recommendations.some((entry) =>
      entry.category === 'legacy-layout'
      && entry.priority === 'high'
      && entry.evidence.some((evidence) => /mode:pbl-only/i.test(evidence))
    ));
    assert.ok(report.recommendations.some((entry) =>
      entry.category === 'source-origin'
      && entry.evidence.some((evidence) => /orca-staging:1/i.test(evidence))
    ));
    assert.ok(report.recommendations.some((entry) =>
      entry.category === 'orca-pbl'
      && entry.evidence.some((evidence) => /orca-aliases:1/i.test(evidence))
    ));
    assert.equal(report.summary.sourceOriginRiskFindings, 1);
    assert.equal(report.summary.legacyWorkspaceRiskFindings, 2);
  });

  test('mantiene riesgo DataWindow cuando el flujo Retrieve/Update queda degradado por binding dinámico o transacción ausente', () => {
    const focusUri = 'file:///proj/lib_app.pbl/w_txn.srw';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });

    setupAnalyzedDocument(focusUri, [
      'forward',
      'global type w_txn from window',
      'end type',
      'end forward',
      'global type w_txn from window',
      'end type',
      '',
      'event open();',
      '  string ls_dataobject',
      '  ls_dataobject = "d_orders"',
      '  dw_orders.DataObject = ls_dataobject',
      '  dw_orders.Retrieve(1)',
      'end event',
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const diagnosticsSummary = buildDiagnosticsSnapshot(new Map([
      [focusUri, {
        diagnostics: [
          {
            severity: DiagnosticSeverity.Information,
            source: 'PowerScript',
            code: 'dataobject-dynamic',
            message: 'dynamic dataobject',
            range: { start: { line: 10, character: 2 }, end: { line: 10, character: 24 } },
          },
          {
            severity: DiagnosticSeverity.Warning,
            source: 'PowerScript',
            code: 'transaction-binding-missing',
            message: 'missing transaction binding',
            range: { start: { line: 11, character: 12 }, end: { line: 11, character: 20 } },
          },
          {
            severity: DiagnosticSeverity.Warning,
            source: 'PowerScript',
            code: 'retrieve-arity-mismatch',
            message: 'retrieve arity mismatch',
            range: { start: { line: 11, character: 12 }, end: { line: 11, character: 20 } },
          },
        ],
        projectKey: 'file:///proj/app.pbt',
        projectLabel: 'app',
        objectKey: 'w_txn',
        objectLabel: 'w_txn',
        sourceOrigin: 'pbl-folder-source',
      }],
    ]));

    const report = buildPowerBuilderTechnicalDebtReport(undefined, kb, workspaceState, diagnosticsSummary);
    const hotspot = report.hotspots.find((entry) => entry.name === 'w_txn');

    assert.ok(hotspot);
    assert.ok(hotspot?.categories.includes('datawindow-risk'));
    assert.ok(hotspot?.evidence.includes('diagnostic:dataobject-binding=1'));
    assert.ok(hotspot?.evidence.includes('diagnostic:transaction-binding=1'));
    assert.ok(hotspot?.evidence.includes('diagnostic:retrieve-arity=1'));
  });
});