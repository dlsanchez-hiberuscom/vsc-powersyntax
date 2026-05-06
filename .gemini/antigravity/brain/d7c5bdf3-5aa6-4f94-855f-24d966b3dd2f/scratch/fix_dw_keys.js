const fs = require('fs');
const path = require('path');

const canonicalPath = 'src/server/knowledge/system/manual/datawindow/dataWindowFunctions.ts';
const localizationPath = 'src/server/knowledge/system/localization/es/manual/datawindow/dataWindowFunctionsLocalization.ts';

const content = fs.readFileSync(canonicalPath, 'utf8');

// Simple regex to extract name and ownerTypes
// name: 'Collapse',
// ownerTypes: PB_MANUAL_CORE_DATAWINDOW_FUNCTION_OWNER_TYPES,
const nameToOwnerMap = {};

const functionTypes = ['datawindow', 'datawindowchild', 'datastore'];
const controlStoreTypes = ['datawindow', 'datastore'];
const graphTypes = ['datawindow', 'datastore'];
const controlTypes = ['datawindow'];
const scrollTypes = ['datawindow', 'datawindowchild'];
const visualTypes = ['datawindow', 'datawindowchild'];

const typeMapping = {
    'PB_MANUAL_CORE_DATAWINDOW_FUNCTION_OWNER_TYPES': functionTypes,
    'PB_MANUAL_CORE_DATAWINDOW_CONTROL_AND_STORE_OWNER_TYPES': controlStoreTypes,
    'PB_MANUAL_CORE_DATAWINDOW_GRAPH_OWNER_TYPES': graphTypes,
    'PB_MANUAL_CORE_DATAWINDOW_CONTROL_OWNER_TYPES': controlTypes,
    'PB_MANUAL_CORE_DATAWINDOW_SCROLL_OWNER_TYPES': scrollTypes,
    'PB_MANUAL_CORE_DATAWINDOW_VISUAL_OWNER_TYPES': visualTypes,
};

// Match entries in descriptors
const entryRegex = /name:\s*'([^']+)',[\s\S]+?ownerTypes:\s*([A-Z_0-9]+)/g;
let match;
while ((match = entryRegex.exec(content)) !== null) {
    const name = match[1];
    const typeVar = match[2];
    nameToOwnerMap[name] = typeMapping[typeVar] || [];
}

// Special case for manual overlays that might not be caught by the regex above
const manualOverlayRegex = /name:\s*'([^']+)',[\s\S]+?targetKey:[\s\S]+?ownerTypes:\s*(\[[^\]]+\])/g;
while ((match = manualOverlayRegex.exec(content)) !== null) {
    const name = match[1];
    const typesStr = match[2];
    try {
        nameToOwnerMap[name] = eval(typesStr.replace(/'/g, '"'));
    } catch (e) {}
}

console.log('Mapped', Object.keys(nameToOwnerMap).length, 'functions');

let locContent = fs.readFileSync(localizationPath, 'utf8');

// Replace targetKeys that don't have ownerTypes yet or have generic ones
// targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: 'Collapse' },
for (const [name, types] of Object.entries(nameToOwnerMap)) {
    const typesStr = JSON.stringify(types).replace(/"/g, "'").replace(/,/g, ', ');
    const regex = new RegExp(`targetKey:\\s*{\\s*domain:\\s*'datawindow-functions',\\s*kind:\\s*'callable',\\s*namespace:\\s*'datawindow',\\s*invocation:\\s*'member',\\s*name:\\s*'${name}'\\s*},`, 'g');
    
    if (locContent.match(regex)) {
        locContent = locContent.replace(regex, `targetKey: { domain: 'datawindow-functions', kind: 'callable', namespace: 'datawindow', invocation: 'member', name: '${name}', ownerTypes: ${typesStr} },`);
    }
}

fs.writeFileSync(localizationPath, locContent);
console.log('Localization file updated.');
