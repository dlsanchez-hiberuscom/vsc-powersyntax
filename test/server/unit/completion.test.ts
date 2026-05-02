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
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes);
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

  test('debe sugerir SetTransObject y Retrieve para datastore tipado', () => {
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
    assert.ok(items?.some((item) => item.label === 'Retrieve'));
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
});
