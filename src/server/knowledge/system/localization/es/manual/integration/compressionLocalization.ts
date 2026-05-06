import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración con compresión.
 */
export const compressionLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'CompressorObject' },
        text: {
            summary: 'Objeto no visual para compresión de datos.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'ExtractorObject' },
        text: {
            summary: 'Objeto no visual para extracción de contenidos comprimidos.',
        },
    },
];
