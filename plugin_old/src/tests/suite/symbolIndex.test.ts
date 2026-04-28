import * as assert from 'assert';
import * as vscode from 'vscode';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';

function makeDoc(text: string, uriPath: string = 'file:///test/test.sru'): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
    } as unknown as vscode.TextDocument;
}

suite('SymbolIndex', () => {
    let index: SymbolIndex;

    setup(() => {
        // Reset singleton for test isolation
        index = SymbolIndex.getInstance();
        index.clear();
    });

    test('should be a singleton', () => {
        const a = SymbolIndex.getInstance();
        const b = SymbolIndex.getInstance();
        assert.strictEqual(a, b);
    });

    test('should index a document and retrieve symbols', () => {
        const doc = makeDoc('global type w_test from window\nend type');
        const symbols = index.indexDocument(doc);
        assert.ok(symbols.length > 0);
        assert.strictEqual(index.symbolCount, symbols.length);
        assert.strictEqual(index.fileCount, 1);
    });

    test('should retrieve symbols by file URI', () => {
        const doc = makeDoc('global type w_test from window\nend type', 'file:///a.sru');
        index.indexDocument(doc);
        const syms = index.getSymbolsForFile(vscode.Uri.parse('file:///a.sru'));
        assert.strictEqual(syms.length, 1);
        assert.strictEqual(syms[0].name, 'w_test');
    });

    test('should return empty array for unknown file', () => {
        const syms = index.getSymbolsForFile(vscode.Uri.parse('file:///unknown.sru'));
        assert.strictEqual(syms.length, 0);
    });

    test('should find symbol by exact name (case insensitive)', () => {
        const doc = makeDoc('public function integer of_calc ();');
        index.indexDocument(doc);
        const results = index.findSymbolByName('OF_CALC');
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].name, 'of_calc');
    });

    test('should search symbols by partial name', () => {
        const doc = makeDoc([
            'public function integer of_calculate ();',
            'public function string of_format ();',
        ].join('\n'));
        index.indexDocument(doc);
        const results = index.searchSymbols('calc');
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].name, 'of_calculate');
    });

    test('should remove file from index', () => {
        const uri = vscode.Uri.parse('file:///removable.sru');
        const doc = makeDoc('global type w_remove from window\nend type', uri.toString());
        index.indexDocument(doc);
        assert.strictEqual(index.fileCount, 1);
        index.removeFile(uri);
        assert.strictEqual(index.fileCount, 0);
        assert.strictEqual(index.symbolCount, 0);
    });

    test('should clear all entries', () => {
        index.indexDocument(makeDoc('global type w_a from window\nend type', 'file:///a.sru'));
        index.indexDocument(makeDoc('global type w_b from window\nend type', 'file:///b.sru'));
        assert.strictEqual(index.fileCount, 2);
        index.clear();
        assert.strictEqual(index.fileCount, 0);
        assert.strictEqual(index.symbolCount, 0);
    });

    test('should reindex same file (overwrite)', () => {
        const uri = 'file:///reindex.sru';
        index.indexDocument(makeDoc('global type w_old from window\nend type', uri));
        assert.strictEqual(index.findSymbolByName('w_old').length, 1);

        index.indexDocument(makeDoc('global type w_new from window\nend type', uri));
        assert.strictEqual(index.findSymbolByName('w_old').length, 0);
        assert.strictEqual(index.findSymbolByName('w_new').length, 1);
        assert.strictEqual(index.fileCount, 1);
    });

    test('should get all symbols across multiple files', () => {
        index.indexDocument(makeDoc('global type w_a from window\nend type', 'file:///a.sru'));
        index.indexDocument(makeDoc('global type w_b from window\nend type', 'file:///b.sru'));
        const all = index.getAllSymbols();
        assert.strictEqual(all.length, 2);
    });

    test('indexFromUri should work with raw text', () => {
        const uri = vscode.Uri.parse('file:///raw.sru');
        const symbols = index.indexFromUri(uri, 'public function integer of_raw ();');
        assert.ok(symbols.length > 0);
        assert.strictEqual(symbols[0].name, 'of_raw');
    });
});
