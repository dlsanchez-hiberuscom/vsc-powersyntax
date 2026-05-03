import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { buildDataWindowModel } from '../../../src/server/features/dataWindowModel';

suite('unit/dataWindowModel (B287)', () => {
  test('extrae retrieve y retrieveArguments desde el modelo canónico con comillas escapadas de DataWindow', () => {
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
        'table(column=(type=long update=yes name=id dbname="sales_order.id")',
        ' column=(type=decimal(18,2) update=no name=amount dbname="sales_order.amount")',
        ' retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) )" arguments=(("custarg", number)) )'
      ].join('\r\n')
    );

    const model = buildDataWindowModel(document);

    assert.ok(model, 'El modelo canónico no debería ser null para un .srd válido.');
    assert.ok(model?.retrieve?.statement.includes('TABLE(NAME="sales_order" )'));
    assert.equal(model?.retrieveArguments[0]?.name, 'custarg');
    assert.equal(model?.retrieveArguments[0]?.type, 'number');
    assert.equal(model?.retrieveArguments[0]?.label, 'number custarg');
    assert.equal(model?.tableColumns[1]?.type, 'decimal(18,2)');
    assert.deepEqual(model?.bands.map((band) => band.name), ['header', 'detail']);
    assert.deepEqual(model?.tableColumns.map((column) => column.name), ['id', 'amount']);
  });

  test('B288 extrae referencias SQL seguras con aliases, join simple y where básico', () => {
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

    const model = buildDataWindowModel(document);

    assert.ok(model);
    assert.deepEqual(
      model?.sqlReferences.map((entry) => ({ rawText: entry.rawText, qualifiedTableName: entry.qualifiedTableName, columnName: entry.columnName })),
      [
        { rawText: 'c.customer_id', qualifiedTableName: 'customer', columnName: 'customer_id' },
        { rawText: 'o.status', qualifiedTableName: 'orders', columnName: 'status' },
        { rawText: 'o.customer_id', qualifiedTableName: 'orders', columnName: 'customer_id' },
        { rawText: 'c.customer_id', qualifiedTableName: 'customer', columnName: 'customer_id' },
        { rawText: 'o.status', qualifiedTableName: 'orders', columnName: 'status' },
        { rawText: 'c.deleted', qualifiedTableName: 'customer', columnName: 'deleted' },
      ]
    );
  });

  test('B288 degrada where complejo con subquery sin inventar referencias inseguras', () => {
    const document = TextDocument.create(
      'file:///d_customer_orders_complex.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_customer_orders_complex.srd',
        'release 39;',
        'datawindow(units=0)',
        'table(retrieve="SELECT o.status FROM orders o WHERE EXISTS (SELECT 1 FROM audit a WHERE a.order_id = o.order_id)")'
      ].join('\r\n')
    );

    const model = buildDataWindowModel(document);

    assert.ok(model);
    assert.deepEqual(
      model?.sqlReferences.map((entry) => ({ rawText: entry.rawText, qualifiedTableName: entry.qualifiedTableName, columnName: entry.columnName })),
      [
        { rawText: 'o.status', qualifiedTableName: 'orders', columnName: 'status' },
      ]
    );
  });

  test('B289 modela expresiones DataWindow y dependencias seguras sin evaluarlas', () => {
    const document = TextDocument.create(
      'file:///d_expression_metadata.srd',
      'powerbuilder',
      1,
      [
        '$PBExportHeader$d_expression_metadata.srd',
        'release 39;',
        'datawindow(units=0)',
        'table(column=(type=char(1) update=yes name=show_ribbon dbname="emp.show_ribbon")',
        ' column=(type=decimal(18,2) update=yes name=adjusted_hours dbname="emp.adjusted_hours")',
        ' column=(type=decimal(18,2) update=yes name=rate dbname="emp.rate") retrieve="SELECT show_ribbon, adjusted_hours, rate FROM emp")',
        'column(band=detail id=1 name=ribbon_app visible="0~tif(show_ribbon = ~"Y~", 1, 0)")',
        'compute(band=detail name=cc_total expression="adjusted_hours * rate")',
        'text(band=detail name=t_status visible="1~tif(cc_total > 0, 1, 0)")'
      ].join('\r\n')
    );

    const model = buildDataWindowModel(document);

    assert.ok(model);
    assert.deepEqual(model?.controls.map((control) => control.name), ['ribbon_app', 'cc_total', 't_status']);
    assert.deepEqual(
      model?.expressions.map((expression) => ({
        name: expression.name,
        propertyName: expression.propertyName,
        staticValue: expression.staticValue,
        expressionText: expression.expressionText,
        dependencies: expression.dependencies,
      })),
      [
        {
          name: 'ribbon_app.visible',
          propertyName: 'visible',
          staticValue: '0',
          expressionText: 'if(show_ribbon = "Y", 1, 0)',
          dependencies: [{ name: 'show_ribbon', kind: 'table-column' }],
        },
        {
          name: 'cc_total.expression',
          propertyName: 'expression',
          staticValue: undefined,
          expressionText: 'adjusted_hours * rate',
          dependencies: [
            { name: 'adjusted_hours', kind: 'table-column' },
            { name: 'rate', kind: 'table-column' },
          ],
        },
        {
          name: 't_status.visible',
          propertyName: 'visible',
          staticValue: '1',
          expressionText: 'if(cc_total > 0, 1, 0)',
          dependencies: [{ name: 'cc_total', kind: 'control' }],
        },
      ]
    );
  });
});