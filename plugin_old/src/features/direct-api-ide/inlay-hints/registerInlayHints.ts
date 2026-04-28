import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { getSignatureCallContextAtPosition } from '../../../powerbuilder/document/documentUtils';
import {
    PowerScriptDocumentModelCache,
    PowerScriptDocumentStatement,
    mapStatementOffsetToPosition,
} from '../../../powerbuilder/document/powerScriptDocumentModel';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import {
    getSystemSignatureParameterLabels,
    selectPreferredSystemSignatureIndex,
} from '../../../powerbuilder/knowledge/services/signatureService';
import { PbSystemSymbolEntry } from '../../../powerbuilder/knowledge/types';
import { PbSymbol } from '../../../powerbuilder/models/pbSymbol';
import { SemanticQueryService } from '../../../powerbuilder/semantic';
import { PowerBuilderProviderHost } from '../provider-host/powerBuilderProviderHost';

export function registerInlayHints(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const provider = vscode.languages.registerInlayHintsProvider(
        PB_SELECTOR,
        {
            provideInlayHints(document, range): vscode.InlayHint[] {
                return providePowerBuilderInlayHints(document, range);
            },
        },
    );

    return [provider];
}

export function providePowerBuilderInlayHints(
    document: vscode.TextDocument,
    range: vscode.Range,
    index: SymbolIndex = SymbolIndex.getInstance(),
): vscode.InlayHint[] {
    const host = new PowerBuilderProviderHost(index);

    return host.runWithDocument(
        document,
        {
            emptyValue: [],
            isFeatureEnabled: config => config.inlayHintsEnabled,
        },
        prepared => collectInlayHints(prepared.document, range, prepared.semanticQueries),
    );
}

interface StatementInvocation {
    closeParenOffset: number;
    argumentRanges: vscode.Range[];
}

function collectInlayHints(
    document: vscode.TextDocument,
    visibleRange: vscode.Range,
    semanticQueries: SemanticQueryService,
): vscode.InlayHint[] {
    const model = PowerScriptDocumentModelCache.getInstance().getModel(document);
    const hints: vscode.InlayHint[] = [];
    const seen = new Set<string>();

    for (const statement of model.statements) {
        if (!rangesIntersect(statement.range, visibleRange) || isCallableDeclarationStatement(statement.text)) {
            continue;
        }

        for (const invocation of collectStatementInvocations(statement)) {
            if (!invocation.argumentRanges.some(argumentRange => rangesIntersect(argumentRange, visibleRange))) {
                continue;
            }

            const anchorPosition = mapStatementOffsetToPosition(statement, invocation.closeParenOffset, 'start');
            const context = getSignatureCallContextAtPosition(document, anchorPosition);

            if (!context) {
                continue;
            }

            const parameterLabels = resolveParameterLabels(document, anchorPosition, context, semanticQueries);

            if (parameterLabels.length === 0) {
                continue;
            }

            invocation.argumentRanges.forEach((argumentRange, index) => {
                const parameterLabel = parameterLabels[index];

                if (!parameterLabel || !rangesIntersect(argumentRange, visibleRange)) {
                    return;
                }

                const key = `${argumentRange.start.line}:${argumentRange.start.character}:${parameterLabel}`;

                if (seen.has(key)) {
                    return;
                }

                seen.add(key);

                const hint = new vscode.InlayHint(
                    argumentRange.start,
                    `${parameterLabel}:`,
                    vscode.InlayHintKind.Parameter,
                );

                hint.paddingRight = true;
                hint.tooltip = `${context.name} · parámetro ${parameterLabel}`;
                hints.push(hint);
            });
        }
    }

    return hints;
}

function resolveParameterLabels(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: NonNullable<ReturnType<typeof getSignatureCallContextAtPosition>>,
    semanticQueries: SemanticQueryService,
): string[] {
    const signatureQuery = semanticQueries.resolveSignatureAtPosition({
        document,
        position,
        context,
    });

    if (signatureQuery.systemEntry) {
        return extractSystemParameterLabels(signatureQuery.systemEntry, context);
    }

    if (
        !signatureQuery.shouldProvideHelp
        || (signatureQuery.precision !== 'exact' && signatureQuery.precision !== 'compatible')
    ) {
        return [];
    }

    const stableSymbol = selectStableSymbol(signatureQuery.symbols, context.providedArgumentCount);

    if (!stableSymbol?.signature?.trim()) {
        return [];
    }

    return extractSignatureParameters(stableSymbol.signature)
        .map(extractParameterLabel)
        .filter((label): label is string => !!label);
}

function extractSystemParameterLabels(
    entry: PbSystemSymbolEntry,
    context: { providedArgumentCount: number; hasAnyArgumentText: boolean },
): string[] {
    if (entry.signatures.length === 0) {
        return [];
    }

    const activeSignature = selectPreferredSystemSignatureIndex(
        entry,
        context.providedArgumentCount,
        context.hasAnyArgumentText,
    );
    const signature = entry.signatures[activeSignature];
    const labels = signature.parameters?.length
        ? signature.parameters.map(parameter => parameter.label)
        : getSystemSignatureParameterLabels(signature);

    return labels
        .map(extractParameterLabel)
        .filter((label): label is string => !!label);
}

function selectStableSymbol(symbols: readonly PbSymbol[], providedArgumentCount: number): PbSymbol | undefined {
    if (symbols.length === 1) {
        return symbols[0];
    }

    const exactArityMatches = symbols.filter(symbol => {
        const signature = symbol.signature?.trim();

        if (!signature) {
            return false;
        }

        const parameterCount = symbol.parameterCount ?? extractSignatureParameters(signature).length;

        return parameterCount === providedArgumentCount;
    });

    return exactArityMatches.length === 1
        ? exactArityMatches[0]
        : undefined;
}

function collectStatementInvocations(statement: PowerScriptDocumentStatement): StatementInvocation[] {
    const invocations: StatementInvocation[] = [];
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = 0; index < statement.text.length; index++) {
        const character = statement.text[index];

        if (stringDelimiter) {
            if (character === '~') {
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
            continue;
        }

        if (character !== '(') {
            continue;
        }

        const closeParenOffset = findMatchingCloseParen(statement.text, index);

        if (closeParenOffset === undefined) {
            continue;
        }

        const argumentRanges = extractArgumentRanges(statement, index, closeParenOffset);

        if (argumentRanges.length === 0) {
            continue;
        }

        invocations.push({
            closeParenOffset,
            argumentRanges,
        });
    }

    return invocations;
}

function findMatchingCloseParen(text: string, openParenOffset: number): number | undefined {
    let depth = 0;
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = openParenOffset; index < text.length; index++) {
        const character = text[index];

        if (stringDelimiter) {
            if (character === '~') {
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
            continue;
        }

        if (character === '(') {
            depth++;
            continue;
        }

        if (character === ')') {
            depth--;

            if (depth === 0) {
                return index;
            }
        }
    }

    return undefined;
}

function extractArgumentRanges(
    statement: PowerScriptDocumentStatement,
    openParenOffset: number,
    closeParenOffset: number,
): vscode.Range[] {
    const ranges: vscode.Range[] = [];
    let stringDelimiter: '"' | '\'' | undefined;
    let depth = 0;
    let argumentStart = openParenOffset + 1;

    for (let index = openParenOffset + 1; index <= closeParenOffset; index++) {
        const character = statement.text[index] ?? ')';

        if (stringDelimiter) {
            if (character === '~') {
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
            continue;
        }

        if (character === '(') {
            depth++;
            continue;
        }

        if (character === ')') {
            if (depth > 0) {
                depth--;
                continue;
            }

            pushArgumentRange(statement, ranges, argumentStart, index);
            break;
        }

        if (character === ',' && depth === 0) {
            pushArgumentRange(statement, ranges, argumentStart, index);
            argumentStart = index + 1;
        }
    }

    return ranges;
}

function pushArgumentRange(
    statement: PowerScriptDocumentStatement,
    ranges: vscode.Range[],
    rawStart: number,
    rawEnd: number,
): void {
    let start = rawStart;
    let end = rawEnd;

    while (start < end && /\s/.test(statement.text[start])) {
        start++;
    }

    while (end > start && /\s/.test(statement.text[end - 1])) {
        end--;
    }

    if (end <= start) {
        return;
    }

    ranges.push(
        new vscode.Range(
            mapStatementOffsetToPosition(statement, start, 'start'),
            mapStatementOffsetToPosition(statement, end, 'end'),
        ),
    );
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

    return content
        .split(',')
        .map(parameter => parameter.trim())
        .filter(Boolean);
}

function extractParameterLabel(parameterSource: string): string | undefined {
    const cleaned = parameterSource
        .replace(/\b(ref|readonly)\b/gi, ' ')
        .trim();
    const match = cleaned.match(/([A-Za-z_][A-Za-z0-9_]*)\s*(?:\[[^\]]*\])?\s*$/);

    return match?.[1];
}

function isCallableDeclarationStatement(text: string): boolean {
    return /^\s*(?:public|private|protected)?\s*(?:function|subroutine|event)\b/i.test(text)
        || /^\s*on\b/i.test(text)
        || /^\s*forward\b/i.test(text);
}

function rangesIntersect(left: vscode.Range, right: vscode.Range): boolean {
    return left.start.isBeforeOrEqual(right.end) && right.start.isBeforeOrEqual(left.end);
}