const fs = require('fs');
const path = 'c:\\Desarrollo\\Proyectos\\vsc-powersyntax\\src\\server\\knowledge\\system\\localization\\es\\manual\\language\\enumerationsLocalization.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove enumValueMeaning: '...' including the leading comma
content = content.replace(/, enumValueMeaning: '.*?'/g, '');

fs.writeFileSync(path, content);
console.log('Fixed enumerationsLocalization.ts');
