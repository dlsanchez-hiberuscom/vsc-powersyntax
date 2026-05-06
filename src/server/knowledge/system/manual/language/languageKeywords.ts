import { PbSystemSymbolEntry } from '../../types';
import { languageKeyword } from '../common';

export const PB_MANUAL_CORE_KEYWORD_CATEGORIES = [
    'Control flow',
    'Declaration',
    'Block',
    'Invocation',
    'Error handling',
] as const;

export const PB_MANUAL_CORE_KEYWORDS: readonly PbSystemSymbolEntry[] = [
    // — Control flow —
    languageKeyword({
        name: 'IF',
        category: 'Control flow',
        summary: 'Conditional evaluation. Requires THEN and END IF.',
        manualOverlay: { mode: 'override', reason: 'Hardening IF documentation.', evidence: ['manual-core:language:keywords:if'] }
    }),
    languageKeyword({
        name: 'THEN',
        category: 'Control flow',
        summary: 'Marks the true block of an IF.',
        manualOverlay: { mode: 'override', reason: 'Hardening THEN documentation.', evidence: ['manual-core:language:keywords:then'] }
    }),
    languageKeyword({
        name: 'ELSE',
        category: 'Control flow',
        summary: 'Alternative block of an IF.',
        manualOverlay: { mode: 'override', reason: 'Hardening ELSE documentation.', evidence: ['manual-core:language:keywords:else'] }
    }),
    languageKeyword({
        name: 'ELSEIF',
        category: 'Control flow',
        summary: 'Chained alternative condition.',
        manualOverlay: { mode: 'override', reason: 'Hardening ELSEIF documentation.', evidence: ['manual-core:language:keywords:elseif'] }
    }),
    languageKeyword({
        name: 'CHOOSE',
        category: 'Control flow',
        summary: 'Start of a CHOOSE CASE structure.',
        lookupAliases: ['choose case'],
        manualOverlay: { mode: 'override', reason: 'Hardening CHOOSE documentation.', evidence: ['manual-core:language:keywords:choose'] }
    }),
    languageKeyword({
        name: 'CASE',
        category: 'Control flow',
        summary: 'Branch within a CHOOSE CASE.',
        manualOverlay: { mode: 'override', reason: 'Hardening CASE documentation.', evidence: ['manual-core:language:keywords:case'] }
    }),
    languageKeyword({
        name: 'FOR',
        category: 'Control flow',
        summary: 'Counted loop. Requires NEXT.',
        lookupAliases: ['for to', 'for to step'],
        manualOverlay: { mode: 'override', reason: 'Hardening FOR documentation.', evidence: ['manual-core:language:keywords:for'] }
    }),
    languageKeyword({
        name: 'TO',
        category: 'Control flow',
        summary: 'Upper limit of a FOR loop.',
        manualOverlay: { mode: 'override', reason: 'Hardening TO documentation.', evidence: ['manual-core:language:keywords:to'] }
    }),
    languageKeyword({
        name: 'STEP',
        category: 'Control flow',
        summary: 'Increment of a FOR loop.',
        manualOverlay: { mode: 'override', reason: 'Hardening STEP documentation.', evidence: ['manual-core:language:keywords:step'] }
    }),
    languageKeyword({
        name: 'NEXT',
        category: 'Control flow',
        summary: 'Closing of a FOR loop.',
        manualOverlay: { mode: 'override', reason: 'Hardening NEXT documentation.', evidence: ['manual-core:language:keywords:next'] }
    }),
    languageKeyword({
        name: 'DO',
        category: 'Control flow',
        summary: 'DO ... WHILE/UNTIL ... LOOP loop.',
        manualOverlay: { mode: 'override', reason: 'Hardening DO documentation.', evidence: ['manual-core:language:keywords:do'] }
    }),
    languageKeyword({
        name: 'WHILE',
        category: 'Control flow',
        summary: 'Continuation condition of a DO loop.',
        manualOverlay: { mode: 'override', reason: 'Hardening WHILE documentation.', evidence: ['manual-core:language:keywords:while'] }
    }),
    languageKeyword({
        name: 'UNTIL',
        category: 'Control flow',
        summary: 'Exit condition of a DO loop.',
        manualOverlay: { mode: 'override', reason: 'Hardening UNTIL documentation.', evidence: ['manual-core:language:keywords:until'] }
    }),
    languageKeyword({
        name: 'LOOP',
        category: 'Control flow',
        summary: 'Closing of a DO loop.',
        manualOverlay: { mode: 'override', reason: 'Hardening LOOP documentation.', evidence: ['manual-core:language:keywords:loop'] }
    }),
    languageKeyword({
        name: 'RETURN',
        category: 'Control flow',
        summary: 'Returns from a function or subroutine.',
        manualOverlay: { mode: 'override', reason: 'Hardening RETURN documentation.', evidence: ['manual-core:language:keywords:return'] }
    }),
    languageKeyword({
        name: 'EXIT',
        category: 'Control flow',
        summary: 'Exits from the innermost loop.',
        manualOverlay: { mode: 'override', reason: 'Hardening EXIT documentation.', evidence: ['manual-core:language:keywords:exit'] }
    }),
    languageKeyword({
        name: 'CONTINUE',
        category: 'Control flow',
        summary: 'Skips to the next iteration of the loop.',
        manualOverlay: { mode: 'override', reason: 'Hardening CONTINUE documentation.', evidence: ['manual-core:language:keywords:continue'] }
    }),
    languageKeyword({
        name: 'GOTO',
        category: 'Control flow',
        summary: 'Unconditional jump to a label.',
        manualOverlay: { mode: 'override', reason: 'Hardening GOTO documentation.', evidence: ['manual-core:language:keywords:goto'] }
    }),

    // — Declaration —
    languageKeyword({
        name: 'FUNCTION',
        category: 'Declaration',
        summary: 'Declares or defines a function with a return value.',
        manualOverlay: { mode: 'override', reason: 'Hardening FUNCTION documentation.', evidence: ['manual-core:language:keywords:function'] }
    }),
    languageKeyword({
        name: 'SUBROUTINE',
        category: 'Declaration',
        summary: 'Declares or defines a subroutine (no return value).',
        manualOverlay: { mode: 'override', reason: 'Hardening SUBROUTINE documentation.', evidence: ['manual-core:language:keywords:subroutine'] }
    }),
    languageKeyword({
        name: 'EVENT',
        category: 'Declaration',
        summary: 'Declares or defines an event.',
        manualOverlay: { mode: 'override', reason: 'Hardening EVENT documentation.', evidence: ['manual-core:language:keywords:event'] }
    }),
    languageKeyword({
        name: 'ON',
        category: 'Declaration',
        summary: 'Implements an event on-handler.',
        manualOverlay: { mode: 'override', reason: 'Hardening ON documentation.', evidence: ['manual-core:language:keywords:on'] }
    }),
    languageKeyword({
        name: 'TYPE',
        category: 'Declaration',
        summary: 'Declares a type (class) or a nested type block.',
        manualOverlay: { mode: 'override', reason: 'Hardening TYPE documentation.', evidence: ['manual-core:language:keywords:type'] }
    }),
    languageKeyword({
        name: 'FROM',
        category: 'Declaration',
        summary: 'Specifies the ancestor of a TYPE.',
        manualOverlay: { mode: 'override', reason: 'Hardening FROM documentation.', evidence: ['manual-core:language:keywords:from'] }
    }),
    languageKeyword({
        name: 'WITHIN',
        category: 'Declaration',
        summary: 'Specifies the container of a nested TYPE.',
        manualOverlay: { mode: 'override', reason: 'Hardening WITHIN documentation.', evidence: ['manual-core:language:keywords:within'] }
    }),
    languageKeyword({
        name: 'AUTOINSTANTIATE',
        category: 'Declaration',
        summary: 'Type modifier: automatic instantiation.',
        manualOverlay: { mode: 'override', reason: 'Hardening AUTOINSTANTIATE documentation.', evidence: ['manual-core:language:keywords:autoinstantiate'] }
    }),

    // — Block —
    languageKeyword({
        name: 'FORWARD',
        category: 'Block',
        summary: 'Forward declaration block.',
        manualOverlay: { mode: 'override', reason: 'Hardening FORWARD documentation.', evidence: ['manual-core:language:keywords:forward'] }
    }),
    languageKeyword({
        name: 'PROTOTYPES',
        category: 'Block',
        summary: 'Function/subroutine prototypes block.',
        manualOverlay: { mode: 'override', reason: 'Hardening PROTOTYPES documentation.', evidence: ['manual-core:language:keywords:prototypes'] }
    }),
    languageKeyword({
        name: 'VARIABLES',
        category: 'Block',
        summary: 'Type or global variables block.',
        manualOverlay: { mode: 'override', reason: 'Hardening VARIABLES documentation.', evidence: ['manual-core:language:keywords:variables'] }
    }),
    languageKeyword({
        name: 'END',
        category: 'Block',
        summary: 'Block closure (IF, FOR, FUNCTION, etc.).',
        manualOverlay: { mode: 'override', reason: 'Hardening END documentation.', evidence: ['manual-core:language:keywords:end'] }
    }),

    // — Invocation —
    languageKeyword({
        name: 'CALL',
        category: 'Invocation',
        summary: 'Explicitly invokes an ancestor event.',
        manualOverlay: { mode: 'override', reason: 'Hardening CALL documentation.', evidence: ['manual-core:language:keywords:call'] }
    }),
    languageKeyword({
        name: 'DYNAMIC',
        category: 'Invocation',
        summary: 'Dynamic invocation (late-bound).',
        manualOverlay: { mode: 'override', reason: 'Hardening DYNAMIC documentation.', evidence: ['manual-core:language:keywords:dynamic'] }
    }),
    languageKeyword({
        name: 'POST',
        category: 'Invocation',
        summary: 'Sends an event asynchronously.',
        manualOverlay: { mode: 'override', reason: 'Hardening POST documentation.', evidence: ['manual-core:language:keywords:post'] }
    }),
    languageKeyword({
        name: 'TRIGGER',
        category: 'Invocation',
        summary: 'Triggers an event synchronously.',
        manualOverlay: { mode: 'override', reason: 'Hardening TRIGGER documentation.', evidence: ['manual-core:language:keywords:trigger'] }
    }),
    languageKeyword({
        name: 'CREATE',
        category: 'Invocation',
        summary: 'Instantiates an object.',
        manualOverlay: { mode: 'override', reason: 'Hardening CREATE documentation.', evidence: ['manual-core:language:keywords:create'] }
    }),
    languageKeyword({
        name: 'DESTROY',
        category: 'Invocation',
        summary: 'Destroys an object instance.',
        manualOverlay: { mode: 'override', reason: 'Hardening DESTROY documentation.', evidence: ['manual-core:language:keywords:destroy'] }
    }),
    languageKeyword({
        name: 'OPEN',
        category: 'Invocation',
        summary: 'Opens a window or sheet.',
        manualOverlay: { mode: 'override', reason: 'Hardening OPEN documentation.', evidence: ['manual-core:language:keywords:open'] }
    }),
    languageKeyword({
        name: 'CLOSE',
        category: 'Invocation',
        summary: 'Closes a window.',
        manualOverlay: { mode: 'override', reason: 'Hardening CLOSE keyword documentation.', evidence: ['manual-core:language:keywords:close_keyword'] }
    }),

    // — Error handling —
    languageKeyword({
        name: 'TRY',
        category: 'Error handling',
        summary: 'Start of an exception handling block.',
        manualOverlay: { mode: 'override', reason: 'Hardening TRY documentation.', evidence: ['manual-core:language:keywords:try'] }
    }),
    languageKeyword({
        name: 'CATCH',
        category: 'Error handling',
        summary: 'Catches a thrown exception.',
        manualOverlay: { mode: 'override', reason: 'Hardening CATCH documentation.', evidence: ['manual-core:language:keywords:catch'] }
    }),
    languageKeyword({
        name: 'FINALLY',
        category: 'Error handling',
        summary: 'Cleanup block always executed.',
        manualOverlay: { mode: 'override', reason: 'Hardening FINALLY documentation.', evidence: ['manual-core:language:keywords:finally'] }
    }),
    languageKeyword({
        name: 'THROW',
        category: 'Error handling',
        summary: 'Throws an exception.',
        manualOverlay: { mode: 'override', reason: 'Hardening THROW documentation.', evidence: ['manual-core:language:keywords:throw'] }
    }),
    languageKeyword({
        name: 'THROWS',
        category: 'Error handling',
        summary: 'Declares that a function can throw exceptions.',
        manualOverlay: { mode: 'override', reason: 'Hardening THROWS documentation.', evidence: ['manual-core:language:keywords:throws'] }
    }),
];
