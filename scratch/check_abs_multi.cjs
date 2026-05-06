const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');
const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => e.name === 'Abs');
console.log('Found', entries.length, 'entries for Abs');
entries.forEach(e => {
    console.log('Dataset:', e.dataset, 'Domain:', e.domain, 'Parameters:', e.signatures[0].parameters ? e.signatures[0].parameters.length : 'none');
});
