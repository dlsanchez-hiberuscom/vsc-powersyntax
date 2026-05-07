import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración JSON.
 */
export const jsonLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'JSONParser' },
        text: {
            summary: 'Parser JSON no visual para leer y navegar payloads JSON.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'JSONGenerator' },
        text: {
            summary: 'Generador JSON no visual para construir payloads serializados.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'JSONPackage' },
        text: {
            summary: 'Contenedor JSON no visual para empaquetar estructuras JSON.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'LoadString', ownerTypes: ['jsonparser', 'jsonpackage'] },
        text: {
            summary: 'Carga una cadena JSON en el objeto.',
            documentation: 'Analiza la cadena JSON proporcionada y la carga en memoria para su procesamiento.',
            returnDocumentation: 'String. Devuelve una cadena vacía si tiene éxito y el error si falla.',
            usageNotes: [
                'La cadena debe tener un formato JSON válido.',
                'Para objetos grandes, considere cargar desde un archivo para mejor rendimiento.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.LoadString ( json )', parameterName: 'json', documentation: 'La cadena con formato JSON.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetItemString', ownerTypes: ['jsonparser', 'jsonpackage'] },
        text: {
            summary: 'Obtiene un valor de cadena de un ítem JSON.',
            returnDocumentation: 'String. El valor del ítem.',
            usageNotes: [
                'Si el ítem no es de tipo cadena, la función intentará convertirlo o devolverá nulo.',
                'Puede usar rutas de ítems para acceder a elementos anidados.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.GetItemString ( ParentItemHandle, Key )', parameterName: 'Key', documentation: 'La clave del ítem.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetItemNumber', ownerTypes: ['jsonparser', 'jsonpackage'] },
        text: {
            summary: 'Obtiene un valor numérico de un ítem JSON.',
            returnDocumentation: 'Double. El valor numérico del ítem.',
            usageNotes: [
                'Devuelve 0 si el ítem no se encuentra o no es un número.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.GetItemNumber ( ParentItemHandle, Key )', parameterName: 'Key', documentation: 'La clave del ítem.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetJsonString', ownerTypes: ['jsongenerator', 'jsonpackage'] },
        text: {
            summary: 'Obtiene el contenido JSON generado como cadena.',
            returnDocumentation: 'String. El JSON resultante.',
            usageNotes: [
                'Útil para depuración o para enviar el JSON a un servicio web.'
            ]
        }
    },
];
