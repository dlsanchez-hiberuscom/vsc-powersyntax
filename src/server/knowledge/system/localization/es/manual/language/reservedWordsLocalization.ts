import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para palabras reservadas del lenguaje.
 */
export const reservedWordsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'TRUE' },
        text: { summary: 'Literal booleano verdadero.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'FALSE' },
        text: { summary: 'Literal booleano falso.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'NULL' },
        text: { summary: 'Valor nulo. Indica la ausencia de un valor válido.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'NOT' },
        text: { summary: 'Negación lógica.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'AND' },
        text: { summary: 'Conjunción lógica.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'OR' },
        text: { summary: 'Disyunción lógica.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'IT' },
        text: { summary: 'Referencia implícita al resultado de una expresión.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'ANY' },
        text: { summary: 'Tipo genérico que puede contener cualquier valor.' },
    },

    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'IS' },
        text: { summary: 'Operador de comparación de tipo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'OF' },
        text: { summary: 'Usado con CHOOSE CASE y otras construcciones.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'USING' },
        text: { summary: 'Asocia un recurso con un bloque.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'SET' },
        text: { summary: 'Asigna un valor a una propiedad.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'GET' },
        text: { summary: 'Obtiene el valor de una propiedad.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'SYSTEM' },
        text: { summary: 'Referencia al objeto sistema.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'LIBRARY' },
        text: { summary: 'Referencia a una librería PBL.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'reserved-words', kind: 'reserved-word', namespace: 'powerscript', invocation: 'global', name: 'HALT' },
        text: { summary: 'Detiene la ejecución de la aplicación.' },
    },
];
