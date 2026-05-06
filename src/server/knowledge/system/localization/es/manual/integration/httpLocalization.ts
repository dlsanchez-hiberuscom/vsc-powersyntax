import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración HTTP.
 */
export const httpLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'HTTPClient' },
        text: {
            summary: 'Cliente HTTP para requests REST y servicios web.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Inet' },
        text: {
            summary: 'Objeto no visual para operaciones de Internet.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'InternetResult' },
        text: {
            summary: 'Resultado no visual de operaciones HTTP/Internet.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'ResourceResponse' },
        text: {
            summary: 'Respuesta no visual devuelta por operaciones REST o de recursos HTTP.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Service' },
        text: {
            summary: 'Servicio no visual reusable en el runtime.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'SSLCallback' },
        text: {
            summary: 'Callback SSL no visual.',
        },
    },
    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'SSLServiceProvider' },
        text: {
            summary: 'Proveedor SSL no visual.',
        },
    },
];
