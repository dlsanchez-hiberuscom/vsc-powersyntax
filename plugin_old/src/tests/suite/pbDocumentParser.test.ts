import * as assert from 'assert';
import * as vscode from 'vscode';
import { PbDocumentParser } from '../../powerbuilder/parsing/pbDocumentParser';

function makeDoc(text: string): vscode.TextDocument {
    const lines = text.split(/\r?\n/);
    return {
        uri: vscode.Uri.parse('file:///test/test.sru'),
        getText: () => text,
        lineAt: (line: number) => ({ text: lines[line] || '' }),
        lineCount: lines.length,
        languageId: 'powerbuilder',
    } as unknown as vscode.TextDocument;
}

suite('PbDocumentParser', () => {
    const parser = new PbDocumentParser();

    test('should parse type declaration', () => {
        const doc = makeDoc('global type w_main from window\nend type');
        const symbols = parser.parse(doc);
        const typeSymbol = symbols.find(s => s.kind === 'type');
        assert.ok(typeSymbol, 'Should find a type symbol');
        assert.strictEqual(typeSymbol.name, 'w_main');
        assert.strictEqual(typeSymbol.detail, 'from window');
    });

    test('should parse function', () => {
        const doc = makeDoc([
            'global type w_main from window',
            'public function integer of_process (string as_input);',
            'end function',
            'end type',
        ].join('\n'));
        const symbols = parser.parse(doc);
        const fn = symbols.find(s => s.kind === 'function');
        assert.ok(fn, 'Should find a function symbol');
        assert.strictEqual(fn.name, 'of_process');
        assert.strictEqual(fn.returnType, 'integer');
        assert.strictEqual(fn.access, 'public');
        assert.strictEqual(fn.parent, 'w_main');
    });

    test('should parse subroutine', () => {
        const doc = makeDoc('public subroutine of_reset ();');
        const symbols = parser.parse(doc);
        const sub = symbols.find(s => s.kind === 'subroutine');
        assert.ok(sub, 'Should find a subroutine symbol');
        assert.strictEqual(sub.name, 'of_reset');
        assert.strictEqual(sub.access, 'public');
        assert.strictEqual(sub.returnType, undefined);
    });

    test('should parse event', () => {
        const doc = makeDoc([
            'global type w_main from window',
            'event open;',
            'end event',
            'end type',
        ].join('\n'));
        const symbols = parser.parse(doc);
        const ev = symbols.find(s => s.kind === 'event');
        assert.ok(ev, 'Should find an event symbol');
        assert.strictEqual(ev.name, 'open');
        assert.strictEqual(ev.parent, 'w_main');
    });

    test('should parse instance variable', () => {
        const doc = makeDoc('private integer li_count');
        const symbols = parser.parse(doc);
        const v = symbols.find(s => s.kind === 'variable');
        assert.ok(v, 'Should find a variable symbol');
        assert.strictEqual(v.name, 'li_count');
        assert.strictEqual(v.detail, 'integer');
        assert.strictEqual(v.access, 'private');
    });

    test('should parse structure', () => {
        const doc = makeDoc('global type st_person from structure\nend type');
        const symbols = parser.parse(doc);
        const struct = symbols.find(s => s.kind === 'structure');
        assert.ok(struct, 'Should find a structure symbol');
        assert.strictEqual(struct.name, 'st_person');
    });

    test('should skip comment lines', () => {
        const doc = makeDoc([
            '// this is a comment',
            '/* block comment */',
            'public function integer of_test ();',
        ].join('\n'));
        const symbols = parser.parse(doc);
        assert.strictEqual(symbols.length, 1);
        assert.strictEqual(symbols[0].name, 'of_test');
    });

    test('should set parent-child relationships', () => {
        const doc = makeDoc([
            'global type w_main from window',
            'public function integer of_calc ();',
            'end function',
            'event clicked;',
            'end event',
            'end type',
        ].join('\n'));
        const symbols = parser.parse(doc);
        const type = symbols.find(s => s.kind === 'type');
        assert.ok(type);
        assert.ok(type.children);
        assert.strictEqual(type.children.length, 2);
        assert.strictEqual(type.children[0].name, 'of_calc');
        assert.strictEqual(type.children[1].name, 'clicked');
    });

    test('should reset currentType after end type', () => {
        const doc = makeDoc([
            'global type w_main from window',
            'end type',
            'public function integer of_standalone ();',
        ].join('\n'));
        const symbols = parser.parse(doc);
        const fn = symbols.find(s => s.kind === 'function');
        assert.ok(fn);
        assert.strictEqual(fn.parent, undefined);
    });

    test('should handle empty document', () => {
        const doc = makeDoc('');
        const symbols = parser.parse(doc);
        assert.strictEqual(symbols.length, 0);
    });

    test('should handle multiple types in one file', () => {
        const doc = makeDoc([
            'global type w_one from window',
            'event open;',
            'end type',
            'type w_two from window',
            'event close;',
            'end type',
        ].join('\n'));
        const symbols = parser.parse(doc);
        const types = symbols.filter(s => s.kind === 'type');
        assert.strictEqual(types.length, 2);
        assert.strictEqual(types[0].name, 'w_one');
        assert.strictEqual(types[1].name, 'w_two');
        const events = symbols.filter(s => s.kind === 'event');
        assert.strictEqual(events[0].parent, 'w_one');
        assert.strictEqual(events[1].parent, 'w_two');
    });

    test('should parse all variable types', () => {
        const types = ['string', 'integer', 'long', 'decimal', 'boolean', 'date', 'datetime', 'double', 'real', 'char', 'byte', 'blob', 'time', 'any'];
        for (const t of types) {
            const doc = makeDoc(`${t} lv_test`);
            const symbols = parser.parse(doc);
            const v = symbols.find(s => s.kind === 'variable');
            assert.ok(v, `Should parse variable of type ${t}`);
            assert.strictEqual(v.detail, t);
        }
    });

    test('should parse continued array declaration inspired by PFC fixtures', () => {
        const doc = makeDoc([
            'string Item[]={"Arial",&',
            '        "MS Sans Serif",&',
            '        "Symbol"}',
        ].join('\n'));

        const symbols = parser.parse(doc);
        const variable = symbols.find(s => s.kind === 'variable');

        assert.ok(variable, 'Should find array variable declaration');
        assert.strictEqual(variable.name, 'Item');
        assert.strictEqual(variable.detail, 'string');
    });

    test('should parse external function declarations without opening a callable body', () => {
        const doc = makeDoc([
            'FUNCTION ulong GetSysColor (int index) LIBRARY "USER32.DLL"',
            'long ll_color',
        ].join('\n'));

        const symbols = parser.parse(doc);
        const externalFunction = symbols.find(symbol => symbol.name === 'GetSysColor');
        const variable = symbols.find(symbol => symbol.name === 'll_color');

        assert.ok(externalFunction, 'Should parse external function declaration');
        assert.strictEqual(externalFunction!.kind, 'global-function');
        assert.strictEqual(externalFunction!.isExternal, true);
        assert.strictEqual(externalFunction!.externalLibraryName, 'USER32.DLL');
        assert.strictEqual(externalFunction!.externalName, undefined);

        assert.ok(variable, 'Should continue parsing following declarations outside the external callable');
        assert.strictEqual(variable!.parent, undefined);
    });

    test('should parse external alias metadata', () => {
        const doc = makeDoc(
            'FUNCTION boolean sndPlaySoundA (string soundname, uint flags) LIBRARY "WINMM.DLL" ALIAS FOR "sndPlaySoundA;ansi"',
        );

        const symbols = parser.parse(doc);
        const externalFunction = symbols.find(symbol => symbol.name === 'sndPlaySoundA');

        assert.ok(externalFunction, 'Should parse external aliased function declaration');
        assert.strictEqual(externalFunction!.isExternal, true);
        assert.strictEqual(externalFunction!.externalLibraryName, 'WINMM.DLL');
        assert.strictEqual(externalFunction!.externalName, 'sndPlaySoundA;ansi');
    });

    test('should parse callable scopes with parameters, locals and block ranges', () => {
        const doc = makeDoc([
            'global type w_master from window',
            'end type',
            'global w_master w_master',
            '',
            'public function string of_getexampletitle (string as_classname);',
            'string ls_title',
            'return as_classname + ls_title',
            'end function',
            '',
            'event open;',
            'string ls_title',
            'return',
            'end event',
        ].join('\n'));

        const symbols = parser.parse(doc);
        const functionSymbol = symbols.find(symbol => symbol.kind === 'function' && symbol.name === 'of_getexampletitle');
        const parameterSymbol = symbols.find(symbol => symbol.name === 'as_classname');
        const localSymbols = symbols.filter(symbol =>
            symbol.name === 'ls_title' && symbol.declarationScope === 'local',
        );

        assert.ok(functionSymbol, 'Should find the function symbol');
        assert.ok(functionSymbol.range.end.line > functionSymbol.range.start.line, 'Function range should cover the full block');
        assert.strictEqual(functionSymbol.children?.some(child => child.name === 'as_classname'), true);

        assert.ok(parameterSymbol, 'Should find the parameter symbol');
        assert.strictEqual(parameterSymbol.kind, 'variable');
        assert.strictEqual(parameterSymbol.declarationScope, 'parameter');
        assert.strictEqual(parameterSymbol.parent, 'of_getexampletitle');

        assert.strictEqual(localSymbols.length, 2);
        assert.ok(localSymbols.every(symbol => symbol.parent === 'of_getexampletitle' || symbol.parent === 'open'));
        assert.ok(localSymbols.every(symbol => symbol.declarationScope === 'local'));
    });

    test('should parse extended variable access modifiers and labels', () => {
        const doc = makeDoc([
            'global type w_scope from window',
            'type variables',
            'shared:',
            'string is_shared',
            'global:',
            'string is_global',
            'protectedread string is_title',
            'privatewrite string is_secret',
            'end variables',
            'end type',
        ].join('\n'));

        const symbols = parser.parse(doc);
        const sharedSymbol = symbols.find(symbol => symbol.name === 'is_shared');
        const globalSymbol = symbols.find(symbol => symbol.name === 'is_global');
        const protectedSymbol = symbols.find(symbol => symbol.name === 'is_title');
        const privateSymbol = symbols.find(symbol => symbol.name === 'is_secret');

        assert.ok(sharedSymbol, 'Should parse shared variable');
        assert.ok(globalSymbol, 'Should parse global variable');
        assert.ok(protectedSymbol, 'Should parse protectedread variable');
        assert.ok(privateSymbol, 'Should parse privatewrite variable');

        assert.strictEqual(sharedSymbol!.access, 'shared');
        assert.strictEqual(globalSymbol!.access, 'global');
        assert.strictEqual(protectedSymbol!.access, 'protectedread');
        assert.strictEqual(privateSymbol!.access, 'privatewrite');
    });
});
