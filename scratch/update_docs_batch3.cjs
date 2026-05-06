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
        name: 'Clipboard',
        updates: {
            parameterDocumentation: { s: 'Cadena de texto opcional para colocar en el portapapeles.' }
        }
    },
    {
        name: 'CommandParm',
        updates: {
            returnDocumentation: 'La cadena de parámetros de la línea de comandos.',
            usageNotes: 'Útil para procesar argumentos de inicio de la aplicación.'
        }
    },
    {
        name: 'Cos',
        updates: {
            returnDocumentation: 'El coseno del ángulo indicado en radianes.',
            parameterDocumentation: { n: 'El ángulo en radianes.' }
        }
    },
    {
        name: 'Cpu',
        updates: {
            returnDocumentation: 'Los milisegundos de tiempo de CPU transcurridos.'
        }
    },
    {
        name: 'Date',
        updates: {
            returnDocumentation: 'Un valor de tipo Date extraído o convertido.',
            usageNotes: 'Puede convertir cadenas o extraer la fecha de un DateTime.',
            parameterDocumentation: { v: 'El valor (string o DateTime) a convertir.' }
        }
    },
    {
        name: 'Day',
        updates: {
            returnDocumentation: 'El número del día del mes (1-31).',
            parameterDocumentation: { d: 'La fecha de la cual extraer el día.' }
        }
    }
];

data.forEach(d => {
    content = updateEntry(content, d.name, d.updates);
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated globalFunctionsLocalization.ts with third batch.');
