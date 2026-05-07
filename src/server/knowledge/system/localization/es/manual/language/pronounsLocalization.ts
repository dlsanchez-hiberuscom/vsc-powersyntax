import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para pronombres del lenguaje.
 */
export const pronounsLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'pronouns', kind: 'pronoun', namespace: 'powerscript', invocation: 'global', name: 'This' },
        text: { summary: 'Referencia al objeto actual.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'pronouns', kind: 'pronoun', namespace: 'powerscript', invocation: 'global', name: 'Super' },
        text: { summary: 'Referencia al ancestro inmediato del objeto actual.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'pronouns', kind: 'pronoun', namespace: 'powerscript', invocation: 'global', name: 'Parent' },
        text: { summary: 'Referencia al contenedor visual inmediato del control.' },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'pronouns', kind: 'pronoun', namespace: 'powerscript', invocation: 'global', name: 'ParentWindow' },
        text: { summary: 'Referencia a la ventana que contiene el menú activo.' },
    },
];
