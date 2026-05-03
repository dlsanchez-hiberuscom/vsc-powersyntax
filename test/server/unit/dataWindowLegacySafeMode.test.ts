import * as assert from 'assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  buildDataWindowLegacyModel,
  provideDataWindowLegacyDefinition,
  provideDataWindowLegacyHover,
} from '../../../src/server/features/dataWindowLegacySafeMode';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';

suite('unit/dataWindowLegacySafeMode (B139)', () => {
  function createDocument(): TextDocument {
    return TextDocument.create(
      'file:///sample_datawindow.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$sample.srd',
        'release 19;',
        'datawindow(units=0 timer_interval=0 color=67108864 processing=0 print.documentname="" )',
        'header(height=100 color=67108864)',
        'summary(height=0 color=67108864)',
        'footer(height=0 color=67108864)',
        'detail(height=76 color=67108864)',
        'table(column=(type=long update=yes name=id dbname="customer.id")',
        ' column=(type=char(100) update=yes name=name dbname="customer.name")',
        ' retrieve="SELECT id, name FROM customer ORDER BY name" )',
        'text(band=header alignment="0" text="Name" border="0")',
        'column(band=detail id=2 alignment="0" border="0")'
      ].join('\r\n')
    );
  }

  test('construye un modelo estructural seguro con bandas, columnas y retrieve SQL', () => {
    const document = createDocument();
    const model = buildDataWindowLegacyModel(document);

    assert.ok(model);
    assert.equal(model?.objectName, 'sample_datawindow');
    assert.deepEqual(model?.bands.map((entry) => entry.name), ['header', 'summary', 'footer', 'detail']);
    assert.deepEqual(model?.tableColumns.map((entry) => entry.name), ['id', 'name']);
    assert.equal(model?.retrieve?.statement, 'SELECT id, name FROM customer ORDER BY name');
    assert.deepEqual(model?.sqlReferences.map((entry) => entry.columnName), ['id', 'name']);
  });

  test('navega desde una referencia SQL del retrieve a la columna table correspondiente', () => {
    const document = createDocument();
    const definition = provideDataWindowLegacyDefinition(document, Position.create(9, 22));

    assert.ok(definition);
    assert.equal(definition?.uri, document.uri);
    assert.equal(definition?.range.start.line, 8);
  });

  test('expone hover para la banda y para el retrieve del .srd', () => {
    const document = createDocument();
    const bandHover = provideDataWindowLegacyHover(document, Position.create(3, 2));
    const retrieveHover = provideDataWindowLegacyHover(document, Position.create(9, 15));

    assert.ok((bandHover?.contents as any).value.includes('Banda DataWindow'));
    assert.ok((retrieveHover?.contents as any).value.includes('SQL segura de DataWindow'));
    assert.ok((retrieveHover?.contents as any).value.includes('SELECT id, name FROM customer ORDER BY name'));
  });

  test('modela report children y dropdowns avanzados sin mezclar el .srd con PowerScript', () => {
    const document = TextDocument.create(
      'file:///d_parent.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_parent.srd',
        'release 19;',
        'datawindow(units=0)',
        'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states")',
        ' retrieve="SELECT state_id FROM employee")',
        'report(name=rpt_orders dataobject="d_orders")'
      ].join('\r\n')
    );

    const model = buildDataWindowLegacyModel(document);

    assert.equal(model?.tableColumns[0]?.dddwName, 'd_states');
    assert.equal(model?.reports[0]?.name, 'rpt_orders');
    assert.equal(model?.reports[0]?.dataObject, 'd_orders');
  });

  test('navega dddw.name y report(dataobject=...) hacia el child DataWindow enlazado', () => {
    const kb = new KnowledgeBase();
    const parent = TextDocument.create(
      'file:///d_parent.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_parent.srd',
        'release 19;',
        'datawindow(units=0)',
        'table(column=(type=char(10) update=yes name=state_id dbname="emp.state_id" dddw.name="d_states")',
        ' retrieve="SELECT state_id FROM employee")',
        'report(name=rpt_orders dataobject="d_orders")'
      ].join('\r\n')
    );
    const dropdown = TextDocument.create('file:///d_states.srd', 'powerbuilder', 1, '$PBExportHeader$d_states.srd\r\nrelease 19;\r\ndatawindow(units=0)');
    const report = TextDocument.create('file:///d_orders.srd', 'powerbuilder', 1, '$PBExportHeader$d_orders.srd\r\nrelease 19;\r\ndatawindow(units=0)');

    for (const document of [parent, dropdown, report]) {
      const analysis = analyzeDocument(document);
      kb.upsertDocument(document.uri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);
    }

    const lines = parent.getText().split(/\r?\n/);
    const dropdownLine = lines.findIndex((line) => line.includes('d_states'));
    const reportLine = lines.findIndex((line) => line.includes('rpt_orders'));
    const dropdownPosition = Position.create(dropdownLine, lines[dropdownLine].indexOf('d_states') + 1);
    const reportPosition = Position.create(reportLine, lines[reportLine].indexOf('rpt_orders') + 1);

    const dropdownDefinition = provideDataWindowLegacyDefinition(parent, dropdownPosition, kb);
    const reportDefinition = provideDataWindowLegacyDefinition(parent, reportPosition, kb);
    const dropdownHover = provideDataWindowLegacyHover(parent, dropdownPosition);
    const reportHover = provideDataWindowLegacyHover(parent, reportPosition);

    assert.equal(dropdownDefinition?.uri, 'file:///d_states.srd');
    assert.equal(reportDefinition?.uri, 'file:///d_orders.srd');
    assert.ok((dropdownHover?.contents as any).value.includes('Relacion child DataWindow verificada'));
    assert.ok((reportHover?.contents as any).value.includes('Control report DataWindow'));
  });

  test('B288 navega una referencia SQL con alias dentro de where hacia el column= correspondiente', () => {
    const document = TextDocument.create(
      'file:///d_customer_orders.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_customer_orders.srd',
        'release 39;',
        'datawindow(units=0)',
        'table(column=(type=long update=yes name=customer_id dbname="customer.customer_id")',
        ' column=(type=char(10) update=yes name=status dbname="orders.status")',
        ' column=(type=integer update=yes name=deleted dbname="customer.deleted")',
        ' retrieve="SELECT c.customer_id AS customer_id, o.status FROM customer c JOIN orders o ON o.customer_id = c.customer_id WHERE o.status = :status AND c.deleted = 0")'
      ].join('\r\n')
    );

    const lines = document.getText().split(/\r?\n/);
    const lineIndex = lines.findIndex((line) => line.includes('c.deleted'));
    const character = lines[lineIndex].indexOf('c.deleted') + 2;
    const definition = provideDataWindowLegacyDefinition(document, Position.create(lineIndex, character));

    assert.ok(definition);
    assert.equal(definition?.uri, document.uri);
    assert.equal(definition?.range.start.line, 5);
  });
});