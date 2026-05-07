'use strict';

const { normalizeSystemSymbolName } = require('../../out/server/knowledge/system/normalization.js');
const { unique } = require('./utils.cjs');

function sortGeneratedEntries(entries) {
    return [...entries].sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

function mergeTextValue(left, right) {
    if (!left) {
        return right;
    }

    if (!right || left === right) {
        return left;
    }

    return `${left} ${right}`;
}

function mergeCompatibleValue(left, right) {
    if (!left) {
        return right;
    }

    if (!right || left === right) {
        return left;
    }

    return undefined;
}

function mergeUniqueStringValues(left, right) {
    const merged = unique([...(left ?? []), ...(right ?? [])]);
    return merged.length > 0 ? merged : undefined;
}

function mergeUniqueStructuredValues(left, right) {
    const merged = [];
    const seen = new Set();

    for (const value of [...(left ?? []), ...(right ?? [])]) {
        const key = JSON.stringify(value);

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        merged.push(value);
    }

    return merged.length > 0 ? merged : undefined;
}

function buildGeneratedMergeKey(entry) {
    const normalizedName = normalizeSystemSymbolName(entry.name) ?? entry.name.toLowerCase();
    const ownerTypes = [...(entry.ownerTypes ?? [])].sort().join('+');
    const enumValueOf = normalizeSystemSymbolName(entry.enumValueOf ?? '') ?? '';

    return [
        normalizedName,
        ownerTypes,
        enumValueOf,
        entry.eventId ?? '',
        entry.identifierPolicy ?? '',
    ].join('|');
}

function mergeGeneratedEntries(entries) {
    const byKey = new Map();

    for (const entry of entries) {
        const key = buildGeneratedMergeKey(entry);
        const current = byKey.get(key);

        if (!current) {
            byKey.set(key, {
                ...entry,
                allowedInParameters: entry.allowedInParameters ? [...entry.allowedInParameters] : undefined,
                allowedOnOwners: entry.allowedOnOwners ? [...entry.allowedOnOwners] : undefined,
                allowedOnProperties: entry.allowedOnProperties ? [...entry.allowedOnProperties] : undefined,
                appliesTo: entry.appliesTo ? [...entry.appliesTo] : undefined,
                enumValues: entry.enumValues ? [...entry.enumValues] : undefined,
                eventIds: entry.eventIds ? [...entry.eventIds] : undefined,
                events: entry.events ? [...entry.events] : undefined,
                functions: entry.functions ? [...entry.functions] : undefined,
                lookupAliases: entry.lookupAliases ? [...entry.lookupAliases] : undefined,
                ownerTypes: entry.ownerTypes ? [...entry.ownerTypes] : undefined,
                properties: entry.properties ? [...entry.properties] : undefined,
                signatures: entry.signatures ? [...entry.signatures] : undefined,
                usageNotes: entry.usageNotes ? [...entry.usageNotes] : undefined,
            });
            continue;
        }

        current.summary = mergeTextValue(current.summary, entry.summary);
        current.documentation = mergeTextValue(current.documentation, entry.documentation);
        current.returnDocumentation = mergeTextValue(current.returnDocumentation, entry.returnDocumentation);
        current.returnType = mergeCompatibleValue(current.returnType, entry.returnType);
        current.baseType = mergeCompatibleValue(current.baseType, entry.baseType);
        current.enumNumericValue = mergeCompatibleValue(current.enumNumericValue, entry.enumNumericValue);
        current.enumValueMeaning = mergeTextValue(current.enumValueMeaning, entry.enumValueMeaning);
        current.sourceUrl = current.sourceUrl ?? entry.sourceUrl;
        current.obsolete = current.obsolete || entry.obsolete === true;
        current.obsoleteMessage = mergeTextValue(current.obsoleteMessage, entry.obsoleteMessage);
        current.replacement = current.replacement ?? entry.replacement;
        current.reservedWordCanBeFunctionName = current.reservedWordCanBeFunctionName ?? entry.reservedWordCanBeFunctionName;
        current.identifierPolicy = current.identifierPolicy ?? entry.identifierPolicy;
        current.risk = current.risk ?? entry.risk;
        current.appliesTo = mergeUniqueStringValues(current.appliesTo, entry.appliesTo);
        current.ownerTypes = mergeUniqueStringValues(current.ownerTypes, entry.ownerTypes);
        current.properties = mergeUniqueStringValues(current.properties, entry.properties);
        current.functions = mergeUniqueStringValues(current.functions, entry.functions);
        current.events = mergeUniqueStringValues(current.events, entry.events);
        current.enumValues = mergeUniqueStringValues(current.enumValues, entry.enumValues);
        current.allowedOnOwners = mergeUniqueStringValues(current.allowedOnOwners, entry.allowedOnOwners);
        current.allowedOnProperties = mergeUniqueStringValues(current.allowedOnProperties, entry.allowedOnProperties);
        current.allowedInParameters = mergeUniqueStringValues(current.allowedInParameters, entry.allowedInParameters);
        current.lookupAliases = mergeUniqueStringValues(current.lookupAliases, entry.lookupAliases);
        current.usageNotes = mergeUniqueStringValues(current.usageNotes, entry.usageNotes);
        current.eventIds = mergeUniqueStructuredValues(current.eventIds, entry.eventIds);
        current.signatures = mergeUniqueStructuredValues(current.signatures, entry.signatures);
    }

    return sortGeneratedEntries(Array.from(byKey.values()));
}

function buildGeneratedEntry(baseEntry, ownerTypes, appliesTo) {
    return {
        appliesTo,
        category: 'Referencia oficial',
        eventId: baseEntry.eventId,
        eventIds: baseEntry.eventIds,
        lookupAliases: baseEntry.lookupAliases,
        name: baseEntry.name,
        obsolete: baseEntry.obsolete,
        obsoleteMessage: baseEntry.obsoleteMessage,
        ownerTypes: ownerTypes.length > 0 ? ownerTypes : undefined,
        replacement: baseEntry.replacement,
        returnDocumentation: baseEntry.returnDocumentation,
        returnType: baseEntry.returnType,
        risk: baseEntry.risk,
        signatures: baseEntry.signatures,
        sourceUrl: baseEntry.sourceUrl,
        summary: baseEntry.description || `Official generated coverage for ${baseEntry.name}.`,
        usageNotes: baseEntry.usageNotes,
    };
}

function buildGeneratedEnumeratedTypeEntry(entry) {
    return {
        allowedInParameters: entry.allowedInParameters,
        allowedOnOwners: entry.allowedOnOwners,
        allowedOnProperties: entry.allowedOnProperties,
        category: entry.category,
        documentation: entry.documentation,
        enumValues: entry.enumValues,
        name: entry.name,
        obsolete: entry.obsolete,
        obsoleteMessage: entry.obsoleteMessage,
        replacement: entry.replacement,
        signatures: [{ label: entry.name }],
        sourceUrl: entry.sourceUrl,
        summary: entry.summary,
    };
}

function buildGeneratedEnumeratedValueEntry(entry) {
    return {
        allowedInParameters: entry.allowedInParameters,
        allowedOnOwners: entry.allowedOnOwners,
        allowedOnProperties: entry.allowedOnProperties,
        category: entry.category,
        enumNumericValue: entry.enumNumericValue,
        enumValueMeaning: entry.enumValueMeaning,
        enumValueOf: entry.enumValueOf,
        name: entry.name,
        obsolete: entry.obsolete,
        obsoleteMessage: entry.obsoleteMessage,
        replacement: entry.replacement,
        signatures: [{ label: entry.name }],
        sourceUrl: entry.sourceUrl,
        summary: entry.summary,
    };
}

module.exports = {
    sortGeneratedEntries,
    mergeGeneratedEntries,
    buildGeneratedEntry,
    buildGeneratedEnumeratedTypeEntry,
    buildGeneratedEnumeratedValueEntry,
};
