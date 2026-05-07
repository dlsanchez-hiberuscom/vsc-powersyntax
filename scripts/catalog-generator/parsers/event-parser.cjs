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
    fetchText,
} = require('../utils.cjs');

const {
    POWERSCRIPT_BASE_URL,
    POWERSCRIPT_EVENTS_URL,
    APPLY_TO_OWNER_TYPE_OVERRIDES,
} = require('../constants.cjs');

const unknownPowerScriptEventOwnerLabels = new Map();

function splitAppliesToText(value) {
    const cleaned = normalizeWhitespace(
        value
            .replace(/\([^)]*\)/g, ' ')
            .replace(/\bdoes not apply to\b[\s\S]*$/i, ' ')
            .replace(/\bexcept for\b[\s\S]*$/i, ' ')
            .replace(/\.$/, ''),
    );

    if (!cleaned) {
        return [];
    }

    return cleaned
        .split(/,|\s+(?:and|or)\s+/i)
        .map(part => normalizeWhitespace(part))
        .filter(Boolean);
}

function extractAppliesToLabels(html) {
    if (!html) {
        return [];
    }

    const paragraphTexts = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);

    return unique(
        paragraphTexts
            .flatMap(splitAppliesToText)
            .filter(label => label.toLowerCase() !== 'event applies to'),
    );
}

function extractSignatureLabels(sectionHtml) {
    return unique(
        [...sectionHtml.matchAll(/<pre class="programlisting">([\s\S]*?)<\/pre>/gi)]
            .flatMap(match => {
                const rawLines = stripTags(match[1])
                    .split(/\r?\n/)
                    .map(line => normalizeWhitespace(line))
                    .filter(Boolean);
                const labels = [];
                let currentLabel = '';

                for (const line of rawLines) {
                    if (!currentLabel) {
                        currentLabel = line;
                        continue;
                    }

                    if (line.includes('(')) {
                        labels.push(currentLabel);
                        currentLabel = line;
                        continue;
                    }

                    currentLabel = normalizeWhitespace(`${currentLabel} ${line}`);
                }

                if (currentLabel) {
                    labels.push(currentLabel);
                }

                return labels;
            })
            .filter(label => Boolean(label) && label.includes('(')),
    );
}

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

function parsePowerScriptEventPage(html, url, metadata = {}) {
    const title = extractTitle(html);
    const primaryContentHtml = extractPrimaryContentHtml(html);
    const description = extractDescription(html);

    const eventIdSourceHtml = extractSectionHtml(primaryContentHtml, 'Event ID', [
        'Arguments',
        'Return value',
    ]);
    const eventIdRows = extractTableRows(eventIdSourceHtml);
    const eventIds = eventIdRows.map(([id, ownerLabel]) => {
        const normalized = normalizeLabel(ownerLabel ?? '');
        const mapped = APPLY_TO_OWNER_TYPE_OVERRIDES.get(normalized);
        const ownerTypes = Array.isArray(mapped) ? mapped : mapped ? [mapped] : [];

        if (ownerTypes.length === 0 && normalized && normalized.includes('object')) {
            ownerTypes.push(normalized.replace(/\s+object$/, ''));
        }

        if (ownerTypes.length === 0 && ownerLabel) {
            unknownPowerScriptEventOwnerLabels.set(url, [ownerLabel]);
        }

        return { id, ownerTypes };
    }).filter(eventId => eventId.id);

    const sections = [...primaryContentHtml.matchAll(/<h4 class="title">Syntax\s+\d+<\/h4>([\s\S]*?)(?=<h4 class="title">Syntax\s+\d+<\/h4>|$)/gi)];

    if (sections.length > 0) {
        return sections.map(match => {
            const sectionHtml = match[1];
            const sectionEventIdMatch = sectionHtml.match(/<p><span class="bold"><strong>Event ID<\/strong><\/span><\/p>\s*<table>[\s\S]*?<td>([\s\S]*?)<\/td>/i);
            const sectionEventId = sectionEventIdMatch ? normalizeWhitespace(stripTags(sectionEventIdMatch[1])) : undefined;

            const signatures = extractSignatureLabels(extractSectionHtml(sectionHtml, 'Syntax', [
                'Event ID',
                'Arguments',
                'Return value',
            ])).map(label => ({ label }));

            const argumentRows = extractTableRows(extractSectionHtml(sectionHtml, 'Arguments', [
                'Return value',
                'Examples',
                'See also',
            ]));

            const finalSignatures = signatures.map(signature => {
                const parameters = argumentRows.map(([label, documentation]) => ({
                    label: normalizeWhitespace(label),
                    documentation: normalizeWhitespace(documentation),
                }));

                return {
                    ...signature,
                    parameters: parameters.length > 0 ? parameters : undefined,
                };
            });

            const ownerTypes = unique(eventId ? [] : (eventIds.flatMap(ei => ei.ownerTypes) || []));

            return {
                name: title,
                description,
                eventId: sectionEventId,
                eventIds: sectionEventId ? undefined : eventIds.length > 0 ? eventIds : undefined,
                signatures: finalSignatures,
                sourceUrl: url,
                obsolete: metadata.obsolete,
                ownerInfo: {
                    appliesTo: [],
                    ownerScope: ownerTypes.length > 0 ? 'specific' : 'any',
                    ownerTypes,
                },
            };
        });
    }

    const signatures = extractSignatureLabels(extractSectionHtml(primaryContentHtml, 'Syntax', [
        'Event ID',
        'Arguments',
        'Return value',
    ])).map(label => ({ label }));

    const argumentRows = extractTableRows(extractSectionHtml(primaryContentHtml, 'Arguments', [
        'Return value',
        'Examples',
        'See also',
    ]));

    const finalSignatures = signatures.map(signature => {
        const parameters = argumentRows.map(([label, documentation]) => ({
            label: normalizeWhitespace(label),
            documentation: normalizeWhitespace(documentation),
        }));

        return {
            ...signature,
            parameters: parameters.length > 0 ? parameters : undefined,
        };
    });

    const ownerTypes = unique(eventIds.flatMap(ei => ei.ownerTypes) || []);

    return [{
        name: title,
        description,
        eventIds: eventIds.length > 0 ? eventIds : undefined,
        signatures: finalSignatures,
        sourceUrl: url,
        obsolete: metadata.obsolete,
        ownerInfo: {
            appliesTo: [],
            ownerScope: ownerTypes.length > 0 ? 'specific' : 'any',
            ownerTypes,
        },
    }];
}

async function loadPowerScriptEventLinks() {
    const html = await fetchText(POWERSCRIPT_EVENTS_URL);
    const references = [...html.matchAll(/<dt><span class="section"><a href="([^"]+\.html)"[^>]*>([\s\S]*?)<\/a><\/span><\/dt>/gi)]
        .map(match => ({
            label: normalizeWhitespace(stripTags(match[2])),
            url: new URL(match[1], POWERSCRIPT_BASE_URL).toString(),
        }))
        .filter(reference => reference.label && !/^powerbuilder events$/i.test(reference.label));
    const seen = new Set();

    return references.filter(reference => {
        if (seen.has(reference.url)) {
            return false;
        }

        seen.add(reference.url);
        return true;
    }).map(reference => ({
        ...reference,
        obsolete: /\bobsolete\b/i.test(reference.label),
    }));
}

function extractEventSections(html) {
    const sections = [...html.matchAll(/<h4 class="title">Syntax\s+\d+<\/h4>([\s\S]*?)(?=<h4 class="title">Syntax\s+\d+<\/h4>|$)/gi)];

    if (sections.length === 0) {
        return [{ html }];
    }

    return sections.map(match => ({
        html: match[1],
        title: match[0].replace(/<[^>]+>/g, '').trim(),
    }));
}

function extractEventOwnerLabels(html) {
    const sectionHtml = extractSectionHtml(html, 'Event ID', [
        'Arguments',
        'Return value',
    ]);
    const tableMatch = sectionHtml.match(/<table[\s\S]*?<\/table>/i);

    if (!tableMatch) {
        return [];
    }

    return [...tableMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)]
        .map(match => [...match[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
            .map(cell => normalizeWhitespace(stripTags(cell[1])))
            .filter(Boolean))
        .filter(row => row.length >= 2)
        .map(row => row[1]);
}

function extractArgumentNames(html) {
    const sectionHtml = extractSectionHtml(html, 'Arguments', [
        'Return value',
        'Examples',
        'See also',
        'Usage',
    ]);
    const tableMatch = sectionHtml.match(/<table[\s\S]*?<\/table>/i);

    if (!tableMatch) {
        return [];
    }

    return [...tableMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)]
        .map(match => [...match[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
            .map(cell => normalizeWhitespace(stripTags(cell[1])))
            .filter(Boolean))
        .filter(row => row.length >= 2)
        .map(row => row[0])
        .filter(label => !/^(?:argument|event id|object|objects)$/i.test(normalizeLabel(label)));
}

function buildEventIdMetadata(html) {
    const sectionHtml = extractSectionHtml(html, 'Event ID', [
        'Arguments',
        'Return value',
    ]);
    const tableMatch = sectionHtml.match(/<table[\s\S]*?<\/table>/i);

    if (!tableMatch) {
        return {};
    }

    const rows = [...tableMatch[0].matchAll(/<tr[\s\S]*?<\/tr>/gi)]
        .map(match => [...match[0].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
            .map(cell => normalizeWhitespace(stripTags(cell[1])))
            .filter(Boolean))
        .filter(row => row.length >= 2);

    if (rows.length === 1) {
        return { eventId: rows[0][0] };
    }

    const eventIds = rows.map(([id, ownerLabel]) => {
        const mapped = APPLY_TO_OWNER_TYPE_OVERRIDES.get(normalizeLabel(ownerLabel));
        const ownerTypes = Array.isArray(mapped) ? mapped : mapped ? [mapped] : [];

        return { id, ownerTypes };
    }).filter(eventId => eventId.id);

    return eventIds.length > 0 ? { eventIds } : {};
}

module.exports = {
    parsePowerScriptEventPage,
    loadPowerScriptEventLinks,
    extractEventSections,
    extractEventOwnerLabels,
    extractArgumentNames,
    buildEventIdMetadata,
    unknownPowerScriptEventOwnerLabels,
};
