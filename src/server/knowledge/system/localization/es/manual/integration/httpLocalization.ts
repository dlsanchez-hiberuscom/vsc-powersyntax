import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración HTTP.
 */
export const httpLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'HTTPClient' },
        text: {
            summary: 'Cliente HTTP para requests REST y servicios web.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Inet' },
        text: {
            summary: 'Objeto no visual para operaciones de Internet.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'InternetResult' },
        text: {
            summary: 'Resultado no visual de operaciones HTTP/Internet.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'ResourceResponse' },
        text: {
            summary: 'Respuesta no visual devuelta por operaciones REST o de recursos HTTP.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'Service' },
        text: {
            summary: 'Servicio no visual reusable en el runtime.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SendRequest', ownerTypes: ['httpclient'] },
        text: {
            summary: 'Envía una solicitud HTTP al servidor.',
            documentation: 'Envía una solicitud HTTP utilizando el método y la URL especificados.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito y un valor negativo si falla.',
            usageNotes: [
                'Debe llamar a este método después de configurar los encabezados si es necesario.',
                'El cuerpo de la respuesta se puede obtener mediante GetResponseBody.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName )', parameterName: 'methodName', documentation: 'El método HTTP (GET, POST, PUT, DELETE, etc.).' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName )', parameterName: 'urlName', documentation: 'La URL de destino.' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName, string data )', parameterName: 'methodName', documentation: 'El método HTTP.' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName, string data )', parameterName: 'urlName', documentation: 'La URL de destino.' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName, string data )', parameterName: 'data', documentation: 'Datos a enviar (cadena).' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName, blob data )', parameterName: 'methodName', documentation: 'El método HTTP.' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName, blob data )', parameterName: 'urlName', documentation: 'La URL de destino.' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName, blob data )', parameterName: 'data', documentation: 'Datos a enviar (blob).' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName, string data, encodingType )', parameterName: 'methodName', documentation: 'El método HTTP.' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName, string data, encodingType )', parameterName: 'urlName', documentation: 'La URL de destino.' },
            { signatureLabel: 'objectname.SendRequest ( methodName, urlName, string data, encodingType )', parameterName: 'data', documentation: 'Datos a enviar.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetResponseBody', ownerTypes: ['httpclient'] },
        text: {
            summary: 'Obtiene el cuerpo de la respuesta HTTP.',
            documentation: 'Lee los datos de la respuesta en una variable de tipo cadena o blob.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito.',
            usageNotes: [
                'Utilice variables de tipo Blob para datos binarios o archivos grandes.',
                'Para texto, asegúrese de que la codificación coincida con la del servidor.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.GetResponseBody ( string data )', parameterName: 'data', documentation: 'Referencia de cadena donde se almacenará el cuerpo.' },
            { signatureLabel: 'objectname.GetResponseBody ( blob data )', parameterName: 'data', documentation: 'Referencia de blob donde se almacenará el cuerpo.' },
            { signatureLabel: 'objectname.GetResponseBody ( string data, encodingType )', parameterName: 'data', documentation: 'Referencia de cadena donde se almacenará el cuerpo.' },
            { signatureLabel: 'objectname.GetResponseBody ( string data, encodingType )', parameterName: 'encodingType', documentation: 'Codificación para interpretar el texto.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'GetResponseStatusCode', ownerTypes: ['httpclient'] },
        text: {
            summary: 'Obtiene el código de estado de la respuesta HTTP.',
            returnDocumentation: 'Long. El código de estado (ej. 200, 404).'
        }
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SetRequestHeader', ownerTypes: ['httpclient', 'restclient'] },
        text: {
            summary: 'Establece un encabezado para la solicitud HTTP.',
            documentation: 'Añade o reemplaza un encabezado en la lista de encabezados de la solicitud.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito.',
            usageNotes: [
                'Debe llamarse antes de SendRequest.',
                'Permite configurar Content-Type, Authorization, etc.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.SetRequestHeader ( string headerName, string headerValue{, Boolean replace } )', parameterName: 'headerName', documentation: 'Nombre del encabezado (ej. "Content-Type").' }
        ]
    },
];
