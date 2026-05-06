const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => 
    e.domain === 'object-functions' && e.dataset === 'manual-core'
);

for (const e of entries) {
    console.log(`${e.name}: ${e.id}`);
}
