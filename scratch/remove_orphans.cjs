const fs = require('node:fs');
const path = require('node:path');
const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

function normalizeName(n) {
    return n.trim().toLowerCase();
}

function isOrphan(domain, kind, namespace, invocation, name, ownerTypes) {
    const normalizedName = normalizeName(name);
    const normalizedOwnerTypes = (ownerTypes || []).map(normalizeName).sort().join('+') || 'all';
    
    const matches = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => 
        e.domain === domain &&
        e.kind === kind &&
        e.namespace === namespace &&
        e.invocation === invocation &&
        normalizeName(e.name) === normalizedName &&
        (e.normalizedOwnerTypes.join('+') || 'all') === normalizedOwnerTypes
    );
    
    return matches.length === 0;
}

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // This is tricky because entries are objects in an array.
    // I'll try to find the whole object and remove it.
    // { locale: 'es', ..., targetKey: { ... }, ... },
    const entryRegex = /\{\s*locale:\s*'es'[^}]*targetKey:\s*\{([^}]+)\}[^}]*\},?\s*/g;
    
    let updatedContent = content.replace(entryRegex, (match, body) => {
        const domainMatch = body.match(/domain:\s*'([^']+)'/);
        const kindMatch = body.match(/kind:\s*'([^']+)'/);
        const namespaceMatch = body.match(/namespace:\s*'([^']+)'/);
        const invocationMatch = body.match(/invocation:\s*'([^']+)'/);
        const nameMatch = body.match(/name:\s*'([^']+)'/);
        const ownerTypesMatch = body.match(/ownerTypes:\s*\[([^\]]+)\]/);
        
        if (domainMatch && kindMatch && namespaceMatch && invocationMatch && nameMatch) {
            const domain = domainMatch[1];
            const kind = kindMatch[1];
            const namespace = namespaceMatch[1];
            const invocation = invocationMatch[1];
            const name = nameMatch[1];
            let ownerTypes = undefined;
            if (ownerTypesMatch) {
                ownerTypes = ownerTypesMatch[1].split(',').map(s => s.trim().replace(/'/g, ''));
            }
            
            if (isOrphan(domain, kind, namespace, invocation, name, ownerTypes)) {
                console.log(`REMOVING ORPHAN: ${name} in ${domain}`);
                return ''; // Remove it
            }
        }
        return match;
    });
    
    if (updatedContent !== content) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

const files = [
    path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/objectFunctionsLocalization.ts'),
    path.join(__dirname, '../src/server/knowledge/system/localization/es/manual/core/systemEventsLocalization.ts')
];

files.forEach(processFile);
