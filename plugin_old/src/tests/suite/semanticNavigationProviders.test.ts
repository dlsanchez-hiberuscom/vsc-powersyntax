import * as assert from 'assert';
import * as vscode from 'vscode';
import { getSymbolContextAtPosition } from '../../powerbuilder/document/documentUtils';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { SemanticQueryService } from '../../powerbuilder/semantic';

function makeDoc(text: string, uriPath: string = 'file:///test/navigation-split.sru'): vscode.TextDocument {
    const lines = text.split(/\r?\n/);

    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
        positionAt(offset: number) {
            const normalizedOffset = Math.max(0, Math.min(offset, text.length));
            const prefix = text.slice(0, normalizedOffset);
            const line = prefix.split(/\r?\n/).length - 1;
            const lastBreak = Math.max(prefix.lastIndexOf('\n'), prefix.lastIndexOf('\r'));

            return new vscode.Position(line, normalizedOffset - (lastBreak + 1));
        },
    } as unknown as vscode.TextDocument;
}

function getTextPosition(document: vscode.TextDocument, searchText: string): vscode.Position {
    const offset = document.getText().indexOf(searchText);

    assert.ok(offset >= 0, `Expected text ${searchText} in test document`);

    return document.positionAt(offset + 2);
}

suite('SemanticNavigationProviders', () => {
    let index: SymbolIndex;
    let semanticQueries: SemanticQueryService;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
        semanticQueries = new SemanticQueryService(index);
    });

    test('resolveDeclaration prefiere el prototype cuando existe frente a la implementation', () => {
        const document = makeDoc([
            'forward',
            'global type n_service from nonvisualobject',
            'end type',
            'end forward',
            '',
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'forward prototypes',
            'public function long of_run ()',
            'end prototypes',
            '',
            'public function long of_run ();',
            'return 1',
            'end function',
            '',
            'event open;',
            'this.of_run()',
            'end event',
        ].join('\n'));

        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, getTextPosition(document, 'of_run()'));

        assert.ok(context, 'Expected semantic context on call-site');

        const prototypeStart = document.positionAt(document.getText().indexOf('public function long of_run ()'));
        const result = semanticQueries.resolveDeclaration({
            word: context!.word,
            uri: document.uri,
            symbolContext: context!,
        });

        assert.strictEqual(result.locations.length, 1);
        assert.strictEqual(result.locations[0].range.start.line, prototypeStart.line);
    });

    test('resolveImplementations cae al cuerpo ejecutable y no publica externas sin body', () => {
        const document = makeDoc([
            'forward',
            'global type n_service from nonvisualobject',
            'end type',
            'end forward',
            '',
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'forward prototypes',
            'public function long of_run ()',
            'end prototypes',
            '',
            'public function long of_run ();',
            'return 1',
            'end function',
            '',
            'event open;',
            'this.of_run()',
            'end event',
            '',
            'FUNCTION long MessageBeep(uint type) LIBRARY "user32.dll" ALIAS FOR "MessageBeep"',
        ].join('\n'));

        index.indexDocument(document);

        const callContext = getSymbolContextAtPosition(document, getTextPosition(document, 'of_run()'));

        assert.ok(callContext, 'Expected semantic context on implementation call-site');

        const implementationStart = document.positionAt(document.getText().indexOf('public function long of_run ();'));
        const implementationResult = semanticQueries.resolveImplementations({
            word: callContext!.word,
            uri: document.uri,
            symbolContext: callContext!,
        });

        assert.strictEqual(implementationResult.locations.length, 1);
        assert.strictEqual(implementationResult.locations[0].range.start.line, implementationStart.line);

        const externalContext = getSymbolContextAtPosition(document, getTextPosition(document, 'MessageBeep'));

        assert.ok(externalContext, 'Expected semantic context on external declaration');
        assert.strictEqual(
            semanticQueries.resolveImplementations({
                word: externalContext!.word,
                uri: document.uri,
                symbolContext: externalContext!,
            }).locations.length,
            0,
        );
    });

    test('resolveImplementations expande overrides heredados desde la declaracion base', () => {
        const baseUri = vscode.Uri.parse('file:///test/w_base.srw');
        const childUri = vscode.Uri.parse('file:///test/w_child.srw');
        const baseText = [
            'global type w_base from window',
            'end type',
            'global w_base w_base',
            '',
            'public function long of_ping ();',
            'return 1',
            'end function',
        ].join('\n');
        const childText = [
            'global type w_child from w_base',
            'end type',
            'global w_child w_child',
            '',
            'public function long of_ping ();',
            'return 2',
            'end function',
            '',
            'event open;',
            'this.of_ping()',
            'end event',
        ].join('\n');
        const baseDocument = makeDoc(baseText, baseUri.toString());

        index.indexFromUri(baseUri, baseText);
        index.indexFromUri(childUri, childText);

        const context = getSymbolContextAtPosition(baseDocument, getTextPosition(baseDocument, 'of_ping ();'));

        assert.ok(context, 'Expected semantic context on base declaration');

        const result = semanticQueries.resolveImplementations({
            word: context!.word,
            uri: baseUri,
            symbolContext: context!,
        });

        assert.strictEqual(result.precision, 'compatible');
        assert.deepStrictEqual(
            result.locations.map(location => `${location.uri.toString()}:${location.range.start.line}`).sort(),
            [
                `${baseUri.toString()}:4`,
                `${childUri.toString()}:4`,
            ],
        );
    });
});