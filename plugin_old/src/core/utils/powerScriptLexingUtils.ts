export interface PowerScriptLexingState {
    blockCommentDepth: number;
    quoteChar?: PowerScriptQuoteChar;
}

export type PowerScriptQuoteChar = '\'' | '"';

const COMMON_POWERBUILDER_ESCAPE_CHARS = new Set([
    'n',
    't',
    'v',
    'r',
    'f',
    'b',
    '"',
    '\'',
    '~',
]);

export function createPowerScriptLexingState(): PowerScriptLexingState {
    return {
        blockCommentDepth: 0,
        quoteChar: undefined,
    };
}

export function getPowerBuilderEscapeSequenceLength(
    text: string,
    index: number,
): number {
    if (text[index] !== '~') {
        return 0;
    }

    const next = index + 1 < text.length ? text[index + 1] : '';

    if (!next) {
        return 0;
    }

    if (COMMON_POWERBUILDER_ESCAPE_CHARS.has(next.toLowerCase())) {
        return 2;
    }

    if ((next === 'h' || next === 'H') && /^[0-9a-fA-F]{2}$/.test(text.slice(index + 2, index + 4))) {
        return 4;
    }

    if ((next === 'o' || next === 'O') && /^[0-7]{3}$/.test(text.slice(index + 2, index + 5))) {
        return 5;
    }

    if (/^\d{3}$/.test(text.slice(index + 1, index + 4))) {
        return 4;
    }

    return 0;
}

export function advancePastPowerBuilderString(
    text: string,
    startIndex: number,
    quoteChar: PowerScriptQuoteChar,
): number {
    let index = startIndex;

    while (index < text.length) {
        const ch = text[index];
        const next = index + 1 < text.length ? text[index + 1] : '';
        const escapeLength = getPowerBuilderEscapeSequenceLength(text, index);

        if (escapeLength > 0) {
            index += escapeLength;
            continue;
        }

        if (ch === quoteChar && next === quoteChar) {
            index += 2;
            continue;
        }

        if (ch === quoteChar) {
            return index + 1;
        }

        index++;
    }

    return text.length;
}

export function endsWithPowerScriptContinuation(line: string): boolean {
    return line.trimEnd().endsWith('&');
}

export function stripPowerScriptContinuation(line: string): string {
    const trimmedLine = line.trimEnd();

    if (!trimmedLine.endsWith('&')) {
        return line;
    }

    return trimmedLine.slice(0, -1);
}

export function stripCommentsFromLine(
    line: string,
    state: PowerScriptLexingState = createPowerScriptLexingState(),
): string {
    return stripCommentsFromLineDetailed(line, state).code;
}

export function stripCommentsFromLines(lines: string[]): string[] {
    const state = createPowerScriptLexingState();

    return lines.map(line => stripCommentsFromLine(line, state));
}

export function createCodeMask(text: string): Uint8Array {
    const mask = new Uint8Array(text.length);

    let index = 0;
    let blockCommentDepth = 0;

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
                blockCommentDepth = Math.max(0, blockCommentDepth - 1);
                index += 2;
                continue;
            }

            index++;
            continue;
        }

        if (ch === '/' && next === '*') {
            blockCommentDepth++;
            index += 2;
            continue;
        }

        if (ch === '/' && next === '/') {
            index += 2;

            while (
                index < text.length &&
                text[index] !== '\n' &&
                text[index] !== '\r'
            ) {
                index++;
            }

            continue;
        }

        if (ch === '\'') {
            index = advancePastPowerBuilderString(text, index + 1, ch);
            continue;
        }

        if (ch === '"') {
            index = advancePastPowerBuilderString(text, index + 1, ch);
            continue;
        }

        mask[index] = 1;
        index++;
    }

    return mask;
}

export function isCodeRange(
    mask: Uint8Array,
    start: number,
    length: number,
): boolean {
    for (let index = start; index < start + length; index++) {
        if (mask[index] !== 1) {
            return false;
        }
    }

    return true;
}

function stripCommentsFromLineDetailed(
    line: string,
    state: PowerScriptLexingState,
): {
    code: string;
    blockCommentDepth: number;
} {
    let code = '';
    let index = 0;
    let quoteChar = state.quoteChar;

    while (index < line.length) {
        const ch = line[index];
        const next = index + 1 < line.length ? line[index + 1] : '';

        if (state.blockCommentDepth > 0) {
            if (ch === '/' && next === '*') {
                state.blockCommentDepth++;
                index += 2;
                continue;
            }

            if (ch === '*' && next === '/') {
                state.blockCommentDepth = Math.max(
                    0,
                    state.blockCommentDepth - 1,
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
                code += line.slice(index, index + escapeLength);
                index += escapeLength;
                continue;
            }

            code += ch;

            if (ch === quoteChar && next === quoteChar) {
                code += next;
                index += 2;
                continue;
            }

            if (ch === quoteChar) {
                quoteChar = undefined;
                state.quoteChar = undefined;
            }

            index++;
            continue;
        }

        if (ch === '/' && next === '/') {
            break;
        }

        if (ch === '/' && next === '*') {
            state.blockCommentDepth++;
            index += 2;
            continue;
        }

        if (ch === '\'' || ch === '"') {
            quoteChar = ch;
            state.quoteChar = quoteChar;
        }

        code += ch;
        index++;
    }

    return {
        code,
        blockCommentDepth: state.blockCommentDepth,
    };
}