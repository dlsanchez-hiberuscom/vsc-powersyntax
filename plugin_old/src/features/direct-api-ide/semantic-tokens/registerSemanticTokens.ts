import * as vscode from 'vscode';
import { PB_SELECTOR } from '../../../core/config/constants';
import {
    advancePastPowerBuilderString,
    createCodeMask,
    isCodeRange,
} from '../../../core/utils/powerScriptLexingUtils';
import {
    createPowerScriptStatementScanState,
    PowerScriptStatement,
    splitPowerBuilderStatements,
} from '../../../core/utils/powerScriptStatementUtils';
import { getSymbolContextAtPosition } from '../../../powerbuilder/document/documentUtils';
import {
    EVENT_PATTERN,
    FUNCTION_PATTERN,
    NESTED_TYPE_PATTERN,
    ON_EVENT_PATTERN,
    QUALIFIED_EVENT_PATTERN,
    ROOT_TYPE_PATTERN,
    STRUCTURE_PATTERN,
    SUBROUTINE_PATTERN,
    createPbKeywordPattern,
} from '../../../powerbuilder/grammar/pbLanguageGrammar';
import { PB_IDENTIFIER_SOURCE } from '../../../powerbuilder/grammar/pbIdentifier';
import { PbSymbol } from '../../../powerbuilder/models/pbSymbol';
import { PowerBuilderProviderHost, PreparedPowerBuilderDocument } from '../provider-host/powerBuilderProviderHost';

const TOKEN_TYPES = [
    'type',
    'function',
    'variable',
    'keyword',
    'comment',
    'string',
    'number',
    'operator',
    'parameter',
    'event',
] as const;

const TOKEN_MODIFIERS = [
    'declaration',
    'definition',
    'readonly',
    'static',
    'local',
    'instance',
    'shared',
    'global',
] as const;

const TOKEN_TYPE_INDEX = {
    type: 0,
    function: 1,
    variable: 2,
    keyword: 3,
    comment: 4,
    string: 5,
    number: 6,
    operator: 7,
    parameter: 8,
    event: 9,
} as const;

const TOKEN_MODIFIER_MASK = {
    declaration: 1 << 0,
    definition: 1 << 1,
    readonly: 1 << 2,
    static: 1 << 3,
    local: 1 << 4,
    instance: 1 << 5,
    shared: 1 << 6,
    global: 1 << 7,
} as const;

const legend = new vscode.SemanticTokensLegend(
    [...TOKEN_TYPES],
    [...TOKEN_MODIFIERS],
);

const NUMBER_PATTERN = /\b\d+(?:\.\d+)?\b/g;
const OPERATOR_PATTERN = /::|<=|>=|<>|[=+\-*/(),.[\]]/g;
const IDENTIFIER_PATTERN = new RegExp(PB_IDENTIFIER_SOURCE, 'gi');

interface SemanticTokenEntry {
    line: number;
    character: number;
    length: number;
    tokenType: number;
    tokenModifiers: number;
}

export function registerSemanticTokens(
    _context: vscode.ExtensionContext,
): vscode.Disposable[] {
    const host = new PowerBuilderProviderHost();
    const provider = vscode.languages.registerDocumentSemanticTokensProvider(
        PB_SELECTOR,
        {
            provideDocumentSemanticTokens(
                document,
                _token,
            ): vscode.SemanticTokens {
                return host.runWithDocument(
                    document,
                    {
                        emptyValue: new vscode.SemanticTokensBuilder(legend).build(),
                    },
                    prepared => {
                        const builder = new vscode.SemanticTokensBuilder(legend);
                        const entries = buildSemanticTokens(prepared);

                        for (const entry of entries) {
                            builder.push(
                                entry.line,
                                entry.character,
                                entry.length,
                                entry.tokenType,
                                entry.tokenModifiers,
                            );
                        }

                        return builder.build();
                    },
                );
            },
        },
        legend,
    );

    return [provider];
}

function buildSemanticTokens(
    prepared: PreparedPowerBuilderDocument,
): SemanticTokenEntry[] {
    const { document } = prepared;
    const entries: SemanticTokenEntry[] = [];
    const text = document.getText();
    const codeMask = createCodeMask(text);

    emitCommentAndStringTokens(document, text, entries);
    emitNumberTokens(document, text, codeMask, entries);
    emitOperatorTokens(document, text, codeMask, entries);
    emitStatementSemanticTokens(document, entries);
    emitScopedVariableTokens(prepared, text, codeMask, entries);

    return sortAndDedupeTokens(entries);
}

function emitCommentAndStringTokens(
    document: vscode.TextDocument,
    text: string,
    entries: SemanticTokenEntry[],
): void {
    let index = 0;
    let blockCommentDepth = 0;
    let blockCommentStart = -1;

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

                if (blockCommentDepth === 0 && blockCommentStart >= 0) {
                    pushMultilineTokenByOffsets(
                        document,
                        blockCommentStart,
                        index,
                        TOKEN_TYPE_INDEX.comment,
                        0,
                        entries,
                    );

                    blockCommentStart = -1;
                }

                continue;
            }

            index++;
            continue;
        }

        if (ch === '/' && next === '*') {
            blockCommentDepth = 1;
            blockCommentStart = index;
            index += 2;
            continue;
        }

        if (ch === '/' && next === '/') {
            const lineEnd = findLineEnd(text, index);

            pushMultilineTokenByOffsets(
                document,
                index,
                lineEnd,
                TOKEN_TYPE_INDEX.comment,
                0,
                entries,
            );

            index = lineEnd;
            continue;
        }

        if (ch === '\'' || ch === '"') {
            const stringEnd = advancePastPowerBuilderString(text, index + 1, ch);

            pushMultilineTokenByOffsets(
                document,
                index,
                stringEnd,
                TOKEN_TYPE_INDEX.string,
                0,
                entries,
            );

            index = stringEnd;
            continue;
        }

        index++;
    }

    if (blockCommentDepth > 0 && blockCommentStart >= 0) {
        pushMultilineTokenByOffsets(
            document,
            blockCommentStart,
            text.length,
            TOKEN_TYPE_INDEX.comment,
            0,
            entries,
        );
    }
}

function emitNumberTokens(
    document: vscode.TextDocument,
    text: string,
    codeMask: Uint8Array,
    entries: SemanticTokenEntry[],
): void {
    NUMBER_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;

    while ((match = NUMBER_PATTERN.exec(text)) !== null) {
        const startOffset = match.index;
        const length = match[0].length;

        if (!isCodeRange(codeMask, startOffset, length)) {
            continue;
        }

        pushSingleLineTokenByOffset(
            document,
            startOffset,
            length,
            TOKEN_TYPE_INDEX.number,
            0,
            entries,
        );
    }
}

function emitOperatorTokens(
    document: vscode.TextDocument,
    text: string,
    codeMask: Uint8Array,
    entries: SemanticTokenEntry[],
): void {
    OPERATOR_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;

    while ((match = OPERATOR_PATTERN.exec(text)) !== null) {
        const startOffset = match.index;
        const length = match[0].length;

        if (!isCodeRange(codeMask, startOffset, length)) {
            continue;
        }

        pushSingleLineTokenByOffset(
            document,
            startOffset,
            length,
            TOKEN_TYPE_INDEX.operator,
            0,
            entries,
        );
    }
}

function emitStatementSemanticTokens(
    document: vscode.TextDocument,
    entries: SemanticTokenEntry[],
): void {
    const statementScanState = createPowerScriptStatementScanState();
    const keywordPattern = createPbKeywordPattern();

    for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
        const rawLine = document.lineAt(lineIndex).text;
        const statements = splitPowerBuilderStatements(
            rawLine,
            lineIndex,
            statementScanState,
        );

        for (const statement of statements) {
            analyzeStatement(statement, keywordPattern, entries);
        }
    }
}

function analyzeStatement(
    statement: PowerScriptStatement,
    keywordPattern: RegExp,
    entries: SemanticTokenEntry[],
): void {
    const text = statement.text;
    const codeMask = createCodeMask(text);

    emitStatementKeywords(statement, codeMask, keywordPattern, entries);
    emitDeclaredSymbols(statement, entries);
}

function emitScopedVariableTokens(
    prepared: PreparedPowerBuilderDocument,
    text: string,
    codeMask: Uint8Array,
    entries: SemanticTokenEntry[],
): void {
    IDENTIFIER_PATTERN.lastIndex = 0;

    let match: RegExpExecArray | null;

    while ((match = IDENTIFIER_PATTERN.exec(text)) !== null) {
        const startOffset = match.index;
        const length = match[0].length;

        if (!isCodeRange(codeMask, startOffset, length)) {
            continue;
        }

        const position = prepared.document.positionAt(startOffset);
        const context = getSymbolContextAtPosition(prepared.document, position);

        if (!context || !matchesContextRange(context.range, position, length)) {
            continue;
        }

        const resolution = prepared.semanticQueries.resolveSymbolAtPosition({
            document: prepared.document,
            position,
            context,
        });

        if (
            !resolution.primarySymbol ||
            resolution.precision === 'blocked' ||
            resolution.precision === 'ambiguous'
        ) {
            continue;
        }

        const token = toScopedVariableToken(
            resolution.primarySymbol,
            context.range,
        );

        if (!token) {
            continue;
        }

        entries.push({
            line: context.range.start.line,
            character: context.range.start.character,
            length,
            tokenType: token.tokenType,
            tokenModifiers: token.tokenModifiers,
        });
    }
}

function matchesContextRange(
    range: vscode.Range,
    position: vscode.Position,
    length: number,
): boolean {
    return range.start.line === position.line &&
        range.start.character === position.character &&
        range.end.line === position.line &&
        range.end.character === position.character + length;
}

function toScopedVariableToken(
    symbol: PbSymbol,
    occurrenceRange: vscode.Range,
): Pick<SemanticTokenEntry, 'tokenType' | 'tokenModifiers'> | undefined {
    if (symbol.kind !== 'variable' && symbol.kind !== 'constant') {
        return undefined;
    }

    if (!symbol.declarationScope) {
        return undefined;
    }

    const tokenType = symbol.declarationScope === 'parameter'
        ? TOKEN_TYPE_INDEX.parameter
        : TOKEN_TYPE_INDEX.variable;
    let tokenModifiers = getVariableScopeModifierMask(symbol);

    if (isSameSingleLineRange(symbol.selectionRange, occurrenceRange)) {
        tokenModifiers |= TOKEN_MODIFIER_MASK.declaration;
    }

    if (symbol.kind === 'constant' || hasReadonlyModifier(symbol.access)) {
        tokenModifiers |= TOKEN_MODIFIER_MASK.readonly;
    }

    if (
        symbol.declarationScope === 'member' &&
        getResolvedMemberVariableScope(symbol) === 'shared'
    ) {
        tokenModifiers |= TOKEN_MODIFIER_MASK.static;
    }

    return {
        tokenType,
        tokenModifiers,
    };
}

function getVariableScopeModifierMask(symbol: PbSymbol): number {
    if (symbol.declarationScope === 'parameter') {
        return 0;
    }

    if (symbol.declarationScope === 'local') {
        return TOKEN_MODIFIER_MASK.local;
    }

    switch (getResolvedMemberVariableScope(symbol)) {
        case 'shared':
            return TOKEN_MODIFIER_MASK.shared;
        case 'global':
            return TOKEN_MODIFIER_MASK.global;
        default:
            return TOKEN_MODIFIER_MASK.instance;
    }
}

function isSameSingleLineRange(
    left: vscode.Range,
    right: vscode.Range,
): boolean {
    return left.start.line === right.start.line &&
        left.start.character === right.start.character &&
        left.end.line === right.end.line &&
        left.end.character === right.end.character;
}

function hasReadonlyModifier(access?: string): boolean {
    const normalizedAccess = access?.trim().toLowerCase();

    return normalizedAccess?.includes('readonly') === true ||
        normalizedAccess?.includes('constant') === true;
}

function getResolvedMemberVariableScope(symbol: PbSymbol): 'instance' | 'shared' | 'global' {
    const normalizedAccess = symbol.access?.trim().toLowerCase();

    if (normalizedAccess === 'shared' || normalizedAccess === 'global') {
        return normalizedAccess;
    }

    return 'instance';
}

function emitStatementKeywords(
    statement: PowerScriptStatement,
    codeMask: Uint8Array,
    keywordPattern: RegExp,
    entries: SemanticTokenEntry[],
): void {
    keywordPattern.lastIndex = 0;

    let match: RegExpExecArray | null;

    while ((match = keywordPattern.exec(statement.text)) !== null) {
        const start = match.index;
        const length = match[0].length;

        if (!isCodeRange(codeMask, start, length)) {
            continue;
        }

        entries.push({
            line: statement.line,
            character: statement.startColumn + start,
            length,
            tokenType: TOKEN_TYPE_INDEX.keyword,
            tokenModifiers: 0,
        });
    }
}

function emitDeclaredSymbols(
    statement: PowerScriptStatement,
    entries: SemanticTokenEntry[],
): void {
    const text = statement.text;

    let match = text.match(ROOT_TYPE_PATTERN);

    if (match) {
        pushNamedTokenInStatement(
            statement,
            match[1],
            TOKEN_TYPE_INDEX.type,
            TOKEN_MODIFIER_MASK.declaration | TOKEN_MODIFIER_MASK.definition,
            entries,
        );
        return;
    }

    match = text.match(STRUCTURE_PATTERN);

    if (match) {
        pushNamedTokenInStatement(
            statement,
            match[1],
            TOKEN_TYPE_INDEX.type,
            TOKEN_MODIFIER_MASK.declaration | TOKEN_MODIFIER_MASK.definition,
            entries,
        );
        return;
    }

    match = text.match(NESTED_TYPE_PATTERN);

    if (match) {
        pushNamedTokenInStatement(
            statement,
            match[1],
            TOKEN_TYPE_INDEX.type,
            TOKEN_MODIFIER_MASK.declaration | TOKEN_MODIFIER_MASK.definition,
            entries,
        );
        return;
    }

    match = text.match(FUNCTION_PATTERN);

    if (match) {
        const functionName = match[3];

        pushNamedTokenInStatement(
            statement,
            functionName,
            TOKEN_TYPE_INDEX.function,
            TOKEN_MODIFIER_MASK.declaration | TOKEN_MODIFIER_MASK.definition,
            entries,
        );
        return;
    }

    match = text.match(SUBROUTINE_PATTERN);

    if (match) {
        const subroutineName = match[2];

        pushNamedTokenInStatement(
            statement,
            subroutineName,
            TOKEN_TYPE_INDEX.function,
            TOKEN_MODIFIER_MASK.declaration | TOKEN_MODIFIER_MASK.definition,
            entries,
        );
        return;
    }

    match = text.match(QUALIFIED_EVENT_PATTERN);

    if (match) {
        const ownerName = match[1];
        const eventName = match[2];

        pushNamedTokenInStatement(
            statement,
            ownerName,
            TOKEN_TYPE_INDEX.variable,
            0,
            entries,
        );

        pushNamedTokenInStatement(
            statement,
            eventName,
            TOKEN_TYPE_INDEX.event,
            TOKEN_MODIFIER_MASK.declaration | TOKEN_MODIFIER_MASK.definition,
            entries,
            true,
        );
        return;
    }

    match = text.match(EVENT_PATTERN);

    if (match) {
        const eventName = match[1];

        pushNamedTokenInStatement(
            statement,
            eventName,
            TOKEN_TYPE_INDEX.event,
            TOKEN_MODIFIER_MASK.declaration | TOKEN_MODIFIER_MASK.definition,
            entries,
        );
        return;
    }

    match = text.match(ON_EVENT_PATTERN);

    if (match) {
        const ownerName = match[1];
        const eventName = match[2];

        pushNamedTokenInStatement(
            statement,
            ownerName,
            TOKEN_TYPE_INDEX.variable,
            0,
            entries,
        );

        pushNamedTokenInStatement(
            statement,
            eventName,
            TOKEN_TYPE_INDEX.event,
            TOKEN_MODIFIER_MASK.definition,
            entries,
            true,
        );

        return;
    }
}

function pushNamedTokenInStatement(
    statement: PowerScriptStatement,
    symbolName: string,
    tokenType: number,
    tokenModifiers: number,
    entries: SemanticTokenEntry[],
    preferLastOccurrence = false,
): void {
    const lowerStatement = statement.text.toLowerCase();
    const lowerName = symbolName.toLowerCase();

    const index = preferLastOccurrence
        ? lowerStatement.lastIndexOf(lowerName)
        : lowerStatement.indexOf(lowerName);

    if (index < 0) {
        return;
    }

    entries.push({
        line: statement.line,
        character: statement.startColumn + index,
        length: symbolName.length,
        tokenType,
        tokenModifiers,
    });
}

function pushSingleLineTokenByOffset(
    document: vscode.TextDocument,
    startOffset: number,
    length: number,
    tokenType: number,
    tokenModifiers: number,
    entries: SemanticTokenEntry[],
): void {
    const start = document.positionAt(startOffset);
    const end = document.positionAt(startOffset + length);

    if (start.line !== end.line) {
        pushMultilineTokenByOffsets(
            document,
            startOffset,
            startOffset + length,
            tokenType,
            tokenModifiers,
            entries,
        );
        return;
    }

    entries.push({
        line: start.line,
        character: start.character,
        length,
        tokenType,
        tokenModifiers,
    });
}

function pushMultilineTokenByOffsets(
    document: vscode.TextDocument,
    startOffset: number,
    endOffset: number,
    tokenType: number,
    tokenModifiers: number,
    entries: SemanticTokenEntry[],
): void {
    const start = document.positionAt(startOffset);
    const end = document.positionAt(endOffset);

    if (start.line === end.line) {
        entries.push({
            line: start.line,
            character: start.character,
            length: Math.max(0, end.character - start.character),
            tokenType,
            tokenModifiers,
        });

        return;
    }

    for (let line = start.line; line <= end.line; line++) {
        const lineText = document.lineAt(line).text;

        const lineStartCharacter = line === start.line ? start.character : 0;
        const lineEndCharacter =
            line === end.line ? end.character : lineText.length;

        const length = Math.max(0, lineEndCharacter - lineStartCharacter);

        if (length <= 0) {
            continue;
        }

        entries.push({
            line,
            character: lineStartCharacter,
            length,
            tokenType,
            tokenModifiers,
        });
    }
}

function findLineEnd(text: string, startIndex: number): number {
    let index = startIndex;

    while (index < text.length) {
        const ch = text[index];

        if (ch === '\n' || ch === '\r') {
            return index;
        }

        index++;
    }

    return text.length;
}

function sortAndDedupeTokens(
    entries: SemanticTokenEntry[],
): SemanticTokenEntry[] {
    const seen = new Set<string>();
    const deduped = entries.filter(entry => {
        if (entry.length <= 0) {
            return false;
        }

        const key = [
            entry.line,
            entry.character,
            entry.length,
            entry.tokenType,
            entry.tokenModifiers,
        ].join('|');

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });

    const selected: SemanticTokenEntry[] = [];
    const preferredOrder = [...deduped].sort((left, right) => {
        const priorityDiff = getTokenPriority(right) - getTokenPriority(left);

        if (priorityDiff !== 0) {
            return priorityDiff;
        }

        if (left.line !== right.line) {
            return left.line - right.line;
        }

        if (left.character !== right.character) {
            return left.character - right.character;
        }

        if (left.length !== right.length) {
            return right.length - left.length;
        }

        if (left.tokenType !== right.tokenType) {
            return left.tokenType - right.tokenType;
        }

        return right.tokenModifiers - left.tokenModifiers;
    });

    for (const entry of preferredOrder) {
        if (selected.some(existing => tokensOverlap(existing, entry))) {
            continue;
        }

        selected.push(entry);
    }

    return selected.sort((left, right) => {
        if (left.line !== right.line) {
            return left.line - right.line;
        }

        if (left.character !== right.character) {
            return left.character - right.character;
        }

        if (left.length !== right.length) {
            return left.length - right.length;
        }

        if (left.tokenType !== right.tokenType) {
            return left.tokenType - right.tokenType;
        }

        return left.tokenModifiers - right.tokenModifiers;
    });
}

function getTokenPriority(entry: SemanticTokenEntry): number {
    switch (entry.tokenType) {
        case TOKEN_TYPE_INDEX.comment:
        case TOKEN_TYPE_INDEX.string:
            return 500;
        case TOKEN_TYPE_INDEX.type:
        case TOKEN_TYPE_INDEX.function:
        case TOKEN_TYPE_INDEX.parameter:
        case TOKEN_TYPE_INDEX.event:
            return 400;
        case TOKEN_TYPE_INDEX.variable:
            return 300;
        case TOKEN_TYPE_INDEX.keyword:
            return 200;
        case TOKEN_TYPE_INDEX.number:
            return 100;
        case TOKEN_TYPE_INDEX.operator:
            return 0;
        default:
            return 0;
    }
}

function tokensOverlap(
    left: SemanticTokenEntry,
    right: SemanticTokenEntry,
): boolean {
    if (left.line !== right.line) {
        return false;
    }

    const leftEnd = left.character + left.length;
    const rightEnd = right.character + right.length;

    return left.character < rightEnd && right.character < leftEnd;
}