import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildImpactAnalysis } from '../../../src/server/features/impactAnalysis';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/impactAnalysis (B218)', () => {
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

  test('analiza impacto semántico combinando references, descendientes, events, DataWindows y build target', async () => {
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

    const impact = await buildImpactAnalysis(
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

    assert.equal(impact.available, true);
    assert.equal(impact.rootSymbol?.name, 'of_inherited');
    assert.equal(impact.primaryReasonCode, 'member-hierarchy');
    assert.ok(impact.safeReferences.some((entry) => entry.uri === mainUri && entry.line === inheritedCallLine));
    assert.ok(impact.descendants.some((entry) => entry.name === 'w_context' && entry.uri === mainUri));
    assert.ok(impact.relatedEvents.some((entry) => entry.name.toLowerCase() === 'create'));
    assert.equal(impact.relatedDataWindows[0]?.dataObject, 'd_sales_orders');
    assert.ok(impact.probableImpactFiles.some((entry) => entry.uri === mainUri));
    assert.ok(impact.probableImpactFiles.some((entry) => entry.uri === dataWindowUri && entry.role === 'datawindow'));
    assert.ok(impact.affectedSymbols.some((entry) => entry.name === 'w_context'));
    assert.equal(impact.buildTargets[0]?.projectUri, 'file:///proj/app.pbt');
  });

  test('sin routing de proyecto no materializa el workspace completo para un report pesado', async () => {
    const mainUri = 'file:///workspace/w_context.srw';
    const otherUri = 'file:///workspace/n_other.sru';
    const document = setupAnalyzedDocument(mainUri, [
      'global type w_context from window',
      'end type',
      '',
      'event open();',
      '  of_local()',
      'end event',
      '',
      'public subroutine of_local();',
      'end subroutine'
    ].join('\r\n'));
    setupAnalyzedDocument(otherUri, [
      'global type n_other from nonvisualobject',
      'end type'
    ].join('\r\n'));

    const loads: string[] = [];
    const impact = await buildImpactAnalysis(
      document,
      undefined,
      kb,
      graph,
      catalog,
      async (uri) => {
        loads.push(uri);
        return contentsByUri.get(uri) ?? null;
      },
      { workspaceState }
    );

    assert.equal(impact.available, true);
    assert.deepEqual(loads, [mainUri]);
    assert.ok(impact.safeReferences.every((entry) => entry.uri === mainUri));
  });
});