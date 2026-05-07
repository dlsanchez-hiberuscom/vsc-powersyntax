import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración OAuth.
 */
export const oauthLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'OAuthClient' },
        text: {
            summary: 'Cliente OAuth para autenticación y autorización HTTP.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'OAuthRequest' },
        text: {
            summary: 'Request OAuth no visual.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'TokenRequest' },
        text: {
            summary: 'Request no visual de token/autenticación.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'TokenResponse' },
        text: {
            summary: 'Response no visual de token/autenticación.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'AccessToken', ownerTypes: ['oauthclient'] },
        text: {
            summary: 'Solicita un token de acceso OAuth.',
            documentation: 'Realiza la solicitud de token al servidor de autorización.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito.',
            usageNotes: [
                'Requiere un objeto TokenRequest configurado.',
                'El resultado se almacenará en el objeto TokenResponse proporcionado.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.AccessToken ( TokenRequest tokenRequest, TokenResponse tokenResponse )', parameterName: 'tokenRequest', documentation: 'Objeto con la información de la solicitud.' },
            { signatureLabel: 'objectname.AccessToken ( TokenRequest tokenRequest, TokenResponse tokenResponse )', parameterName: 'tokenResponse', documentation: 'Objeto donde se recibirá la respuesta.' }
        ]
    },
];
