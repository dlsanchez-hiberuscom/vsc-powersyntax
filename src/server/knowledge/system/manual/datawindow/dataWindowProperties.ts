import { PbSystemSymbolEntry } from '../../types';
import { dataWindowProperty } from '../common';

export const PB_MANUAL_CORE_DATAWINDOW_PROPERTY_CATEGORIES = [
    'Metadata',
    'SQL',
    'Dropdown',
] as const;

type DataWindowPropertyCategory = (typeof PB_MANUAL_CORE_DATAWINDOW_PROPERTY_CATEGORIES)[number];

type DataWindowPropertyDescriptor = {
    name: string;
    category: DataWindowPropertyCategory;
    summary: string;
    signature: string;
};

function defineDataWindowPropertyEntries(
    descriptors: readonly DataWindowPropertyDescriptor[],
): readonly PbSystemSymbolEntry[] {
    return descriptors.map(descriptor => dataWindowProperty({
        name: descriptor.name,
        category: descriptor.category,
        summary: descriptor.summary,
        signatures: [{ label: descriptor.signature }],
        manualOverlay: {
            mode: 'override',
            reason: 'Enforces curated documentation for core DataWindow properties.',
            evidence: [`manual-core:datawindow-properties:property:datawindow:member:${descriptor.name.toLowerCase()}`],
        },
    }));
}

export const PB_MANUAL_CORE_DATAWINDOW_PROPERTIES = defineDataWindowPropertyEntries([
    {
        name: 'DataWindow',
        category: 'Metadata',
        summary: 'Root namespace for describe/modify properties of the bound DataWindow.',
        signature: 'DataWindow',
    },
    {
        name: 'DataWindow.Syntax',
        category: 'Metadata',
        summary: 'Complete serialized syntax of the bound DataWindow.',
        signature: 'DataWindow.Syntax',
    },
    {
        name: 'DataWindow.DataObject',
        category: 'Metadata',
        summary: 'Name of the DataObject currently bound to the control or DataStore.',
        signature: 'DataWindow.DataObject',
    },
    {
        name: 'DataWindow.Table',
        category: 'SQL',
        summary: 'Table and retrieval metadata namespace of the bound DataWindow.',
        signature: 'DataWindow.Table',
    },
    {
        name: 'DataWindow.Table.Select',
        category: 'SQL',
        summary: 'Resolved SQL retrieval statement for the bound DataWindow.',
        signature: 'DataWindow.Table.Select',
    },
    {
        name: 'dddw',
        category: 'Dropdown',
        summary: 'Metadata namespace of the DropDownDataWindow associated with a column.',
        signature: 'dddw',
    },
    {
        name: 'dddw.name',
        category: 'Dropdown',
        summary: 'Name of the child DataWindow associated with the column via dddw.name.',
        signature: 'dddw.name',
    },
]);