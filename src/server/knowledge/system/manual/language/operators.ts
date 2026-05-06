import { PbSystemSymbolEntry } from '../../types';
import { operator } from '../common';

export const PB_MANUAL_CORE_OPERATOR_CATEGORIES = [
    'Arithmetic',
    'Comparison',
    'Assignment',
    'String',
] as const;

export const PB_MANUAL_CORE_OPERATORS: readonly PbSystemSymbolEntry[] = [
    // — Arithmetic —
    operator({
        name: '+',
        category: 'Arithmetic',
        summary: 'Addition or concatenation.',
        manualOverlay: { mode: 'override', reason: 'Hardening + operator documentation.', evidence: ['manual-core:language:operators:plus'] }
    }),
    operator({
        name: '-',
        category: 'Arithmetic',
        summary: 'Subtraction or negation.',
        manualOverlay: { mode: 'override', reason: 'Hardening - operator documentation.', evidence: ['manual-core:language:operators:minus'] }
    }),
    operator({
        name: '*',
        category: 'Arithmetic',
        summary: 'Multiplication.',
        manualOverlay: { mode: 'override', reason: 'Hardening * operator documentation.', evidence: ['manual-core:language:operators:multiply'] }
    }),
    operator({
        name: '/',
        category: 'Arithmetic',
        summary: 'Division.',
        manualOverlay: { mode: 'override', reason: 'Hardening / operator documentation.', evidence: ['manual-core:language:operators:divide'] }
    }),
    operator({
        name: '^',
        category: 'Arithmetic',
        summary: 'Exponentiation.',
        manualOverlay: { mode: 'override', reason: 'Hardening ^ operator documentation.', evidence: ['manual-core:language:operators:power'] }
    }),

    // — Comparison —
    operator({
        name: '=',
        category: 'Comparison',
        summary: 'Equality or assignment.',
        manualOverlay: { mode: 'override', reason: 'Hardening = operator documentation.', evidence: ['manual-core:language:operators:equal'] }
    }),
    operator({
        name: '<>',
        category: 'Comparison',
        summary: 'Inequality.',
        manualOverlay: { mode: 'override', reason: 'Hardening <> operator documentation.', evidence: ['manual-core:language:operators:notequal'] }
    }),
    operator({
        name: '<',
        category: 'Comparison',
        summary: 'Less than.',
        manualOverlay: { mode: 'override', reason: 'Hardening < operator documentation.', evidence: ['manual-core:language:operators:less'] }
    }),
    operator({
        name: '>',
        category: 'Comparison',
        summary: 'Greater than.',
        manualOverlay: { mode: 'override', reason: 'Hardening > operator documentation.', evidence: ['manual-core:language:operators:greater'] }
    }),
    operator({
        name: '<=',
        category: 'Comparison',
        summary: 'Less than or equal to.',
        manualOverlay: { mode: 'override', reason: 'Hardening <= operator documentation.', evidence: ['manual-core:language:operators:lessequal'] }
    }),
    operator({
        name: '>=',
        category: 'Comparison',
        summary: 'Greater than or equal to.',
        manualOverlay: { mode: 'override', reason: 'Hardening >= operator documentation.', evidence: ['manual-core:language:operators:greaterequal'] }
    }),

    // — Assignment —
    operator({
        name: '+=',
        category: 'Assignment',
        summary: 'Addition and assignment.',
        manualOverlay: { mode: 'override', reason: 'Hardening += operator documentation.', evidence: ['manual-core:language:operators:plusassign'] }
    }),
    operator({
        name: '-=',
        category: 'Assignment',
        summary: 'Subtraction and assignment.',
        manualOverlay: { mode: 'override', reason: 'Hardening -= operator documentation.', evidence: ['manual-core:language:operators:minusassign'] }
    }),
    operator({
        name: '*=',
        category: 'Assignment',
        summary: 'Multiplication and assignment.',
        manualOverlay: { mode: 'override', reason: 'Hardening *= operator documentation.', evidence: ['manual-core:language:operators:multiplyassign'] }
    }),

    // — String —
    operator({
        name: '&',
        category: 'String',
        summary: 'Line continuation.',
        manualOverlay: { mode: 'override', reason: 'Hardening & operator documentation.', evidence: ['manual-core:language:operators:continuation'] }
    }),
];
