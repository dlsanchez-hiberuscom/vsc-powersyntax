const name = 'Abs';
const regex = new RegExp(`(\\{\\s*locale:\\s*'es',\\s*reviewed:\\s*false,\\s*source:\\s*'manual-curated',\\s*targetKey:\\s*\\{[^}]*name:\\s*'${name}'[^}]*\\},\\s*text:\\s*\\{)([^}]*)(\\}\\s*)(\\},?)`, 'g');
const content = `    {
        locale: 'es', reviewed: false, source: 'manual-curated',
        targetKey: { domain: 'global-functions', kind: 'callable', namespace: 'powerscript', invocation: 'global', name: 'Abs' },
        text: { summary: 'Devuelve el valor absoluto.' , returnDocumentation: 'El valor absoluto del número indicado, con el mismo tipo de dato.'},
    },`;

console.log('Match?', regex.test(content));
console.log('Match result:', content.match(regex));
