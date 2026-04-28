import * as vscode from 'vscode';
import {
    PowerScriptDocumentModelCache,
    PowerScriptDocumentStatement,
    getStatementAtPositionFromModel,
    mapPositionToStatementOffset,
} from './powerScriptDocumentModel';
import {
    PB_IDENTIFIER_SOURCE,
    isPbIdentifierChar,
    isValidPbIdentifierName,
} from '../grammar/pbIdentifier';

export interface SymbolContext {
    word: string;
    range: vscode.Range;
    statement: PowerScriptDocumentStatement;
    providedArgumentCount?: number;
    qualifiedOwner?: string;
    qualifiedOwnerExpression?: string;
    qualifier?: '.' | '::';
    isDynamicDispatch?: boolean;
    dynamicDispatchKind?: 'function' | 'event';
    isAncestorControlCall?: boolean;
    isAncestorReturnValue?: boolean;
}

export interface CompletionContext {
    word: string;
    range: vscode.Range;
    statement: PowerScriptDocumentStatement;
    qualifiedOwner?: string;
    qualifiedOwnerExpression?: string;
    qualifier?: '.' | '::';
    isDynamicDispatch?: boolean;
    dynamicDispatchKind?: 'function' | 'event';
    isAncestorControlCall?: boolean;
    isQualifiedAccess: boolean;
}

export interface SignatureCallContext {
    name: string;
    range: vscode.Range;
    statement: PowerScriptDocumentStatement;
    activeParameter: number;
    providedArgumentCount: number;
    hasAnyArgumentText: boolean;
    currentParameterHasContent: boolean;
    qualifiedOwner?: string;
    qualifiedOwnerExpression?: string;
    qualifier?: '.' | '::';
    isDynamicDispatch?: boolean;
    dynamicDispatchKind?: 'function' | 'event';
    isAncestorControlCall?: boolean;
}

interface InvocationContextInfo {
    owner?: string;
    ownerExpression?: string;
    qualifier?: '.' | '::';
    isDynamicDispatch?: boolean;
    dynamicDispatchKind?: 'function' | 'event';
    isAncestorControlCall?: boolean;
}

interface InvocationModifierInfo {
    sourceWithoutModifiers: string;
    isDynamicDispatch?: boolean;
    dynamicDispatchKind?: 'function' | 'event';
}

export interface OwnerExpressionSegment {
    name: string;
    kind: 'member' | 'call';
    raw: string;
    expression?: string;
}

const ANCESTOR_RETURN_VALUE_IDENTIFIER = 'ancestorreturnvalue';

export function getWordAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
): string | undefined {
    return getSymbolContextAtPosition(document, position)?.word;
}

export function getSymbolContextAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
): SymbolContext | undefined {
    if (
        position.line < 0 ||
        position.line >= document.lineCount
    ) {
        return undefined;
    }

    const statement = getStatementAtPosition(document, position);

    if (!statement) {
        return undefined;
    }

    const statementOffset = mapPositionToStatementOffset(
        statement,
        position,
    );

    if (statementOffset === undefined) {
        return undefined;
    }

    const identifierRange = findIdentifierRangeInText(
        statement.text,
        statementOffset,
    );

    if (!identifierRange) {
        return undefined;
    }

    const word = statement.text.slice(
        identifierRange.start,
        identifierRange.end,
    );

    if (!word) {
        return undefined;
    }

    const ownerInfo = findInvocationContextBeforeText(
        statement.text.slice(0, identifierRange.start),
    );
    const callArgumentInfo = findCallArgumentInfoAfterIdentifier(
        statement.text,
        identifierRange.end,
    );

    const start = mapOffsetToStatementPosition(
        statement,
        identifierRange.start,
        'start',
    );

    const end = mapOffsetToStatementPosition(
        statement,
        identifierRange.end,
        'end',
    );

    return {
        word,
        range: new vscode.Range(start, end),
        statement,
        providedArgumentCount: callArgumentInfo?.providedArgumentCount,
        qualifiedOwner: ownerInfo?.owner,
        qualifiedOwnerExpression: ownerInfo?.ownerExpression,
        qualifier: ownerInfo?.qualifier,
        isDynamicDispatch: ownerInfo?.isDynamicDispatch,
        dynamicDispatchKind: ownerInfo?.dynamicDispatchKind,
        isAncestorControlCall: ownerInfo?.isAncestorControlCall,
        isAncestorReturnValue: isAncestorReturnValueIdentifier(word),
    };
}

export function getStatementAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
): PowerScriptDocumentStatement | undefined {
    if (
        position.line < 0 ||
        position.line >= document.lineCount
    ) {
        return undefined;
    }

    const model = PowerScriptDocumentModelCache.getInstance().getModel(document);
    return getStatementAtPositionFromModel(model, position);
}

export function getCompletionContextAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
): CompletionContext | undefined {
    if (
        position.line < 0 ||
        position.line >= document.lineCount
    ) {
        return undefined;
    }

    const statement = getStatementAtPosition(document, position)
        ?? (position.character > 0
            ? getStatementAtPosition(
                document,
                new vscode.Position(position.line, position.character - 1),
            )
            : undefined);

    if (!statement) {
        return undefined;
    }

    const statementOffset = mapPositionToStatementOffset(
        statement,
        position,
    );

    if (statementOffset === undefined) {
        return undefined;
    }

    const beforeCursor = statement.text.slice(0, statementOffset);
    const wordMatch = beforeCursor.match(
        new RegExp(`(${PB_IDENTIFIER_SOURCE})$`, 'i'),
    );
    const word = wordMatch?.[1] ?? '';
    const wordStart = statementOffset - word.length;
    const ownerSource = statement.text.slice(0, wordStart);
    const ownerInfo = findInvocationContextBeforeText(ownerSource, true);
    const start = mapOffsetToStatementPosition(
        statement,
        wordStart,
        'start',
    );
    const end = mapOffsetToStatementPosition(
        statement,
        statementOffset,
        'end',
    );

    return {
        word,
        range: new vscode.Range(start, end),
        statement,
        qualifiedOwner: ownerInfo?.owner,
        qualifiedOwnerExpression: ownerInfo?.ownerExpression,
        qualifier: ownerInfo?.qualifier,
        isDynamicDispatch: ownerInfo?.isDynamicDispatch,
        dynamicDispatchKind: ownerInfo?.dynamicDispatchKind,
        isAncestorControlCall: ownerInfo?.isAncestorControlCall,
        isQualifiedAccess: !!ownerInfo?.owner,
    };
}

export function findIdentifierRangeAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
): vscode.Range | undefined {
    return getSymbolContextAtPosition(document, position)?.range;
}

export function getSignatureCallContextAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
): SignatureCallContext | undefined {
    if (
        position.line < 0 ||
        position.line >= document.lineCount
    ) {
        return undefined;
    }

    const statement = getStatementAtPosition(document, position)
        ?? (position.character > 0
            ? getStatementAtPosition(
                document,
                new vscode.Position(position.line, position.character - 1),
            )
            : undefined);

    if (!statement) {
        return undefined;
    }

    const statementOffset = mapPositionToStatementOffset(
        statement,
        position,
    );

    if (statementOffset === undefined) {
        return undefined;
    }

    const enclosingCall = findEnclosingCallAtOffset(
        statement.text,
        statementOffset,
    );

    if (!enclosingCall) {
        return undefined;
    }

    const beforeParen = statement.text.slice(0, enclosingCall.openParenOffset);
    const identifierRange = findIdentifierRangeInText(
        beforeParen,
        beforeParen.length - 1,
    );

    if (!identifierRange) {
        return undefined;
    }

    const name = beforeParen.slice(
        identifierRange.start,
        identifierRange.end,
    );

    if (!name) {
        return undefined;
    }

    const ownerInfo = findInvocationContextBeforeText(
        statement.text.slice(0, identifierRange.start),
        true,
    );
    const start = mapOffsetToStatementPosition(
        statement,
        identifierRange.start,
        'start',
    );
    const end = mapOffsetToStatementPosition(
        statement,
        identifierRange.end,
        'end',
    );

    return {
        name,
        range: new vscode.Range(start, end),
        statement,
        activeParameter: enclosingCall.activeParameter,
        providedArgumentCount: enclosingCall.providedArgumentCount,
        hasAnyArgumentText: enclosingCall.hasAnyArgumentText,
        currentParameterHasContent: enclosingCall.currentParameterHasContent,
        qualifiedOwner: ownerInfo?.owner,
        qualifiedOwnerExpression: ownerInfo?.ownerExpression,
        qualifier: ownerInfo?.qualifier,
        isDynamicDispatch: ownerInfo?.isDynamicDispatch,
        dynamicDispatchKind: ownerInfo?.dynamicDispatchKind,
        isAncestorControlCall: ownerInfo?.isAncestorControlCall,
    };
}

function findInvocationContextBeforeText(
    before: string,
    allowSingleColon = false,
): InvocationContextInfo | undefined {
    const modifierInfo = parseTrailingInvocationModifiers(before);
    const ownerSource = modifierInfo.sourceWithoutModifiers;
    const ancestorControlCallInfo = findAncestorControlCallOwnerBeforeText(
        ownerSource,
        allowSingleColon,
    );

    if (ancestorControlCallInfo) {
        return {
            ...ancestorControlCallInfo,
            isDynamicDispatch: modifierInfo.isDynamicDispatch,
            dynamicDispatchKind: modifierInfo.dynamicDispatchKind,
        };
    }

    const ownerInfo = findQualifiedOwnerBeforeText(ownerSource, allowSingleColon);

    if (ownerInfo) {
        return {
            ...ownerInfo,
            isDynamicDispatch: modifierInfo.isDynamicDispatch,
            dynamicDispatchKind: modifierInfo.dynamicDispatchKind,
        };
    }

    if (modifierInfo.isDynamicDispatch) {
        return {
            isDynamicDispatch: true,
            dynamicDispatchKind: modifierInfo.dynamicDispatchKind,
        };
    }

    return undefined;
}

function findAncestorControlCallOwnerBeforeText(
    before: string,
    allowSingleColon = false,
): InvocationContextInfo | undefined {
    const trimmed = before.trimEnd();

    if (!trimmed) {
        return undefined;
    }

    const qualifierInfo = getTrailingQualifierInfo(trimmed, allowSingleColon);

    if (!qualifierInfo || qualifierInfo.qualifier !== '::') {
        return undefined;
    }

    const ownerExpressionSource = trimmed.slice(0, qualifierInfo.start);
    const callMatch = ownerExpressionSource.match(/\bcall\s+(.+)$/i);
    const ancestorControlExpression = callMatch?.[1]?.trim();

    if (!ancestorControlExpression) {
        return undefined;
    }

    const backtickIndex = ancestorControlExpression.lastIndexOf('`');

    if (backtickIndex <= 0 || backtickIndex >= ancestorControlExpression.length - 1) {
        return undefined;
    }

    const controlName = ancestorControlExpression.slice(backtickIndex + 1).trim();

    if (!isValidPbIdentifierName(controlName)) {
        return undefined;
    }

    return {
        owner: controlName,
        ownerExpression: ancestorControlExpression,
        qualifier: '::',
        isAncestorControlCall: true,
    };
}

function parseTrailingInvocationModifiers(
    source: string,
): InvocationModifierInfo {
    let remaining = source.trimEnd();
    let invocationType: 'function' | 'event' | undefined;
    let isDynamicDispatch = false;

    while (remaining) {
        const keywordMatch = remaining.match(/\b(function|event|static|dynamic|trigger|post)\s*$/i);

        if (!keywordMatch) {
            break;
        }

        const keyword = keywordMatch[1].toLowerCase();
        remaining = remaining.slice(0, keywordMatch.index).trimEnd();

        if (keyword === 'event') {
            invocationType = 'event';
            continue;
        }

        if (keyword === 'function') {
            invocationType ??= 'function';
            continue;
        }

        if (keyword === 'dynamic') {
            isDynamicDispatch = true;
        }
    }

    return {
        sourceWithoutModifiers: remaining,
        isDynamicDispatch: isDynamicDispatch || undefined,
        dynamicDispatchKind: isDynamicDispatch
            ? (invocationType === 'event' ? 'event' : 'function')
            : undefined,
    };
}

export function parseOwnerExpressionSegments(
    expression: string,
): OwnerExpressionSegment[] | undefined {
    const normalizedExpression = unwrapOuterOwnerExpressionParentheses(
        expression.trim(),
    );

    if (!normalizedExpression) {
        return undefined;
    }

    const rawSegments = splitTopLevelOwnerExpression(normalizedExpression);

    if (rawSegments.length === 0) {
        return undefined;
    }

    const segments: OwnerExpressionSegment[] = [];

    for (const rawSegment of rawSegments) {
        const segment = parseOwnerExpressionSegment(rawSegment);

        if (!segment) {
            return undefined;
        }

        segments.push(segment);
    }

    return segments;
}

function findIdentifierRangeInText(
    text: string,
    preferredOffset: number,
): { start: number; end: number } | undefined {
    if (!text) {
        return undefined;
    }

    const offsetCandidates = buildOffsetCandidates(
        preferredOffset,
        text.length,
    );

    for (const candidateOffset of offsetCandidates) {
        if (candidateOffset < 0 || candidateOffset >= text.length) {
            continue;
        }

        if (!isPbIdentifierChar(text[candidateOffset])) {
            continue;
        }

        let start = candidateOffset;
        let end = candidateOffset + 1;

        while (start > 0 && isPbIdentifierChar(text[start - 1])) {
            start--;
        }

        while (end < text.length && isPbIdentifierChar(text[end])) {
            end++;
        }

        if (start < end) {
            return { start, end };
        }
    }

    return undefined;
}

function buildOffsetCandidates(
    preferredOffset: number,
    maxLength: number,
): number[] {
    const candidates = [
        preferredOffset,
        preferredOffset - 1,
        preferredOffset + 1,
        preferredOffset - 2,
        preferredOffset + 2,
    ];

    return candidates.filter(
        candidate =>
            candidate >= 0 &&
            candidate < maxLength,
    );
}

export function findQualifiedOwnerBeforeText(
    before: string,
    allowSingleColon = false,
): { owner: string; ownerExpression: string; qualifier: '.' | '::' } | undefined {
    const trimmed = before.trimEnd();

    if (!trimmed) {
        return undefined;
    }

    const qualifierInfo = getTrailingQualifierInfo(trimmed, allowSingleColon);

    if (!qualifierInfo) {
        return undefined;
    }

    const ownerExpressionSource = trimmed.slice(0, qualifierInfo.start);
    const ownerExpression = extractOwnerExpression(ownerExpressionSource);

    if (!ownerExpression) {
        return undefined;
    }

    const segments = parseOwnerExpressionSegments(ownerExpression);
    const owner = segments?.[segments.length - 1]?.name;

    if (!owner) {
        return undefined;
    }

    return {
        owner,
        ownerExpression,
        qualifier: qualifierInfo.qualifier,
    };
}

function getTrailingQualifierInfo(
    text: string,
    allowSingleColon: boolean,
): { qualifier: '.' | '::'; start: number } | undefined {
    if (text.endsWith('::')) {
        return {
            qualifier: '::',
            start: text.length - 2,
        };
    }

    if (allowSingleColon && text.endsWith(':')) {
        return {
            qualifier: '::',
            start: text.length - 1,
        };
    }

    if (text.endsWith('.')) {
        return {
            qualifier: '.',
            start: text.length - 1,
        };
    }

    return undefined;
}

function extractOwnerExpression(source: string): string | undefined {
    const trimmed = source.trimEnd();

    if (!trimmed) {
        return undefined;
    }

    const start = findOwnerExpressionStart(trimmed, trimmed.length - 1);

    if (start === undefined) {
        return undefined;
    }

    const expression = trimmed.slice(start).trim();

    return parseOwnerExpressionSegments(expression)
        ? expression
        : undefined;
}

function findOwnerExpressionStart(
    text: string,
    endOffset: number,
): number | undefined {
    let start = findOwnerAtomStart(text, endOffset);

    if (start === undefined) {
        return undefined;
    }

    let cursor = skipWhitespaceBackward(text, start - 1);

    while (cursor >= 0 && text[cursor] === '.') {
        const previousAtomStart = findOwnerAtomStart(
            text,
            skipWhitespaceBackward(text, cursor - 1),
        );

        if (previousAtomStart === undefined) {
            break;
        }

        start = previousAtomStart;
        cursor = skipWhitespaceBackward(text, start - 1);
    }

    return start;
}

function findOwnerAtomStart(
    text: string,
    endOffset: number,
): number | undefined {
    let cursor = skipWhitespaceBackward(text, endOffset);

    if (cursor < 0) {
        return undefined;
    }

    while (cursor >= 0) {
        if (text[cursor] === ']') {
            const openBracket = findMatchingOpeningDelimiter(text, cursor, '[', ']');

            if (openBracket === undefined) {
                return undefined;
            }

            cursor = skipWhitespaceBackward(text, openBracket - 1);
            continue;
        }

        if (text[cursor] === ')') {
            const openParen = findMatchingOpeningDelimiter(text, cursor, '(', ')');

            if (openParen === undefined) {
                return undefined;
            }

            const beforeOpenParen = skipWhitespaceBackward(text, openParen - 1);

            if (
                beforeOpenParen >= 0 &&
                (
                    isPbIdentifierChar(text[beforeOpenParen]) ||
                    text[beforeOpenParen] === ']' ||
                    text[beforeOpenParen] === ')'
                )
            ) {
                cursor = beforeOpenParen;
                continue;
            }

            return openParen;
        }

        break;
    }

    if (cursor < 0 || !isPbIdentifierChar(text[cursor])) {
        return undefined;
    }

    while (cursor > 0 && isPbIdentifierChar(text[cursor - 1])) {
        cursor--;
    }

    return cursor;
}

function findMatchingOpeningDelimiter(
    text: string,
    closingOffset: number,
    openingDelimiter: '(' | '[',
    closingDelimiter: ')' | ']',
): number | undefined {
    let depth = 0;
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = closingOffset; index >= 0; index--) {
        const character = text[index];

        if (stringDelimiter) {
            if (character === stringDelimiter) {
                stringDelimiter = undefined;
            }

            continue;
        }

        if (character === '"' || character === '\'') {
            stringDelimiter = character;
            continue;
        }

        if (character === closingDelimiter) {
            depth++;
            continue;
        }

        if (character === openingDelimiter) {
            depth--;

            if (depth === 0) {
                return index;
            }
        }
    }

    return undefined;
}

function skipWhitespaceBackward(text: string, offset: number): number {
    let cursor = offset;

    while (cursor >= 0 && /\s/.test(text[cursor])) {
        cursor--;
    }

    return cursor;
}

function splitTopLevelOwnerExpression(expression: string): string[] {
    const result: string[] = [];
    let start = 0;
    let bracketDepth = 0;
    let parenDepth = 0;
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = 0; index < expression.length; index++) {
        const character = expression[index];

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

        if (character === '[') {
            bracketDepth++;
            continue;
        }

        if (character === ']') {
            bracketDepth = Math.max(0, bracketDepth - 1);
            continue;
        }

        if (character === '(') {
            parenDepth++;
            continue;
        }

        if (character === ')') {
            parenDepth = Math.max(0, parenDepth - 1);
            continue;
        }

        if (character === '.' && bracketDepth === 0 && parenDepth === 0) {
            result.push(expression.slice(start, index).trim());
            start = index + 1;
        }
    }

    result.push(expression.slice(start).trim());

    return result.filter(Boolean);
}

function parseOwnerExpressionSegment(
    rawSegment: string,
): OwnerExpressionSegment | undefined {
    let candidate = unwrapOuterOwnerExpressionParentheses(rawSegment.trim());

    if (!candidate) {
        return undefined;
    }

    let isCall = false;
    let changed = true;

    while (changed) {
        changed = false;

        const withoutSubscript = trimTrailingTopLevelDelimitedGroup(candidate, '[', ']');

        if (withoutSubscript !== candidate) {
            candidate = withoutSubscript;
            changed = true;
            continue;
        }

        const withoutCall = trimTrailingTopLevelDelimitedGroup(candidate, '(', ')');

        if (withoutCall !== candidate) {
            candidate = withoutCall;
            isCall = true;
            changed = true;
        }
    }

    const normalizedCandidate = unwrapOuterOwnerExpressionParentheses(candidate.trim());

    if (!normalizedCandidate) {
        return undefined;
    }

    if (new RegExp(`^${PB_IDENTIFIER_SOURCE}$`, 'i').test(normalizedCandidate)) {
        return {
            name: normalizedCandidate,
            kind: isCall ? 'call' : 'member',
            raw: rawSegment.trim(),
        };
    }

    const candidateExpression = isCall
        ? `${normalizedCandidate}()`
        : normalizedCandidate;

    if (splitTopLevelOwnerExpression(candidateExpression).length <= 1) {
        return undefined;
    }

    const nestedSegments = parseOwnerExpressionSegments(candidateExpression);
    const lastNestedSegment = nestedSegments?.[nestedSegments.length - 1];

    if (!lastNestedSegment) {
        return undefined;
    }

    return {
        name: lastNestedSegment.name,
        kind: lastNestedSegment.kind,
        raw: rawSegment.trim(),
        expression: candidateExpression,
    };
}

function trimTrailingTopLevelDelimitedGroup(
    text: string,
    openingDelimiter: '(' | '[',
    closingDelimiter: ')' | ']',
): string {
    const trimmed = text.trimEnd();

    if (!trimmed.endsWith(closingDelimiter)) {
        return trimmed;
    }

    const openingOffset = findMatchingOpeningDelimiter(
        trimmed,
        trimmed.length - 1,
        openingDelimiter,
        closingDelimiter,
    );

    if (openingOffset === undefined) {
        return trimmed;
    }

    return trimmed.slice(0, openingOffset).trimEnd();
}

function unwrapOuterOwnerExpressionParentheses(text: string): string {
    let current = text.trim();

    while (
        current.startsWith('(') &&
        current.endsWith(')')
    ) {
        const matchingOffset = findMatchingOpeningDelimiter(
            current,
            current.length - 1,
            '(',
            ')',
        );

        if (matchingOffset !== 0) {
            break;
        }

        current = current.slice(1, -1).trim();
    }

    return current;
}

function findCallArgumentInfoAfterIdentifier(
    text: string,
    identifierEndOffset: number,
): { providedArgumentCount: number } | undefined {
    let offset = identifierEndOffset;

    while (offset < text.length && /\s/.test(text[offset])) {
        offset++;
    }

    if (text[offset] !== '(') {
        return undefined;
    }

    const openParenOffset = offset;
    let depth = 0;
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = openParenOffset + 1; index < text.length; index++) {
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
            if (depth === 0) {
                return {
                    providedArgumentCount: analyzeArgumentFragment(
                        text.slice(openParenOffset + 1, index),
                    ).providedArgumentCount,
                };
            }

            depth--;
        }
    }

    return {
        providedArgumentCount: analyzeArgumentFragment(
            text.slice(openParenOffset + 1),
        ).providedArgumentCount,
    };
}

function isAncestorReturnValueIdentifier(
    value: string,
): boolean {
    return value.trim().toLowerCase() === ANCESTOR_RETURN_VALUE_IDENTIFIER;
}

function findEnclosingCallAtOffset(
    text: string,
    offset: number,
): {
    openParenOffset: number;
    activeParameter: number;
    providedArgumentCount: number;
    hasAnyArgumentText: boolean;
    currentParameterHasContent: boolean;
} | undefined {
    const openParens: number[] = [];
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = 0; index < offset; index++) {
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
            openParens.push(index);
            continue;
        }

        if (character === ')') {
            openParens.pop();
        }
    }

    const openParenOffset = openParens[openParens.length - 1];

    if (openParenOffset === undefined) {
        return undefined;
    }

    const argumentFragment = text.slice(openParenOffset + 1, offset);
    const argumentInfo = analyzeArgumentFragment(argumentFragment);

    return {
        openParenOffset,
        ...argumentInfo,
    };
}

function analyzeArgumentFragment(fragment: string): {
    activeParameter: number;
    providedArgumentCount: number;
    hasAnyArgumentText: boolean;
    currentParameterHasContent: boolean;
} {
    let depth = 0;
    let activeParameter = 0;
    let hasAnyArgumentText = false;
    let currentParameterHasContent = false;
    let stringDelimiter: '"' | '\'' | undefined;

    for (let index = 0; index < fragment.length; index++) {
        const character = fragment[index];

        if (stringDelimiter) {
            hasAnyArgumentText = true;
            currentParameterHasContent = true;

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
            hasAnyArgumentText = true;
            currentParameterHasContent = true;
            continue;
        }

        if (character === '(') {
            depth++;
            hasAnyArgumentText = true;
            currentParameterHasContent = true;
            continue;
        }

        if (character === ')') {
            depth = Math.max(0, depth - 1);
            hasAnyArgumentText = true;
            currentParameterHasContent = true;
            continue;
        }

        if (character === ',' && depth === 0) {
            activeParameter++;
            hasAnyArgumentText = true;
            currentParameterHasContent = false;
            continue;
        }

        if (!/\s/.test(character)) {
            hasAnyArgumentText = true;
            currentParameterHasContent = true;
        }
    }

    return {
        activeParameter,
        providedArgumentCount: currentParameterHasContent
            ? activeParameter + 1
            : activeParameter,
        hasAnyArgumentText,
        currentParameterHasContent,
    };
}

function mapOffsetToStatementPosition(
    statement: PowerScriptDocumentStatement,
    offset: number,
    bias: 'start' | 'end',
): vscode.Position {
    for (const segment of statement.segments) {
        const segmentStart = segment.statementStart;
        const segmentEnd = segment.statementStart + segment.text.length;

        if (offset >= segmentStart && offset < segmentEnd) {
            return new vscode.Position(
                segment.physicalLine,
                segment.physicalStartColumn + (offset - segmentStart),
            );
        }

        if (offset === segmentStart && bias === 'start') {
            return new vscode.Position(
                segment.physicalLine,
                segment.physicalStartColumn,
            );
        }

        if (offset === segmentEnd && bias === 'end') {
            return new vscode.Position(
                segment.physicalLine,
                segment.physicalStartColumn + segment.text.length,
            );
        }
    }

    return bias === 'start'
        ? statement.start
        : statement.end;
}