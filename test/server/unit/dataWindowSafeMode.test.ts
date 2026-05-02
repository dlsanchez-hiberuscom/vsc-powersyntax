import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { summarizeDataWindowSafeMode } from '../../../src/server/features/dataWindowSafeMode';

suite('unit/dataWindowSafeMode (B117)', () => {
  test('resume SQL base, args, columnas y bandas principales de un .srd', () => {
    const document = TextDocument.create(
      'file:///d_sales_orders.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_sales_orders.srd',
        'release 39;',
        'datawindow(units=0)',
        'header(height=88 color=67108864)',
        'detail(height=68 color=67108864)',
        'footer(height=0 color=67108864)',
        'table(column=(type=long update=yes name=id dbname="sales_order.id")',
        ' column=(type=char(40) update=yes name=status dbname="sales_order.status")',
        ' column=(type=decimal(18,2) update=no name=amount dbname="sales_order.amount")',
        ' retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) )" arguments=(("custarg", number)) )'
      ].join('\r\n')
    );

    const analysis = analyzeDocument(document);
    const summary = summarizeDataWindowSafeMode(analysis.snapshot);

    assert.ok(summary, 'El safe mode no debería ser null para un .srd válido.');
    assert.ok(summary?.retrieve?.includes('PBSELECT('));
    assert.equal(summary?.retrieveArguments[0]?.name, 'custarg');
    assert.equal(summary?.columns[0]?.name, 'id');
    assert.equal(summary?.columns[1]?.type, 'char(40)');
    assert.equal(summary?.columns[2]?.type, 'decimal(18,2)');
    assert.deepEqual(summary?.bands, ['header', 'detail', 'footer']);
  });
});