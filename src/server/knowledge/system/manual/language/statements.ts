import { PbSystemSymbolEntry } from '../../types';
import { statement } from '../common';

export const PB_MANUAL_CORE_STATEMENT_CATEGORIES = [
    'Control flow',
] as const;

export const PB_MANUAL_CORE_STATEMENTS: readonly PbSystemSymbolEntry[] = [
    statement({
        name: 'HALT',
        category: 'Control flow',
        summary: 'Stops the execution of the PowerBuilder application.',
        signatures: [{ label: 'HALT [CLOSE]' }],
        appliesTo: ['PowerScript statements'],
        lookupAliases: ['halt close'],
        manualOverlay: { mode: 'override', reason: 'Hardening HALT statement documentation.', evidence: ['manual-core:language:statements:halt'] }
    }),
];
