import { finalizeSystemSymbolEntry } from '../normalization';
import {
    PbSystemSymbolEntry,
    PbSystemSymbolEntryDraft,
    PbSystemSymbolSignature,
} from '../types';

const POWERSCRIPT_REFERENCE = 'Appeon PowerScript Reference 2025';
const POWERSCRIPT_REFERENCE_URL = 'https://docs.appeon.com/pb2025/powerscript_reference/index.html';
const OBJECTS_AND_CONTROLS_REFERENCE = 'Appeon Objects and Controls 2025';
const OBJECTS_AND_CONTROLS_REFERENCE_URL = 'https://docs.appeon.com/pb2025/objects_and_controls/index.html';
const DATAWINDOW_REFERENCE = 'Appeon DataWindow Reference 2025';
const DATAWINDOW_REFERENCE_URL = 'https://docs.appeon.com/pb2025/datawindow_reference/index.html';

const FOCUSABLE_OBJECT_TYPES = [
    'commandbutton',
    'singlelineedit',
    'checkbox',
    'radiobutton',
    'dropdownlistbox',
    'editmask',
    'multilineedit',
    'picturebutton',
    'tab',
    'treeview',
    'listview',
    'listbox',
];

const VISUAL_OBJECT_TYPES = [
    'window',
    'commandbutton',
    'singlelineedit',
    'statictext',
    'checkbox',
    'radiobutton',
    'dropdownlistbox',
    'editmask',
    'multilineedit',
    'picturebutton',
    'picture',
    'groupbox',
    'tab',
    'treeview',
    'listview',
    'listbox',
    'graph',
    'line',
    'rectangle',
    'roundrectangle',
    'oval',
];

const TEXT_OBJECT_TYPES = [
    'singlelineedit',
    'statictext',
    'editmask',
    'multilineedit',
];

const INPUT_OBJECT_TYPES = [
    'singlelineedit',
    'editmask',
    'multilineedit',
    'dropdownlistbox',
    'listbox',
];

const EVENT_CAPABLE_OBJECT_TYPES = [
    'application',
    'window',
    'menu',
    'nonvisualobject',
    'commandbutton',
    'singlelineedit',
    'statictext',
    'checkbox',
    'radiobutton',
    'dropdownlistbox',
    'editmask',
    'multilineedit',
    'picturebutton',
    'picture',
    'groupbox',
    'tab',
    'treeview',
    'listview',
    'listbox',
    'graph',
    'line',
    'rectangle',
    'roundrectangle',
    'oval',
    'datawindow',
];

const REDRAWABLE_OBJECT_TYPES = [
    'window',
    'tab',
    'treeview',
    'listview',
    'graph',
];

export const PB_MANUAL_CORE_DATAWINDOW_FUNCTION_OWNER_TYPES = [
    'datawindow',
    'datawindowchild',
    'datastore',
];

export const PB_MANUAL_CORE_DATAWINDOW_FUNCTION_APPLIES_TO = [
    'DataWindow control',
    'DataWindowChild object',
    'DataStore object',
];

export const PB_MANUAL_CORE_DATAWINDOW_CONTROL_OWNER_TYPES = ['datawindow'];
export const PB_MANUAL_CORE_DATAWINDOW_CONTROL_APPLIES_TO = ['DataWindow control'];

export const PB_MANUAL_CORE_DATAWINDOW_SCROLL_OWNER_TYPES = [
    'datawindow',
    'datawindowchild',
];

export const PB_MANUAL_CORE_DATAWINDOW_SCROLL_APPLIES_TO = [
    'DataWindow control',
    'DataWindowChild object',
];

export const PB_MANUAL_CORE_DATAWINDOW_VISUAL_OWNER_TYPES = [
    'datawindow',
    'datawindowchild',
];

export const PB_MANUAL_CORE_DATAWINDOW_VISUAL_APPLIES_TO = [
    'DataWindow control',
    'DataWindowChild object',
];

export const PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_OWNER_TYPES = [
    'datawindow',
    'datastore',
];

export const PB_MANUAL_CORE_DATAWINDOW_DATA_EVENT_APPLIES_TO = [
    'DataWindow control',
    'DataStore object',
];

export const PB_MANUAL_CORE_DATAWINDOW_EVENT_OWNER_TYPES = ['datawindow', 'datastore'];

export const PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_OWNER_TYPES = ['datawindow'];
export const PB_MANUAL_CORE_DATAWINDOW_CONTROL_EVENT_APPLIES_TO = ['DataWindow control'];

function mergeUniqueValues(...valueGroups: readonly (readonly string[])[]): string[] {
    const values = new Set<string>();

    for (const valueGroup of valueGroups) {
        for (const value of valueGroup) {
            values.add(value);
        }
    }

    return Array.from(values);
}

export const PB_MANUAL_CORE_OBJECT_OWNER_TYPES = mergeUniqueValues(
    FOCUSABLE_OBJECT_TYPES,
    VISUAL_OBJECT_TYPES,
    TEXT_OBJECT_TYPES,
    INPUT_OBJECT_TYPES,
    EVENT_CAPABLE_OBJECT_TYPES,
    REDRAWABLE_OBJECT_TYPES,
);

type ManualSymbolArgs = {
    name: string;
    category: string;
    summary: string;
    signatures: readonly PbSystemSymbolSignature[];
    appliesTo?: readonly string[];
    ownerTypes?: readonly string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    lookupAliases?: readonly string[];
    sourceUrl?: string;
};

function defineManualEntry(
    entry: Omit<PbSystemSymbolEntryDraft, 'dataset' | 'source'>,
    source: string,
    defaultSourceUrl: string,
): PbSystemSymbolEntry {
    return finalizeSystemSymbolEntry({
        ...entry,
        dataset: 'manual-core',
        source,
        sourceUrl: entry.sourceUrl ?? defaultSourceUrl,
    });
}

export function globalFunction(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'callable',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'global-functions',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function objectFunction(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'callable',
        namespace: 'object',
        invocation: 'member',
        domain: 'object-functions',
    }, OBJECTS_AND_CONTROLS_REFERENCE, OBJECTS_AND_CONTROLS_REFERENCE_URL);
}

export function dataWindowFunction(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'callable',
        namespace: 'datawindow',
        invocation: 'member',
        domain: 'datawindow-functions',
    }, DATAWINDOW_REFERENCE, DATAWINDOW_REFERENCE_URL);
}

export function systemEvent(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'event',
        namespace: 'object',
        invocation: 'member',
        domain: 'system-events',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function dataWindowEvent(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'event',
        namespace: 'datawindow',
        invocation: 'member',
        domain: 'datawindow-events',
    }, DATAWINDOW_REFERENCE, DATAWINDOW_REFERENCE_URL);
}

export function statement(args: Omit<ManualSymbolArgs, 'ownerTypes'>): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'statement',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'statements',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export const PB_MANUAL_CORE_OBJECT_FUNCTION_OWNER_TYPES = mergeUniqueValues(
    FOCUSABLE_OBJECT_TYPES,
    VISUAL_OBJECT_TYPES,
    TEXT_OBJECT_TYPES,
    INPUT_OBJECT_TYPES,
    EVENT_CAPABLE_OBJECT_TYPES,
    REDRAWABLE_OBJECT_TYPES,
);

export {
    EVENT_CAPABLE_OBJECT_TYPES,
    FOCUSABLE_OBJECT_TYPES,
    INPUT_OBJECT_TYPES,
    REDRAWABLE_OBJECT_TYPES,
    TEXT_OBJECT_TYPES,
    VISUAL_OBJECT_TYPES,
};
