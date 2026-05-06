import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para funciones de expresión de DataWindow.
 */
export const dataWindowExpressionFunctionsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Avg' },
        text: {
            summary: 'Calcula el promedio de los valores de una columna o expresión.',
            documentation: 'Sintaxis: Avg ( column { FOR range { DISTINCT { seed1, seed2, ... } } } )',
            returnDocumentation: 'El tipo de dato de la columna o expresión.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Count' },
        text: {
            summary: 'Cuenta el número de filas en un grupo o en el DataWindow.',
            documentation: 'Sintaxis: Count ( column { FOR range { DISTINCT { seed1, seed2, ... } } } )',
            returnDocumentation: 'Long. El número de filas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CurrentRow' },
        text: {
            summary: 'Devuelve la fila actual evaluada por la expresión DataWindow.',
            documentation: 'Devuelve el número de la fila que se está procesando actualmente.',
            returnDocumentation: 'Long. El número de la fila actual.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Describe' },
        text: {
            summary: 'Recupera una propiedad Describe/Modify desde una expresión DataWindow.',
            documentation: 'Permite acceder a propiedades del DataWindow directamente desde una expresión de columna o computed field.',
            returnDocumentation: 'String. El valor de la propiedad.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'GetRow' },
        text: {
            summary: 'Devuelve la fila asociada al contexto actual de evaluación de la expresión DataWindow.',
            documentation: 'Similar a CurrentRow, pero específicamente ligado al contexto del buffer.',
            returnDocumentation: 'Long. El número de la fila.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'GetText' },
        text: {
            summary: 'Devuelve el texto activo del contexto de pintura en una expresión DataWindow.',
            documentation: 'Se usa generalmente en reglas de validación o expresiones de edición.',
            returnDocumentation: 'String. El texto actual del control.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'If' },
        text: {
            summary: 'Evalúa una condición y devuelve uno de dos valores dentro de una expresión DataWindow.',
            documentation: 'Sintaxis: If ( boolean_expression, true_value, false_value )',
            returnDocumentation: 'El tipo de dato de true_value o false_value.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'LookUpDisplay' },
        text: {
            summary: 'Devuelve el valor mostrado por un DropDownDataWindow dentro de una expresión DataWindow.',
            documentation: 'Obtiene el valor de la columna de visualización en lugar del valor de la columna de datos.',
            returnDocumentation: 'String. El valor visible al usuario.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'PageCount' },
        text: {
            summary: 'Devuelve el número total de páginas generado por el DataWindow.',
            documentation: 'Solo disponible en el contexto de impresión o vista previa de impresión.',
            returnDocumentation: 'Long. El número total de páginas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RowCount' },
        text: {
            summary: 'Devuelve el número de filas visibles para la evaluación actual de la expresión DataWindow.',
            documentation: 'Devuelve el número total de filas en el buffer primario.',
            returnDocumentation: 'Long. El número de filas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Sum' },
        text: {
            summary: 'Agrega valores de una expresión o columna sobre el conjunto de filas del DataWindow.',
            documentation: 'Sintaxis: Sum ( column { FOR range { DISTINCT { seed1, seed2, ... } } } )',
            returnDocumentation: 'El tipo de dato de la columna o expresión.',
        },
    },
];
