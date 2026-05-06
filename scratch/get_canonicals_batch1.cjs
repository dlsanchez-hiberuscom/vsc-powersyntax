const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

const names = ['Abs', 'ACos', 'AddToLibraryList', 'Asc', 'ASin', 'ATan', 'BlobMid', 'Ceiling', 'ChangeDirectory', 'Char'];
const results = [];

for (const name of names) {
    const bucket = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => e.name === name && e.domain === 'global-functions');
    
    // Canonical selection logic
    let canonical = bucket.find(e => e.dataset === 'manual-core' && e.manualOverlay?.mode === 'override');
    if (!canonical) canonical = bucket.find(e => e.dataset === 'generated');
    if (!canonical) canonical = bucket.find(e => e.dataset === 'manual-core');
    
    if (canonical) {
        results.push({
            name: canonical.name,
            signature: canonical.signatures[0].label,
            parameters: (canonical.signatures[0].parameters || []).map(p => ({ name: p.label, doc: p.documentation }))
        });
    }
}

console.log(JSON.stringify(results, null, 2));
