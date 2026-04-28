import { PB_IDENTIFIER_SOURCE } from './pbIdentifier';

export type PbExecutableBlockKind =
    | 'IF'
    | 'FOR'
    | 'DO'
    | 'CHOOSE CASE'
    | 'TRY';

export type PbStructureBlockKind =
    | PbExecutableBlockKind
    | 'TYPE'
    | 'FUNCTION'
    | 'SUBROUTINE'
    | 'EVENT'
    | 'ON'
    | 'FORWARD'
    | 'PROTOTYPES'
    | 'VARIABLES';

export interface PbStructureOpenOptions {
    treatCallableDeclarationsAsBlockOpen?: boolean;
}

export const IDENTIFIER_SOURCE = PB_IDENTIFIER_SOURCE;
export const TYPE_REFERENCE_SOURCE = '[a-zA-Z_$#%][\\w$#%`-]*';

export const ROOT_TYPE_PATTERN = new RegExp(
    '^\\s*global\\s+type\\s+(' + IDENTIFIER_SOURCE + ')\\s+from\\s+(' + TYPE_REFERENCE_SOURCE + ')\\b',
    'i',
);

export const SIMPLE_TYPE_PATTERN = new RegExp(
    '^\\s*type\\s+(' + IDENTIFIER_SOURCE + ')\\s+from\\s+(' + TYPE_REFERENCE_SOURCE + ')\\b(?!\\s+within\\b)',
    'i',
);

export const NESTED_TYPE_PATTERN = new RegExp(
    '^\\s*type\\s+(' + IDENTIFIER_SOURCE + ')\\s+from\\s+(' + TYPE_REFERENCE_SOURCE + ')\\s+within\\s+(' + IDENTIFIER_SOURCE + ')\\b',
    'i',
);

export const STRUCTURE_PATTERN = new RegExp(
    '^\\s*(?:global\\s+)?type\\s+(' + IDENTIFIER_SOURCE + ')\\s+from\\s+structure(?:\\s+within\\s+(' + IDENTIFIER_SOURCE + '))?\\b',
    'i',
);

export const OBJECT_INSTANCE_PATTERN = new RegExp(
    '^\\s*global\\s+(' + IDENTIFIER_SOURCE + ')\\s+(' + IDENTIFIER_SOURCE + ')\\s*$',
    'i',
);

export const FORWARD_TYPE_PATTERN = /^\s*forward\s+(?:global\s+)?type\b.*\bfrom\b/i;

export const FORWARD_PROTOTYPES_START_PATTERN = /^\s*forward\s+prototypes\b/i;
export const FORWARD_START_PATTERN = /^\s*forward\b/i;
export const FORWARD_ONLY_START_PATTERN = /^\s*forward\s*$/i;
export const END_FORWARD_PATTERN = /^\s*end\s+forward\b/i;
export const TYPE_VARIABLES_START_PATTERN = /^\s*type\s+variables\b/i;
export const TYPE_PROTOTYPES_START_PATTERN = /^\s*type\s+prototypes\b/i;
export const END_PROTOTYPES_PATTERN = /^\s*end\s+prototypes\b/i;
export const END_VARIABLES_PATTERN = /^\s*end\s+variables\b/i;
export const END_TYPE_PATTERN = /^\s*end\s+type\b/i;

export const END_FUNCTION_PATTERN = /^\s*end\s+function\b/i;
export const END_SUBROUTINE_PATTERN = /^\s*end\s+subroutine\b/i;
export const END_EVENT_PATTERN = /^\s*end\s+event\b/i;
export const END_ON_PATTERN = /^\s*end\s+on\b/i;

const VARIABLE_ACCESS_MODIFIER_SOURCE = 'public|private|protected|global|shared|privateread|privatewrite|protectedread|protectedwrite';

export const ACCESS_LABEL_PATTERN = new RegExp(
    `^\\s*(${VARIABLE_ACCESS_MODIFIER_SOURCE})\\s*:\\s*$`,
    'i',
);
export const INLINE_ACCESS_PATTERN = new RegExp(
    `^\\s*(${VARIABLE_ACCESS_MODIFIER_SOURCE})\\b`,
    'i',
);

export const FUNCTION_PATTERN = new RegExp(
    '^\\s*(public|private|protected|global)?\\s*function\\s+([a-zA-Z_$#%][\\w$#%]*(?:\\s*\\[\\s*\\])?)\\s+(' +
        IDENTIFIER_SOURCE +
        ')\\s*\\(([^)]*)\\)',
    'i',
);

export const SUBROUTINE_PATTERN = new RegExp(
    '^\\s*(public|private|protected|global)?\\s*subroutine\\s+(' +
        IDENTIFIER_SOURCE +
        ')\\s*\\(([^)]*)\\)',
    'i',
);

export const EXTERNAL_CALLABLE_LIBRARY_PATTERN = /\blibrary\s+"([^"]+)"/i;
export const EXTERNAL_CALLABLE_ALIAS_PATTERN = /\balias\s+for\s+"([^"]+)"/i;

export const QUALIFIED_EVENT_PATTERN = new RegExp(
    '^\\s*event\\s+(?:type\\s+\\w+\\s+)?(' +
        IDENTIFIER_SOURCE +
        ')\\s*::\\s*(' +
        IDENTIFIER_SOURCE +
        ')\\s*(?:\\(([^)]*)\\))?',
    'i',
);

export const EVENT_PATTERN = new RegExp(
    '^\\s*event\\s+(?:type\\s+\\w+\\s+)?(' + IDENTIFIER_SOURCE + ')\\s*(?:\\(([^)]*)\\))?',
    'i',
);

export const ON_EVENT_PATTERN = new RegExp(
    '^\\s*on\\s+(' + IDENTIFIER_SOURCE + ')\\.(' + IDENTIFIER_SOURCE + ')\\b',
    'i',
);

export const VARIABLE_PATTERN = new RegExp(
    `^\\s*(?:(?:${VARIABLE_ACCESS_MODIFIER_SOURCE})\\s+)?(?:(readonly|constant)\\s+)?([a-zA-Z_$#%][\\w$#%\`-]*(?:\\s*\\[\\s*\\])?)\\s+(` +
        IDENTIFIER_SOURCE +
        ')\\s*(?:\\[[^\\]]*\\])?',
    'i',
);

const IF_BLOCK_OPEN_PATTERN = /^if\b.*\bthen\s*$/i;
const ELSEIF_PATTERN = /^elseif\b.*\bthen\s*$/i;
const ELSE_PATTERN = /^else\b\s*$/i;
const END_IF_PATTERN = /^end\s+if\b/i;

const FOR_OPEN_PATTERN = /^for\b/i;
const NEXT_PATTERN = /^next\b/i;

const DO_OPEN_PATTERN = /^do\b/i;
const LOOP_PATTERN = /^loop\b/i;

const CHOOSE_CASE_OPEN_PATTERN = /^choose\s+case\b/i;
const END_CHOOSE_PATTERN = /^end\s+choose\b/i;

const TRY_OPEN_PATTERN = /^try\b/i;
const CATCH_PATTERN = /^catch\b/i;
const FINALLY_PATTERN = /^finally\b/i;
const END_TRY_PATTERN = /^end\s+try\b/i;

const CALLABLE_BLOCK_KINDS = new Set<PbStructureBlockKind>([
    'FUNCTION',
    'SUBROUTINE',
    'EVENT',
    'ON',
]);

const STRUCTURE_OPEN_MATCHERS: Array<{
    kind: PbStructureBlockKind;
    pattern: RegExp;
}> = [
    { kind: 'PROTOTYPES', pattern: FORWARD_PROTOTYPES_START_PATTERN },
    { kind: 'VARIABLES', pattern: TYPE_VARIABLES_START_PATTERN },
    { kind: 'PROTOTYPES', pattern: TYPE_PROTOTYPES_START_PATTERN },
    { kind: 'TYPE', pattern: FORWARD_TYPE_PATTERN },
    { kind: 'FORWARD', pattern: FORWARD_ONLY_START_PATTERN },
    { kind: 'TYPE', pattern: ROOT_TYPE_PATTERN },
    { kind: 'TYPE', pattern: STRUCTURE_PATTERN },
    { kind: 'TYPE', pattern: NESTED_TYPE_PATTERN },
    { kind: 'TYPE', pattern: SIMPLE_TYPE_PATTERN },
    { kind: 'FUNCTION', pattern: FUNCTION_PATTERN },
    { kind: 'SUBROUTINE', pattern: SUBROUTINE_PATTERN },
    { kind: 'EVENT', pattern: QUALIFIED_EVENT_PATTERN },
    { kind: 'EVENT', pattern: EVENT_PATTERN },
    { kind: 'ON', pattern: ON_EVENT_PATTERN },
    { kind: 'IF', pattern: IF_BLOCK_OPEN_PATTERN },
    { kind: 'FOR', pattern: FOR_OPEN_PATTERN },
    { kind: 'DO', pattern: DO_OPEN_PATTERN },
    { kind: 'CHOOSE CASE', pattern: CHOOSE_CASE_OPEN_PATTERN },
    { kind: 'TRY', pattern: TRY_OPEN_PATTERN },
];

const STRUCTURE_CLOSE_MATCHERS: Array<{
    kind: PbStructureBlockKind;
    pattern: RegExp;
}> = [
    { kind: 'IF', pattern: END_IF_PATTERN },
    { kind: 'FOR', pattern: NEXT_PATTERN },
    { kind: 'DO', pattern: LOOP_PATTERN },
    { kind: 'CHOOSE CASE', pattern: END_CHOOSE_PATTERN },
    { kind: 'TRY', pattern: END_TRY_PATTERN },
    { kind: 'FORWARD', pattern: END_FORWARD_PATTERN },
    { kind: 'VARIABLES', pattern: END_VARIABLES_PATTERN },
    { kind: 'PROTOTYPES', pattern: END_PROTOTYPES_PATTERN },
    { kind: 'TYPE', pattern: END_TYPE_PATTERN },
    { kind: 'FUNCTION', pattern: END_FUNCTION_PATTERN },
    { kind: 'SUBROUTINE', pattern: END_SUBROUTINE_PATTERN },
    { kind: 'EVENT', pattern: END_EVENT_PATTERN },
    { kind: 'ON', pattern: END_ON_PATTERN },
];

const EXECUTABLE_OPEN_MATCHERS: Array<{
    kind: PbExecutableBlockKind;
    pattern: RegExp;
}> = [
    { kind: 'IF', pattern: IF_BLOCK_OPEN_PATTERN },
    { kind: 'FOR', pattern: FOR_OPEN_PATTERN },
    { kind: 'DO', pattern: DO_OPEN_PATTERN },
    { kind: 'CHOOSE CASE', pattern: CHOOSE_CASE_OPEN_PATTERN },
    { kind: 'TRY', pattern: TRY_OPEN_PATTERN },
];

const EXECUTABLE_CLOSE_MATCHERS: Array<{
    kind: PbExecutableBlockKind;
    pattern: RegExp;
}> = [
    { kind: 'IF', pattern: END_IF_PATTERN },
    { kind: 'FOR', pattern: NEXT_PATTERN },
    { kind: 'DO', pattern: LOOP_PATTERN },
    { kind: 'CHOOSE CASE', pattern: END_CHOOSE_PATTERN },
    { kind: 'TRY', pattern: END_TRY_PATTERN },
];

export const PB_KEYWORDS = Array.from(
    new Set([
        'if',
        'then',
        'else',
        'elseif',
        'end if',
        'choose case',
        'case',
        'end choose',
        'for',
        'to',
        'step',
        'next',
        'do',
        'while',
        'loop',
        'until',
        'continue',
        'exit',
        'return',
        'try',
        'catch',
        'finally',
        'end try',
        'throw',
        'throws',
        'function',
        'end function',
        'subroutine',
        'end subroutine',
        'event',
        'end event',
        'on',
        'end on',
        'type',
        'end type',
        'type variables',
        'end variables',
        'type prototypes',
        'end prototypes',
        'from',
        'within',
        'forward',
        'forward prototypes',
        'end forward',
        'create',
        'destroy',
        'using',
        'open',
        'close',
        'halt',
        'goto',
        'call',
        'public',
        'private',
        'protected',
        'privateread',
        'privatewrite',
        'protectedread',
        'protectedwrite',
        'global',
        'shared',
        'constant',
        'readonly',
        'true',
        'false',
        'and',
        'or',
        'not'
    ]),
);

const PB_KEYWORD_REGEX_SOURCE = [...PB_KEYWORDS]
    .sort((left, right) => right.length - left.length)
    .map(keyword => escapeRegex(keyword).replace(/\s+/g, '\\s+'))
    .join('|');

export function createPbKeywordPattern(): RegExp {
    return new RegExp(
        `\\b(${PB_KEYWORD_REGEX_SOURCE})\\b`,
        'gi',
    );
}

export function getStructureBlockOpenKind(
    statement: string,
    options: PbStructureOpenOptions = {},
): PbStructureBlockKind | undefined {
    const treatCallableDeclarationsAsBlockOpen =
        options.treatCallableDeclarationsAsBlockOpen !== false;

    for (const matcher of STRUCTURE_OPEN_MATCHERS) {
        if (
            !treatCallableDeclarationsAsBlockOpen &&
            CALLABLE_BLOCK_KINDS.has(matcher.kind)
        ) {
            continue;
        }

        if (
            CALLABLE_BLOCK_KINDS.has(matcher.kind) &&
            isExternalCallableDeclaration(statement)
        ) {
            continue;
        }

        if (matcher.pattern.test(statement)) {
            return matcher.kind;
        }
    }

    return undefined;
}

export function getStructureBlockCloseKind(
    statement: string,
): PbStructureBlockKind | undefined {
    for (const matcher of STRUCTURE_CLOSE_MATCHERS) {
        if (matcher.pattern.test(statement)) {
            return matcher.kind;
        }
    }

    return undefined;
}

export function getExecutableBlockOpenKind(
    statement: string,
): PbExecutableBlockKind | undefined {
    for (const matcher of EXECUTABLE_OPEN_MATCHERS) {
        if (matcher.pattern.test(statement)) {
            return matcher.kind;
        }
    }

    return undefined;
}

export function getExecutableBlockCloseKind(
    statement: string,
): PbExecutableBlockKind | undefined {
    for (const matcher of EXECUTABLE_CLOSE_MATCHERS) {
        if (matcher.pattern.test(statement)) {
            return matcher.kind;
        }
    }

    return undefined;
}

export function isElseIfStatement(statement: string): boolean {
    return ELSEIF_PATTERN.test(statement);
}

export function isElseStatement(statement: string): boolean {
    return ELSE_PATTERN.test(statement);
}

export function isCatchStatement(statement: string): boolean {
    return CATCH_PATTERN.test(statement);
}

export function isFinallyStatement(statement: string): boolean {
    return FINALLY_PATTERN.test(statement);
}

export function isTransitionStatement(statement: string): boolean {
    return (
        isElseIfStatement(statement) ||
        isElseStatement(statement) ||
        isCatchStatement(statement) ||
        isFinallyStatement(statement)
    );
}

export function parseVariableAccessLabel(
    statement: string,
): string | undefined {
    const match = statement.match(ACCESS_LABEL_PATTERN);
    return match?.[1]?.toLowerCase();
}

export function parseInlineAccessModifier(
    statement: string,
): string | undefined {
    const match = statement.match(INLINE_ACCESS_PATTERN);
    return match?.[1]?.toLowerCase();
}

export function isExternalCallableDeclaration(
    statement: string,
): boolean {
    return (
        (FUNCTION_PATTERN.test(statement) || SUBROUTINE_PATTERN.test(statement)) &&
        EXTERNAL_CALLABLE_LIBRARY_PATTERN.test(statement)
    );
}

export function isIgnorablePowerScriptStatement(
    statement: string,
): boolean {
    return (
        statement.startsWith('//') ||
        statement.startsWith('/*') ||
        statement.startsWith('*') ||
        statement.startsWith('$PBExport')
    );
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}