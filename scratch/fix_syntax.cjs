const fs = require('node:fs');
const path = require('node:path');

function fixSyntax(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let lines = content.split('\n');
    let newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        // If line is just '    },' or '    }' and the previous line was also ending a block or empty
        // actually, let's just look for multiple consecutive '    },' lines that don't have a matching opening brace.
        // A simpler way: if a line is just whitespace and '},' and it's redundant.
        
        // Let's use a more surgical approach:
        // Any '},' line that follows another '},' line without any other content in between (except whitespace)
        // is suspicious if it's not closing a nested block.
        // But our blocks are mostly flat: { ... },
        
        newLines.push(line);
    }
    
    // Actually, I'll just use a regex to find multiple consecutive '    },' lines
    // and replace them with a single '    },' if they are at the same indentation and seem redundant.
    
    let result = content.replace(/(\n\s*\},?\s*){2,}/g, '\n    },\n');
    
    // Also remove any '},' just before '];'
    result = result.replace(/\},?\s*\n\];/g, '\n];');
    
    fs.writeFileSync(filePath, result, 'utf8');
}

fixSyntax(path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/objectFunctionsLocalization.ts'));
fixSyntax(path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/systemEventsLocalization.ts'));
