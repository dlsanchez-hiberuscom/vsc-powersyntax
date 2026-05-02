import * as assert from 'assert/strict';
import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { provideHover } from '../../../src/server/features/hover';
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
    assert.ok(value.includes('*Origen:* system'), 'Debe incluir lineage de sistema');
    assert.ok(value.includes('*Confianza:* direct'), 'Debe incluir confianza derivada');
  });

  test('provideHover devuelve Markdown de KnowledgeBase para función de usuario', () => {
    const doc = TextDocument.create('file:///test.sru', 'powerbuilder', 1, '  of_SetData()  ');
    
    // Position sobre of_SetData
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);
    
    assert.ok(hover, 'Hover no debería ser null');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('of_SetData'), 'Debe contener el nombre de la función');
    assert.ok(value.includes('*Origen:* document'), 'Debe exponer lineage del símbolo de usuario');
    assert.ok(value.includes('*Confianza:* direct'), 'Debe indicar confianza directa');
    assert.ok(value.includes('*Confianza de resolución:* low'), 'Debe proyectar la confidence general de resolución');
    assert.ok(value.includes('*Motivo de resolución:* global-fallback'), 'Debe proyectar el reason code principal');
    assert.ok(value.includes('*Candidatos ganadores:* 1'), 'Debe proyectar la cardinalidad del winner path');
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

  test('provideHover anota la ambiguedad cuando existen varios ganadores minimos', () => {
    const doc = TextDocument.create('file:///w_ambiguous.sru', 'powerbuilder', 1, '  of_Ambiguous()  ');
    const hover = provideHover(doc, Position.create(0, 5), kb, catalog, graph);

    assert.ok(hover, 'Hover ambiguo no debería ser null');
    const value = (hover?.contents as any).value as string;
    assert.ok(value.includes('*Resolución ambigua:* 2 candidatos con distancia mínima'), 'Debe indicar la ambigüedad del winner path');
    assert.ok(value.includes('*Candidatos ganadores:* 2'), 'Debe proyectar la cardinalidad del winner path ambiguo');
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

  test('provideHover explica un DataObject literal resoluble hacia un .srd indexado', () => {
    setupAnalyzedDocument('file:///d_customer.srd', [
      '$PBExportHeader$d_customer.srd',
      'release 39;',
      'datawindow(units=0)',
      'header(height=88 color=67108864)',
      'detail(height=68 color=67108864)',
      'table(column=(type=long update=yes name=id dbname="customer.id") retrieve="SELECT id FROM customer" arguments=(("custarg", number)) )'
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
    assert.ok(value.includes('*Hereda de:* datawindow'), 'Debe exponer que el target resuelto es un DataWindow.');
    assert.ok(value.includes('**DataWindow Safe Mode**'), 'Debe añadir el bloque de safe mode del .srd.');
    assert.ok(value.includes('SQL base:'), 'Debe incluir el SQL base del DataWindow.');
    assert.ok(value.includes('Columnas:'), 'Debe incluir un resumen de columnas.');
    assert.ok(value.includes('Bandas:'), 'Debe incluir un resumen de bandas principales.');
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