import * as assert from 'assert';
import * as vscode from 'vscode';
import { getSymbolContextAtPosition } from '../../powerbuilder/document/documentUtils';
import { HoverResolver } from '../../powerbuilder/resolution/hoverResolver';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';

function makeDoc(text: string, uriPath: string = 'file:///test/hover.sru'): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscode.Uri.parse(uriPath),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
    } as unknown as vscode.TextDocument;
}

function extractMarkedText(source: string): { text: string; position: vscode.Position } {
    const startMarker = source.indexOf('[[');
    const endMarker = source.indexOf(']]', startMarker + 2);

    assert.ok(startMarker >= 0 && endMarker > startMarker, 'Expected a [[marked]] identifier');

    const markedText = source.slice(startMarker + 2, endMarker);
    const cleanText = source.slice(0, startMarker) + markedText + source.slice(endMarker + 2);
    const prefix = cleanText.slice(0, startMarker);
    const lines = prefix.split(/\r?\n/);

    return {
        text: cleanText,
        position: new vscode.Position(lines.length - 1, lines[lines.length - 1].length),
    };
}

suite('HoverResolver', () => {
    let index: SymbolIndex;
    let resolver: HoverResolver;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
        resolver = new HoverResolver(index);
    });

    const TEST_URI = vscode.Uri.parse('file:///test/hover.sru');

    test('should return hover for built-in function MessageBox', () => {
        const result = resolver.resolve('messagebox', TEST_URI);
        assert.ok(result);
        assert.ok(result.includes('MessageBox'));
    });

    test('should return hover for built-in function IsNull', () => {
        const result = resolver.resolve('isnull', TEST_URI);
        assert.ok(result);
        assert.ok(result.includes('IsNull'));
    });

    test('should return hover for built-in function Trim', () => {
        const result = resolver.resolve('trim', TEST_URI);
        assert.ok(result);
        assert.ok(result.includes('Trim'));
        assert.ok(result.includes('espacios iniciales y finales'));
    });

    test('should return enriched hover for built-in function ProfileString', () => {
        const result = resolver.resolve('profilestring', TEST_URI);
        assert.ok(result);
        assert.ok(result.includes('ProfileString'));
        assert.ok(result.includes('Configuración'));
    });

    test('should return hover for indexed type', () => {
        index.indexDocument(makeDoc('global type w_main from window\nend type'));
        const result = resolver.resolve('w_main', TEST_URI);
        assert.ok(result);
        assert.ok(result.includes('(tipo)'));
        assert.ok(result.includes('w_main'));
    });

    test('should return hover for indexed function', () => {
        index.indexDocument(makeDoc([
            'global type w_main from window',
            'public function integer of_calc ();',
            'end type',
        ].join('\n')));
        const result = resolver.resolve('of_calc', TEST_URI);
        assert.ok(result);
        assert.ok(result.includes('(función)'));
        assert.ok(result.includes('integer'));
    });

    test('should select overloaded indexed function by invocation arity', () => {
        const input = extractMarkedText([
            'global type n_service from nonvisualobject',
            'end type',
            'global n_service n_service',
            '',
            'public function long of_run ();',
            'return 1',
            'end function',
            '',
            'public function long of_run (string as_name);',
            'return len(as_name)',
            'end function',
            '',
            'event open;',
            '[[of_run]]("demo")',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/hover-overload.sru');
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected overload hover context');
        assert.strictEqual(context!.providedArgumentCount, 1);

        const result = resolver.resolve(
            context!.word,
            document.uri,
            context!.range.start,
            context!,
        );

        assert.ok(result);
        assert.ok(result.includes('of_run(string as_name)'));
        assert.ok(!result.includes('of_run()'));
    });

    test('should return hover for indexed event', () => {
        index.indexDocument(makeDoc([
            'global type w_main from window',
            'event open;',
            'end type',
        ].join('\n')));
        const result = resolver.resolve('open', TEST_URI);
        assert.ok(result);
        assert.ok(result.includes('(evento)'));
    });

    test('should return hover for indexed variable', () => {
        index.indexDocument(makeDoc('private integer li_count'));
        const result = resolver.resolve('li_count', TEST_URI);
        assert.ok(result);
        assert.ok(result.includes('(variable)'));
        assert.ok(result.includes('integer'));
    });

    test('should return hover for owner-aware system member', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'singlelineedit sle_name',
            '',
            'event open;',
            'sle_name.[[SetFocus]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/hover-owner-aware.srw');
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected owner-aware hover context');

        const result = resolver.resolve(
            context!.word,
            document.uri,
            context!.range.start,
            context!,
        );

        assert.ok(result);
        assert.ok(result.includes('SetFocus'));
        assert.ok(result.includes('Método integrado de objeto'));
    });

    test('should return hover for owner-aware text editing member', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'singlelineedit sle_name',
            '',
            'event open;',
            'sle_name.[[SelectText]](1, 3)',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/hover-owner-aware-text.srw');
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected owner-aware hover context for text editing method');

        const result = resolver.resolve(
            context!.word,
            document.uri,
            context!.range.start,
            context!,
        );

        assert.ok(result);
        assert.ok(result.includes('SelectText'));
        assert.ok(result.includes('Selecciona un tramo de texto'));
    });

    test('should return hover for owner-aware selection state member', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'singlelineedit sle_name',
            '',
            'event open;',
            'sle_name.[[SelectedText]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/hover-owner-aware-selection.srw');
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected owner-aware hover context for selection state method');

        const result = resolver.resolve(
            context!.word,
            document.uri,
            context!.range.start,
            context!,
        );

        assert.ok(result);
        assert.ok(result.includes('SelectedText'));
        assert.ok(result.includes('texto actualmente seleccionado'));
    });

    test('should return hover for owner-aware multiline text member', () => {
        const input = extractMarkedText([
            'global type w_query from window',
            'end type',
            'global w_query w_query',
            'multilineedit mle_notes',
            '',
            'event open;',
            'mle_notes.[[TextLine]]()',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/hover-owner-aware-multiline.srw');
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected owner-aware hover context for multiline text method');

        const result = resolver.resolve(
            context!.word,
            document.uri,
            context!.range.start,
            context!,
        );

        assert.ok(result);
        assert.ok(result.includes('TextLine'));
        assert.ok(result.includes('texto completo de la línea actual'));
    });

    test('should return undefined for unknown word', () => {
        const result = resolver.resolve('xyznonexistent', TEST_URI);
        assert.strictEqual(result, undefined);
    });

    test('should prioritize built-in over indexed symbol', () => {
        index.indexDocument(makeDoc('public function string trim ();'));
        const result = resolver.resolve('trim', TEST_URI);
        assert.ok(result);
        assert.ok(result.includes('Trim'));
        assert.ok(result.includes('espacios iniciales y finales'));
        assert.ok(!result.includes('(función)'));
    });

    test('should not return built-in hover for variable declaration type token', () => {
        const text = 'string ls_result = String(123)';
        const document = makeDoc(text);
        const context = getSymbolContextAtPosition(
            document,
            new vscode.Position(0, text.indexOf('string') + 1),
        );

        assert.ok(context);

        const result = resolver.resolve(
            context!.word,
            document.uri,
            context!.range.start,
            context!,
        );

        assert.strictEqual(result, undefined);
    });

    test('should still return built-in hover for conversion call in initializer', () => {
        const text = 'string ls_result = String(123)';
        const document = makeDoc(text);
        const context = getSymbolContextAtPosition(
            document,
            new vscode.Position(0, text.indexOf('String(') + 1),
        );

        assert.ok(context);

        const result = resolver.resolve(
            context!.word,
            document.uri,
            context!.range.start,
            context!,
        );

        assert.ok(result);
        assert.ok(result.includes('String(value)'));
        assert.ok(result.includes('Convierte un valor a su representación en cadena'));
    });

    test('should return undefined for ambiguous duplicated global symbols', () => {
        index.indexDocument(
            makeDoc(
                'global function integer gf_conflict ();',
                'file:///test/hover-a.sru',
            ),
        );
        index.indexDocument(
            makeDoc(
                'global function integer gf_conflict ();',
                'file:///test/hover-b.sru',
            ),
        );

        const result = resolver.resolve('gf_conflict', TEST_URI);
        assert.strictEqual(result, undefined);
    });

    test('should prefer global external function over global function at call site', () => {
        index.indexDocument(
            makeDoc(
                'FUNCTION ulong GetSysColor (int ai_index) LIBRARY "USER32.DLL"',
                'file:///test/external-callable.sru',
            ),
        );
        index.indexDocument(
            makeDoc(
                [
                    'global function string GetSysColor (int ai_index);',
                    'return "pb"',
                    'end function',
                ].join('\n'),
                'file:///test/global-callable.sru',
            ),
        );

        const input = extractMarkedText([
            'global type w_consumer from window',
            'end type',
            'global w_consumer w_consumer',
            '',
            'event open;',
            '[[GetSysColor]](1)',
            'end event',
        ].join('\n'));

        const document = makeDoc(input.text, 'file:///test/hover-external-preferred.sru');
        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, input.position);
        assert.ok(context, 'Expected external hover context');
        assert.strictEqual(context!.providedArgumentCount, 1);

        const result = resolver.resolve(
            context!.word,
            document.uri,
            context!.range.start,
            context!,
        );

        assert.ok(result);
        assert.ok(result.includes('GetSysColor(int ai_index)'));
        assert.ok(result.includes('Función externa'));
        assert.ok(result.includes('USER32.DLL'));
        assert.ok(!result.includes('return "pb"'));
    });
});