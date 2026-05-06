import { PbSystemSymbolEntry } from '../../types';
import { reservedWord } from '../common';

export const PB_MANUAL_CORE_RESERVED_WORD_CATEGORIES = [
    'Literals',
    'Logical operators',
    'Reserved words',
] as const;

export const PB_MANUAL_CORE_RESERVED_WORDS: readonly PbSystemSymbolEntry[] = [
    // — Literals —
    reservedWord({
        name: 'TRUE',
        category: 'Literals',
        summary: 'Boolean true literal.',
        manualOverlay: { mode: 'override', reason: 'Hardening TRUE documentation.', evidence: ['manual-core:language:reserved:true'] }
    }),
    reservedWord({
        name: 'FALSE',
        category: 'Literals',
        summary: 'Boolean false literal.',
        manualOverlay: { mode: 'override', reason: 'Hardening FALSE documentation.', evidence: ['manual-core:language:reserved:false'] }
    }),
    reservedWord({
        name: 'NULL',
        category: 'Literals',
        summary: 'Null value. Indicates the absence of a valid value.',
        manualOverlay: { mode: 'override', reason: 'Hardening NULL documentation.', evidence: ['manual-core:language:reserved:null'] }
    }),

    // — Logical operators —
    reservedWord({
        name: 'NOT',
        category: 'Logical operators',
        summary: 'Logical negation.',
        manualOverlay: { mode: 'override', reason: 'Hardening NOT documentation.', evidence: ['manual-core:language:reserved:not'] }
    }),
    reservedWord({
        name: 'AND',
        category: 'Logical operators',
        summary: 'Logical conjunction.',
        manualOverlay: { mode: 'override', reason: 'Hardening AND documentation.', evidence: ['manual-core:language:reserved:and'] }
    }),
    reservedWord({
        name: 'OR',
        category: 'Logical operators',
        summary: 'Logical disjunction.',
        manualOverlay: { mode: 'override', reason: 'Hardening OR documentation.', evidence: ['manual-core:language:reserved:or'] }
    }),

    // — Reserved words —
    reservedWord({
        name: 'IT',
        category: 'Reserved words',
        summary: 'Implicit reference to the result of an expression.',
        manualOverlay: { mode: 'override', reason: 'Hardening IT documentation.', evidence: ['manual-core:language:reserved:it'] }
    }),
    reservedWord({
        name: 'ANY',
        category: 'Reserved words',
        summary: 'Generic type that can contain any value.',
        manualOverlay: { mode: 'override', reason: 'Hardening ANY documentation.', evidence: ['manual-core:language:reserved:any'] }
    }),
    reservedWord({
        name: 'IS',
        category: 'Reserved words',
        summary: 'Type comparison operator.',
        manualOverlay: { mode: 'override', reason: 'Hardening IS documentation.', evidence: ['manual-core:language:reserved:is'] }
    }),
    reservedWord({
        name: 'OF',
        category: 'Reserved words',
        summary: 'Used with CHOOSE CASE and other constructs.',
        manualOverlay: { mode: 'override', reason: 'Hardening OF documentation.', evidence: ['manual-core:language:reserved:of'] }
    }),
    reservedWord({
        name: 'USING',
        category: 'Reserved words',
        summary: 'Associates a resource with a block.',
        manualOverlay: { mode: 'override', reason: 'Hardening USING documentation.', evidence: ['manual-core:language:reserved:using'] }
    }),
    reservedWord({
        name: 'SET',
        category: 'Reserved words',
        summary: 'Assigns a value to a property.',
        manualOverlay: { mode: 'override', reason: 'Hardening SET documentation.', evidence: ['manual-core:language:reserved:set'] }
    }),
    reservedWord({
        name: 'GET',
        category: 'Reserved words',
        summary: 'Retrieves the value of a property.',
        manualOverlay: { mode: 'override', reason: 'Hardening GET documentation.', evidence: ['manual-core:language:reserved:get'] }
    }),
    reservedWord({
        name: 'SYSTEM',
        category: 'Reserved words',
        summary: 'Reference to the system object.',
        manualOverlay: { mode: 'override', reason: 'Hardening SYSTEM documentation.', evidence: ['manual-core:language:reserved:system'] }
    }),
    reservedWord({
        name: 'LIBRARY',
        category: 'Reserved words',
        summary: 'Reference to a PBL library.',
        manualOverlay: { mode: 'override', reason: 'Hardening LIBRARY documentation.', evidence: ['manual-core:language:reserved:library'] }
    }),
    reservedWord({
        name: 'HALT',
        category: 'Reserved words',
        summary: 'Stops application execution.',
        manualOverlay: { mode: 'override', reason: 'Hardening HALT reserved word documentation.', evidence: ['manual-core:language:reserved:halt_keyword'] }
    }),
];
