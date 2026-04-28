import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildPowerScriptDocumentModel } from '../../powerbuilder/document/powerScriptDocumentModel';

function makeDoc(text: string): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscode.Uri.parse('file:///test/document-model.sru'),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
    } as unknown as vscode.TextDocument;
}

suite('PowerScriptDocumentModel', () => {
    test('une continuaciones sin inyectar espacios artificiales dentro de strings', () => {
        const doc = makeDoc([
            'IF Employee_District = "Eastern United States and&',
            'Eastern Canada" THEN Return True',
        ].join('\n'));

        const model = buildPowerScriptDocumentModel(doc);

        assert.strictEqual(model.statements.length, 1);
        assert.ok(model.statements[0].text.includes('andEastern Canada'));
        assert.ok(!model.statements[0].text.includes('and Eastern Canada'));
    });

    test('mantiene // dentro de strings continuados al construir statements lógicos', () => {
        const doc = makeDoc([
            'string ls = "alpha&',
            '//beta" // trailing comment',
        ].join('\n'));

        const model = buildPowerScriptDocumentModel(doc);

        assert.strictEqual(model.statements.length, 1);
        assert.ok(model.statements[0].text.includes('"alpha//beta"'));
        assert.ok(!model.statements[0].text.includes('trailing comment'));
    });

    test('une continuaciones en llamadas Close(...) aunque empiecen por keyword SQL ambigua', () => {
        const doc = makeDoc([
            'Close( &',
            '   This )',
        ].join('\n'));

        const model = buildPowerScriptDocumentModel(doc);
        const normalized = model.statements[0].text.replace(/\s+/g, ' ');

        assert.strictEqual(model.statements.length, 1);
        assert.ok(normalized.includes('Close( This )'));
    });
});