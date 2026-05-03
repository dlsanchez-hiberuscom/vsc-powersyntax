import { PbSystemSymbolEntry } from '../types';
import { reservedWord } from './common';

export const PB_MANUAL_CORE_RESERVED_WORD_CATEGORIES = [
    'Literales',
    'Operadores lógicos',
    'Palabras reservadas',
] as const;

export const PB_MANUAL_CORE_RESERVED_WORDS: readonly PbSystemSymbolEntry[] = [
    // — Literales —
    reservedWord({ name: 'TRUE', category: 'Literales', summary: 'Literal booleano verdadero.' }),
    reservedWord({ name: 'FALSE', category: 'Literales', summary: 'Literal booleano falso.' }),
    reservedWord({ name: 'NULL', category: 'Literales', summary: 'Valor nulo. Indica la ausencia de un valor válido.' }),

    // — Operadores lógicos —
    reservedWord({ name: 'NOT', category: 'Operadores lógicos', summary: 'Negación lógica.' }),
    reservedWord({ name: 'AND', category: 'Operadores lógicos', summary: 'Conjunción lógica.' }),
    reservedWord({ name: 'OR', category: 'Operadores lógicos', summary: 'Disyunción lógica.' }),

    // — Palabras reservadas —
    reservedWord({ name: 'IT', category: 'Palabras reservadas', summary: 'Referencia implícita al resultado de una expresión.' }),
    reservedWord({ name: 'ANY', category: 'Palabras reservadas', summary: 'Tipo genérico que puede contener cualquier valor.' }),
    reservedWord({ name: 'IS', category: 'Palabras reservadas', summary: 'Operador de comparación de tipo.' }),
    reservedWord({ name: 'OF', category: 'Palabras reservadas', summary: 'Usado con CHOOSE CASE y otras construcciones.' }),
    reservedWord({ name: 'USING', category: 'Palabras reservadas', summary: 'Asocia un recurso con un bloque.' }),
    reservedWord({ name: 'SET', category: 'Palabras reservadas', summary: 'Asigna un valor a una propiedad.' }),
    reservedWord({ name: 'GET', category: 'Palabras reservadas', summary: 'Obtiene el valor de una propiedad.' }),
    reservedWord({ name: 'SYSTEM', category: 'Palabras reservadas', summary: 'Referencia al objeto sistema.' }),
    reservedWord({ name: 'LIBRARY', category: 'Palabras reservadas', summary: 'Referencia a una librería PBL.' }),
    reservedWord({ name: 'HALT', category: 'Palabras reservadas', summary: 'Detiene la ejecución de la aplicación.', lookupAliases: ['halt close'] }),
];
