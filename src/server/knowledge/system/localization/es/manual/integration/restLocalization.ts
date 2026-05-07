import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración REST.
 */
export const restLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'RESTClient' },
        text: {
            summary: 'Cliente REST no visual.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Retrieve', ownerTypes: ['restclient'] },
        text: {
            summary: 'Recupera datos desde un servicio REST.',
            documentation: 'Recupera filas desde un servicio web RESTful hacia un DataWindow, DataStore o DataWindowChild.',
            returnDocumentation: 'Long. Devuelve el número de filas recuperadas o un valor negativo si falla.',
            usageNotes: [
                'El servicio REST debe devolver datos en formato JSON compatible.',
                'Asegúrese de que el control DataWindow esté asociado con el objeto DataWindow correcto antes de llamar a Retrieve.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.Retrieve ( dwControl, urlName {, data} {, tokenrequest} )', parameterName: 'dwControl', documentation: 'Nombre del control DataWindow o DataStore.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Submit', ownerTypes: ['restclient'] },
        text: {
            summary: 'Envía cambios a un servicio REST.',
            documentation: 'Envía los cambios de un DataWindow o DataStore hacia un servicio web RESTful.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito.',
            usageNotes: [
                'Utilice esta función para realizar operaciones de actualización (POST/PUT) masivas.',
                'El servicio debe ser capaz de procesar el formato JSON enviado por el DataWindow.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.Submit(string urlName, ref string response, DWControl dwObject{, boolean format})', parameterName: 'urlName', documentation: 'La URL del servicio REST.' },
            { signatureLabel: 'objectname.Submit(string urlName, ref string response, DWControl dwObject{, boolean format})', parameterName: 'response', documentation: 'Referencia de cadena para recibir la respuesta del servidor.' }
        ]
    },
];
