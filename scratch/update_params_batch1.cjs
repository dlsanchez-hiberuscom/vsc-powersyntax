const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/globalFunctionsLocalization.ts');

function updateEntry(content, name, parameters, textUpdates) {
    const regex = new RegExp(`(\\{\\s*locale:\\s*'es',\\s*reviewed:\\s*false,\\s*source:\\s*'manual-curated',\\s*targetKey:\\s*\\{[^}]*name:\\s*'${name}'[^}]*\\},\\s*text:\\s*\\{)([^}]*)(\\}\\s*)(\\},?)`, 'g');
    
    return content.replace(regex, (match, head, textBody, tail, end) => {
        let newTextBody = textBody;
        if (textUpdates.returnDocumentation && !textBody.includes('returnDocumentation:')) {
            newTextBody += `, returnDocumentation: '${textUpdates.returnDocumentation}'`;
        }
        
        let parametersStr = '';
        if (parameters && parameters.length > 0) {
            parametersStr = `,\n        parameters: [\n` + 
                parameters.map(p => `            { signatureLabel: '${p.signatureLabel}', parameterName: '${p.parameterName}', documentation: '${p.documentation}' }`).join(',\n') +
                `\n        ]`;
        }
        
        return head + newTextBody + tail + parametersStr + '\n    ' + end;
    });
}

let content = fs.readFileSync(filePath, 'utf8');

const data = [
    {
        name: 'Abs',
        text: { returnDocumentation: 'El valor absoluto del número indicado, con el mismo tipo de dato.' },
        parameters: [
            { signatureLabel: 'Abs ( n )', parameterName: 'n', documentation: 'El número para el cual se desea obtener el valor absoluto.' }
        ]
    },
    {
        name: 'ACos',
        text: { returnDocumentation: 'El arcocoseno del ángulo indicado en radianes.' },
        parameters: [
            { signatureLabel: 'ACos ( n )', parameterName: 'n', documentation: 'El valor del coseno (entre -1 y 1) para el cual calcular el ángulo.' }
        ]
    },
    {
        name: 'AddToLibraryList',
        text: { returnDocumentation: '1 si tiene éxito y -1 si ocurre un error.' },
        parameters: [
            { signatureLabel: 'AddToLibraryList ( libraryname )', parameterName: 'libraryname', documentation: 'Nombre de la biblioteca PBL o PBD a añadir a la lista de librerías.' }
        ]
    },
    {
        name: 'Asc',
        text: { returnDocumentation: 'El valor numérico ASCII del primer carácter de la cadena.' },
        parameters: [
            { signatureLabel: 'Asc ( string )', parameterName: 'string', documentation: 'La cadena de la cual se desea obtener el valor del primer carácter.' }
        ]
    },
    {
        name: 'ASin',
        text: { returnDocumentation: 'El arcoseno del ángulo indicado en radianes.' },
        parameters: [
            { signatureLabel: 'ASin ( n )', parameterName: 'n', documentation: 'El valor del seno (entre -1 y 1) para el cual calcular el ángulo.' }
        ]
    },
    {
        name: 'ATan',
        text: { returnDocumentation: 'El arcotangente del ángulo indicado en radianes.' },
        parameters: [
            { signatureLabel: 'ATan ( n )', parameterName: 'n', documentation: 'El valor de la tangente para el cual calcular el ángulo.' }
        ]
    }
];

data.forEach(d => {
    content = updateEntry(content, d.name, d.parameters, d.text);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated globalFunctionsLocalization.ts with correct parameter documentation.');
