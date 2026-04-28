import { PbSystemSymbolEntry } from '../types';
import { statement } from './common';

export const PB_MANUAL_CORE_STATEMENT_CATEGORIES = [
    'Control de flujo',
] as const;

export const PB_MANUAL_CORE_STATEMENTS: readonly PbSystemSymbolEntry[] = [
    statement({
        name: 'HALT',
        category: 'Control de flujo',
        summary: 'Detiene la ejecución de la aplicación PowerBuilder.',
        signatures: [{ label: 'HALT [CLOSE]' }],
        appliesTo: ['sentencias PowerScript'],
        lookupAliases: ['halt close'],
    }),
];
