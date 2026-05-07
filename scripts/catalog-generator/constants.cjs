'use strict';

const path = require('node:path');

const POWERSCRIPT_BASE_URL = 'https://docs.appeon.com/pb2025/powerscript_reference/';
const POWERSCRIPT_INDEX_URL = `${POWERSCRIPT_BASE_URL}index.html`;
const POWERSCRIPT_RESERVED_WORDS_URL = `${POWERSCRIPT_BASE_URL}xREF_80481_Reserved_words.html`;
const POWERSCRIPT_STATEMENTS_URL = `${POWERSCRIPT_BASE_URL}PowerScript_Statements.html`;
const POWERSCRIPT_ENUMERATED_DATATYPES_URL = `${POWERSCRIPT_BASE_URL}xREF_30880_Enumerated.html`;
const POWERSCRIPT_STANDARD_DATATYPES_URL = `${POWERSCRIPT_BASE_URL}xREF_87805_Standard_datatypes.html`;
const POWERSCRIPT_EVENTS_URL = `${POWERSCRIPT_BASE_URL}ch02s03.html`;

const OBJECTS_AND_CONTROLS_BASE_URL = 'https://docs.appeon.com/pb2025/objects_and_controls/';
const OBJECTS_AND_CONTROLS_INDEX_URL = `${OBJECTS_AND_CONTROLS_BASE_URL}index.html`;
const OBJECTS_AND_CONTROLS_PROPERTIES_URL = `${OBJECTS_AND_CONTROLS_BASE_URL}ch02.html`;
const OBJECTS_AND_CONTROLS_UNDOCUMENTED_BASE_CLASSES_URL = `${OBJECTS_AND_CONTROLS_BASE_URL}ch01s03s01.html`;

const DATAWINDOW_BASE_URL = 'https://docs.appeon.com/pb2025/datawindow_reference/';
const DATAWINDOW_INDEX_URL = `${DATAWINDOW_BASE_URL}index.html`;
const DATAWINDOW_EXPRESSION_FUNCTIONS_URL = `${DATAWINDOW_BASE_URL}DataWindow_Expression_Functions.html`;
const DATAWINDOW_OBJECT_PROPERTIES_URL = `${DATAWINDOW_BASE_URL}XREF_90985_CHAPTER_3.html`;
const DATAWINDOW_CONTROL_METHODS_URL = `${DATAWINDOW_BASE_URL}XREF_40567_CHAPTER_9_Methods.html`;
const DATAWINDOW_EVENTS_URL = `${DATAWINDOW_BASE_URL}XREF_48155_CHAPTER_8.html`;
const DATAWINDOW_CONSTANTS_CHAPTER_URL = `${DATAWINDOW_BASE_URL}XREF_81683_CHAPTER_6.html`;

const DATAWINDOW_OWNER_TYPES = new Set(['datawindow', 'datawindowchild', 'datastore']);
const NON_CONTROL_OBJECT_OWNER_TYPES = new Set(['application', 'menu', 'nonvisualobject']);

const SPECIAL_OWNER_SCOPE_ANY_OBJECT = '__any_object__';
const SPECIAL_OWNER_SCOPE_ALL_CONTROLS = '__all_controls__';
const SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_APPLICATION = '__any_object_except_application__';
const SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_MENU = '__any_object_except_menu__';
const SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_DATAWINDOWCHILD = '__any_object_except_datawindowchild__';
const SPECIAL_OWNER_SCOPE_ALL_CONTROLS_EXCEPT_DRAWING = '__all_controls_except_drawing__';

const DRAWING_CONTROL_OWNER_TYPES = new Set(['line', 'oval', 'rectangle', 'roundrectangle']);

const OFFICIAL_GENERATED_KEYWORD_CATEGORY_OVERRIDES = new Map([
    ['constant', 'Modificadores de declaración'],
    ['external', 'Modificadores de declaración'],
    ['global', 'Visibilidad y alcance'],
    ['indirect', 'Modificadores de declaración'],
    ['native', 'Modificadores de declaración'],
    ['private', 'Visibilidad y alcance'],
    ['privateread', 'Visibilidad y alcance'],
    ['privatewrite', 'Visibilidad y alcance'],
    ['protected', 'Visibilidad y alcance'],
    ['protectedread', 'Visibilidad y alcance'],
    ['protectedwrite', 'Visibilidad y alcance'],
    ['public', 'Visibilidad y alcance'],
    ['readonly', 'Modificadores de declaración'],
    ['ref', 'Modificadores de declaración'],
    ['rpcfunc', 'Modificadores de declaración'],
    ['shared', 'Visibilidad y alcance'],
    ['static', 'Modificadores de declaración'],
]);

const OFFICIAL_LITERAL_RESERVED_WORDS = new Set(['true', 'false', 'null']);
const OFFICIAL_LOGICAL_RESERVED_WORDS = new Set(['and', 'not', 'or', 'xor']);

const APPLY_TO_OWNER_TYPE_OVERRIDES = new Map([
    ['any object', SPECIAL_OWNER_SCOPE_ANY_OBJECT],
    ['all objects', SPECIAL_OWNER_SCOPE_ANY_OBJECT],
    ['any object except application', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_APPLICATION],
    ['any object except menu', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_MENU],
    ['any object except datawindowchild', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_DATAWINDOWCHILD],
    ['all controls', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['controls that can be placed in windows', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['controls that can be placed on a window', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['control', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['any control', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['all controls except drawing', SPECIAL_OWNER_SCOPE_ALL_CONTROLS_EXCEPT_DRAWING],
    ['all controls except drawing objects', SPECIAL_OWNER_SCOPE_ALL_CONTROLS_EXCEPT_DRAWING],
    ['a control within a window', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['any editable', ['singlelineedit', 'multilineedit', 'editmask', 'richtextedit', 'inkedit']],
    ['any object except a menu', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_MENU],
    ['except application object', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_APPLICATION],
    ['except a child datawindow', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_DATAWINDOWCHILD],
    ['all text objects', ['singlelineedit', 'statictext', 'editmask', 'multilineedit']],
    ['visual controls', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['visual objects', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['graph controls in windows', ['graph']],
    ['graph controls in windows and user objects', ['graph']],
    ['graph objects in windows', ['graph']],
    ['graphs in datawindow controls', ['datawindow']],
    ['in datawindow controls', ['datawindow']],
    ['powerbuilder datawindow', ['datawindow']],
    ['batch data objects', ['datawindow', 'datawindowchild', 'datastore']],
    ['datawindow control', ['datawindow']],
    ['datawindow control with richtextedit presentation style', ['datawindow']],
    ['datawindow controls with richtextedit style', ['datawindow']],
    ['datawindow controls whose content has richtextedit presentation style', ['datawindow']],
    ['datawindowchild object', ['datawindowchild']],
    ['datastore object', ['datastore']],
    ['datastores', ['datastore']],
    ['setitem', ['datawindow', 'datawindowchild', 'datastore']],
    ['a window', ['window']],
    ['windows', ['window']],
    ['mdi frame windows', ['mdiframe']],
    ['sheet windows', ['window']],
    ['visual user objects', ['userobject']],
    ['user objects used as tab pages', ['userobject']],
    ['web activex', []],
    ['datawindow web activex', []],
    ['client control', []],
    ['server component', []],
    ['window control', ['window']],
    ['window object', ['window']],
    ['menu object', ['menu']],
    ['application object', ['application']],
    ['nonvisualobject object', ['nonvisualobject']],
    ['ole control', ['olecontrol']],
    ['ole controls', ['olecontrol']],
    ['ole custom control', ['olecustomcontrol']],
    ['ole custom controls', ['olecustomcontrol']],
    ['ole dwobject', ['oledwobject']],
    ['ole dwobjects', ['oledwobject']],
]);

const SKIP_APPLIES_TO_LABELS = new Set([
    '',
    'argument',
    'description',
    'datawindow type',
    'method applies to',
    'powerbuilder',
    'web',
]);

const KNOWN_NON_FUNCTION_TITLES = [
    /^syntax\s+\d+$/i,
    /^syntax$/i,
    /^methods for /i,
    /^alphabetical list /i,
    /^appendix/i,
];

const OFFICIAL_STANDARD_DATATYPE_CELL_TO_NAME = new Map([
    ['blob', 'Blob'],
    ['boolean', 'Boolean'],
    ['byte', 'Byte'],
    ['char or character', 'Char'],
    ['date', 'Date'],
    ['datetime', 'DateTime'],
    ['decimal or dec', 'Decimal'],
    ['double', 'Double'],
    ['integer or int', 'Integer'],
    ['long', 'Long'],
    ['longlong', 'LongLong'],
    ['longptr', 'LongPtr'],
    ['real', 'Real'],
    ['string', 'String'],
    ['time', 'Time'],
    ['unsignedinteger, unsignedint, or uint', 'UnsignedInteger'],
    ['unsignedlong or ulong', 'UnsignedLong'],
]);

const OFFICIAL_SYSTEM_OBJECT_LABEL_BLACKLIST = new Set(['Home', 'Next', 'Prev', 'Sidebar', 'Up']);
const DATAWINDOW_CONSTANT_SECTION_BLACKLIST = new Set([
    'about datawindow constants',
    'alphabetical list of datawindow constants',
    'datawindow constants',
]);
const OBJECTS_AND_CONTROLS_ENUM_PROPERTY_TARGETS = [
    'AccessibleRole',
    'Alignment',
    'BorderStyle',
    'FillPattern',
    'FontCharSet',
    'FontFamily',
    'FontPitch',
    'GraphType',
    'HighDPIMode',
    'SecureProtocol',
    'TextCase',
    'ToolbarAlignment',
    'ToolbarStyle',
    'WindowState',
    'WindowType',
];

module.exports = {
    POWERSCRIPT_BASE_URL,
    POWERSCRIPT_INDEX_URL,
    POWERSCRIPT_RESERVED_WORDS_URL,
    POWERSCRIPT_STATEMENTS_URL,
    POWERSCRIPT_ENUMERATED_DATATYPES_URL,
    POWERSCRIPT_STANDARD_DATATYPES_URL,
    POWERSCRIPT_EVENTS_URL,
    OBJECTS_AND_CONTROLS_BASE_URL,
    OBJECTS_AND_CONTROLS_INDEX_URL,
    OBJECTS_AND_CONTROLS_PROPERTIES_URL,
    OBJECTS_AND_CONTROLS_UNDOCUMENTED_BASE_CLASSES_URL,
    DATAWINDOW_BASE_URL,
    DATAWINDOW_INDEX_URL,
    DATAWINDOW_EXPRESSION_FUNCTIONS_URL,
    DATAWINDOW_OBJECT_PROPERTIES_URL,
    DATAWINDOW_CONTROL_METHODS_URL,
    DATAWINDOW_EVENTS_URL,
    DATAWINDOW_CONSTANTS_CHAPTER_URL,
    DATAWINDOW_OWNER_TYPES,
    NON_CONTROL_OBJECT_OWNER_TYPES,
    SPECIAL_OWNER_SCOPE_ANY_OBJECT,
    SPECIAL_OWNER_SCOPE_ALL_CONTROLS,
    SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_APPLICATION,
    SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_MENU,
    SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_DATAWINDOWCHILD,
    SPECIAL_OWNER_SCOPE_ALL_CONTROLS_EXCEPT_DRAWING,
    DRAWING_CONTROL_OWNER_TYPES,
    OFFICIAL_GENERATED_KEYWORD_CATEGORY_OVERRIDES,
    OFFICIAL_LITERAL_RESERVED_WORDS,
    OFFICIAL_LOGICAL_RESERVED_WORDS,
    APPLY_TO_OWNER_TYPE_OVERRIDES,
    SKIP_APPLIES_TO_LABELS,
    KNOWN_NON_FUNCTION_TITLES,
    OFFICIAL_STANDARD_DATATYPE_CELL_TO_NAME,
    OFFICIAL_SYSTEM_OBJECT_LABEL_BLACKLIST,
    DATAWINDOW_CONSTANT_SECTION_BLACKLIST,
    OBJECTS_AND_CONTROLS_ENUM_PROPERTY_TARGETS,
};
