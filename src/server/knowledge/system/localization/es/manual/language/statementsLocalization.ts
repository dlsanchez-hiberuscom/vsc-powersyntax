import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para sentencias del lenguaje.
 */
export const statementsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'statements', kind: 'statement', namespace: 'powerscript', invocation: 'global', name: 'HALT' },
        text: {
            summary: 'Detiene la ejecución de la aplicación.',
            documentation: 'Provoca la finalización inmediata de la aplicación PB.',
        },
    },
];
