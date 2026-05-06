const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

const targetDomains = ['global-functions'];
const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => targetDomains.includes(e.domain));

const result = entries.slice(0, 50).map(e => ({
    name: e.name,
    signatures: e.signatures.map(s => ({
        label: s.label,
        parameters: (s.parameters || []).map(p => p.label)
    }))
}));

console.log(JSON.stringify(result, null, 2));
