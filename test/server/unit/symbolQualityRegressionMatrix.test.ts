import * as assert from 'assert/strict';

import { Position, type Location } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import {
  isCompletionItemResolveData,
  provideCompletion,
  resolveCompletionItem,
} from '../../../src/server/features/completion';
import { validateSemantics } from '../../../src/server/features/diagnostics';
import { provideDefinition } from '../../../src/server/features/definition';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { getDisplaySummary } from '../../../src/server/knowledge/system/localization';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { resolveTargetEntityDetailed } from '../../../src/server/knowledge/resolution/semanticQueryService';
import { PB_SYSTEM_SYMBOL_REGISTRY } from '../../../src/server/knowledge/system/registry/registry';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';
import { estimateLspPayloadBytes } from '../../../src/server/runtime/interactiveServingStats';
import { evaluateInteractivePayloadBudget } from '../../../src/server/serving/payloadBudget';
import { DIAGNOSTIC_CODES } from '../../../src/shared/diagnosticCodes';
import type { SourceOrigin } from '../../../src/shared/sourceOrigin';

suite('unit/symbolQualityRegressionMatrix (SYMBOL-QUALITY-01)', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let catalog: SystemCatalog;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    catalog = new SystemCatalog();
  });

  function directLineage(sourceOrigin: SourceOrigin = 'solution-source') {
    return {
      sourceKind: 'document' as const,
      sourceOrigin,
      authority: 'derived' as const,
      phase: 'implementation' as const,
      role: 'implementation' as const,
      confidence: 'direct' as const,
    };
  }

  function setupAnalyzedDocument(
    uri: string,
    content: string,
    sourceOrigin: SourceOrigin = 'solution-source',
  ): TextDocument {
    invalidateDocumentAnalysis(uri);
    const document = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(document, { sourceOrigin });
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    return document;
  }

  function findLine(document: TextDocument, needle: string): number {
    const lines = document.getText().split(/\r?\n/);
    const index = lines.findIndex((line) => line.includes(needle));
    assert.notEqual(index, -1, `No se encontro la linea con ${needle}`);
    return index;
  }

  function findPosition(document: TextDocument, needle: string, token = needle, offset = 1): Position {
    const lines = document.getText().split(/\r?\n/);
    const line = findLine(document, needle);
    const character = lines[line].indexOf(token);
    assert.notEqual(character, -1, `No se encontro el token ${token}`);
    return Position.create(line, character + offset);
  }

  function normalizeLocation(location: Location): string {
    return `${basenameFromUri(location.uri)}:${location.range.start.line + 1}:${location.range.start.character + 1}`;
  }

  function basenameFromUri(uri: string): string {
    return uri.split('/').pop() ?? uri;
  }

  function summarizeResolution(result: ReturnType<typeof resolveTargetEntityDetailed>) {
    return {
      targetName: result.targets[0]?.name ?? null,
      targetKind: result.targets[0]?.kind ?? null,
      targetScope: result.targets[0]?.scope ?? null,
      sourceOrigin: result.targets[0]?.lineage?.sourceOrigin ?? null,
      targetCount: result.targets.length,
      reasonCodes: result.reasonCodes,
      confidence: result.confidence,
      ambiguityKind: result.ambiguityKind ?? null,
    };
  }

  test('golden: congela la matriz minima de symbols, enrichments e i18n de SYMBOL-QUALITY-01', () => {
    const baseDocument = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_quality_base.sru', [
      'forward',
      'global type w_quality_base from window',
      'end type',
      'end forward',
      'global type w_quality_base from window',
      'end type',
      'public function integer of_inherited();',
      '  return 1',
      'end function',
    ].join('\r\n'));

    const symbolsDocument = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_quality_symbols.sru', [
      'forward',
      'global type w_quality_symbols from w_quality_base',
      'end type',
      'end forward',
      'global type w_quality_symbols from w_quality_base',
      '  integer ii_instance',
      'end type',
      'public function integer of_local(string as_name);',
      '  integer li_local',
      '  li_local = Len(as_name)',
      '  return li_local + ii_instance',
      'end function',
      'public function integer of_probe();',
      '  return of_local("abc") + of_inherited()',
      'end function',
    ].join('\r\n'));

    invalidateDocumentAnalysis('file:///proj/lib_app.pbl/w_quality_scope.sru');
    const scopeDocument = TextDocument.create('file:///proj/lib_app.pbl/w_quality_scope.sru', 'powerbuilder', 1, [
      'global type w_quality_scope from window',
      'end type',
      'public subroutine of_scope_probe();',
      '  return',
      'end subroutine',
    ].join('\r\n'));
    const scopeAnalysis = analyzeDocument(scopeDocument, { sourceOrigin: 'solution-source' });
    kb.upsertDocument(
      scopeDocument.uri,
      [
        ...scopeAnalysis.semanticFacts,
        {
          id: 'is_shared_counter',
          name: 'is_shared_counter',
          kind: EntityKind.Variable,
          scope: 'Compartida',
          declarationScope: 'member',
          containerName: 'w_quality_scope',
          uri: scopeDocument.uri,
          line: 1,
          character: 2,
          lineage: directLineage(),
        },
        {
          id: 'ig_global_counter',
          name: 'ig_global_counter',
          kind: EntityKind.Variable,
          scope: 'Global',
          declarationScope: 'member',
          containerName: 'w_quality_scope',
          uri: scopeDocument.uri,
          line: 2,
          character: 2,
          lineage: directLineage(),
        },
      ],
      scopeAnalysis.scopes,
      scopeAnalysis.snapshot,
    );

    kb.upsertDocument('file:///proj/lib_app.pbl/w_quality_ambiguous.sru', [
      {
        id: 'w_quality_ambiguous',
        name: 'w_quality_ambiguous',
        kind: EntityKind.Type,
        uri: 'file:///proj/lib_app.pbl/w_quality_ambiguous.sru',
        line: 0,
        character: 0,
        lineage: directLineage(),
      },
      {
        id: 'of_ambiguous_integer',
        name: 'of_ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_quality_ambiguous',
        uri: 'file:///proj/lib_app.pbl/w_quality_ambiguous.sru',
        line: 20,
        character: 4,
        lineage: directLineage(),
      },
      {
        id: 'of_ambiguous_string',
        name: 'of_ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_quality_ambiguous',
        uri: 'file:///proj/lib_app.pbl/w_quality_ambiguous.sru',
        line: 30,
        character: 4,
        lineage: directLineage(),
      },
    ]);

    const eventDocument = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_quality_event.srw', [
      'global type w_quality_event from window',
      'end type',
      '',
      'type cb_ok from commandbutton within w_quality_event',
      'end type',
      '',
      'on w_quality_event.cb_ok.clicked',
      '  cb_ok.PostEvent("clicked")',
      'end on',
    ].join('\r\n'));

    setupAnalyzedDocument('file:///proj/lib_app.pbl/d_parent_quality.srd', [
      '$PBExportHeader$d_parent_quality.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states_quality") retrieve="SELECT parent_id, state_id FROM parent")',
    ].join('\r\n'), 'pbl-folder-source');
    setupAnalyzedDocument('file:///proj/lib_app.pbl/d_states_quality.srd', [
      '$PBExportHeader$d_states_quality.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT state_id, state_name FROM states")',
    ].join('\r\n'), 'pbl-folder-source');
    const dataWindowDocument = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_quality_dw.srw', [
      'global type w_quality_dw from window',
      'end type',
      'public subroutine of_probe();',
      '  datastore dw_parent',
      '  dw_parent.DataObject = "d_parent_quality"',
      '  dw_parent.Modify("state_id.")',
      '  dw_parent.Describe("missing.DataWindow.Table.Select")',
      'end subroutine',
    ].join('\r\n'));

    const localeDocument = setupAnalyzedDocument('file:///proj/lib_app.pbl/w_quality_locale.sru', [
      'global type w_quality_locale from window',
      '  datastore ids_orders',
      'end type',
      'public subroutine of_probe();',
      '  ab',
      '  ids_orders.Ret',
      'end subroutine',
    ].join('\r\n'));

    const localResolution = resolveTargetEntityDetailed(
      { identifier: 'li_local' },
      symbolsDocument.uri,
      kb,
      graph,
      { line: findLine(symbolsDocument, 'return li_local + ii_instance') },
    );
    const parameterResolution = resolveTargetEntityDetailed(
      { identifier: 'as_name' },
      symbolsDocument.uri,
      kb,
      graph,
      { line: findLine(symbolsDocument, 'li_local = Len(as_name)') },
    );
    const instanceResolution = resolveTargetEntityDetailed(
      { identifier: 'ii_instance' },
      symbolsDocument.uri,
      kb,
      graph,
      { line: findLine(symbolsDocument, 'return li_local + ii_instance') },
    );
    const userFunctionResolution = resolveTargetEntityDetailed(
      { identifier: 'of_local', argumentCount: 1, argumentTypes: ['string'] },
      symbolsDocument.uri,
      kb,
      graph,
      { line: findLine(symbolsDocument, 'return of_local("abc") + of_inherited()') },
    );
    const sharedResolution = resolveTargetEntityDetailed(
      { identifier: 'is_shared_counter' },
      'file:///proj/lib_app.pbl/w_quality_scope.sru',
      kb,
      graph,
      { line: 20 },
    );
    const globalResolution = resolveTargetEntityDetailed(
      { identifier: 'ig_global_counter' },
      'file:///proj/lib_app.pbl/w_quality_scope.sru',
      kb,
      graph,
      { line: 20 },
    );
    const ambiguousResolution = resolveTargetEntityDetailed(
      { identifier: 'of_ambiguous' },
      'file:///proj/lib_app.pbl/w_quality_ambiguous.sru',
      kb,
      graph,
      { line: 25 },
    );
    const unknownResolution = resolveTargetEntityDetailed(
      { identifier: 'n_quality_missing' },
      symbolsDocument.uri,
      kb,
      graph,
      { line: findLine(symbolsDocument, 'return of_local("abc") + of_inherited()') },
    );

    const inheritedDefinition = provideDefinition(
      symbolsDocument,
      findPosition(symbolsDocument, 'return of_local("abc") + of_inherited()', 'of_inherited', 2),
      kb,
      graph,
    );
    assert.ok(inheritedDefinition && !Array.isArray(inheritedDefinition));
    if (!inheritedDefinition || Array.isArray(inheritedDefinition)) {
      assert.fail('Se esperaba una definicion unica para el miembro heredado');
    }

    const eventDefinition = provideDefinition(
      eventDocument,
      findPosition(eventDocument, '  cb_ok.PostEvent("clicked")', 'clicked', 2),
      kb,
      graph,
    );
    assert.ok(eventDefinition && !Array.isArray(eventDefinition));
    if (!eventDefinition || Array.isArray(eventDefinition)) {
      assert.fail('Se esperaba una definicion unica para el evento');
    }

    const propertyCompletionPosition = findPosition(dataWindowDocument, '  dw_parent.Modify("state_id.")', 'state_id.', 'state_id.'.length);
    const propertyCompletion = provideCompletion(dataWindowDocument, propertyCompletionPosition, kb, catalog, graph);
    if (!propertyCompletion) {
      assert.fail('Se esperaba completion para property path DataWindow');
    }
    const propertyDiagnostics = validateSemantics(dataWindowDocument, kb, catalog, graph);
    const unresolvedProperty = propertyDiagnostics.find(
      (diagnostic) => diagnostic.code === DIAGNOSTIC_CODES.dataWindowPropertyPathUnresolved,
    );
    assert.ok(unresolvedProperty);

    const builtInItems = provideCompletion(
      localeDocument,
      Position.create(findLine(localeDocument, '  ab'), 4),
      kb,
      catalog,
      graph,
      undefined,
      undefined,
      'es',
    );
    if (!builtInItems) {
      assert.fail('Se esperaba completion inicial para built-ins');
    }
    const absItem = builtInItems.find((item) => item.label === 'Abs');
    assert.ok(absItem);
    if (!absItem) {
      assert.fail('Se esperaba el item Abs en la completion');
    }
    assert.ok(isCompletionItemResolveData(absItem.data));
    if (!isCompletionItemResolveData(absItem.data)) {
      assert.fail('Abs debe exponer resolve data');
    }
    const absResolved = resolveCompletionItem(absItem, kb, catalog, 'es');

    const retrieveItems = provideCompletion(
      localeDocument,
      Position.create(findLine(localeDocument, '  ids_orders.Ret'), '  ids_orders.Ret'.length),
      kb,
      catalog,
      graph,
      undefined,
      undefined,
      'es',
    );
    if (!retrieveItems) {
      assert.fail('Se esperaba completion inicial para Retrieve');
    }
    const retrieveItem = retrieveItems.find((item) => item.label === 'Retrieve');
    assert.ok(retrieveItem);
    if (!retrieveItem) {
      assert.fail('Se esperaba el item Retrieve en la completion');
    }
    assert.ok(isCompletionItemResolveData(retrieveItem.data));
    if (!isCompletionItemResolveData(retrieveItem.data)) {
      assert.fail('Retrieve debe exponer resolve data');
    }
    const retrieveResolved = resolveCompletionItem(retrieveItem, kb, catalog, 'es');

    const fallbackEntry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find((entry) =>
      entry.dataset === 'generated'
      && entry.domain !== 'global-functions'
      && entry.domain !== 'datawindow-functions'
      && typeof entry.summary === 'string'
      && getDisplaySummary(entry, 'es') === entry.summary,
    );
    assert.ok(fallbackEntry, 'Se esperaba un entry generated sin overlay es para validar fallback.');

    const matrix = {
      fixtures: {
        builtInFunction: {
          label: absItem.label,
          source: absItem.data.source,
          resolvedDetailHasLabel: /Abs/i.test(String(absResolved.detail)),
        },
        userFunction: summarizeResolution(userFunctionResolution),
        event: {
          definition: normalizeLocation(eventDefinition),
        },
        localVariable: summarizeResolution(localResolution),
        instanceVariable: summarizeResolution(instanceResolution),
        sharedVariable: summarizeResolution(sharedResolution),
        globalVariable: summarizeResolution(globalResolution),
        parameter: summarizeResolution(parameterResolution),
        inherited: {
          definition: normalizeLocation(inheritedDefinition),
        },
        ambiguous: summarizeResolution(ambiguousResolution),
        unknown: summarizeResolution(unknownResolution),
        dataWindowColumnProperty: {
          labels: propertyCompletion
            .filter((item) => item.label === 'DataWindow' || item.label === 'dddw')
            .map((item) => String(item.label))
            .sort(),
          diagnosticCode: unresolvedProperty?.code ?? null,
        },
        overlayLocalized: {
          label: retrieveResolved.label,
          locale: retrieveItem.data.locale,
          localizedDocumentation: /buffer primario del DataWindow, DataStore o DataWindowChild/i.test(String(retrieveResolved.documentation)),
        },
        completionResolveEnrichment: {
          initialHasDocumentation: retrieveItem.documentation !== undefined,
          resolvedHasDocumentation: retrieveResolved.documentation !== undefined,
          completionWithinBudget: evaluateInteractivePayloadBudget('completion', estimateLspPayloadBytes(retrieveItems)).withinBudget,
          resolveWithinBudget: evaluateInteractivePayloadBudget('completion-resolve', estimateLspPayloadBytes(retrieveResolved)).withinBudget,
        },
      },
      validations: {
        i18nFallback: {
          locale: 'es',
          preservedSourceSummary: getDisplaySummary(fallbackEntry!, 'es') === fallbackEntry!.summary,
        },
        payloadBudget: {
          builtInCompletionWithinBudget: evaluateInteractivePayloadBudget('completion', estimateLspPayloadBytes(builtInItems)).withinBudget,
          builtInResolveWithinBudget: evaluateInteractivePayloadBudget('completion-resolve', estimateLspPayloadBytes(absResolved)).withinBudget,
        },
      },
    };

    assert.deepEqual(matrix, {
      fixtures: {
        builtInFunction: {
          label: 'Abs',
          source: 'system',
          resolvedDetailHasLabel: true,
        },
        userFunction: {
          targetName: 'of_local',
          targetKind: EntityKind.Function,
          targetScope: null,
          sourceOrigin: 'solution-source',
          targetCount: 1,
          reasonCodes: ['member-hierarchy'],
          confidence: 'high',
          ambiguityKind: null,
        },
        event: {
          definition: 'w_quality_event.srw:7:26',
        },
        localVariable: {
          targetName: 'li_local',
          targetKind: EntityKind.Variable,
          targetScope: 'Local',
          sourceOrigin: null,
          targetCount: 1,
          reasonCodes: ['local-scope'],
          confidence: 'high',
          ambiguityKind: null,
        },
        instanceVariable: {
          targetName: 'ii_instance',
          targetKind: EntityKind.Variable,
          targetScope: 'Instancia',
          sourceOrigin: 'solution-source',
          targetCount: 1,
          reasonCodes: ['member-hierarchy'],
          confidence: 'high',
          ambiguityKind: null,
        },
        sharedVariable: {
          targetName: 'is_shared_counter',
          targetKind: EntityKind.Variable,
          targetScope: 'Compartida',
          sourceOrigin: 'solution-source',
          targetCount: 1,
          reasonCodes: ['global-fallback'],
          confidence: 'low',
          ambiguityKind: null,
        },
        globalVariable: {
          targetName: 'ig_global_counter',
          targetKind: EntityKind.Variable,
          targetScope: 'Global',
          sourceOrigin: 'solution-source',
          targetCount: 1,
          reasonCodes: ['global-fallback'],
          confidence: 'low',
          ambiguityKind: null,
        },
        parameter: {
          targetName: 'as_name',
          targetKind: EntityKind.Variable,
          targetScope: 'Argumento',
          sourceOrigin: null,
          targetCount: 1,
          reasonCodes: ['local-scope'],
          confidence: 'high',
          ambiguityKind: null,
        },
        inherited: {
          definition: 'w_quality_base.sru:7:25',
        },
        ambiguous: {
          targetName: 'of_ambiguous',
          targetKind: EntityKind.Function,
          targetScope: null,
          sourceOrigin: 'solution-source',
          targetCount: 2,
          reasonCodes: ['member-hierarchy'],
          confidence: 'medium',
          ambiguityKind: 'distance-minimum',
        },
        unknown: {
          targetName: null,
          targetKind: null,
          targetScope: null,
          sourceOrigin: null,
          targetCount: 0,
          reasonCodes: [],
          confidence: 'low',
          ambiguityKind: null,
        },
        dataWindowColumnProperty: {
          labels: ['DataWindow', 'dddw'],
          diagnosticCode: DIAGNOSTIC_CODES.dataWindowPropertyPathUnresolved,
        },
        overlayLocalized: {
          label: 'Retrieve',
          locale: 'es',
          localizedDocumentation: true,
        },
        completionResolveEnrichment: {
          initialHasDocumentation: false,
          resolvedHasDocumentation: true,
          completionWithinBudget: true,
          resolveWithinBudget: true,
        },
      },
      validations: {
        i18nFallback: {
          locale: 'es',
          preservedSourceSummary: true,
        },
        payloadBudget: {
          builtInCompletionWithinBudget: true,
          builtInResolveWithinBudget: true,
        },
      },
    });

    void baseDocument;
  });
});