import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración JSON.
 */
export const jsonLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'JSONParser' },
        text: {
            summary: 'Parser JSON no visual para leer y navegar payloads JSON.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'JSONGenerator' },
        text: {
            summary: 'Generador JSON no visual para construir payloads serializados.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'JSONPackage' },
        text: {
            summary: 'Contenedor JSON no visual para empaquetar estructuras JSON.',
        },
    },
];
