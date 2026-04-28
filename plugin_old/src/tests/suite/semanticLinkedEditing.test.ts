import * as assert from 'assert';
import * as vscode from 'vscode';
import { getSymbolContextAtPosition } from '../../powerbuilder/document/documentUtils';
import { SymbolIndex } from '../../powerbuilder/indexing/symbolIndex';
import { SemanticQueryService } from '../../powerbuilder/semantic';

function makeDoc(text: string, uriPath: string = 'file:///test/linked-editing.sru'): vscode.TextDocument {
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

function getTextPosition(document: vscode.TextDocument, searchText: string): vscode.Position {
    const offset = document.getText().indexOf(searchText);

    assert.ok(offset >= 0, `Expected text ${searchText} in test document`);

    return document.positionAt(offset + 2);
}

suite('SemanticLinkedEditing', () => {
    let index: SymbolIndex;
    let service: SemanticQueryService;

    setup(() => {
        index = SymbolIndex.getInstance();
        index.clear();
        service = new SemanticQueryService(index);
    });

    test('resolveLinkedEditingRangesAtPosition publica rangos para un parametro resoluble', async () => {
        const document = makeDoc([
            'public function integer of_total (long al_value);',
            'long ll_total',
            'll_total = al_value',
            'return ll_total + al_value',
            'end function',
        ].join('\n'));

        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, getTextPosition(document, 'al_value);'));

        assert.ok(context, 'Expected semantic context for parameter');

        const result = await service.resolveLinkedEditingRangesAtPosition({
            word: context!.word,
            uri: document.uri,
            document,
            symbolContext: context!,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.ranges.length, 3);
    });

    test('resolveLinkedEditingRangesAtPosition publica rangos para un local resoluble', async () => {
        const document = makeDoc([
            'event open;',
            'long ll_total',
            'll_total = 1',
            'MessageBox("demo", string(ll_total))',
            'end event',
        ].join('\n'));

        index.indexDocument(document);

        const context = getSymbolContextAtPosition(document, getTextPosition(document, 'll_total = 1'));

        assert.ok(context, 'Expected semantic context for local variable');

        const result = await service.resolveLinkedEditingRangesAtPosition({
            word: context!.word,
            uri: document.uri,
            document,
            symbolContext: context!,
        });

        assert.strictEqual(result.precision, 'exact');
        assert.strictEqual(result.ranges.length, 3);
    });
});