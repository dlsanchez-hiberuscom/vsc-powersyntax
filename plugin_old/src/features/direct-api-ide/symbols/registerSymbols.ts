import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { getConfig } from '../../../core/config/extensionConfiguration';
import {
    isDataWindowUri,
    isIdeSafePowerBuilderDocument,
} from '../../../core/utils/powerBuilderFileUtils';
import {
    buildDataWindowDocumentSymbols,
    PbDataWindowParser,
} from '../../../powerbuilder/datawindow/pbDataWindowParser';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import { PbSymbol } from '../../../powerbuilder/models/pbSymbol';

export function registerSymbols(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const index = SymbolIndex.getInstance();
    const dataWindowParser = new PbDataWindowParser();

    const documentSymbolProvider = vscode.languages.registerDocumentSymbolProvider(PB_SELECTOR, {
        provideDocumentSymbols(document, _token): vscode.DocumentSymbol[] {
            if (document.languageId !== 'powerbuilder') {
                return [];
            }

            if (isDataWindowUri(document.uri)) {
                return buildDataWindowDocumentSymbols(
                    dataWindowParser.parseDocument(document),
                );
            }

            if (!isIdeSafePowerBuilderDocument(document, getConfig().dataWindowExperimentalIdeEnabled)) {
                return [];
            }

            const symbols = index.indexDocument(document, { silent: true });
            return buildDocumentSymbolTree(symbols);
        },
    });

    const workspaceSymbolProvider = vscode.languages.registerWorkspaceSymbolProvider({
        provideWorkspaceSymbols(query, _token): vscode.SymbolInformation[] {
            const symbols = query ? index.searchSymbols(query) : index.getAllSymbols();

            return symbols.map(symbol => new vscode.SymbolInformation(
                symbol.name,
                mapKind(symbol.kind),
                symbol.parent ?? '',
                new vscode.Location(symbol.uri, symbol.selectionRange),
            ));
        },
    });

    return [documentSymbolProvider, workspaceSymbolProvider];
}

function buildDocumentSymbolTree(symbols: PbSymbol[]): vscode.DocumentSymbol[] {
    const topLevel: vscode.DocumentSymbol[] = [];

    const topLevelSymbols = getTopLevelSymbols(symbols);
    const includedKeys = new Set<string>();

    for (const symbol of topLevelSymbols) {
        const documentSymbol = toDocumentSymbol(symbol, includedKeys);
        topLevel.push(documentSymbol);
    }

    for (const symbol of symbols) {
        const key = getSymbolKey(symbol);

        if (!includedKeys.has(key)) {
            topLevel.push(toDocumentSymbol(symbol, includedKeys));
        }
    }

    return topLevel;
}

function getTopLevelSymbols(symbols: PbSymbol[]): PbSymbol[] {
    const containerNames = new Set(
        symbols
            .filter(symbol => symbol.kind === 'type' || symbol.kind === 'structure')
            .map(symbol => symbol.name),
    );

    return symbols.filter(symbol =>
        !symbol.parent || !containerNames.has(symbol.parent),
    );
}

function toDocumentSymbol(
    symbol: PbSymbol,
    includedKeys: Set<string>,
): vscode.DocumentSymbol {
    includedKeys.add(getSymbolKey(symbol));

    const documentSymbol = new vscode.DocumentSymbol(
        symbol.name,
        symbol.detail ?? '',
        mapKind(symbol.kind),
        symbol.range,
        symbol.selectionRange,
    );

    const children = symbol.children ?? [];

    for (const child of children) {
        documentSymbol.children.push(
            toDocumentSymbol(child, includedKeys),
        );
    }

    return documentSymbol;
}

function getSymbolKey(symbol: PbSymbol): string {
    return [
        symbol.uri.toString(),
        symbol.name.toLowerCase(),
        symbol.kind,
        symbol.parent ?? '',
        symbol.range.start.line,
        symbol.range.start.character,
        symbol.range.end.line,
        symbol.range.end.character,
    ].join('|');
}

function mapKind(kind: string): vscode.SymbolKind {
    switch (kind) {
        case 'type':
            return vscode.SymbolKind.Class;
        case 'structure':
            return vscode.SymbolKind.Struct;
        case 'function':
            return vscode.SymbolKind.Function;
        case 'global-function':
            return vscode.SymbolKind.Function;
        case 'subroutine':
            return vscode.SymbolKind.Method;
        case 'event':
            return vscode.SymbolKind.Event;
        case 'variable':
            return vscode.SymbolKind.Variable;
        case 'constant':
            return vscode.SymbolKind.Constant;
        default:
            return vscode.SymbolKind.Variable;
    }
}