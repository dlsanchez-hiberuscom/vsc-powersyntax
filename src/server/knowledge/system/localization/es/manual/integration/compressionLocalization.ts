import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración con compresión (ZIP).
 */
export const compressionLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'CompressorObject' },
        text: {
            summary: 'Objeto no visual para compresión de datos.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'ExtractorObject' },
        text: {
            summary: 'Objeto no visual para extracción de contenidos comprimidos.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Compress', ownerTypes: ['compressorobject'] },
        text: {
            summary: 'Comprime archivos o carpetas en un archivo ZIP.',
            documentation: 'Crea un archivo comprimido a partir de una ruta de origen o un objeto de datos.',
            returnDocumentation: 'Integer. Devuelve 1 si tiene éxito.',
            usageNotes: [
                'Soporta formatos estándar de compresión ZIP.',
                'Asegúrese de tener permisos de escritura en la ruta de destino.'
            ]
        },
        parameters: [
            { signatureLabel: 'objectname.Compress ( string source, string dest {, ArchiveFormat format })', parameterName: 'source', documentation: 'Ruta del archivo o carpeta a comprimir, o blob con datos.' }
        ]
    },
];
