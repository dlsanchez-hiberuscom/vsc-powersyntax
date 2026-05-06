import * as assert from 'assert';
import { Position, CompletionItemKind } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  isCompletionItemResolveData,
  provideCompletion,
  resolveCompletionItem,
  resolveCompletionItemResult,
} from '../../../src/server/features/completion';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { HotContextCache } from '../../../src/server/knowledge/HotContextCache';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { EntityKind } from '../../../src/server/knowledge/types';
import { estimateLspPayloadBytes } from '../../../src/server/runtime/interactiveServingStats';

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

  test('sirve completion inicial ligero y difiere documentación de catálogo a resolve', () => {
    const doc = setupDocument('file:///test_completion_resolve_catalog.sru', `
global type test_completion_resolve_catalog from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  ab
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'ab');
    const items = provideCompletion(doc, Position.create(lineIndex, 4), kb, systemCatalog, graph, undefined, undefined, 'es');
    assert.ok(items);

    const absItem = items.find((item) => item.label === 'Abs');
    assert.ok(absItem);
    assert.equal(absItem.documentation, undefined);
    assert.ok(isCompletionItemResolveData(absItem.data));
    assert.equal(absItem.data.locale, 'es');

    const resolved = resolveCompletionItem(absItem, kb, systemCatalog, 'es');
    assert.equal(resolved.label, absItem.label);
    assert.equal(resolved.kind, absItem.kind);
    assert.equal(resolved.sortText, absItem.sortText);
    assert.match(String(resolved.detail), /Abs/i);
    assert.match(String(resolved.documentation), /magnitud positiva/i);
    assert.ok(estimateLspPayloadBytes(items) < 64 * 1024);
    assert.ok(estimateLspPayloadBytes(resolved) < 4 * 1024);
  });

  test('resolve localiza built-ins adicionales del slice visible sin inflar completion initial', () => {
    const doc = setupDocument('file:///test_completion_len_locale.sru', `
global type test_completion_len_locale from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  le
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'le');
    const items = provideCompletion(doc, Position.create(lineIndex, 4), kb, systemCatalog, graph, undefined, undefined, 'es');
    assert.ok(items);

    const lenItem = items.find((item) => item.label === 'Len');
    assert.ok(lenItem);
    assert.equal(lenItem.documentation, undefined);
    assert.ok(isCompletionItemResolveData(lenItem.data));
    assert.equal(lenItem.data.locale, 'es');

    const resolved = resolveCompletionItem(lenItem, kb, systemCatalog, 'es');
    assert.match(String(resolved.detail), /Len/i);
    assert.match(String(resolved.documentation), /medir texto visible o buffers binarios/i);
    assert.match(String(resolved.documentation), /Len cuenta caracteres y no incluye el terminador null/i);
    assert.ok(estimateLspPayloadBytes(items) < 64 * 1024);
    assert.ok(estimateLspPayloadBytes(resolved) < 4 * 1024);
  });

  test('resolve localiza DataWindow core en completion resolve sin duplicar items', () => {
    const doc = setupDocument('file:///test_completion_dw_retrieve_locale.sru', `
global type test_completion_dw_retrieve_locale from window
  datastore ids_orders
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  ids_orders.Ret
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'ids_orders.Ret');
    const items = provideCompletion(doc, Position.create(lineIndex, lines[lineIndex].length), kb, systemCatalog, graph, undefined, undefined, 'es');
    assert.ok(items);

    const retrieveItems = items.filter((item) => item.label === 'Retrieve');
    assert.strictEqual(retrieveItems.length, 1);
    assert.strictEqual(retrieveItems[0].documentation, undefined);
    assert.ok(isCompletionItemResolveData(retrieveItems[0].data));
    assert.strictEqual(retrieveItems[0].data.locale, 'es');

    const resolved = resolveCompletionItem(retrieveItems[0], kb, systemCatalog, 'es');
    assert.match(String(resolved.detail), /Retrieve/i);
    assert.match(String(resolved.documentation), /buffer primario del DataWindow, DataStore o DataWindowChild/i);
    assert.match(String(resolved.documentation), /fuente de datos es External/i);
    assert.match(String(resolved.documentation), /numero de filas visibles en el buffer primario/i);
    assert.ok(estimateLspPayloadBytes(items) < 64 * 1024);
    assert.ok(estimateLspPayloadBytes(resolved) < 4 * 1024);
  });

  test('mantiene ranking contextual local, argumentos, instancia y built-ins', () => {
    const doc = setupDocument('file:///test_completion_rank_matrix.sru', `
global type test_completion_rank_matrix from nonvisualobject
  integer ii_rank_value
end type
forward prototypes
public function integer of_rank(integer ai_rank_value)
end prototypes
public function integer of_rank(integer ai_rank_value)
  integer li_rank_value
  
end function
    `);

    const lines = doc.getText().split(/\r?\n/);
    const localDeclarationLine = lines.findIndex((line) => line.includes('li_rank_value'));
    const lineIndex = localDeclarationLine + 1;
    const items = provideCompletion(doc, Position.create(lineIndex, 2), kb, systemCatalog, graph);
    assert.ok(items);

    const localItem = items.find((item) => item.label === 'li_rank_value');
    const argumentItem = items.find((item) => item.label === 'ai_rank_value');
    const instanceItem = items.find((item) => item.label === 'ii_rank_value');
    const builtinItem = items.find((item) => item.label === 'Abs');

    assert.ok(localItem?.sortText);
    assert.ok(argumentItem?.sortText);
    assert.ok(instanceItem?.sortText);
    assert.ok(builtinItem?.sortText);
    assert.ok(localItem.sortText < argumentItem.sortText);
    assert.ok(argumentItem.sortText < instanceItem.sortText);
    assert.ok(instanceItem.sortText < builtinItem.sortText);
    assert.equal(new Set(items.map((item) => item.label)).size, items.length);
  });

  test('no ofrece completion dentro de comentario, string ni receiver desconocido', () => {
    const doc = setupDocument('file:///test_completion_boundaries.sru', `
global type test_completion_boundaries from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  // ab
  string ls_text = "ab"
  lnv_missing.
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const commentLine = lines.findIndex((line) => line.includes('// ab'));
    const stringLine = lines.findIndex((line) => line.includes('"ab"'));
    const unknownReceiverLine = lines.findIndex((line) => line.includes('lnv_missing.'));

    assert.equal(provideCompletion(doc, Position.create(commentLine, lines[commentLine].indexOf('ab') + 2), kb, systemCatalog, graph), null);
    assert.equal(provideCompletion(doc, Position.create(stringLine, lines[stringLine].indexOf('ab') + 2), kb, systemCatalog, graph), null);
    assert.equal(provideCompletion(doc, Position.create(unknownReceiverLine, lines[unknownReceiverLine].length), kb, systemCatalog, graph), null);
  });

  test('resolve conserva el item cuando no hay data propia', () => {
    const item = { label: 'custom_item', sortText: 'z_custom_item' };

    assert.strictEqual(resolveCompletionItem(item, kb, systemCatalog), item);
  });

  test('expone misses de completion resolve como resultado negativo reutilizable', () => {
    const doc = setupDocument('file:///test_completion_resolve_negative.sru', `
global type test_completion_resolve_negative from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  ab
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'ab');
    const items = provideCompletion(doc, Position.create(lineIndex, 4), kb, systemCatalog, graph, undefined, undefined, 'es');
    assert.ok(items);

    const absItem = items.find((item) => item.label === 'Abs');
    assert.ok(absItem);
    assert.ok(isCompletionItemResolveData(absItem.data));

    const missingItem = {
      ...absItem,
      data: {
        ...absItem.data,
        symbolId: 'system.callable.abs.missing',
      },
    };
    const resolution = resolveCompletionItemResult(missingItem, kb, systemCatalog, 'es');

    assert.strictEqual(resolution.item, missingItem);
    assert.strictEqual(resolution.resolved, false);
    assert.strictEqual(resolution.negativeReason, 'unresolved');
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

  test('resolve localiza keywords y reserved words sin traducir lexemas reales', () => {
    const doc = setupDocument('file:///test_completion_keyword_reserved_locale.sru', `
global type test_completion_keyword_reserved_locale from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  fo
  tr
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const keywordLine = lines.findIndex((line) => line.trim() === 'fo');
    const reservedLine = lines.findIndex((line) => line.trim() === 'tr');

    const keywordItems = provideCompletion(doc, Position.create(keywordLine, 4), kb, systemCatalog, graph, undefined, undefined, 'es');
    const reservedItems = provideCompletion(doc, Position.create(reservedLine, 4), kb, systemCatalog, graph, undefined, undefined, 'es');
    assert.ok(keywordItems);
    assert.ok(reservedItems);

    const forItem = keywordItems.find((item) => item.label === 'FOR');
    const trueItem = reservedItems.find((item) => item.label === 'TRUE');
    assert.ok(forItem);
    assert.ok(trueItem);
    assert.equal(forItem?.documentation, undefined);
    assert.equal(trueItem?.documentation, undefined);
    assert.ok(isCompletionItemResolveData(forItem?.data));
    assert.ok(isCompletionItemResolveData(trueItem?.data));
    assert.equal(forItem?.data.locale, 'es');
    assert.equal(trueItem?.data.locale, 'es');

    const resolvedFor = resolveCompletionItem(forItem!, kb, systemCatalog, 'es');
    const resolvedTrue = resolveCompletionItem(trueItem!, kb, systemCatalog, 'es');
    assert.match(String(resolvedFor.detail), /FOR/i);
    assert.match(String(resolvedFor.documentation), /inicio del bloque iterativo/i);
    assert.match(String(resolvedTrue.detail), /TRUE/i);
    assert.match(String(resolvedTrue.documentation), /resultado booleano verdadero/i);
    assert.ok(estimateLspPayloadBytes(keywordItems) < 64 * 1024);
    assert.ok(estimateLspPayloadBytes(resolvedFor) < 4 * 1024);
    assert.ok(estimateLspPayloadBytes(resolvedTrue) < 4 * 1024);
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

  test('debe sugerir el catálogo DataWindow para un descendiente custom', () => {
    setupDocument('file:///u_dw_orders.sru', `
global type u_dw_orders from datawindow
end type
    `);

    const doc = setupDocument('file:///test_custom_datwindow_completion.sru', `
global type test_custom_datwindow_completion from nonvisualobject
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  u_dw_orders idw_orders
  idw_orders.
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'idw_orders.');
    const pos = Position.create(lineIndex, 13);

    const items = provideCompletion(doc, pos, kb, systemCatalog, graph);
    assert.ok(items?.some((item) => item.label === 'SetTransObject'));
    assert.ok(items?.some((item) => item.label === 'Retrieve'));
    assert.ok(items?.some((item) => item.label === 'GetChild'));
  });

  test('sugiere valores enumerados en parámetros DataWindow para un descendiente custom', () => {
    setupDocument('file:///u_dw_enum_orders.sru', `
global type u_dw_enum_orders from datawindow
end type
    `);

    const doc = setupDocument('file:///test_custom_dw_enum_argument_completion.srw', `
global type test_custom_dw_enum_argument_completion from window
end type
forward prototypes
public subroutine of_test()
end prototypes
public subroutine of_test()
  u_dw_enum_orders idw_orders
  idw_orders.RowsMove(1, 1, 
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

  test('debe ofrecer completion segura para un report child y su columna dropdown anidada', () => {
    setupDocument('file:///d_parent_report_completion.srd', [
      '$PBExportHeader$d_parent_report_completion.srd',
      'release 39;',
      'datawindow(units=0)',
      'report(name=rpt_orders dataobject="d_orders_report_completion")',
    ].join('\r\n'));
    setupDocument('file:///d_orders_report_completion.srd', [
      '$PBExportHeader$d_orders_report_completion.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(10) update=yes name=status_id dbname="sales.status_id" dddw.name="d_status_report_completion") retrieve="SELECT status_id FROM orders")',
    ].join('\r\n'));
    setupDocument('file:///d_status_report_completion.srd', [
      '$PBExportHeader$d_status_report_completion.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT status_id, status_name FROM status")',
    ].join('\r\n'));

    const docReport = setupDocument('file:///w_report_completion.srw', [
      'global type w_report_completion from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent_report_completion"',
      '  dw_parent.Modify("rpt_orders.")',
      'end event',
    ].join('\r\n'));

    const reportLines = docReport.getText().split(/\r?\n/);
    const reportLineIndex = reportLines.findIndex((line) => line.includes('rpt_orders.'));
    const reportCharacter = reportLines[reportLineIndex].indexOf('rpt_orders.') + 'rpt_orders.'.length;
    const reportItems = provideCompletion(docReport, Position.create(reportLineIndex, reportCharacter), kb, systemCatalog, graph);

    assert.ok(reportItems, 'Esperaba completion DataWindow dentro de Modify sobre un report child resoluble.');
    assert.ok(reportItems?.some((item) => item.label === 'status_id'), 'Debe sugerir la columna del DataWindow hijo publicado por el report.');
    assert.ok(reportItems?.some((item) => item.label === 'DataWindow'), 'Debe sugerir el namespace DataWindow del report child.');

    const docColumn = setupDocument('file:///w_report_column_completion.srw', [
      'global type w_report_column_completion from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent_report_completion"',
      '  dw_parent.Modify("rpt_orders.status_id.")',
      'end event',
    ].join('\r\n'));

    const columnLines = docColumn.getText().split(/\r?\n/);
    const columnLineIndex = columnLines.findIndex((line) => line.includes('rpt_orders.status_id.'));
    const columnCharacter = columnLines[columnLineIndex].indexOf('rpt_orders.status_id.') + 'rpt_orders.status_id.'.length;
    const columnItems = provideCompletion(docColumn, Position.create(columnLineIndex, columnCharacter), kb, systemCatalog, graph);

    assert.ok(columnItems, 'Esperaba completion DataWindow dentro de Modify sobre una columna anidada en report child.');
    assert.ok(columnItems?.some((item) => item.label === 'DataWindow'), 'Debe sugerir la continuación hacia el child DataWindow del dropdown anidado.');
    assert.ok(columnItems?.some((item) => item.label === 'dddw'), 'Debe sugerir la metadata dddw de la columna anidada.');

    const docNested = setupDocument('file:///w_report_column_nested_completion.srw', [
      'global type w_report_column_nested_completion from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent_report_completion"',
      '  dw_parent.Modify("rpt_orders.status_id.dddw.")',
      'end event',
    ].join('\r\n'));

    const nestedLines = docNested.getText().split(/\r?\n/);
    const nestedLineIndex = nestedLines.findIndex((line) => line.includes('rpt_orders.status_id.dddw.'));
    const nestedCharacter = nestedLines[nestedLineIndex].indexOf('rpt_orders.status_id.dddw.') + 'rpt_orders.status_id.dddw.'.length;
    const nestedItems = provideCompletion(docNested, Position.create(nestedLineIndex, nestedCharacter), kb, systemCatalog, graph);

    assert.ok(nestedItems?.some((item) => item.label === 'name'), 'Debe sugerir dddw.name también cuando la columna cuelga de un report child.');
  });

  test('debe ofrecer completion raiz DataWindow dentro de Modify con prefijo parcial', () => {
    setupDocument('file:///d_parent_completion_root.srd', [
      '$PBExportHeader$d_parent_completion_root.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT parent_id FROM parent")',
    ].join('\r\n'));
    const doc = setupDocument('file:///w_dw_completion_root.srw', [
      'global type w_dw_completion_root from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent_completion_root"',
      '  dw_parent.Modify("DataWindow.T")',
      'end event',
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('DataWindow.T'));
    const character = lines[lineIndex].indexOf('DataWindow.T') + 'DataWindow.T'.length;
    const items = provideCompletion(doc, Position.create(lineIndex, character), kb, systemCatalog, graph);

    assert.ok(items, 'Esperaba completion DataWindow raíz para prefijo DataWindow.T dentro de Modify.');
    assert.ok(items?.some((item) => item.label === 'Table'), 'Debe sugerir el child Table bajo DataWindow.');
    assert.ok(!items?.some((item) => item.label === 'Syntax'), 'No debe abrir siblings fuera del prefijo actual DataWindow.T.');
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

    const docFunction = setupDocument('file:///d_expression_function_completion.srd', [
      '$PBExportHeader$d_expression_function_completion.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=decimal(18,2) update=yes name=amount dbname="emp.amount") retrieve="SELECT amount FROM emp")',
      'compute(band=detail name=cc_sum expression="Su")',
    ].join('\r\n'));

    const functionLines = docFunction.getText().split(/\r?\n/);
    const functionLine = functionLines.findIndex((line) => line.includes('expression="Su"'));
    const functionCharacter = functionLines[functionLine].indexOf('Su') + 'Su'.length;
    const functionItems = provideCompletion(docFunction, Position.create(functionLine, functionCharacter), kb, systemCatalog, graph);
    const sumItem = functionItems?.find((item) => item.label === 'Sum');

    assert.ok(sumItem, 'Debe sugerir funciones oficiales de expresión DataWindow dentro de expression=');
    assert.match(String(sumItem?.detail), /DataWindow/i);
  });

  test('localiza la documentación de completion sin duplicar items por locale', () => {
    const doc = setupDocument('file:///test_completion_locale.sru', `
global type test_completion_locale from nonvisualobject
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  Mes
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.trim() === 'Mes');
    const items = provideCompletion(doc, Position.create(lineIndex, 5), kb, systemCatalog, graph, undefined, undefined, 'es');

    assert.ok(items);
    const messageBoxItems = items.filter((item) => item.label === 'MessageBox');
    assert.strictEqual(messageBoxItems.length, 1);
    assert.strictEqual(messageBoxItems[0].documentation, undefined);

    const resolved = resolveCompletionItem(messageBoxItems[0], kb, systemCatalog, 'es');
    assert.match(String(resolved.documentation), /interacciones bloqueantes/i);
    assert.notStrictEqual(resolved.detail, resolved.documentation);
  });
});
