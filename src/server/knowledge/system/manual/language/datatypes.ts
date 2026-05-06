import { PbSystemSymbolEntry } from '../../types';
import { datatype } from '../common';

export const PB_MANUAL_CORE_DATATYPE_CATEGORIES = [
    'Numeric',
    'Text',
    'Date/Time',
    'Other',
] as const;

export const PB_MANUAL_CORE_DATATYPES: readonly PbSystemSymbolEntry[] = [
    datatype({
        name: 'Integer',
        category: 'Numeric',
        summary: '16-bit signed integer (−32768 to 32767).',
        lookupAliases: ['int'],
        manualOverlay: { mode: 'override', reason: 'Hardening Integer documentation.', evidence: ['manual-core:language:datatypes:integer'] }
    }),
    datatype({
        name: 'Long',
        category: 'Numeric',
        summary: '32-bit signed integer.',
        manualOverlay: { mode: 'override', reason: 'Hardening Long documentation.', evidence: ['manual-core:language:datatypes:long'] }
    }),
    datatype({
        name: 'LongLong',
        category: 'Numeric',
        summary: '64-bit signed integer.',
        manualOverlay: { mode: 'override', reason: 'Hardening LongLong documentation.', evidence: ['manual-core:language:datatypes:longlong'] }
    }),
    datatype({
        name: 'LongPtr',
        category: 'Numeric',
        summary: 'Pointer integer (32 or 64 bits depending on platform).',
        manualOverlay: { mode: 'override', reason: 'Hardening LongPtr documentation.', evidence: ['manual-core:language:datatypes:longptr'] }
    }),
    datatype({
        name: 'UnsignedInteger',
        category: 'Numeric',
        summary: '16-bit unsigned integer.',
        lookupAliases: ['uint', 'unsignedint'],
        manualOverlay: { mode: 'override', reason: 'Hardening UnsignedInteger documentation.', evidence: ['manual-core:language:datatypes:unsignedinteger'] }
    }),
    datatype({
        name: 'UnsignedLong',
        category: 'Numeric',
        summary: '32-bit unsigned integer.',
        lookupAliases: ['ulong'],
        manualOverlay: { mode: 'override', reason: 'Hardening UnsignedLong documentation.', evidence: ['manual-core:language:datatypes:unsignedlong'] }
    }),
    datatype({
        name: 'Decimal',
        category: 'Numeric',
        summary: 'Fixed-precision decimal number (up to 28 digits).',
        lookupAliases: ['dec'],
        manualOverlay: { mode: 'override', reason: 'Hardening Decimal documentation.', evidence: ['manual-core:language:datatypes:decimal'] }
    }),
    datatype({
        name: 'Double',
        category: 'Numeric',
        summary: 'Double-precision floating-point number.',
        manualOverlay: { mode: 'override', reason: 'Hardening Double documentation.', evidence: ['manual-core:language:datatypes:double'] }
    }),
    datatype({
        name: 'Real',
        category: 'Numeric',
        summary: 'Single-precision floating-point number.',
        manualOverlay: { mode: 'override', reason: 'Hardening Real documentation.', evidence: ['manual-core:language:datatypes:real'] }
    }),
    datatype({
        name: 'Number',
        category: 'Numeric',
        summary: 'Generic alias for Decimal.',
        manualOverlay: { mode: 'override', reason: 'Hardening Number documentation.', evidence: ['manual-core:language:datatypes:number'] }
    }),
    datatype({
        name: 'Byte',
        category: 'Numeric',
        summary: '8-bit unsigned integer (0 to 255).',
        manualOverlay: { mode: 'override', reason: 'Hardening Byte documentation.', evidence: ['manual-core:language:datatypes:byte'] }
    }),

    // — Text —
    datatype({
        name: 'String',
        category: 'Text',
        summary: 'Variable-length Unicode text string.',
        manualOverlay: { mode: 'override', reason: 'Hardening String documentation.', evidence: ['manual-core:language:datatypes:string'] }
    }),
    datatype({
        name: 'Char',
        category: 'Text',
        summary: 'Individual Unicode character.',
        lookupAliases: ['character'],
        manualOverlay: { mode: 'override', reason: 'Hardening Char documentation.', evidence: ['manual-core:language:datatypes:char'] }
    }),

    // — Date/Time —
    datatype({
        name: 'Date',
        category: 'Date/Time',
        summary: 'Date without a time component.',
        manualOverlay: { mode: 'override', reason: 'Hardening Date documentation.', evidence: ['manual-core:language:datatypes:date'] }
    }),
    datatype({
        name: 'Time',
        category: 'Date/Time',
        summary: 'Time without a date component.',
        manualOverlay: { mode: 'override', reason: 'Hardening Time documentation.', evidence: ['manual-core:language:datatypes:time'] }
    }),
    datatype({
        name: 'DateTime',
        category: 'Date/Time',
        summary: 'Combination of date and time.',
        lookupAliases: ['timestamp'],
        manualOverlay: { mode: 'override', reason: 'Hardening DateTime documentation.', evidence: ['manual-core:language:datatypes:datetime'] }
    }),

    // — Other —
    datatype({
        name: 'Boolean',
        category: 'Other',
        summary: 'Logical type: TRUE or FALSE.',
        manualOverlay: { mode: 'override', reason: 'Hardening Boolean documentation.', evidence: ['manual-core:language:datatypes:boolean'] }
    }),
    datatype({
        name: 'Blob',
        category: 'Other',
        summary: 'Variable-length binary data (Binary Large Object).',
        manualOverlay: { mode: 'override', reason: 'Hardening Blob documentation.', evidence: ['manual-core:language:datatypes:blob'] }
    }),
    datatype({
        name: 'Any',
        category: 'Other',
        summary: 'Generic type that can contain any data type.',
        manualOverlay: { mode: 'override', reason: 'Hardening Any documentation.', evidence: ['manual-core:language:datatypes:any'] }
    }),
];
