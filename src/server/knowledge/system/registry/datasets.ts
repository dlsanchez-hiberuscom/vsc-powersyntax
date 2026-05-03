import {
    PB_GENERATED_DATAWINDOW_FUNCTIONS,
    PB_GENERATED_EVENTS,
    PB_GENERATED_GLOBAL_FUNCTIONS,
    PB_GENERATED_OBJECT_FUNCTIONS,
    PB_GENERATED_STATEMENTS,
} from '../generated/generated.generated';
import {
    PB_GENERATED_DATAWINDOW_FUNCTION_OWNER_TYPES,
    PB_GENERATED_OBJECT_OWNER_TYPES,
} from '../generated/common';
import {
    PB_MANUAL_CORE_DATAWINDOW_EVENTS,
    PB_MANUAL_CORE_DATAWINDOW_EVENT_CATEGORIES,
    PB_MANUAL_CORE_DATAWINDOW_FUNCTIONS,
    PB_MANUAL_CORE_DATAWINDOW_FUNCTION_CATEGORIES,
    PB_MANUAL_CORE_GLOBAL_FUNCTIONS,
    PB_MANUAL_CORE_GLOBAL_FUNCTION_CATEGORIES,
    PB_MANUAL_CORE_OBJECT_FUNCTIONS,
    PB_MANUAL_CORE_OBJECT_FUNCTION_CATEGORIES,
    PB_MANUAL_CORE_STATEMENTS,
    PB_MANUAL_CORE_STATEMENT_CATEGORIES,
    PB_MANUAL_CORE_SYSTEM_EVENTS,
    PB_MANUAL_CORE_SYSTEM_EVENT_CATEGORIES,
    // -- Catalog v2: language constructs --
    PB_MANUAL_CORE_KEYWORDS,
    PB_MANUAL_CORE_KEYWORD_CATEGORIES,
    PB_MANUAL_CORE_RESERVED_WORDS,
    PB_MANUAL_CORE_RESERVED_WORD_CATEGORIES,
    PB_MANUAL_CORE_DATATYPES,
    PB_MANUAL_CORE_DATATYPE_CATEGORIES,
    PB_MANUAL_CORE_SYSTEM_OBJECT_DATATYPES,
    PB_MANUAL_CORE_SYSTEM_OBJECT_DATATYPE_CATEGORIES,
    PB_MANUAL_CORE_PRONOUNS,
    PB_MANUAL_CORE_PRONOUN_CATEGORIES,
    PB_MANUAL_CORE_OPERATORS,
    PB_MANUAL_CORE_OPERATOR_CATEGORIES,
    PB_MANUAL_CORE_SYSTEM_GLOBALS,
    PB_MANUAL_CORE_SYSTEM_GLOBAL_CATEGORIES,
    PB_MANUAL_CORE_ENUMERATED_VALUES,
    PB_MANUAL_CORE_ENUMERATED_VALUE_CATEGORIES,
} from '../manual';
import {
    PB_MANUAL_CORE_DATAWINDOW_EVENT_OWNER_TYPES,
    PB_MANUAL_CORE_DATAWINDOW_FUNCTION_OWNER_TYPES,
    PB_MANUAL_CORE_OBJECT_OWNER_TYPES,
} from '../manual/common';
import { PbSystemSymbolDatasetSlice } from '../types';

export const PB_SYSTEM_SYMBOL_DATASET_SLICES: readonly PbSystemSymbolDatasetSlice[] = [
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
        allowedOwnerTypes: PB_MANUAL_CORE_OBJECT_OWNER_TYPES,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'datawindow-functions',
        entries: PB_MANUAL_CORE_DATAWINDOW_FUNCTIONS,
        allowedCategories: PB_MANUAL_CORE_DATAWINDOW_FUNCTION_CATEGORIES,
        allowedOwnerTypes: PB_MANUAL_CORE_DATAWINDOW_FUNCTION_OWNER_TYPES,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'system-events',
        entries: PB_MANUAL_CORE_SYSTEM_EVENTS,
        allowedCategories: PB_MANUAL_CORE_SYSTEM_EVENT_CATEGORIES,
        allowedOwnerTypes: PB_MANUAL_CORE_OBJECT_OWNER_TYPES,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'datawindow-events',
        entries: PB_MANUAL_CORE_DATAWINDOW_EVENTS,
        allowedCategories: PB_MANUAL_CORE_DATAWINDOW_EVENT_CATEGORIES,
        allowedOwnerTypes: PB_MANUAL_CORE_DATAWINDOW_EVENT_OWNER_TYPES,
        requireSourceUrl: true,
    },
    {
        dataset: 'manual-core',
        domain: 'statements',
        entries: PB_MANUAL_CORE_STATEMENTS,
        allowedCategories: PB_MANUAL_CORE_STATEMENT_CATEGORIES,
        requireSourceUrl: true,
    },
    // -- Catalog v2: language construct slices --
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
        domain: 'enumerated-values',
        entries: PB_MANUAL_CORE_ENUMERATED_VALUES,
        allowedCategories: PB_MANUAL_CORE_ENUMERATED_VALUE_CATEGORIES,
    },
    // -- Generated (existing, unchanged) --
    {
        dataset: 'generated',
        domain: 'global-functions',
        entries: PB_GENERATED_GLOBAL_FUNCTIONS,
    },
    {
        dataset: 'generated',
        domain: 'object-functions',
        entries: PB_GENERATED_OBJECT_FUNCTIONS,
        allowedOwnerTypes: PB_GENERATED_OBJECT_OWNER_TYPES,
    },
    {
        dataset: 'generated',
        domain: 'datawindow-functions',
        entries: PB_GENERATED_DATAWINDOW_FUNCTIONS,
        allowedOwnerTypes: PB_GENERATED_DATAWINDOW_FUNCTION_OWNER_TYPES,
    },
    {
        dataset: 'generated',
        domain: 'system-events',
        entries: PB_GENERATED_EVENTS,
        allowedOwnerTypes: PB_GENERATED_OBJECT_OWNER_TYPES,
    },
    {
        dataset: 'generated',
        domain: 'statements',
        entries: PB_GENERATED_STATEMENTS,
    },
];

export const PB_SYSTEM_SYMBOL_ALLOWED_EVENT_OWNER_TYPES = {
    object: PB_MANUAL_CORE_OBJECT_OWNER_TYPES,
    datawindow: PB_MANUAL_CORE_DATAWINDOW_EVENT_OWNER_TYPES,
} as const;
