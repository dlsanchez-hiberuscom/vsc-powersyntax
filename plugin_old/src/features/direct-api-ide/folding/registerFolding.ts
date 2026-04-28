import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import { getConfig } from '../../../core/config/extensionConfiguration';
import { isIdeSafePowerBuilderDocument } from '../../../core/utils/powerBuilderFileUtils';
import { advancePastPowerBuilderString } from '../../../core/utils/powerScriptLexingUtils';
import {
    createPowerScriptStatementScanState,
    splitPowerBuilderStatements,
} from '../../../core/utils/powerScriptStatementUtils';
import {
    END_PROTOTYPES_PATTERN,
    FORWARD_PROTOTYPES_START_PATTERN,
    PbStructureBlockKind,
    TYPE_PROTOTYPES_START_PATTERN,
    getStructureBlockCloseKind,
    getStructureBlockOpenKind,
} from '../../../powerbuilder/grammar/pbLanguageGrammar';

interface FoldingFrame {
    kind: PbStructureBlockKind;
    startLine: number;
}

export function registerFolding(_context: vscode.ExtensionContext): vscode.Disposable[] {
    const provider = vscode.languages.registerFoldingRangeProvider(PB_SELECTOR, {
        provideFoldingRanges(document, _context, _token): vscode.FoldingRange[] {
            if (!isIdeSafePowerBuilderDocument(document, getConfig().dataWindowExperimentalIdeEnabled)) {
                return [];
            }

            const ranges: vscode.FoldingRange[] = collectCommentFoldingRanges(document);
            const stack: FoldingFrame[] = [];
            const statementScanState = createPowerScriptStatementScanState();

            let inForwardPrototypes = false;
            let inTypePrototypes = false;

            for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
                const rawLine = document.lineAt(lineIndex).text;

                const statements = splitPowerBuilderStatements(
                    rawLine,
                    lineIndex,
                    statementScanState,
                );

                for (const statement of statements) {
                    const text = statement.text.trim();

                    if (!text) {
                        continue;
                    }

                    const closeKind = getStructureBlockCloseKind(text);

                    if (closeKind) {
                        const top = stack[stack.length - 1];

                        if (top && top.kind === closeKind) {
                            const frame = stack.pop()!;

                            if (frame.startLine < lineIndex) {
                                ranges.push(
                                    new vscode.FoldingRange(
                                        frame.startLine,
                                        lineIndex,
                                        vscode.FoldingRangeKind.Region,
                                    ),
                                );
                            }
                        }
                    }

                    const openKind = getStructureBlockOpenKind(
                        text,
                        {
                            treatCallableDeclarationsAsBlockOpen:
                                !(inForwardPrototypes || inTypePrototypes),
                        },
                    );

                    if (openKind) {
                        stack.push({
                            kind: openKind,
                            startLine: lineIndex,
                        });
                    }

                    updatePrototypeSectionState(
                        text,
                        () => {
                            inForwardPrototypes = true;
                            inTypePrototypes = false;
                        },
                        () => {
                            inTypePrototypes = true;
                        },
                        () => {
                            if (inForwardPrototypes) {
                                inForwardPrototypes = false;
                            } else if (inTypePrototypes) {
                                inTypePrototypes = false;
                            }
                        },
                    );
                }
            }

            return ranges;
        },
    });

    return [provider];
}

function collectCommentFoldingRanges(
    document: vscode.TextDocument,
): vscode.FoldingRange[] {
    const ranges: vscode.FoldingRange[] = [];
    const text = document.getText();

    let index = 0;
    let blockCommentDepth = 0;
    let blockCommentStartOffset = -1;

    while (index < text.length) {
        const ch = text[index];
        const next = index + 1 < text.length ? text[index + 1] : '';

        if (blockCommentDepth > 0) {
            if (ch === '/' && next === '*') {
                blockCommentDepth++;
                index += 2;
                continue;
            }

            if (ch === '*' && next === '/') {
                blockCommentDepth--;
                index += 2;

                if (blockCommentDepth === 0 && blockCommentStartOffset >= 0) {
                    const start = document.positionAt(blockCommentStartOffset);
                    const end = document.positionAt(index);

                    if (start.line < end.line) {
                        ranges.push(
                            new vscode.FoldingRange(
                                start.line,
                                end.line,
                                vscode.FoldingRangeKind.Comment,
                            ),
                        );
                    }

                    blockCommentStartOffset = -1;
                }

                continue;
            }

            index++;
            continue;
        }

        if (ch === '/' && next === '*') {
            blockCommentDepth = 1;
            blockCommentStartOffset = index;
            index += 2;
            continue;
        }

        if (ch === '"' || ch === '\'') {
            index = advancePastPowerBuilderString(text, index + 1, ch);
            continue;
        }

        index++;
    }

    if (blockCommentDepth > 0 && blockCommentStartOffset >= 0) {
        const start = document.positionAt(blockCommentStartOffset);
        const end = document.positionAt(text.length);

        if (start.line < end.line) {
            ranges.push(
                new vscode.FoldingRange(
                    start.line,
                    end.line,
                    vscode.FoldingRangeKind.Comment,
                ),
            );
        }
    }

    return ranges;
}

function updatePrototypeSectionState(
    statement: string,
    onForwardPrototypesStart: () => void,
    onTypePrototypesStart: () => void,
    onPrototypesEnd: () => void,
): void {
    if (FORWARD_PROTOTYPES_START_PATTERN.test(statement)) {
        onForwardPrototypesStart();
        return;
    }

    if (TYPE_PROTOTYPES_START_PATTERN.test(statement)) {
        onTypePrototypesStart();
        return;
    }

    if (END_PROTOTYPES_PATTERN.test(statement)) {
        onPrototypesEnd();
    }
}