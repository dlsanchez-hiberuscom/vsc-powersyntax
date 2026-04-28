import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import {
    buildDataWindowDocumentSymbols,
    PbDataWindowParser,
} from '../../powerbuilder/datawindow/pbDataWindowParser';

function readFixture(name: string): string {
    return fs.readFileSync(
        path.resolve(__dirname, '../../../src/tests/fixtures', name),
        'utf8',
    );
}

suite('PbDataWindowParser', () => {
    test('parsea bandas, columnas y retrieve de un srd', () => {
        const parser = new PbDataWindowParser();
        const result = parser.parseText(
            vscode.Uri.file('/workspace/sample.srd'),
            readFixture('sample_datawindow.srd'),
        );

        assert.strictEqual(result.metadata.objectName, 'sample');
        assert.deepStrictEqual(result.metadata.bandNames, ['header', 'summary', 'footer', 'detail']);
        assert.deepStrictEqual(result.metadata.tableColumnNames, ['id', 'name', 'email', 'balance']);
        assert.strictEqual(result.metadata.textCount, 4);
        assert.strictEqual(result.metadata.displayColumnCount, 4);
        assert.ok(result.metadata.retrieveStatement?.includes('FROM customer'));
    });

    test('genera un árbol de document symbols específico de DataWindow', () => {
        const parser = new PbDataWindowParser();
        const result = parser.parseText(
            vscode.Uri.file('/workspace/sample.srd'),
            readFixture('sample_datawindow.srd'),
        );
        const symbols = buildDataWindowDocumentSymbols(result);

        assert.strictEqual(symbols.length, 1);
        assert.strictEqual(symbols[0].name, 'sample');

        const childNames = symbols[0].children.map(child => child.name);
        assert.ok(childNames.includes('header'));
        assert.ok(childNames.includes('detail'));
        assert.ok(childNames.includes('table'));

        const table = symbols[0].children.find(child => child.name === 'table');
        assert.ok(table);
        assert.deepStrictEqual(
            table?.children
                .filter(child => child.name !== 'retrieve')
                .map(child => child.name),
            ['id', 'name', 'email', 'balance'],
        );

        const idColumn = table?.children.find(child => child.name === 'id');
        const retrieve = table?.children.find(child => child.name === 'retrieve');

        assert.ok(idColumn);
        assert.ok(retrieve);
        assert.strictEqual(idColumn?.selectionRange.start.line, 7);
        assert.strictEqual(retrieve?.selectionRange.start.line, 11);
    });
});