import { PbSystemSymbolDatasetSlice, PbSystemSymbolEntry } from '../types';
import {
    PB_MANUAL_CORE_DATAWINDOW_EXPRESSION_FUNCTIONS,
    PB_MANUAL_CORE_DATAWINDOW_EXPRESSION_FUNCTION_CATEGORIES,
    PB_MANUAL_CORE_DATAWINDOW_EVENTS,
    PB_MANUAL_CORE_DATAWINDOW_EVENT_CATEGORIES,
    PB_MANUAL_CORE_DATAWINDOW_FUNCTIONS,
    PB_MANUAL_CORE_DATAWINDOW_FUNCTION_CATEGORIES,
    PB_MANUAL_CORE_DATAWINDOW_PROPERTIES,
    PB_MANUAL_CORE_DATAWINDOW_PROPERTY_CATEGORIES,
} from './datawindow';
import {
    PB_MANUAL_CORE_DATATYPES,
    PB_MANUAL_CORE_DATATYPE_CATEGORIES,
    PB_MANUAL_CORE_ENUMERATED_TYPES,
    PB_MANUAL_CORE_ENUMERATED_TYPE_CATEGORIES,
    PB_MANUAL_CORE_ENUMERATED_VALUES,
    PB_MANUAL_CORE_ENUMERATED_VALUE_CATEGORIES,
    PB_MANUAL_CORE_KEYWORDS,
    PB_MANUAL_CORE_KEYWORD_CATEGORIES,
    PB_MANUAL_CORE_OPERATORS,
    PB_MANUAL_CORE_OPERATOR_CATEGORIES,
    PB_MANUAL_CORE_PRONOUNS,
    PB_MANUAL_CORE_PRONOUN_CATEGORIES,
    PB_MANUAL_CORE_RESERVED_WORDS,
    PB_MANUAL_CORE_RESERVED_WORD_CATEGORIES,
    PB_MANUAL_CORE_STATEMENTS,
    PB_MANUAL_CORE_STATEMENT_CATEGORIES,
} from './language';
import {
    PB_MANUAL_CORE_GLOBAL_FUNCTIONS,
    PB_MANUAL_CORE_GLOBAL_FUNCTION_CATEGORIES,
    PB_MANUAL_CORE_OBJECT_FUNCTIONS,
    PB_MANUAL_CORE_OBJECT_FUNCTION_CATEGORIES,
    PB_MANUAL_CORE_SYSTEM_EVENTS,
    PB_MANUAL_CORE_SYSTEM_EVENT_CATEGORIES,
} from './core';
import { PB_MANUAL_CORE_OWNER_TYPE_GROUPS } from './ownerTypes';
import {
    PB_MANUAL_CORE_VISUAL_SYSTEM_OBJECT_DATATYPES,
    PB_MANUAL_CORE_VISUAL_SYSTEM_OBJECT_DATATYPE_CATEGORIES,
} from './visual';
import {
    PB_MANUAL_CORE_INTEGRATION_SYSTEM_OBJECT_DATATYPES,
    PB_MANUAL_CORE_INTEGRATION_SYSTEM_OBJECT_DATATYPE_CATEGORIES,
} from './integration';
import {
    PB_MANUAL_CORE_SYSTEM_GLOBALS,
    PB_MANUAL_CORE_SYSTEM_GLOBAL_CATEGORIES,
    PB_MANUAL_CORE_RUNTIME_SYSTEM_OBJECT_DATATYPES,
    PB_MANUAL_CORE_RUNTIME_SYSTEM_OBJECT_DATATYPE_CATEGORIES,
} from './runtime';

export * from './sources';
export * from './ownerTypes';
export * from './language';
export * from './visual';
export * from './runtime';
export * from './integration';
export * from './datawindow';
export * from './core';

export const PB_MANUAL_CORE_SYSTEM_OBJECT_DATATYPES: readonly PbSystemSymbolEntry[] = [
    ...PB_MANUAL_CORE_VISUAL_SYSTEM_OBJECT_DATATYPES,
    ...PB_MANUAL_CORE_RUNTIME_SYSTEM_OBJECT_DATATYPES,
    ...PB_MANUAL_CORE_INTEGRATION_SYSTEM_OBJECT_DATATYPES,
];

export const PB_MANUAL_CORE_SYSTEM_OBJECT_DATATYPE_CATEGORIES: readonly string[] = [
    ...PB_MANUAL_CORE_VISUAL_SYSTEM_OBJECT_DATATYPE_CATEGORIES,
    ...PB_MANUAL_CORE_RUNTIME_SYSTEM_OBJECT_DATATYPE_CATEGORIES,
    ...PB_MANUAL_CORE_INTEGRATION_SYSTEM_OBJECT_DATATYPE_CATEGORIES,
];

export const PB_MANUAL_CORE_DATASET_SLICES: readonly PbSystemSymbolDatasetSlice[] = [
    {
        dataset: 'manual-core',
        domain: 'global-functions',
        entries: PB_MANUAL_CORE_GLOBAL_FUNCTIONS,
        allowedCategories: PB_MANUAL_CORE_GLOBAL_FUNCTION_CATEGORIES,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'object-functions',
        entries: PB_MANUAL_CORE_OBJECT_FUNCTIONS,
        allowedCategories: PB_MANUAL_CORE_OBJECT_FUNCTION_CATEGORIES,
        allowedOwnerTypes: PB_MANUAL_CORE_OWNER_TYPE_GROUPS.object,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'datawindow-functions',
        entries: PB_MANUAL_CORE_DATAWINDOW_FUNCTIONS,
        allowedCategories: PB_MANUAL_CORE_DATAWINDOW_FUNCTION_CATEGORIES,
        allowedOwnerTypes: PB_MANUAL_CORE_OWNER_TYPE_GROUPS.dataWindowFunction,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'system-events',
        entries: PB_MANUAL_CORE_SYSTEM_EVENTS,
        allowedCategories: PB_MANUAL_CORE_SYSTEM_EVENT_CATEGORIES,
        allowedOwnerTypes: PB_MANUAL_CORE_OWNER_TYPE_GROUPS.object,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'datawindow-events',
        entries: PB_MANUAL_CORE_DATAWINDOW_EVENTS,
        allowedCategories: PB_MANUAL_CORE_DATAWINDOW_EVENT_CATEGORIES,
        allowedOwnerTypes: PB_MANUAL_CORE_OWNER_TYPE_GROUPS.dataWindowEvent,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'datawindow-expression-functions',
        entries: PB_MANUAL_CORE_DATAWINDOW_EXPRESSION_FUNCTIONS,
        allowedCategories: PB_MANUAL_CORE_DATAWINDOW_EXPRESSION_FUNCTION_CATEGORIES,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'datawindow-properties',
        entries: PB_MANUAL_CORE_DATAWINDOW_PROPERTIES,
        allowedCategories: PB_MANUAL_CORE_DATAWINDOW_PROPERTY_CATEGORIES,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'statements',
        entries: PB_MANUAL_CORE_STATEMENTS,
        allowedCategories: PB_MANUAL_CORE_STATEMENT_CATEGORIES,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'keywords',
        entries: PB_MANUAL_CORE_KEYWORDS,
        allowedCategories: PB_MANUAL_CORE_KEYWORD_CATEGORIES,
    },
    {
        dataset: 'manual-core',
        domain: 'reserved-words',
        entries: PB_MANUAL_CORE_RESERVED_WORDS,
        allowedCategories: PB_MANUAL_CORE_RESERVED_WORD_CATEGORIES,
    },
    {
        dataset: 'manual-core',
        domain: 'datatypes',
        entries: PB_MANUAL_CORE_DATATYPES,
        allowedCategories: PB_MANUAL_CORE_DATATYPE_CATEGORIES,
    },
    {
        dataset: 'manual-core',
        domain: 'system-object-datatypes',
        entries: PB_MANUAL_CORE_SYSTEM_OBJECT_DATATYPES,
        allowedCategories: PB_MANUAL_CORE_SYSTEM_OBJECT_DATATYPE_CATEGORIES,
    },
    {
        dataset: 'manual-core',
        domain: 'pronouns',
        entries: PB_MANUAL_CORE_PRONOUNS,
        allowedCategories: PB_MANUAL_CORE_PRONOUN_CATEGORIES,
    },
    {
        dataset: 'manual-core',
        domain: 'operators',
        entries: PB_MANUAL_CORE_OPERATORS,
        allowedCategories: PB_MANUAL_CORE_OPERATOR_CATEGORIES,
    },
    {
        dataset: 'manual-core',
        domain: 'system-globals',
        entries: PB_MANUAL_CORE_SYSTEM_GLOBALS,
        allowedCategories: PB_MANUAL_CORE_SYSTEM_GLOBAL_CATEGORIES,
    },
    {
        dataset: 'manual-core',
        domain: 'enumerated-types',
        entries: PB_MANUAL_CORE_ENUMERATED_TYPES,
        allowedCategories: PB_MANUAL_CORE_ENUMERATED_TYPE_CATEGORIES,
    },
    {
        dataset: 'manual-core',
        domain: 'enumerated-values',
        entries: PB_MANUAL_CORE_ENUMERATED_VALUES,
        allowedCategories: PB_MANUAL_CORE_ENUMERATED_VALUE_CATEGORIES,
    },
];
