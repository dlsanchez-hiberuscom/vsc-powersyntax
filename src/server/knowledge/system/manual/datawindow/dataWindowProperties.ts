import { PbSystemSymbolEntry } from '../../types';
import { dataWindowProperty } from '../common';

export const PB_MANUAL_CORE_DATAWINDOW_PROPERTY_CATEGORIES = [
    'Metadatos',
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
    }));
}

export const PB_MANUAL_CORE_DATAWINDOW_PROPERTIES = defineDataWindowPropertyEntries([
    {
        name: 'DataWindow',
        category: 'Metadatos',
        summary: 'Namespace raiz de propiedades describe/modify para el DataWindow enlazado.',
        signature: 'DataWindow',
    },
    {
        name: 'DataWindow.DataObject',
        category: 'Metadatos',
        summary: 'Nombre del DataObject actualmente enlazado al control o DataStore.',
        signature: 'DataWindow.DataObject',
    },
    {
        name: 'DataWindow.Table',
        category: 'SQL',
        summary: 'Namespace de metadatos de tabla y retrieval del DataWindow enlazado.',
        signature: 'DataWindow.Table',
    },
    {
        name: 'DataWindow.Table.Select',
        category: 'SQL',
        summary: 'Sentencia SQL de retrieval resuelta para el DataWindow enlazado.',
        signature: 'DataWindow.Table.Select',
    },
    {
        name: 'dddw',
        category: 'Dropdown',
        summary: 'Namespace de metadatos del DropDownDataWindow asociado a una columna.',
        signature: 'dddw',
    },
    {
        name: 'dddw.name',
        category: 'Dropdown',
        summary: 'Nombre del DataWindow hijo asociado a la columna mediante dddw.name.',
        signature: 'dddw.name',
    },
]);