'use strict';

const {
    unique,
    normalizeWhitespace,
    stripTags,
    escapeRegExp,
    extractTitle,
    extractPrimaryContentHtml,
    findDocPageEndIndex,
    fetchText,
} = require('../utils.cjs');

const {
    OBJECTS_AND_CONTROLS_BASE_URL,
    OBJECTS_AND_CONTROLS_PROPERTIES_URL,
    OBJECTS_AND_CONTROLS_UNDOCUMENTED_BASE_CLASSES_URL,
    OFFICIAL_SYSTEM_OBJECT_LABEL_BLACKLIST,
    OBJECTS_AND_CONTROLS_ENUM_PROPERTY_TARGETS,
} = require('../constants.cjs');

const { normalizeSystemSymbolName } = require('../../../out/server/knowledge/system/normalization.js');

function extractTableRows(html) {
    if (!html) {
        return [];
    }

    const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);

    if (!tableMatch) {
        return [];
    }

    const rowSource = tableMatch[0].match(/<tbody[\s\S]*?<\/tbody>/i)?.[0] ?? tableMatch[0];

    return [...rowSource.matchAll(/<tr[\s\S]*?<\/tr>/gi)]
        .filter(match => /<td[^>]*>/i.test(match[0]))
        .map(match => [...match[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
            .map(cell => normalizeWhitespace(stripTags(cell[1])))
            .filter(Boolean))
        .filter(row => row.length > 0);
}

function buildTitledSectionHeadingExpression(label) {
    return new RegExp(
        `<h[34][^>]*class="title"[^>]*>(?:\\s|<[^>]+>)*${escapeRegExp(label)}(?:\\s|<[^>]+>)*<\/h[34]>`,
        'i',
    );
}

function findTitledSectionIndex(html, labels, fromIndex = 0) {
    let bestIndex = -1;

    for (const label of labels) {
        const expression = buildTitledSectionHeadingExpression(label);
        const slice = html.slice(fromIndex);
        const match = expression.exec(slice);

        if (!match) {
            continue;
        }

        const absoluteIndex = fromIndex + match.index;

        if (bestIndex < 0 || absoluteIndex < bestIndex) {
            bestIndex = absoluteIndex;
        }
    }

    return bestIndex;
}

function extractTitledSectionHtml(html, label, nextLabels) {
    const startExpression = buildTitledSectionHeadingExpression(label);
    const startMatch = startExpression.exec(html);

    if (!startMatch || typeof startMatch.index !== 'number') {
        return '';
    }

    const startIndex = startMatch.index + startMatch[0].length;
    const nextLabelIndex = findTitledSectionIndex(html, nextLabels, startIndex);
    const pageEndIndex = findDocPageEndIndex(html, startIndex);
    const endIndex = nextLabelIndex >= 0
        ? pageEndIndex >= 0 ? Math.min(nextLabelIndex, pageEndIndex) : nextLabelIndex
        : pageEndIndex;

    return html.slice(startIndex, endIndex >= 0 ? endIndex : html.length);
}

function extractSystemTypeBaseType(...values) {
    const patterns = [
        /\bderived from\s+([A-Za-z_][A-Za-z0-9_]*)\b/i,
        /\binherits(?: the [A-Za-z ]+)? from its parent,?\s*([A-Za-z_][A-Za-z0-9_]*)\b/i,
        /\binherits from\s+([A-Za-z_][A-Za-z0-9_]*)\b/i,
        /\bparent,\s*([A-Za-z_][A-Za-z0-9_]*)\b/i,
    ];

    for (const value of values) {
        const normalizedValue = normalizeWhitespace(value);

        if (!normalizedValue) {
            continue;
        }

        for (const pattern of patterns) {
            const match = normalizedValue.match(pattern);

            if (match?.[1]) {
                return match[1];
            }
        }
    }

    return undefined;
}

function extractSystemTypeMemberNames(sectionHtml) {
    return unique(
        extractTableRows(sectionHtml)
            .map(row => normalizeWhitespace(row[0]))
            .filter(Boolean),
    );
}

function parseOfficialSystemObjectDatatypePage(html, entry) {
    const title = extractTitle(html);
    const contentHtml = extractPrimaryContentHtml(html);
    const firstSectionIndex = findTitledSectionIndex(contentHtml, ['Properties', 'Events', 'Functions']);
    const descriptionHtml = firstSectionIndex >= 0
        ? contentHtml.slice(0, firstSectionIndex)
        : contentHtml;
    const description = normalizeWhitespace(stripTags(descriptionHtml));
    const propertiesHtml = extractTitledSectionHtml(contentHtml, 'Properties', ['Events', 'Functions']);
    const eventsHtml = extractTitledSectionHtml(contentHtml, 'Events', ['Functions']);
    const functionsHtml = extractTitledSectionHtml(contentHtml, 'Functions', []);
    const properties = extractSystemTypeMemberNames(propertiesHtml);
    const functions = extractSystemTypeMemberNames(functionsHtml);
    const events = extractSystemTypeMemberNames(eventsHtml);
    const pageName = title.replace(/\s+(object|control)\s*$/i, '').trim() || entry.name;
    const baseType = extractSystemTypeBaseType(
        description,
        normalizeWhitespace(stripTags(propertiesHtml)),
        normalizeWhitespace(stripTags(functionsHtml)),
        normalizeWhitespace(stripTags(eventsHtml)),
    );

    return {
        ...entry,
        baseType,
        documentation: description || undefined,
        events: events.length > 0 ? events : undefined,
        functions: functions.length > 0 ? functions : undefined,
        name: pageName,
        properties: properties.length > 0 ? properties : undefined,
        summary: description.split('.')[0]?.trim() + '.' || entry.summary,
    };
}

function parseOfficialSystemObjectDatatypeEntries(html) {
    const seen = new Set();
    const entries = [];

    for (const match of html.matchAll(/<a href="([^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi)) {
        const label = normalizeWhitespace(stripTags(match[2]));

        if (!label || /^for\b/i.test(label) || !/\b(object|control)$/i.test(label)) {
            continue;
        }

        const name = label.replace(/\s+(object|control)$/i, '').trim();
        const normalizedName = normalizeSystemSymbolName(name);

        if (!normalizedName || OFFICIAL_SYSTEM_OBJECT_LABEL_BLACKLIST.has(name) || seen.has(normalizedName)) {
            continue;
        }

        seen.add(normalizedName);
        entries.push({
            category: 'Referencia oficial',
            name,
            sourceUrl: new URL(match[1], OBJECTS_AND_CONTROLS_BASE_URL).toString(),
            summary: `Official documented PowerBuilder system object/control datatype ${name}.`,
        });
    }

    return entries;
}

function parseUndocumentedBaseClassEntries(html) {
    const seen = new Set();
    const entries = [];

    for (const match of html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)) {
        const name = normalizeWhitespace(stripTags(match[1]));
        const normalizedName = normalizeSystemSymbolName(name);

        if (
            !normalizedName
            || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)
            || OFFICIAL_SYSTEM_OBJECT_LABEL_BLACKLIST.has(name)
            || seen.has(normalizedName)
        ) {
            continue;
        }

        seen.add(normalizedName);
        entries.push({
            category: 'Base class oficial',
            name,
            sourceUrl: OBJECTS_AND_CONTROLS_UNDOCUMENTED_BASE_CLASSES_URL,
            summary: `Official undocumented base class system object ${name} listed in the inheritance hierarchy reference.`,
        });
    }

    return entries;
}

async function loadObjectsPropertyEnumReferences() {
    const html = await fetchText(OBJECTS_AND_CONTROLS_PROPERTIES_URL);

    return OBJECTS_AND_CONTROLS_ENUM_PROPERTY_TARGETS.map(name => {
        const expression = new RegExp(`<a href="([^"]+\\.html)"[^>]*>${escapeRegExp(name)}<\\/a>`, 'i');
        const match = expression.exec(html);

        if (!match?.[1]) {
            console.warn(`No se encontró enlace oficial para property datatype ${name} en ${OBJECTS_AND_CONTROLS_PROPERTIES_URL}.`);
            return undefined;
        }

        return {
            name,
            url: new URL(match[1], OBJECTS_AND_CONTROLS_BASE_URL).toString(),
        };
    }).filter(Boolean);
}

module.exports = {
    parseOfficialSystemObjectDatatypePage,
    parseOfficialSystemObjectDatatypeEntries,
    parseUndocumentedBaseClassEntries,
    loadObjectsPropertyEnumReferences,
};
