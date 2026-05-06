const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

const targetFunctions = ['SetFocus', 'Show', 'Hide', 'Move', 'Resize', 'PointerX', 'PointerY', 'GetParent', 'SetRedraw', 'PostEvent', 'TriggerEvent', 'ClassName', 'TypeOf', 'GetContextService'];

const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => 
    targetFunctions.includes(e.name) && 
    e.domain === 'object-functions'
);

for (const e of entries) {
    console.log(`${e.name} (${e.dataset}): ${e.id}`);
}
