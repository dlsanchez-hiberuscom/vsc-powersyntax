import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { analyzeDataWindowDiagnostics } from '../../powerbuilder/datawindow/pbDataWindowDiagnostics';

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

    for (const line of lines) {
        lineOffsets.push(runningOffset);
        runningOffset += line.length + 1;
    }

    const offsetAt = (position: vscode.Position): number => {
        const line = Math.max(0, Math.min(position.line, lines.length - 1));
        const character = Math.max(0, Math.min(position.character, (lines[line] || '').length));
        return lineOffsets[line] + character;
    };

    return {
        uri: vscode.Uri.parse(uriPath),
        getText: (range?: vscode.Range) => {
            if (!range) {
                return text;
            }

            return text.slice(offsetAt(range.start), offsetAt(range.end));
        },
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
        offsetAt,
    } as unknown as vscode.TextDocument;
}

suite('PbDataWindowDiagnostics', () => {
    test('no publica incidencias cuando el retrieve solo usa columnas declaradas', () => {
        const document = makeDoc(readFixture('sample_datawindow.srd'));
        const diagnostics = analyzeDataWindowDiagnostics(document);

        assert.strictEqual(diagnostics.length, 0);
    });

    test('publica una inconsistencia clara cuando el retrieve usa una columna no declarada', () => {
        const document = makeDoc(
            readFixture('sample_datawindow.srd').replace(
                'SELECT id, name, email, balance FROM customer ORDER BY name',
                'SELECT id, ghost_balance, email, balance FROM customer ORDER BY name',
            ),
        );
        const diagnostics = analyzeDataWindowDiagnostics(document);
        const unknownColumn = diagnostics.find(diagnostic => diagnostic.code === 'pb-datawindow-sql-unknown-column');

        assert.ok(unknownColumn, 'Expected a DataWindow SQL column diagnostic');
        assert.ok(unknownColumn!.message.includes('ghost_balance'));
        assert.strictEqual(unknownColumn!.range.start.line, 11);
    });

    test('degrada con honestidad cuando el SELECT deja de ser simple o demostrable', () => {
        const document = makeDoc(
            readFixture('sample_datawindow.srd').replace(
                'SELECT id, name, email, balance FROM customer ORDER BY name',
                'SELECT count(*), max(balance) AS total_balance FROM customer ORDER BY name',
            ),
        );
        const diagnostics = analyzeDataWindowDiagnostics(document);

        assert.strictEqual(diagnostics.length, 0, 'Complex SELECT expressions should stay out of scope in the conservative v1');
    });
});