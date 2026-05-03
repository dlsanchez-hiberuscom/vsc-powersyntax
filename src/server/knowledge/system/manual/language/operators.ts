import { PbSystemSymbolEntry } from '../../types';
import { operator } from '../common';

export const PB_MANUAL_CORE_OPERATOR_CATEGORIES = [
    'Aritmético',
    'Comparación',
    'Asignación',
    'Cadena',
] as const;

export const PB_MANUAL_CORE_OPERATORS: readonly PbSystemSymbolEntry[] = [
    // — Aritmético —
    operator({ name: '+', category: 'Aritmético', summary: 'Suma o concatenación.' }),
    operator({ name: '-', category: 'Aritmético', summary: 'Resta o negación.' }),
    operator({ name: '*', category: 'Aritmético', summary: 'Multiplicación.' }),
    operator({ name: '/', category: 'Aritmético', summary: 'División.' }),
    operator({ name: '^', category: 'Aritmético', summary: 'Exponenciación.' }),

    // — Comparación —
    operator({ name: '=', category: 'Comparación', summary: 'Igualdad o asignación.' }),
    operator({ name: '<>', category: 'Comparación', summary: 'Desigualdad.' }),
    operator({ name: '<', category: 'Comparación', summary: 'Menor que.' }),
    operator({ name: '>', category: 'Comparación', summary: 'Mayor que.' }),
    operator({ name: '<=', category: 'Comparación', summary: 'Menor o igual que.' }),
    operator({ name: '>=', category: 'Comparación', summary: 'Mayor o igual que.' }),

    // — Asignación —
    operator({ name: '+=', category: 'Asignación', summary: 'Suma y asignación.' }),
    operator({ name: '-=', category: 'Asignación', summary: 'Resta y asignación.' }),
    operator({ name: '*=', category: 'Asignación', summary: 'Multiplicación y asignación.' }),

    // — Cadena —
    operator({ name: '&', category: 'Cadena', summary: 'Continuación de línea.' }),
];
