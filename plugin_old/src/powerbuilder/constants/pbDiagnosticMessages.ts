export const PB_DIAGNOSTIC_CODES = {
    UNCLOSED_IF: 'pb-unclosed-if',
    UNCLOSED_FOR: 'pb-unclosed-for',
    UNCLOSED_DO: 'pb-unclosed-do',
    UNCLOSED_CHOOSE_CASE: 'pb-unclosed-choose-case',
    UNCLOSED_TRY: 'pb-unclosed-try',

    STRAY_END_IF: 'pb-stray-end-if',
    STRAY_NEXT: 'pb-stray-next',
    STRAY_LOOP: 'pb-stray-loop',
    STRAY_END_CHOOSE: 'pb-stray-end-choose',
    STRAY_END_TRY: 'pb-stray-end-try',

    TRY_MISSING_CATCH_OR_FINALLY: 'pb-try-missing-catch-finally',
    UNEXPECTED_BLOCK_CLOSE: 'pb-unexpected-block-close',
    SQL_MISSING_SEMICOLON: 'pb-sql-missing-semicolon',
    UNUSED_LOCAL_VARIABLE: 'pb-unused-local-variable',
    UNASSIGNED_LOCAL_VARIABLE: 'pb-unassigned-local-variable',
    WRITE_ONLY_LOCAL_VARIABLE: 'pb-write-only-local-variable',
    UNUSED_PARAMETER: 'pb-unused-parameter',
    UNUSED_PRIVATE_MEMBER_VARIABLE: 'pb-unused-private-member-variable',
    WRITE_ONLY_PRIVATE_MEMBER_VARIABLE: 'pb-write-only-private-member-variable',
    POTENTIALLY_INDIRECT_VARIABLE_USAGE: 'pb-potentially-indirect-variable-usage',
    UNREACHABLE_STATEMENT: 'pb-unreachable-statement',
    DATAWINDOW_SQL_UNKNOWN_COLUMN: 'pb-datawindow-sql-unknown-column',
    DATAWINDOW_SCRIPT_DATAOBJECT_NO_UNIQUE_TARGET: 'pb-datawindow-script-dataobject-no-unique-target',
    DATAWINDOW_SCRIPT_UNKNOWN_COLUMN: 'pb-datawindow-script-unknown-column',
    AMBIGUOUS_CALL: 'pb-ambiguous-call',
    LOCAL_VARIABLE_SHADOWS_MEMBER: 'pb-local-shadows-member',
    PARAMETER_SHADOWS_MEMBER: 'pb-parameter-shadows-member',
    LEGACY_GOTO: 'pb-legacy-goto',
    LEGACY_HALT: 'pb-legacy-halt',
    OBSOLETE_RUNTIME_FUNCTION: 'pb-obsolete-runtime-function',
} as const;

export type PbDiagnosticCode =
    typeof PB_DIAGNOSTIC_CODES[keyof typeof PB_DIAGNOSTIC_CODES];

export type PbBlockKind = 'IF' | 'FOR' | 'DO' | 'CHOOSE CASE' | 'TRY';

/**
 * Textos centralizados en español para los diagnósticos/lints.
 * Mantengo el nombre solicitado: lst_lalb_servicio
 */
export const lst_lalb_servicio: Record<PbDiagnosticCode, string> = {
    [PB_DIAGNOSTIC_CODES.UNCLOSED_IF]: 'Falta cerrar el bloque IF.',
    [PB_DIAGNOSTIC_CODES.UNCLOSED_FOR]: 'Falta cerrar el bloque FOR.',
    [PB_DIAGNOSTIC_CODES.UNCLOSED_DO]: 'Falta cerrar el bloque DO...LOOP.',
    [PB_DIAGNOSTIC_CODES.UNCLOSED_CHOOSE_CASE]: 'Falta cerrar el bloque CHOOSE CASE.',
    [PB_DIAGNOSTIC_CODES.UNCLOSED_TRY]: 'Falta cerrar el bloque TRY.',

    [PB_DIAGNOSTIC_CODES.STRAY_END_IF]: 'END IF sin bloque IF de apertura.',
    [PB_DIAGNOSTIC_CODES.STRAY_NEXT]: 'NEXT sin bloque FOR de apertura.',
    [PB_DIAGNOSTIC_CODES.STRAY_LOOP]: 'LOOP sin bloque DO de apertura.',
    [PB_DIAGNOSTIC_CODES.STRAY_END_CHOOSE]: 'END CHOOSE sin bloque CHOOSE CASE de apertura.',
    [PB_DIAGNOSTIC_CODES.STRAY_END_TRY]: 'END TRY sin bloque TRY de apertura.',

    [PB_DIAGNOSTIC_CODES.TRY_MISSING_CATCH_OR_FINALLY]:
        'El bloque TRY debe contener al menos un CATCH o un FINALLY.',

    [PB_DIAGNOSTIC_CODES.UNEXPECTED_BLOCK_CLOSE]:
        'Cierre de bloque inesperado o mal anidado.',

    [PB_DIAGNOSTIC_CODES.SQL_MISSING_SEMICOLON]:
        'Puede faltar el punto y coma (;) al final de la sentencia SQL.',

    [PB_DIAGNOSTIC_CODES.UNUSED_LOCAL_VARIABLE]:
        'La variable local esta declarada pero no se usa.',

    [PB_DIAGNOSTIC_CODES.UNASSIGNED_LOCAL_VARIABLE]:
        'La variable local se usa pero nunca recibe una asignacion demostrable.',

    [PB_DIAGNOSTIC_CODES.WRITE_ONLY_LOCAL_VARIABLE]:
        'La variable local solo recibe escrituras y nunca se lee.',

    [PB_DIAGNOSTIC_CODES.UNUSED_PARAMETER]:
        'El parametro esta declarado pero no se usa.',

    [PB_DIAGNOSTIC_CODES.UNUSED_PRIVATE_MEMBER_VARIABLE]:
        'La variable miembro privada no se usa dentro del objeto actual.',

    [PB_DIAGNOSTIC_CODES.WRITE_ONLY_PRIVATE_MEMBER_VARIABLE]:
        'La variable miembro privada solo recibe escrituras y nunca se lee dentro del objeto actual.',

    [PB_DIAGNOSTIC_CODES.POTENTIALLY_INDIRECT_VARIABLE_USAGE]:
        'La variable o el parametro podria estarse usando de forma indirecta.',

    [PB_DIAGNOSTIC_CODES.UNREACHABLE_STATEMENT]:
        'La sentencia no es alcanzable dentro de esta ruta lineal del flujo.',

    [PB_DIAGNOSTIC_CODES.DATAWINDOW_SQL_UNKNOWN_COLUMN]:
        'El retrieve referencia una columna que no está publicada en table(column=...).',

    [PB_DIAGNOSTIC_CODES.DATAWINDOW_SCRIPT_DATAOBJECT_NO_UNIQUE_TARGET]:
        'El DataObject no resuelve un painter .srd único y el enlace se retira por seguridad.',

    [PB_DIAGNOSTIC_CODES.DATAWINDOW_SCRIPT_UNKNOWN_COLUMN]:
        'La columna referenciada desde script no existe en el painter DataWindow enlazado.',

    [PB_DIAGNOSTIC_CODES.AMBIGUOUS_CALL]:
        'La llamada sigue siendo ambigua entre varias candidatas compatibles.',

    [PB_DIAGNOSTIC_CODES.LOCAL_VARIABLE_SHADOWS_MEMBER]:
        'La variable local oculta un miembro del objeto actual.',

    [PB_DIAGNOSTIC_CODES.PARAMETER_SHADOWS_MEMBER]:
        'El parametro oculta un miembro del objeto actual.',

    [PB_DIAGNOSTIC_CODES.LEGACY_GOTO]:
        'GOTO es una construccion legacy; prefiere flujo de control estructurado.',

    [PB_DIAGNOSTIC_CODES.LEGACY_HALT]:
        'HALT detiene la aplicacion de forma abrupta; revisa si existe una salida mas segura.',

    [PB_DIAGNOSTIC_CODES.OBSOLETE_RUNTIME_FUNCTION]:
        'La funcion global del runtime esta obsoleta; usa el reemplazo recomendado si existe.',
};

export const PB_UNCLOSED_BLOCK_CODE_BY_KIND: Record<PbBlockKind, PbDiagnosticCode> = {
    IF: PB_DIAGNOSTIC_CODES.UNCLOSED_IF,
    FOR: PB_DIAGNOSTIC_CODES.UNCLOSED_FOR,
    DO: PB_DIAGNOSTIC_CODES.UNCLOSED_DO,
    'CHOOSE CASE': PB_DIAGNOSTIC_CODES.UNCLOSED_CHOOSE_CASE,
    TRY: PB_DIAGNOSTIC_CODES.UNCLOSED_TRY,
};

export const PB_STRAY_CLOSE_CODE_BY_KIND: Record<PbBlockKind, PbDiagnosticCode> = {
    IF: PB_DIAGNOSTIC_CODES.STRAY_END_IF,
    FOR: PB_DIAGNOSTIC_CODES.STRAY_NEXT,
    DO: PB_DIAGNOSTIC_CODES.STRAY_LOOP,
    'CHOOSE CASE': PB_DIAGNOSTIC_CODES.STRAY_END_CHOOSE,
    TRY: PB_DIAGNOSTIC_CODES.STRAY_END_TRY,
};

export function getDiagnosticMessageEs(code: PbDiagnosticCode): string {
    return lst_lalb_servicio[code];
}

export function getUnclosedBlockCode(kind: PbBlockKind): PbDiagnosticCode {
    return PB_UNCLOSED_BLOCK_CODE_BY_KIND[kind];
}

export function getStrayCloseCode(kind: PbBlockKind): PbDiagnosticCode {
    return PB_STRAY_CLOSE_CODE_BY_KIND[kind];
}
