import * as assert from 'assert';
import * as vscode from 'vscode';
import {
    buildCallableSuggestion,
    canPublishCallableSuggestion,
    formatCallableSuggestionMarkdown,
    formatCallableSuggestionPlainText,
} from '../../powerbuilder/semantic';
import { PbSymbol } from '../../powerbuilder/models/pbSymbol';

function makeCallableSymbol(overrides: Partial<PbSymbol>): PbSymbol {
    return {
        name: 'of_run',
        kind: 'function',
        uri: vscode.Uri.parse('file:///test/callable-suggestion.sru'),
        range: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 10)),
        selectionRange: new vscode.Range(new vscode.Position(0, 0), new vscode.Position(0, 10)),
        signature: 'long of_run(string as_name)',
        returnType: 'long',
        parameterCount: 1,
        ...overrides,
    };
}

suite('CallableSuggestions', () => {
    test('publica sugerencia exacta de firma y retorno para un callable indexado', () => {
        const suggestion = buildCallableSuggestion(
            makeCallableSymbol({}),
            'exact',
        );

        assert.ok(suggestion);
        assert.strictEqual(suggestion!.precision, 'exact');
        assert.strictEqual(suggestion!.signatureLabel, 'long of_run(string as_name)');
        assert.strictEqual(suggestion!.returnType, 'long');
        assert.strictEqual(suggestion!.parameterCount, 1);
        assert.ok(formatCallableSuggestionMarkdown(suggestion!).includes('Sugerencia exacta de firma'));
        assert.ok(formatCallableSuggestionPlainText(suggestion!).includes('Sugerencia exacta de retorno: long'));
    });

    test('publica sugerencia compatible cuando el binding del callable es heredado', () => {
        const suggestion = buildCallableSuggestion(
            makeCallableSymbol({
                signature: 'string of_base(string as_name)',
                returnType: 'string',
            }),
            'compatible',
        );

        assert.ok(suggestion);
        assert.strictEqual(suggestion!.precision, 'compatible');
        assert.strictEqual(suggestion!.signatureLabel, 'string of_base(string as_name)');
        assert.strictEqual(suggestion!.returnType, 'string');
        assert.ok(formatCallableSuggestionMarkdown(suggestion!).includes('binding compatible'));
    });

    test('no inventa retorno cuando el callable devuelve Any', () => {
        const suggestion = buildCallableSuggestion(
            makeCallableSymbol({
                signature: 'any of_unknown() ',
                returnType: 'Any',
                parameterCount: 0,
            }),
            'exact',
        );

        assert.ok(suggestion);
        assert.strictEqual(suggestion!.signatureLabel, 'any of_unknown()');
        assert.strictEqual(suggestion!.returnType, undefined);
    });

    test('conserva sugerencia de firma para subrutinas sin inventar retorno', () => {
        const suggestion = buildCallableSuggestion(
            makeCallableSymbol({
                kind: 'subroutine',
                signature: 'of_run(string as_name)',
                returnType: undefined,
            }),
            'exact',
        );

        assert.ok(suggestion);
        assert.strictEqual(suggestion!.signatureLabel, 'of_run(string as_name)');
        assert.strictEqual(suggestion!.returnType, undefined);
    });

    test('bloquea la sugerencia cuando la precision no es publicable', () => {
        assert.strictEqual(canPublishCallableSuggestion('blocked'), false);
        assert.strictEqual(canPublishCallableSuggestion('ambiguous'), false);
        assert.strictEqual(canPublishCallableSuggestion('heuristic'), false);
        assert.strictEqual(
            buildCallableSuggestion(makeCallableSymbol({}), 'blocked'),
            undefined,
        );
    });
});