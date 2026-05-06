const fs = require('node:fs');
const path = require('node:path');

// Mocking some parts because we are running in a scratch script
const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

function normalizeName(n) {
    return n.trim().toLowerCase();
}

function getOwnerTypesFor(domain, kind, namespace, invocation, name) {
    const matches = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => 
        e.domain === domain &&
        e.kind === kind &&
        e.namespace === namespace &&
        e.invocation === invocation &&
        normalizeName(e.name) === normalizeName(name) &&
        e.dataset === 'manual-core'
    );
    
    if (matches.length === 0) return null;
    // If multiple, they should ideally have the same ownerTypes if they are logically the same
    return matches[0].ownerTypes;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Regex to find targetKey objects
    // targetKey: { domain: '...', kind: '...', namespace: '...', invocation: '...', name: '...' }
    const targetKeyRegex = /targetKey:\s*\{([^}]+)\}/g;
    
    let updatedContent = content.replace(targetKeyRegex, (match, body) => {
        if (body.includes('ownerTypes:')) return match; // Already has it
        
        const domainMatch = body.match(/domain:\s*'([^']+)'/);
        const kindMatch = body.match(/kind:\s*'([^']+)'/);
        const namespaceMatch = body.match(/namespace:\s*'([^']+)'/);
        const invocationMatch = body.match(/invocation:\s*'([^']+)'/);
        const nameMatch = body.match(/name:\s*'([^']+)'/);
        
        if (domainMatch && kindMatch && namespaceMatch && invocationMatch && nameMatch) {
            const domain = domainMatch[1];
            const kind = kindMatch[1];
            const namespace = namespaceMatch[1];
            const invocation = invocationMatch[1];
            const name = nameMatch[1];
            
            const ownerTypes = getOwnerTypesFor(domain, kind, namespace, invocation, name);
            if (ownerTypes) {
                const ownerTypesStr = JSON.stringify(ownerTypes).replace(/"/g, "'").replace(/,/g, ', ');
                return `targetKey: { ${body.trim()}, ownerTypes: ${ownerTypesStr} }`;
            }
        }
        return match;
    });
    
    if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated ${filePath}`);
    } else {
        console.log(`No changes for ${filePath}`);
    }
}

const files = [
    path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/objectFunctionsLocalization.ts'),
    path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/systemEventsLocalization.ts')
];

files.forEach(processFile);
