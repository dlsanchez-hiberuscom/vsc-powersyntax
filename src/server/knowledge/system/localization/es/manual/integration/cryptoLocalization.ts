import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración con criptografía.
 */
export const cryptoLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'CoderObject' },
        text: {
            summary: 'Objeto no visual para codificación y transformaciones.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'CrypterObject' },
        text: {
            summary: 'Objeto no visual para cifrado y descifrado.',
        },
    },
];
