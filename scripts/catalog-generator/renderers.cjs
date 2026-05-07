'use strict';

function renderString(value) {
    return JSON.stringify(value);
}

function renderStringArray(values) {
    return `[${values.map(renderString).join(', ')}]`;
}

function renderSignatureParameters(parameters) {
    return `[${parameters.map(parameter => {
        const properties = [
            `label: ${renderString(parameter.label)}`,
            parameter.documentation ? `documentation: ${renderString(parameter.documentation)}` : undefined,
        ].filter(Boolean);

        return `{ ${properties.join(', ')} }`;
    }).join(', ')}]`;
}

function renderEventIds(eventIds) {
    return `[${eventIds.map(eventId => {
        const properties = [
            `id: ${renderString(eventId.id)}`,
            eventId.ownerTypes?.length ? `ownerTypes: ${renderStringArray(eventId.ownerTypes)}` : undefined,
        ].filter(Boolean);

        return `{ ${properties.join(', ')} }`;
    }).join(', ')}]`;
}

function renderSignatures(signatures) {
    return `[${signatures.map(signature => {
        const properties = [
            `label: ${renderString(signature.label)}`,
            signature.documentation ? `documentation: ${renderString(signature.documentation)}` : undefined,
            signature.parameters?.length ? `parameters: ${renderSignatureParameters(signature.parameters)}` : undefined,
            signature.returnType ? `returnType: ${renderString(signature.returnType)}` : undefined,
        ].filter(Boolean);

        return `{ ${properties.join(', ')} }`;
    }).join(', ')}]`;
}

function renderBuilderCall(builderName, entry) {
    const properties = [
        `name: ${renderString(entry.name)}`,
        `category: ${renderString(entry.category)}`,
        `summary: ${renderString(entry.summary)}`,
        `signatures: ${renderSignatures(entry.signatures)}`,
        entry.documentation ? `documentation: ${renderString(entry.documentation)}` : undefined,
        entry.returnType ? `returnType: ${renderString(entry.returnType)}` : undefined,
        entry.returnDocumentation ? `returnDocumentation: ${renderString(entry.returnDocumentation)}` : undefined,
        entry.usageNotes?.length ? `usageNotes: ${renderStringArray(entry.usageNotes)}` : undefined,
        entry.baseType ? `baseType: ${renderString(entry.baseType)}` : undefined,
        entry.properties?.length ? `properties: ${renderStringArray(entry.properties)}` : undefined,
        entry.functions?.length ? `functions: ${renderStringArray(entry.functions)}` : undefined,
        entry.events?.length ? `events: ${renderStringArray(entry.events)}` : undefined,
        entry.appliesTo?.length ? `appliesTo: ${renderStringArray(entry.appliesTo)}` : undefined,
        entry.ownerTypes?.length ? `ownerTypes: ${renderStringArray(entry.ownerTypes)}` : undefined,
        entry.enumValues?.length ? `enumValues: ${renderStringArray(entry.enumValues)}` : undefined,
        entry.enumValueOf ? `enumValueOf: ${renderString(entry.enumValueOf)}` : undefined,
        entry.enumNumericValue !== undefined ? `enumNumericValue: ${entry.enumNumericValue}` : undefined,
        entry.enumValueMeaning ? `enumValueMeaning: ${renderString(entry.enumValueMeaning)}` : undefined,
        entry.allowedOnOwners?.length ? `allowedOnOwners: ${renderStringArray(entry.allowedOnOwners)}` : undefined,
        entry.allowedOnProperties?.length ? `allowedOnProperties: ${renderStringArray(entry.allowedOnProperties)}` : undefined,
        entry.allowedInParameters?.length ? `allowedInParameters: ${renderStringArray(entry.allowedInParameters)}` : undefined,
        entry.lookupAliases?.length ? `lookupAliases: ${renderStringArray(entry.lookupAliases)}` : undefined,
        entry.obsolete ? 'obsolete: true' : undefined,
        entry.obsoleteMessage ? `obsoleteMessage: ${renderString(entry.obsoleteMessage)}` : undefined,
        entry.replacement ? `replacement: ${renderString(entry.replacement)}` : undefined,
        entry.eventId ? `eventId: ${renderString(entry.eventId)}` : undefined,
        entry.eventIds?.length ? `eventIds: ${renderEventIds(entry.eventIds)}` : undefined,
        entry.reservedWordCanBeFunctionName !== undefined
            ? `reservedWordCanBeFunctionName: ${entry.reservedWordCanBeFunctionName ? 'true' : 'false'}`
            : undefined,
        entry.identifierPolicy ? `identifierPolicy: ${renderString(entry.identifierPolicy)}` : undefined,
        entry.risk ? `risk: ${renderString(entry.risk)}` : undefined,
        `sourceUrl: ${renderString(entry.sourceUrl)}`,
    ].filter(Boolean);

    return `    ${builderName}({ ${properties.join(', ')} }),`;
}

function renderCatalogFile(globalEntries, objectEntries, dataTypeEntries, dataWindowEntries, systemTypeEntries, eventEntries, statementEntries) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        "import { PbSystemSymbolEntry } from '../types';",
        "import { generatedDataWindowFunction, generatedDatatype, generatedEvent, generatedGlobalFunction, generatedKeyword, generatedObjectFunction, generatedReservedWord, generatedStatement, generatedSystemObjectDatatype } from './common';",
        '',
        'export const PB_GENERATED_GLOBAL_FUNCTIONS: readonly PbSystemSymbolEntry[] = [',
        ...globalEntries.map(entry => renderBuilderCall('generatedGlobalFunction', entry)),
        '];',
        '',
        'export const PB_GENERATED_KEYWORDS: readonly PbSystemSymbolEntry[] = [',
        ...objectEntries.__keywords__.map(entry => renderBuilderCall('generatedKeyword', entry)),
        '];',
        '',
        'export const PB_GENERATED_RESERVED_WORDS: readonly PbSystemSymbolEntry[] = [',
        ...objectEntries.__reservedWords__.map(entry => renderBuilderCall('generatedReservedWord', entry)),
        '];',
        '',
        'export const PB_GENERATED_DATATYPES: readonly PbSystemSymbolEntry[] = [',
        ...dataTypeEntries.map(entry => renderBuilderCall('generatedDatatype', entry)),
        '];',
        '',
        'export const PB_GENERATED_OBJECT_FUNCTIONS: readonly PbSystemSymbolEntry[] = [',
        ...objectEntries.entries.map(entry => renderBuilderCall('generatedObjectFunction', entry)),
        '];',
        '',
        'export const PB_GENERATED_DATAWINDOW_FUNCTIONS: readonly PbSystemSymbolEntry[] = [',
        ...dataWindowEntries.map(entry => renderBuilderCall('generatedDataWindowFunction', entry)),
        '];',
        '',
        'export const PB_GENERATED_SYSTEM_OBJECT_DATATYPES: readonly PbSystemSymbolEntry[] = [',
        ...systemTypeEntries.map(entry => renderBuilderCall('generatedSystemObjectDatatype', entry)),
        '];',
        '',
        'export const PB_GENERATED_EVENTS: readonly PbSystemSymbolEntry[] = [',
        ...eventEntries.map(entry => renderBuilderCall('generatedEvent', entry)),
        '];',
        '',
        'export const PB_GENERATED_STATEMENTS: readonly PbSystemSymbolEntry[] = [',
        ...statementEntries.map(entry => renderBuilderCall('generatedStatement', entry)),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderBuiltInTypesFile(typeNames) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        'export const PB_GENERATED_BUILTIN_TYPES: readonly string[] = [',
        ...typeNames.map(typeName => `    ${renderString(typeName)},`),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderKeywordLexemesFile(lexemes) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        'export const PB_GENERATED_KEYWORD_LEXEMES: readonly string[] = [',
        ...lexemes.map(lexeme => `    ${renderString(lexeme)},`),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderOwnerTypesFile(ownerTypes) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        'export const PB_GENERATED_OBJECT_OWNER_TYPES_EXTENDED: readonly string[] = [',
        ...ownerTypes.map(ownerType => `    ${renderString(ownerType)},`),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderProvenanceFile(generatedAt) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        `export const PB_GENERATED_CATALOG_GENERATED_AT = ${renderString(generatedAt)};`,
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderCoverageFile(exportName, coverageByDomain) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        `export const ${exportName} = {`,
    ];

    for (const [domain, coverage] of Object.entries(coverageByDomain)) {
        lines.push(`    ${renderString(domain)}: {`);
        lines.push(`        measurement: ${renderString(coverage.measurement)},`);
        lines.push(`        officialCount: ${coverage.officialCount},`);
        lines.push(`        coveredCount: ${coverage.coveredCount},`);
        lines.push(`        missingCount: ${coverage.missingCount},`);
        if (coverage.missingUnits.length > 0) {
            lines.push(`        missingUnits: ${renderStringArray(coverage.missingUnits)},`);
        }
        lines.push('    },');
    }

    lines.push('} as const;');
    lines.push('');

    return `${lines.join('\n')}\n`;
}

function renderOfficialCoverageFile(coverageByDomain) {
    return renderCoverageFile('PB_GENERATED_OFFICIAL_COVERAGE', coverageByDomain);
}

function renderGeneratedCompletenessFile(generationMode, coverageByDomain) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        `export const PB_GENERATED_COMPLETENESS_MODE = ${renderString(generationMode)};`,
        '',
        'export const PB_GENERATED_COMPLETENESS = {',
    ];

    for (const [domain, coverage] of Object.entries(coverageByDomain)) {
        lines.push(`    ${renderString(domain)}: {`);
        lines.push(`        measurement: ${renderString(coverage.measurement)},`);
        lines.push(`        officialCount: ${coverage.officialCount},`);
        lines.push(`        coveredCount: ${coverage.coveredCount},`);
        lines.push(`        missingCount: ${coverage.missingCount},`);
        if (coverage.missingUnits.length > 0) {
            lines.push(`        missingUnits: ${renderStringArray(coverage.missingUnits)},`);
        }
        lines.push('    },');
    }

    lines.push('} as const;');
    lines.push('');

    return `${lines.join('\n')}\n`;
}

function renderEnumeratedCoverageFile(coverageByDomain) {
    return renderCoverageFile('PB_GENERATED_ENUMERATED_COVERAGE', coverageByDomain);
}

function renderEnumeratedTypesFile(entries) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        "import { PbSystemSymbolEntry } from '../types';",
        "import { generatedEnumeratedType } from './common';",
        '',
        'export const PB_GENERATED_ENUMERATED_TYPES: readonly PbSystemSymbolEntry[] = [',
        ...entries.map(entry => renderBuilderCall('generatedEnumeratedType', entry)),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderEnumeratedValuesFile(entries) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        "import { PbSystemSymbolEntry } from '../types';",
        "import { generatedEnumeratedValue } from './common';",
        '',
        'export const PB_GENERATED_ENUMERATED_VALUES: readonly PbSystemSymbolEntry[] = [',
        ...entries.map(entry => renderBuilderCall('generatedEnumeratedValue', entry)),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderEnumeratedProvenanceFile(provenance) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        'export const PB_GENERATED_ENUMERATED_PROVENANCE = {',
        `    generatedAt: ${renderString(provenance.generatedAt)},`,
        `    version: ${renderString(provenance.version)},`,
        '    sources: {',
        `        concept: ${renderString(provenance.sources.concept)},`,
        `        datawindowConstants: ${renderString(provenance.sources.datawindowConstants)},`,
        `        objectsAndControlsProperties: ${renderString(provenance.sources.objectsAndControlsProperties)},`,
        '    },',
        `    officialTypeCount: ${provenance.officialTypeCount},`,
        `    officialValueCount: ${provenance.officialValueCount},`,
        '} as const;',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

module.exports = {
    renderBuilderCall,
    renderCatalogFile,
    renderBuiltInTypesFile,
    renderKeywordLexemesFile,
    renderOwnerTypesFile,
    renderProvenanceFile,
    renderOfficialCoverageFile,
    renderGeneratedCompletenessFile,
    renderEnumeratedCoverageFile,
    renderEnumeratedTypesFile,
    renderEnumeratedValuesFile,
    renderEnumeratedProvenanceFile,
};
