const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');
const sqrt = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(e => e.name === 'Sqrt');
console.log(JSON.stringify(sqrt, null, 2));
