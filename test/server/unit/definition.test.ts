import * as assert from 'assert/strict';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { provideDefinition } from '../../../src/server/features/definition';
import { createDocumentQueryContext } from '../../../src/server/features/queryContext';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { EntityKind, ScopeKind } from '../../../src/server/knowledge/types';

suite('unit/definition', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);

    kb.beginBatchUpdate();
    // w_base con of_setdata
    kb.upsertDocument('file:///w_base.sru', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base.sru', line: 0, character: 0 },
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, containerName: 'w_base', uri: 'file:///w_base.sru', line: 10, character: 4 }
    ]);
    
    // w_main hereda de w_base, sobrescribe of_setdata
    kb.upsertDocument('file:///w_main.sru', [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, baseTypeName: 'w_base', uri: 'file:///w_main.sru', line: 0, character: 0 },
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, containerName: 'w_main', uri: 'file:///w_main.sru', line: 20, character: 4 },
      // Una variable local de tipo w_base
      { id: 'lw_window', name: 'lw_window', kind: EntityKind.Variable, datatype: 'w_base', containerName: 'w_main', uri: 'file:///w_main.sru', line: 5, character: 0 }
    ]);
    kb.endBatchUpdate();
  });

  test('provideDefinition returns null if no valid identifier under cursor', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  =  ');
    const loc = provideDefinition(doc, Position.create(0, 2), kb, graph);
    assert.equal(loc, null);
  });

  test('provideDefinition returns null if identifier not in KB', () => {
    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  of_unknown()  ');
    const loc = provideDefinition(doc, Position.create(0, 5), kb, graph);
    assert.equal(loc, null);
  });

  test('provideDefinition: unqualified method resolves to current object hierarchy (nearest override)', () => {
    // Si estamos en w_main y llamamos of_SetData() sin cualificador, debería ir a w_main.of_SetData.
    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  of_SetData()  ');
    
    const loc = provideDefinition(doc, Position.create(0, 5), kb, graph);
    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///w_main.sru');
      assert.equal(loc.range.start.line, 20);
    }
  });

  test('provideDefinition: super::method resolves strictly to ancestor implementation', () => {
    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  super::of_SetData()  ');
    
    const loc = provideDefinition(doc, Position.create(0, 12), kb, graph);
    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      // Debe saltar a w_base, ignorando el of_SetData de w_main
      assert.equal(loc.uri, 'file:///w_base.sru');
      assert.equal(loc.range.start.line, 10);
    }
  });

  test('provideDefinition: variable.method resolves to variable datatype hierarchy', () => {
    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  lw_window.of_SetData()  ');
    
    const loc = provideDefinition(doc, Position.create(0, 15), kb, graph);
    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      // lw_window es de tipo w_base, debe ir al of_SetData de w_base
      assert.equal(loc.uri, 'file:///w_base.sru');
    }
  });

  test('provideDefinition: fallback to global search if no qualifier and not found in hierarchy', () => {
    // Definimos una global_func en otro archivo
    kb.upsertDocument('file:///global.srf', [
      { id: 'global_func', name: 'global_func', kind: EntityKind.Function, uri: 'file:///global.srf', line: 1, character: 0 }
    ]);

    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  global_func()  ');
    const loc = provideDefinition(doc, Position.create(0, 5), kb, graph);
    
    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///global.srf');
    }
  });

  test('provideDefinition reutiliza un queryContext precalculado sin cambiar el resultado', () => {
    const doc = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, '  of_SetData()  ');
    const position = Position.create(0, 5);
    const queryContext = createDocumentQueryContext(doc, position, kb, graph);

    const loc = provideDefinition(doc, position, kb, graph, undefined, queryContext);

    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///w_main.sru');
      assert.equal(loc.range.start.line, 20);
    }
  });

  test('provideDefinition resuelve parent.call() usando el owner real del type nested', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);
    const uri = 'file:///w_nested.srw';

    const globalScope = {
      id: 'global',
      kind: ScopeKind.Global,
      uri,
      startLine: 0,
      endLine: 0,
      children: [] as any[],
      symbols: [] as any[]
    };
    const wMainScope = {
      id: 'w_main',
      kind: ScopeKind.Type,
      uri,
      startLine: 0,
      endLine: 0,
      parent: globalScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    const cbOkScope = {
      id: 'cb_ok',
      kind: ScopeKind.Type,
      uri,
      startLine: 0,
      endLine: 0,
      parent: globalScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    const clickedScope = {
      id: 'cb_ok.clicked',
      kind: ScopeKind.Event,
      uri,
      startLine: 0,
      endLine: 0,
      parent: cbOkScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    globalScope.children.push(wMainScope, cbOkScope);
    cbOkScope.children.push(clickedScope);

    localKb.upsertDocument(uri, [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, uri, line: 0, character: 0 },
      { id: 'cb_ok', name: 'cb_ok', kind: EntityKind.Type, containerName: 'w_main', uri, line: 0, character: 0 },
      { id: 'of_parent', name: 'of_parent', kind: EntityKind.Function, containerName: 'w_main', uri, line: 12, character: 4 },
      { id: 'clicked', name: 'clicked', kind: EntityKind.Event, containerName: 'cb_ok', uri, line: 0, character: 0 }
    ], [globalScope]);

    const doc = TextDocument.create(uri, 'powerbuilder', 1, 'parent.of_parent()');
    const loc = provideDefinition(doc, Position.create(0, 10), localKb, localGraph);

    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, uri);
      assert.equal(loc.range.start.line, 12);
    }
  });

  test('provideDefinition resuelve ancestor::event al baseType actual', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);
    const uri = 'file:///w_main_ancestor.sru';

    const globalScope = {
      id: 'global',
      kind: ScopeKind.Global,
      uri,
      startLine: 0,
      endLine: 0,
      children: [] as any[],
      symbols: [] as any[]
    };
    const mainScope = {
      id: 'w_main',
      kind: ScopeKind.Type,
      uri,
      startLine: 0,
      endLine: 0,
      parent: globalScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    const openScope = {
      id: 'w_main.open',
      kind: ScopeKind.Event,
      uri,
      startLine: 0,
      endLine: 0,
      parent: mainScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    globalScope.children.push(mainScope);
    mainScope.children.push(openScope);

    localKb.beginBatchUpdate();
    localKb.upsertDocument('file:///w_base_ancestor.sru', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base_ancestor.sru', line: 0, character: 0 },
      { id: 'ue_save', name: 'ue_save', kind: EntityKind.Event, containerName: 'w_base', uri: 'file:///w_base_ancestor.sru', line: 8, character: 4 }
    ]);
    localKb.upsertDocument(uri, [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, baseTypeName: 'w_base', uri, line: 0, character: 0 },
      { id: 'open', name: 'open', kind: EntityKind.Event, containerName: 'w_main', uri, line: 0, character: 0 }
    ], [globalScope]);
    localKb.endBatchUpdate();

    const doc = TextDocument.create(uri, 'powerbuilder', 1, 'ancestor::ue_save()');
    const loc = provideDefinition(doc, Position.create(0, 12), localKb, localGraph);

    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///w_base_ancestor.sru');
      assert.equal(loc.range.start.line, 8);
    }
  });

  test('provideDefinition resuelve call super::create contra on-handlers analizados del base type', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);

    const baseDocument = TextDocument.create(
      'file:///w_base_events.srw',
      'powerbuilder',
      1,
      [
        'global type w_base from window',
        'end type',
        '',
        'on w_base.create',
        'end on'
      ].join('\r\n')
    );
    const mainDocument = TextDocument.create(
      'file:///w_main_events.srw',
      'powerbuilder',
      1,
      [
        'global type w_main from w_base',
        'end type',
        '',
        'on w_main.create',
        '  call super::create',
        'end on'
      ].join('\r\n')
    );

    const baseAnalysis = analyzeDocument(baseDocument);
    const mainAnalysis = analyzeDocument(mainDocument);

    localKb.beginBatchUpdate();
    localKb.upsertDocument(baseDocument.uri, baseAnalysis.semanticFacts, baseAnalysis.scopes);
    localKb.upsertDocument(mainDocument.uri, mainAnalysis.semanticFacts, mainAnalysis.scopes);
    localKb.endBatchUpdate();

    const loc = provideDefinition(mainDocument, Position.create(4, 15), localKb, localGraph);

    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///w_base_events.srw');
      assert.equal(loc.range.start.line, 3);
    }
  });

  test('provideDefinition resuelve TriggerEvent(this, "create") contra el evento actual', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);

    const document = TextDocument.create(
      'file:///w_trigger_events.srw',
      'powerbuilder',
      1,
      [
        'global type w_main from window',
        'end type',
        '',
        'on w_main.create',
        '  TriggerEvent(this, "create")',
        'end on'
      ].join('\r\n')
    );

    const analysis = analyzeDocument(document);
    localKb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);

    const loc = provideDefinition(document, Position.create(4, 23), localKb, localGraph);

    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, document.uri);
      assert.equal(loc.range.start.line, 3);
    }
  });

  test('provideDefinition resuelve cb_ok.PostEvent("clicked") contra el evento del control owner real', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);

    const document = TextDocument.create(
      'file:///w_post_events.srw',
      'powerbuilder',
      1,
      [
        'global type w_main from window',
        'end type',
        '',
        'type cb_ok from commandbutton within w_main',
        'end type',
        '',
        'on w_main.cb_ok.clicked',
        '  cb_ok.PostEvent("clicked")',
        'end on'
      ].join('\r\n')
    );

    const analysis = analyzeDocument(document);
    localKb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);

    const loc = provideDefinition(document, Position.create(7, 20), localKb, localGraph);

    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, document.uri);
      assert.equal(loc.range.start.line, 6);
    }
  });

  test('provideDefinition resuelve identificadores PowerBuilder con sufijo $', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);

    const document = TextDocument.create(
      'file:///w_special_identifiers.sru',
      'powerbuilder',
      1,
      [
        'global type w_special_identifiers from window',
        'end type',
        '',
        'forward prototypes',
        'public function integer of_total$()',
        'end prototypes',
        '',
        'public function integer of_total$();',
        '  return 1',
        'end function',
        '',
        'event open();',
        '  this.of_total$()',
        'end event'
      ].join('\r\n')
    );

    const analysis = analyzeDocument(document);
    localKb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes);

    const loc = provideDefinition(document, Position.create(12, 15), localKb, localGraph);

    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, document.uri);
      assert.equal(loc.range.start.line, 7);
    }
  });

  test('provideDefinition resuelve un DataObject literal contra un .srd ya indexado', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);

    const dataWindowDocument = TextDocument.create(
      'file:///d_customer.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_customer.srd',
        'release 39;',
        'datawindow(units=0)'
      ].join('\r\n')
    );
    const dataWindowAnalysis = analyzeDocument(dataWindowDocument);
    localKb.upsertDocument(
      dataWindowDocument.uri,
      dataWindowAnalysis.semanticFacts,
      dataWindowAnalysis.scopes,
      dataWindowAnalysis.snapshot
    );

    const document = TextDocument.create(
      'file:///w_dataobject_binding.srw',
      'powerbuilder',
      1,
      'dw_1.DataObject = "d_customer"'
    );

    const lineText = document.getText();
    const literalOffset = lineText.indexOf('d_customer');
    const loc = provideDefinition(document, Position.create(0, literalOffset + 1), localKb, localGraph);

    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///d_customer.srd');
      assert.equal(loc.range.start.line, 0);
    }
  });

  test('provideDefinition navega Modify(state_id.dddw.name) al DataWindow hijo verificado', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);

    const parentDataWindow = TextDocument.create(
      'file:///d_parent.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_parent.srd',
        'release 39;',
        'datawindow(units=0)',
        'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states"))'
      ].join('\r\n')
    );
    const childDataWindow = TextDocument.create(
      'file:///d_states.srd',
      'powerbuilder',
      1,
      '$PBExportHeader$d_states.srd\r\nrelease 39;\r\ndatawindow(units=0)'
    );

    for (const indexed of [parentDataWindow, childDataWindow]) {
      const analysis = analyzeDocument(indexed);
      localKb.upsertDocument(indexed.uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    }

    const document = TextDocument.create(
      'file:///w_probe.srw',
      'powerbuilder',
      1,
      [
        'global type w_probe from window',
        '  datawindow dw_parent',
        'end type',
        '',
        'event open();',
        '  dw_parent.DataObject = "d_parent"',
        '  dw_parent.Modify("state_id.dddw.name=~"d_states~"")',
        'end event'
      ].join('\r\n')
    );

    const lineIndex = document.getText().split(/\r?\n/).findIndex((line) => line.includes('state_id.dddw.name'));
    const loc = provideDefinition(document, Position.create(lineIndex, 21), localKb, localGraph);

    assert.ok(loc && !Array.isArray(loc));
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, 'file:///d_states.srd');
    }
  });

  test('provideDefinition navega una columna SQL del retrieve al column= del mismo .srd', () => {
    const document = TextDocument.create(
      'file:///sample_datawindow.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$sample.srd',
        'release 19;',
        'datawindow(units=0)',
        'header(height=100 color=67108864)',
        'detail(height=76 color=67108864)',
        'table(column=(type=long update=yes name=id dbname="customer.id")',
        ' column=(type=char(100) update=yes name=name dbname="customer.name")',
        ' retrieve="SELECT id, name FROM customer ORDER BY name" )'
      ].join('\r\n')
    );

    const loc = provideDefinition(document, Position.create(7, 22), kb, graph);

    assert.ok(loc && !Array.isArray(loc), 'Expected single Location');
    if (loc && !Array.isArray(loc)) {
      assert.equal(loc.uri, document.uri);
      assert.equal(loc.range.start.line, 6);
    }
  });
});

