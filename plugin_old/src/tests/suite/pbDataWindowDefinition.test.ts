import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { provideDataWindowDefinition } from '../../powerbuilder/datawindow/pbDataWindowDefinition';

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

function getPositionAfterText(
    document: vscode.TextDocument,
    searchText: string,
    occurrence: number = 1,
): vscode.Position {
    const text = document.getText();
    let fromIndex = 0;
    let matchIndex = -1;

    for (let currentOccurrence = 0; currentOccurrence < occurrence; currentOccurrence++) {
        matchIndex = text.indexOf(searchText, fromIndex);
        assert.ok(matchIndex >= 0, `Expected to find occurrence ${occurrence} of ${searchText}`);
        fromIndex = matchIndex + searchText.length;
    }

    return document.positionAt(matchIndex + Math.floor(searchText.length / 2));
}

suite('PbDataWindowDefinition', () => {
    test('navega una columna simple del retrieve a su table-column local', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const retrieveLine = 11;
        const retrieveLineText = document.lineAt(retrieveLine).text;
        const nameOffset = retrieveLineText.indexOf('name, email');

        assert.ok(nameOffset >= 0, 'Expected retrieve name token in fixture');
        const definitions = provideDataWindowDefinition(
            document,
            new vscode.Position(retrieveLine, nameOffset + 1),
        );

        assert.ok(definitions);
        assert.strictEqual(definitions?.length, 1);
        assert.strictEqual(definitions?.[0].range.start.line, 8);
        assert.ok(document.lineAt(definitions?.[0].range.start.line ?? 0).text.includes('name=name'));
    });

    test('navega un uso de band=detail a la declaración local de la banda', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const definitions = provideDataWindowDefinition(
            document,
            getPositionAfterText(document, 'band=detail'),
        );

        assert.ok(definitions);
        assert.strictEqual(definitions?.length, 1);
        assert.strictEqual(definitions?.[0].range.start.line, 6);
        assert.strictEqual(document.lineAt(definitions?.[0].range.start.line ?? 0).text.trim(), 'detail(height=76 color=67108864)');
    });

    test('no inventa navegación para metadata que no tiene destino local dedicado', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const definitions = provideDataWindowDefinition(
            document,
            getPositionAfterText(document, 'customer.id'),
        );

        assert.strictEqual(definitions, undefined);
    });
});