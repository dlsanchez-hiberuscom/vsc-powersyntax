import * as assert from 'assert';
import * as vscode from 'vscode';
import { providePowerBuilderInlayHints } from '../../features/direct-api-ide/inlay-hints/registerInlayHints';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';

function makeDoc(text: string, uriPath: string): vscode.TextDocument {
    const lines = text.split(/\r?\n/);

    return {
        uri: vscode.Uri.parse(uriPath),
        version: 0,
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
        offsetAt(position: vscode.Position) {
            return lines
                .slice(0, position.line)
                .reduce((total, line) => total + line.length + 1, 0) + position.character;
        },
    } as unknown as vscode.TextDocument;
}

suite('SemanticInlayHints', () => {
    let index: SymbolIndex;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
    });

    test('publica inlay hints para llamada owner-aware con firma estable', () => {
        const serviceDocument = makeDoc([
            'global type n_inlay_hint_service from nonvisualobject',
            'end type',
            'global n_inlay_hint_service n_inlay_hint_service',
            '',
            'public function long of_inlay_run (string as_name, long ai_count);',
            'return 1',
            'end function',
        ].join('\n'), 'file:///test/inlay-service.sru');
        const consumerDocument = makeDoc([
            'global type n_inlay_hint_consumer from nonvisualobject',
            'end type',
            'global n_inlay_hint_consumer n_inlay_hint_consumer',
            'global n_inlay_hint_service inv_inlay_service',
            '',
            'event open;',
            'string ls_name',
            'long ll_count',
            'inv_inlay_service.of_inlay_run(ls_name, ll_count)',
            'end event',
        ].join('\n'), 'file:///test/inlay-consumer.sru');

        index.indexDocument(serviceDocument);
        index.indexDocument(consumerDocument);

        const hints = providePowerBuilderInlayHints(
            consumerDocument,
            new vscode.Range(0, 0, consumerDocument.lineCount, 0),
            index,
        );

        assert.deepStrictEqual(
            hints.map(hint => String(hint.label)),
            ['as_name:', 'ai_count:'],
        );
    });

    test('retira inlay hints cuando el owner sigue bloqueado en Any', () => {
        const consumerDocument = makeDoc([
            'global type n_inlay_hint_consumer from nonvisualobject',
            'end type',
            'global n_inlay_hint_consumer n_inlay_hint_consumer',
            'any lao_inlay_service',
            '',
            'event open;',
            'lao_inlay_service.of_inlay_run("demo")',
            'end event',
        ].join('\n'), 'file:///test/inlay-any-consumer.sru');

        index.indexDocument(consumerDocument);

        const hints = providePowerBuilderInlayHints(
            consumerDocument,
            new vscode.Range(0, 0, consumerDocument.lineCount, 0),
            index,
        );

        assert.strictEqual(hints.length, 0);
    });
});