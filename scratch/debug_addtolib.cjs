const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

const entry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(e => e.name === 'AddToLibraryList' && e.dataset === 'generated');
console.log('Signature Label:', entry.signatures[0].label);
console.log('Parameter Label:', entry.signatures[0].parameters[0].label);
console.log('Normalized Signature:', entry.signatures[0].label.trim().toLowerCase());
console.log('Normalized Parameter:', entry.signatures[0].parameters[0].label.trim().toLowerCase());
