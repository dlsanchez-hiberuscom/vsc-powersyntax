'use strict';

const { normalizeSystemSymbolName } = require('../../out/server/knowledge/system/normalization.js');
const { unique } = require('./utils.cjs');
const { NON_CONTROL_OBJECT_OWNER_TYPES, DATAWINDOW_OWNER_TYPES } = require('./constants.cjs');

function collectOfficialEnumeratedTypeUnits(bundles) {
    const byType = new Map();

    for (const bundle of bundles) {
        const normalizedTypeName = normalizeSystemSymbolName(bundle.typeName);

        if (!normalizedTypeName) {
            continue;
        }

        const current = byType.get(normalizedTypeName) ?? {
            allowedInParameters: new Set(),
            allowedOnOwners: new Set(),
            allowedOnProperties: new Set(),
            category: bundle.category,
            documentation: bundle.documentation,
            enumValues: new Set(),
            name: bundle.typeName,
            obsolete: false,
            obsoleteMessage: undefined,
            replacement: undefined,
            sourceUrl: bundle.sourceUrl,
            summary: bundle.summary,
        };

        if (!current.documentation && bundle.documentation) {
            current.documentation = bundle.documentation;
        }

        if (!current.summary && bundle.summary) {
            current.summary = bundle.summary;
        }

        if (!current.sourceUrl && bundle.sourceUrl) {
            current.sourceUrl = bundle.sourceUrl;
        }

        current.obsolete = current.obsolete || bundle.obsolete === true;
        current.obsoleteMessage = current.obsoleteMessage ?? bundle.obsoleteMessage;
        current.replacement = current.replacement ?? bundle.replacement;

        for (const value of bundle.allowedOnOwners ?? []) {
            current.allowedOnOwners.add(value);
        }

        for (const value of bundle.allowedOnProperties ?? []) {
            current.allowedOnProperties.add(value);
        }

        for (const value of bundle.allowedInParameters ?? []) {
            current.allowedInParameters.add(value);
        }

        for (const value of bundle.values ?? []) {
            current.enumValues.add(value.name);
        }

        byType.set(normalizedTypeName, current);
    }

    return Array.from(byType.values())
        .map(entry => ({
            allowedInParameters: entry.allowedInParameters.size > 0
                ? Array.from(entry.allowedInParameters).sort()
                : undefined,
            allowedOnOwners: entry.allowedOnOwners.size > 0
                ? Array.from(entry.allowedOnOwners).sort()
                : undefined,
            allowedOnProperties: entry.allowedOnProperties.size > 0
                ? Array.from(entry.allowedOnProperties).sort()
                : undefined,
            category: entry.category,
            documentation: entry.documentation,
            enumValues: entry.enumValues.size > 0
                ? Array.from(entry.enumValues).sort()
                : undefined,
            name: entry.name,
            obsolete: entry.obsolete,
            obsoleteMessage: entry.obsoleteMessage,
            replacement: entry.replacement,
            sourceUrl: entry.sourceUrl,
            summary: entry.summary,
        }));
}

function collectOfficialEnumeratedValueUnits(bundles) {
    const byKey = new Map();

    for (const bundle of bundles) {
        const normalizedTypeName = normalizeSystemSymbolName(bundle.typeName);

        if (!normalizedTypeName) {
            continue;
        }

        for (const value of bundle.values ?? []) {
            const normalizedValueName = normalizeSystemSymbolName(value.name);

            if (!normalizedValueName) {
                continue;
            }

            const key = `${normalizedTypeName}|${normalizedValueName}`;
            const current = byKey.get(key) ?? {
                allowedInParameters: new Set(),
                allowedOnOwners: new Set(),
                allowedOnProperties: new Set(),
                category: bundle.category,
                enumNumericValue: value.enumNumericValue,
                enumValueMeaning: value.enumValueMeaning,
                enumValueOf: bundle.typeName,
                name: value.name,
                obsolete: false,
                obsoleteMessage: undefined,
                replacement: undefined,
                sourceUrl: value.sourceUrl,
                summary: value.enumValueMeaning || `Valor enumerado oficial ${value.name} del datatype ${bundle.typeName}.`,
            };

            current.obsolete = current.obsolete || value.obsolete === true;
            current.enumNumericValue = current.enumNumericValue ?? value.enumNumericValue;
            current.enumValueMeaning = current.enumValueMeaning ?? value.enumValueMeaning;

            if (!current.summary && value.enumValueMeaning) {
                current.summary = value.enumValueMeaning;
            }

            for (const ownerType of bundle.allowedOnOwners ?? []) {
                current.allowedOnOwners.add(ownerType);
            }

            for (const propertyName of bundle.allowedOnProperties ?? []) {
                current.allowedOnProperties.add(propertyName);
            }

            for (const parameterName of bundle.allowedInParameters ?? []) {
                current.allowedInParameters.add(parameterName);
            }

            byKey.set(key, current);
        }
    }

    return Array.from(byKey.values())
        .map(entry => ({
            allowedInParameters: entry.allowedInParameters.size > 0
                ? Array.from(entry.allowedInParameters).sort()
                : undefined,
            allowedOnOwners: entry.allowedOnOwners.size > 0
                ? Array.from(entry.allowedOnOwners).sort()
                : undefined,
            allowedOnProperties: entry.allowedOnProperties.size > 0
                ? Array.from(entry.allowedOnProperties).sort()
                : undefined,
            category: entry.category,
            enumNumericValue: entry.enumNumericValue,
            enumValueMeaning: entry.enumValueMeaning,
            enumValueOf: entry.enumValueOf,
            name: entry.name,
            obsolete: entry.obsolete,
            obsoleteMessage: entry.obsoleteMessage,
            replacement: entry.replacement,
            sourceUrl: entry.sourceUrl,
            summary: entry.summary,
        }));
}

function buildOfficialKeywordCategoryMap(manualKeywordEntries) {
    const categoryMap = new Map();

    for (const entry of manualKeywordEntries) {
        const normalizedName = normalizeSystemSymbolName(entry.name);

        if (normalizedName) {
            categoryMap.set(normalizedName, entry.category);
        }
    }

    return categoryMap;
}

function buildControlOwnerUniverse(objectOwnerUniverse) {
    return objectOwnerUniverse.filter(ownerType => {
        const normalized = ownerType.toLowerCase();
        return !NON_CONTROL_OBJECT_OWNER_TYPES.has(normalized)
            && !DATAWINDOW_OWNER_TYPES.has(normalized);
    });
}

module.exports = {
    collectOfficialEnumeratedTypeUnits,
    collectOfficialEnumeratedValueUnits,
    buildOfficialKeywordCategoryMap,
    buildControlOwnerUniverse,
};
