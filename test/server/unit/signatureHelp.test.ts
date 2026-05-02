import * as assert from 'assert';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { provideSignatureHelp } from '../../../src/server/features/signatureHelp';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';

suite('unit/signatureHelp', () => {
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
    invalidateDocumentAnalysis(uri);
    const analysis = analyzeDocument(doc);
    cache.set(uri, { version: 1, symbols: [], facts: analysis.semanticFacts, scopes: analysis.scopes });
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes);
    return doc;
  }

  test('debe devolver ayuda de firma para una función global del sistema', () => {
    const doc = setupDocument('file:///test.srw', 'integer li_rtn\nli_rtn = MessageBox("Title", "Message"');
    
    // Cursor justo después del "Message" -> "Title", "Message"|
    // Son 2 parámetros (0, 1), por tanto activeParameter debería ser 1
    const pos = Position.create(1, 38);
    const result = provideSignatureHelp(doc, pos, kb, systemCatalog, graph);

    assert.ok(result);
    assert.strictEqual(result.signatures.length > 0, true);
    // En PowerBuilder, MessageBox tiene muchas sobrecargas. Verificamos que contenga algo.
    assert.ok(result.signatures.some(s => s.label.toLowerCase().includes('messagebox')));
    assert.strictEqual(result.activeParameter, 1);
  });

  test('debe devolver ayuda de firma para un método de instancia local', () => {
    const doc = setupDocument('file:///n_cst_math.sru', `
forward
global type n_cst_math from nonvisualobject
end type
end forward

global type n_cst_math from nonvisualobject
end type

forward prototypes
public function integer of_add(integer a, integer b)
end prototypes

public function integer of_add(integer a, integer b);
  return a + b
end function

public subroutine of_test()
  integer x
  x = this.of_add(10, 
end subroutine
    `);

    // Cursor después de la coma en `this.of_add(10, |`
    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex(l => l.includes('x = this.of_add(10, '));
    const pos = Position.create(lineIndex, 22);
    const result = provideSignatureHelp(doc, pos, kb, systemCatalog, graph);

    assert.ok(result);
    assert.strictEqual(result.signatures.length, 1);
    const sig = result.signatures[0];
    
    // Verifica parámetros parseados del documentAnalysis
    assert.ok(sig.parameters);
    assert.strictEqual(sig.parameters.length, 2);
    assert.strictEqual(sig.parameters[0].label, 'integer a');
    assert.strictEqual(sig.parameters[1].label, 'integer b');
    
    // El cursor está después de la primera coma, o sea parámetro 2 (index 1)
    assert.strictEqual(result.activeParameter, 1);
  });

  test('debe resolver llamadas anidadas correctamente', () => {
    const doc = setupDocument('file:///test.srw', 'string ls_val\nls_val = Upper(Mid("Hello", 1, 2))');
    
    // Cursor justo después de la primera coma de Mid: Mid("Hello",| 
    const pos = Position.create(1, 27);
    const result = provideSignatureHelp(doc, pos, kb, systemCatalog, graph);

    assert.ok(result);
    assert.strictEqual(result.signatures.length > 0, true);
    assert.ok(result.signatures[0].label.toLowerCase().includes('mid'));
    assert.strictEqual(result.activeParameter, 1); // porque está después de la primera coma de Mid
  });

  test('debe priorizar la firma DataWindow de Retrieve para datastore tipado', () => {
    const doc = setupDocument('file:///test_dw_signature.sru', `
global type w_tx_sig from window
  datastore ids_orders
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  ids_orders.Retrieve(
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('ids_orders.Retrieve('));
    const pos = Position.create(lineIndex, 22);
    const result = provideSignatureHelp(doc, pos, kb, systemCatalog, graph);

    assert.ok(result);
    assert.ok(result.signatures.some((signature) => signature.label === 'Retrieve(argument...)'));
    assert.ok(!result.signatures.some((signature) => signature.label.includes('urlName')), 'No debe priorizar la firma REST de Retrieve.');
  });

  test('debe especializar la firma de Retrieve usando los argumentos del .srd enlazado por DataObject', () => {
    const dataWindowDocument = TextDocument.create(
      'file:///d_sales_orders.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_sales_orders.srd',
        'release 39;',
        'table(retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) " arguments=(("custarg", number)) )" )'
      ].join('\r\n')
    );
    const dataWindowAnalysis = analyzeDocument(dataWindowDocument);
    kb.upsertDocument(
      dataWindowDocument.uri,
      dataWindowAnalysis.semanticFacts,
      dataWindowAnalysis.scopes,
      dataWindowAnalysis.snapshot
    );

    const doc = setupDocument('file:///test_dw_signature_bound.sru', `
global type w_tx_sig_bound from window
  datastore ids_orders
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  ids_orders.DataObject = "d_sales_orders"
  ids_orders.Retrieve(
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('ids_orders.Retrieve('));
    const pos = Position.create(lineIndex, 22);
    const result = provideSignatureHelp(doc, pos, kb, systemCatalog, graph);

    assert.ok(result);
    assert.ok(result.signatures.some((signature) => signature.label === 'Retrieve(number custarg)'));
    assert.strictEqual(result.activeParameter, 0);
  });
});
