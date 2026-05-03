import * as assert from 'assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { provideCompletion } from '../../../src/server/features/completion';
import { validateSemantics } from '../../../src/server/features/diagnostics';
import { provideDefinition } from '../../../src/server/features/definition';
import { decideFeatureReadiness } from '../../../src/server/features/featureReadiness';
import { provideHover } from '../../../src/server/features/hover';
import { validateRenameTarget } from '../../../src/server/features/renamePreflight';
import { provideSignatureHelp } from '../../../src/server/features/signatureHelp';
import type { ProgressReadinessSnapshot } from '../../../src/server/features/progressReadiness';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { resolveTargetEntity } from '../../../src/server/knowledge/resolution/semanticQueryService';
import { EntityKind, ScopeKind } from '../../../src/server/knowledge/types';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { DIAGNOSTIC_CODES } from '../../../src/shared/diagnosticCodes';
import {
  compareSourceOriginPriority,
  inferSourceOrigin,
  pickPreferredSourceOrigin,
} from '../../../src/shared/sourceOrigin';

suite('unit/powerbuilderSemanticGolden (B222)', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let catalog: SystemCatalog;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    catalog = new SystemCatalog();
  });

  function setupAnalyzedDocument(uri: string, content: string): { document: TextDocument; analysis: ReturnType<typeof analyzeDocument> } {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    return { document, analysis };
  }

  function createReadinessSnapshot(levels: {
    activeContextReady: boolean;
    projectReady: boolean;
    workspaceReady: boolean;
  }): ProgressReadinessSnapshot {
    return {
      readiness: {
        state: levels.workspaceReady ? 'ready' : levels.activeContextReady || levels.projectReady ? 'indexing' : 'idle',
        levels,
      },
      progress: {
        discovery: { current: 1, total: 1 },
        indexing: {
          current: 0,
          total: 0,
          degraded: false,
          skipped: 0,
          failed: 0,
        },
      },
      projectStatus: {
        readiness: levels.workspaceReady ? 'ready' : levels.activeContextReady || levels.projectReady ? 'indexing' : 'idle',
        totalFiles: 0,
        indexedFiles: 0,
      },
      projectStatusText: 'workspace — inactivo',
    };
  }

  test('golden: scope resolution mantiene el orden local > shared > global > instance', () => {
    const uri = 'file:///w_scope_golden.sru';

    kb.beginBatchUpdate();
    kb.upsertDocument(uri, [
      { id: 'w_scope_golden', name: 'w_scope_golden', kind: EntityKind.Type, uri, line: 0, character: 0 },
      { id: 'v_shadow_instance', name: 'v_shadow', kind: EntityKind.Variable, scope: 'Instancia', declarationScope: 'member', containerName: 'w_scope_golden', uri, line: 1, character: 2 },
      { id: 'v_shadow_shared', name: 'v_shadow', kind: EntityKind.Variable, scope: 'Compartida', declarationScope: 'member', containerName: 'w_scope_golden', uri, line: 2, character: 2 },
      { id: 'v_global_instance', name: 'v_global_first', kind: EntityKind.Variable, scope: 'Instancia', declarationScope: 'member', containerName: 'w_scope_golden', uri, line: 3, character: 2 },
      { id: 'v_global_global', name: 'v_global_first', kind: EntityKind.Variable, scope: 'Global', declarationScope: 'member', containerName: 'w_scope_golden', uri, line: 4, character: 2 },
      { id: 'v_instance_only', name: 'v_instance_only', kind: EntityKind.Variable, scope: 'Instancia', declarationScope: 'member', containerName: 'w_scope_golden', uri, line: 5, character: 2 },
      { id: 'of_resolve', name: 'of_resolve', kind: EntityKind.Function, containerName: 'w_scope_golden', uri, line: 10, character: 0 },
    ], [
      {
        id: 'global',
        kind: ScopeKind.Global,
        uri,
        startLine: 0,
        endLine: 100,
        symbols: [],
        children: [
          {
            id: 'w_scope_golden',
            kind: ScopeKind.Type,
            uri,
            startLine: 0,
            endLine: 100,
            symbols: [],
            children: [
              {
                id: 'w_scope_golden.of_resolve',
                kind: ScopeKind.Function,
                uri,
                startLine: 10,
                endLine: 30,
                children: [],
                symbols: [
                  { id: 'v_shadow_local', name: 'v_shadow', kind: EntityKind.Variable, scope: 'Local', declarationScope: 'local', containerName: 'w_scope_golden.of_resolve', uri, line: 12, character: 4 },
                ]
              }
            ]
          }
        ]
      }
    ]);
    kb.endBatchUpdate();

    const local = resolveTargetEntity({ identifier: 'v_shadow' }, uri, kb, graph, 15);
    assert.ok(local.length >= 1);
    assert.equal(local[0].containerName, 'w_scope_golden.of_resolve');

    const shared = resolveTargetEntity({ identifier: 'v_shadow' }, uri, kb, graph, 40);
    assert.ok(shared.length >= 1);
    assert.equal(shared[0].scope, 'Compartida');

    const global = resolveTargetEntity({ identifier: 'v_global_first' }, uri, kb, graph, 40);
    assert.ok(global.length >= 1);
    assert.equal(global[0].scope, 'Global');

    const instance = resolveTargetEntity({ identifier: 'v_instance_only' }, uri, kb, graph, 40);
    assert.ok(instance.length >= 1);
    assert.equal(instance[0].scope, 'Instancia');
  });

  test('golden: prototype vs implementation e inherited members quedan fijados', () => {
    setupAnalyzedDocument('file:///w_base_golden.sru', [
      'forward',
      'global type w_base_golden from window',
      'end type',
      'end forward',
      'global type w_base_golden from window',
      'end type',
      'public function integer of_inherited();',
      '  return 1',
      'end function'
    ].join('\r\n'));

    const { document, analysis } = setupAnalyzedDocument('file:///w_child_golden.sru', [
      'forward',
      'global type w_child_golden from w_base_golden',
      'end type',
      'end forward',
      'forward prototypes',
      'public function integer of_only_proto(integer ai_value)',
      'public function integer of_local()',
      'end prototypes',
      'global type w_child_golden from w_base_golden',
      'end type',
      'public function integer of_local();',
      '  return of_inherited()',
      'end function'
    ].join('\r\n'));

    const prototypeFact = analysis.semanticFacts.find((fact) => fact.name.toLowerCase() === 'of_only_proto');
    const implementationFact = analysis.semanticFacts.find((fact) => fact.name.toLowerCase() === 'of_local');

    assert.equal(prototypeFact?.lineage?.phase, 'prototype');
    assert.equal(prototypeFact?.lineage?.role, 'prototype');
    assert.equal(implementationFact?.lineage?.phase, 'implementation');
    assert.equal(implementationFact?.lineage?.role, 'implementation');

    const lines = document.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('return of_inherited()'));
    const definition = provideDefinition(document, Position.create(lineIndex, 12), kb, graph);

    assert.ok(definition && !Array.isArray(definition));
    if (definition && !Array.isArray(definition)) {
      assert.equal(definition.uri, 'file:///w_base_golden.sru');
      assert.equal(definition.range.start.line, 6);
    }
  });

  test('golden: event handlers y external functions conservan resolución y provenance visibles', () => {
    const { document: eventDocument } = setupAnalyzedDocument('file:///w_event_golden.srw', [
      'global type w_event_golden from window',
      'end type',
      '',
      'type cb_ok from commandbutton within w_event_golden',
      'end type',
      '',
      'on w_event_golden.cb_ok.clicked',
      '  cb_ok.PostEvent("clicked")',
      'end on'
    ].join('\r\n'));

    const eventDefinition = provideDefinition(eventDocument, Position.create(7, 20), kb, graph);
    assert.ok(eventDefinition && !Array.isArray(eventDefinition));
    if (eventDefinition && !Array.isArray(eventDefinition)) {
      assert.equal(eventDefinition.uri, eventDocument.uri);
      assert.equal(eventDefinition.range.start.line, 6);
    }

    const { document: externalDocument } = setupAnalyzedDocument('file:///w_external_golden.sru', [
      'global type w_external_golden from window',
      'end type',
      'forward prototypes',
      'public function long of_external (string as_input) library "kernel32.dll" alias for "OfExternal";',
      'public subroutine of_test()',
      'end prototypes',
      'public subroutine of_test();',
      '  long ll_code',
      '  ll_code = of_external("abc")',
      'end subroutine'
    ].join('\r\n'));

    const externalHover = provideHover(externalDocument, Position.create(8, 15), kb, catalog, graph);
    assert.ok(externalHover);
    const externalValue = (externalHover?.contents as { value: string }).value;
    assert.match(externalValue, /kernel32\.dll/i);
    assert.match(externalValue, /Dependencia nativa|external/i);
  });

  test('golden: system types modernos HTTP/JSON aparecen en completion y hover sin hardcode por feature', () => {
    const { document } = setupAnalyzedDocument('file:///n_http_json_golden.sru', [
      'forward',
      'global type n_http_json_golden from httpclient',
      'end type',
      'end forward',
      'global type n_http_json_golden from httpclient',
      'end type',
      'forward prototypes',
      'public subroutine of_probe()',
      'end prototypes',
      'public subroutine of_probe();',
      '  ht',
      '  js',
      'end subroutine'
    ].join('\r\n'));

    const lines = document.getText().split(/\r?\n/);
    const baseLine = lines.findIndex((line) => line.includes('from httpclient'));
    const httpLine = lines.findIndex((line) => line.trim() === 'ht');
    const jsonLine = lines.findIndex((line) => line.trim() === 'js');

    const hover = provideHover(document, Position.create(baseLine, lines[baseLine].indexOf('httpclient') + 2), kb, catalog, graph);
    assert.ok(hover);
    const hoverValue = (hover?.contents as { value: string }).value;
    assert.match(hoverValue, /HTTPClient/i);

    const httpItems = provideCompletion(document, Position.create(httpLine, 4), kb, catalog, graph);
    assert.ok(httpItems?.some((item) => item.label === 'HTTPClient'));

    const jsonItems = provideCompletion(document, Position.create(jsonLine, 4), kb, catalog, graph);
    assert.ok(jsonItems?.some((item) => item.label === 'JSONParser'));
    assert.ok(jsonItems?.some((item) => item.label === 'JSONGenerator'));
    assert.ok(jsonItems?.some((item) => item.label === 'JSONPackage'));
  });

  test('golden: DataObject literal fija definition, hover, signatureHelp y diagnostics sobre el mismo backbone', () => {
    setupAnalyzedDocument('file:///d_sales_orders.srd', [
      '$PBExportHeader$d_sales_orders.srd',
      'release 39;',
      'table(retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) " arguments=(("custarg", number)) )")'
    ].join('\r\n'));

    const { document } = setupAnalyzedDocument('file:///w_dataobject_golden.srw', [
      'global type w_dataobject_golden from window',
      'end type',
      'forward prototypes',
      'public subroutine of_bind()',
      'end prototypes',
      'public subroutine of_bind();',
      '  datastore ids_orders',
      '  ids_orders.SetTrans(SQLCA)',
      '  ids_orders.DataObject = "d_sales_orders"',
      '  ids_orders.Retrieve()',
      'end subroutine'
    ].join('\r\n'));

    const lines = document.getText().split(/\r?\n/);
    const dataObjectLine = lines.findIndex((line) => line.includes('DataObject = "d_sales_orders"'));
    const retrieveLine = lines.findIndex((line) => line.includes('ids_orders.Retrieve()'));

    const definition = provideDefinition(document, Position.create(dataObjectLine, 27), kb, graph);
    assert.ok(definition && !Array.isArray(definition));
    if (definition && !Array.isArray(definition)) {
      assert.equal(definition.uri, 'file:///d_sales_orders.srd');
    }

    const hover = provideHover(document, Position.create(dataObjectLine, 27), kb, catalog, graph);
    assert.ok(hover);
    const hoverValue = (hover?.contents as { value: string }).value;
    assert.match(hoverValue, /d_sales_orders/);
    assert.match(hoverValue, /Hereda de:\* datawindow|Hereda de: datawindow/i);

    const signatureHelp = provideSignatureHelp(document, Position.create(retrieveLine, 22), kb, catalog, graph);
    assert.ok(signatureHelp);
    assert.ok(signatureHelp?.signatures.some((signature) => signature.label === 'Retrieve(number custarg)'));

    const diagnostics = validateSemantics(document, kb, catalog, graph);
    const mismatch = diagnostics.find((diagnostic) => diagnostic.message.includes('ids_orders.Retrieve(...)') && diagnostic.message.includes('espera 1 argumento'));
    assert.ok(mismatch);
  });

  test('golden: rename eligibility preserva contratos basicos de identificadores PowerScript', () => {
    assert.equal(validateRenameTarget('of_customer_sync', { systemCatalog: catalog }).ok, true);

    const reserved = validateRenameTarget('if', { systemCatalog: catalog });
    assert.equal(reserved.ok, false);
    assert.match(reserved.reason ?? '', /reservad/i);

    const systemCollision = validateRenameTarget('MessageBox', { systemCatalog: catalog });
    assert.equal(systemCollision.ok, false);
    assert.match(systemCollision.reason ?? '', /sistema/i);
  });

  test('golden: readiness gobierna rename y references con degradacion honesta', () => {
    const structural = createReadinessSnapshot({
      activeContextReady: false,
      projectReady: false,
      workspaceReady: false,
    });
    const nearby = createReadinessSnapshot({
      activeContextReady: true,
      projectReady: false,
      workspaceReady: false,
    });
    const project = createReadinessSnapshot({
      activeContextReady: true,
      projectReady: true,
      workspaceReady: false,
    });

    assert.equal(decideFeatureReadiness('rename', structural).action, 'block');
    assert.equal(decideFeatureReadiness('references', structural).action, 'block');
    assert.equal(decideFeatureReadiness('hover', structural).action, 'degrade');

    assert.equal(decideFeatureReadiness('rename', nearby, { resolutionConfidence: 'high' }).action, 'allow');
    assert.equal(decideFeatureReadiness('references', nearby, { resolutionConfidence: 'high' }).action, 'block');
    assert.equal(decideFeatureReadiness('definition', nearby, { resolutionConfidence: 'low' }).action, 'block');

    assert.equal(decideFeatureReadiness('references', project, { resolutionConfidence: 'high' }).action, 'allow');
  });

  test('golden: dynamic downgrade y sourceOrigin conflict siguen degradando con honestidad', () => {
    const { document } = setupAnalyzedDocument('file:///w_dataobject_dynamic_golden.srw', [
      'global type w_dataobject_dynamic_golden from window',
      'end type',
      'forward prototypes',
      'public function string of_resolve_dw()',
      'public subroutine of_bind()',
      'end prototypes',
      'public function string of_resolve_dw();',
      '  return "d_sales_orders"',
      'end function',
      'public subroutine of_bind();',
      '  datastore ids_orders',
      '  ids_orders.DataObject = of_resolve_dw()',
      'end subroutine'
    ].join('\r\n'));

    const diagnostics = validateSemantics(document, kb, catalog, graph);
    const dynamic = diagnostics.find((diagnostic) => diagnostic.message.includes('asignación dinámica de DataObject'));
    assert.ok(dynamic);
    assert.equal(dynamic?.severity, 3);

    assert.ok(compareSourceOriginPriority('solution-source', 'orca-staging') < 0);
    assert.equal(pickPreferredSourceOrigin('orca-staging', 'workspace-ws_objects'), 'workspace-ws_objects');
    assert.equal(inferSourceOrigin('file:///proj/ws_objects/w_main.srw'), 'workspace-ws_objects');
    assert.equal(inferSourceOrigin('file:///proj/orca-staging/w_main.srw'), 'orca-staging');
  });

  test('golden: property paths DataWindow comparten backbone entre completion y diagnostics', () => {
    setupAnalyzedDocument('file:///d_parent_property_golden.srd', [
      '$PBExportHeader$d_parent_property_golden.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states_property_golden") retrieve="SELECT parent_id, state_id FROM parent")'
    ].join('\r\n'));
    setupAnalyzedDocument('file:///d_states_property_golden.srd', [
      '$PBExportHeader$d_states_property_golden.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT state_id, state_name FROM states")'
    ].join('\r\n'));

    const { document } = setupAnalyzedDocument('file:///w_dw_property_golden.srw', [
      'global type w_dw_property_golden from window',
      'end type',
      'forward prototypes',
      'public subroutine of_probe()',
      'end prototypes',
      'public subroutine of_probe();',
      '  datastore dw_parent',
      '  dw_parent.DataObject = "d_parent_property_golden"',
      '  dw_parent.Modify("state_id.")',
      '  dw_parent.Describe("missing.DataWindow.Table.Select")',
      'end subroutine'
    ].join('\r\n'));

    const lines = document.getText().split(/\r?\n/);
    const completionLine = lines.findIndex((line) => line.includes('state_id.'));
    const completionCharacter = lines[completionLine].indexOf('state_id.') + 'state_id.'.length;
    const completion = provideCompletion(document, Position.create(completionLine, completionCharacter), kb, catalog, graph);

    assert.ok(completion?.some((item) => item.label === 'DataWindow'));
    assert.ok(completion?.some((item) => item.label === 'dddw'));

    const diagnostics = validateSemantics(document, kb, catalog, graph);
    const unresolvedPath = diagnostics.find((diagnostic) => diagnostic.code === DIAGNOSTIC_CODES.dataWindowPropertyPathUnresolved);

    assert.ok(unresolvedPath);
    assert.match(unresolvedPath?.message ?? '', /missing\.DataWindow\.Table\.Select/);
  });
});