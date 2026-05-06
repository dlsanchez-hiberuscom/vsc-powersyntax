import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración REST.
 */
export const restLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'RESTClient' },
        text: {
            summary: 'Cliente REST no visual.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'WSConnection' },
        text: {
            summary: 'Conexión no visual a servicios web.',
        },
    },
];
