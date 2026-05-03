import * as assert from 'assert';
import { Position, CompletionItemKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { provideCompletion } from '../../../src/server/features/completion';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { HotContextCache } from '../../../src/server/knowledge/HotContextCache';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/completion', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;
  let systemCatalog: SystemCatalog;
  let cache: DocumentCache;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    systemCatalog = new SystemCatalog();
    cache = new DocumentCache();
  });

  function setupDocument(uri: string, content: string): TextDocument {
    const doc = TextDocument.create(uri, 'powerbuilder', 1, content);
    const analysis = analyzeDocument(doc);
    cache.set(uri, { version: 1, symbols: [], facts: analysis.semanticFacts, scopes: analysis.scopes });
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    return doc;
  }

  test('debe sugerir variables locales con prioridad máxima', () => {
    const doc = setupDocument('file:///test_local.sru', `
global type test_local from nonvisualobject
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  integer li_count
  string ls_name
  
  l
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex(l => l.trim() === 'l');
    const pos = Position.create(lineIndex, 3); // despues de 'l'

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items);
    
    // Verificamos que contenga li_count y ls_name y que su sortText sea 0_local...
    const localCount = items.find(i => i.label === 'li_count');
    const localName = items.find(i => i.label === 'ls_name');
    
    assert.ok(localCount);
    assert.ok(localName);
    assert.strictEqual(localCount.sortText?.startsWith('0_local_'), true);
  });

  test('debe sugerir miembros del objeto cuando se usa this.', () => {
    const doc = setupDocument('file:///test_this.sru', `
global type test_this from nonvisualobject
  integer ii_id
end type

forward prototypes
public function integer of_add(integer a, integer b)
end prototypes

public function integer of_add(integer a, integer b);
  this.
  return a + b
end function
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex(l => l.trim() === 'this.');
    const pos = Position.create(lineIndex, 7); // despues de '.'

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items);
    
    // Deberia contener of_add e ii_id
    const memberAdd = items.find(i => i.label === 'of_add');
    const memberId = items.find(i => i.label === 'ii_id');
    
    assert.ok(memberAdd);
    assert.ok(memberId);
    assert.strictEqual(memberAdd.sortText?.startsWith('1_member_'), true);
  });


  test('debe sugerir system types modernos HTTP/JSON desde el catálogo runtime', () => {
    const doc = setupDocument('file:///test_system_type_completion.sru', `
global type test_system_type_completion from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  ht
  js
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const httpLine = lines.findIndex((line) => line.trim() === 'ht');
    const jsonLine = lines.findIndex((line) => line.trim() === 'js');

    const httpItems = provideCompletion(doc, Position.create(httpLine, 4), kb, systemCatalog, graph);
    assert.ok(httpItems);
    const httpClient = httpItems.find((item) => item.label === 'HTTPClient');
    assert.ok(httpClient);
    assert.strictEqual(httpClient.kind, CompletionItemKind.Class);

    const jsonItems = provideCompletion(doc, Position.create(jsonLine, 4), kb, systemCatalog, graph);
    assert.ok(jsonItems);
    assert.ok(jsonItems.some((item) => item.label === 'JSONParser'));
    assert.ok(jsonItems.some((item) => item.label === 'JSONGenerator'));
    assert.ok(jsonItems.some((item) => item.label === 'JSONPackage'));
  });

  test('debe sugerir reserved words, pronouns, system globals y enumerated values desde el catálogo contextual', () => {
    const doc = setupDocument('file:///test_catalog_contextual_completion.sru', `
global type test_catalog_contextual_completion from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  co
  th
  sq
  savea
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const reservedLine = lines.findIndex((line) => line.trim() === 'co');
    const pronounLine = lines.findIndex((line) => line.trim() === 'th');
    const globalLine = lines.findIndex((line) => line.trim() === 'sq');
    const enumLine = lines.findIndex((line) => line.trim() === 'savea');

    const reservedItems = provideCompletion(doc, Position.create(reservedLine, 4), kb, systemCatalog, graph);
    assert.ok(reservedItems?.some((item) => String(item.label).toLowerCase() === 'commit'));

    const pronounItems = provideCompletion(doc, Position.create(pronounLine, 4), kb, systemCatalog, graph);
    const thisItem = pronounItems?.find((item) => String(item.label).toLowerCase() === 'this');
    assert.ok(thisItem);
    assert.strictEqual(thisItem?.kind, CompletionItemKind.Variable);

    const globalItems = provideCompletion(doc, Position.create(globalLine, 4), kb, systemCatalog, graph);
    const sqlcaItem = globalItems?.find((item) => item.label === 'SQLCA');
    assert.ok(sqlcaItem);
    assert.strictEqual(sqlcaItem?.kind, CompletionItemKind.Variable);

    const enumItems = provideCompletion(doc, Position.create(enumLine, 7), kb, systemCatalog, graph);
    const saveAsTypeItem = enumItems?.find((item) => item.label === 'SaveAsType');
    assert.ok(saveAsTypeItem);
    assert.strictEqual(saveAsTypeItem?.kind, CompletionItemKind.Enum);
  });

  test('prioriza símbolos locales frente a system globals homónimos y deduplica resultados', () => {
    const doc = setupDocument('file:///test_system_global_dedup.sru', `
global type test_system_global_dedup from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  string message
  mess
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'mess');
    const items = provideCompletion(doc, Position.create(lineIndex, 6), kb, systemCatalog, graph);

    assert.ok(items);
    const messageItems = items.filter((item) => String(item.label).toLowerCase() === 'message');
    assert.strictEqual(messageItems.length, 1);
    assert.strictEqual(messageItems[0].sortText?.startsWith('0_local_'), true);
  });

  test('no mezcla reserved words, pronouns ni enumerated values en member context', () => {
    const doc = setupDocument('file:///test_member_context_catalog_completion.sru', `
global type test_member_context_catalog_completion from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  SQLCA.sa
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'SQLCA.sa');
    const pos = Position.create(lineIndex, 10);

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(!items?.some((item) => item.label === 'SaveAsType!'));
    assert.ok(!items?.some((item) => item.label === 'SaveAsType'));
    assert.ok(!items?.some((item) => String(item.label).toLowerCase() === 'this'));
    assert.ok(!items?.some((item) => String(item.label).toLowerCase() === 'commit'));
  });

  test('sugiere valores enumerados cuando una asignacion de propiedad deja el tipo esperado inequívoco', () => {
    const doc = setupDocument('file:///test_enum_assignment_completion.srw', `
global type test_enum_assignment_completion from window
  multilineedit mle_1
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  mle_1.Alignment = 
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'mle_1.Alignment =');
    const pos = Position.create(lineIndex, lines[lineIndex].length);

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items);
    assert.deepStrictEqual(
      items.map((item) => item.label),
      ['Left!', 'Center!', 'Right!', 'Justify!'],
    );
    assert.ok(items.every((item) => item.kind === CompletionItemKind.EnumMember));
  });

  test('sugiere valores enumerados cuando un parámetro de sistema tiene un enum esperado inequívoco', () => {
    const doc = setupDocument('file:///test_enum_argument_completion.sru', `
global type test_enum_argument_completion from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  integer li_file
  FileSeek(li_file, 0, Fro)
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('FileSeek(li_file, 0, Fro)'));
    const pos = Position.create(lineIndex, lines[lineIndex].indexOf('Fro') + 'Fro'.length);

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items);
    assert.deepStrictEqual(
      items.map((item) => item.label),
      ['FromBeginning!', 'FromCurrent!', 'FromEnd!'],
    );
    assert.ok(items.every((item) => item.kind === CompletionItemKind.EnumMember));
  });

  test('sugiere valores enumerados en parámetros member-scoped de DataWindow', () => {
    const doc = setupDocument('file:///test_dw_enum_argument_completion.srw', `
global type test_dw_enum_argument_completion from window
  datastore ids_orders
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  ids_orders.RowsMove(1, 1, 
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('RowsMove(1, 1,'));
    const pos = Position.create(lineIndex, lines[lineIndex].length);

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items);
    assert.deepStrictEqual(
      items.map((item) => item.label),
      ['Primary!', 'Delete!', 'Filter!'],
    );
    assert.ok(items.every((item) => item.kind === CompletionItemKind.EnumMember));
  });

  test('debe sugerir miembros de una variable tipada', () => {
    // Simulamos dos archivos. 
    setupDocument('file:///n_cst_math.sru', `
global type n_cst_math from nonvisualobject
end type
forward prototypes
public function integer of_add(integer a, integer b)
end prototypes
public function integer of_add(integer a, integer b);
  return a + b
end function
    `);

    const doc = setupDocument('file:///test_var.sru', `
global type test_var from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  n_cst_math calc
  calc.
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex(l => l.trim() === 'calc.');
    const pos = Position.create(lineIndex, 7); // despues de '.'

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items);
    
    // Deberia sugerir of_add
    const calcAdd = items.find(i => i.label === 'of_add');
    assert.ok(calcAdd);
    assert.strictEqual(calcAdd.kind, CompletionItemKind.Method);
  });

  test('consume HotContextCache para miembros ya resueltos', () => {
    const doc = setupDocument('file:///test_cached.sru', `
global type test_cached from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  n_cst_math calc
  calc.
end subroutine
    `);

    const hotContext = new HotContextCache();
    hotContext.setActive(doc.uri, kb.version);
    hotContext.setInheritedMembers('n_cst_math', [{
      id: 'of_cached',
      name: 'of_cached',
      kind: EntityKind.Function,
      uri: 'file:///cached.sru',
      line: 1,
      character: 0,
      containerName: 'n_cst_math'
    }]);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'calc.');
    const pos = Position.create(lineIndex, 7);

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph, hotContext, kb.version);
    assert.ok(items?.some((item) => item.label === 'of_cached'));
  });

  test('debe sugerir miembros de SQLCA como transaction especial', () => {
    const doc = setupDocument('file:///test_sqlca.sru', `
global type test_sqlca from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  SQLCA.
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'SQLCA.');
    const pos = Position.create(lineIndex, 8);

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items?.some((item) => item.label === 'DBHandle'));
  });

  test('debe sugerir el catálogo comportamental DataWindow para datastore tipado', () => {
    const doc = setupDocument('file:///test_datastore.sru', `
global type test_datastore from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  datastore ids_orders
  ids_orders.
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'ids_orders.');
    const pos = Position.create(lineIndex, 13);

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items?.some((item) => item.label === 'SetTransObject'));
    assert.ok(items?.some((item) => item.label === 'SetTrans'));
    assert.ok(items?.some((item) => item.label === 'Retrieve'));
    assert.ok(items?.some((item) => item.label === 'Update'));
    assert.ok(items?.some((item) => item.label === 'Describe'));
    assert.ok(items?.some((item) => item.label === 'Modify'));
    assert.ok(items?.some((item) => item.label === 'GetChild'));
  });

  test('no sugiere GetChild para datawindowchild tipado', () => {
    const doc = setupDocument('file:///test_datawindowchild_completion.sru', `
global type test_datawindowchild_completion from nonvisualobject
  datawindowchild idwc_orders
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  idwc_orders.
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'idwc_orders.');
    const pos = Position.create(lineIndex, 14);

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items?.some((item) => item.label === 'Describe'));
    assert.ok(items?.some((item) => item.label === 'Update'));
    assert.ok(!items?.some((item) => item.label === 'GetChild'));
  });

  test('limita candidatos globales para completion con prefijo', () => {
    const doc = setupDocument('file:///test_global_cap.sru', `
global type test_global_cap from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  zz_
end subroutine
    `);

    const uri = 'file:///globals.srf';
    kb.upsertDocument(uri, Array.from({ length: 240 }, (_, index) => ({
      id: `zz_cap_${index.toString().padStart(3, '0')}`,
      name: `zz_cap_${index.toString().padStart(3, '0')}`,
      kind: EntityKind.Function,
      uri,
      line: index,
      character: 0
    })));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'zz_');
    const items = provideCompletion(doc, Position.create(lineIndex, 5), kb, systemCatalog, graph);

    assert.equal(items?.filter((item) => String(item.label).startsWith('zz_cap_')).length, 200);
  });

  test('debe ofrecer completion segura dentro de Modify para una ruta DataWindow resoluble', () => {
    setupDocument('file:///d_parent_completion.srd', [
      '$PBExportHeader$d_parent_completion.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states_completion") retrieve="SELECT parent_id, state_id FROM parent")',
    ].join('\r\n'));
    setupDocument('file:///d_states_completion.srd', [
      '$PBExportHeader$d_states_completion.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT state_id, state_name FROM states")',
    ].join('\r\n'));
    const doc = setupDocument('file:///w_dw_completion.srw', [
      'global type w_dw_completion from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent_completion"',
      '  dw_parent.Modify("state_id.")',
      'end event',
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('state_id.'));
    const character = lines[lineIndex].indexOf('state_id.') + 'state_id.'.length;
    const items = provideCompletion(doc, Position.create(lineIndex, character), kb, systemCatalog, graph);

    assert.ok(items, 'Esperaba completion DataWindow dentro de Modify sobre una ruta resoluble.');
    assert.ok(items?.some((item) => item.label === 'DataWindow'), 'Debe sugerir la continuación hacia el child DataWindow.');
    assert.ok(items?.some((item) => item.label === 'dddw'), 'Debe sugerir la metadata dddw del column child.');

    const docNested = setupDocument('file:///w_dw_completion_nested.srw', [
      'global type w_dw_completion_nested from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent_completion"',
      '  dw_parent.Modify("state_id.dddw.")',
      'end event',
    ].join('\r\n'));

    const nestedLines = docNested.getText().split(/\r?\n/);
    const nestedLineIndex = nestedLines.findIndex((line) => line.includes('state_id.dddw.'));
    const nestedCharacter = nestedLines[nestedLineIndex].indexOf('state_id.dddw.') + 'state_id.dddw.'.length;
    const nestedItems = provideCompletion(docNested, Position.create(nestedLineIndex, nestedCharacter), kb, systemCatalog, graph);

    assert.ok(nestedItems?.some((item) => item.label === 'name'), 'Debe sugerir la propiedad dddw.name del column child cuando el prefijo ya entra en dddw.');
  });

  test('debe ofrecer completion segura dentro de expresiones DataWindow en .srd', () => {
    const doc = setupDocument('file:///d_expression_completion.srd', [
      '$PBExportHeader$d_expression_completion.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(1) update=yes name=show_ribbon dbname="emp.show_ribbon")',
      ' column=(type=decimal(18,2) update=yes name=adjusted_hours dbname="emp.adjusted_hours")',
      ' column=(type=decimal(18,2) update=yes name=rate dbname="emp.rate") retrieve="SELECT show_ribbon, adjusted_hours, rate FROM emp")',
      'compute(band=detail name=cc_total expression="adjusted_")',
      'text(band=detail name=t_status visible="1~tif(cc_, 1, 0)")',
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const computeLine = lines.findIndex((line) => line.includes('expression="adjusted_"'));
    const computeCharacter = lines[computeLine].indexOf('adjusted_') + 'adjusted_'.length;
    const computeItems = provideCompletion(doc, Position.create(computeLine, computeCharacter), kb, systemCatalog, graph);

    assert.ok(computeItems?.some((item) => item.label === 'adjusted_hours'), 'Debe sugerir columnas del DataWindow dentro de expression=');

    const visibleLine = lines.findIndex((line) => line.includes('if(cc_'));
    const visibleCharacter = lines[visibleLine].indexOf('cc_') + 'cc_'.length;
    const visibleItems = provideCompletion(doc, Position.create(visibleLine, visibleCharacter), kb, systemCatalog, graph);

    assert.ok(visibleItems?.some((item) => item.label === 'cc_total'), 'Debe sugerir controles nombrados dentro de valores dinámicos con ~t.');
  });
});
