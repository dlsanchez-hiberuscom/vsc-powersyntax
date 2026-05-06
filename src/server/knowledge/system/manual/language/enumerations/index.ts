import { PbSystemSymbolEntry } from '../../../types';
import { enumeratedType, enumeratedValue } from '../../common';

const PB_MANUAL_CORE_ENUMERATED_CATEGORIES = [
    'DataWindow',
    'UI',
    'File',
    'Window',
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
    manualOverlay?: { mode: 'override'; reason: string; evidence: string[] };
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
        summary: 'Exports DataWindow content in legacy Excel format.',
        documentation: 'SaveAsType value used to save data in Excel-compatible format.',
        enumValueMeaning: 'Legacy Excel format.',
    },
    'Text!': {
        summary: 'Exports DataWindow content as text.',
        documentation: 'Plain text format. Can be combined with the encoding argument in compatible APIs.',
        enumValueMeaning: 'Plain text.',
    },
    'CSV!': {
        summary: 'Exports DataWindow content as CSV.',
        documentation: 'Comma-separated values format. Common for tabular data exchange.',
        enumValueMeaning: 'CSV.',
    },
    'SQLInsert!': {
        summary: 'Exports content as SQL INSERT statements.',
        documentation: 'Generates INSERT statements from DataWindow data.',
        enumValueMeaning: 'SQL INSERT statements.',
    },
    'Clipboard!': {
        summary: 'Exports content to the clipboard.',
        documentation: 'Used when the export destination is the Clipboard.',
        enumValueMeaning: 'Clipboard.',
    },
    'PSReport!': {
        summary: 'Exports content as PowerSoft report.',
        documentation: 'Report format useful especially for composite report DataWindows.',
        enumValueMeaning: 'PowerSoft Report.',
    },
    'PDF!': {
        summary: 'Exports DataWindow content as PDF.',
        documentation: 'PDF format for document output.',
        enumValueMeaning: 'PDF.',
    },
    'XML!': {
        summary: 'Exports DataWindow content as XML.',
        documentation: 'XML format based on the configured XML template for the DataWindow.',
        enumValueMeaning: 'XML.',
    },
    'XSLFO!': {
        summary: 'Exports DataWindow content as XSL-FO.',
        documentation: 'XSL Formatting Objects format.',
        enumValueMeaning: 'XSL-FO.',
    },
    'XLSX!': {
        summary: 'Exports DataWindow content as XLSX.',
        documentation: 'Modern Excel format based on Office Open XML.',
        enumValueMeaning: 'Excel XLSX.',
    },
    'XLSB!': {
        summary: 'Exports DataWindow content as XLSB.',
        documentation: 'Excel binary format.',
        enumValueMeaning: 'Excel Binary Workbook.',
    },
};

const DW_ITEM_STATUS_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumNumericValue' | 'enumValueMeaning' | 'manualOverlay'>>> = {
    'NotModified!': {
        summary: 'Unmodified row or column.',
        documentation: 'Indicates that the data retains its original state within the DataWindow.',
        enumNumericValue: 0,
        enumValueMeaning: 'Unmodified.',
    },
    'DataModified!': {
        summary: 'Modified existing data.',
        documentation: 'Indicates that an existing row or column has been modified.',
        enumNumericValue: 1,
        enumValueMeaning: 'Data modified.',
    },
    'New!': {
        summary: 'New row without subsequent modifications.',
        documentation: 'Indicates an inserted row that has not yet been modified after its creation.',
        enumNumericValue: 2,
        enumValueMeaning: 'New row.',
    },
    'NewModified!': {
        summary: 'Modified new row.',
        documentation: 'Indicates a new row that has also received modifications.',
        enumNumericValue: 3,
        enumValueMeaning: 'Modified new row.',
    },
};

const DW_BUFFER_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumNumericValue' | 'enumValueMeaning'>>> = {
    'Primary!': {
        summary: 'Primary DataWindow buffer.',
        documentation: 'Represents active DataWindow rows, i.e., rows that have not been deleted or filtered.',
        enumNumericValue: 0,
        enumValueMeaning: 'Active data in the primary buffer.',
    },
    'Delete!': {
        summary: 'Deleted DataWindow rows buffer.',
        documentation: 'Represents DataWindow rows deleted that have not yet been confirmed in the database.',
        enumNumericValue: 1,
        enumValueMeaning: 'Data pending deletion.',
    },
    'Filter!': {
        summary: 'Filtered DataWindow rows buffer.',
        documentation: 'Represents rows removed from the active view using DataWindow filters.',
        enumNumericValue: 2,
        enumValueMeaning: 'Data filtered out of the active view.',
    },
};

const DW_CONFLICT_RESOLUTION_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumNumericValue' | 'enumValueMeaning'>>> = {
    'FailOnAnyConflict!': {
        summary: 'Fails if any conflict exists when synchronizing changes.',
        documentation: 'Prevents applying changes if source DataWindow data has changed since its state was captured.',
        enumNumericValue: 0,
        enumValueMeaning: 'Does not allow partial changes on conflicts.',
    },
    'AllowPartialChanges!': {
        summary: 'Allows applying non-conflicting changes.',
        documentation: 'Applies changes that are not in conflict during DataWindow synchronization.',
        enumNumericValue: 1,
        enumValueMeaning: 'Allows partial update.',
    },
};

const BORDER_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'NoBorder!': {
        summary: 'No visual border.',
        documentation: 'Indicates that the control or compatible surface shows no border.',
        enumValueMeaning: 'No border.',
    },
    'StyleBox!': {
        summary: 'Box-style border.',
        documentation: 'Represents a simple rectangular border.',
        enumValueMeaning: 'Box.',
    },
    'StyleLowered!': {
        summary: 'Lowered appearance border.',
        documentation: 'Represents a visual border with a lowered effect.',
        enumValueMeaning: 'Lowered.',
    },
    'StyleRaised!': {
        summary: 'Raised appearance border.',
        documentation: 'Represents a visual border with a raised effect.',
        enumValueMeaning: 'Raised.',
    },
    'StyleShadowBox!': {
        summary: 'Shadow box border.',
        documentation: 'Represents a rectangular border with a shadow effect.',
        enumValueMeaning: 'Shadow box.',
    },
};

const ALIGNMENT_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'Left!': {
        summary: 'Left alignment.',
        documentation: 'Aligns text or content to the left side in compatible controls.',
        enumValueMeaning: 'Left.',
    },
    'Center!': {
        summary: 'Centered alignment.',
        documentation: 'Centers text or content in compatible controls.',
        enumValueMeaning: 'Center.',
    },
    'Right!': {
        summary: 'Right alignment.',
        documentation: 'Aligns text or content to the right side in compatible controls.',
        enumValueMeaning: 'Right.',
    },
    'Justify!': {
        summary: 'Justified alignment.',
        documentation: 'Distributes text to adjust margins in compatible controls.',
        enumValueMeaning: 'Justified.',
    },
};

const WINDOW_TYPE_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'Main!': {
        summary: 'Main window.',
        documentation: 'Indicates a main application window.',
        enumValueMeaning: 'Main window.',
    },
    'Response!': {
        summary: 'Response window.',
        documentation: 'Indicates a modal response window.',
        enumValueMeaning: 'Response window.',
    },
    'Child!': {
        summary: 'Child window.',
        documentation: 'Indicates a child window dependent on another window.',
        enumValueMeaning: 'Child window.',
    },
    'Popup!': {
        summary: 'Popup window.',
        documentation: 'Indicates a popup window.',
        enumValueMeaning: 'Popup window.',
    },
    'MDI!': {
        summary: 'MDI window.',
        documentation: 'Indicates a multiple-document interface window.',
        enumValueMeaning: 'MDI frame.',
    },
    'MDIHelp!': {
        summary: 'MDI window with help.',
        documentation: 'Indicates an MDI window prepared for help scenarios.',
        enumValueMeaning: 'MDI help frame.',
    },
};

const WINDOW_STATE_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'Normal!': {
        summary: 'Normal window state.',
        documentation: 'The window is shown in its normal size and position.',
        enumValueMeaning: 'Normal.',
    },
    'Maximized!': {
        summary: 'Maximized window state.',
        documentation: 'The window is shown maximized.',
        enumValueMeaning: 'Maximized.',
    },
    'Minimized!': {
        summary: 'Minimized window state.',
        documentation: 'The window is shown minimized.',
        enumValueMeaning: 'Minimized.',
    },
};

const FILE_ACCESS_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'FileRead!': {
        summary: 'Read-only access.',
        documentation: 'Opens the file for read operations.',
        enumValueMeaning: 'Read.',
    },
    'FileWrite!': {
        summary: 'Write-only access.',
        documentation: 'Opens the file for write operations.',
        enumValueMeaning: 'Write.',
    },
    'FileReadWrite!': {
        summary: 'Read and write access.',
        documentation: 'Opens the file for read and write operations.',
        enumValueMeaning: 'Read and write.',
    },
};

const FILE_MODE_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'LineMode!': {
        summary: 'Line-by-line file mode.',
        documentation: 'I/O operations are performed by lines.',
        enumValueMeaning: 'Line mode.',
    },
    'StreamMode!': {
        summary: 'Stream file mode.',
        documentation: 'I/O operations are performed as a continuous stream.',
        enumValueMeaning: 'Stream mode.',
    },
};

const ENCODING_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'EncodingANSI!': {
        summary: 'ANSI encoding.',
        documentation: 'Uses ANSI encoding when reading or writing text in compatible APIs.',
        enumValueMeaning: 'ANSI.',
    },
    'EncodingUTF8!': {
        summary: 'UTF-8 encoding.',
        documentation: 'Uses UTF-8 encoding when reading or writing text in compatible APIs.',
        enumValueMeaning: 'UTF-8.',
    },
    'EncodingUTF16LE!': {
        summary: 'UTF-16 little endian encoding.',
        documentation: 'Uses UTF-16 little endian encoding when reading or writing text in compatible APIs.',
        enumValueMeaning: 'UTF-16 LE.',
    },
    'EncodingUTF16BE!': {
        summary: 'UTF-16 big endian encoding.',
        documentation: 'Uses UTF-16 big endian encoding when reading or writing text in compatible APIs.',
        enumValueMeaning: 'UTF-16 BE.',
    },
};

const SEEK_TYPE_VALUE_DETAILS: Readonly<Record<string, Pick<EnumValueArgs, 'summary' | 'documentation' | 'enumValueMeaning'>>> = {
    'FromBeginning!': {
        summary: 'Offset from the beginning of the file.',
        documentation: 'Interprets the relative offset from the beginning of the file.',
        enumValueMeaning: 'From beginning.',
    },
    'FromCurrent!': {
        summary: 'Offset from the current file position.',
        documentation: 'Interprets the relative offset from the current file position.',
        enumValueMeaning: 'From current position.',
    },
    'FromEnd!': {
        summary: 'Offset from the end of the file.',
        documentation: 'Interprets the relative offset from the end of the file.',
        enumValueMeaning: 'From end.',
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
            summary: detail?.summary ?? `${stripBang(name)} value of ${enumValueOf}.`,
            documentation: detail?.documentation,
            enumValueOf,
            enumNumericValue: detail?.enumNumericValue,
            enumValueMeaning: detail?.enumValueMeaning,
            manualOverlay: {
                mode: 'override',
                reason: (detail as any)?.manualOverlay?.reason ?? `Hardening ${name} enumeration value documentation.`,
                evidence: (detail as any)?.manualOverlay?.evidence ?? [`manual-core:language:enums:values:${name.toLowerCase().replace('!', '')}`]
            }
        });
    });
}

export const PB_MANUAL_CORE_ENUMERATED_TYPES: readonly PbSystemSymbolEntry[] = [
    // — DataWindow —
    enumeratedType({
        name: 'SaveAsType',
        category: 'DataWindow',
        summary: 'Enumerated type for DataWindow export formats.',
        documentation: 'Used as a datatype in SaveAs operations and other APIs that choose a specific output format.',
        allowedInParameters: ['saveastype'],
        enumValues: SAVE_AS_TYPE_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening SaveAsType documentation.', evidence: ['manual-core:language:enums:saveastype'] }
    }),
    enumeratedType({
        name: 'DWItemStatus',
        category: 'DataWindow',
        summary: 'Enumerated type for DataWindow row or column status.',
        documentation: 'Distinguishes new, modified, or unchanged rows within the DataWindow engine.',
        allowedInParameters: ['status'],
        enumValues: DW_ITEM_STATUS_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening DWItemStatus documentation.', evidence: ['manual-core:language:enums:dwitemstatus'] }
    }),
    enumeratedType({
        name: 'DWBuffer',
        category: 'DataWindow',
        summary: 'Enumerated type to select a DataWindow row buffer.',
        documentation: 'Used in DataWindow methods that read, move, or query rows within a specific buffer.',
        allowedInParameters: ['dwbuffer', 'movebuffer', 'targetbuffer'],
        enumValues: DW_BUFFER_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening DWBuffer documentation.', evidence: ['manual-core:language:enums:dwbuffer'] }
    }),
    enumeratedType({
        name: 'DWConflictResolution',
        category: 'DataWindow',
        summary: 'Enumerated type to resolve conflicts when synchronizing DataWindow changes.',
        documentation: 'Used in DataWindow change synchronization APIs to decide whether to fail on any conflict or apply non-conflicting changes.',
        enumValues: DW_CONFLICT_RESOLUTION_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening DWConflictResolution documentation.', evidence: ['manual-core:language:enums:dwconflictresolution'] }
    }),

    // — UI —
    enumeratedType({
        name: 'Border',
        category: 'UI',
        summary: 'Enumerated type for visual border styles.',
        documentation: 'Used in visual properties and APIs that select the border style of controls, windows, and compatible surfaces.',
        enumValues: BORDER_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening Border documentation.', evidence: ['manual-core:language:enums:border'] }
    }),
    enumeratedType({
        name: 'BorderStyle',
        category: 'UI',
        summary: 'Enumerated type for control border style.',
        documentation: 'Used in BorderStyle properties of controls that allow selecting a visual representation of the border.',
        enumValues: BORDER_STYLE_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening BorderStyle documentation.', evidence: ['manual-core:language:enums:borderstyle'] }
    }),
    enumeratedType({
        name: 'Alignment',
        category: 'UI',
        summary: 'Enumerated type for text alignment.',
        documentation: 'Used to align text or content within controls and surfaces that support horizontal alignment.',
        enumValues: ALIGNMENT_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening Alignment documentation.', evidence: ['manual-core:language:enums:alignment'] }
    }),
    enumeratedType({
        name: 'FillPattern',
        category: 'UI',
        summary: 'Enumerated type for graphic fill pattern.',
        documentation: 'Used to select the fill pattern of backgrounds, areas, and graphic series that accept FillPattern constants. Full official values should come from the B361/B366 generated rail.',
        manualOverlay: { mode: 'override', reason: 'Hardening FillPattern documentation.', evidence: ['manual-core:language:enums:fillpattern'] }
    }),

    // — Ventana —
    enumeratedType({
        name: 'WindowType',
        category: 'Window',
        summary: 'Enumerated type for PowerBuilder window class.',
        documentation: 'Distinguishes main, child, popup, and MDI windows in APIs and events that depend on the window class.',
        enumValues: WINDOW_TYPE_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening WindowType documentation.', evidence: ['manual-core:language:enums:windowtype'] }
    }),
    enumeratedType({
        name: 'WindowState',
        category: 'Window',
        summary: 'Enumerated type for visual state of a window.',
        documentation: 'Represents whether a window is normal, maximized, or minimized in properties and presentation logic.',
        enumValues: WINDOW_STATE_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening WindowState documentation.', evidence: ['manual-core:language:enums:windowstate'] }
    }),

    // — Archivo —
    enumeratedType({
        name: 'FileAccess',
        category: 'File',
        summary: 'Enumerated type for file access mode.',
        documentation: 'Controls whether a file API opens the resource in read, write, or read-write mode.',
        enumValues: FILE_ACCESS_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening FileAccess documentation.', evidence: ['manual-core:language:enums:fileaccess'] }
    }),
    enumeratedType({
        name: 'FileMode',
        category: 'File',
        summary: 'Enumerated type for file open mode.',
        documentation: 'Indicates whether I/O operations work by lines or as a continuous stream.',
        enumValues: FILE_MODE_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening FileMode documentation.', evidence: ['manual-core:language:enums:filemode'] }
    }),
    enumeratedType({
        name: 'Encoding',
        category: 'File',
        summary: 'Enumerated type for file encoding.',
        documentation: 'Selects the encoding used when reading or writing text with compatible file APIs.',
        allowedInParameters: ['encoding'],
        enumValues: ENCODING_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening Encoding documentation.', evidence: ['manual-core:language:enums:encoding'] }
    }),
    enumeratedType({
        name: 'SeekType',
        category: 'File',
        summary: 'Enumerated type for the offset origin in FileSeek operations.',
        documentation: 'Used to indicate whether a file offset is calculated from the beginning, the current position, or the end of the file.',
        allowedInParameters: ['origin'],
        enumValues: SEEK_TYPE_VALUES,
        manualOverlay: { mode: 'override', reason: 'Hardening SeekType documentation.', evidence: ['manual-core:language:enums:seektype'] }
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

    // — Window —
    ...createValues(WINDOW_TYPE_VALUES, 'Window', 'WindowType', WINDOW_TYPE_VALUE_DETAILS),
    ...createValues(WINDOW_STATE_VALUES, 'Window', 'WindowState', WINDOW_STATE_VALUE_DETAILS),

    // — File —
    ...createValues(FILE_ACCESS_VALUES, 'File', 'FileAccess', FILE_ACCESS_VALUE_DETAILS),
    ...createValues(FILE_MODE_VALUES, 'File', 'FileMode', FILE_MODE_VALUE_DETAILS),
    ...createValues(ENCODING_VALUES, 'File', 'Encoding', ENCODING_VALUE_DETAILS),
    ...createValues(SEEK_TYPE_VALUES, 'File', 'SeekType', SEEK_TYPE_VALUE_DETAILS),
];