import { PbSystemSymbolEntry } from '../../../types';
import { enumeratedType, enumeratedValue } from '../../common';

const PB_MANUAL_CORE_ENUMERATED_CATEGORIES = [
    'DataWindow',
    'UI',
    'Archivo',
    'Ventana',
] as const;

export const PB_MANUAL_CORE_ENUMERATED_TYPE_CATEGORIES = PB_MANUAL_CORE_ENUMERATED_CATEGORIES;
export const PB_MANUAL_CORE_ENUMERATED_VALUE_CATEGORIES = PB_MANUAL_CORE_ENUMERATED_CATEGORIES;

const SAVE_AS_TYPE_VALUES = [
    'Excel!',
    'Text!',
    'CSV!',
    'SYLK!',
    'WKS!',
    'WK1!',
    'DIF!',
    'dBASE2!',
    'dBASE3!',
    'SQLInsert!',
    'Clipboard!',
    'PSReport!',
    'WMF!',
    'HTMLTable!',
    'Excel5!',
    'XML!',
    'XSLFO!',
    'PDF!',
    'Excel8!',
    'EMF!',
    'XLSX!',
    'XLSB!',
] as const;

const DW_ITEM_STATUS_VALUES = [
    'NotModified!',
    'DataModified!',
    'New!',
    'NewModified!',
] as const;

const DW_BUFFER_VALUES = ['Primary!', 'Delete!', 'Filter!'] as const;
const DW_CONFLICT_RESOLUTION_VALUES = ['FailOnAnyConflict!', 'AllowPartialChanges!'] as const;

const BORDER_VALUES = ['NoBorder!', 'StyleBox!', 'StyleLowered!', 'StyleRaised!', 'StyleShadowBox!'] as const;
const BORDER_STYLE_VALUES = ['StyleBox!', 'StyleLowered!', 'StyleRaised!', 'StyleShadowBox!'] as const;
const ALIGNMENT_VALUES = ['Left!', 'Center!', 'Right!', 'Justify!'] as const;

const WINDOW_TYPE_VALUES = ['Main!', 'Response!', 'Child!', 'Popup!', 'MDI!', 'MDIHelp!'] as const;
const WINDOW_STATE_VALUES = ['Normal!', 'Maximized!', 'Minimized!'] as const;

const FILE_ACCESS_VALUES = ['FileRead!', 'FileWrite!', 'FileReadWrite!'] as const;
const FILE_MODE_VALUES = ['LineMode!', 'StreamMode!'] as const;
const ENCODING_VALUES = ['EncodingANSI!', 'EncodingUTF8!', 'EncodingUTF16LE!', 'EncodingUTF16BE!'] as const;
const SEEK_TYPE_VALUES = ['FromBeginning!', 'FromCurrent!', 'FromEnd!'] as const;

type EnumValueArgs = {
    name: string;
    category: string;
    summary: string;
    enumValueOf: string;
    documentation?: string;
    enumNumericValue?: number;
    enumValueMeaning?: string;
};

function enumValue(args: EnumValueArgs): PbSystemSymbolEntry {
    return enumeratedValue({
        ...args,
    });
}

function stripBang(name: string): string {
    return name.replace(/!$/, '');
}

const SAVE_AS_TYPE_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'Excel!': {
        summary: 'Exporta el contenido del DataWindow en formato Excel legacy.',
        documentation: 'Valor de SaveAsType usado para guardar datos en formato compatible con Excel.',
        enumValueMeaning: 'Formato Excel legacy.',
    },
    'Text!': {
        summary: 'Exporta el contenido del DataWindow como texto.',
        documentation: 'Formato de texto plano. Puede combinarse con el argumento de codificación en APIs compatibles.',
        enumValueMeaning: 'Texto plano.',
    },
    'CSV!': {
        summary: 'Exporta el contenido del DataWindow como CSV.',
        documentation: 'Formato de valores separados por comas. Es habitual para intercambio de datos tabulares.',
        enumValueMeaning: 'CSV.',
    },
    'SQLInsert!': {
        summary: 'Exporta el contenido como sentencias SQL INSERT.',
        documentation: 'Genera sentencias INSERT a partir de los datos del DataWindow.',
        enumValueMeaning: 'Sentencias SQL INSERT.',
    },
    'Clipboard!': {
        summary: 'Exporta el contenido al portapapeles.',
        documentation: 'Usado cuando el destino de la exportación es el Clipboard.',
        enumValueMeaning: 'Portapapeles.',
    },
    'PSReport!': {
        summary: 'Exporta el contenido como reporte PowerSoft.',
        documentation: 'Formato de reporte útil especialmente para DataWindows de tipo composite report.',
        enumValueMeaning: 'PowerSoft Report.',
    },
    'PDF!': {
        summary: 'Exporta el contenido del DataWindow como PDF.',
        documentation: 'Formato PDF para salida documental.',
        enumValueMeaning: 'PDF.',
    },
    'XML!': {
        summary: 'Exporta el contenido del DataWindow como XML.',
        documentation: 'Formato XML basado en la plantilla XML configurada para el DataWindow.',
        enumValueMeaning: 'XML.',
    },
    'XSLFO!': {
        summary: 'Exporta el contenido del DataWindow como XSL-FO.',
        documentation: 'Formato XSL Formatting Objects.',
        enumValueMeaning: 'XSL-FO.',
    },
    'XLSX!': {
        summary: 'Exporta el contenido del DataWindow como XLSX.',
        documentation: 'Formato Excel moderno basado en Office Open XML.',
        enumValueMeaning: 'Excel XLSX.',
    },
    'XLSB!': {
        summary: 'Exporta el contenido del DataWindow como XLSB.',
        documentation: 'Formato binario de Excel.',
        enumValueMeaning: 'Excel Binary Workbook.',
    },
};

const DW_ITEM_STATUS_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumNumericValue' | 'enumValueMeaning'>>> = {
    'NotModified!': {
        summary: 'Fila o columna sin modificaciones.',
        documentation: 'Indica que el dato conserva su estado original dentro del DataWindow.',
        enumNumericValue: 0,
        enumValueMeaning: 'Sin modificar.',
    },
    'DataModified!': {
        summary: 'Dato existente modificado.',
        documentation: 'Indica que una fila o columna existente ha sido modificada.',
        enumNumericValue: 1,
        enumValueMeaning: 'Dato modificado.',
    },
    'New!': {
        summary: 'Fila nueva sin modificaciones posteriores.',
        documentation: 'Indica una fila insertada que todavía no ha sido modificada después de su creación.',
        enumNumericValue: 2,
        enumValueMeaning: 'Fila nueva.',
    },
    'NewModified!': {
        summary: 'Fila nueva modificada.',
        documentation: 'Indica una fila nueva que además ha recibido modificaciones.',
        enumNumericValue: 3,
        enumValueMeaning: 'Fila nueva modificada.',
    },
};

const DW_BUFFER_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumNumericValue' | 'enumValueMeaning'>>> = {
    'Primary!': {
        summary: 'Buffer principal del DataWindow.',
        documentation: 'Representa las filas activas del DataWindow, es decir, filas que no han sido eliminadas ni filtradas.',
        enumNumericValue: 0,
        enumValueMeaning: 'Datos activos en el buffer principal.',
    },
    'Delete!': {
        summary: 'Buffer de filas eliminadas del DataWindow.',
        documentation: 'Representa filas eliminadas del DataWindow que todavía no se han confirmado en la base de datos.',
        enumNumericValue: 1,
        enumValueMeaning: 'Datos pendientes de borrado.',
    },
    'Filter!': {
        summary: 'Buffer de filas filtradas del DataWindow.',
        documentation: 'Representa filas retiradas de la vista activa mediante filtros del DataWindow.',
        enumNumericValue: 2,
        enumValueMeaning: 'Datos filtrados fuera de la vista activa.',
    },
};

const DW_CONFLICT_RESOLUTION_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumNumericValue' | 'enumValueMeaning'>>> = {
    'FailOnAnyConflict!': {
        summary: 'Falla si existe cualquier conflicto al sincronizar cambios.',
        documentation: 'Impide aplicar cambios si los datos del DataWindow origen han cambiado desde que se capturó su estado.',
        enumNumericValue: 0,
        enumValueMeaning: 'No permite cambios parciales ante conflictos.',
    },
    'AllowPartialChanges!': {
        summary: 'Permite aplicar cambios no conflictivos.',
        documentation: 'Aplica los cambios que no están en conflicto durante la sincronización de DataWindows.',
        enumNumericValue: 1,
        enumValueMeaning: 'Permite actualización parcial.',
    },
};

const BORDER_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'NoBorder!': {
        summary: 'Sin borde visual.',
        documentation: 'Indica que el control o superficie compatible no muestra borde.',
        enumValueMeaning: 'Sin borde.',
    },
    'StyleBox!': {
        summary: 'Borde de estilo caja.',
        documentation: 'Representa un borde rectangular simple.',
        enumValueMeaning: 'Caja.',
    },
    'StyleLowered!': {
        summary: 'Borde con apariencia hundida.',
        documentation: 'Representa un borde visual con efecto rebajado.',
        enumValueMeaning: 'Hundido.',
    },
    'StyleRaised!': {
        summary: 'Borde con apariencia elevada.',
        documentation: 'Representa un borde visual con efecto elevado.',
        enumValueMeaning: 'Elevado.',
    },
    'StyleShadowBox!': {
        summary: 'Borde de caja con sombra.',
        documentation: 'Representa un borde rectangular con efecto de sombra.',
        enumValueMeaning: 'Caja con sombra.',
    },
};

const ALIGNMENT_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'Left!': {
        summary: 'Alineación a la izquierda.',
        documentation: 'Alinea el texto o contenido hacia el lado izquierdo en controles compatibles.',
        enumValueMeaning: 'Izquierda.',
    },
    'Center!': {
        summary: 'Alineación centrada.',
        documentation: 'Centra el texto o contenido en controles compatibles.',
        enumValueMeaning: 'Centro.',
    },
    'Right!': {
        summary: 'Alineación a la derecha.',
        documentation: 'Alinea el texto o contenido hacia el lado derecho en controles compatibles.',
        enumValueMeaning: 'Derecha.',
    },
    'Justify!': {
        summary: 'Alineación justificada.',
        documentation: 'Distribuye el texto para ajustar los márgenes en controles compatibles.',
        enumValueMeaning: 'Justificado.',
    },
};

const WINDOW_TYPE_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'Main!': {
        summary: 'Ventana principal.',
        documentation: 'Indica una ventana principal de la aplicación.',
        enumValueMeaning: 'Main window.',
    },
    'Response!': {
        summary: 'Ventana de respuesta.',
        documentation: 'Indica una ventana modal de respuesta.',
        enumValueMeaning: 'Response window.',
    },
    'Child!': {
        summary: 'Ventana hija.',
        documentation: 'Indica una ventana hija dependiente de otra ventana.',
        enumValueMeaning: 'Child window.',
    },
    'Popup!': {
        summary: 'Ventana popup.',
        documentation: 'Indica una ventana emergente.',
        enumValueMeaning: 'Popup window.',
    },
    'MDI!': {
        summary: 'Ventana MDI.',
        documentation: 'Indica una ventana de interfaz de documentos múltiples.',
        enumValueMeaning: 'MDI frame.',
    },
    'MDIHelp!': {
        summary: 'Ventana MDI con ayuda.',
        documentation: 'Indica una ventana MDI preparada para escenarios de ayuda.',
        enumValueMeaning: 'MDI help frame.',
    },
};

const WINDOW_STATE_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'Normal!': {
        summary: 'Estado normal de ventana.',
        documentation: 'La ventana se muestra en su tamaño y posición normales.',
        enumValueMeaning: 'Normal.',
    },
    'Maximized!': {
        summary: 'Estado maximizado de ventana.',
        documentation: 'La ventana se muestra maximizada.',
        enumValueMeaning: 'Maximizada.',
    },
    'Minimized!': {
        summary: 'Estado minimizado de ventana.',
        documentation: 'La ventana se muestra minimizada.',
        enumValueMeaning: 'Minimizada.',
    },
};

const FILE_ACCESS_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'FileRead!': {
        summary: 'Acceso de solo lectura.',
        documentation: 'Abre el archivo para operaciones de lectura.',
        enumValueMeaning: 'Lectura.',
    },
    'FileWrite!': {
        summary: 'Acceso de solo escritura.',
        documentation: 'Abre el archivo para operaciones de escritura.',
        enumValueMeaning: 'Escritura.',
    },
    'FileReadWrite!': {
        summary: 'Acceso de lectura y escritura.',
        documentation: 'Abre el archivo para operaciones de lectura y escritura.',
        enumValueMeaning: 'Lectura y escritura.',
    },
};

const FILE_MODE_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'LineMode!': {
        summary: 'Modo de archivo por líneas.',
        documentation: 'Las operaciones de E/S se realizan por líneas.',
        enumValueMeaning: 'Modo línea.',
    },
    'StreamMode!': {
        summary: 'Modo de archivo como flujo.',
        documentation: 'Las operaciones de E/S se realizan como flujo continuo.',
        enumValueMeaning: 'Modo flujo.',
    },
};

const ENCODING_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'EncodingANSI!': {
        summary: 'Codificación ANSI.',
        documentation: 'Usa codificación ANSI al leer o escribir texto en APIs compatibles.',
        enumValueMeaning: 'ANSI.',
    },
    'EncodingUTF8!': {
        summary: 'Codificación UTF-8.',
        documentation: 'Usa codificación UTF-8 al leer o escribir texto en APIs compatibles.',
        enumValueMeaning: 'UTF-8.',
    },
    'EncodingUTF16LE!': {
        summary: 'Codificación UTF-16 little endian.',
        documentation: 'Usa codificación UTF-16 little endian al leer o escribir texto en APIs compatibles.',
        enumValueMeaning: 'UTF-16 LE.',
    },
    'EncodingUTF16BE!': {
        summary: 'Codificación UTF-16 big endian.',
        documentation: 'Usa codificación UTF-16 big endian al leer o escribir texto en APIs compatibles.',
        enumValueMeaning: 'UTF-16 BE.',
    },
};

const SEEK_TYPE_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'FromBeginning!': {
        summary: 'Desplazamiento desde el inicio del archivo.',
        documentation: 'Interpreta el desplazamiento relativo desde el inicio del archivo.',
        enumValueMeaning: 'Desde el inicio.',
    },
    'FromCurrent!': {
        summary: 'Desplazamiento desde la posición actual del archivo.',
        documentation: 'Interpreta el desplazamiento relativo desde la posición actual del archivo.',
        enumValueMeaning: 'Desde la posición actual.',
    },
    'FromEnd!': {
        summary: 'Desplazamiento desde el final del archivo.',
        documentation: 'Interpreta el desplazamiento relativo desde el final del archivo.',
        enumValueMeaning: 'Desde el final.',
    },
};

function createValues(
    values: readonly string[],
    category: string,
    enumValueOf: string,
    details: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumNumericValue' | 'enumValueMeaning'>>>,
): readonly PbSystemSymbolEntry[] {
    return values.map((name) => {
        const detail = details[name];

        return enumValue({
            name,
            category,
            summary: detail?.summary ?? `Valor ${stripBang(name)} de ${enumValueOf}.`,
            documentation: detail?.documentation,
            enumValueOf,
            enumNumericValue: detail?.enumNumericValue,
            enumValueMeaning: detail?.enumValueMeaning,
        });
    });
}

export const PB_MANUAL_CORE_ENUMERATED_TYPES: readonly PbSystemSymbolEntry[] = [
    // — DataWindow —
    enumeratedType({
        name: 'SaveAsType',
        category: 'DataWindow',
        summary: 'Tipo enumerado de formatos de exportación de DataWindow.',
        documentation: 'Se usa como datatype en operaciones SaveAs y otras APIs que eligen un formato de salida concreto.',
        allowedInParameters: ['saveastype'],
        enumValues: SAVE_AS_TYPE_VALUES,
    }),
    enumeratedType({
        name: 'DWItemStatus',
        category: 'DataWindow',
        summary: 'Tipo enumerado para el estado de fila o columna del DataWindow.',
        documentation: 'Distingue filas nuevas, modificadas o sin cambios dentro del motor DataWindow.',
        allowedInParameters: ['status'],
        enumValues: DW_ITEM_STATUS_VALUES,
    }),
    enumeratedType({
        name: 'DWBuffer',
        category: 'DataWindow',
        summary: 'Tipo enumerado para seleccionar el buffer de filas de un DataWindow.',
        documentation: 'Se usa en métodos DataWindow que leen, mueven o consultan filas dentro de un buffer específico.',
        allowedInParameters: ['dwbuffer', 'movebuffer', 'targetbuffer'],
        enumValues: DW_BUFFER_VALUES,
    }),
    enumeratedType({
        name: 'DWConflictResolution',
        category: 'DataWindow',
        summary: 'Tipo enumerado para resolver conflictos al sincronizar cambios de DataWindow.',
        documentation: 'Se usa en APIs de sincronización de cambios de DataWindow para decidir si fallar ante cualquier conflicto o aplicar cambios no conflictivos.',
        enumValues: DW_CONFLICT_RESOLUTION_VALUES,
    }),

    // — UI —
    enumeratedType({
        name: 'Border',
        category: 'UI',
        summary: 'Tipo enumerado para estilos de borde visual.',
        documentation: 'Se usa en propiedades y APIs visuales que seleccionan el estilo de borde de controles, ventanas y superficies compatibles.',
        enumValues: BORDER_VALUES,
    }),
    enumeratedType({
        name: 'BorderStyle',
        category: 'UI',
        summary: 'Tipo enumerado para estilo de borde de controles.',
        documentation: 'Se usa en propiedades BorderStyle de controles que permiten seleccionar una representación visual del borde.',
        enumValues: BORDER_STYLE_VALUES,
    }),
    enumeratedType({
        name: 'Alignment',
        category: 'UI',
        summary: 'Tipo enumerado para alineación de texto.',
        documentation: 'Se usa para alinear texto o contenido dentro de controles y superficies que admiten alineación horizontal.',
        enumValues: ALIGNMENT_VALUES,
    }),
    enumeratedType({
        name: 'FillPattern',
        category: 'UI',
        summary: 'Tipo enumerado para patrón de relleno gráfico.',
        documentation: 'Se usa para seleccionar el patrón de relleno de fondos, áreas y series gráficas que aceptan constantes FillPattern. Los valores oficiales completos deben provenir del rail generated de B361/B366.',
    }),

    // — Ventana —
    enumeratedType({
        name: 'WindowType',
        category: 'Ventana',
        summary: 'Tipo enumerado para la clase de ventana PowerBuilder.',
        documentation: 'Distingue ventanas principales, hijas, popup y MDI en APIs y eventos que dependen de la clase de ventana.',
        enumValues: WINDOW_TYPE_VALUES,
    }),
    enumeratedType({
        name: 'WindowState',
        category: 'Ventana',
        summary: 'Tipo enumerado para el estado visual de una ventana.',
        documentation: 'Representa si una ventana está normal, maximizada o minimizada en propiedades y lógica de presentación.',
        enumValues: WINDOW_STATE_VALUES,
    }),

    // — Archivo —
    enumeratedType({
        name: 'FileAccess',
        category: 'Archivo',
        summary: 'Tipo enumerado para el modo de acceso a un archivo.',
        documentation: 'Controla si una API de archivo abre el recurso en lectura, escritura o lectura y escritura.',
        enumValues: FILE_ACCESS_VALUES,
    }),
    enumeratedType({
        name: 'FileMode',
        category: 'Archivo',
        summary: 'Tipo enumerado para el modo de apertura de un archivo.',
        documentation: 'Indica si las operaciones de E/S trabajan por líneas o como flujo continuo.',
        enumValues: FILE_MODE_VALUES,
    }),
    enumeratedType({
        name: 'Encoding',
        category: 'Archivo',
        summary: 'Tipo enumerado para la codificación de archivo.',
        documentation: 'Selecciona la codificación usada al leer o escribir texto con APIs de archivo compatibles.',
        allowedInParameters: ['encoding'],
        enumValues: ENCODING_VALUES,
    }),
    enumeratedType({
        name: 'SeekType',
        category: 'Archivo',
        summary: 'Tipo enumerado para el origen de desplazamiento en operaciones FileSeek.',
        documentation: 'Se usa para indicar si un desplazamiento de archivo se calcula desde el inicio, la posición actual o el final del archivo.',
        allowedInParameters: ['origin'],
        enumValues: SEEK_TYPE_VALUES,
    }),
];

export const PB_MANUAL_CORE_ENUMERATED_VALUES: readonly PbSystemSymbolEntry[] = [
    // — DataWindow / SaveAsType —
    ...createValues(SAVE_AS_TYPE_VALUES, 'DataWindow', 'SaveAsType', SAVE_AS_TYPE_VALUE_DETAILS),

    // — DataWindow / DWItemStatus —
    ...createValues(DW_ITEM_STATUS_VALUES, 'DataWindow', 'DWItemStatus', DW_ITEM_STATUS_VALUE_DETAILS),

    // — DataWindow / DWBuffer —
    ...createValues(DW_BUFFER_VALUES, 'DataWindow', 'DWBuffer', DW_BUFFER_VALUE_DETAILS),

    // — DataWindow / DWConflictResolution —
    ...createValues(DW_CONFLICT_RESOLUTION_VALUES, 'DataWindow', 'DWConflictResolution', DW_CONFLICT_RESOLUTION_VALUE_DETAILS),

    // — UI / Border —
    ...createValues(BORDER_VALUES, 'UI', 'Border', BORDER_VALUE_DETAILS),

    // — UI / BorderStyle —
    ...createValues(BORDER_STYLE_VALUES, 'UI', 'BorderStyle', BORDER_VALUE_DETAILS),

    // — UI / Alignment —
    ...createValues(ALIGNMENT_VALUES, 'UI', 'Alignment', ALIGNMENT_VALUE_DETAILS),

    // — Ventana —
    ...createValues(WINDOW_TYPE_VALUES, 'Ventana', 'WindowType', WINDOW_TYPE_VALUE_DETAILS),
    ...createValues(WINDOW_STATE_VALUES, 'Ventana', 'WindowState', WINDOW_STATE_VALUE_DETAILS),

    // — Archivo —
    ...createValues(FILE_ACCESS_VALUES, 'Archivo', 'FileAccess', FILE_ACCESS_VALUE_DETAILS),
    ...createValues(FILE_MODE_VALUES, 'Archivo', 'FileMode', FILE_MODE_VALUE_DETAILS),
    ...createValues(ENCODING_VALUES, 'Archivo', 'Encoding', ENCODING_VALUE_DETAILS),
    ...createValues(SEEK_TYPE_VALUES, 'Archivo', 'SeekType', SEEK_TYPE_VALUE_DETAILS),
];