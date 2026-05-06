const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/globalFunctionsLocalization.ts');

function updateEntry(content, name, updates) {
    const regex = new RegExp(`targetKey:\\s*\\{[^}]*name:\\s*'${name}'[^}]*\\},\\s*text:\\s*\\{([^}]*)\\}`, 'g');
    
    return content.replace(regex, (match, textBody) => {
        let newTextBody = textBody;
        
        if (updates.returnDocumentation && !textBody.includes('returnDocumentation:')) {
            newTextBody += `, returnDocumentation: '${updates.returnDocumentation}'`;
        }
        
        if (updates.usageNotes && !textBody.includes('usageNotes:')) {
            newTextBody += `, usageNotes: '${updates.usageNotes}'`;
        }
        
        if (updates.parameterDocumentation && !textBody.includes('parameterDocumentation:')) {
            const params = JSON.stringify(updates.parameterDocumentation).replace(/"/g, "'").replace(/,/g, ', ');
            newTextBody += `, parameterDocumentation: ${params}`;
        }
        
        return match.replace(textBody, newTextBody);
    });
}

let content = fs.readFileSync(filePath, 'utf8');

const data = [
    {
        name: 'Abs',
        updates: {
            returnDocumentation: 'El valor absoluto del número indicado, con el mismo tipo de dato.',
            parameterDocumentation: { n: 'El número para el cual se desea obtener el valor absoluto.' }
        }
    },
    {
        name: 'ACos',
        updates: {
            returnDocumentation: 'El arcocoseno del ángulo indicado en radianes.',
            parameterDocumentation: { n: 'El valor del coseno (entre -1 y 1) para el cual calcular el ángulo.' }
        }
    },
    {
        name: 'AddToLibraryList',
        updates: {
            returnDocumentation: '1 si tiene éxito y -1 si ocurre un error.',
            usageNotes: 'Las bibliotecas añadidas deben ser accesibles en tiempo de ejecución.',
            parameterDocumentation: { libraryname: 'Nombre de la biblioteca PBL o PBD a añadir.' }
        }
    },
    {
        name: 'Asc',
        updates: {
            returnDocumentation: 'El valor numérico ASCII del primer carácter de la cadena.',
            usageNotes: 'Si la cadena está vacía, devuelve 0.',
            parameterDocumentation: { s: 'Cadena de la cual se desea obtener el valor ASCII.' }
        }
    },
    {
        name: 'ASin',
        updates: {
            returnDocumentation: 'El arcoseno del ángulo indicado en radianes.',
            parameterDocumentation: { n: 'El valor del seno (entre -1 y 1) para el cual calcular el ángulo.' }
        }
    },
    {
        name: 'ATan',
        updates: {
            returnDocumentation: 'El arcotangente del ángulo indicado en radianes.',
            parameterDocumentation: { n: 'El valor de la tangente para el cual calcular el ángulo.' }
        }
    }
];

data.forEach(d => {
    content = updateEntry(content, d.name, d.updates);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated globalFunctionsLocalization.ts with initial batch.');
