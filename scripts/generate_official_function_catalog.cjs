'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const outDir = path.join(repoRoot, 'src/server/knowledge/system');

const {
    listSystemDataWindowFunctions,
    listSystemGlobalFunctions,
    listSystemObjectFunctions,
    listSystemSymbolsByDataset,
} = require(path.join(repoRoot, 'out/server/knowledge/system/services/queryService.js'));

const {
    normalizeSystemSymbolName,
} = require(path.join(repoRoot, 'out/server/knowledge/system/normalization.js'));

const {
    unique,
    fetchText,
    mapConcurrent,
} = require('./catalog-generator/utils.cjs');

const {
    POWERSCRIPT_INDEX_URL,
    POWERSCRIPT_RESERVED_WORDS_URL,
    POWERSCRIPT_STATEMENTS_URL,
    POWERSCRIPT_ENUMERATED_DATATYPES_URL,
    POWERSCRIPT_STANDARD_DATATYPES_URL,
    OBJECTS_AND_CONTROLS_INDEX_URL,
    OBJECTS_AND_CONTROLS_UNDOCUMENTED_BASE_CLASSES_URL,
    DATAWINDOW_OWNER_TYPES,
} = require('./catalog-generator/constants.cjs');

const {
    sortGeneratedEntries,
    mergeGeneratedEntries,
    buildGeneratedEntry,
    buildGeneratedEnumeratedTypeEntry,
    buildGeneratedEnumeratedValueEntry,
} = require('./catalog-generator/processor.cjs');

const {
    renderCatalogFile,
    renderProvenanceFile,
} = require('./catalog-generator/renderers.cjs');

const {
    parsePowerScriptPage,
    parsePowerScriptStatementPage,
    parsePowerScriptReservedWordPage,
    buildGeneratedReservedWordEntry,
    buildStatementLookupAliases,
} = require('./catalog-generator/parsers/powerscript-parser.cjs');

const {
    parseDataWindowPage,
    loadDataWindowMethodPageUrls,
    loadDataWindowConstantReferences,
} = require('./catalog-generator/parsers/datawindow-parser.cjs');

const {
    parsePowerScriptEventPage,
    loadPowerScriptEventLinks,
} = require('./catalog-generator/parsers/event-parser.cjs');

const {
    parseOfficialSystemObjectDatatypePage,
    parseOfficialSystemObjectDatatypeEntries,
    parseUndocumentedBaseClassEntries,
} = require('./catalog-generator/parsers/system-object-parser.cjs');

const {
    parsePowerScriptEnumeratedDatatypeConcept,
    parseDataWindowConstantPage,
} = require('./catalog-generator/parsers/enum-parser.cjs');

const {
    buildCoverageMap,
    buildLookupCoverageSet,
    registerCoverage,
    getUncoveredOwnerTypes,
} = require('./catalog-generator/coverage.cjs');

const {
    buildOfficialKeywordCategoryMap,
    buildControlOwnerUniverse,
} = require('./catalog-generator/collectors.cjs');

const {
    filterAppliesToLabels,
} = require('./catalog-generator/helpers.cjs');

async function main() {
    const generateCompleteCatalog = process.argv.includes('--full');
    const isDryRun = process.argv.includes('--dry-run');
    const noFetch = process.argv.includes('--no-fetch');

    console.log(`Iniciando generación del catálogo oficial${generateCompleteCatalog ? ' COMPLETO' : ''}...`);

    const manualGlobalEntries = listSystemGlobalFunctions();
    const manualObjectEntries = listSystemObjectFunctions();
    const manualDataWindowEntries = listSystemDataWindowFunctions();
    const manualKeywordEntries = listSystemSymbolsByDataset('keywords');
    const manualReservedWordEntries = listSystemSymbolsByDataset('reserved-words');
    const manualDatatypeEntries = listSystemSymbolsByDataset('standard-datatypes');
    const manualSystemTypeEntries = listSystemSymbolsByDataset('system-object-datatypes');
    const manualSystemEventEntries = listSystemSymbolsByDataset('system-events');
    const manualStatementEntries = listSystemSymbolsByDataset('statements');

    const [
        officialPowerScriptHrefs,
        officialReservedWordEntries,
        officialStatementHrefs,
        officialEventLinks,
        officialDataWindowMethodReferences,
        officialDataWindowConstantReferences,
        officialSystemObjectDatatypeEntries,
        officialUndocumentedBaseClassEntries,
    ] = await Promise.all([
        noFetch ? [] : fetchText(POWERSCRIPT_INDEX_URL).then(html => unique([...html.matchAll(/<dt><span class="section"><a href="([^"]+\.html)"/g)].map(match => match[1]))),
        noFetch ? [] : fetchText(POWERSCRIPT_RESERVED_WORDS_URL).then(html => parsePowerScriptReservedWordPage(html, POWERSCRIPT_RESERVED_WORDS_URL)),
        noFetch ? [] : fetchText(POWERSCRIPT_STATEMENTS_URL).then(html => unique([...html.matchAll(/<dt><span class="section"><a href="([^"]+\.html)"/g)].map(match => match[1]))),
        noFetch ? [] : loadPowerScriptEventLinks(),
        noFetch ? [] : loadDataWindowMethodPageUrls(),
        noFetch ? [] : loadDataWindowConstantReferences(),
        noFetch ? [] : fetchText(OBJECTS_AND_CONTROLS_INDEX_URL).then(parseOfficialSystemObjectDatatypeEntries),
        noFetch ? [] : fetchText(OBJECTS_AND_CONTROLS_UNDOCUMENTED_BASE_CLASSES_URL).then(parseUndocumentedBaseClassEntries),
    ]);

    const parsedPowerScriptPages = (await mapConcurrent(officialPowerScriptHrefs, 20, async href => {
        const url = new URL(href, POWERSCRIPT_INDEX_URL).toString();
        const html = await fetchText(url);
        return parsePowerScriptPage(html, url);
    })).flat();

    const parsedStatementPages = (await mapConcurrent(officialStatementHrefs, 20, async href => {
        const url = new URL(href, POWERSCRIPT_STATEMENTS_URL).toString();
        const html = await fetchText(url);
        return parsePowerScriptStatementPage(html, url);
    })).filter(Boolean);

    const parsedPowerScriptEventPages = (await mapConcurrent(officialEventLinks, 20, async link => {
        const html = await fetchText(link.url);
        return parsePowerScriptEventPage(html, link.url, { obsolete: link.obsolete });
    })).flat();

    const parsedDataWindowPages = await mapConcurrent(officialDataWindowMethodReferences, 20, async reference => {
        const html = await fetchText(reference.url);
        return parseDataWindowPage(html, reference.url, reference.chapterTitle);
    });

    const parsedSystemObjectDatatypePages = await mapConcurrent(
        [...officialSystemObjectDatatypeEntries, ...officialUndocumentedBaseClassEntries],
        20,
        async entry => {
            if (!entry.sourceUrl || entry.sourceUrl === OBJECTS_AND_CONTROLS_UNDOCUMENTED_BASE_CLASSES_URL) return entry;
            const html = await fetchText(entry.sourceUrl);
            return parseOfficialSystemObjectDatatypePage(html, entry);
        }
    );

    const objectOwnerUniverse = unique([
        ...manualObjectEntries.flatMap(entry => entry.normalizedOwnerTypes ?? []),
        ...parsedPowerScriptPages.filter(e => !e.isGlobal && e.ownerInfo.ownerScope === 'specific').flatMap(e => e.ownerInfo.ownerTypes),
        ...parsedPowerScriptEventPages.filter(e => e.ownerInfo.ownerScope === 'specific').flatMap(e => e.ownerInfo.ownerTypes),
    ]).sort();
    const controlOwnerUniverse = buildControlOwnerUniverse(objectOwnerUniverse);

    const globalCoverage = buildCoverageMap(manualGlobalEntries, 'global-functions');
    const objectCoverage = buildCoverageMap(manualObjectEntries, 'object-functions');
    const dataWindowCoverage = buildCoverageMap(manualDataWindowEntries, 'datawindow-functions');
    const keywordCoverage = buildLookupCoverageSet(manualKeywordEntries);
    const reservedWordCoverage = buildLookupCoverageSet(manualReservedWordEntries);
    const systemEventCoverage = buildCoverageMap(manualSystemEventEntries, 'system-events');
    const statementCoverage = buildCoverageMap(manualStatementEntries, 'statements');
    const officialKeywordCategoryMap = buildOfficialKeywordCategoryMap(manualKeywordEntries);

    const generatedGlobalEntries = [];
    const generatedKeywordEntries = [];
    const generatedObjectEntries = [];
    const generatedReservedWordEntries = [];
    const generatedEventEntries = [];
    const generatedStatementEntries = [];

    for (const entry of officialReservedWordEntries) {
        const normalizedName = normalizeSystemSymbolName(entry.name);
        if (!normalizedName) continue;
        const keywordCategory = officialKeywordCategoryMap.get(normalizedName);
        if (keywordCategory) {
            if (generateCompleteCatalog || !keywordCoverage.has(normalizedName)) {
                generatedKeywordEntries.push(buildGeneratedReservedWordEntry(entry));
            }
        } else {
            if (generateCompleteCatalog || !reservedWordCoverage.has(normalizedName)) {
                generatedReservedWordEntries.push(buildGeneratedReservedWordEntry(entry));
            }
        }
    }

    for (const entry of sortGeneratedEntries(parsedPowerScriptPages.filter(e => e.isGlobal))) {
        const normalizedName = normalizeSystemSymbolName(entry.name);
        if (!normalizedName || (!generateCompleteCatalog && globalCoverage.has(`global-functions|${normalizedName}`))) continue;
        generatedGlobalEntries.push(buildGeneratedEntry(entry, [], []));
        registerCoverage(globalCoverage, 'global-functions', entry.name, []);
    }

    for (const entry of sortGeneratedEntries(parsedPowerScriptPages.filter(e => !e.isGlobal))) {
        const fallbackUniverse = entry.ownerInfo.ownerScope === 'all-controls' ? controlOwnerUniverse : objectOwnerUniverse;
        const selectedOwnerTypes = generateCompleteCatalog ? entry.ownerInfo.ownerTypes : getUncoveredOwnerTypes(objectCoverage, 'object-functions', entry.name, entry.ownerInfo.ownerTypes, fallbackUniverse);
        if (selectedOwnerTypes.length === 0) continue;
        generatedObjectEntries.push(buildGeneratedEntry(entry, selectedOwnerTypes, filterAppliesToLabels(entry.ownerInfo, selectedOwnerTypes)));
        registerCoverage(objectCoverage, 'object-functions', entry.name, selectedOwnerTypes);
    }

    for (const entry of sortGeneratedEntries(parsedDataWindowPages)) {
        const selectedOwnerTypes = generateCompleteCatalog ? entry.ownerInfo.ownerTypes : getUncoveredOwnerTypes(dataWindowCoverage, 'datawindow-functions', entry.name, entry.ownerInfo.ownerTypes, []);
        if (selectedOwnerTypes.length === 0) continue;
        generatedObjectEntries.push(buildGeneratedEntry(entry, selectedOwnerTypes, filterAppliesToLabels(entry.ownerInfo, selectedOwnerTypes)));
    }

    for (const entry of sortGeneratedEntries(parsedPowerScriptEventPages)) {
        const fallbackUniverse = entry.ownerInfo.ownerScope === 'all-controls' ? controlOwnerUniverse : objectOwnerUniverse;
        const selectedOwnerTypes = generateCompleteCatalog ? entry.ownerInfo.ownerTypes : getUncoveredOwnerTypes(systemEventCoverage, 'system-events', entry.name, entry.ownerInfo.ownerTypes, fallbackUniverse);
        if (selectedOwnerTypes.length === 0) continue;
        generatedEventEntries.push(buildGeneratedEntry(entry, selectedOwnerTypes, filterAppliesToLabels(entry.ownerInfo, selectedOwnerTypes)));
    }

    for (const entry of sortGeneratedEntries(parsedStatementPages)) {
        const normalizedName = normalizeSystemSymbolName(entry.name);
        if (!normalizedName || (!generateCompleteCatalog && statementCoverage.has(`statements|${normalizedName}`))) continue;
        generatedStatementEntries.push({ ...entry, category: 'Referencia oficial', lookupAliases: buildStatementLookupAliases(entry.name) });
    }

    if (!isDryRun) {
        const timestamp = new Date().toISOString();
        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(path.join(outDir, 'generated.generated.ts'), renderCatalogFile(
            mergeGeneratedEntries(generatedGlobalEntries),
            { entries: mergeGeneratedEntries(generatedObjectEntries), __keywords__: mergeGeneratedEntries(generatedKeywordEntries), __reservedWords__: mergeGeneratedEntries(generatedReservedWordEntries) },
            [], // datatypes
            [], // datawindow
            parsedSystemObjectDatatypePages,
            mergeGeneratedEntries(generatedEventEntries),
            mergeGeneratedEntries(generatedStatementEntries)
        ));
        await fs.writeFile(path.join(outDir, 'provenance.generated.ts'), renderProvenanceFile(timestamp));
        console.log('Catálogo generado con éxito.');
    } else {
        console.log('Modo Dry Run completado sin errores.');
    }
}

main().catch(error => {
    console.error('Error crítico:', error);
    process.exit(1);
});