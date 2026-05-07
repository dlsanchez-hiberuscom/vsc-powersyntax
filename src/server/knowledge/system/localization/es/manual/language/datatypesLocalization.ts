import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para tipos de datos del lenguaje.
 */
export const datatypesLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Integer' },
        text: { summary: 'Entero con signo de 16 bits (−32768 a 32767).' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Long' },
        text: { summary: 'Entero con signo de 32 bits.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'LongLong' },
        text: { summary: 'Entero con signo de 64 bits.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'LongPtr' },
        text: { summary: 'Entero de puntero (32 o 64 bits según plataforma).' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'UnsignedInteger' },
        text: { summary: 'Entero sin signo de 16 bits.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'UnsignedLong' },
        text: { summary: 'Entero sin signo de 32 bits.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Decimal' },
        text: { summary: 'Número decimal de precisión fija (hasta 28 dígitos).' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Double' },
        text: { summary: 'Número de punto flotante de doble precisión.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Real' },
        text: { summary: 'Número de punto flotante de precisión simple.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Number' },
        text: { summary: 'Alias genérico para Decimal.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Byte' },
        text: { summary: 'Entero sin signo de 8 bits (0 a 255).' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'String' },
        text: { summary: 'Cadena de texto Unicode de longitud variable.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Char' },
        text: { summary: 'Carácter Unicode individual.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Date' },
        text: { summary: 'Fecha sin componente de hora.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Time' },
        text: { summary: 'Hora sin componente de fecha.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'DateTime' },
        text: { summary: 'Combinación de fecha y hora.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Boolean' },
        text: { summary: 'Tipo lógico: TRUE o FALSE.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Blob' },
        text: { summary: 'Datos binarios de longitud variable (Binary Large Object).' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datatypes', kind: 'datatype', namespace: 'powerscript', invocation: 'global', name: 'Any' },
        text: { summary: 'Tipo genérico que puede contener cualquier tipo de dato.' },
    },
];
