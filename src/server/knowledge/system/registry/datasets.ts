import {
    PB_GENERATED_DATAWINDOW_FUNCTIONS,
    PB_GENERATED_DATATYPES,
    PB_GENERATED_EVENTS,
    PB_GENERATED_GLOBAL_FUNCTIONS,
    PB_GENERATED_KEYWORDS,
    PB_GENERATED_OBJECT_FUNCTIONS,
    PB_GENERATED_RESERVED_WORDS,
    PB_GENERATED_SYSTEM_OBJECT_DATATYPES,
    PB_GENERATED_STATEMENTS,
} from '../generated/generated.generated';
import { PB_GENERATED_ENUMERATED_TYPES } from '../generated/enumeratedTypes.generated';
import { PB_GENERATED_ENUMERATED_VALUES } from '../generated/enumeratedValues.generated';
import { PB_GENERATED_DATAWINDOW_CONSTANTS } from '../generated/dataWindowConstants.generated';
import {
    PB_GENERATED_DATAWINDOW_FUNCTION_OWNER_TYPES,
    PB_GENERATED_OBJECT_OWNER_TYPES,
} from '../generated/common';
import {
    PB_MANUAL_CORE_DATASET_SLICES,
    PB_MANUAL_CORE_OWNER_TYPE_GROUPS,
} from '../manual';
import { PbSystemSymbolDatasetSlice } from '../types';

export const PB_SYSTEM_SYMBOL_DATASET_SLICES: readonly PbSystemSymbolDatasetSlice[] = [
    ...PB_MANUAL_CORE_DATASET_SLICES,
    // -- Generated (existing, unchanged) --
    {
        dataset: 'generated',
        domain: 'keywords',
        entries: PB_GENERATED_KEYWORDS,
    },
    {
        dataset: 'generated',
        domain: 'reserved-words',
        entries: PB_GENERATED_RESERVED_WORDS,
    },
    {
        dataset: 'generated',
        domain: 'datatypes',
        entries: PB_GENERATED_DATATYPES,
    },
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
        domain: 'enumerated-types',
        entries: PB_GENERATED_ENUMERATED_TYPES,
    },
    {
        dataset: 'generated',
        domain: 'enumerated-values',
        entries: PB_GENERATED_ENUMERATED_VALUES,
    },
    {
        dataset: 'generated',
        domain: 'datawindow-constants',
        entries: PB_GENERATED_DATAWINDOW_CONSTANTS,
    },
    {
        dataset: 'generated',
        domain: 'system-object-datatypes',
        entries: PB_GENERATED_SYSTEM_OBJECT_DATATYPES,
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
    object: PB_MANUAL_CORE_OWNER_TYPE_GROUPS.object,
    datawindow: PB_MANUAL_CORE_OWNER_TYPE_GROUPS.dataWindowEvent,
} as const;
