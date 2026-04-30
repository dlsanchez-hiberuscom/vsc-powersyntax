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
