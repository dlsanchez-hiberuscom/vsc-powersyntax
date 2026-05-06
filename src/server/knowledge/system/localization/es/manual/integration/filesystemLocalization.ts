import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración con el sistema de archivos.
 */
export const filesystemLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'FileSystem' },
        text: {
            summary: 'Subsistema de acceso al sistema de archivos desde el runtime.',
        },
    },
];
