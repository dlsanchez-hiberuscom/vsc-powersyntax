const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

const abs = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(e => e.name === 'Abs');
console.log(JSON.stringify(abs, null, 2));
