import { PbSystemSymbolEntry } from '../types';
import { enumeratedValue } from './common';

export const PB_MANUAL_CORE_ENUMERATED_VALUE_CATEGORIES = [
    'Tipo',
    'UI',
    'Archivo',
] as const;

export const PB_MANUAL_CORE_ENUMERATED_VALUES: readonly PbSystemSymbolEntry[] = [
    // — Tipo —
    enumeratedValue({ name: 'SaveAsType!', category: 'Tipo', summary: 'Enumeración de formatos de exportación (CSV!, Text!, Excel!, etc.).' }),
    enumeratedValue({ name: 'DWItemStatus!', category: 'Tipo', summary: 'Estado de fila/columna del DataWindow (New!, NewModified!, DataModified!, NotModified!).' }),
    enumeratedValue({ name: 'DWBuffer!', category: 'Tipo', summary: 'Buffer del DataWindow (Primary!, Filter!, Delete!).' }),

    // — UI —
    enumeratedValue({ name: 'Border!', category: 'UI', summary: 'Estilo de borde (NoBorder!, StyleBox!, StyleLowered!, StyleRaised!, StyleShadowBox!).' }),
    enumeratedValue({ name: 'Alignment!', category: 'UI', summary: 'Alineación de texto (Left!, Center!, Right!, Justify!).' }),
    enumeratedValue({ name: 'FillPattern!', category: 'UI', summary: 'Patrón de relleno gráfico.' }),
    enumeratedValue({ name: 'WindowType!', category: 'UI', summary: 'Tipo de ventana (Main!, Response!, Child!, Popup!, MDI!, MDIHelp!).' }),
    enumeratedValue({ name: 'WindowState!', category: 'UI', summary: 'Estado de ventana (Normal!, Maximized!, Minimized!).' }),

    // — Archivo —
    enumeratedValue({ name: 'FileAccess!', category: 'Archivo', summary: 'Modo de acceso a archivo (FileRead!, FileWrite!, FileReadWrite!).' }),
    enumeratedValue({ name: 'FileMode!', category: 'Archivo', summary: 'Modo de apertura de archivo (LineMode!, StreamMode!).' }),
    enumeratedValue({ name: 'Encoding!', category: 'Archivo', summary: 'Codificación de archivo (EncodingANSI!, EncodingUTF8!, EncodingUTF16LE!, EncodingUTF16BE!).' }),
];
