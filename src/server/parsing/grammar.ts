/**
 * Módulo canónico de Gramática de PowerBuilder.
 * Centraliza las expresiones regulares léxicas y bloques de construcción sintáctica
 * para ser reutilizados por matchers, diagnostics y análisis de secciones.
 */

import { PB_GENERATED_BUILTIN_TYPES } from './generatedBuiltinTypes.generated';
import { PB_GENERATED_KEYWORD_LEXEMES } from './generatedKeywordLexemes.generated';

// -----------------------------------------------------------------------------
// 1. CONSTANTES LÉXICAS ATÓMICAS
// -----------------------------------------------------------------------------

export const PB_IDENTIFIER_START_SOURCE = '[a-zA-Z_$#%]';
export const PB_IDENTIFIER_CHAR_SOURCE = '[a-zA-Z0-9_$#%-]';
export const PB_IDENTIFIER_BODY_SOURCE = `${PB_IDENTIFIER_CHAR_SOURCE}*`;
export const PB_IDENTIFIER_SOURCE = `${PB_IDENTIFIER_START_SOURCE}${PB_IDENTIFIER_BODY_SOURCE}`;

// Para identificadores de tipo (ej: objetos con backticks o guiones, común en variables/referencias exportadas)
export const TYPE_REFERENCE_SOURCE = '[a-zA-Z_$#%][\\w$#%\\-`]*';

// Espacio en blanco
export const WS_OPT = '\\s*';
export const WS_REQ = '\\s+';

// Modificadores de Acceso y Estado
export const VARIABLE_ACCESS_MODIFIER_SOURCE = 'public|private|protected|global|shared|privateread|privatewrite|protectedread|protectedwrite';
export const VAR_STATE_MODIFIER_SOURCE = 'readonly|constant|ref|indirect|static';
export const FUNC_STATE_MODIFIER_SOURCE = 'rpcfunc|external|native';

// Patrón para capturar N modificadores genéricos antes de una declaración
export const ANY_MODIFIER_SOURCE = `(?:(?:${VARIABLE_ACCESS_MODIFIER_SOURCE}|${VAR_STATE_MODIFIER_SOURCE}|${FUNC_STATE_MODIFIER_SOURCE})\\s+)*`;

// -----------------------------------------------------------------------------
// 2. PALABRAS CLAVE (KEYWORDS)
// -----------------------------------------------------------------------------

const PB_FAST_BLOCK_KEYWORD_PHRASES = [
  'end if', 'end choose', 'end try', 'end function', 'end subroutine', 'end event', 'end on',
  'end type', 'type variables', 'end variables', 'type prototypes', 'end prototypes',
  'forward prototypes', 'end forward'
] as const;

const PB_FAST_NON_IDENTIFIER_TOKENS = [
  'this', 'super', 'parent', 'parentwindow',
  'sqlca', 'sqlsa', 'sqlda', 'error', 'message'
] as const;

export const PB_KEYWORDS = new Set<string>([
  ...PB_GENERATED_KEYWORD_LEXEMES,
  ...PB_FAST_BLOCK_KEYWORD_PHRASES,
  ...PB_FAST_NON_IDENTIFIER_TOKENS,
]);

export const PB_BUILTIN_TYPES = new Set<string>([
  'integer', 'int', 'long', 'unsignedinteger', 'unsignedlong', 'uint', 'ulong',
  'string', 'char', 'character', 'boolean', 'blob', 'byte',
  'date', 'time', 'datetime', 'timestamp',
  'decimal', 'dec', 'double', 'real', 'number',
  'any', 'longlong', 'longptr',
  'window', 'application', 'datawindow', 'datastore', 'datawindowchild', 'datawwindowchild',
  'animation', 'checkbox', 'commandbutton', 'datepicker', 'dropdownlistbox', 'dropdownpicturelistbox', 'editmask',
  'graph', 'groupbox', 'hprogressbar', 'hscrollbar', 'htrackbar', 'inkedit', 'inkpicture', 'line', 'listbox',
  'listview', 'listviewitem', 'multilineedit', 'monthcalendar', 'oval', 'picture', 'picturebutton', 'picturehyperlink',
  'picturelistbox', 'powerserverlabel', 'radiobutton', 'rectangle', 'ribbonbar', 'richtextedit', 'roundrectangle',
  'singlelineedit', 'statichyperlink', 'statictext', 'tab', 'treeview', 'treeviewitem', 'userobject', 'vprogressbar',
  'vscrollbar', 'vtrackbar', 'webbrowser',
  'transaction', 'adoresultset', 'coderobject', 'compressorobject', 'connection', 'contextinformation',
  'contextkeyword', 'crypterobject', 'dotnetassembly', 'dotnetobject', 'errorlogging', 'exception', 'extractorobject',
  'httpclient', 'inet', 'internetresult', 'mailrecipient', 'mlsync', 'oauthclient', 'oauthrequest', 'jsonparser',
  'pipeline', 'profilecall', 'profileclass', 'profileline', 'profileroutine', 'profiling', 'jsongenerator', 'jsonpackage',
  'oletxnobject', 'pdfdocument', 'pdfmodel', 'pdfobject', 'pdfsecurity', 'restclient', 'service', 'sslcallback',
  'sslserviceprovider', 'timing', 'tokenrequest', 'tokenresponse', 'tracefile', 'tracetree', 'transactionserver',
  'ulsync', 'wsconnection',
  'oleobject', 'olecontrol', 'olecustomcontrol', 'olestorage', 'olestream',
  'powerobject', 'nonvisualobject', 'graphicobject', 'drawobject', 'structure',
  'dynamicdescriptionarea', 'dynamicstagingarea',
  'mailsession', 'message', 'environment', 'error', 'throwable', 'runtimeerror',
  'classdefinition', 'enumerationdefinition', 'enumerationitemdefinition', 'function_object', 'pbdom_characterdata',
  'pbdom_object', 'pbdom_text', 'scriptdefinition', 'variabledefinition', 'typedefinition',
  'typeobject',
  ...PB_GENERATED_BUILTIN_TYPES,
]);

// -----------------------------------------------------------------------------
// 3. EXPRESIONES REGULARES COMPUESTAS (Para uso con .exec o .test)
// -----------------------------------------------------------------------------
// NOTA: Estas expresiones incluyen **grupos de captura ()** diseñados específicamente
// para que `matchers.ts` extraiga la información que necesita.

// ROOT_TYPE_PATTERN: global type [name] from [ancestor]
// Grupos: 1=Name, 2=Ancestor
export const ROOT_TYPE_PATTERN = new RegExp(
  `^${WS_OPT}(?:global${WS_REQ})?type${WS_REQ}(${PB_IDENTIFIER_SOURCE})${WS_REQ}from${WS_REQ}(${TYPE_REFERENCE_SOURCE})${WS_OPT}$`,
  'i'
);

// NESTED_TYPE_PATTERN: type [name] from [ancestor] within [container]
// Grupos: 1=Name, 2=Ancestor, 3=Container
export const NESTED_TYPE_PATTERN = new RegExp(
  `^${WS_OPT}(?:(?:global|public|private|protected)${WS_REQ})?type${WS_REQ}(${PB_IDENTIFIER_SOURCE})${WS_REQ}from${WS_REQ}(${TYPE_REFERENCE_SOURCE})(?:${WS_REQ}within${WS_REQ}(${TYPE_REFERENCE_SOURCE}))?`,
  'i'
);

// FUNCTION_PATTERN: [modifiers] function [returnType] [name] (
// Grupos: 1=ReturnType, 2=Name
export const FUNCTION_PATTERN = new RegExp(
  `^${WS_OPT}${ANY_MODIFIER_SOURCE}function${WS_REQ}(${TYPE_REFERENCE_SOURCE})${WS_REQ}(${PB_IDENTIFIER_SOURCE})${WS_OPT}(?=\\()`,
  'i'
);

// SUBROUTINE_PATTERN: [modifiers] subroutine [name] (
// Grupos: 1=Name
export const SUBROUTINE_PATTERN = new RegExp(
  `^${WS_OPT}${ANY_MODIFIER_SOURCE}subroutine${WS_REQ}(${PB_IDENTIFIER_SOURCE})${WS_OPT}(?=\\()`,
  'i'
);

// QUALIFIED_EVENT_PATTERN: event [type] [name]::[subname]
// Grupos: 1=Name
export const EVENT_PATTERN = new RegExp(
  `^${WS_OPT}${ANY_MODIFIER_SOURCE}event${WS_REQ}(${PB_IDENTIFIER_SOURCE}(?:::${PB_IDENTIFIER_SOURCE})?)${WS_OPT}(?:;|\\(|$)`,
  'i'
);

// ON_EVENT_PATTERN: on [qualifier].[name]
// Grupos: 1=QualifiedName
export const ON_EVENT_PATTERN = new RegExp(
  `^${WS_OPT}on${WS_REQ}(${PB_IDENTIFIER_SOURCE}(?:\.${PB_IDENTIFIER_SOURCE})+)${WS_OPT};?${WS_OPT}$`,
  'i'
);

// VARIABLE_PATTERN: [modifiers] [type]{size} [name]
// Grupos: 1=Modifiers (todo el bloque de modificadores), 2=Type(con array), 3=Name
export const VARIABLE_PATTERN = new RegExp(
  `^${WS_OPT}(${ANY_MODIFIER_SOURCE})(${TYPE_REFERENCE_SOURCE}(?:\\{\\d+\\})?)${WS_REQ}(${PB_IDENTIFIER_SOURCE})`,
  'i'
);

// -----------------------------------------------------------------------------
// 4. PATRONES ESTRUCTURALES Y SECCIONES
// -----------------------------------------------------------------------------

export const FORWARD_PROTOTYPES_START_PATTERN = new RegExp(`^${WS_OPT}forward${WS_REQ}prototypes\\b`, 'i');
export const PROTOTYPES_START_PATTERN = new RegExp(`^${WS_OPT}(?:type${WS_REQ})?prototypes\\b`, 'i');
export const END_PROTOTYPES_PATTERN = new RegExp(`^${WS_OPT}end${WS_REQ}prototypes\\b`, 'i');

export const VARIABLES_START_PATTERN = new RegExp(`^${WS_OPT}(?:(?:${PB_IDENTIFIER_SOURCE}${WS_REQ})?type${WS_REQ}variables|global${WS_REQ}variables|variables)\\b`, 'i');
export const END_VARIABLES_PATTERN = new RegExp(`^${WS_OPT}end${WS_REQ}variables\\b`, 'i');

export const FORWARD_START_PATTERN = new RegExp(`^${WS_OPT}forward\\b`, 'i');
export const END_FORWARD_PATTERN = new RegExp(`^${WS_OPT}end${WS_REQ}forward\\b`, 'i');

export const END_TYPE_PATTERN = new RegExp(`^${WS_OPT}end${WS_REQ}type\\b`, 'i');
export const END_FUNCTION_PATTERN = new RegExp(`^${WS_OPT}end${WS_REQ}function\\b`, 'i');
export const END_SUBROUTINE_PATTERN = new RegExp(`^${WS_OPT}end${WS_REQ}subroutine\\b`, 'i');
export const END_EVENT_PATTERN = new RegExp(`^${WS_OPT}end${WS_REQ}event\\b`, 'i');
export const END_ON_PATTERN = new RegExp(`^${WS_OPT}end${WS_REQ}on\\b`, 'i');

// -----------------------------------------------------------------------------
// 5. BLOQUES EJECUTABLES
// -----------------------------------------------------------------------------

export const IF_BLOCK_OPEN_PATTERN = /^if\b.*\bthen\s*$/i;
export const FOR_OPEN_PATTERN = /^for\b/i;
export const DO_OPEN_PATTERN = /^do\b/i;
export const CHOOSE_CASE_OPEN_PATTERN = /^choose\s+case\b/i;
export const TRY_OPEN_PATTERN = /^try\b/i;

export const END_IF_PATTERN = /^end\s+if\b/i;
export const NEXT_PATTERN = /^next\b/i;
export const LOOP_PATTERN = /^loop\b/i;
export const END_CHOOSE_PATTERN = /^end\s+choose\b/i;
export const END_TRY_PATTERN = /^end\s+try\b/i;

export const END_GENERIC_PATTERN = /^end\s+/i;
export const ELSE_CASE_PATTERN = /^(else|elseif|case)\b/i;

export const LINE_COMMENT_PATTERN = /^\/\//;
export const EXPORT_LINE_PATTERN = /^\$PBExport/;