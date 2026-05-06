import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Spanish localization for manual DataWindow functions.
 * Reviewed: false - Initial migration from canonical source.
 */
export const dataWindowFunctionsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Collapse', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Contrae un grupo TreeView concreto dentro del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'CollapseAll', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Contrae todos los grupos TreeView del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'CollapseAllChildren', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Contrae todos los descendientes del grupo TreeView indicado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'CollapseLevel', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Contrae todos los grupos TreeView del nivel indicado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Create', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Crea en runtime un DataWindow a partir de una definición dinámica.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'CreateFrom', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Crea un DataWindow dinámico a partir de otro origen compatible.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'CrosstabDialog', ownerTypes: ['datawindow'] },
        text: { summary: 'Abre el diálogo interactivo de Crosstab para el control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Drag', ownerTypes: ['datawindow'] },
        text: { summary: 'Inicia o termina el arrastre del control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ExpandAllChildren', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Expande todos los descendientes del grupo TreeView indicado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ExpandLevel', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Expande todos los grupos TreeView del nivel indicado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'FindGroupChange', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Busca el siguiente cambio de grupo dentro del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'FindRequired', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Busca la siguiente fila con datos obligatorios pendientes.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetItemFormattedString', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Recupera el valor formateado de una columna como cadena.',
            documentation: 'Obtiene el valor de la columna aplicando el formato de visualización definido.',
            returnDocumentation: 'String. El valor formateado de la columna o cadena vacía si falla.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetItemStatus', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el estado de una fila o de una columna dentro de una fila.',
            documentation: 'Informa si la fila o columna ha sido modificada, es nueva o ha sido borrada.',
            returnDocumentation: 'dwItemStatus. El estado del ítem solicitado.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetItemUnformattedString', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Recupera el valor sin formato de una columna como cadena.',
            documentation: 'Obtiene el valor puro de la columna sin aplicar formatos de visualización.',
            returnDocumentation: 'String. El valor sin formato de la columna o cadena vacía si falla.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'IsExpanded', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Indica si el grupo TreeView indicado está expandido.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'IsSelected', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Indica si la fila indicada está seleccionada en el DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'PostEvent', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Publica un evento asíncrono sobre el DataWindow o DataStore.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetCultureFormat', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Ajusta el formato cultural usado para presentar y parsear datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'TriggerEvent', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Dispara inmediatamente un evento sobre el DataWindow o DataStore.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'CopyRTF', ownerTypes: ['datawindow'] },
        text: { summary: 'Copia contenido RichText del control DataWindow al portapapeles.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetRichTextAlign', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve la alineación activa en el control RichText del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetRichTextColor', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve el color activo del texto en el control RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetRichTextFaceName', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve la fuente activa del texto en el control RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetRichTextSize', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve el tamaño activo del texto en el control RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetRichTextStyle', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve el estilo activo del texto en el control RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'InsertDocument', ownerTypes: ['datawindow'] },
        text: { summary: 'Inserta un documento RichText dentro del control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'LineCount', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve el número de líneas del contenido RichText actual.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'OLEActivate', ownerTypes: ['datawindow'] },
        text: { summary: 'Activa el objeto OLE incrustado en el control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'PasteRTF', ownerTypes: ['datawindow'] },
        text: { summary: 'Pega contenido RichText en el control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ResetInk', ownerTypes: ['datawindow'] },
        text: { summary: 'Limpia la capa de tinta digital asociada al control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SaveAsAscii', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Guarda el contenido del DataWindow como texto ASCII.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SaveAsFormattedText', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Guarda el contenido formateado del DataWindow como texto.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SaveDisplayedDataAs', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Guarda exactamente los datos mostrados por el DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SaveInk', ownerTypes: ['datawindow'] },
        text: { summary: 'Guarda la capa de tinta digital del control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SaveInkPic', ownerTypes: ['datawindow'] },
        text: { summary: 'Guarda la capa de tinta como imagen.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetFullState', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Aplica un blob con el estado completo del DataWindow o DataStore.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetRichTextAlign', ownerTypes: ['datawindow'] },
        text: { summary: 'Cambia la alineación del texto en el control RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetRichTextColor', ownerTypes: ['datawindow'] },
        text: { summary: 'Cambia el color del texto en el control RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetRichTextFaceName', ownerTypes: ['datawindow'] },
        text: { summary: 'Cambia la fuente activa en el control RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetRichTextSize', ownerTypes: ['datawindow'] },
        text: { summary: 'Cambia el tamaño del texto en el control RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetRichTextStyle', ownerTypes: ['datawindow'] },
        text: { summary: 'Cambia el estilo del texto en el control RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetSQLPreview', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Activa o configura el modo de vista previa SQL del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetText', ownerTypes: ['datawindow'] },
        text: { summary: 'Sustituye el texto del edit control activo del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ShowHeadFoot', ownerTypes: ['datawindow'] },
        text: { summary: 'Muestra u oculta cabeceras y pies en el control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'CategoryCount', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve cuántas categorías tiene la gráfica del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'CategoryName', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el nombre de una categoría de la gráfica.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Clipboard', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Copia la gráfica actual al portapapeles.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'DataCount', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve cuántos puntos de datos expone la gráfica.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'FindCategory', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Busca una categoría concreta dentro de la gráfica.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'FindSeries', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Busca una serie concreta dentro de la gráfica.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetData', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Recupera el valor de un punto de datos de la gráfica.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataDateVariable', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Recupera la variable de fecha asociada a un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataLabelling', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve la configuración de etiquetado de un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataNumberVariable', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Recupera la variable numérica asociada a un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataPieExplode', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el valor explode configurado para un punto de un gráfico circular.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataPieExplodePercentage', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el porcentaje explode configurado para un punto circular.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataStringVariable', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Recupera la variable string asociada a un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataStyle', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve la configuración de estilo de un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataStyleColorValue', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el color configurado para un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataStyleLineStyle', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el estilo de línea configurado para un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataStyleLineWidth', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el ancho de línea configurado para un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataStyleSymbolValue', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el símbolo configurado para un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataTransparency', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve la transparencia configurada para un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataValue', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Recupera el valor numérico mostrado por un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSeriesLabelling', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve la configuración de etiquetado de una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSeriesStyle', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve la configuración de estilo de una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSeriesStyleColorValue', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el color configurado para una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSeriesStyleFillPattern', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el patrón de relleno configurado para una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSeriesStyleLineStyle', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el estilo de línea configurado para una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSeriesStyleLineWidth', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el ancho de línea configurado para una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSeriesStyleOverlayValue', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el valor overlay configurado para una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSeriesStyleSymbolValue', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el símbolo configurado para una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSeriesTransparency', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve la transparencia configurada para una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SeriesCount', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve cuántas series expone la gráfica.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SeriesName', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el nombre de una serie de la gráfica.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetDataLabelling', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Configura el etiquetado visible de un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetDataPieExplode', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Configura el explode de un punto en un gráfico circular.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetDataStyle', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Configura el estilo visible de un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetDataTransparency', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Configura la transparencia visible de un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetSeriesLabelling', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Configura el etiquetado visible de una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetSeriesStyle', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Configura el estilo visible de una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetSeriesTransparency', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Configura la transparencia visible de una serie.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ObjectAtPointer', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve el objeto gráfico situado bajo el puntero.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ObjectAtPointerDataPoint', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve el punto de datos gráfico situado bajo el puntero.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ResetDataColors', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Restaura los colores automáticos de la gráfica del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'AcceptText', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Valida y acepta el texto que el usuario ha introducido en el control de edición activo.',
            documentation: 'Aplica el contenido del editor al buffer primario si pasa las reglas de validación y el tipo de dato es correcto.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y -1 si falla la validación.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Describe', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Informa los valores de las propiedades de un objeto DataWindow y sus controles.',
            documentation: 'Reporta las propiedades del DataWindow y sus controles internos; también soporta Evaluate(...) dentro de una lista literal de propiedades.',
            returnDocumentation: 'String. Devuelve una cadena con el valor de cada propiedad o resultado de Evaluate, separados por saltos de línea (~n).',
        },
        parameters: [
            {
                signatureLabel: 'Describe(propertylist)',
                parameterName: 'propertylist',
                documentation: 'Lista de propiedades o expresiones Evaluate(...) separadas por espacios que se desean consultar.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetItemString', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Obtiene datos de tipo string desde uno de los buffers del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetItemDate', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Obtiene datos de tipo date desde uno de los buffers del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetItemDateTime', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Obtiene datos de tipo DateTime desde uno de los buffers del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetItemDecimal', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Obtiene datos de tipo decimal desde uno de los buffers del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetRow', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el número de la fila actual.',
            documentation: 'Retorna el índice de la fila que tiene el foco o es considerada actual en el buffer primario.',
            returnDocumentation: 'Long. El número de la fila actual o 0 si no hay filas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Modify', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Modifica un objeto DataWindow mediante una cadena que contiene sentencias de modificación.',
            documentation: 'Permite cambiar dinámicamente propiedades del objeto DataWindow, como filtros, ordenación o atributos visuales de los controles.',
            returnDocumentation: 'String. Devuelve una cadena vacía si tiene éxito o un mensaje de error si falla.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'DeleteRow', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Mueve una fila del buffer primario al buffer de borrados.',
            documentation: 'La fila deja de ser visible y será eliminada de la base de datos al llamar a Update.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y -1 si falla.',
        },
        parameters: [
            {
                signatureLabel: 'DeleteRow(row)',
                parameterName: 'row',
                documentation: 'Número de fila que se desea borrar.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'DeletedCount', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el número de filas actualmente en el buffer de borrados.',
            documentation: 'Retorna el recuento de filas que han sido borradas pero aún no se han actualizado en la base de datos.',
            returnDocumentation: 'Long. El número de filas borradas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'InsertRow', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Inserta una fila vacía en el buffer primario del DataWindow o DataStore.',
            documentation: 'Crea una nueva fila en la posición indicada e inicializa sus columnas con valores por defecto.',
            returnDocumentation: 'Long. El número de la fila insertada o -1 si falla.',
        },
        parameters: [
            {
                signatureLabel: 'InsertRow(row)',
                parameterName: 'row',
                documentation: 'Posición donde se desea insertar la fila; usa 0 para añadirla al final.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Find', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Busca la siguiente fila cuyo contenido cumpla una expresión booleana sobre columnas.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Filter', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Aplica al DataWindow los criterios de filtrado actualmente definidos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetFilter', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Define la expresión de filtrado que luego se aplicará con Filter.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetRow', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Cambia programáticamente la fila actual del DataWindow, DataWindowChild o DataStore.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetSort', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Define los criterios de ordenación activos para el DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Sort', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Ordena las filas usando los criterios configurados en el DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ScrollToRow', ownerTypes: ['datawindow', 'datawindowchild'] },
        text: {
            summary: 'Desplaza la vista del DataWindow hasta la fila indicada.',
            documentation: 'Hace que la fila especificada sea visible y la convierte en la fila actual.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y -1 si ocurre un error.',
        },
        parameters: [
            {
                signatureLabel: 'ScrollToRow(row)',
                parameterName: 'row',
                documentation: 'Número de fila a la que se desea desplazar la vista.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Reset', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Limpia todos los datos actuales del DataWindow sin afectar a la base de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Retrieve', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Recupera filas desde la base de datos para el DataWindow o DataStore.',
            documentation: 'Puebla el buffer primario ejecutando la sentencia SQL asociada; requiere un objeto de transacción válido previamente configurado.',
            returnDocumentation: 'Long. Devuelve el número de filas recuperadas o -1 si ocurre un error.',
        },
        parameters: [
            {
                signatureLabel: 'Retrieve(argument...)',
                parameterName: 'argument...',
                documentation: 'Valores para los argumentos de recuperación definidos en el DataObject.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'RowCount', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el número de filas actualmente disponibles en el buffer primario.',
            documentation: 'Retorna el número total de filas en el buffer primario, incluyendo aquellas que han sido modificadas pero aún no se han actualizado.',
            returnDocumentation: 'Long. El número total de filas o 0 si no hay ninguna.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetItem', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Asigna un valor a una fila y columna específicas dentro de un buffer.',
            documentation: 'Establece el valor de un ítem en el buffer indicado; si no se especifica el buffer, usa el buffer primario.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y -1 si falla (por ejemplo, tipo de dato incorrecto).',
        },
        parameters: [
            {
                signatureLabel: 'SetItem(row, column, value)',
                parameterName: 'row',
                documentation: 'Número de fila donde se desea asignar el valor.'
            },
            {
                signatureLabel: 'SetItem(row, column, value)',
                parameterName: 'column',
                documentation: 'Nombre (string) o número (integer) de la columna.'
            },
            {
                signatureLabel: 'SetItem(row, column, value)',
                parameterName: 'value',
                documentation: 'Nuevo valor para la celda.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetItemStatus', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Cambia el estado de modificación de una fila o de una columna dentro de una fila.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetTransObject', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Asocia un objeto de transacción explícito para que el llamador controle CONNECT, COMMIT y ROLLBACK.',
            documentation: 'Vincula un objeto de transacción programado al DataWindow, DataStore o DataWindowChild y requiere gestión transaccional explícita.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y -1 si ocurre un error.',
        },
        parameters: [
            {
                signatureLabel: 'SetTransObject(transaction)',
                parameterName: 'transaction',
                documentation: 'Objeto de transacción que será reutilizado para Retrieve y Update.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetTrans', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Establece la información de transacción para el DataWindow en su objeto de transacción interno.',
            documentation: 'Copia los parámetros de conexión desde el objeto de transacción especificado al objeto de transacción interno del DataWindow.',
        },
        parameters: [
            {
                signatureLabel: 'SetTrans(transaction)',
                parameterName: 'transaction',
                documentation: 'Objeto de transacción desde el cual copiar los parámetros de conexión.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Update', ownerTypes: ['datastore', 'datawindow', 'datawindowchild'] },
        text: {
            summary: 'Envía los cambios acumulados en el DataWindow a la base de datos.',
            documentation: 'Actualiza la base de datos con los cambios pendientes; el argumento accept controla si se ejecuta AcceptText y resetflag decide si se mantienen las flags de modificación.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y -1 si ocurre un error. Si no hay cambios pendientes, devuelve 1.',
        },
        parameters: [
            {
                signatureLabel: 'Update(accept?, resetflag?)',
                parameterName: 'accept?',
                documentation: 'Si es True (por defecto), ejecuta AcceptText antes del update; si es False, se salta ese paso.'
            },
            {
                signatureLabel: 'Update(accept?, resetflag?)',
                parameterName: 'resetflag?',
                documentation: 'Si es True (por defecto), limpia las flags de modificación; si es False, las mantiene para commits manuales o actualizaciones encadenadas.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Show', ownerTypes: ['datawindow'] },
        text: { summary: 'Hace visible el control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Hide', ownerTypes: ['datawindow'] },
        text: { summary: 'Oculta el control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Move', ownerTypes: ['datawindow'] },
        text: { summary: 'Reubica el control DataWindow dentro de su contenedor.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Resize', ownerTypes: ['datawindow'] },
        text: { summary: 'Cambia el tamaño del control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetItemTime', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Obtiene datos de tipo time desde uno de los buffers del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetNextModified', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Devuelve la siguiente fila modificada a partir de una fila inicial en el buffer indicado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetRowFromRowId', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Obtiene el número de fila asociado a un row id único.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetRowIdFromRow', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Obtiene el row id único asociado a una fila del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSelectedRow', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Devuelve la primera fila seleccionada a partir de la fila indicada.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetSQLSelect', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Devuelve el SELECT actualmente asociado al DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetText', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el texto actual del control de edición activo.',
            documentation: 'Retorna el texto que el usuario está editando actualmente, el cual puede no haber sido aplicado al buffer todavía.',
            returnDocumentation: 'String. El texto del control de edición.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetValidate', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Devuelve la regla de validación configurada para una columna.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetValue', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Devuelve un ítem concreto de la value list o code table de una columna.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ClearValues', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Elimina todos los ítems de la value list o code table asociada a una columna.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetChild', ownerTypes: ['datawindow', 'datastore'] },
        text: {
            summary: 'Obtiene una referencia al child DataWindow o a un reporte de un composite DataWindow.',
            documentation: 'Devuelve una referencia utilizable para Retrieve, SetTransObject y otras operaciones sobre el child o reporte indicado.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y -1 si ocurre un error.',
        },
        parameters: [
            {
                signatureLabel: 'GetChild(name, dwchildvariable)',
                parameterName: 'name',
                documentation: 'Nombre de la columna DropDownDataWindow o del reporte dentro de un composite DataWindow.'
            },
            {
                signatureLabel: 'GetChild(name, dwchildvariable)',
                parameterName: 'dwchildvariable',
                documentation: 'Variable de salida donde se almacena la referencia al child DataWindow.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetClickedColumn', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve la columna sobre la que el usuario ha hecho clic.',
            documentation: 'Retorna el índice de la columna donde el usuario clicó; debe llamarse dentro de los eventos Clicked o DoubleClicked.',
            returnDocumentation: 'Integer. El número de la columna clicada o 0 si se clicó fuera de las columnas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetClickedRow', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve la fila sobre la que el usuario ha hecho clic.',
            documentation: 'Retorna el índice de la fila donde el usuario clicó; debe llamarse dentro de los eventos Clicked o DoubleClicked.',
            returnDocumentation: 'Long. El número de la fila clicada o 0 si se clicó fuera de las filas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetColumn', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el número de la columna actual.',
            documentation: 'Retorna el índice de la columna que tiene actualmente el foco.',
            returnDocumentation: 'Integer. El número de la columna actual o 0 si no hay columnas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetColumnName', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el nombre de la columna actual.',
            documentation: 'Retorna el nombre de la columna que tiene actualmente el foco.',
            returnDocumentation: 'String. El nombre de la columna actual o cadena vacía si no hay ninguna.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetFormat', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Devuelve el formato de presentación configurado para una columna.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetColumn', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Convierte la columna indicada en la columna actual del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetFormat', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Cambia en runtime el formato de presentación de una columna.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'FilteredCount', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el número de filas actualmente en el buffer de filtro.',
            documentation: 'Retorna el recuento de filas que no cumplen los criterios de filtro actuales y por tanto están ocultas.',
            returnDocumentation: 'Long. El número de filas filtradas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ModifiedCount', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el número de filas que han sido modificadas y están pendientes de actualización.',
            documentation: 'Retorna el recuento de filas en los buffers primario y de filtro que tienen estado New!, NewModified! o DataModified!.',
            returnDocumentation: 'Long. El número de filas modificadas.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetChanges', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Recupera en un blob los cambios pendientes del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetFullState', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Recupera el estado completo del DataWindow en un blob serializable.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetStateStatus', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Obtiene el estado interno de flags del DataWindow en un blob.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ResetUpdate', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Resetea las marcas de update pendientes en las filas del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'RowsCopy', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Copia un rango de filas entre buffers o entre DataWindows compatibles.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'RowsDiscard', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Descarta definitivamente un rango de filas sin posibilidad de undo.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetChanges', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Aplica sobre el DataWindow un blob de cambios capturado previamente.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'DBCancel', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Cancela una recuperación de base de datos que sigue en curso.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetTrans', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Recupera los valores del Transaction object interno del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ResetTransObject', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Desasocia un Transaction object explícito y vuelve al transaction interno.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ReselectRow', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Reconsulta columnas actualizables y refresh de timestamps para una fila.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetSQLSelect', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Cambia en runtime el SELECT asociado al DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetTrans', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Copia valores al transaction object interno y deja que PowerBuilder conecte y desconecte automaticamente.',
            documentation: 'Copia los parametros del transaction object especificado al transaction interno del DataWindow, DataStore o DataWindowChild.',
        },
        parameters: [
            {
                signatureLabel: 'SetTrans(transaction)',
                parameterName: 'transaction',
                documentation: 'Transaction object origen cuyos valores se copian al transaction interno.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ShareData', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Comparte el dataset entre un DataWindow primario y otro secundario.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ShareDataOff', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Interrumpe un enlace previo de ShareData.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SaveAs', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Guarda el contenido del DataWindow en un fichero con el formato indicado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SaveNativePDFToBlob', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Guarda en un blob el PDF nativo generado desde el DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ExportJson', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Exporta el contenido del DataWindow a una cadena JSON.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ImportClipboard', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Importa filas o contenido desde el portapapeles al DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ImportFile', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Importa contenido desde un fichero externo al DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ImportJson', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Inserta datos desde una cadena JSON en el DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ImportJsonByKey', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Inserta datos JSON mapeando explícitamente por nombre de clave.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ImportRowFromJson', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Inserta una fila concreta desde una cadena JSON.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ImportString', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Importa contenido textual serializado directamente en el DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Print', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Envía el contenido del DataWindow a la impresora activa.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'PrintCancel', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Cancela el trabajo de impresión actual del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ClassName', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el nombre asignado al control u objeto DataWindow.',
            documentation: 'Retorna el nombre de la clase o instancia del objeto.',
            returnDocumentation: 'String. El nombre de la clase/instancia.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetContextService', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Crea una referencia a una instancia de servicio contextual para el DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetParent', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve una referencia al objeto padre del DataWindow.',
            documentation: 'Retorna el objeto contenedor (ventana, control, etc.) que contiene al DataWindow.',
            returnDocumentation: 'PowerObject. Una referencia al objeto padre.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'TypeOf', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Devuelve el tipo de runtime del control u objeto DataWindow.',
            documentation: 'Retorna un valor del enumerado Object que indica el tipo de objeto.',
            returnDocumentation: 'Object. El tipo de objeto (ej. DataWindow!, DataStore!).',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetBorderStyle', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Devuelve el estilo de borde configurado para una columna.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetBorderStyle', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Cambia el estilo de borde configurado para una columna.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetDetailHeight', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Cambia la altura de las filas dentro de un rango determinado.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetPosition', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Reordena el control u objetos internos del DataWindow en el eje visual.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Expand', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Expande un grupo TreeView concreto dentro del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ExpandAll', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Expande todos los grupos TreeView del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'CanUndo', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Indica si el edit control actual del DataWindow puede deshacer la última edición.',
            returnDocumentation: 'Boolean. Devuelve true si la última edición se puede deshacer y false en caso contrario.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Clear', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Borra el texto seleccionado en el edit control activo del DataWindow.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y -1 si ocurre un error.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Copy', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Copia al portapapeles el texto seleccionado del edit control activo.',
            returnDocumentation: 'Integer. Devuelve el número de caracteres copiados o -1 si ocurre un error.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Cut', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Corta el texto seleccionado del edit control activo y lo envía al portapapeles.',
            returnDocumentation: 'Integer. Devuelve el número de caracteres cortados o -1 si ocurre un error.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SelectRow', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: {
            summary: 'Cambia el estado de selección de una fila.',
            documentation: 'Marca o desmarca una fila como seleccionada; esto suele disparar un resaltado visual en el control.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y -1 si falla.',
        },
        parameters: [
            {
                signatureLabel: 'SelectRow(row, select)',
                parameterName: 'row',
                documentation: 'Número de fila que se desea seleccionar o deseleccionar; usa 0 para todas.'
            },
            {
                signatureLabel: 'SelectRow(row, select)',
                parameterName: 'select',
                documentation: 'True para seleccionar, False para deseleccionar.'
            }
        ]
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ReplaceText', ownerTypes: ['datawindow'] },
        text: { summary: 'Reemplaza el texto seleccionado en el edit control activo.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SelectText', ownerTypes: ['datawindow'] },
        text: { summary: 'Selecciona un tramo de texto dentro del edit control activo del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Undo', ownerTypes: ['datawindow'] },
        text: { summary: 'Deshace la última edición realizada en el edit control activo del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Position', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve la posición actual del cursor o de la selección en el edit control activo.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Scroll', ownerTypes: ['datawindow'] },
        text: { summary: 'Desplaza el edit control activo el número indicado de líneas.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'FindNext', ownerTypes: ['datawindow'] },
        text: { summary: 'Busca la siguiente coincidencia de texto usando los criterios previos de Find en RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetBandAtPointer', ownerTypes: ['datawindow', 'datawindowchild'] },
        text: { summary: 'Devuelve la banda y fila ubicadas bajo el puntero en el DataWindow visual.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetObjectAtPointer', ownerTypes: ['datawindow', 'datawindowchild'] },
        text: { summary: 'Devuelve el objeto interno y la fila situados bajo el puntero.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'PointerX', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve la coordenada X del puntero respecto al control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'PointerY', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve la coordenada Y del puntero respecto al control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SelectedLength', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve la longitud del texto actualmente seleccionado en el edit control activo.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SelectedLine', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve la línea actual del edit control activo del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SelectedStart', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve la posición inicial del texto seleccionado en el edit control activo.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SelectedText', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve el texto actualmente seleccionado en el edit control activo.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'TextLine', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve el texto completo de la línea actual del edit control activo.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ScrollNextPage', ownerTypes: ['datawindow', 'datawindowchild'] },
        text: { summary: 'Desplaza el DataWindow visual una página hacia delante.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ScrollNextRow', ownerTypes: ['datawindow', 'datawindowchild'] },
        text: { summary: 'Desplaza el DataWindow visual a la fila siguiente.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ScrollPriorPage', ownerTypes: ['datawindow', 'datawindowchild'] },
        text: { summary: 'Desplaza el DataWindow visual una página hacia atrás.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ScrollPriorRow', ownerTypes: ['datawindow', 'datawindowchild'] },
        text: { summary: 'Desplaza el DataWindow visual a la fila anterior.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetFocus', ownerTypes: ['datawindow'] },
        text: { summary: 'Transfiere el foco al control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetTabOrder', ownerTypes: ['datawindow', 'datawindowchild'] },
        text: { summary: 'Cambia el tab order de una columna en un DataWindow visual.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetRowFocusIndicator', ownerTypes: ['datawindow', 'datawindowchild'] },
        text: { summary: 'Configura el indicador visual de la fila actual en un DataWindow visual.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SelectTextAll', ownerTypes: ['datawindow'] },
        text: { summary: 'Selecciona todo el contenido de un DataWindow con presentación RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SelectTextLine', ownerTypes: ['datawindow'] },
        text: { summary: 'Selecciona la línea actual en un DataWindow con presentación RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SelectTextWord', ownerTypes: ['datawindow'] },
        text: { summary: 'Selecciona la palabra actual en un DataWindow con presentación RichText.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetDataStyleFillPattern', ownerTypes: ['datawindow', 'datastore'] },
        text: { summary: 'Devuelve el patrón de relleno configurado para un punto de datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ObjectAtPointerSeries', ownerTypes: ['datawindow'] },
        text: { summary: 'Devuelve la serie gráfica situada bajo el puntero.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GroupCalc', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Recalcula los cortes de grupo del DataWindow tras cambios en los datos.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'RowsMove', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Mueve un rango de filas entre buffers o entre DataWindows compatibles.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetRedraw', ownerTypes: ['datawindow'] },
        text: { summary: 'Activa o desactiva el repintado automático del control DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'GetItemNumber', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Obtiene datos numéricos desde uno de los buffers del DataWindow.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'SetValue', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Cambia un valor concreto de la lista de valores o code table de una columna.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'ExportRowAsJson', ownerTypes: ['datawindow', 'datawindowchild', 'datastore'] },
        text: { summary: 'Exporta una fila concreta del DataWindow a una cadena JSON.' },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Paste', ownerTypes: ['datawindow'] },
        text: {
            summary: 'Pega el contenido del portapapeles en el edit control activo.',
            returnDocumentation: 'Integer. Devuelve el número de caracteres pegados o -1 si ocurre un error.',
        },
    },
];
