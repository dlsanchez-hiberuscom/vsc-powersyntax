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
        name: 'Blob',
        updates: {
            returnDocumentation: 'Un objeto Blob que contiene los datos convertidos.',
            usageNotes: 'Convierte datos de cadena o numéricos a formato binario Blob.'
        }
    },
    {
        name: 'BlobMid',
        updates: {
            returnDocumentation: 'Un nuevo Blob que contiene los bytes extraídos.',
            parameterDocumentation: { data: 'El Blob original.', start: 'Posición inicial (1-indexed).', length: 'Cantidad de bytes a extraer.' }
        }
    },
    {
        name: 'Ceiling',
        updates: {
            returnDocumentation: 'El entero más pequeño que es mayor o igual al número indicado.',
            parameterDocumentation: { n: 'El número decimal o real a redondear hacia arriba.' }
        }
    },
    {
        name: 'ChangeDirectory',
        updates: {
            returnDocumentation: '1 si tiene éxito y -1 si falla.',
            parameterDocumentation: { directoryname: 'La ruta del nuevo directorio de trabajo.' }
        }
    },
    {
        name: 'Char',
        updates: {
            returnDocumentation: 'Un carácter correspondiente al valor numérico indicado.',
            parameterDocumentation: { n: 'El código numérico del carácter deseado.' }
        }
    },
    {
        name: 'ChooseColor',
        updates: {
            returnDocumentation: '1 si el usuario acepta, 0 si cancela y -1 si ocurre un error.'
        }
    }
];

data.forEach(d => {
    content = updateEntry(content, d.name, d.updates);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated globalFunctionsLocalization.ts with second batch.');
