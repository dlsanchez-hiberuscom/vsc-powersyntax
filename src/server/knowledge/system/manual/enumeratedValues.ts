import { PbSystemSymbolEntry } from '../types';
import { enumeratedValue } from './common';

export const PB_MANUAL_CORE_ENUMERATED_VALUE_CATEGORIES = [
    'Tipo',
    'UI',
    'Archivo',
] as const;

function enumeratedType(args: { name: string; category: string; summary: string }): PbSystemSymbolEntry {
    const lookupAlias = args.name.endsWith('!') ? args.name.slice(0, -1) : undefined;

    return enumeratedValue({
        ...args,
        lookupAliases: lookupAlias ? [lookupAlias] : undefined,
    });
}

export const PB_MANUAL_CORE_ENUMERATED_VALUES: readonly PbSystemSymbolEntry[] = [
    // — Tipo —
    enumeratedType({ name: 'SaveAsType!', category: 'Tipo', summary: 'Enumeración de formatos de exportación (CSV!, Text!, Excel!, etc.).' }),
    enumeratedType({ name: 'DWItemStatus!', category: 'Tipo', summary: 'Estado de fila/columna del DataWindow (New!, NewModified!, DataModified!, NotModified!).' }),
    enumeratedType({ name: 'DWBuffer!', category: 'Tipo', summary: 'Buffer del DataWindow (Primary!, Filter!, Delete!).' }),

    // — UI —
    enumeratedType({ name: 'Border!', category: 'UI', summary: 'Estilo de borde (NoBorder!, StyleBox!, StyleLowered!, StyleRaised!, StyleShadowBox!).' }),
    enumeratedType({ name: 'Alignment!', category: 'UI', summary: 'Alineación de texto (Left!, Center!, Right!, Justify!).' }),
    enumeratedType({ name: 'FillPattern!', category: 'UI', summary: 'Patrón de relleno gráfico.' }),
    enumeratedType({ name: 'WindowType!', category: 'UI', summary: 'Tipo de ventana (Main!, Response!, Child!, Popup!, MDI!, MDIHelp!).' }),
    enumeratedType({ name: 'WindowState!', category: 'UI', summary: 'Estado de ventana (Normal!, Maximized!, Minimized!).' }),

    // — Archivo —
    enumeratedType({ name: 'FileAccess!', category: 'Archivo', summary: 'Modo de acceso a archivo (FileRead!, FileWrite!, FileReadWrite!).' }),
    enumeratedType({ name: 'FileMode!', category: 'Archivo', summary: 'Modo de apertura de archivo (LineMode!, StreamMode!).' }),
    enumeratedType({ name: 'Encoding!', category: 'Archivo', summary: 'Codificación de archivo (EncodingANSI!, EncodingUTF8!, EncodingUTF16LE!, EncodingUTF16BE!).' }),
];
