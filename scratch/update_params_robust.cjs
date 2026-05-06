const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/globalFunctionsLocalization.ts');

function updateEntries(content, data) {
    let result = content;
    
    for (const d of data) {
        // Find the entry that matches the name
        const regex = new RegExp(`(\\{\\s*locale:\\s*'es',[^}]*targetKey:\\s*\\{[^}]*name:\\s*'${d.name}'[^}]*\\},[^}]*text:\\s*\\{[^}]*\\}\\s*,?\\s*\\})`, 'g');
        
        result = result.replace(regex, (match) => {
            // Reconstruct the entry
            let newEntry = `{\n        locale: 'es', reviewed: false, source: 'manual-curated',\n`;
            newEntry += `        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: '${d.name}' },\n`;
            newEntry += `        text: {\n            summary: '${d.summary}',\n`;
            if (d.text.returnDocumentation) newEntry += `            returnDocumentation: '${d.text.returnDocumentation}',\n`;
            if (d.text.usageNotes) newEntry += `            usageNotes: ${JSON.stringify(d.text.usageNotes).replace(/"/g, "'")},\n`;
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
        text: { returnDocumentation: 'El valor absoluto del número indicado, con el mismo tipo de dato.' },
        parameters: [
            { signatureLabel: 'Abs ( n )', parameterName: 'n', documentation: 'El número para el cual se desea obtener el valor absoluto.' }
        ]
    },
    {
        name: 'ACos',
        summary: 'Devuelve el arcocoseno del valor indicado.',
        text: { returnDocumentation: 'El arcocoseno del ángulo indicado en radianes.' },
        parameters: [
            { signatureLabel: 'ACos ( n )', parameterName: 'n', documentation: 'El valor del coseno (entre -1 y 1) para el cual calcular el ángulo.' }
        ]
    },
    {
        name: 'AddToLibraryList',
        summary: 'Añade una biblioteca a la lista de librerías actual.',
        text: { returnDocumentation: '1 si tiene éxito y -1 si ocurre un error.' },
        parameters: [
            { signatureLabel: 'AddToLibraryList ( libraryname )', parameterName: 'libraryname', documentation: 'Nombre de la biblioteca PBL o PBD a añadir a la lista de librerías.' }
        ]
    }
];

content = updateEntries(content, data);
fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated globalFunctionsLocalization.ts with robust script.');
