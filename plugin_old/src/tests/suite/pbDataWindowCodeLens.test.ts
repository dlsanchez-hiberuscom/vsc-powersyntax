import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { provideDataWindowCodeLenses } from '../../powerbuilder/datawindow/pbDataWindowCodeLens';

function readFixture(name: string): string {
    return fs.readFileSync(
        path.resolve(__dirname, '../../../src/tests/fixtures', name),
        'utf8',
    );
}

function makeDoc(text: string, uriPath: string = 'file:///test/sample.srd'): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    const lineOffsets: number[] = [];
    let runningOffset = 0;

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        lineOffsets.push(runningOffset);
        runningOffset += line.length;

        if (index >= lines.length - 1) {
            continue;
        }

        if (text.slice(runningOffset, runningOffset + 2) === '\r\n') {
            runningOffset += 2;
            continue;
        }

        if (text[runningOffset] === '\n') {
            runningOffset += 1;
        }
    }

    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
        positionAt: (offset: number) => {
            const normalizedOffset = Math.max(0, Math.min(offset, text.length));
            const prefix = text.slice(0, normalizedOffset);
            const parts = prefix.split(/\r?\n/);

            return new vscode.Position(
                parts.length - 1,
                parts[parts.length - 1].length,
            );
        },
        offsetAt: (position: vscode.Position) => {
            const line = Math.max(0, Math.min(position.line, lines.length - 1));
            const character = Math.max(0, Math.min(position.character, (lines[line] || '').length));
            return lineOffsets[line] + character;
        },
    } as unknown as vscode.TextDocument;
}

suite('PbDataWindowCodeLens', () => {
    test('expone lentes locales verificables para retrieve y columnas enlazadas', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const lenses = provideDataWindowCodeLenses(document);
        const titles = lenses.map(lens => lens.command?.title ?? '');

        assert.ok(titles.includes('Retrieve SQL: 4 enlazadas'));
        assert.ok(titles.includes('4 columnas tabla · 4 visuales'));
        assert.strictEqual(
            titles.filter(title => title === 'Usada en retrieve SQL').length,
            4,
        );
        assert.ok(
            lenses.every(lens => lens.command?.command === 'powerbuilder.showObjectInfo'),
            'Expected DataWindow CodeLens to stay on the local object-info command',
        );
    });

    test('resume pendientes cuando el retrieve referencia columnas no publicadas en table(column)', () => {
        const document = makeDoc(
            readFixture('sample_datawindow.srd').replace(
                'SELECT id, name, email, balance FROM customer ORDER BY name',
                'SELECT id, ghost_balance, email, balance FROM customer ORDER BY name',
            ),
        );
        const lenses = provideDataWindowCodeLenses(document);
        const retrieveLens = lenses.find(lens => lens.command?.title.includes('Retrieve SQL:'));

        assert.ok(retrieveLens);
        assert.strictEqual(retrieveLens?.command?.title, 'Retrieve SQL: 3 enlazadas · 1 pendientes');
    });
});