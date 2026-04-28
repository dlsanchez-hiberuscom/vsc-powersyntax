import * as assert from 'assert';
import * as vscode from 'vscode';
import { DefinitionResolver } from '../../powerbuilder/resolution/definitionResolver';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';

function makeDoc(text: string, uriPath: string = 'file:///test/def.sru'): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
    } as unknown as vscode.TextDocument;
}

suite('DefinitionResolver', () => {
    let index: SymbolIndex;
    let resolver: DefinitionResolver;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
        resolver = new DefinitionResolver(index);
    });

    const TEST_URI = vscode.Uri.parse('file:///test/def.sru');

    test('should resolve a known symbol to its location', () => {
        index.indexDocument(makeDoc('global type w_main from window\nend type'));
        const locations = resolver.resolve('w_main', TEST_URI);
        assert.strictEqual(locations.length, 1);
        assert.ok(locations[0].uri.toString().includes('def.sru'));
    });

    test('should return empty for unknown symbol', () => {
        const locations = resolver.resolve('nonexistent', TEST_URI);
        assert.strictEqual(locations.length, 0);
    });

    test('should resolve case-insensitively', () => {
        index.indexDocument(makeDoc('global type W_Main from window\nend type'));
        const locations = resolver.resolve('w_main', TEST_URI);
        assert.strictEqual(locations.length, 1);
    });

    test('should hide ambiguous duplicated definitions from go to definition', () => {
        index.indexDocument(makeDoc('public function integer of_calc ();', 'file:///a.sru'));
        index.indexDocument(makeDoc('public function string of_calc ();', 'file:///b.sru'));
        const locations = resolver.resolve('of_calc', TEST_URI);
        assert.strictEqual(locations.length, 0);
    });
});
