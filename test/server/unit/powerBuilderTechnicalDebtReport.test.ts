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
      '  string ls_sql',
      '  dw_orders.DataObject = "d_orders"',
      '  if IsValid(dw_orders) then',
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
    assert.ok(hotspot?.recommendations.some((entry) => /obsolete|sql dinámico|datawindow/i.test(entry)));
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
});