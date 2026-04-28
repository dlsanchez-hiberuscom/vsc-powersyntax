import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { getConfig } from '../../../core/config/extensionConfiguration';
import {
    formatReplaceObsoleteRuntimeFunctionEs,
    PB_USER_MESSAGES,
} from '../../../core/i18n/pbUserMessages';
import { isIdeSafePowerBuilderDocument } from '../../../core/utils/powerBuilderFileUtils';
import { stripCommentsFromLine } from '../../../core/utils/powerScriptLexingUtils';
import {
    getExecutableBlockCloseKind,
    getExecutableBlockOpenKind,
    getStructureBlockCloseKind,
    isTransitionStatement,
} from '../../../powerbuilder/grammar/pbLanguageGrammar';
import { resolveReplacement } from '../../../powerbuilder/knowledge/services/queryService';

export function registerCodeActions(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const provider = vscode.languages.registerCodeActionsProvider(
        PB_SELECTOR,
        {
            provideCodeActions(document, _range, context, _token): vscode.CodeAction[] {
                if (!isIdeSafePowerBuilderDocument(document, getConfig().dataWindowExperimentalIdeEnabled)) {
                    return [];
                }

                const actions: vscode.CodeAction[] = [];

                for (const diagnostic of context.diagnostics) {
                    if (diagnostic.code === 'pb-unclosed-if') {
                        actions.push(createInsertFix(
                            document,
                            diagnostic,
                            PB_USER_MESSAGES.codeActions.insertEndIf,
                            'END IF',
                        ));
                    }

                    if (diagnostic.code === 'pb-unclosed-for') {
                        actions.push(createInsertFix(
                            document,
                            diagnostic,
                            PB_USER_MESSAGES.codeActions.insertNext,
                            'NEXT',
                        ));
                    }

                    if (diagnostic.code === 'pb-unclosed-do') {
                        actions.push(createInsertFix(
                            document,
                            diagnostic,
                            PB_USER_MESSAGES.codeActions.insertLoop,
                            'LOOP',
                        ));
                    }

                    if (diagnostic.code === 'pb-unclosed-try') {
                        actions.push(createInsertFix(
                            document,
                            diagnostic,
                            PB_USER_MESSAGES.codeActions.insertEndTry,
                            'END TRY',
                        ));
                    }

                    if (diagnostic.code === 'pb-unclosed-choose-case') {
                        actions.push(createInsertFix(
                            document,
                            diagnostic,
                            PB_USER_MESSAGES.codeActions.insertEndChoose,
                            'END CHOOSE',
                        ));
                    }

                    if (diagnostic.code === 'pb-obsolete-runtime-function') {
                        const legacyName = document.getText(diagnostic.range);
                        const replacement = resolveReplacement(legacyName);

                        if (replacement) {
                            actions.push(createReplaceFix(
                                document,
                                diagnostic,
                                formatReplaceObsoleteRuntimeFunctionEs(legacyName, replacement),
                                replacement,
                            ));
                        }
                    }
                }

                return actions;
            },
        },
        {
            providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
        },
    );

    return [provider];
}

function createInsertFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    title: string,
    closingKeyword: string,
): vscode.CodeAction {
    const fix = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    fix.diagnostics = [diagnostic];
    fix.isPreferred = true;
    fix.edit = new vscode.WorkspaceEdit();

    const openLine = diagnostic.range.start.line;
    const insertLine = findInsertLine(document, openLine);
    const indent = getIndentation(document.lineAt(openLine).text);
    const endOfLine = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';

    fix.edit.insert(
        document.uri,
        new vscode.Position(insertLine, 0),
        `${indent}${closingKeyword}${endOfLine}`,
    );

    return fix;
}

function createReplaceFix(
    document: vscode.TextDocument,
    diagnostic: vscode.Diagnostic,
    title: string,
    replacementText: string,
): vscode.CodeAction {
    const fix = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
    fix.diagnostics = [diagnostic];
    fix.isPreferred = true;
    fix.edit = new vscode.WorkspaceEdit();
    fix.edit.replace(document.uri, diagnostic.range, replacementText);
    return fix;
}

function findInsertLine(document: vscode.TextDocument, startLine: number): number {
    const openIndentation = getIndentation(document.lineAt(startLine).text);
    let bodyIndentationLength: number | undefined;
    let nestedExecutableDepth = 0;

    for (let i = startLine + 1; i < document.lineCount; i++) {
        const rawLine = document.lineAt(i).text;
        const statement = stripCommentsFromLine(rawLine).trim();
        const lineIndentationLength = getIndentation(rawLine).length;

        if (!statement) {
            continue;
        }

        if (isTransitionStatement(statement)) {
            continue;
        }

        const executableCloseKind = getExecutableBlockCloseKind(statement);

        if (executableCloseKind) {
            if (nestedExecutableDepth > 0) {
                nestedExecutableDepth--;
                continue;
            }

            return i;
        }

        if (getStructureBlockCloseKind(statement)) {
            return i;
        }

        if (getExecutableBlockOpenKind(statement)) {
            nestedExecutableDepth++;
            continue;
        }

        if (nestedExecutableDepth !== 0) {
            continue;
        }

        if (
            bodyIndentationLength === undefined &&
            lineIndentationLength > openIndentation.length
        ) {
            bodyIndentationLength = lineIndentationLength;
            continue;
        }

        if (
            bodyIndentationLength !== undefined &&
            lineIndentationLength < bodyIndentationLength
        ) {
            return i;
        }
    }

    return document.lineCount;
}

function getIndentation(line: string): string {
    const match = line.match(/^(\s*)/);
    return match ? match[1] : '';
}