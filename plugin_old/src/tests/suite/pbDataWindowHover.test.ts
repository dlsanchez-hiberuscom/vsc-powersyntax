import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { provideDataWindowHover } from '../../powerbuilder/datawindow/pbDataWindowHover';

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

    return document.positionAt(matchIndex + searchText.length - 1);
}

function getHoverText(hover: vscode.Hover | undefined): string {
    if (!hover) {
        return '';
    }

    return hover.contents.map(content => {
        if (content instanceof vscode.MarkdownString) {
            return content.value;
        }

        if (typeof content === 'string') {
            return content;
        }

        return content.value;
    }).join('\n');
}

suite('PbDataWindowHover', () => {
    test('expone hover enlazado para una columna simple del retrieve SQL', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const retrieveLine = 11;
        const retrieveLineText = document.lineAt(retrieveLine).text;
        const nameOffset = retrieveLineText.indexOf('name, email');
        const hover = provideDataWindowHover(
            document,
            new vscode.Position(retrieveLine, nameOffset + 1),
        );
        const hoverText = getHoverText(hover);

        assert.ok(nameOffset >= 0, 'Expected retrieve name token in fixture');
        assert.ok(hover);
        assert.ok(hoverText.includes('**name**'));
        assert.ok(hoverText.includes('Columna SQL del retrieve DataWindow'));
        assert.ok(hoverText.includes('Mapeo remoto: `customer.name`'));
        assert.ok(!hoverText.includes('**retrieve**'));
    });

    test('expone hover seguro para una banda DataWindow', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const hover = provideDataWindowHover(
            document,
            getPositionAfterText(document, 'detail('),
        );
        const hoverText = getHoverText(hover);

        assert.ok(hover);
        assert.ok(hoverText.includes('**detail**'));
        assert.ok(hoverText.includes('Banda DataWindow'));
        assert.ok(hoverText.includes('Altura: `76`'));
    });

    test('expone hover seguro para una columna de tabla y su dbname remoto', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const hover = provideDataWindowHover(
            document,
            getPositionAfterText(document, 'customer.id'),
        );
        const hoverText = getHoverText(hover);

        assert.ok(hover);
        assert.ok(hoverText.includes('**id**'));
        assert.ok(hoverText.includes('Columna de tabla DataWindow'));
        assert.ok(hoverText.includes('Mapeo remoto: `customer.id`'));
        assert.ok(hoverText.includes('Tabla remota: `customer`'));
    });

    test('expone hover seguro para el retrieve SQL', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const hover = provideDataWindowHover(
            document,
            getPositionAfterText(document, 'ORDER BY name'),
        );
        const hoverText = getHoverText(hover);

        assert.ok(hover);
        assert.ok(hoverText.includes('**retrieve**'));
        assert.ok(hoverText.includes('```sql'));
        assert.ok(hoverText.includes('FROM customer ORDER BY name'));
    });

    test('expone hover seguro para un texto DataWindow con metadata local', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const hover = provideDataWindowHover(
            document,
            getPositionAfterText(document, 'Balance'),
        );
        const hoverText = getHoverText(hover);

        assert.ok(hover);
        assert.ok(hoverText.includes('**Balance**'));
        assert.ok(hoverText.includes('Texto DataWindow'));
        assert.ok(hoverText.includes('Banda: `header`'));
        assert.ok(hoverText.includes('Tamaño: `300 x 60`'));
    });

    test('expone hover seguro para una columna visual DataWindow con formato local', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const hover = provideDataWindowHover(
            document,
            getPositionAfterText(document, '###,##0.00'),
        );
        const hoverText = getHoverText(hover);

        assert.ok(hover);
        assert.ok(hoverText.includes('**column#4**'));
        assert.ok(hoverText.includes('Columna visual DataWindow'));
        assert.ok(hoverText.includes('Formato: `###,##0.00`'));
        assert.ok(hoverText.includes('Banda: `detail`'));
    });
});