import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para eventos manuales de DataWindow.
 */
export const dataWindowEventsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'Clicked', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Se dispara cuando el usuario hace clic en cualquier punto del DataWindow.',
            documentation: 'Ocurre cuando el usuario pulsa el botón izquierdo del ratón sobre el control.',
            returnDocumentation: 'Long. Devuelve 0 para continuar el procesamiento normal o 1 para prevenir el comportamiento por defecto.',
        },
        parameters: [
            { signatureLabel: 'Clicked(xpos, ypos, row, dwo)', parameterName: 'xpos', documentation: 'Distancia horizontal desde el borde izquierdo del DataWindow.' },
            { signatureLabel: 'Clicked(xpos, ypos, row, dwo)', parameterName: 'ypos', documentation: 'Distancia vertical desde el borde superior del DataWindow.' },
            { signatureLabel: 'Clicked(xpos, ypos, row, dwo)', parameterName: 'row', documentation: 'Número de fila sobre la que se hizo clic.' },
            { signatureLabel: 'Clicked(xpos, ypos, row, dwo)', parameterName: 'dwo', documentation: 'Referencia al objeto (columna, botón, etc.) sobre el que se hizo clic.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'DoubleClicked', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Se dispara cuando el usuario hace doble clic dentro del DataWindow.',
            documentation: 'Ocurre cuando el usuario pulsa rápidamente dos veces el botón izquierdo del ratón.',
            returnDocumentation: 'Long. El valor de retorno no se utiliza.',
        },
        parameters: [
            { signatureLabel: 'DoubleClicked(xpos, ypos, row, dwo)', parameterName: 'xpos', documentation: 'Distancia horizontal desde el borde izquierdo del DataWindow.' },
            { signatureLabel: 'DoubleClicked(xpos, ypos, row, dwo)', parameterName: 'ypos', documentation: 'Distancia vertical desde el borde superior del DataWindow.' },
            { signatureLabel: 'DoubleClicked(xpos, ypos, row, dwo)', parameterName: 'row', documentation: 'Número de fila sobre la que se hizo doble clic.' },
            { signatureLabel: 'DoubleClicked(xpos, ypos, row, dwo)', parameterName: 'dwo', documentation: 'Referencia al objeto sobre el que se hizo doble clic.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'ButtonClicked', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Se dispara después de que el usuario pulse un botón contenido en el DataWindow.',
            documentation: 'Ocurre tras liberar el botón del ratón sobre un objeto de tipo Button en el DataWindow.',
            returnDocumentation: 'Long. El valor de retorno no se utiliza.',
        },
        parameters: [
            { signatureLabel: 'ButtonClicked(row, actionreturncode, dwo)', parameterName: 'row', documentation: 'Fila donde se encuentra el botón.' },
            { signatureLabel: 'ButtonClicked(row, actionreturncode, dwo)', parameterName: 'actionreturncode', documentation: 'Código de retorno de la acción asociada al botón (si aplica).' },
            { signatureLabel: 'ButtonClicked(row, actionreturncode, dwo)', parameterName: 'dwo', documentation: 'Referencia al objeto botón pulsado.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'ItemChanged', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Se dispara cuando cambia un campo del DataWindow y pierde el foco antes de aceptar el valor.',
            documentation: 'Permite validar el nuevo valor introducido por el usuario antes de que se acepte en el buffer.',
            returnDocumentation: 'Long. 0: Aceptar el valor (por defecto); 1: Rechazar el valor; 2: Rechazar el valor pero permitir cambiar el foco.',
        },
        parameters: [
            { signatureLabel: 'ItemChanged(row, dwo, data)', parameterName: 'row', documentation: 'Fila que contiene la columna modificada.' },
            { signatureLabel: 'ItemChanged(row, dwo, data)', parameterName: 'dwo', documentation: 'Referencia a la columna modificada.' },
            { signatureLabel: 'ItemChanged(row, dwo, data)', parameterName: 'data', documentation: 'Nuevo valor introducido por el usuario (como cadena).' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'ItemError', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Se dispara cuando un valor modificado no supera la validación de la columna.',
            documentation: 'Ocurre cuando ItemChanged devuelve un código de error o el tipo de dato es inválido.',
            returnDocumentation: 'Long. 0: Mostrar mensaje de error estándar (por defecto); 1: No mostrar mensaje; 2: Rechazar valor; 3: Rechazar valor y permitir cambio de foco.',
        },
        parameters: [
            { signatureLabel: 'ItemError(row, dwo, data)', parameterName: 'row', documentation: 'Fila con el error.' },
            { signatureLabel: 'ItemError(row, dwo, data)', parameterName: 'dwo', documentation: 'Referencia a la columna con el error.' },
            { signatureLabel: 'ItemError(row, dwo, data)', parameterName: 'data', documentation: 'Valor erróneo introducido.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'ItemFocusChanged', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Se dispara cuando cambia el item actual que tiene el foco dentro del DataWindow.',
            documentation: 'Ocurre cuando el foco se mueve de una columna a otra.',
            returnDocumentation: 'Long. El valor de retorno no se utiliza.',
        },
        parameters: [
            { signatureLabel: 'ItemFocusChanged(row, dwo)', parameterName: 'row', documentation: 'Fila que acaba de ganar el foco.' },
            { signatureLabel: 'ItemFocusChanged(row, dwo)', parameterName: 'dwo', documentation: 'Referencia a la columna que acaba de ganar el foco.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'RowFocusChanged', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Se dispara cuando cambia la fila actual del DataWindow.',
            documentation: 'Ocurre cuando el usuario o el programa cambia la fila activa.',
            returnDocumentation: 'Long. El valor de retorno no se utiliza.',
        },
        parameters: [
            { signatureLabel: 'RowFocusChanged(currentrow)', parameterName: 'currentrow', documentation: 'Número de la nueva fila actual.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'RowFocusChanging', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Se dispara justo antes de que cambie la fila actual del DataWindow.',
            documentation: 'Permite prevenir el cambio de fila basándose en alguna condición lógica.',
            returnDocumentation: 'Long. 0: Permitir el cambio (por defecto); 1: Prevenir el cambio de fila.',
        },
        parameters: [
            { signatureLabel: 'RowFocusChanging(currentrow, newrow)', parameterName: 'currentrow', documentation: 'Número de la fila actual antes del cambio.' },
            { signatureLabel: 'RowFocusChanging(currentrow, newrow)', parameterName: 'newrow', documentation: 'Número de la fila que va a ser la nueva actual.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'DBError', ownerTypes: ['datawindow', 'datastore'] },
        text: {
            summary: 'Se dispara cuando una operación de base de datos del DataWindow o DataStore produce error.',
            documentation: 'Ocurre durante Retrieve o Update si la base de datos devuelve un código de error.',
            returnDocumentation: 'Long. 0: Mostrar mensaje estándar (por defecto); 1: No mostrar mensaje.',
        },
        parameters: [
            { signatureLabel: 'DBError(sqldbcode, sqlerrtext, sqlsyntax, buffer, row)', parameterName: 'sqldbcode', documentation: 'Código de error específico del DBMS.' },
            { signatureLabel: 'DBError(sqldbcode, sqlerrtext, sqlsyntax, buffer, row)', parameterName: 'sqlerrtext', documentation: 'Mensaje de error del DBMS.' },
            { signatureLabel: 'DBError(sqldbcode, sqlerrtext, sqlsyntax, buffer, row)', parameterName: 'sqlsyntax', documentation: 'Sentencia SQL que causó el error.' },
            { signatureLabel: 'DBError(sqldbcode, sqlerrtext, sqlsyntax, buffer, row)', parameterName: 'buffer', documentation: 'Buffer donde ocurrió el error (Primary!, Filter! o Delete!).' },
            { signatureLabel: 'DBError(sqldbcode, sqlerrtext, sqlsyntax, buffer, row)', parameterName: 'row', documentation: 'Fila que causó el error.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'RetrieveStart', ownerTypes: ['datawindow', 'datastore'] },
        text: {
            summary: 'Se dispara justo antes de iniciar un Retrieve sobre el DataWindow o DataStore.',
            documentation: 'Permite decidir si se debe proceder con la recuperación o abortar.',
            returnDocumentation: 'Long. 0: Continuar (por defecto); 1: No realizar el retrieve; 2: No limpiar filas existentes antes de añadir las nuevas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'RetrieveRow', ownerTypes: ['datawindow', 'datastore'] },
        text: {
            summary: 'Se dispara después de recuperar cada fila durante un Retrieve.',
            documentation: 'Útil para procesar filas individualmente a medida que llegan desde la base de datos.',
            returnDocumentation: 'Long. 0: Continuar (por defecto); 1: Abortar la recuperación.',
        },
        parameters: [
            { signatureLabel: 'RetrieveRow(row)', parameterName: 'row', documentation: 'Número de fila que se acaba de recuperar.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'RetrieveEnd', ownerTypes: ['datawindow', 'datastore'] },
        text: {
            summary: 'Se dispara cuando termina el proceso de Retrieve.',
            documentation: 'Ocurre tras recuperar todas las filas solicitadas.',
            returnDocumentation: 'Long. El valor de retorno no se utiliza.',
        },
        parameters: [
            { signatureLabel: 'RetrieveEnd(rowcount)', parameterName: 'rowcount', documentation: 'Número total de filas recuperadas.' }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'UpdateStart', ownerTypes: ['datawindow', 'datastore'] },
        text: {
            summary: 'Se dispara justo antes de enviar a la base de datos los cambios del DataWindow o DataStore.',
            documentation: 'Permite realizar validaciones finales antes de iniciar la transacción de actualización.',
            returnDocumentation: 'Long. 0: Continuar (por defecto); 1: Abortar la actualización.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-events', kind: 'event', namespace: 'datawindow', invocation: 'member', name: 'UpdateEnd', ownerTypes: ['datawindow', 'datastore'] },
        text: {
            summary: 'Se dispara cuando finaliza el proceso de Update.',
            documentation: 'Ocurre tras completar la operación de actualización en la base de datos.',
            returnDocumentation: 'Long. El valor de retorno no se utiliza.',
        },
        parameters: [
            { signatureLabel: 'UpdateEnd(rowsinserted, rowsupdated, rowsdeleted)', parameterName: 'rowsinserted', documentation: 'Número de filas insertadas.' },
            { signatureLabel: 'UpdateEnd(rowsinserted, rowsupdated, rowsdeleted)', parameterName: 'rowsupdated', documentation: 'Número de filas actualizadas.' },
            { signatureLabel: 'UpdateEnd(rowsinserted, rowsupdated, rowsdeleted)', parameterName: 'rowsdeleted', documentation: 'Número de filas borradas.' }
        ]
    },
];
