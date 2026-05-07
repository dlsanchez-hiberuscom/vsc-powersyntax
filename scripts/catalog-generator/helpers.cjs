'use strict';

const {
    normalizeWhitespace,
    stripTags,
    extractSectionHtml,
    normalizeLabel,
    extractSectionParagraphs,
    unique,
} = require('./utils.cjs');

const {
    KNOWN_NON_FUNCTION_TITLES,
    APPLY_TO_OWNER_TYPE_OVERRIDES,
} = require('./constants.cjs');

function extractFirstSentence(text) {
    if (!text) {
        return '';
    }

    const firstPeriodIndex = text.indexOf('.');
    return firstPeriodIndex >= 0 ? text.slice(0, firstPeriodIndex + 1).trim() : text.trim();
}

function shouldSkipByTitle(title) {
    return KNOWN_NON_FUNCTION_TITLES.some(pattern => pattern.test(title));
}

function extractDescription(html) {
    const descriptionHtml = extractSectionHtml(html, 'Description', [
        'Syntax',
        'Return value',
        'Usage',
        'Examples',
        'Example',
        'See also',
        'Values',
    ]);

    if (!descriptionHtml) {
        const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
            .map(match => normalizeWhitespace(stripTags(match[1])))
            .filter(Boolean);
        return paragraphs[0] || '';
    }

    return normalizeWhitespace(stripTags(descriptionHtml));
}

function extractReplacement(html, name) {
    const text = normalizeWhitespace(stripTags(html));
    const patterns = [
        new RegExp(`(?:obsolete|obsoleta)\\.?\\s*(?:use|utilice)\\s+([^.]+)\\s+(?:instead|en su lugar)`, 'i'),
        new RegExp(`(?:use|utilice)\\s+([^.]+)\\s+(?:instead of|en lugar de)\\s+${name}`, 'i'),
    ];

    for (const pattern of patterns) {
        const match = text.match(pattern);

        if (match?.[1]) {
            return normalizeWhitespace(match[1]).replace(/\s*\(.*?\)\s*/g, '');
        }
    }

    return undefined;
}

function detectObsoleteMetadata(html, title, name) {
    const obsolete = /\((?:obsolete|obsoleta)\)$/i.test(title)
        || /\b(?:obsolete|obsoleta)\b/i.test(normalizeWhitespace(stripTags(html)).slice(0, 500));

    if (!obsolete) {
        return {};
    }

    return {
        obsolete: true,
        obsoleteMessage: 'Marcada como obsoleta en la referencia oficial de Appeon.',
        replacement: extractReplacement(html, name),
        risk: 'deprecated',
    };
}

function extractReturnMetadata(html, signatures) {
    const returnSectionHtml = extractSectionHtml(html, 'Return value', [
        'Examples',
        'Usage',
        'See also',
    ]);
    const returnParagraphs = [...returnSectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);

    const returnDocumentation = returnParagraphs.join(' ');
    const returnTypeMatch = returnParagraphs[0]?.match(/^([A-Za-z_][A-Za-z0-9_]*)\./);
    const returnType = returnTypeMatch?.[1];

    return {
        returnDocumentation: returnDocumentation || undefined,
        returnType: returnType || undefined,
    };
}

function attachSignatureReturnType(signatures, returnType) {
    return signatures.map(signature => ({
        ...signature,
        returnType: signature.returnType || returnType || undefined,
    }));
}

function extractArgumentDetails(html) {
    const argumentSectionHtml = extractSectionHtml(html, 'Arguments', [
        'Return value',
        'Examples',
        'See also',
        'Usage',
    ]);
    const tableMatch = argumentSectionHtml.match(/<table[\s\S]*?<\/table>/i);

    if (!tableMatch) {
        return new Map();
    }

    const rows = [...tableMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)]
        .map(match => [...match[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
            .map(cell => normalizeWhitespace(stripTags(cell[1])))
            .filter(Boolean))
        .filter(row => row.length >= 2);

    return new Map(rows.map(([label, documentation]) => [normalizeLabel(label), documentation]));
}

function attachSignatureParameters(signatures, argumentDetails) {
    return signatures.map(signature => {
        const parameterNames = extractArgumentNamesFromSignature(signature.label);
        const parameters = parameterNames.map(name => ({
            label: name,
            documentation: argumentDetails.get(normalizeLabel(name)),
        }));

        return {
            ...signature,
            parameters: parameters.length > 0 ? parameters : undefined,
        };
    });
}

function extractArgumentNamesFromSignature(signatureLabel) {
    const match = signatureLabel.match(/\(([\s\S]*?)\)/);

    if (!match) {
        return [];
    }

    return match[1]
        .split(',')
        .map(part => normalizeWhitespace(part.split(/\s+/).pop() ?? ''))
        .filter(Boolean)
        .filter(name => !['{', '}', '[', ']'].includes(name));
}

function parseAppliesToOwnerInfo(ownerLabels) {
    const ownerTypes = [];
    const unknownLabels = [];
    let ownerScope = 'none';

    for (const label of ownerLabels) {
        const normalized = normalizeLabel(label);
        const mapped = APPLY_TO_OWNER_TYPE_OVERRIDES.get(normalized);

        if (mapped !== undefined) {
            ownerScope = 'specific';
            if (Array.isArray(mapped)) {
                ownerTypes.push(...mapped);
            } else {
                ownerTypes.push(mapped);
            }
            continue;
        }

        if (normalized.includes('object')) {
            ownerScope = 'specific';
            ownerTypes.push(normalized.replace(/\s+object$/, ''));
            continue;
        }

        unknownLabels.push(label);
    }

    if (ownerTypes.length === 0 && unknownLabels.length > 0) {
        ownerScope = 'specific';
    }

    return {
        appliesTo: ownerLabels,
        ownerScope,
        ownerTypes: unique(ownerTypes).sort(),
        unknownLabels,
    };
}

function filterAppliesToLabels(ownerInfo, selectedOwnerTypes) {
    const selectedSet = new Set(selectedOwnerTypes);

    return ownerInfo.appliesTo.filter(label => {
        const normalized = normalizeLabel(label);
        const mapped = APPLY_TO_OWNER_TYPE_OVERRIDES.get(normalized);

        if (Array.isArray(mapped)) {
            return mapped.some(ownerType => selectedSet.has(ownerType));
        }

        if (mapped) {
            return selectedSet.has(mapped);
        }

        if (normalized.includes('object')) {
            return selectedSet.has(normalized.replace(/\s+object$/, ''));
        }

        return false;
    });
}

module.exports = {
    extractFirstSentence,
    shouldSkipByTitle,
    extractDescription,
    extractReplacement,
    detectObsoleteMetadata,
    extractReturnMetadata,
    attachSignatureReturnType,
    extractArgumentDetails,
    attachSignatureParameters,
    parseAppliesToOwnerInfo,
    filterAppliesToLabels,
};
