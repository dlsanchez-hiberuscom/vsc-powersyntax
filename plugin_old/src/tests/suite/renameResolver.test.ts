import * as assert from 'assert';
import * as vscode from 'vscode';
import { RenameResolver } from '../../powerbuilder/resolution/renameResolver';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';

function makeDoc(text: string, uriPath: string = 'file:///test/rename.sru'): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
    } as unknown as vscode.TextDocument;
}

suite('RenameResolver', () => {
    let index: SymbolIndex;
    let resolver: RenameResolver;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
        resolver = new RenameResolver(index);
    });

    const TEST_URI = vscode.Uri.parse('file:///test/rename.sru');

    test('canRename returns true for indexed symbol', () => {
        index.indexDocument(makeDoc('global type w_main from window\nend type'));
        assert.strictEqual(resolver.canRename('w_main', TEST_URI), true);
    });

    test('canRename returns false for unknown symbol', () => {
        assert.strictEqual(resolver.canRename('nonexistent', TEST_URI), false);
    });

    test('canRename is case-insensitive', () => {
        index.indexDocument(makeDoc('global type W_Main from window\nend type'));
        assert.strictEqual(resolver.canRename('w_main', TEST_URI), true);
    });
});
