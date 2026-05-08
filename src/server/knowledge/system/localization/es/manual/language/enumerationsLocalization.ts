import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para tipos y valores enumerados del lenguaje.
 */
export const enumerationsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    // — Tipos Enumerados —
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'SaveAsType' },
        text: {
            summary: 'Tipo enumerado de formatos de exportación de DataWindow.',
            documentation: 'Se usa como datatype en operaciones SaveAs y otras APIs que eligen un formato de salida concreto.',
            obsoleteMessage: 'Marcada como obsoleta en la referencia oficial de Appeon.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'DWItemStatus' },
        text: {
            summary: 'Tipo enumerado para el estado de fila o columna del DataWindow.',
            documentation: 'Distingue filas nuevas, modificadas o sin cambios dentro del motor DataWindow.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'DWBuffer' },
        text: {
            summary: 'Tipo enumerado para seleccionar el buffer de filas de un DataWindow.',
            documentation: 'Se usa en métodos DataWindow que leen, mueven o consultan filas dentro de un buffer específico.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'DWConflictResolution' },
        text: {
            summary: 'Tipo enumerado para resolver conflictos al sincronizar cambios de DataWindow.',
            documentation: 'Se usa en APIs de sincronización de cambios de DataWindow para decidir si fallar ante cualquier conflicto o aplicar cambios no conflictivos.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Border' },
        text: {
            summary: 'Tipo enumerado para estilos de borde visual.',
            documentation: 'Se usa en propiedades y APIs visuales que seleccionan el estilo de borde de controles, ventanas y superficies compatibles.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'BorderStyle' },
        text: {
            summary: 'Tipo enumerado para estilo de borde de controles.',
            documentation: 'Se usa en propiedades BorderStyle de controles que permiten seleccionar una representación visual del borde.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Alignment' },
        text: {
            summary: 'Tipo enumerado para alineación de texto.',
            documentation: 'Se usa para alinear texto o contenido dentro de controles y superficies que admiten alineación horizontal.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FillPattern' },
        text: {
            summary: 'Tipo enumerado para patrón de relleno gráfico.',
            documentation: 'Se usa para seleccionar el patrón de relleno de fondos, áreas y series gráficas que aceptan constantes FillPattern.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'WindowType' },
        text: {
            summary: 'Tipo enumerado para la clase de ventana PowerBuilder.',
            documentation: 'Distingue ventanas principales, hijas, popup y MDI en APIs y eventos que dependen de la clase de ventana.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'WindowState' },
        text: {
            summary: 'Tipo enumerado para el estado visual de una ventana.',
            documentation: 'Representa si una ventana está normal, maximizada o minimizada en propiedades y lógica de presentación.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FileAccess' },
        text: {
            summary: 'Tipo enumerado para el modo de acceso a un archivo.',
            documentation: 'Controla si una API de archivo abre el recurso en lectura, escritura o lectura y escritura.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FileMode' },
        text: {
            summary: 'Tipo enumerado para el modo de apertura de un archivo.',
            documentation: 'Indica si las operaciones de E/S trabajan por líneas o como flujo continuo.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Encoding' },
        text: {
            summary: 'Tipo enumerado para la codificación de archivo.',
            documentation: 'Selecciona la codificación usada al leer o escribir texto con APIs de archivo compatibles.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-types', kind: 'enumerated-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'SeekType' },
        text: {
            summary: 'Tipo enumerado para el origen de desplazamiento en operaciones FileSeek.',
            documentation: 'Se usa para indicar si un desplazamiento de archivo se calcula desde el inicio, la posición actual o el final del archivo.',
        },
    },

    // — Valores Enumerados —
    // SaveAsType
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Excel!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido del DataWindow en formato Excel legacy.', documentation: 'Exporta el contenido del DataWindow en formato Excel legacy.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Text!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido del DataWindow como texto.', documentation: 'Exporta el contenido del DataWindow como texto.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'CSV!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido del DataWindow como CSV.', documentation: 'Exporta el contenido del DataWindow como CSV.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'SQLInsert!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido como sentencias SQL INSERT.', documentation: 'Exporta el contenido como sentencias SQL INSERT.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Clipboard!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido al portapapeles.', documentation: 'Exporta el contenido al portapapeles.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'PSReport!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido como reporte PowerSoft.', documentation: 'Exporta el contenido como reporte PowerSoft.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'PDF!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido del DataWindow como PDF.', documentation: 'Exporta el contenido del DataWindow como PDF.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'XML!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido del DataWindow como XML.', documentation: 'Exporta el contenido del DataWindow como XML.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'XSLFO!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido del DataWindow como XSL-FO.', documentation: 'Exporta el contenido del DataWindow como XSL-FO.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'XLSX!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido del DataWindow como XLSX.', documentation: 'Exporta el contenido del DataWindow como XLSX.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'XLSB!', enumValueOf: 'SaveAsType' },
        text: { summary: 'Exporta el contenido del DataWindow como XLSB.', documentation: 'Exporta el contenido del DataWindow como XLSB.' },
    },

    // DWItemStatus
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'NotModified!', enumValueOf: 'DWItemStatus' },
        text: { summary: 'Fila o columna sin modificaciones.', documentation: 'Fila o columna sin modificaciones.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'DataModified!', enumValueOf: 'DWItemStatus' },
        text: { summary: 'Dato existente modificado.', documentation: 'Dato existente modificado.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'New!', enumValueOf: 'DWItemStatus' },
        text: { summary: 'Fila nueva sin modificaciones posteriores.', documentation: 'Fila nueva sin modificaciones posteriores.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'NewModified!', enumValueOf: 'DWItemStatus' },
        text: { summary: 'Fila nueva modificada.', documentation: 'Fila nueva modificada.' },
    },

    // DWBuffer
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Primary!', enumValueOf: 'DWBuffer' },
        text: { summary: 'Selecciona el buffer principal del DataWindow.', documentation: 'Representa las filas activas del DataWindow, es decir, las que no han sido eliminadas ni filtradas, sin traducir el valor enumerado real Primary!.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Delete!', enumValueOf: 'DWBuffer' },
        text: { summary: 'Buffer de filas eliminadas del DataWindow.', documentation: 'Buffer de filas eliminadas del DataWindow.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Filter!', enumValueOf: 'DWBuffer' },
        text: { summary: 'Buffer de filas filtradas del DataWindow.', documentation: 'Buffer de filas filtradas del DataWindow.' },
    },

    // DWConflictResolution
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FailOnAnyConflict!', enumValueOf: 'DWConflictResolution' },
        text: { summary: 'Falla si existe cualquier conflicto al sincronizar cambios.', documentation: 'Falla si existe cualquier conflicto al sincronizar cambios.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'AllowPartialChanges!', enumValueOf: 'DWConflictResolution' },
        text: { summary: 'Permite aplicar cambios no conflictivos.', documentation: 'Permite aplicar cambios no conflictivos.' },
    },

    // Border
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'NoBorder!', enumValueOf: 'Border' },
        text: { summary: 'Sin borde visual.', documentation: 'Sin borde visual.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'StyleBox!', enumValueOf: 'Border' },
        text: { summary: 'Borde de estilo caja.', documentation: 'Borde de estilo caja.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'StyleLowered!', enumValueOf: 'Border' },
        text: { summary: 'Borde con apariencia hundida.', documentation: 'Borde con apariencia hundida.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'StyleRaised!', enumValueOf: 'Border' },
        text: { summary: 'Borde con apariencia elevada.', documentation: 'Borde con apariencia elevada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'StyleShadowBox!', enumValueOf: 'Border' },
        text: { summary: 'Borde de caja con sombra.', documentation: 'Borde de caja con sombra.' },
    },

    // Alignment
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Left!', enumValueOf: 'Alignment' },
        text: { summary: 'Alineación a la izquierda.', documentation: 'Alineación a la izquierda.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Center!', enumValueOf: 'Alignment' },
        text: { summary: 'Alineación centrada.', documentation: 'Alineación centrada.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Right!', enumValueOf: 'Alignment' },
        text: { summary: 'Alineación a la derecha.', documentation: 'Alineación a la derecha.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Justify!', enumValueOf: 'Alignment' },
        text: { summary: 'Alineación justificada.', documentation: 'Alineación justificada.' },
    },

    // WindowType
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Main!', enumValueOf: 'WindowType' },
        text: { summary: 'Ventana principal.', documentation: 'Ventana principal.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Response!', enumValueOf: 'WindowType' },
        text: { summary: 'Ventana de respuesta.', documentation: 'Ventana de respuesta.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Child!', enumValueOf: 'WindowType' },
        text: { summary: 'Ventana hija.', documentation: 'Ventana hija.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Popup!', enumValueOf: 'WindowType' },
        text: { summary: 'Ventana popup.', documentation: 'Ventana popup.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'MDI!', enumValueOf: 'WindowType' },
        text: { summary: 'Ventana MDI.', documentation: 'Ventana MDI.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'MDIHelp!', enumValueOf: 'WindowType' },
        text: { summary: 'Ventana MDI con ayuda.', documentation: 'Ventana MDI con ayuda.' },
    },

    // WindowState
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Normal!', enumValueOf: 'WindowState' },
        text: { summary: 'Estado normal de ventana.', documentation: 'Estado normal de ventana.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Maximized!', enumValueOf: 'WindowState' },
        text: { summary: 'Estado maximizado de ventana.', documentation: 'Estado maximizado de ventana.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Minimized!', enumValueOf: 'WindowState' },
        text: { summary: 'Estado minimizado de ventana.', documentation: 'Estado minimizado de ventana.' },
    },

    // FileAccess
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FileRead!', enumValueOf: 'FileAccess' },
        text: { summary: 'Acceso de solo lectura.', documentation: 'Acceso de solo lectura.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FileWrite!', enumValueOf: 'FileAccess' },
        text: { summary: 'Acceso de solo escritura.', documentation: 'Acceso de solo escritura.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FileReadWrite!', enumValueOf: 'FileAccess' },
        text: { summary: 'Acceso de lectura y escritura.', documentation: 'Acceso de lectura y escritura.' },
    },

    // FileMode
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'LineMode!', enumValueOf: 'FileMode' },
        text: { summary: 'Modo de archivo por líneas.', documentation: 'Modo de archivo por líneas.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'StreamMode!', enumValueOf: 'FileMode' },
        text: { summary: 'Modo de archivo como flujo.', documentation: 'Modo de archivo como flujo.' },
    },

    // Encoding
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'EncodingANSI!', enumValueOf: 'Encoding' },
        text: { summary: 'Codificación ANSI.', documentation: 'Codificación ANSI.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'EncodingUTF8!', enumValueOf: 'Encoding' },
        text: { summary: 'Codificación UTF-8.', documentation: 'Codificación UTF-8.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'EncodingUTF16LE!', enumValueOf: 'Encoding' },
        text: { summary: 'Codificación UTF-16 little endian.', documentation: 'Codificación UTF-16 little endian.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'EncodingUTF16BE!', enumValueOf: 'Encoding' },
        text: { summary: 'Codificación UTF-16 big endian.', documentation: 'Codificación UTF-16 big endian.' },
    },

    // SeekType
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FromBeginning!', enumValueOf: 'SeekType' },
        text: { summary: 'Desplazamiento desde el inicio del archivo.', documentation: 'Desplazamiento desde el inicio del archivo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FromCurrent!', enumValueOf: 'SeekType' },
        text: { summary: 'Desplazamiento desde la posición actual del archivo.', documentation: 'Desplazamiento desde la posición actual del archivo.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'enumerated-values', kind: 'enumerated-value', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FromEnd!', enumValueOf: 'SeekType' },
        text: { summary: 'Desplazamiento desde el final del archivo.', documentation: 'Desplazamiento desde el final del archivo.' },
    },
];
