'use strict';

const {
    unique,
    normalizeWhitespace,
    stripTags,
    extractSectionHtml,
    extractTitle,
    extractPrimaryContentHtml,
    extractDescription,
    normalizeLabel,
} = require('../utils.cjs');

const {
    POWERSCRIPT_ENUMERATED_DATATYPES_URL,
} = require('../constants.cjs');

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

function extractAllTableRows(html) {
    if (!html) {
        return [];
    }

    return [...html.matchAll(/<table[\s\S]*?<\/table>/gi)]
        .map(match => extractTableRows(match[0]))
        .filter(rows => rows.length > 0);
}

function normalizeEnumeratedValueName(value) {
    const cleaned = normalizeWhitespace(value)
        .replace(/\s*\((?:default|obsolete|obsoleta)\)\s*$/i, '')
        .replace(/[.:;]+$/g, '')
        .trim();

    if (!cleaned) {
        return undefined;
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*!$/.test(cleaned)) {
        return cleaned;
    }

    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(cleaned)) {
        return `${cleaned}!`;
    }

    return undefined;
}

function parseEnumeratedNumericValue(value) {
    const normalizedValue = normalizeWhitespace(value).replace(/,/g, '');

    if (!/^-?\d+$/.test(normalizedValue)) {
        return undefined;
    }

    return Number.parseInt(normalizedValue, 10);
}

function compactOfficialMeaning(value) {
    const sentence = value.split('.')[0]?.trim() + '.';

    if (sentence.length <= 240) {
        return sentence;
    }

    return `${sentence.slice(0, 237).trim()}...`;
}

function extractEnumeratedValueRowsFromTables(html, sourceUrl) {
    return extractAllTableRows(html)
        .flat()
        .map(row => {
            const name = normalizeEnumeratedValueName(row[0] ?? '');

            if (!name) {
                return undefined;
            }

            const enumNumericValue = parseEnumeratedNumericValue(row[1] ?? '');
            const meaningSource = enumNumericValue !== undefined
                ? row.slice(2).join(' ')
                : row.slice(1).join(' ');
            const meaning = compactOfficialMeaning(meaningSource);
            const obsolete = /\bobsolete\b/i.test(`${row[0] ?? ''} ${meaningSource}`);

            return {
                name,
                enumNumericValue,
                enumValueMeaning: meaning || undefined,
                obsolete,
                sourceUrl,
            };
        })
        .filter(Boolean);
}

function extractListItemParagraphGroups(html) {
    if (!html) {
        return [];
    }

    return [...html.matchAll(/<li[\s\S]*?<\/li>/gi)]
        .map(match => {
            const paragraphs = [...match[0].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
                .map(paragraphMatch => normalizeWhitespace(stripTags(paragraphMatch[1])))
                .filter(Boolean);

            return paragraphs.length > 0
                ? paragraphs
                : [normalizeWhitespace(stripTags(match[0]))].filter(Boolean);
        })
        .filter(group => group.length > 0);
}

function extractEnumeratedValueRowsFromListItems(html, sourceUrl) {
    return extractListItemParagraphGroups(html)
        .map(group => {
            const name = normalizeEnumeratedValueName(group[0] ?? '');

            if (!name) {
                return undefined;
            }

            const meaningSource = group.slice(1).join(' ') || group[0] || '';
            const meaning = compactOfficialMeaning(meaningSource);
            const obsolete = /\bobsolete\b/i.test(`${group[0] ?? ''} ${meaningSource}`);

            return {
                name,
                enumValueMeaning: meaning || undefined,
                obsolete,
                sourceUrl,
            };
        })
        .filter(Boolean);
}

function extractEnumeratedValueTokens(html) {
    return unique(
        [...html.matchAll(/<code class="literal">([\s\S]*?)<\/code>/gi)]
            .map(match => normalizeEnumeratedValueName(match[1]))
            .filter(Boolean),
    );
}

function mergeEnumeratedValueCandidates(candidates) {
    const byName = new Map();

    for (const candidate of candidates) {
        const existing = byName.get(candidate.name);

        if (!existing) {
            byName.set(candidate.name, candidate);
            continue;
        }

        existing.enumNumericValue = existing.enumNumericValue ?? candidate.enumNumericValue;
        existing.enumValueMeaning = existing.enumValueMeaning ?? candidate.enumValueMeaning;
        existing.obsolete = existing.obsolete || candidate.obsolete;
    }

    return Array.from(byName.values());
}

function extractEnumeratedDatatypeName(html, fallbackName) {
    const flattenedText = normalizeWhitespace(stripTags(html));
    const patterns = [
        /(?:datatype of [^.]*? is|takes a value of(?: the)?|takes values of(?: the)?|is the)\s+([A-Za-z_][A-Za-z0-9_]*)\s+enumerated datatype\b/i,
        /\b([A-Za-z_][A-Za-z0-9_]*)\s+enumerated datatype\b/i,
    ];

    for (const pattern of patterns) {
        const match = pattern.exec(flattenedText);

        if (!match) {
            continue;
        }

        const candidate = match[1];

        if (candidate && !/^the$/i.test(candidate)) {
            return candidate;
        }
    }

    return fallbackName;
}

function parsePowerScriptEnumeratedDatatypeConcept(html) {
    const description = extractDescription(html);
    const flattenedText = normalizeWhitespace(stripTags(html));
    const canonicalBangSuffix = /values of enumerated datatypes always end with an exclamation point/i.test(flattenedText);

    if (!canonicalBangSuffix) {
        throw new Error('No se pudo confirmar la regla oficial del sufijo ! para enumerated datatypes.');
    }

    return {
        canonicalBangSuffix,
        description,
        sourceUrl: POWERSCRIPT_ENUMERATED_DATATYPES_URL,
        title: extractTitle(html),
    };
}

function parseDataWindowConstantPage(html, pageUrl) {
    const typeName = extractTitle(html);
    const contentHtml = extractPrimaryContentHtml(html);

    const descriptionHtml = extractSectionHtml(contentHtml, 'Description', [
        'Values',
        'Usage',
        'See also',
        'Examples',
        'Example',
    ]);
    const valuesHtml = extractSectionHtml(contentHtml, 'Values', [
        'Usage',
        'See also',
        'Examples',
        'Example',
    ]);
    const description = normalizeWhitespace(stripTags(descriptionHtml)) || extractDescription(contentHtml);
    const values = mergeEnumeratedValueCandidates([
        ...extractEnumeratedValueRowsFromTables(`${valuesHtml}\n${descriptionHtml}`, pageUrl),
        ...extractEnumeratedValueRowsFromListItems(`${valuesHtml}\n${descriptionHtml}`, pageUrl),
        ...extractEnumeratedValueTokens(valuesHtml).map(name => ({ name, sourceUrl: pageUrl })),
    ]);

    if (values.length === 0) {
        return undefined;
    }

    const obsolete = /\bobsolete\b/i.test(normalizeWhitespace(stripTags(contentHtml))) || /\bobsolete\b/i.test(typeName);

    return {
        category: 'Constante oficial DataWindow',
        documentation: description || undefined,
        obsolete,
        obsoleteMessage: obsolete
            ? 'Marcada como obsoleta en la referencia oficial de Appeon.'
            : undefined,
        sourceUrl: pageUrl,
        summary: description.split('.')[0]?.trim() + '.' || `Datatype enumerado oficial ${typeName} de DataWindow.`,
        typeName,
        values,
    };
}

module.exports = {
    parsePowerScriptEnumeratedDatatypeConcept,
    parseDataWindowConstantPage,
    extractEnumeratedDatatypeName,
    extractEnumeratedValueRowsFromTables,
    extractEnumeratedValueRowsFromListItems,
    extractEnumeratedValueTokens,
    mergeEnumeratedValueCandidates,
};
