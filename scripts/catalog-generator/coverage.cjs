'use strict';

const { normalizeSystemSymbolName } = require('../../out/server/knowledge/system/normalization.js');
const { DATAWINDOW_OWNER_TYPES, DRAWING_CONTROL_OWNER_TYPES } = require('./constants.cjs');

function buildCoverageMap(entries, domain) {
    const coverage = new Map();

    for (const entry of entries) {
        const key = `${domain}|${entry.normalizedName}`;
        const state = coverage.get(key) ?? { hasOwnerlessEntry: false, ownerTypes: new Set() };

        if ((entry.normalizedOwnerTypes?.length ?? 0) === 0) {
            state.hasOwnerlessEntry = true;
        }

        for (const ownerType of entry.normalizedOwnerTypes ?? []) {
            state.ownerTypes.add(ownerType);
        }

        coverage.set(key, state);
    }

    return coverage;
}

function buildLookupCoverageSet(entries) {
    const coverage = new Set();

    for (const entry of entries) {
        for (const lookupKey of entry.lookupKeys ?? []) {
            coverage.add(lookupKey);
        }
    }

    return coverage;
}

function buildDraftLookupCoverageSet(entries) {
    const coverage = new Set();

    for (const entry of entries) {
        const normalizedName = normalizeSystemSymbolName(entry.name);

        if (normalizedName) {
            coverage.add(normalizedName);
        }

        for (const alias of entry.lookupAliases ?? []) {
            const normalizedAlias = normalizeSystemSymbolName(alias);

            if (normalizedAlias) {
                coverage.add(normalizedAlias);
            }
        }
    }

    return coverage;
}

function buildDraftCoverageMap(entries, domain) {
    const coverage = new Map();

    for (const entry of entries) {
        registerCoverage(coverage, domain, entry.name, entry.ownerTypes ?? []);
    }

    return coverage;
}

function registerCoverage(coverage, domain, name, ownerTypes) {
    const normalizedName = normalizeSystemSymbolName(name);

    if (!normalizedName) {
        return;
    }

    const key = `${domain}|${normalizedName}`;
    const state = coverage.get(key) ?? { hasOwnerlessEntry: false, ownerTypes: new Set() };

    if (!ownerTypes || ownerTypes.length === 0) {
        state.hasOwnerlessEntry = true;
    } else {
        ownerTypes.forEach(ownerType => state.ownerTypes.add(ownerType));
    }

    coverage.set(key, state);
}

function getUncoveredOwnerTypes(coverage, domain, name, ownerTypes, fallbackUniverse) {
    const normalizedName = normalizeSystemSymbolName(name);

    if (!normalizedName) {
        return [];
    }

    const key = `${domain}|${normalizedName}`;
    const state = coverage.get(key);

    if (state?.hasOwnerlessEntry) {
        return [];
    }

    if (!ownerTypes || ownerTypes.length === 0) {
        return fallbackUniverse.filter(ownerType => !(state?.ownerTypes.has(ownerType) ?? false));
    }

    return ownerTypes.filter(ownerType => !(state?.ownerTypes.has(ownerType) ?? false));
}

function isCoverageUnitCovered(coverage, domain, name, ownerType) {
    const normalizedName = normalizeSystemSymbolName(name);

    if (!normalizedName) {
        return false;
    }

    const state = coverage.get(`${domain}|${normalizedName}`);

    if (!state) {
        return false;
    }

    if (!ownerType) {
        return state.hasOwnerlessEntry;
    }

    return state.hasOwnerlessEntry || state.ownerTypes.has(ownerType);
}

function buildOfficialCoverageUnitKey(domain, name, ownerType) {
    const normalizedName = normalizeSystemSymbolName(name);

    if (!normalizedName) {
        return undefined;
    }

    return ownerType
        ? `${domain}|${normalizedName}|${ownerType}`
        : `${domain}|${normalizedName}|__ownerless__`;
}

function expandOwnerTypesForOwnerInfo(ownerInfo, objectOwnerUniverse, controlOwnerUniverse) {
    if (ownerInfo.ownerScope === 'specific') {
        return ownerInfo.ownerTypes;
    }

    if (ownerInfo.ownerScope === 'all-controls') {
        return controlOwnerUniverse;
    }

    if (ownerInfo.ownerScope === 'all-controls-except-drawing') {
        return controlOwnerUniverse.filter(ownerType => !DRAWING_CONTROL_OWNER_TYPES.has(ownerType));
    }

    if (ownerInfo.ownerScope === 'any-object-except-application') {
        return objectOwnerUniverse.filter(ownerType => ownerType !== 'application');
    }

    if (ownerInfo.ownerScope === 'any-object-except-menu') {
        return objectOwnerUniverse.filter(ownerType => ownerType !== 'menu');
    }

    if (ownerInfo.ownerScope === 'any-object-except-datawindowchild') {
        return objectOwnerUniverse.filter(ownerType => ownerType !== 'datawindowchild');
    }

    if (ownerInfo.ownerScope === 'any-object') {
        return objectOwnerUniverse;
    }

    return [];
}

function collectOfficialCoverageUnitKeys(domain, entries, coverage, measurement, objectOwnerUniverse, controlOwnerUniverse) {
    const unitKeys = new Set();
    let coveredCount = 0;
    let missingCount = 0;
    const missingUnits = [];

    const registerUnit = (name, ownerType) => {
        const unitKey = buildOfficialCoverageUnitKey(domain, name, ownerType);

        if (!unitKey || unitKeys.has(unitKey)) {
            return;
        }

        unitKeys.add(unitKey);

        if (isCoverageUnitCovered(coverage, domain, name, ownerType)) {
            coveredCount += 1;
        } else {
            missingCount += 1;
            missingUnits.push(ownerType ? `${name}:${ownerType}` : name);
        }
    };

    for (const entry of entries) {
        if (measurement === 'name') {
            registerUnit(entry.name);
            continue;
        }

        const ownerTypes = expandOwnerTypesForOwnerInfo(
            entry.ownerInfo,
            objectOwnerUniverse,
            controlOwnerUniverse,
        ).filter(ownerType => domain !== 'system-events' || !DATAWINDOW_OWNER_TYPES.has(ownerType));

        if (ownerTypes.length === 0) {
            registerUnit(entry.name);
            continue;
        }

        for (const ownerType of ownerTypes) {
            registerUnit(entry.name, ownerType);
        }
    }

    return {
        measurement,
        officialCount: unitKeys.size,
        coveredCount,
        missingCount,
        missingUnits: missingUnits.sort(),
    };
}

function collectOfficialNameCoverage(unitNames, coverage, domain) {
    const seen = new Set();
    let coveredCount = 0;
    let missingCount = 0;
    const missingUnits = [];

    for (const unitName of unitNames) {
        const normalizedName = normalizeSystemSymbolName(unitName);

        if (!normalizedName || seen.has(normalizedName)) {
            continue;
        }

        seen.add(normalizedName);

        if (isCoverageUnitCovered(coverage, domain, unitName)) {
            coveredCount += 1;
        } else {
            missingCount += 1;
            missingUnits.push(unitName);
        }
    }

    return {
        measurement: 'name',
        officialCount: seen.size,
        coveredCount,
        missingCount,
        missingUnits: missingUnits.sort(),
    };
}

function collectOfficialLookupKeyCoverage(unitNames, coverage) {
    const seen = new Set();
    let coveredCount = 0;
    let missingCount = 0;
    const missingUnits = [];

    for (const unitName of unitNames) {
        const normalizedName = normalizeSystemSymbolName(unitName);

        if (!normalizedName || seen.has(normalizedName)) {
            continue;
        }

        seen.add(normalizedName);

        if (coverage.has(normalizedName)) {
            coveredCount += 1;
        } else {
            missingCount += 1;
            missingUnits.push(unitName);
        }
    }

    return {
        measurement: 'lookup-key',
        officialCount: seen.size,
        coveredCount,
        missingCount,
        missingUnits: missingUnits.sort(),
    };
}

module.exports = {
    buildCoverageMap,
    buildLookupCoverageSet,
    buildDraftLookupCoverageSet,
    buildDraftCoverageMap,
    registerCoverage,
    getUncoveredOwnerTypes,
    collectOfficialCoverageUnitKeys,
    collectOfficialNameCoverage,
    collectOfficialLookupKeyCoverage,
};
