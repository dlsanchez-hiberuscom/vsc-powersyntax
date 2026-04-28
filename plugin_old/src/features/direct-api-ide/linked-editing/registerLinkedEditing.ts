import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { getSymbolContextAtPosition } from '../../../powerbuilder/document/documentUtils';
import { IDENTIFIER_SOURCE } from '../../../powerbuilder/grammar/pbLanguageGrammar';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import { SemanticQueryService } from '../../../powerbuilder/semantic';
import { PowerBuilderProviderHost } from '../provider-host/powerBuilderProviderHost';

const LINKED_EDITING_PATTERN = new RegExp(IDENTIFIER_SOURCE, 'i');

export async function provideLinkedEditingRanges(
    document: vscode.TextDocument,
    position: vscode.Position,
    index = SymbolIndex.getInstance(),
): Promise<vscode.LinkedEditingRanges | undefined> {
    const symbolContext = getSymbolContextAtPosition(document, position);

    if (!symbolContext) {
        return undefined;
    }

    const semanticQueries = new SemanticQueryService(index);
    const result = await semanticQueries.resolveLinkedEditingRangesAtPosition({
        word: symbolContext.word,
        uri: document.uri,
        document,
        symbolContext,
    });

    return result.ranges.length > 0
        ? new vscode.LinkedEditingRanges(result.ranges, LINKED_EDITING_PATTERN)
        : undefined;
}

export function registerLinkedEditing(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const host = new PowerBuilderProviderHost();

    const provider = vscode.languages.registerLinkedEditingRangeProvider(PB_SELECTOR, {
        provideLinkedEditingRanges(document, position, _token) {
            return host.runWithPositionContextAsync(
                document,
                position,
                getSymbolContextAtPosition,
                { emptyValue: undefined },
                async () => provideLinkedEditingRanges(document, position, host.index),
            );
        },
    });

    return [provider];
}