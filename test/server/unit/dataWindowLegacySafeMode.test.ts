import * as assert from 'assert/strict';

import { Position } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import {
  buildDataWindowLegacyModel,
  provideDataWindowLegacyDefinition,
  provideDataWindowLegacyHover,
} from '../../../src/server/features/dataWindowLegacySafeMode';

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
});