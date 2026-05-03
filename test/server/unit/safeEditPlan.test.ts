import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildSafeEditPlan } from '../../../src/server/features/safeEditPlan';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/safeEditPlan (B219)', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let catalog: SystemCatalog;
  let workspaceState: WorkspaceState;
  let contentsByUri: Map<string, string>;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    catalog = new SystemCatalog();
    workspaceState = new WorkspaceState();
    contentsByUri = new Map<string, string>();
  });

  function setupAnalyzedDocument(uri: string, content: string): TextDocument {
    invalidateDocumentAnalysis(uri);
    contentsByUri.set(uri, content);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    workspaceState.addSourceFile(uri);
    return document;
  }

  test('genera un plan read-only con archivos, riesgos, tests y docs afectadas sin editar', async () => {
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
      '  ids_orders.SetTrans(SQLCA)',
      '  ids_orders.DataObject = "d_sales_orders"',
      '  ids_orders.Retrieve()',
      '  of_inherited()',
      'end subroutine'
    ].join('\r\n'));

    workspaceState.refreshProjectRouting();

    const lines = document.getText().split(/\r?\n/);
    const inheritedCallLine = lines.findIndex((line) => line.includes('of_inherited()'));
    const inheritedCallCharacter = lines[inheritedCallLine].indexOf('of_inherited') + 2;

    const plan = await buildSafeEditPlan(
      document,
      {
        line: inheritedCallLine,
        character: inheritedCallCharacter,
        maxSafeReferences: 16,
      },
      kb,
      graph,
      catalog,
      async (uri) => contentsByUri.get(uri) ?? null,
      { workspaceState }
    );

    assert.equal(plan.available, true);
    assert.equal(plan.blocked, false);
    assert.equal(plan.targetSymbol?.name, 'of_inherited');
    assert.ok(plan.files.some((entry) => entry.uri === mainUri));
    assert.ok(plan.files.some((entry) => entry.uri === dataWindowUri && entry.risk === 'high'));
    assert.ok(plan.risks.some((entry) => entry.includes('DataWindows vinculadas')));
    assert.ok(plan.risks.some((entry) => entry.includes('descendientes')));
    assert.ok(plan.recommendedTests.some((entry) => entry.includes('unit/references')));
    assert.ok(plan.recommendedTests.some((entry) => entry.includes('impactAnalysis|safeEditPlan|currentObjectContext')));
    assert.ok(plan.docsToReview.includes('docs/architecture.md'));
    assert.ok(plan.docsToReview.includes('docs/testing.md'));
    assert.ok(plan.docsToReview.includes('docs/rules-catalog.md'));
    assert.deepEqual(plan.blockedReasons, []);
  });

  test('bloquea el plan cuando el símbolo aparece en una invocación por string dinámico', async () => {
    const mainUri = 'file:///proj/lib_app.pbl/w_dynamic.srw';
    const document = setupAnalyzedDocument(mainUri, [
      'forward',
      'global type w_dynamic from window',
      'end type',
      'end forward',
      'global type w_dynamic from window',
      'end type',
      'public subroutine of_dynamic();',
      'end subroutine',
      'public subroutine of_call();',
      '  PostEvent("of_dynamic")',
      '  of_dynamic()',
      'end subroutine'
    ].join('\r\n'));

    const lines = document.getText().split(/\r?\n/);
    const callLine = lines.findIndex((line) => line.trim() === 'of_dynamic()');
    const callCharacter = lines[callLine].indexOf('of_dynamic') + 2;

    const plan = await buildSafeEditPlan(
      document,
      {
        line: callLine,
        character: callCharacter,
        maxSafeReferences: 16,
      },
      kb,
      graph,
      catalog,
      async (uri) => contentsByUri.get(uri) ?? null,
      { workspaceState }
    );

    assert.equal(plan.available, true);
    assert.equal(plan.blocked, true);
    assert.equal(plan.invocationRisk, 'dynamic');
    assert.ok(plan.riskReasons?.includes('dynamic-strings:1'));
    assert.ok(plan.blockedReasons.some((reason) => reason.includes('DataWindow dinámico') || reason.includes('strings')));
  });
});