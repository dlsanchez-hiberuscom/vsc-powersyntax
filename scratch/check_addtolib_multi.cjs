const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => e.name === 'AddToLibraryList');
entries.forEach(e => {
    console.log('Dataset:', e.dataset, 'Domain:', e.domain, 'Signature:', e.signatures[0].label);
});
