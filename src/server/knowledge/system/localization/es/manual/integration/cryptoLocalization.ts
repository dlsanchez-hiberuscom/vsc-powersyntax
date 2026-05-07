import { PbSystemSymbolLocalizationOverlay } from '../../../../types';

/**
 * Localización en español para integración con criptografía.
 */
export const cryptoLocalization: PbSystemSymbolLocalizationOverlay[] = [
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'CoderObject' },
        text: {
            summary: 'Objeto no visual para codificación y transformaciones.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'system-object-datatypes', kind: 'system-type', namespace: 'powerbuilder-runtime', invocation: 'global', name: 'CrypterObject' },
        text: {
            summary: 'Objeto no visual para cifrado y descifrado.',
        },
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SymmetricEncrypt', ownerTypes: ['crypterobject'] },
        text: {
            summary: 'Cifra datos usando un algoritmo simétrico.',
            documentation: 'Cifra un valor blob usando algoritmos como AES, DES, Triple-DES, etc.',
            returnDocumentation: 'Blob. El resultado cifrado.',
            usageNotes: [
                'Asegúrese de usar una clave de longitud adecuada para el algoritmo seleccionado.',
                'Guarde el vector de inicialización (IV) si es necesario para el descifrado.'
            ]
        },
        parameters: [
            { signatureLabel: 'crypter.SymmetricEncrypt ( algorithm, variable, key{, operationmode{, iv{, padding}}})', parameterName: 'algorithm', documentation: 'El algoritmo de cifrado (ej. AES!).' },
            { signatureLabel: 'crypter.SymmetricEncrypt ( algorithm, variable, key{, operationmode{, iv{, padding}}})', parameterName: 'variable', documentation: 'Los datos a cifrar.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'SymmetricDecrypt', ownerTypes: ['crypterobject'] },
        text: {
            summary: 'Descifra datos usando un algoritmo simétrico.',
            returnDocumentation: 'Blob. El resultado descifrado.',
            usageNotes: [
                'La clave y el algoritmo deben coincidir exactamente con los usados para el cifrado.'
            ]
        },
        parameters: [
            { signatureLabel: 'crypter.SymmetricDecrypt ( algorithm, variable, key{, operationmode{, iv{, padding}}})', parameterName: 'algorithm', documentation: 'El algoritmo usado.' },
            { signatureLabel: 'crypter.SymmetricDecrypt ( algorithm, variable, key{, operationmode{, iv{, padding}}})', parameterName: 'variable', documentation: 'Los datos cifrados.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'Base64Encode', ownerTypes: ['coderobject'] },
        text: {
            summary: 'Codifica datos en formato Base64.',
            returnDocumentation: 'String. La cadena codificada.',
            usageNotes: [
                'Útil para transmitir datos binarios a través de protocolos basados en texto (ej. JSON).'
            ]
        },
        parameters: [
            { signatureLabel: 'coder.Base64Encode ( variable )', parameterName: 'variable', documentation: 'El blob a codificar.' }
        ]
    },
    {
        locale: 'es', reviewed: true, source: 'manual-curated',
        targetKey: { domain: 'object-functions', kind: 'callable', namespace: 'object', invocation: 'member', name: 'HexEncode', ownerTypes: ['coderobject'] },
        text: {
            summary: 'Codifica datos en formato Hexadecimal.',
            returnDocumentation: 'String. La cadena codificada.',
            usageNotes: [
                'Comúnmente usado para representar hashes o identificadores binarios.'
            ]
        },
        parameters: [
            { signatureLabel: 'coder.HexEncode ( variable )', parameterName: 'variable', documentation: 'El blob a codificar.' }
        ]
    },
];
