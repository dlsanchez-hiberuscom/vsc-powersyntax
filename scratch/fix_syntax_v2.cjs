const fs = require('node:fs');
const path = require('node:path');

function fixSyntax(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let newLines = [];
    
    let inObject = false;
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();
        
        if (trimmed === '{') {
            inObject = true;
            newLines.push(line);
        } else if (trimmed === '},' || trimmed === '}') {
            if (inObject) {
                newLines.push(line);
                inObject = false;
            } else {
                // Orphan brace, skip it
                console.log(`Skipping orphan brace at ${filePath}:${i+1}`);
            }
        } else if (trimmed === '];') {
            newLines.push(line);
        } else if (trimmed !== '') {
            newLines.push(line);
        }
    }
    
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
}

fixSyntax(path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/objectFunctionsLocalization.ts'));
fixSyntax(path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/systemEventsLocalization.ts'));
