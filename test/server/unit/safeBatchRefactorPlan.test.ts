import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildSafeBatchRefactorPlan } from '../../../src/server/features/safeBatchRefactorPlan';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/safeBatchRefactorPlan (B249)', () => {
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

  test('planifica un batch read-only con corte temprano y bloqueos honestos', async () => {
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

    const plan = await buildSafeBatchRefactorPlan(
      {
        stopOnBlocked: true,
        items: [
          {
            label: 'rename seguro',
            uri: mainUri,
            line: inheritedCallLine,
            character: inheritedCallCharacter,
            newName: 'of_inherited_safe',
            maxSafeReferences: 16,
          },
          {
            label: 'rename inválido',
            uri: mainUri,
            line: inheritedCallLine,
            character: inheritedCallCharacter,
            newName: 'if',
            maxSafeReferences: 16,
          },
          {
            label: 'debería saltarse',
            uri: mainUri,
            line: inheritedCallLine,
            character: inheritedCallCharacter,
            newName: 'of_after_stop',
          },
        ],
      },
      async (uri) => {
        const content = contentsByUri.get(uri);
        return content ? TextDocument.create(uri, 'powerbuilder', 1, content) : null;
      },
      kb,
      graph,
      catalog,
      async (uri) => contentsByUri.get(uri) ?? null,
      { workspaceState },
    );

    assert.equal(plan.available, true);
    assert.equal(plan.blocked, true);
    assert.equal(plan.stoppedEarly, true);
    assert.equal(plan.total, 3);
    assert.equal(plan.planned, 1);
    assert.equal(plan.blockedCount, 1);
    assert.equal(plan.skippedCount, 1);
    assert.equal(plan.items[0]?.status, 'planned');
    assert.equal(plan.items[0]?.renamePreflight?.ok, true);
    assert.equal(plan.items[0]?.safeEditPlan?.blocked, false);
    assert.equal(plan.items[1]?.status, 'blocked');
    assert.match(plan.items[1]?.blockedReasons[0] ?? '', /palabra reservada/i);
    assert.equal(plan.items[2]?.status, 'skipped');
    assert.ok(plan.aggregatedRisks.some((entry) => entry.includes('DataWindows vinculadas')));
    assert.ok(plan.recommendedTests.some((entry) => entry.includes('impactAnalysis|safeEditPlan|currentObjectContext')));
    assert.ok(plan.docsToReview.includes('docs/testing.md'));
  });
});