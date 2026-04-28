import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { getConfig, PowerBuilderFormatterConfig } from '../../../core/config/extensionConfiguration';
import { endsWithPowerScriptContinuation } from '../../../core/utils/powerScriptLexingUtils';
import { isIdeSafePowerBuilderDocument } from '../../../core/utils/powerBuilderFileUtils';
import { isLikelySqlStarter } from '../../../core/utils/powerScriptSqlUtils';
import {
    getExecutableBlockCloseKind,
    getExecutableBlockOpenKind,
    getStructureBlockCloseKind,
    getStructureBlockOpenKind,
    isCatchStatement,
    isElseIfStatement,
    isElseStatement,
    isFinallyStatement,
} from '../../../powerbuilder/grammar/pbLanguageGrammar';
import { SymbolIndex } from '../../../powerbuilder/indexing/symbolIndex';
import { formatPowerBuilderText, PowerBuilderFormattingOptions } from './formatPowerBuilderDocument';
import { getDocumentFormattingConfig } from './resolveDocumentFormattingConfig';

export function registerFormatting(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const documentProvider = vscode.languages.registerDocumentFormattingEditProvider(
        PB_SELECTOR,
        {
            async provideDocumentFormattingEdits(document, _options, _token): Promise<vscode.TextEdit[]> {
                const config = await getRuntimeFormattingConfig(document);

                if (!shouldFormatDocument(document, config)) {
                    return [];
                }

                return buildDocumentFormattingEdits(document, config.formatting);
            },
        },
    );

    const rangeProvider = vscode.languages.registerDocumentRangeFormattingEditProvider(
        PB_SELECTOR,
        {
            async provideDocumentRangeFormattingEdits(document, range, _options, _token): Promise<vscode.TextEdit[]> {
                const config = await getRuntimeFormattingConfig(document);

                if (!shouldFormatDocument(document, config) || !config.formatting.formatRange) {
                    return [];
                }

                return buildRangeFormattingEdits(document, range, config.formatting);
            },
        },
    );

    const onTypeProvider = vscode.languages.registerOnTypeFormattingEditProvider(
        PB_SELECTOR,
        {
            async provideOnTypeFormattingEdits(document, position, _character, _options, _token): Promise<vscode.TextEdit[]> {
                const config = await getRuntimeFormattingConfig(document);

                if (!shouldFormatDocument(document, config) || !config.formatting.formatOnType) {
                    return [];
                }

                return buildRangeFormattingEdits(
                    document,
                    new vscode.Range(position.line, 0, position.line, document.lineAt(position.line).text.length),
                    config.formatting,
                );
            },
        },
        ';',
        ')',
        ',',
    );

    const formatOnSaveDisposable = vscode.workspace.onWillSaveTextDocument(event => {
        event.waitUntil((async () => {
            const config = await getRuntimeFormattingConfig(event.document);

            if (!shouldFormatDocument(event.document, config) || !config.formatting.formatOnSave) {
                return [];
            }

            return buildDocumentFormattingEdits(event.document, config.formatting);
        })());
    });

    return [documentProvider, rangeProvider, onTypeProvider, formatOnSaveDisposable];
}

function shouldFormatDocument(document: vscode.TextDocument, config: ReturnType<typeof getConfig>): boolean {
    if (!config.formatting.enabled) {
        return false;
    }

    return isIdeSafePowerBuilderDocument(document, config.dataWindowExperimentalIdeEnabled);
}

function buildDocumentFormattingEdits(
    document: vscode.TextDocument,
    formatting: PowerBuilderFormatterConfig,
): vscode.TextEdit[] {
    const originalText = document.getText();
    const formattedText = formatPowerBuilderText(
        originalText,
        createFormattingOptions(formatting),
        createFormattingContext(),
        getDocumentEol(document),
    );

    if (formattedText === originalText) {
        return [];
    }

    return [vscode.TextEdit.replace(getFullDocumentRange(document), formattedText)];
}

function buildRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
    formatting: PowerBuilderFormatterConfig,
): vscode.TextEdit[] {
    const expandedRange = expandFormattingRange(document, range);
    const prefixRange = new vscode.Range(new vscode.Position(0, 0), expandedRange.start);
    const prefixText = document.getText(prefixRange);
    const selectedText = document.getText(expandedRange);
    const options = createFormattingOptions(formatting);
    const context = createFormattingContext();
    const eol = getDocumentEol(document);
    const formattedPrefix = prefixText.length > 0
        ? formatPowerBuilderText(prefixText, options, context, eol)
        : '';
    const formattedPrefixAndSelection = formatPowerBuilderText(
        `${prefixText}${selectedText}`,
        options,
        context,
        eol,
    );
    const formattedSelection = formattedPrefixAndSelection.slice(formattedPrefix.length);

    if (formattedSelection === selectedText) {
        return [];
    }

    return [vscode.TextEdit.replace(expandedRange, formattedSelection)];
}

function createFormattingOptions(formatting: PowerBuilderFormatterConfig): PowerBuilderFormattingOptions {
    return {
        indentSize: formatting.indentSize,
        continuationIndentSize: formatting.continuationIndentSize,
        indentStyle: formatting.indentStyle,
        keywordCase: formatting.keywordCase,
        statementCase: formatting.statementCase,
        typeCase: formatting.typeCase,
        eventKeywordCase: formatting.eventKeywordCase,
        systemFunctionCase: formatting.systemFunctionCase,
        preserveUserIdentifierCase: formatting.preserveUserIdentifierCase,
        sqlKeywordCase: formatting.sqlKeywordCase,
        trimTrailingWhitespace: formatting.trimTrailingWhitespace,
        normalizeBlankLines: formatting.normalizeBlankLines,
        spacesInsideParentheses: formatting.spacesInsideParentheses,
        oneStatementPerLine: formatting.oneStatementPerLine,
        spaceAfterComma: formatting.spaceAfterComma,
        spaceAroundOperators: formatting.spaceAroundOperators,
        blankLineBetweenSections: formatting.blankLineBetweenSections,
        preserveComments: formatting.preserveComments,
        preserveStrings: formatting.preserveStrings,
        preserveManualLineBreaksInSql: formatting.preserveManualLineBreaksInSql,
        conservativeEmbeddedSqlFormatting: formatting.conservativeEmbeddedSqlFormatting,
    };
}

function createFormattingContext() {
    return {
        isUserCallable: (name: string) => SymbolIndex.getInstance().findSymbolByName(name).some(symbol =>
            symbol.kind === 'function' ||
            symbol.kind === 'global-function' ||
            symbol.kind === 'subroutine' ||
            symbol.kind === 'event',
        ),
    };
}

function expandFormattingRange(document: vscode.TextDocument, range: vscode.Range): vscode.Range {
    let startLine = range.start.line;
    let endLine = range.end.line;

    if (range.end.character === 0 && range.end.line > range.start.line) {
        endLine = Math.max(startLine, endLine - 1);
    }

    ({ startLine, endLine } = expandContinuationBoundaries(document, startLine, endLine));
    ({ startLine, endLine } = expandSqlBoundaries(document, startLine, endLine));

    const start = new vscode.Position(startLine, 0);

    if (endLine + 1 < document.lineCount) {
        return new vscode.Range(start, new vscode.Position(endLine + 1, 0));
    }

    return new vscode.Range(start, document.lineAt(endLine).rangeIncludingLineBreak.end);
}

function expandContinuationBoundaries(
    document: vscode.TextDocument,
    startLine: number,
    endLine: number,
): { startLine: number; endLine: number } {
    let expandedStart = startLine;
    let expandedEnd = endLine;

    while (expandedStart > 0 && endsWithPowerScriptContinuation(document.lineAt(expandedStart - 1).text)) {
        expandedStart--;
    }

    while (expandedEnd + 1 < document.lineCount && endsWithPowerScriptContinuation(document.lineAt(expandedEnd).text)) {
        expandedEnd++;
    }

    return {
        startLine: expandedStart,
        endLine: expandedEnd,
    };
}

function expandSqlBoundaries(
    document: vscode.TextDocument,
    startLine: number,
    endLine: number,
): { startLine: number; endLine: number } {
    let blockStart = startLine;
    let blockEnd = endLine;

    while (blockStart > 0 && isPotentialSqlLine(document.lineAt(blockStart - 1).text)) {
        blockStart--;

        if (/;\s*$/.test(document.lineAt(blockStart).text)) {
            blockStart++;
            break;
        }
    }

    while (blockEnd + 1 < document.lineCount && isPotentialSqlLine(document.lineAt(blockEnd + 1).text) && !/;\s*$/.test(document.lineAt(blockEnd).text)) {
        blockEnd++;
    }

    const hasSqlStarter = collectLineRange(blockStart, blockEnd).some(line =>
        isLikelySqlStarter(document.lineAt(line).text.trim()),
    );

    return hasSqlStarter
        ? { startLine: blockStart, endLine: blockEnd }
        : { startLine, endLine };
}

function isPotentialSqlLine(text: string): boolean {
    const trimmed = text.trim();

    if (!trimmed) {
        return false;
    }

    return !isPowerBuilderControlLikeLine(trimmed);
}

function isPowerBuilderControlLikeLine(trimmedLine: string): boolean {
    return !!(
        getStructureBlockOpenKind(trimmedLine) ||
        getStructureBlockCloseKind(trimmedLine) ||
        getExecutableBlockOpenKind(trimmedLine) ||
        getExecutableBlockCloseKind(trimmedLine) ||
        isElseStatement(trimmedLine) ||
        isElseIfStatement(trimmedLine) ||
        isCatchStatement(trimmedLine) ||
        isFinallyStatement(trimmedLine)
    );
}

function collectLineRange(startLine: number, endLine: number): number[] {
    const lines: number[] = [];

    for (let line = startLine; line <= endLine; line++) {
        lines.push(line);
    }

    return lines;
}

function getDocumentEol(document: vscode.TextDocument): string {
    return document.eol === vscode.EndOfLine.CRLF
        ? '\r\n'
        : '\n';
}

function getFullDocumentRange(document: vscode.TextDocument): vscode.Range {
    return new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(document.lineCount, 0),
    );
}

async function getRuntimeFormattingConfig(document: vscode.TextDocument): Promise<ReturnType<typeof getConfig>> {
    const config = getConfig();
    const formatting = await getDocumentFormattingConfig(document);

    return {
        ...config,
        formatting,
        formattingEnabled: formatting.enabled,
        formattingIndentSize: formatting.indentSize,
        formattingKeywordCase: formatting.keywordCase,
        formattingDeclarationKeywordCase: formatting.typeCase,
        formattingSystemFunctionCase: formatting.systemFunctionCase,
        formattingSqlKeywordCase: formatting.sqlKeywordCase,
        formattingTrimTrailingWhitespace: formatting.trimTrailingWhitespace,
        formattingNormalizeBlankLines: formatting.normalizeBlankLines,
        formattingExperimentalSpaceInsideParens: formatting.spacesInsideParentheses,
        formattingExperimentalSplitCollapsedStatements: formatting.oneStatementPerLine,
    };
}