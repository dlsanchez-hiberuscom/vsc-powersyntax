import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración con .NET.
 */
export const dotnetLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'DotNetAssembly' },
        text: {
            summary: 'Assembly .NET cargado desde PowerBuilder.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'DotNetObject' },
        text: {
            summary: 'Objeto .NET interoperable desde PowerBuilder.',
        },
    },
];
