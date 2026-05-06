const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/globalFunctionsLocalization.ts');

function updateEntries(content, data) {
    let result = content;
    
    for (const d of data) {
        const regex = new RegExp(`(\\{\\s*locale:\\s*'es',[^}]*targetKey:\\s*\\{[^}]*name:\\s*'${d.name}'[^}]*\\},[^}]*text:\\s*\\{[^}]*\\}\\s*,?\\s*\\})`, 'g');
        
        result = result.replace(regex, (match) => {
            let newEntry = `{\n        locale: 'es', reviewed: false, source: 'manual-curated',\n`;
            newEntry += `        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: '${d.name}' },\n`;
            newEntry += `        text: {\n            summary: '${d.summary}',\n`;
            if (d.returnDocumentation) newEntry += `            returnDocumentation: '${d.returnDocumentation}',\n`;
            if (d.usageNotes) newEntry += `            usageNotes: ${JSON.stringify(d.usageNotes).replace(/"/g, "'")},\n`;
            newEntry += `        }`;
            
            if (d.parameters && d.parameters.length > 0) {
                newEntry += `,\n        parameters: [\n`;
                newEntry += d.parameters.map(p => `            { signatureLabel: '${p.signatureLabel}', parameterName: '${p.parameterName}', documentation: '${p.documentation}' }`).join(',\n');
                newEntry += `\n        ]`;
            }
            
            newEntry += `\n    }`;
            return newEntry;
        });
    }
    
    return result;
}

let content = fs.readFileSync(filePath, 'utf8');

const data = [
    {
        name: 'Abs',
        summary: 'Devuelve el valor absoluto.',
        returnDocumentation: 'El valor absoluto del número indicado, con el mismo tipo de dato.',
        parameters: [{ signatureLabel: 'Abs ( n )', parameterName: 'n', documentation: 'El número para el cual se desea obtener el valor absoluto.' }]
    },
    {
        name: 'ACos',
        summary: 'Devuelve el arcocoseno del valor indicado.',
        returnDocumentation: 'El arcocoseno del ángulo indicado en radianes.',
        parameters: [{ signatureLabel: 'ACos ( n )', parameterName: 'n', documentation: 'El valor del coseno para el cual calcular el ángulo.' }]
    },
    {
        name: 'AddToLibraryList',
        summary: 'Añade una biblioteca a la lista de librerías actual.',
        returnDocumentation: '1 si tiene éxito y -1 si ocurre un error.',
        parameters: [{ signatureLabel: 'AddToLibraryList ( filelist )', parameterName: 'filelist', documentation: 'Cadena con los nombres de las librerías a añadir.' }]
    },
    {
        name: 'Asc',
        summary: 'Devuelve el valor numérico ASCII del primer carácter.',
        returnDocumentation: 'El valor numérico ASCII del primer carácter de la cadena.',
        parameters: [{ signatureLabel: 'Asc ( string )', parameterName: 'string', documentation: 'La cadena de la cual obtener el código del primer carácter.' }]
    },
    {
        name: 'ASin',
        summary: 'Devuelve el arcoseno del valor indicado.',
        returnDocumentation: 'El arcoseno del ángulo indicado en radianes.',
        parameters: [{ signatureLabel: 'ASin ( n )', parameterName: 'n', documentation: 'El valor del seno para el cual calcular el ángulo.' }]
    },
    {
        name: 'ATan',
        summary: 'Devuelve el arcotangente del valor indicado.',
        returnDocumentation: 'El arcotangente del ángulo indicado en radianes.',
        parameters: [{ signatureLabel: 'ATan ( n )', parameterName: 'n', documentation: 'El valor de la tangente para el cual calcular el ángulo.' }]
    },
    {
        name: 'BlobMid',
        summary: 'Extrae bytes de un objeto Blob.',
        returnDocumentation: 'Un nuevo Blob con los bytes extraídos.',
        parameters: [
            { signatureLabel: 'BlobMid ( data, start )', parameterName: 'data', documentation: 'El Blob original.' },
            { signatureLabel: 'BlobMid ( data, start )', parameterName: 'start', documentation: 'Posición inicial (1-indexed).' },
            { signatureLabel: 'BlobMid ( data, start, length )', parameterName: 'data', documentation: 'El Blob original.' },
            { signatureLabel: 'BlobMid ( data, start, length )', parameterName: 'start', documentation: 'Posición inicial.' },
            { signatureLabel: 'BlobMid ( data, start, length )', parameterName: 'length', documentation: 'Cantidad de bytes a extraer.' }
        ]
    },
    {
        name: 'Ceiling',
        summary: 'Redondea hacia arriba al entero más cercano.',
        returnDocumentation: 'El entero más pequeño mayor o igual al número indicado.',
        parameters: [{ signatureLabel: 'Ceiling ( n )', parameterName: 'n', documentation: 'El número a redondear.' }]
    },
    {
        name: 'ChangeDirectory',
        summary: 'Cambia el directorio de trabajo actual.',
        returnDocumentation: '1 si tiene éxito y -1 si falla.',
        parameters: [{ signatureLabel: 'ChangeDirectory ( directoryname )', parameterName: 'directoryname', documentation: 'Ruta del nuevo directorio.' }]
    },
    {
        name: 'Char',
        summary: 'Convierte un valor a su carácter correspondiente.',
        returnDocumentation: 'Un carácter.',
        parameters: [{ signatureLabel: 'Char ( n )', parameterName: 'n', documentation: 'Valor numérico o blob a convertir.' }]
    }
];

content = updateEntries(content, data);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated globalFunctionsLocalization.ts with batch 1 (10 functions).');
