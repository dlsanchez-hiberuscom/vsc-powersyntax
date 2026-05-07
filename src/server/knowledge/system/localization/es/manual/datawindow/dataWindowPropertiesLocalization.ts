import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para propiedades de DataWindow.
 */
export const dataWindowPropertiesLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-properties', kind: 'property', namespace: 'datawindow', invocation: 'member', name: 'DataWindow' },
        text: {
            summary: 'Namespace raíz de propiedades describe/modify para el DataWindow enlazado.',
            documentation: 'Permite acceder a los atributos de configuración global del objeto DataWindow.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-properties', kind: 'property', namespace: 'datawindow', invocation: 'member', name: 'DataWindow.Syntax' },
        text: {
            summary: 'Sintaxis serializada completa del DataWindow enlazado.',
            documentation: 'Devuelve o establece la definición interna del DataWindow en formato texto.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-properties', kind: 'property', namespace: 'datawindow', invocation: 'member', name: 'DataWindow.DataObject' },
        text: {
            summary: 'Nombre del DataObject actualmente enlazado al control o DataStore.',
            documentation: 'Contiene el nombre del objeto DataWindow almacenado en la librería (PBL).',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-properties', kind: 'property', namespace: 'datawindow', invocation: 'member', name: 'DataWindow.Table' },
        text: {
            summary: 'Namespace de metadatos de tabla y retrieval del DataWindow enlazado.',
            documentation: 'Accede a la configuración de la base de datos y la sentencia SELECT.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-properties', kind: 'property', namespace: 'datawindow', invocation: 'member', name: 'DataWindow.Table.Select' },
        text: {
            summary: 'Sentencia SQL de retrieval resuelta para el DataWindow enlazado.',
            documentation: 'Contiene la sentencia SELECT que se ejecutará al llamar a Retrieve.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-properties', kind: 'property', namespace: 'datawindow', invocation: 'member', name: 'dddw' },
        text: {
            summary: 'Namespace de metadatos del DropDownDataWindow asociado a una columna.',
            documentation: 'Permite configurar dinámicamente el comportamiento del DropDown child.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'datawindow-properties', kind: 'property', namespace: 'datawindow', invocation: 'member', name: 'dddw.name' },
        text: {
            summary: 'Nombre del DataWindow hijo asociado a la columna mediante dddw.name.',
            documentation: 'Especifica el DataObject que se utilizará como DropDownDataWindow.',
        },
    },
];
