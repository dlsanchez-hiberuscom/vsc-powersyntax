import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import {
    formatSystemSymbolCompletionDetail,
    formatSystemSymbolMarkdown,
} from '../../../powerbuilder/knowledge/services/presentation';
import {
    resolvePowerScriptDataWindowPropertyCompletionAtPosition,
} from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowProperties';
import {
    resolvePowerScriptDataWindowChildCompletionAtPosition,
} from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowChildren';
import { resolvePowerScriptDataWindowColumnCompletionAtPosition } from '../../../powerbuilder/datawindow/pbPowerScriptDataWindowLinks';
import {
    formatSymbolDetailEs,
} from '../../../core/i18n/pbUserMessages';
import { getSystemSignatureParameterLabels } from '../../../powerbuilder/knowledge/services/signatureService';
import {
    buildCallableSuggestion,
    formatCallableSuggestionMarkdown,
} from '../../../powerbuilder/semantic';
import {
    resolveSystemStatement,
} from '../../../powerbuilder/knowledge/services/queryService';
import { PbSystemSymbolEntry } from '../../../powerbuilder/knowledge/types';
import { PbSymbol } from '../../../powerbuilder/models/pbSymbol';
import { PB_KEYWORDS } from '../../../powerbuilder/grammar/pbLanguageGrammar';
import { PowerBuilderProviderHost } from '../provider-host/powerBuilderProviderHost';

const PB_TYPES = [
    'any',
    'blob',
    'boolean',
    'byte',
    'char',
    'character',
    'date',
    'datetime',
    'dec',
    'decimal',
    'double',
    'int',
    'integer',
    'long',
    'longlong',
    'longptr',
    'real',
    'string',
    'time',
    'uint',
    'ulong',
    'unsignedint',
    'unsignedinteger',
    'unsignedlong',
];

export function registerCompletion(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const host = new PowerBuilderProviderHost();

    const provider = vscode.languages.registerCompletionItemProvider(
        PB_SELECTOR,
        {
            async provideCompletionItems(
                document,
                position,
                _token,
                _context,
            ): Promise<vscode.CompletionList> {
                return host.runWithDocumentAsync(
                    document,
                    {
                        emptyValue: new vscode.CompletionList(),
                        isFeatureEnabled: config => config.completionEnabled,
                    },
                    async ({ document, index }) => {
                        const dataWindowChildCompletion = await resolvePowerScriptDataWindowChildCompletionAtPosition(
                            document,
                            position,
                            index,
                        );

                        if (dataWindowChildCompletion) {
                            return buildDataWindowChildCompletionList(dataWindowChildCompletion);
                        }

                        const dataWindowPropertyCompletion = await resolvePowerScriptDataWindowPropertyCompletionAtPosition(
                            document,
                            position,
                            index,
                        );

                        if (dataWindowPropertyCompletion) {
                            return buildDataWindowPropertyCompletionList(dataWindowPropertyCompletion);
                        }

                        const dataWindowColumnCompletion = await resolvePowerScriptDataWindowColumnCompletionAtPosition(
                            document,
                            position,
                            index,
                        );

                        if (dataWindowColumnCompletion) {
                            return buildDataWindowColumnCompletionList(dataWindowColumnCompletion);
                        }

                        const completion = host.semanticQueries.resolveCompletionAtPosition({
                            document,
                            position,
                        });
                        const prefix = completion.context?.word ?? '';
                        const completionRange = completion.context?.range;
                        const items: vscode.CompletionItem[] = [];
                        const symbols = completion.symbols;

                        for (const [symbolIndex, symbol] of symbols.entries()) {
                            const item = new vscode.CompletionItem(
                                symbol.name,
                                mapCompletionKind(symbol),
                            );
                            const callableSuggestion = buildCallableSuggestion(symbol, completion.precision);

                            item.detail = buildSymbolDetail(symbol);
                            item.sortText = `0_${symbolIndex.toString().padStart(4, '0')}_${symbol.name.toLowerCase()}`;
                            applyCompletionInsertion(item, completionRange, buildSymbolInvocationSnippet(symbol));

                            const documentationSections: string[] = [];

                            if (symbol.signature?.trim()) {
                                documentationSections.push(`\`${symbol.signature}\``);
                            }

                            if (callableSuggestion) {
                                documentationSections.push(
                                    formatCallableSuggestionMarkdown(callableSuggestion),
                                );
                            }

                            if (documentationSections.length > 0) {
                                const documentation = new vscode.MarkdownString(
                                    documentationSections.join('\n\n'),
                                );
                                documentation.isTrusted = false;
                                item.documentation = documentation;
                            }

                            items.push(item);
                        }

                        if (completion.systemEntries.length > 0) {
                            const systemKind = completion.context?.isQualifiedAccess
                                ? completion.context.qualifier === '::'
                                    ? vscode.CompletionItemKind.Event
                                    : vscode.CompletionItemKind.Method
                                : vscode.CompletionItemKind.Function;

                            appendSystemCompletionItems(
                                items,
                                completion.systemEntries,
                                systemKind,
                                '1',
                                completionRange,
                            );
                        }

                        if (!completion.context?.isQualifiedAccess) {
                            for (const keyword of PB_KEYWORDS) {
                                if (!matchesCompletionPrefix(keyword, prefix)) {
                                    continue;
                                }

                                const item = new vscode.CompletionItem(
                                    keyword,
                                    vscode.CompletionItemKind.Keyword,
                                );
                                const statementInfo = resolveSystemStatement(keyword);

                                if (statementInfo) {
                                    item.detail = formatSystemSymbolCompletionDetail(statementInfo);
                                    item.documentation = new vscode.MarkdownString(
                                        formatSystemSymbolMarkdown(statementInfo),
                                    );
                                }

                                item.sortText = `2_${keyword}`;
                                applyCompletionInsertion(item, completionRange);
                                items.push(item);
                            }

                            for (const dataType of PB_TYPES) {
                                if (!matchesCompletionPrefix(dataType, prefix)) {
                                    continue;
                                }

                                const item = new vscode.CompletionItem(
                                    dataType,
                                    vscode.CompletionItemKind.TypeParameter,
                                );
                                item.sortText = `3_${dataType}`;
                                applyCompletionInsertion(item, completionRange);
                                items.push(item);
                            }
                        }

                        return new vscode.CompletionList(items, completion.isIncomplete);
                    },
                );
            },
        },
        '.',
        ':',
    );

    return [provider];
}

function buildSymbolDetail(symbol: PbSymbol): string {
    let detail = formatSymbolDetailEs(symbol.kind, symbol.parent);

    if (symbol.isPrototype) {
        detail += ' · prototipo';
    }

    if (symbol.implementationKind === 'on-handler') {
        detail += ' · handler on';
    }

    if (symbol.implementationKind === 'qualified-event') {
        detail += ' · evento calificado';
    }

    return detail;
}

function buildDataWindowColumnCompletionList(
    context: Awaited<ReturnType<typeof resolvePowerScriptDataWindowColumnCompletionAtPosition>>,
): vscode.CompletionList {
    if (!context) {
        return new vscode.CompletionList();
    }

    if (!context.candidate || !context.columns) {
        return new vscode.CompletionList([], false);
    }

    const prefix = context.literal.columnName;
    const objectName = context.candidate.parseResult.metadata.objectName;
    const fileName = context.candidate.uri.fsPath.split(/[/\\]/).pop() ?? context.candidate.uri.path;
    const items = context.columns
        .filter(column => matchesCompletionPrefix(column.name, prefix))
        .map(column => {
            const item = new vscode.CompletionItem(
                column.name,
                vscode.CompletionItemKind.Field,
            );

            item.detail = `Columna DataWindow · ${objectName}`;
            item.documentation = new vscode.MarkdownString([
                `**${column.name}**`,
                `DataWindow: \`${objectName}\``,
                `Archivo: \`${fileName}\``,
            ].join('\n\n'));
            item.sortText = `0_${column.name.toLowerCase()}`;
            applyCompletionInsertion(item, context.literal.range, column.name);
            return item;
        });

    return new vscode.CompletionList(items, false);
}

function buildDataWindowPropertyCompletionList(
    context: Awaited<ReturnType<typeof resolvePowerScriptDataWindowPropertyCompletionAtPosition>>,
): vscode.CompletionList {
    if (!context) {
        return new vscode.CompletionList();
    }

    if (!context.candidate || !context.properties) {
        return new vscode.CompletionList([], false);
    }

    const items = context.properties.map((property, index) => {
        const item = new vscode.CompletionItem(
            context.literal.methodName === 'modify'
                ? `${property.path}=`
                : property.path,
            vscode.CompletionItemKind.Property,
        );
        item.detail = property.detail;
        item.sortText = `0_dw_property_${index.toString().padStart(4, '0')}_${property.key}`;
        item.documentation = new vscode.MarkdownString(property.documentation);
        applyCompletionInsertion(
            item,
            context.literal.propertyRange,
            context.literal.methodName === 'modify' && property.modifySnippet
                ? new vscode.SnippetString(property.modifySnippet)
                : property.path,
        );

        return item;
    });

    return new vscode.CompletionList(items, false);
}

function buildDataWindowChildCompletionList(
    context: Awaited<ReturnType<typeof resolvePowerScriptDataWindowChildCompletionAtPosition>>,
): vscode.CompletionList {
    if (!context) {
        return new vscode.CompletionList();
    }

    if (!context.candidate || !context.children) {
        return new vscode.CompletionList([], false);
    }

    const items = context.children.map((child, index) => {
        const item = new vscode.CompletionItem(
            child.childName,
            vscode.CompletionItemKind.Class,
        );
        item.detail = child.kind === 'report'
            ? 'Report child enlazado'
            : 'DropDownDataWindow child enlazada';
        item.documentation = new vscode.MarkdownString(
            `DataObject hijo: \`${child.childCandidate.parseResult.metadata.objectName}\``,
        );
        item.sortText = `0_dw_child_${index.toString().padStart(4, '0')}_${child.childName.toLowerCase()}`;
        applyCompletionInsertion(item, context.literal.range, child.childName);

        return item;
    });

    return new vscode.CompletionList(items, false);
}

function mapCompletionKind(symbol: PbSymbol): vscode.CompletionItemKind {
    switch (symbol.kind) {
        case 'type':
            return vscode.CompletionItemKind.Class;
        case 'structure':
            return vscode.CompletionItemKind.Struct;
        case 'function':
        case 'global-function':
            return vscode.CompletionItemKind.Function;
        case 'subroutine':
            return vscode.CompletionItemKind.Method;
        case 'event':
            return vscode.CompletionItemKind.Event;
        case 'variable':
            return vscode.CompletionItemKind.Variable;
        case 'constant':
            return vscode.CompletionItemKind.Constant;
        default:
            return vscode.CompletionItemKind.Text;
    }
}

function matchesCompletionPrefix(label: string, prefix: string): boolean {
    if (!prefix) {
        return true;
    }

    return label.toLowerCase().includes(prefix.toLowerCase());
}

function appendSystemCompletionItems(
    items: vscode.CompletionItem[],
    entries: readonly PbSystemSymbolEntry[],
    kind: vscode.CompletionItemKind,
    sortGroup: string,
    range?: vscode.Range,
): void {
    const seenNames = new Set<string>();

    for (const entry of entries) {
        const normalizedName = entry.name.toLowerCase();

        if (seenNames.has(normalizedName)) {
            continue;
        }

        seenNames.add(normalizedName);

        const item = new vscode.CompletionItem(entry.name, kind);
        item.detail = formatSystemSymbolCompletionDetail(entry);
        item.documentation = new vscode.MarkdownString(
            formatSystemSymbolMarkdown(entry),
        );
        item.sortText = `${sortGroup}_${entry.name.toLowerCase()}`;
        applyCompletionInsertion(item, range, buildSystemInvocationSnippet(entry));
        items.push(item);
    }
}

function applyCompletionInsertion(
    item: vscode.CompletionItem,
    range?: vscode.Range,
    insertText?: string | vscode.SnippetString,
): void {
    if (range) {
        item.range = range;
    }

    if (insertText) {
        item.insertText = insertText;
    }
}

function buildSymbolInvocationSnippet(
    symbol: PbSymbol,
): vscode.SnippetString | undefined {
    if (!isCallableSymbol(symbol)) {
        return undefined;
    }

    const signature = symbol.signature?.trim();

    if (!signature) {
        return undefined;
    }

    return buildCallableSnippet(
        symbol.name,
        extractSignatureParameters(signature),
    );
}

function buildSystemInvocationSnippet(
    entry: PbSystemSymbolEntry,
): vscode.SnippetString | undefined {
    if (entry.kind !== 'callable') {
        return undefined;
    }

    const signature = entry.signatures[0];

    return buildCallableSnippet(
        entry.name,
        signature ? getSystemSignatureParameterLabels(signature) : [],
    );
}

function buildCallableSnippet(
    name: string,
    parameterLabels: readonly string[],
): vscode.SnippetString {
    const snippet = new vscode.SnippetString();

    snippet.appendText(name);
    snippet.appendText('(');

    parameterLabels.forEach((parameterLabel, index) => {
        if (index > 0) {
            snippet.appendText(', ');
        }

        snippet.appendPlaceholder(
            normalizeInvocationPlaceholder(parameterLabel, index),
        );
    });

    snippet.appendText(')');

    return snippet;
}

function normalizeInvocationPlaceholder(
    parameterLabel: string,
    index: number,
): string {
    const identifierMatches = parameterLabel.match(/[a-zA-Z_$#%][\w$#%`-]*/g);
    const candidate = identifierMatches?.[identifierMatches.length - 1]?.replace(/\[\]$/, '');

    return candidate && candidate.trim().length > 0
        ? candidate
        : `arg${index + 1}`;
}

function extractSignatureParameters(signatureLabel: string): string[] {
    const openParen = signatureLabel.indexOf('(');
    const closeParen = signatureLabel.lastIndexOf(')');

    if (openParen < 0 || closeParen <= openParen) {
        return [];
    }

    const content = signatureLabel.slice(openParen + 1, closeParen).trim();

    if (!content) {
        return [];
    }

    const parameters: string[] = [];
    let current = '';
    let depth = 0;
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = 0; index < content.length; index++) {
        const character = content[index];

        if (stringDelimiter) {
            current += character;

            if (character === '~') {
                current += content[index + 1] ?? '';
                index++;
                continue;
            }

            if (character === stringDelimiter) {
                stringDelimiter = undefined;
            }

            continue;
        }

        if (character === '"' || character === '\'') {
            stringDelimiter = character;
            current += character;
            continue;
        }

        if (character === '(') {
            depth++;
            current += character;
            continue;
        }

        if (character === ')') {
            depth = Math.max(0, depth - 1);
            current += character;
            continue;
        }

        if (character === ',' && depth === 0) {
            const parameter = current.trim();

            if (parameter) {
                parameters.push(parameter);
            }

            current = '';
            continue;
        }

        current += character;
    }

    const parameter = current.trim();

    if (parameter) {
        parameters.push(parameter);
    }

    return parameters;
}

function isCallableSymbol(symbol: PbSymbol): boolean {
    return symbol.kind === 'function'
        || symbol.kind === 'global-function'
        || symbol.kind === 'subroutine';
}