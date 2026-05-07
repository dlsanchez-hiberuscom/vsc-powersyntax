import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para operadores del lenguaje.
 */
export const operatorsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '+' },
        text: { summary: 'Suma o concatenación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '-' },
        text: { summary: 'Resta o negación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '*' },
        text: { summary: 'Multiplicación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '/' },
        text: { summary: 'División.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '^' },
        text: { summary: 'Exponenciación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '=' },
        text: { summary: 'Igualdad o asignación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '<>' },
        text: { summary: 'Desigualdad.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '<' },
        text: { summary: 'Menor que.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '>' },
        text: { summary: 'Mayor que.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '<=' },
        text: { summary: 'Menor o igual que.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '>=' },
        text: { summary: 'Mayor o igual que.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '+=' },
        text: { summary: 'Suma y asignación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '-=' },
        text: { summary: 'Resta y asignación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '*=' },
        text: { summary: 'Multiplicación y asignación.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'operators', kind: 'operator', namespace: 'powerscript', invocation: 'global', name: '&' },
        text: { summary: 'Continuación de línea.' },
    },
];
