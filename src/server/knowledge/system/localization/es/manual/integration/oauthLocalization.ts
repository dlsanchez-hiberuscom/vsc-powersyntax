import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración OAuth.
 */
export const oauthLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'OAuthClient' },
        text: {
            summary: 'Cliente OAuth para autenticación y autorización HTTP.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'OAuthRequest' },
        text: {
            summary: 'Request OAuth no visual.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'TokenRequest' },
        text: {
            summary: 'Request no visual de token/autenticación.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'TokenResponse' },
        text: {
            summary: 'Response no visual de token/autenticación.',
        },
    },
];
