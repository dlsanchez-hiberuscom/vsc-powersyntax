import {
    PowerScriptLexingState,
    createPowerScriptLexingState,
    endsWithPowerScriptContinuation,
    getPowerBuilderEscapeSequenceLength,
} from '../../../core/utils/powerScriptLexingUtils';
import { isLikelySqlStarter } from '../../../core/utils/powerScriptSqlUtils';
import {
    PowerScriptStatement,
    createPowerScriptStatementScanState,
    splitPowerBuilderStatements,
} from '../../../core/utils/powerScriptStatementUtils';
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
import { listSystemGlobalFunctions } from '../../../powerbuilder/knowledge/services/queryService';

export type PowerBuilderFormattingCaseMode = 'preserve' | 'upper' | 'lower';

export type PowerBuilderFormattingSystemFunctionCaseMode = 'preserve' | 'catalog';

export type PowerBuilderFormattingBlankLineMode = 'preserve' | 'compact';

export type PowerBuilderFormattingIndentStyle = 'spaces' | 'tabs';

export interface PowerBuilderFormattingOptions {
    indentSize: number;
    continuationIndentSize?: number;
    indentStyle?: PowerBuilderFormattingIndentStyle;
    keywordCase: PowerBuilderFormattingCaseMode;
    statementCase?: PowerBuilderFormattingCaseMode;
    declarationKeywordCase?: PowerBuilderFormattingCaseMode;
    typeCase?: PowerBuilderFormattingCaseMode;
    eventKeywordCase?: PowerBuilderFormattingCaseMode;
    systemFunctionCase: PowerBuilderFormattingSystemFunctionCaseMode;
    userCallableCase?: 'preserve';
    preserveUserIdentifierCase?: boolean;
    sqlKeywordCase: PowerBuilderFormattingCaseMode;
    trimTrailingWhitespace: boolean;
    normalizeBlankLines: PowerBuilderFormattingBlankLineMode;
    experimentalSpaceInsideParens?: boolean;
    spacesInsideParentheses?: boolean;
    experimentalSplitCollapsedStatements?: boolean;
    oneStatementPerLine?: boolean;
    spaceAfterComma?: boolean;
    spaceAroundOperators?: boolean;
    blankLineBetweenSections?: boolean;
    preserveComments?: boolean;
    preserveStrings?: boolean;
    preserveManualLineBreaksInSql?: boolean;
    conservativeEmbeddedSqlFormatting?: boolean;
}

export interface PowerBuilderFormattingContext {
    isUserCallable?: (name: string) => boolean;
}

interface PreparedLine {
    readonly raw: string;
    readonly trimmed: string;
    readonly statements: readonly PowerScriptStatement[];
    readonly effectiveIndentLevel: number;
    readonly isContinuationLine: boolean;
}

interface SqlClauseMatch {
    readonly phrase: string;
    readonly matchText: string;
    readonly start: number;
    readonly end: number;
}

interface SqlConditionPart {
    readonly condition: string;
    readonly operatorAfter?: string;
}

type FormattingSectionKind = 'declaration' | 'executable';

interface FormattingOutputState {
    lastSectionKind?: FormattingSectionKind;
}

interface ResolvedPowerBuilderFormattingOptions {
    readonly indentSize: number;
    readonly continuationIndentSize: number;
    readonly indentStyle: PowerBuilderFormattingIndentStyle;
    readonly keywordCase: PowerBuilderFormattingCaseMode;
    readonly statementCase: PowerBuilderFormattingCaseMode;
    readonly typeCase: PowerBuilderFormattingCaseMode;
    readonly eventKeywordCase: PowerBuilderFormattingCaseMode;
    readonly systemFunctionCase: PowerBuilderFormattingSystemFunctionCaseMode;
    readonly preserveUserIdentifierCase: boolean;
    readonly sqlKeywordCase: PowerBuilderFormattingCaseMode;
    readonly trimTrailingWhitespace: boolean;
    readonly normalizeBlankLines: PowerBuilderFormattingBlankLineMode;
    readonly spacesInsideParentheses: boolean;
    readonly oneStatementPerLine: boolean;
    readonly spaceAfterComma: boolean;
    readonly spaceAroundOperators: boolean;
    readonly blankLineBetweenSections: boolean;
    readonly preserveComments: boolean;
    readonly preserveStrings: boolean;
    readonly preserveManualLineBreaksInSql: boolean;
    readonly conservativeEmbeddedSqlFormatting: boolean;
}

const SYSTEM_GLOBAL_FUNCTION_CASE_MAP = new Map(
    listSystemGlobalFunctions().map(entry => [entry.name.toLowerCase(), entry.name] as const),
);

const DECLARATION_KEYWORDS = [
    'forward prototypes',
    'end forward',
    'type variables',
    'end variables',
    'type prototypes',
    'end prototypes',
    'global type',
    'end type',
    'end function',
    'end subroutine',
    'end event',
    'end on',
    'public',
    'private',
    'protected',
    'global',
    'shared',
    'readonly',
    'constant',
    'function',
    'subroutine',
    'event',
    'on',
    'type',
    'from',
    'within',
    'forward',
    'create',
    'destroy',
] as const;

const EVENT_DECLARATION_KEYWORDS = [
    'end event',
    'end on',
    'event',
    'on',
] as const;

const INDENTED_STRUCTURE_OPEN_KEYWORDS = [
    'forward prototypes',
    'type variables',
    'type prototypes',
    'global type',
] as const;

const INDENTED_STRUCTURE_CLOSE_KEYWORDS = [
    'end forward',
    'end variables',
    'end prototypes',
    'end type',
] as const;

const TYPE_DECLARATION_KEYWORDS = DECLARATION_KEYWORDS.filter(
    keyword => !EVENT_DECLARATION_KEYWORDS.includes(keyword as typeof EVENT_DECLARATION_KEYWORDS[number]),
);

const EXECUTABLE_KEYWORDS = [
    'case else',
    'choose case',
    'end choose',
    'end if',
    'end try',
    'using local',
    'elseif',
    'else',
    'then',
    'case',
    'catch',
    'finally',
    'continue',
    'return',
    'create',
    'destroy',
    'with ur',
    'while',
    'until',
    'throw',
    'throws',
    'for',
    'step',
    'next',
    'loop',
    'exit',
    'try',
    'not',
    'and',
    'or',
    'if',
    'to',
    'do',
] as const;

const SQL_KEYWORDS = [
    'union all',
    'group by',
    'order by',
    'left outer join',
    'right outer join',
    'full outer join',
    'inner join',
    'left join',
    'right join',
    'full join',
    'cross join',
    'with ur',
    'using local',
    'selectblob',
    'updateblob',
    'declare',
    'execute',
    'prepare',
    'describe',
    'connect',
    'disconnect',
    'rollback',
    'commit',
    'insert',
    'select',
    'update',
    'delete',
    'values',
    'where',
    'having',
    'fetch',
    'close',
    'open',
    'join',
    'into',
    'from',
    'with',
    'using',
    'order',
    'group',
    'union',
    'cursor',
    'distinct',
    'set',
    'on',
    'as',
    'is',
    'in',
    'not',
    'and',
    'or',
    'for',
] as const;

const SQL_SELECT_CLAUSE_PHRASES = [
    'select',
    'into',
    'from',
    'where',
    'group by',
    'having',
    'order by',
    'using local',
    'with ur',
] as const;

const SQL_JOIN_PHRASES = [
    'left outer join',
    'right outer join',
    'full outer join',
    'inner join',
    'left join',
    'right join',
    'full join',
    'cross join',
    'join',
] as const;

const SQL_LOGICAL_OPERATOR_PHRASES = ['and', 'or'] as const;

const TYPE_DECLARATION_KEYWORD_PATTERN = buildPhrasePattern(TYPE_DECLARATION_KEYWORDS);
const EVENT_DECLARATION_KEYWORD_PATTERN = buildPhrasePattern(EVENT_DECLARATION_KEYWORDS);
const EXECUTABLE_KEYWORD_PATTERN = buildPhrasePattern(EXECUTABLE_KEYWORDS);
const SQL_KEYWORD_PATTERN = buildPhrasePattern(SQL_KEYWORDS);
const CALL_LIKE_IDENTIFIER_PATTERN = /\b([a-zA-Z_$#%][\w$#%`-]*)\s*(?=\()/gi;
const SIMPLE_ASSIGNMENT_PATTERN =
    /^\s*([a-zA-Z_$#%][\w$#%`.-]*(?:\s*\[[^\]]+\])?)\s*=\s*(.+?)\s*$/i;
const EXPERIMENTAL_CALL_SPACING_EXCLUSIONS = new Set([
    ...DECLARATION_KEYWORDS,
    ...EXECUTABLE_KEYWORDS,
    ...SQL_KEYWORDS,
].map(normalizePhraseKey));

export function formatPowerBuilderText(
    text: string,
    options: PowerBuilderFormattingOptions,
    context: PowerBuilderFormattingContext = {},
    eol: string = '\n',
): string {
    const resolvedOptions = resolveFormattingOptions(options);
    const expandedLines = expandCollapsedLines(
        text.split(/\r?\n/),
        resolvedOptions,
    );
    const preparedLines = prepareLines(expandedLines);
    const indentUnit = buildIndentUnit(resolvedOptions);
    const continuationIndentUnit = buildContinuationIndentUnit(resolvedOptions);
    const outputLines: string[] = [];
    const outputState: FormattingOutputState = {};
    const lexingState = createPowerScriptLexingState();

    for (let lineIndex = 0; lineIndex < preparedLines.length; lineIndex++) {
        const preparedLine = preparedLines[lineIndex];

        if (!preparedLine.trimmed) {
            pushOutputLine(outputLines, '', undefined, outputState, resolvedOptions);
            continue;
        }

        if (
            lexingState.blockCommentDepth === 0 &&
            !lexingState.quoteChar &&
            !preparedLine.isContinuationLine &&
            isLikelySqlStarter(preparedLine.trimmed)
        ) {
            const sqlBlock = collectSqlBlock(preparedLines, lineIndex);

            if (sqlBlock) {
                const formattedSqlLines = formatSqlBlock(
                    sqlBlock.lines.map(line => line.trimmed),
                    resolvedOptions,
                    indentUnit,
                );

                for (const formattedSqlLine of formattedSqlLines) {
                    pushOutputLine(
                        outputLines,
                        applyIndentation(
                            formattedSqlLine,
                            indentUnit,
                            continuationIndentUnit,
                            sqlBlock.lines[0].effectiveIndentLevel,
                            false,
                            resolvedOptions,
                        ),
                        'executable',
                        outputState,
                        resolvedOptions,
                    );
                }

                for (const line of sqlBlock.lines) {
                    formatPowerBuilderLineSegments(line.raw, lexingState, code => code);
                }

                lineIndex = sqlBlock.endIndex;
                continue;
            }
        }

        let formattedLine = preparedLine.trimmed;

        if (
            resolvedOptions.oneStatementPerLine &&
            lexingState.blockCommentDepth === 0 &&
            !lexingState.quoteChar &&
            !preparedLine.isContinuationLine
        ) {
            formattedLine = normalizeCollapsedAssignmentLine(formattedLine) ?? formattedLine;
        }

        formattedLine = formatPowerBuilderLineSegments(
            formattedLine,
            lexingState,
            code => formatCodeSegment(code, preparedLine, resolvedOptions, context),
        );

        if (resolvedOptions.spacesInsideParentheses && !preparedLine.isContinuationLine) {
            formattedLine = applyExperimentalParenSpacing(formattedLine);
        }

        pushOutputLine(
            outputLines,
            applyIndentation(
                formattedLine.trim(),
                indentUnit,
                continuationIndentUnit,
                preparedLine.effectiveIndentLevel,
                preparedLine.isContinuationLine,
                resolvedOptions,
            ),
            getPreparedLineSectionKind(preparedLine),
            outputState,
            resolvedOptions,
        );
    }

    return outputLines.join(eol);
}

function expandCollapsedLines(
    rawLines: readonly string[],
    options: ResolvedPowerBuilderFormattingOptions,
): string[] {
    if (!options.oneStatementPerLine) {
        return [...rawLines];
    }

    const expandedLines: string[] = [];
    const statementScanState = createPowerScriptStatementScanState();

    for (const rawLine of rawLines) {
        if (
            !rawLine.trim() ||
            endsWithPowerScriptContinuation(rawLine) ||
            /\/\/|\/\*/.test(rawLine) ||
            isLikelySqlStarter(rawLine)
        ) {
            expandedLines.push(rawLine);
            continue;
        }

        const statements = splitPowerBuilderStatements(rawLine, 0, statementScanState);

        if (statements.length <= 1) {
            expandedLines.push(rawLine);
            continue;
        }

        for (const statement of statements) {
            expandedLines.push(statement.text);
        }
    }

    return expandedLines;
}

function prepareLines(rawLines: readonly string[]): PreparedLine[] {
    const preparedLines: PreparedLine[] = [];
    const statementScanState = createPowerScriptStatementScanState();

    let indentLevel = 0;
    let previousLineContinues = false;

    for (let lineIndex = 0; lineIndex < rawLines.length; lineIndex++) {
        const rawLine = rawLines[lineIndex];
        const trimmedLine = rawLine.trim();

        if (!trimmedLine) {
            preparedLines.push({
                raw: rawLine,
                trimmed: '',
                statements: [],
                effectiveIndentLevel: 0,
                isContinuationLine: previousLineContinues,
            });
            previousLineContinues = false;
            continue;
        }

        const statements = splitPowerBuilderStatements(rawLine, lineIndex, statementScanState);
        let effectiveIndentLevel = indentLevel;

        for (const statement of statements) {
            const statementText = statement.text.trim();

            if (!statementText) {
                continue;
            }

            if (
                isIndentedStructureBlockClose(statementText) ||
                getExecutableBlockCloseKind(statementText) ||
                isChooseCaseBranchStatement(statementText) ||
                isElseStatement(statementText) ||
                isElseIfStatement(statementText) ||
                isCatchStatement(statementText) ||
                isFinallyStatement(statementText)
            ) {
                effectiveIndentLevel = Math.max(0, effectiveIndentLevel - 1);
                break;
            }
        }

        preparedLines.push({
            raw: rawLine,
            trimmed: trimmedLine,
            statements,
            effectiveIndentLevel,
            isContinuationLine: previousLineContinues,
        });

        let opens = 0;
        let closes = 0;

        for (const statement of statements) {
            const statementText = statement.text.trim();

            if (!statementText) {
                continue;
            }

            if (isIndentedStructureBlockClose(statementText)) {
                closes++;
                continue;
            }

            if (getExecutableBlockCloseKind(statementText)) {
                closes++;
                continue;
            }

            if (
                isChooseCaseBranchStatement(statementText) ||
                isElseStatement(statementText) ||
                isElseIfStatement(statementText) ||
                isCatchStatement(statementText) ||
                isFinallyStatement(statementText)
            ) {
                closes++;
                opens++;
                continue;
            }

            if (getExecutableBlockOpenKind(statementText)) {
                opens++;
                continue;
            }

            if (isIndentedStructureBlockOpen(statementText)) {
                opens++;
            }
        }

        indentLevel = Math.max(0, indentLevel - closes);
        indentLevel += opens;
        previousLineContinues = endsWithPowerScriptContinuation(rawLine);
    }

    return preparedLines;
}

function formatCodeSegment(
    code: string,
    preparedLine: PreparedLine,
    options: ResolvedPowerBuilderFormattingOptions,
    context: PowerBuilderFormattingContext,
): string {
    if (!code.trim()) {
        return code;
    }

    const statementText = preparedLine.statements[0]?.text?.trim() ?? preparedLine.trimmed;
    const isDeclarationStatement = isPowerBuilderDeclarationStatement(statementText);

    let formattedCode = code;

    if (isDeclarationStatement) {
        formattedCode = applyPhraseCaseMode(
            formattedCode,
            TYPE_DECLARATION_KEYWORD_PATTERN,
            options.typeCase,
        );
        formattedCode = applyPhraseCaseMode(
            formattedCode,
            EVENT_DECLARATION_KEYWORD_PATTERN,
            options.eventKeywordCase,
        );
    } else {
        formattedCode = applyPhraseCaseMode(
            formattedCode,
            EXECUTABLE_KEYWORD_PATTERN,
            options.statementCase,
        );
        formattedCode = applySystemFunctionCase(
            formattedCode,
            options,
            context,
        );
    }

    formattedCode = applyCodeSpacing(formattedCode, options);

    return formattedCode;
}

function isPowerBuilderDeclarationStatement(statement: string): boolean {
    if (
        getExecutableBlockOpenKind(statement) ||
        getExecutableBlockCloseKind(statement) ||
        isChooseCaseBranchStatement(statement) ||
        isElseStatement(statement) ||
        isElseIfStatement(statement) ||
        isCatchStatement(statement) ||
        isFinallyStatement(statement)
    ) {
        return false;
    }

    return !!(
        getStructureBlockOpenKind(statement) ||
        getStructureBlockCloseKind(statement)
    );
}

function isChooseCaseBranchStatement(statement: string): boolean {
    return /^\s*case(?:\s+else)?\b/i.test(statement) && !/^\s*choose\s+case\b/i.test(statement);
}

function isIndentedStructureBlockOpen(statement: string): boolean {
    const normalized = normalizePhraseKey(statement);

    return INDENTED_STRUCTURE_OPEN_KEYWORDS.some(keyword => normalized.startsWith(keyword));
}

function isIndentedStructureBlockClose(statement: string): boolean {
    const normalized = normalizePhraseKey(statement);

    return INDENTED_STRUCTURE_CLOSE_KEYWORDS.some(keyword => normalized.startsWith(keyword));
}

function applyPhraseCaseMode(
    text: string,
    pattern: RegExp,
    mode: PowerBuilderFormattingCaseMode,
): string {
    if (mode === 'preserve') {
        return text;
    }

    return replaceRegexMatches(text, pattern, match => applyCaseMode(match[0], mode));
}

function applySystemFunctionCase(
    text: string,
    options: ResolvedPowerBuilderFormattingOptions,
    context: PowerBuilderFormattingContext,
): string {
    if (options.systemFunctionCase !== 'catalog') {
        return text;
    }

    return replaceRegexMatches(text, CALL_LIKE_IDENTIFIER_PATTERN, match => {
        const callableName = match[1];

        if (!callableName) {
            return match[0];
        }

        if (options.preserveUserIdentifierCase && context.isUserCallable?.(callableName)) {
            return match[0];
        }

        const catalogName = SYSTEM_GLOBAL_FUNCTION_CASE_MAP.get(callableName.toLowerCase());

        return catalogName
            ? match[0].replace(callableName, catalogName)
            : match[0];
    });
}

function collectSqlBlock(
    preparedLines: readonly PreparedLine[],
    startIndex: number,
): { readonly lines: readonly PreparedLine[]; readonly endIndex: number } | undefined {
    const sqlLines: PreparedLine[] = [];

    for (let lineIndex = startIndex; lineIndex < preparedLines.length; lineIndex++) {
        const preparedLine = preparedLines[lineIndex];

        if (!preparedLine.trimmed) {
            return undefined;
        }

        if (
            lineIndex > startIndex &&
            isPowerBuilderControlLikeLine(preparedLine.trimmed)
        ) {
            return undefined;
        }

        sqlLines.push(preparedLine);

        if (/;\s*$/.test(preparedLine.trimmed)) {
            return {
                lines: sqlLines,
                endIndex: lineIndex,
            };
        }
    }

    return undefined;
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

function formatSqlBlock(
    sqlLines: readonly string[],
    options: ResolvedPowerBuilderFormattingOptions,
    indentUnit: string,
): string[] {
    if (options.preserveManualLineBreaksInSql && sqlLines.length > 1) {
        return sqlLines.map(line => formatSqlInline(line.trim(), options.sqlKeywordCase, options));
    }

    const joinedSql = collapseSqlWhitespace(sqlLines.join(' '));
    const normalizedSql = joinedSql.trim();

    if (!normalizedSql) {
        return [''];
    }

    if (!/^select\b/i.test(normalizedSql)) {
        return sqlLines.map(line => formatSqlInline(line.trim(), options.sqlKeywordCase, options));
    }

    const statementWithoutTerminator = normalizedSql.replace(/;\s*$/, '').trim();
    const clauseMatches = findTopLevelSqlMatches(
        statementWithoutTerminator,
        SQL_SELECT_CLAUSE_PHRASES,
    );

    if (clauseMatches.length === 0 || normalizePhraseKey(clauseMatches[0].phrase) !== 'select') {
        return sqlLines.map(line => formatSqlInline(line.trim(), options.sqlKeywordCase, options));
    }

    const clauseContents = sliceSqlClauseContents(statementWithoutTerminator, clauseMatches);
    const formattedLines: string[] = [];
    const selectMatch = clauseMatches.find(match => normalizePhraseKey(match.phrase) === 'select');
    const fromMatch = clauseMatches.find(match => normalizePhraseKey(match.phrase) === 'from');

    if (!selectMatch || !fromMatch) {
        return sqlLines.map(line => formatSqlInline(line.trim(), options.sqlKeywordCase, options));
    }

    const selectColumns = splitTopLevelSqlList(clauseContents.get(selectMatch.start) ?? '');

    formattedLines.push(formatSqlKeywordText(selectMatch.matchText, options.sqlKeywordCase));

    for (let columnIndex = 0; columnIndex < selectColumns.length; columnIndex++) {
        formattedLines.push(`${indentUnit}${formatSqlInline(selectColumns[columnIndex], options.sqlKeywordCase, options)}${columnIndex === selectColumns.length - 1 ? '' : ','}`);
    }

    const intoMatch = clauseMatches.find(match => normalizePhraseKey(match.phrase) === 'into');

    if (intoMatch) {
        const intoTargets = splitTopLevelSqlList(clauseContents.get(intoMatch.start) ?? '');

        formattedLines.push(formatSqlKeywordText(intoMatch.matchText, options.sqlKeywordCase));

        for (let targetIndex = 0; targetIndex < intoTargets.length; targetIndex++) {
            formattedLines.push(`${indentUnit}${formatSqlInline(intoTargets[targetIndex], options.sqlKeywordCase, options)}${targetIndex === intoTargets.length - 1 ? '' : ','}`);
        }
    }

    formattedLines.push(...formatSqlFromClause(
        fromMatch,
        clauseContents.get(fromMatch.start) ?? '',
        options,
        indentUnit,
    ));

    for (const clauseMatch of clauseMatches) {
        const clauseKey = normalizePhraseKey(clauseMatch.phrase);

        if (clauseKey === 'select' || clauseKey === 'into' || clauseKey === 'from') {
            continue;
        }

        const clauseContent = clauseContents.get(clauseMatch.start) ?? '';

        if (clauseKey === 'where' || clauseKey === 'having') {
            formattedLines.push(...formatSqlConditionClause(
                clauseMatch.matchText,
                clauseContent,
                options,
                indentUnit,
            ));
            continue;
        }

        formattedLines.push(formatSqlStandaloneClause(
            clauseMatch.matchText,
            clauseContent,
            options,
        ));
    }

    const lastLineIndex = formattedLines.length - 1;
    formattedLines[lastLineIndex] = `${formattedLines[lastLineIndex]};`;

    return formattedLines;
}

function formatSqlFromClause(
    clauseMatch: SqlClauseMatch,
    clauseContent: string,
    options: ResolvedPowerBuilderFormattingOptions,
    indentUnit: string,
): string[] {
    const joinMatches = findTopLevelSqlMatches(clauseContent, SQL_JOIN_PHRASES);

    if (joinMatches.length === 0) {
        return [formatSqlStandaloneClause(clauseMatch.matchText, clauseContent, options)];
    }

    const lines: string[] = [];
    const firstJoin = joinMatches[0];
    const baseFromSegment = clauseContent.slice(0, firstJoin.start).trim();

    lines.push(`${formatSqlKeywordText(clauseMatch.matchText, options.sqlKeywordCase)} ${formatSqlInline(baseFromSegment, options.sqlKeywordCase, options)}`);

    for (let joinIndex = 0; joinIndex < joinMatches.length; joinIndex++) {
        const currentJoin = joinMatches[joinIndex];
        const nextJoin = joinMatches[joinIndex + 1];
        const joinSegment = clauseContent.slice(
            currentJoin.start,
            nextJoin?.start ?? clauseContent.length,
        ).trim();

        lines.push(...formatSqlJoinSegment(joinSegment, options, indentUnit));
    }

    return lines;
}

function formatSqlJoinSegment(
    joinSegment: string,
    options: ResolvedPowerBuilderFormattingOptions,
    indentUnit: string,
): string[] {
    const onMatches = findTopLevelSqlMatches(joinSegment, ['on']);

    if (onMatches.length === 0) {
        return [formatSqlInline(joinSegment, options.sqlKeywordCase, options)];
    }

    const onMatch = onMatches[0];
    const joinHead = joinSegment.slice(0, onMatch.start).trim();
    const onContent = joinSegment.slice(onMatch.end).trim();
    const formattedConditionLines = formatSqlConditionClause(
        onMatch.matchText,
        onContent,
        options,
        indentUnit,
    );

    if (formattedConditionLines.length === 0) {
        return [formatSqlInline(joinSegment, options.sqlKeywordCase, options)];
    }

    return [
        `${formatSqlInline(joinHead, options.sqlKeywordCase, options)} ${formattedConditionLines[0]}`,
        ...formattedConditionLines.slice(1),
    ];
}

function formatSqlConditionClause(
    clauseKeyword: string,
    clauseContent: string,
    options: ResolvedPowerBuilderFormattingOptions,
    indentUnit: string,
): string[] {
    const conditionParts = splitSqlConditions(clauseContent);

    if (conditionParts.length === 0) {
        return [formatSqlStandaloneClause(clauseKeyword, clauseContent, options)];
    }

    const lines: string[] = [];

    for (let index = 0; index < conditionParts.length; index++) {
        const conditionPart = conditionParts[index];
        const prefix = index === 0
            ? formatSqlKeywordText(clauseKeyword, options.sqlKeywordCase)
            : indentUnit;
        const operatorSuffix = conditionPart.operatorAfter
            ? ` ${formatSqlKeywordText(conditionPart.operatorAfter, options.sqlKeywordCase)}`
            : '';

        if (index === 0) {
            lines.push(`${prefix} ${formatSqlInline(conditionPart.condition, options.sqlKeywordCase, options)}${operatorSuffix}`.trimEnd());
            continue;
        }

        lines.push(`${prefix}${formatSqlInline(conditionPart.condition, options.sqlKeywordCase, options)}${operatorSuffix}`.trimEnd());
    }

    return lines;
}

function formatSqlStandaloneClause(
    clauseKeyword: string,
    clauseContent: string,
    options: ResolvedPowerBuilderFormattingOptions,
): string {
    return `${formatSqlKeywordText(clauseKeyword, options.sqlKeywordCase)} ${formatSqlInline(clauseContent, options.sqlKeywordCase, options)}`.trim();
}

function formatSqlInline(
    text: string,
    mode: PowerBuilderFormattingCaseMode,
    options?: ResolvedPowerBuilderFormattingOptions,
): string {
    const formatted = formatSqlSegments(
        collapseSqlWhitespace(text),
        code => applyPhraseCaseMode(code, SQL_KEYWORD_PATTERN, mode),
    ).trim();

    return options
        ? applyCodeSpacing(formatted, options).trim()
        : formatted;
}

function splitTopLevelSqlList(text: string): string[] {
    const values: string[] = [];
    const normalized = collapseSqlWhitespace(text).trim();

    if (!normalized) {
        return values;
    }

    let current = '';
    let parenDepth = 0;
    let quoteChar: string | undefined;

    for (let index = 0; index < normalized.length; index++) {
        const ch = normalized[index];
        const next = index + 1 < normalized.length ? normalized[index + 1] : '';

        if (quoteChar) {
            current += ch;

            if (ch === quoteChar && next === quoteChar) {
                current += next;
                index++;
                continue;
            }

            if (ch === quoteChar) {
                quoteChar = undefined;
            }

            continue;
        }

        if (ch === '\'' || ch === '"') {
            quoteChar = ch;
            current += ch;
            continue;
        }

        if (ch === '(') {
            parenDepth++;
            current += ch;
            continue;
        }

        if (ch === ')') {
            parenDepth = Math.max(0, parenDepth - 1);
            current += ch;
            continue;
        }

        if (ch === ',' && parenDepth === 0) {
            const value = current.trim();

            if (value) {
                values.push(value);
            }

            current = '';
            continue;
        }

        current += ch;
    }

    const finalValue = current.trim();

    if (finalValue) {
        values.push(finalValue);
    }

    return values;
}

function splitSqlConditions(text: string): SqlConditionPart[] {
    const normalized = collapseSqlWhitespace(text).trim();

    if (!normalized) {
        return [];
    }

    const operatorMatches = findTopLevelSqlMatches(normalized, SQL_LOGICAL_OPERATOR_PHRASES);

    if (operatorMatches.length === 0) {
        return [{ condition: normalized }];
    }

    const parts: SqlConditionPart[] = [];
    let startIndex = 0;

    for (const operatorMatch of operatorMatches) {
        const condition = normalized.slice(startIndex, operatorMatch.start).trim();

        if (condition) {
            parts.push({
                condition,
                operatorAfter: operatorMatch.matchText,
            });
        }

        startIndex = operatorMatch.end;
    }

    const tailCondition = normalized.slice(startIndex).trim();

    if (tailCondition) {
        parts.push({ condition: tailCondition });
    }

    return parts;
}

function findTopLevelSqlMatches(
    text: string,
    phrases: readonly string[],
): SqlClauseMatch[] {
    const matches: SqlClauseMatch[] = [];
    const normalizedPhrases = [...phrases]
        .map(phrase => phrase.trim())
        .sort((left, right) => right.length - left.length);

    let parenDepth = 0;
    let quoteChar: string | undefined;
    let index = 0;
    const lowerText = text.toLowerCase();

    while (index < text.length) {
        const ch = text[index];
        const next = index + 1 < text.length ? text[index + 1] : '';

        if (quoteChar) {
            if (ch === quoteChar && next === quoteChar) {
                index += 2;
                continue;
            }

            if (ch === quoteChar) {
                quoteChar = undefined;
            }

            index++;
            continue;
        }

        if (ch === '\'' || ch === '"') {
            quoteChar = ch;
            index++;
            continue;
        }

        if (ch === '(') {
            parenDepth++;
            index++;
            continue;
        }

        if (ch === ')') {
            parenDepth = Math.max(0, parenDepth - 1);
            index++;
            continue;
        }

        if (parenDepth > 0) {
            index++;
            continue;
        }

        let matched = false;

        for (const phrase of normalizedPhrases) {
            const lowerPhrase = phrase.toLowerCase();

            if (!lowerText.startsWith(lowerPhrase, index)) {
                continue;
            }

            const before = index > 0 ? lowerText[index - 1] : '';
            const after = index + lowerPhrase.length < lowerText.length
                ? lowerText[index + lowerPhrase.length]
                : '';

            if (
                (before && /[a-z0-9_]/i.test(before)) ||
                (after && /[a-z0-9_]/i.test(after))
            ) {
                continue;
            }

            matches.push({
                phrase,
                matchText: text.slice(index, index + phrase.length),
                start: index,
                end: index + phrase.length,
            });
            index += phrase.length;
            matched = true;
            break;
        }

        if (!matched) {
            index++;
        }
    }

    return matches;
}

function sliceSqlClauseContents(
    statement: string,
    clauseMatches: readonly SqlClauseMatch[],
): Map<number, string> {
    const clauseContents = new Map<number, string>();

    for (let index = 0; index < clauseMatches.length; index++) {
        const currentMatch = clauseMatches[index];
        const nextMatch = clauseMatches[index + 1];

        clauseContents.set(
            currentMatch.start,
            statement.slice(currentMatch.end, nextMatch?.start ?? statement.length).trim(),
        );
    }

    return clauseContents;
}

function collapseSqlWhitespace(text: string): string {
    let result = '';
    let quoteChar: string | undefined;
    let inWhitespace = false;

    for (let index = 0; index < text.length; index++) {
        const ch = text[index];
        const next = index + 1 < text.length ? text[index + 1] : '';

        if (quoteChar) {
            result += ch;

            if (ch === quoteChar && next === quoteChar) {
                result += next;
                index++;
                continue;
            }

            if (ch === quoteChar) {
                quoteChar = undefined;
            }

            continue;
        }

        if (ch === '\'' || ch === '"') {
            quoteChar = ch;
            inWhitespace = false;
            result += ch;
            continue;
        }

        if (/\s/.test(ch)) {
            if (!inWhitespace && result.length > 0) {
                result += ' ';
            }
            inWhitespace = true;
            continue;
        }

        inWhitespace = false;
        result += ch;
    }

    return result.trim();
}

function formatSqlSegments(
    text: string,
    formatCode: (code: string) => string,
): string {
    let result = '';
    let codeBuffer = '';
    let quoteChar: string | undefined;

    const flushCodeBuffer = (): void => {
        if (!codeBuffer) {
            return;
        }

        result += formatCode(codeBuffer);
        codeBuffer = '';
    };

    for (let index = 0; index < text.length; index++) {
        const ch = text[index];
        const next = index + 1 < text.length ? text[index + 1] : '';

        if (quoteChar) {
            result += ch;

            if (ch === quoteChar && next === quoteChar) {
                result += next;
                index++;
                continue;
            }

            if (ch === quoteChar) {
                quoteChar = undefined;
            }

            continue;
        }

        if (ch === '\'' || ch === '"') {
            flushCodeBuffer();
            quoteChar = ch;
            result += ch;
            continue;
        }

        codeBuffer += ch;
    }

    flushCodeBuffer();
    return result;
}

function formatSqlKeywordText(
    text: string,
    mode: PowerBuilderFormattingCaseMode,
): string {
    return applyCaseMode(text, mode);
}

function normalizeCollapsedAssignmentLine(line: string): string | undefined {
    const match = line.match(SIMPLE_ASSIGNMENT_PATTERN);

    if (!match) {
        return undefined;
    }

    const leftHandSide = match[1]?.trim();
    const rightHandSide = match[2]?.trim();

    if (!leftHandSide || !rightHandSide || !isSafeCollapsedAssignmentValue(rightHandSide)) {
        return undefined;
    }

    return `${leftHandSide} = ${rightHandSide}`;
}

function isSafeCollapsedAssignmentValue(value: string): boolean {
    return !!value.match(
        /^(?:[a-zA-Z_$#%][\w$#%.-]*|\d+(?:\.\d+)?|"(?:[^"]|"")*"|'(?:[^']|'')*')$/,
    );
}

function applyExperimentalParenSpacing(line: string): string {
    let result = '';
    const lexingState = createPowerScriptLexingState();

    for (let index = 0; index < line.length; index++) {
        const ch = line[index];
        const next = index + 1 < line.length ? line[index + 1] : '';

        if (lexingState.blockCommentDepth > 0) {
            result += ch;

            if (ch === '/' && next === '*') {
                result += next;
                lexingState.blockCommentDepth++;
                index++;
                continue;
            }

            if (ch === '*' && next === '/') {
                result += next;
                lexingState.blockCommentDepth = Math.max(0, lexingState.blockCommentDepth - 1);
                index++;
            }

            continue;
        }

        if (lexingState.quoteChar) {
            const escapeLength = getPowerBuilderEscapeSequenceLength(line, index);

            if (escapeLength > 0) {
                result += line.slice(index, index + escapeLength);
                index += escapeLength - 1;
                continue;
            }

            result += ch;

            if (ch === lexingState.quoteChar && next === lexingState.quoteChar) {
                result += next;
                index++;
                continue;
            }

            if (ch === lexingState.quoteChar) {
                lexingState.quoteChar = undefined;
            }

            continue;
        }

        if (ch === '/' && next === '/') {
            result += line.slice(index);
            break;
        }

        if (ch === '/' && next === '*') {
            result += '/*';
            lexingState.blockCommentDepth++;
            index++;
            continue;
        }

        if (ch === '\'' || ch === '"') {
            lexingState.quoteChar = ch;
            result += ch;
            continue;
        }

        if (ch === '(') {
            const trailingIdentifier = result.match(/([a-zA-Z_$#%][\w$#%`-]*)\s*$/i)?.[1];

            if (
                trailingIdentifier &&
                !EXPERIMENTAL_CALL_SPACING_EXCLUSIONS.has(normalizePhraseKey(trailingIdentifier))
            ) {
                result = result.replace(/\s*$/, '');
                result += ' (';
            } else {
                result += '(';
            }

            index++;

            while (index < line.length && /[ \t]/.test(line[index])) {
                index++;
            }

            const nextVisibleChar = line[index] ?? '';

            if (nextVisibleChar && nextVisibleChar !== ')') {
                result += ' ';
            }

            index--;
            continue;
        }

        if (ch === ')') {
            result = result.replace(/[ \t]+$/, '');

            if (!result.endsWith('(')) {
                result += ' ';
            }

            result += ')';
            continue;
        }

        result += ch;
    }

    return result;
}

function applyCodeSpacing(
    line: string,
    options: ResolvedPowerBuilderFormattingOptions,
): string {
    let formatted = line;

    formatted = applyCommaSpacing(formatted, options.spaceAfterComma);

    if (options.spaceAroundOperators) {
        formatted = applyOperatorSpacing(formatted);
    }

    return formatted;
}

function applyCommaSpacing(line: string, enabled: boolean): string {
    let result = '';

    for (let index = 0; index < line.length; index++) {
        const ch = line[index];

        if (ch !== ',') {
            result += ch;
            continue;
        }

        result = result.replace(/[ \t]+$/g, '');
        result += ',';

        let nextIndex = index + 1;

        while (nextIndex < line.length && /[ \t]/.test(line[nextIndex])) {
            nextIndex++;
        }

        const nextVisibleChar = line[nextIndex] ?? '';

        if (
            enabled && (
                (nextVisibleChar && nextVisibleChar !== ')' && nextVisibleChar !== ']' && nextVisibleChar !== ';') ||
                nextIndex > index + 1
            )
        ) {
            result += ' ';
        }

        index = nextIndex - 1;
    }

    return result;
}

function applyOperatorSpacing(line: string): string {
    let result = '';

    for (let index = 0; index < line.length; index++) {
        const operator = matchBinaryOperator(line, index);

        if (!operator) {
            result += line[index];
            continue;
        }

        const previousVisibleChar = getPreviousVisibleCharacter(result);
        const nextVisibleIndex = getNextVisibleIndex(line, index + operator.length);
        const nextVisibleChar = nextVisibleIndex < line.length
            ? line[nextVisibleIndex]
            : undefined;

        if (isUnaryOperator(operator, previousVisibleChar, nextVisibleChar)) {
            result += operator;
            index += operator.length - 1;
            continue;
        }

        result = result.replace(/[ \t]+$/g, '');

        if (result.length > 0) {
            result += ' ';
        }

        result += operator;

        if (nextVisibleChar) {
            result += ' ';
        }

        index = nextVisibleIndex - 1;
    }

    return result;
}

function matchBinaryOperator(line: string, index: number): string | undefined {
    const candidate = line.slice(index);

    if (/^(<=|>=|<>)/.test(candidate)) {
        return candidate.slice(0, 2);
    }

    if (/^(=|<|>|\+|-|\*|\/)/.test(candidate)) {
        return candidate[0];
    }

    return undefined;
}

function getNextVisibleIndex(line: string, index: number): number {
    let nextIndex = index;

    while (nextIndex < line.length && /[ \t]/.test(line[nextIndex])) {
        nextIndex++;
    }

    return nextIndex;
}

function getPreviousVisibleCharacter(line: string): string | undefined {
    for (let index = line.length - 1; index >= 0; index--) {
        if (!/[ \t]/.test(line[index])) {
            return line[index];
        }
    }

    return undefined;
}

function isUnaryOperator(
    operator: string,
    previousVisibleChar: string | undefined,
    nextVisibleChar: string | undefined,
): boolean {
    if (!nextVisibleChar) {
        return true;
    }

    if (operator !== '+' && operator !== '-') {
        return false;
    }

    return !previousVisibleChar || /[([=,+\-*/<>:]/.test(previousVisibleChar);
}

function formatPowerBuilderLineSegments(
    line: string,
    state: PowerScriptLexingState,
    formatCode: (code: string) => string,
): string {
    let result = '';
    let codeBuffer = '';
    let quoteChar = state.quoteChar;

    const flushCodeBuffer = (): void => {
        if (!codeBuffer) {
            return;
        }

        result += formatCode(codeBuffer);
        codeBuffer = '';
    };

    for (let index = 0; index < line.length; index++) {
        const ch = line[index];
        const next = index + 1 < line.length ? line[index + 1] : '';

        if (state.blockCommentDepth > 0) {
            result += ch;

            if (ch === '/' && next === '*') {
                result += next;
                state.blockCommentDepth++;
                index++;
                continue;
            }

            if (ch === '*' && next === '/') {
                result += next;
                state.blockCommentDepth = Math.max(0, state.blockCommentDepth - 1);
                index++;
            }

            continue;
        }

        if (quoteChar) {
            const escapeLength = getPowerBuilderEscapeSequenceLength(line, index);

            if (escapeLength > 0) {
                result += line.slice(index, index + escapeLength);
                index += escapeLength - 1;
                continue;
            }

            result += ch;

            if (ch === quoteChar && next === quoteChar) {
                result += next;
                index++;
                continue;
            }

            if (ch === quoteChar) {
                quoteChar = undefined;
                state.quoteChar = undefined;
            }

            continue;
        }

        if (ch === '/' && next === '/') {
            flushCodeBuffer();
            result += line.slice(index);
            break;
        }

        if (ch === '/' && next === '*') {
            flushCodeBuffer();
            state.blockCommentDepth++;
            result += '/*';
            index++;
            continue;
        }

        if (ch === '\'' || ch === '"') {
            flushCodeBuffer();
            quoteChar = ch;
            state.quoteChar = ch;
            result += ch;
            continue;
        }

        codeBuffer += ch;
    }

    flushCodeBuffer();
    return result;
}

function applyIndentation(
    line: string,
    indentUnit: string,
    continuationIndentUnit: string,
    indentLevel: number,
    isContinuationLine: boolean,
    options: ResolvedPowerBuilderFormattingOptions,
): string {
    const indented = `${indentUnit.repeat(Math.max(0, indentLevel))}${isContinuationLine ? continuationIndentUnit : ''}${line}`;

    if (!options.trimTrailingWhitespace) {
        return indented;
    }

    return indented.replace(/[ \t]+$/g, '');
}

function pushOutputLine(
    outputLines: string[],
    line: string,
    sectionKind: FormattingSectionKind | undefined,
    outputState: FormattingOutputState,
    options: ResolvedPowerBuilderFormattingOptions,
): void {
    const normalizedLine = options.trimTrailingWhitespace
        ? line.replace(/[ \t]+$/g, '')
        : line;

    if (
        normalizedLine.length > 0 &&
        sectionKind &&
        options.blankLineBetweenSections &&
        outputState.lastSectionKind &&
        outputState.lastSectionKind !== sectionKind &&
        outputLines[outputLines.length - 1] !== ''
    ) {
        outputLines.push('');
    }

    if (
        options.normalizeBlankLines === 'compact' &&
        normalizedLine.length === 0 &&
        outputLines[outputLines.length - 1] === ''
    ) {
        return;
    }

    outputLines.push(normalizedLine);

    if (normalizedLine.length > 0 && sectionKind) {
        outputState.lastSectionKind = sectionKind;
    }
}

function resolveFormattingOptions(options: PowerBuilderFormattingOptions): ResolvedPowerBuilderFormattingOptions {
    const indentSize = Math.max(1, Math.trunc(options.indentSize || 3));
    const declarationKeywordCase = options.declarationKeywordCase ?? 'preserve';

    return {
        indentSize,
        continuationIndentSize: Math.max(1, Math.trunc(options.continuationIndentSize ?? indentSize)),
        indentStyle: options.indentStyle === 'tabs'
            ? 'tabs'
            : 'spaces',
        keywordCase: options.keywordCase,
        statementCase: options.statementCase ?? options.keywordCase,
        typeCase: options.typeCase ?? declarationKeywordCase,
        eventKeywordCase: options.eventKeywordCase ?? declarationKeywordCase,
        systemFunctionCase: options.systemFunctionCase,
        preserveUserIdentifierCase: options.preserveUserIdentifierCase ?? (
            options.userCallableCase !== undefined
                ? options.userCallableCase === 'preserve'
                : true
        ),
        sqlKeywordCase: options.sqlKeywordCase,
        trimTrailingWhitespace: options.trimTrailingWhitespace,
        normalizeBlankLines: options.normalizeBlankLines,
        spacesInsideParentheses: options.spacesInsideParentheses ?? options.experimentalSpaceInsideParens ?? false,
        oneStatementPerLine: options.oneStatementPerLine ?? options.experimentalSplitCollapsedStatements ?? false,
        spaceAfterComma: options.spaceAfterComma ?? true,
        spaceAroundOperators: options.spaceAroundOperators ?? true,
        blankLineBetweenSections: options.blankLineBetweenSections ?? false,
        preserveComments: options.preserveComments ?? true,
        preserveStrings: options.preserveStrings ?? true,
        preserveManualLineBreaksInSql: options.preserveManualLineBreaksInSql ?? true,
        conservativeEmbeddedSqlFormatting: options.conservativeEmbeddedSqlFormatting ?? true,
    };
}

function buildIndentUnit(options: ResolvedPowerBuilderFormattingOptions): string {
    if (options.indentStyle === 'tabs') {
        return '\t';
    }

    return ' '.repeat(options.indentSize);
}

function buildContinuationIndentUnit(options: ResolvedPowerBuilderFormattingOptions): string {
    if (options.indentStyle === 'tabs') {
        return '\t';
    }

    return ' '.repeat(options.continuationIndentSize);
}

function getPreparedLineSectionKind(preparedLine: PreparedLine): FormattingSectionKind | undefined {
    if (!preparedLine.trimmed) {
        return undefined;
    }

    const statementText = preparedLine.statements[0]?.text?.trim() ?? preparedLine.trimmed;

    return isPowerBuilderDeclarationStatement(statementText)
        ? 'declaration'
        : 'executable';
}

function buildPhrasePattern(phrases: readonly string[]): RegExp {
    const patternSource = [...phrases]
        .map(phrase => normalizePhraseKey(phrase))
        .sort((left, right) => right.length - left.length)
        .map(phrase => escapeRegex(phrase).replace(/\s+/g, '\\s+'))
        .join('|');

    return new RegExp(`\\b(${patternSource})\\b`, 'gi');
}

function replaceRegexMatches(
    text: string,
    pattern: RegExp,
    replaceMatch: (match: RegExpExecArray) => string,
): string {
    const flags = pattern.flags.includes('g')
        ? pattern.flags
        : `${pattern.flags}g`;
    const regex = new RegExp(pattern.source, flags);

    let result = '';
    let cursor = 0;
    let match = regex.exec(text);

    while (match) {
        result += text.slice(cursor, match.index);
        result += replaceMatch(match);
        cursor = match.index + match[0].length;
        match = regex.exec(text);
    }

    result += text.slice(cursor);
    return result;
}

function applyCaseMode(text: string, mode: PowerBuilderFormattingCaseMode): string {
    const normalizedText = text.replace(/\s+/g, ' ');

    if (mode === 'upper') {
        return normalizedText.toUpperCase();
    }

    if (mode === 'lower') {
        return normalizedText.toLowerCase();
    }

    return normalizedText;
}

function normalizePhraseKey(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}