import {
    createPowerScriptLexingState,
    getPowerBuilderEscapeSequenceLength,
    PowerScriptLexingState,
} from './powerScriptLexingUtils';

export interface PowerScriptStatementScanState {
    readonly lexingState: PowerScriptLexingState;
}

export interface PowerScriptStatement {
    text: string;
    line: number;
    startColumn: number;
    endColumn: number;
    indexOnLine: number;
}

export function createPowerScriptStatementScanState(): PowerScriptStatementScanState {
    return {
        lexingState: createPowerScriptLexingState(),
    };
}

export function splitPowerBuilderStatements(
    line: string,
    lineNumber = 0,
    state: PowerScriptStatementScanState = createPowerScriptStatementScanState(),
): PowerScriptStatement[] {
    const statements: PowerScriptStatement[] = [];

    let currentRaw = '';
    let currentRawStartColumn = 0;
    let currentStatementIndex = 0;
    let index = 0;
    let quoteChar = state.lexingState.quoteChar;

    while (index < line.length) {
        const ch = line[index];
        const prev = index > 0 ? line[index - 1] : '';
        const next = index + 1 < line.length ? line[index + 1] : '';

        if (state.lexingState.blockCommentDepth > 0) {
            if (ch === '/' && next === '*') {
                state.lexingState.blockCommentDepth++;
                index += 2;
                continue;
            }

            if (ch === '*' && next === '/') {
                state.lexingState.blockCommentDepth = Math.max(
                    0,
                    state.lexingState.blockCommentDepth - 1,
                );
                index += 2;
                continue;
            }

            index++;
            continue;
        }

        if (quoteChar) {
            const escapeLength = getPowerBuilderEscapeSequenceLength(line, index);

            if (escapeLength > 0) {
                currentRaw += line.slice(index, index + escapeLength);
                index += escapeLength;
                continue;
            }

            currentRaw += ch;

            if (ch === quoteChar && next === quoteChar) {
                currentRaw += next;
                index += 2;
                continue;
            }

            if (ch === quoteChar) {
                quoteChar = undefined;
                state.lexingState.quoteChar = undefined;
            }

            index++;
            continue;
        }

        if (ch === '/' && next === '/') {
            break;
        }

        if (ch === '/' && next === '*') {
            state.lexingState.blockCommentDepth++;
            index += 2;
            continue;
        }

        if (ch === '\'' || ch === '"') {
            quoteChar = ch;
            state.lexingState.quoteChar = quoteChar;
            currentRaw += ch;
            index++;
            continue;
        }

        if (
            isStatementSeparator(
                line,
                index,
                ch,
                prev,
                next,
            )
        ) {
            pushStatement(
                statements,
                currentRaw,
                currentRawStartColumn,
                lineNumber,
                currentStatementIndex,
            );

            currentRaw = '';
            currentRawStartColumn = index + 1;
            currentStatementIndex++;
            index++;
            continue;
        }

        currentRaw += ch;
        index++;
    }

    pushStatement(
        statements,
        currentRaw,
        currentRawStartColumn,
        lineNumber,
        currentStatementIndex,
    );

    return statements;
}

function isStatementSeparator(
    line: string,
    index: number,
    ch: string,
    prev: string,
    next: string,
): boolean {
    if (ch === ';') {
        return true;
    }

    if (ch !== ':') {
        return false;
    }

    if (prev === ':' || next === ':') {
        return false;
    }

    return hasNonWhitespaceAhead(line, index + 1);
}

function hasNonWhitespaceAhead(line: string, startIndex: number): boolean {
    for (let index = startIndex; index < line.length; index++) {
        if (!/\s/.test(line[index])) {
            return true;
        }
    }

    return false;
}

function pushStatement(
    statements: PowerScriptStatement[],
    rawText: string,
    rawStartColumn: number,
    lineNumber: number,
    indexOnLine: number,
): void {
    const firstNonWhitespace = rawText.search(/\S/);

    if (firstNonWhitespace < 0) {
        return;
    }

    const lastNonWhitespace = findLastNonWhitespaceIndex(rawText);

    if (lastNonWhitespace < firstNonWhitespace) {
        return;
    }

    const text = rawText.slice(
        firstNonWhitespace,
        lastNonWhitespace + 1,
    );

    statements.push({
        text,
        line: lineNumber,
        startColumn: rawStartColumn + firstNonWhitespace,
        endColumn: rawStartColumn + lastNonWhitespace + 1,
        indexOnLine,
    });
}

function findLastNonWhitespaceIndex(value: string): number {
    for (let index = value.length - 1; index >= 0; index--) {
        if (!/\s/.test(value[index])) {
            return index;
        }
    }

    return -1;
}