const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

const names = ['Abs', 'ACos', 'AddToLibraryList', 'Asc', 'ASin', 'ATan'];
const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => names.includes(e.name) && e.dataset === 'generated');

const result = entries.map(e => ({
    name: e.name,
    signatures: e.signatures.map(s => ({
        label: s.label,
        parameters: (s.parameters || []).map(p => ({ label: p.label, doc: p.documentation }))
    }))
}));

console.log(JSON.stringify(result, null, 2));
