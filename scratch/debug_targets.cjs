const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');
const { buildDocumentedParameterTargets } = require('../out/server/knowledge/system/localization/localizationResolver');

const abs = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(e => e.name === 'Abs');
const targets = buildDocumentedParameterTargets(abs);
console.log('Targets for Abs:', JSON.stringify(Array.from(targets.entries()), null, 2));
