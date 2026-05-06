const { PB_SYSTEM_SYMBOL_REGISTRY } = require('../out/server/knowledge/system/registry/registry');

const targetDomains = ['global-functions'];
const entries = PB_SYSTEM_SYMBOL_REGISTRY.entries.filter(e => targetDomains.includes(e.domain));

// Group by logical key to find canonicals
const buckets = new Map();
for (const entry of entries) {
    const key = [entry.domain, entry.kind, entry.namespace, entry.invocation, entry.normalizedName, entry.normalizedOwnerTypes.join('+') || 'all'].join('|');
    const bucket = buckets.get(key) || [];
    bucket.push(entry);
    buckets.set(key, bucket);
}

const canonicals = [];
for (const bucket of buckets.values()) {
    // Basic logic from selectCanonicalTargetEntryId
    let canonical = bucket.find(e => e.dataset === 'manual-core' && e.manualOverlay?.mode === 'override');
    if (!canonical) {
        canonical = bucket.find(e => e.dataset === 'generated');
    }
    if (!canonical) {
        canonical = bucket.find(e => e.dataset === 'manual-core');
    }
    if (canonical) {
        canonicals.push(canonical);
    }
}

const result = canonicals
    .filter(e => e.signatures.some(s => s.parameters && s.parameters.some(p => p.documentation)))
    .map(e => ({
        name: e.name,
        signatures: e.signatures.map(s => ({
            label: s.label,
            parameters: (s.parameters || [])
                .filter(p => p.documentation)
                .map(p => ({ label: p.label, doc: p.documentation }))
        })).filter(s => s.parameters.length > 0)
    }));

console.log(JSON.stringify(result, null, 2));
