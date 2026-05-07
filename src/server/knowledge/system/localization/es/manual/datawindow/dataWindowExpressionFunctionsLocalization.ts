import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para funciones de expresión de DataWindow.
 */
export const dataWindowExpressionFunctionsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Avg' },
        text: {
            summary: 'Calcula el promedio de los valores de una columna o expresión.',
            documentation: 'Sintaxis: Avg ( column { FOR range { DISTINCT { seed1, seed2, ... } } } )',
            returnDocumentation: 'El tipo de dato de la columna o expresión.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Count' },
        text: {
            summary: 'Cuenta el número de filas en un grupo o en el DataWindow.',
            documentation: 'Sintaxis: Count ( column { FOR range { DISTINCT { seed1, seed2, ... } } } )',
            returnDocumentation: 'Long. El número de filas.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CurrentRow' },
        text: {
            summary: 'Devuelve la fila actual evaluada por la expresión DataWindow.',
            documentation: 'Devuelve el número de la fila que se está procesando actualmente.',
            returnDocumentation: 'Long. El número de la fila actual.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Describe' },
        text: {
            summary: 'Recupera una propiedad Describe/Modify desde una expresión DataWindow.',
            documentation: 'Permite acceder a propiedades del DataWindow directamente desde una expresión de columna o computed field.',
            returnDocumentation: 'String. El valor de la propiedad.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'GetRow' },
        text: {
            summary: 'Devuelve la fila asociada al contexto actual de evaluación de la expresión DataWindow.',
            documentation: 'Similar a CurrentRow, pero específicamente ligado al contexto del buffer.',
            returnDocumentation: 'Long. El número de la fila.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'GetText' },
        text: {
            summary: 'Devuelve el texto activo del contexto de pintura en una expresión DataWindow.',
            documentation: 'Se usa generalmente en reglas de validación o expresiones de edición.',
            returnDocumentation: 'String. El texto actual del control.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'If' },
        text: {
            summary: 'Evalúa una condición y devuelve uno de dos valores dentro de una expresión DataWindow.',
            documentation: 'Sintaxis: If ( boolean_expression, true_value, false_value )',
            returnDocumentation: 'El tipo de dato de true_value o false_value.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'LookUpDisplay' },
        text: {
            summary: 'Devuelve el valor mostrado por un DropDownDataWindow dentro de una expresión DataWindow.',
            documentation: 'Obtiene el valor de la columna de visualización en lugar del valor de la columna de datos.',
            returnDocumentation: 'String. El valor visible al usuario.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'PageCount' },
        text: {
            summary: 'Devuelve el número total de páginas generado por el DataWindow.',
            documentation: 'Solo disponible en el contexto de impresión o vista previa de impresión.',
            returnDocumentation: 'Long. El número total de páginas.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RowCount' },
        text: {
            summary: 'Devuelve el número de filas visibles para la evaluación actual de la expresión DataWindow.',
            documentation: 'Devuelve el número total de filas en el buffer primario.',
            returnDocumentation: 'Long. El número de filas.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Sum' },
        text: {
            summary: 'Agrega valores de una expresión o columna sobre el conjunto de filas del DataWindow.',
            documentation: 'Sintaxis: Sum ( column { FOR range { DISTINCT { seed1, seed2, ... } } } )',
            returnDocumentation: 'El tipo de dato de la columna o expresión.',
        },
    },

    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CrosstabAvg' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CrosstabAvgDec' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CrosstabCount' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CrosstabMax' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CrosstabMaxDec' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CrosstabMin' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CrosstabMinDec' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CrosstabSum' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CrosstabSumDec' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CumulativePercent' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CumulativeSum' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'First' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Large' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Last' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Max' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Median' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Min' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Mode' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Percent' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Small' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'StDev' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'StDevP' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Var' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'VarP' },
        text: { summary: 'Función de agregación oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Case' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'IsDate' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'IsExpanded' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'IsNull' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'IsNumber' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'IsRowModified' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'IsRowNew' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'IsSelected' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'IsTime' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Page' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'PageAbs' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'PageAcross' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'PageCountAcross' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'ProfileInt' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'ProfileString' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RowHeight' },
        text: { summary: 'Función oficial de contexto o estado disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Date' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'DateTime' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Day' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'DayName' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'DayNumber' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'DaysAfter' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Hour' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Minute' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Month' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Now' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RelativeDate' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RelativeTime' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Second' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'SecondsAfter' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Time' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Today' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Year' },
        text: { summary: 'Función oficial de fecha y hora disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Abs' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'ACos' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'ASin' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'ATan' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Ceiling' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Cos' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Dec' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Exp' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Fact' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Int' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Integer' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Log' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'LogTen' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Long' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Mod' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Number' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Pi' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Rand' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Real' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Round' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Sign' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Sin' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Sqrt' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Tan' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Truncate' },
        text: { summary: 'Función numérica oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Asc' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'AscA' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Char' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'CharA' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Fill' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'FillA' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Left' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'LeftA' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'LastPos' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'LeftTrim' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Len' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'LenA' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Lower' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Match' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Mid' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'MidA' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Pos' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'PosA' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Replace' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'ReplaceA' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RichText' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RichTextFile' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Right' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RightA' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RightTrim' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Space' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'String' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'StripRTF' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Trim' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Upper' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'WordCap' },
        text: { summary: 'Función de texto oficial disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Bitmap' },
        text: { summary: 'Función oficial visual o de diseño disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'FontHeight' },
        text: { summary: 'Función oficial visual o de diseño disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'GetPaintDC' },
        text: { summary: 'Función oficial visual o de diseño disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'GetPaintRectHeight' },
        text: { summary: 'Función oficial visual o de diseño disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'GetPaintRectWidth' },
        text: { summary: 'Función oficial visual o de diseño disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'GetPaintRectX' },
        text: { summary: 'Función oficial visual o de diseño disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'GetPaintRectY' },
        text: { summary: 'Función oficial visual o de diseño disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'Paint' },
        text: { summary: 'Función oficial visual o de diseño disponible en expresiones de DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-expression-functions', kind: 'callable', namespace: 'datawindow-expression', invocation: 'global', name: 'RGB' },
        text: { summary: 'Función oficial visual o de diseño disponible en expresiones de DataWindow.' },
    },
];
