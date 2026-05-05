import * as assert from 'assert/strict';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { buildHoverPresentationResult, provideHover } from '../../../src/server/features/hover';
import { formatHoverViewModel } from '../../../src/server/features/hoverFormat';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { invalidateDocumentAnalysis } from '../../../src/server/analysis/analysisCache';

suite('unit/hover', () => {
  let kb: KnowledgeBase;
  let catalog: SystemCatalog;
  let graph: InheritanceGraph;

  setup(() => {
    kb = new KnowledgeBase();
    kb.upsertDocument('file:///w_main.sru', [
      {
        id: 'w_main',
        name: 'w_main',
        kind: EntityKind.Type,
        uri: 'file:///w_main.sru',
        line: 0,
        character: 0
      },
      {
        id: 'of_setdata',
        name: 'of_SetData',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 10,
        character: 4,
        lineage: {
          sourceKind: 'document',
          authority: 'derived',
          phase: 'implementation',
          confidence: 'direct'
        }
      }
    ]);
    kb.upsertDocument('file:///w_ambiguous.sru', [
      {
        id: 'w_ambiguous',
        name: 'w_ambiguous',
        kind: EntityKind.Type,
        uri: 'file:///w_ambiguous.sru',
        line: 0,
        character: 0
      },
      {
        id: 'of_ambiguous_a',
        name: 'of_Ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_ambiguous',
        uri: 'file:///w_ambiguous.sru',
        line: 10,
        character: 4,
        lineage: {
          sourceKind: 'document',
          authority: 'derived',
          phase: 'implementation',
          confidence: 'direct'
        }
      },
      {
        id: 'of_ambiguous_b',
        name: 'of_Ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_ambiguous',
        uri: 'file:///w_ambiguous.sru',
        line: 20,
        character: 4,
        lineage: {
          sourceKind: 'document',
          authority: 'derived',
          phase: 'implementation',
          confidence: 'direct'
        }
      }
    ]);
    catalog = new SystemCatalog();
    graph = new InheritanceGraph(kb);
  });

  function setupAnalyzedDocument(uri: string, content: string): TextDocument {
    const doc = TextDocument.create(uri, 'powerbuilder', 1, content);
    invalidateDocumentAnalysis(uri);
    const analysis = analyzeDocument(doc);
    kb.upsertDocument(uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    return doc;
  }

  test('provideHover devuelve Markdown oficial para funcion de sistema', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  MessageBox("Hola", "Mundo")  ');
    
    // Position sobre MessageBox
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);
    
    assert.ok(hover, 'Hover no debería ser null');
    assert.equal((hover?.contents as any).kind, 'markdown');
    
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('MessageBox'), 'Debe contener el nombre de la función');
    assert.ok(value.includes('docs.appeon.com'), 'Debe contener el enlace oficial de la documentación');
    assert.ok(!value.includes('*Origen:*'), 'No debe mostrar provenance interna por defecto');
    assert.ok(!value.includes('*Confianza:*'), 'No debe mostrar confidence interna por defecto');
  });

  test('provideHover localiza summary, documentation y parametros del catalogo visible', () => {
    const doc = TextDocument.create('file:///test_hover_locale.sru', 'powerbuilder', 1, '  MessageBox("Hola", "Mundo")  ');

    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph, undefined, 'es');

    assert.ok(hover, 'Hover no debería ser null');
    const value = (hover?.contents as any).value as string;
    assert.match(value, /cuadro de mensaje del sistema/i);
    assert.match(value, /interacciones bloqueantes/i);
    assert.match(value, /Titulo visible en la barra/i);
    assert.match(value, /Devuelve el boton seleccionado/i);
    assert.match(value, /Evita usarlo en rutas de cambio de foco sensibles/i);
  });

  test('provideHover resuelve system types modernos del catálogo runtime', () => {
    const doc = setupAnalyzedDocument('file:///n_http_hover.sru', [
      'forward',
      'global type n_http_hover from httpclient',
      'end type',
      'end forward',
      'global type n_http_hover from httpclient',
      'end type'
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('from httpclient'));
    const hover = provideHover(doc, Position.create(lineIndex, lines[lineIndex].indexOf('httpclient') + 2), kb, catalog, graph);

    assert.ok(hover, 'Hover no debería ser null para HTTPClient');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('HTTPClient'), 'Debe contener el nombre del tipo del sistema');
    assert.match(value, /Cliente HTTP/i, 'Debe incluir el resumen del system type moderno.');
  });

  test('provideHover une valores manual-core y generated para tipos enumerados', () => {
    const doc = TextDocument.create('file:///test_windowtype_hover.sru', 'powerbuilder', 1, 'WindowType lt_window_type');
    const hover = provideHover(doc, Position.create(0, 2), kb, catalog, graph);

    assert.ok(hover, 'Hover no debería ser null para WindowType');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('WindowType'), 'Debe contener el nombre del tipo enumerado');
    assert.ok(value.includes('Main!'), 'Debe exponer valores manual-core del tipo enumerado');
    assert.ok(value.includes('MDIDock!'), 'Debe exponer valores oficiales generated añadidos al tipo enumerado');
  });

  test('provideHover resuelve valores enumerados con sufijo ! dentro de argumentos de sistema', () => {
    const doc = setupAnalyzedDocument('file:///test_enum_value_hover.sru', `
global type test_enum_value_hover from nonvisualobject
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  integer li_file
  FileSeek(li_file, 0, FromBeginning!)
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('FromBeginning!'));
    const character = lines[lineIndex].indexOf('FromBeginning!') + 2;
    const hover = provideHover(doc, Position.create(lineIndex, character), kb, catalog, graph);

    assert.ok(hover, 'Hover no debería ser null para FromBeginning!');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('FromBeginning!'), 'Debe conservar el sufijo ! del valor enumerado.');
    assert.ok(value.includes('**Tipo:** SeekType'), 'Debe resolver el tipo enumerado esperado.');
  });

  test('provideHover expone tipo y riesgo de SQLCA desde system-globals', () => {
    const doc = TextDocument.create('file:///test_sqlca_hover.sru', 'powerbuilder', 1, 'SQLCA.DBHandle');
    const hover = provideHover(doc, Position.create(0, 2), kb, catalog, graph);

    assert.ok(hover, 'Hover no debería ser null para SQLCA');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('SQLCA : Transaction'));
    assert.ok(value.includes('Riesgo de uso'));
    assert.ok(value.includes('legacy'));
  });

  test('provideHover devuelve Markdown de KnowledgeBase para función de usuario', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  of_SetData()  ');
    
    // Position sobre of_SetData
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);
    
    assert.ok(hover, 'Hover no debería ser null');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('of_SetData'), 'Debe contener el nombre de la función');
    assert.ok(value.includes('**Defined in:** `w_main`'), 'Debe indicar el owner útil del símbolo');
    assert.ok(value.includes('workspace fallback'), 'Debe advertir cuando la resolución cae a fallback global');
    assert.ok(!value.includes('*Origen:*'), 'No debe exponer provenance interna por defecto');
    assert.ok(!value.includes('*Confianza:*'), 'No debe indicar confidence interna');
    assert.ok(!value.includes('*Confianza de resolución:*'), 'No debe proyectar la confidence general textual');
    assert.ok(!value.includes('*Motivo de resolución:*'), 'No debe proyectar el reason code textual');
    assert.ok(!value.includes('*Candidatos ganadores:*'), 'No debe proyectar la cardinalidad interna');
  });

  test('provideHover no muestra workspace fallback cuando el documento activo ya resuelve por member-hierarchy', () => {
    const doc = setupAnalyzedDocument('file:///w_hover_active_context.srw', `
global type w_hover_active_context from window
end type

forward prototypes
public function integer of_test()
public function integer of_runner()
end prototypes

public function integer of_test();
  return 1
end function

public function integer of_runner();
  return of_test()
end function
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('return of_test()'));
    const hover = provideHover(doc, Position.create(lineIndex, lines[lineIndex].indexOf('of_test') + 2), kb, catalog, graph);

    assert.ok(hover, 'Hover no debería ser null para una llamada resuelta en el documento activo.');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('of_test'), 'Debe resolver la función del documento activo.');
    assert.ok(!value.includes('workspace fallback'), 'No debe advertir fallback global cuando la resolución ya es jerárquica y local.');
  });

  test('provideHover devuelve null si no es un identificador valido', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  ==  ');
    const hover = provideHover(doc, Position.create(0, 2), kb, catalog, graph);
    assert.equal(hover, null);
  });

  test('provideHover devuelve null si el identificador no existe en ningún lado', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  una_funcion_random()  ');
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);
    assert.equal(hover, null);
  });

  test('buildHoverPresentationResult marca negativos seguros para keyword, comentario, string y whitespace', () => {
    const keywordDoc = TextDocument.create('file:///hover_keyword.sru', 'powerbuilder', 1, 'IF');
    const commentDoc = TextDocument.create('file:///hover_comment.sru', 'powerbuilder', 1, 'll_count = 1 // comment');
    const stringDoc = TextDocument.create('file:///hover_string.sru', 'powerbuilder', 1, 'MessageBox("Hola", "Mundo")');
    const whitespaceDoc = TextDocument.create('file:///hover_whitespace.sru', 'powerbuilder', 1, '     ');
    const keywordCatalog = {
      resolveLanguageSymbol: () => ({ name: 'IF', kind: 'keyword' }),
      findSystemSymbol: () => [],
      resolveMemberFunctionForOwner: () => undefined,
      resolveEventForOwner: () => undefined,
    } as unknown as SystemCatalog;

    const keyword = buildHoverPresentationResult(keywordDoc, Position.create(0, 1), kb, keywordCatalog, graph);
    const comment = buildHoverPresentationResult(commentDoc, Position.create(0, 16), kb, catalog, graph);
    const string = buildHoverPresentationResult(stringDoc, Position.create(0, 12), kb, catalog, graph);
    const whitespace = buildHoverPresentationResult(whitespaceDoc, Position.create(0, 2), kb, catalog, graph);

    assert.deepEqual(keyword, { kind: 'negative', reason: 'keyword', cacheToken: 'if' });
    assert.deepEqual(comment, { kind: 'negative', reason: 'comment', cacheToken: 'comment' });
    assert.deepEqual(string, { kind: 'negative', reason: 'string', cacheToken: 'string' });
    assert.deepEqual(whitespace, { kind: 'negative', reason: 'whitespace', cacheToken: 'whitespace' });
  });

  test('buildHoverPresentationResult produce un viewmodel equivalente al hover visible para built-ins', () => {
    const doc = TextDocument.create('file:///hover_viewmodel_messagebox.sru', 'powerbuilder', 1, 'MessageBox("Hola", "Mundo")');

    const presentation = buildHoverPresentationResult(doc, Position.create(0, 5), kb, catalog, graph, undefined, 'es');
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph, undefined, 'es');

    assert.equal(presentation.kind, 'viewmodel');
    assert.equal(presentation.viewModel.kind, 'built-in');
    assert.ok(hover, 'El hover final visible no debe ser null.');
    assert.equal((hover?.contents as any).kind, 'markdown');
    assert.equal((hover?.contents as any).value, formatHoverViewModel(presentation.viewModel));
    assert.match((hover?.contents as any).value as string, /cuadro de mensaje del sistema/i);
  });

  test('provideHover anota la ambiguedad cuando existen varios ganadores minimos', () => {
    const doc = TextDocument.create('file:///w_ambiguous.sru', 'powerbuilder', 1, '  of_Ambiguous()  ');
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);

    assert.ok(hover, 'Hover ambiguo no debería ser null');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('ambiguous target'), 'Debe indicar la ambigüedad de forma útil y compacta');
    assert.ok(!value.includes('*Candidatos ganadores:*'), 'No debe proyectar la cardinalidad interna del winner path');
  });

  test('provideHover resuelve built-ins del catálogo para un descendiente custom de DataWindow', () => {
    setupAnalyzedDocument('file:///u_dw_hover_runtime.sru', `
global type u_dw_hover_runtime from datawindow
end type
    `);

    const doc = setupAnalyzedDocument('file:///w_custom_dw_hover.srw', `
global type w_custom_dw_hover from window
end type

event open();
  u_dw_hover_runtime idw_orders
  idw_orders.Retrieve()
end event
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('idw_orders.Retrieve()'));
    const character = lines[lineIndex].indexOf('Retrieve') + 2;
    const hover = provideHover(doc, Position.create(lineIndex, character), kb, catalog, graph);

    assert.ok(hover, 'Hover no debería ser null para métodos nativos en descendientes custom.');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('Retrieve'), 'Debe resolver la función del catálogo nativo.');
    assert.ok(value.includes('docs.appeon.com'), 'Debe seguir exponiendo la referencia oficial.');
    assert.ok(!value.includes('workspace fallback'), 'No debe degradar a fallback global cuando el owner chain del catálogo ya resuelve el método nativo.');
  });

  test('provideHover prioriza la entrada de DataWindow para Retrieve con datastore tipado', () => {
    const doc = setupAnalyzedDocument('file:///w_tx_hover.sru', `
global type w_tx_hover from window
  datastore ids_orders
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  ids_orders.Retrieve()
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('ids_orders.Retrieve()'));
    const hover = provideHover(doc, Position.create(lineIndex, 15), kb, catalog, graph);

    assert.ok(hover, 'Hover no debería ser null para ids_orders.Retrieve().');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('Recupera filas desde la fuente de datos'), 'Debe usar la entrada DataWindow de Retrieve.');
    assert.ok(value.includes('datawindow_reference/dwmeth_Retrieve.html'), 'Debe apuntar a la referencia de DataWindow.');
  });

  test('provideHover expone riesgo y documentación ampliada para Update de datastore tipado', () => {
    const doc = setupAnalyzedDocument('file:///w_tx_hover_update.sru', `
global type w_tx_hover_update from window
  datastore ids_orders
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  ids_orders.Update()
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('ids_orders.Update()'));
    const hover = provideHover(
      doc,
      Position.create(lineIndex, lines[lineIndex].indexOf('Update') + 2),
      kb,
      catalog,
      graph,
    );

    assert.ok(hover, 'Hover no debería ser null para ids_orders.Update().');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('Envia a la base de datos los cambios acumulados'), 'Debe usar el summary ampliado de Update.');
    assert.ok(value.includes('**Riesgo de uso:** dinamico'), 'Debe proyectar el riesgo catalogado de Update.');
    assert.ok(value.includes('accept?'), 'Debe exponer la firma enriquecida de Update.');
  });

  test('provideHover no hace fallback plano para GetChild sobre DataWindowChild tipado', () => {
    const doc = setupAnalyzedDocument('file:///w_tx_hover_child.sru', `
global type w_tx_hover_child from window
  datawindowchild idwc_orders
end type

forward prototypes
public subroutine of_test()
end prototypes

public subroutine of_test()
  idwc_orders.GetChild("orders", idwc_orders)
end subroutine
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('idwc_orders.GetChild('));
    const hover = provideHover(
      doc,
      Position.create(lineIndex, lines[lineIndex].indexOf('GetChild') + 2),
      kb,
      catalog,
      graph,
    );

    assert.equal(hover, null, 'GetChild no debe exponer hover plano cuando el owner resuelto es DataWindowChild.');
  });

  test('provideHover explica un DataObject literal resoluble hacia un .srd indexado', () => {
    setupAnalyzedDocument('file:///d_customer.srd', [
      '$PBExportHeader$d_customer.srd',
      'release 39;',
      'datawindow(units=0)',
      'header(height=88 color=67108864)',
      'detail(height=68 color=67108864)',
      'table(column=(type=long update=yes name=id dbname="customer.id")',
      ' column=(type=char(40) update=yes name=status dbname="customer.status")',
      ' retrieve="SELECT id, status FROM customer" arguments=(("custarg", number)) )'
    ].join('\r\n'));
    const doc = setupAnalyzedDocument('file:///w_dataobject_hover.srw', `
global type w_dataobject_hover from window
end type

event open();
  dw_1.DataObject = "d_customer"
end event
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('DataObject = "d_customer"'));
    const hover = provideHover(doc, Position.create(lineIndex, 22), kb, catalog, graph);

    assert.ok(hover, 'Hover no debería ser null para el DataObject literal.');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('d_customer'), 'Debe resolver el objeto DataWindow por nombre.');
    assert.ok(value.includes('**Inherits:** `d_customer -> datawindow`'), 'Debe exponer que el target resuelto es un DataWindow.');
    assert.ok(value.includes('**DataWindow Safe Mode**'), 'Debe añadir el bloque de safe mode del .srd.');
    assert.ok(value.includes('SQL base:'), 'Debe incluir el SQL base del DataWindow.');
    assert.ok(value.includes('Columnas:'), 'Debe incluir un resumen de columnas.');
    assert.ok(value.includes('status: char(40)'), 'Debe conservar tipos con paréntesis balanceados en el resumen de columnas.');
    assert.ok(value.includes('Bandas:'), 'Debe incluir un resumen de bandas principales.');
  });

  test('provideHover resuelve Describe(DataWindow.Table.Select) usando el DataObject enlazado', () => {
    setupAnalyzedDocument('file:///d_customer_list.srd', [
      '$PBExportHeader$d_customer_list.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT id, name FROM customer")'
    ].join('\r\n'));
    const doc = setupAnalyzedDocument('file:///w_probe.srw', [
      'global type w_probe from window',
      'end type',
      '',
      'event open();',
      '  dw_customer.DataObject = "d_customer_list"',
      '  dw_customer.Describe("DataWindow.Table.Select")',
      'end event'
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('DataWindow.Table.Select'));
    const hover = provideHover(
      doc,
      Position.create(lineIndex, lines[lineIndex].indexOf('DataWindow.Table.Select') + 2),
      kb,
      catalog,
      graph,
    );

    assert.ok(hover);
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('DataWindow.Table.Select'));
    assert.ok(value.includes('SELECT id, name FROM customer'));
  });

  test('provideHover resuelve SetItemStatus con columna literal y buffer seguro del DataWindow enlazado', () => {
    setupAnalyzedDocument('file:///d_customer_setitemstatus.srd', [
      '$PBExportHeader$d_customer_setitemstatus.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(40) update=yes name=status dbname="customer.status") retrieve="SELECT status FROM customer")'
    ].join('\r\n'));
    const doc = setupAnalyzedDocument('file:///w_setitemstatus_hover.srw', [
      'global type w_setitemstatus_hover from window',
      'end type',
      '',
      'event open();',
      '  dw_customer.DataObject = "d_customer_setitemstatus"',
      '  dw_customer.SetItemStatus(1, "status", Primary!, DataModified!)',
      'end event'
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('SetItemStatus'));
    const hover = provideHover(
      doc,
      Position.create(lineIndex, lines[lineIndex].indexOf('status') + 2),
      kb,
      catalog,
      graph,
    );

    assert.ok(hover);
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('status'));
    assert.ok(value.includes('SetItemStatus'));
    assert.ok(value.includes('Primary!'));
    assert.ok(value.includes('d_customer_setitemstatus'));
  });

  test('provideHover no resuelve columnas DataWindow cuando el DataObject es dinámico', () => {
    setupAnalyzedDocument('file:///d_customer_setitemstatus_dynamic.srd', [
      '$PBExportHeader$d_customer_setitemstatus_dynamic.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(40) update=yes name=status dbname="customer.status") retrieve="SELECT status FROM customer")'
    ].join('\r\n'));
    const doc = setupAnalyzedDocument('file:///w_setitemstatus_dynamic_hover.srw', [
      'global type w_setitemstatus_dynamic_hover from window',
      'end type',
      '',
      'string ls_dataobject',
      'event open();',
      '  ls_dataobject = "d_customer_setitemstatus_dynamic"',
      '  dw_customer.DataObject = ls_dataobject',
      '  dw_customer.SetItemStatus(1, "status", Primary!, DataModified!)',
      'end event'
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('SetItemStatus'));
    const hover = provideHover(
      doc,
      Position.create(lineIndex, lines[lineIndex].indexOf('status') + 2),
      kb,
      catalog,
      graph,
    );

    assert.equal(hover, null);
  });

  test('provideHover resuelve rutas anidadas de report child hacia Table.Select', () => {
    setupAnalyzedDocument('file:///d_parent.srd', [
      '$PBExportHeader$d_parent.srd',
      'release 39;',
      'datawindow(units=0)',
      'report(name=rpt_orders dataobject="d_orders")'
    ].join('\r\n'));
    setupAnalyzedDocument('file:///d_orders.srd', [
      '$PBExportHeader$d_orders.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT order_id, order_status FROM orders")'
    ].join('\r\n'));
    const doc = setupAnalyzedDocument('file:///w_report_hover.srw', [
      'global type w_report_hover from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent"',
      '  dw_parent.Describe("rpt_orders.DataWindow.Table.Select")',
      'end event'
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('rpt_orders.DataWindow.Table.Select'));
    const hover = provideHover(
      doc,
      Position.create(lineIndex, lines[lineIndex].indexOf('rpt_orders.DataWindow.Table.Select') + 2),
      kb,
      catalog,
      graph,
    );

    assert.ok(hover);
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('rpt_orders.DataWindow.Table.Select'));
    assert.ok(value.includes('SELECT order_id, order_status FROM orders'));
    assert.ok(value.includes('Ruta: `rpt_orders`'));
  });

  test('provideHover resuelve rutas anidadas de report child hacia dddw.name', () => {
    setupAnalyzedDocument('file:///d_parent_report_dddw_hover.srd', [
      '$PBExportHeader$d_parent_report_dddw_hover.srd',
      'release 39;',
      'datawindow(units=0)',
      'report(name=rpt_orders dataobject="d_orders_report_dddw_hover")'
    ].join('\r\n'));
    setupAnalyzedDocument('file:///d_orders_report_dddw_hover.srd', [
      '$PBExportHeader$d_orders_report_dddw_hover.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(column=(type=char(10) update=yes name=status_id dbname="sales.status_id" dddw.name="d_status_report_dddw_hover") retrieve="SELECT status_id FROM orders")'
    ].join('\r\n'));
    setupAnalyzedDocument('file:///d_status_report_dddw_hover.srd', [
      '$PBExportHeader$d_status_report_dddw_hover.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT status_id, status_name FROM status")'
    ].join('\r\n'));
    const doc = setupAnalyzedDocument('file:///w_report_dddw_hover.srw', [
      'global type w_report_dddw_hover from window',
      'end type',
      '',
      'event open();',
      '  dw_parent.DataObject = "d_parent_report_dddw_hover"',
      '  dw_parent.Describe("rpt_orders.status_id.dddw.name")',
      'end event'
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('rpt_orders.status_id.dddw.name'));
    const hover = provideHover(
      doc,
      Position.create(lineIndex, lines[lineIndex].indexOf('rpt_orders.status_id.dddw.name') + 2),
      kb,
      catalog,
      graph,
    );

    assert.ok(hover);
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('rpt_orders.status_id.dddw.name'));
    assert.ok(value.includes('d_status_report_dddw_hover'));
    assert.ok(value.includes('Ruta: `rpt_orders > status_id`'));
  });

  test('provideHover resuelve dw_customer.Object.DataWindow.Table.Select usando el DataObject enlazado', () => {
    setupAnalyzedDocument('file:///d_customer_object.srd', [
      '$PBExportHeader$d_customer_object.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="SELECT id FROM customer")'
    ].join('\r\n'));
    const doc = setupAnalyzedDocument('file:///w_object_hover.srw', [
      'global type w_object_hover from window',
      'end type',
      '',
      'event open();',
      '  dw_customer.DataObject = "d_customer_object"',
      '  dw_customer.Object.DataWindow.Table.Select',
      'end event'
    ].join('\r\n'));

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('Object.DataWindow.Table.Select'));
    const hover = provideHover(
      doc,
      Position.create(lineIndex, lines[lineIndex].indexOf('DataWindow.Table.Select') + 2),
      kb,
      catalog,
      graph,
    );

    assert.ok(hover);
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('DataWindow.Table.Select'));
    assert.ok(value.includes('SELECT id FROM customer'));
  });

  test('provideHover explica constructor como hook lifecycle disparado desde create', () => {
    const doc = setupAnalyzedDocument('file:///w_lifecycle_hover.sru', `
global type w_lifecycle_hover from window
end type

on w_lifecycle_hover.create
  call super::create
  TriggerEvent(this, "constructor")
end on

event constructor;
end event
    `);

    const lines = doc.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('TriggerEvent(this, "constructor")'));
    const hover = provideHover(doc, Position.create(lineIndex, 23), kb, catalog, graph);

    assert.ok(hover, 'Hover no debería ser null para el hook constructor literal.');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('**Lifecycle**'), 'Debe añadir un bloque lifecycle al hover.');
    assert.ok(value.includes('Disparado desde: create'), 'Debe explicar que constructor se dispara desde create.');
    assert.ok(value.includes('call super::create: sí'), 'Debe proyectar el ancestor call del flujo create.');
  });

  test('provideHover expone hover seguro dentro de un .srd para retrieve y bandas', () => {
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

    const bandHover = provideHover(document, Position.create(3, 2), kb, catalog, graph);
    const retrieveHover = provideHover(document, Position.create(7, 15), kb, catalog, graph);

    assert.ok(bandHover, 'Hover no debería ser null para banda DataWindow.');
    assert.ok(retrieveHover, 'Hover no debería ser null para retrieve DataWindow.');
    assert.ok(((bandHover?.contents as any).value as string).includes('Banda DataWindow'));
    assert.ok(((retrieveHover?.contents as any).value as string).includes('SQL segura de DataWindow'));
  });
});