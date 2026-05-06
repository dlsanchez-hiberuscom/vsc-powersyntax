import * as fs from 'fs';
import { PB_SYSTEM_SYMBOL_REGISTRY } from './src/server/knowledge/system/registry/registry';
import { getSystemSymbolLocalizationCatalogReport } from './src/server/knowledge/system/localization';

const report = getSystemSymbolLocalizationCatalogReport();
console.log(`Found ${report.incompleteOverlays.length} incomplete overlays`);

const paths = [
    'src/server/knowledge/system/localization/es/manual/toolingLocalization.ts',
    'src/server/knowledge/system/localization/es/manual/visualLocalization.ts',
    'src/server/knowledge/system/localization/es/manual/runtimeLocalization.ts',
];

for (const p of paths) {
    let content = fs.readFileSync(p, 'utf-8');
    
    for (const inc of report.incompleteOverlays) {
        if (!inc.missingFields.includes('documentation')) continue;
        
        const entry = PB_SYSTEM_SYMBOL_REGISTRY.entries.find(e => e.id === inc.targetEntryId);
        if (!entry || !entry.documentation) continue;
        
        // Escape quotes
        const docText = entry.documentation.replace(/'/g, "\\'").replace(/\n/g, "\\n");
        
        // Find the line for this overlay
        const searchStr = `name: '${inc.targetName}' }, text: { summary:`;
        const regex = new RegExp(`(name: '${inc.targetName}' }, text: { summary: '[^']+') } },`, 'g');
        content = content.replace(regex, `$1, documentation: '${docText}' } },`);
    }
    
    fs.writeFileSync(p, content);
    console.log(`Updated ${p}`);
}
