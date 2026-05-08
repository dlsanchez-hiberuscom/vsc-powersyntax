'use strict';

const {
    unique,
    normalizeWhitespace,
    stripTags,
    extractSectionHtml,
    extractTitle,
    extractPrimaryContentHtml,
    extractDescription,
    extractSectionParagraphs,
    extractSectionCodeBlocks,
    fixBrokenExample,
    normalizeLabel,
    fetchText,
    sanitizeOfficialTitle,
} = require('../utils.cjs');

const {
    DATAWINDOW_BASE_URL,
    DATAWINDOW_INDEX_URL,
    DATAWINDOW_CONSTANTS_CHAPTER_URL,
    DATAWINDOW_CONSTANT_SECTION_BLACKLIST,
} = require('../constants.cjs');

const { normalizeSystemSymbolName } = require('../../../out/server/knowledge/system/normalization.js');

const unknownDataWindowAppliesToLabels = new Map();

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
            .filter(label => label.toLowerCase() !== 'method applies to'),
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

function extractExamples(html) {
    const nextLabels = ['See also', 'Usage', 'Syntax 1', 'Syntax 2'];
    let examples = extractSectionCodeBlocks(html, 'Examples', nextLabels);
    if (examples.length === 0) {
        examples = extractSectionCodeBlocks(html, 'Example', nextLabels);
    }

    return examples.map(fixBrokenExample);
}

function parseDataWindowPage(html, url, chapterTitle) {
    const title = extractTitle(html);
    const primaryContentHtml = extractPrimaryContentHtml(html);
    const description = extractDescription(html);
    const examples = extractExamples(primaryContentHtml);

    const signatures = extractSignatureLabels(extractSectionHtml(primaryContentHtml, 'Syntax', [
        'Return value',
        'Examples',
        'Usage',
        'See also',
    ])).map(label => ({ label }));

    const appliesToHtml = extractSectionHtml(primaryContentHtml, 'Applies to', [
        'Syntax',
        'Return value',
    ]);
    const rawAppliesToLabels = extractAppliesToLabels(appliesToHtml);
    const ownerTypes = [];
    const unknownLabels = [];

    for (const label of rawAppliesToLabels) {
        const normalized = normalizeLabel(label);

        if (normalized.includes('datawindow control')) {
            ownerTypes.push('datawindow');
            continue;
        }

        if (normalized.includes('datawindowchild')) {
            ownerTypes.push('datawindowchild');
            continue;
        }

        if (normalized.includes('datastore')) {
            ownerTypes.push('datastore');
            continue;
        }

        if (normalized.includes('web activex')) {
            continue;
        }

        unknownLabels.push(label);
    }

    if (unknownLabels.length > 0) {
        unknownDataWindowAppliesToLabels.set(url, unknownLabels);
    }

    const obsolete = /\((?:obsolete|obsoleta)\)$/i.test(title) || /obsolete method/i.test(primaryContentHtml);
    const obsoleteParagraphs = [...primaryContentHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])));
    const obsoleteNoteDetail = primaryContentHtml.match(/<div class="note">[\s\S]*?<h3 class="title">Obsolete method<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>[\s\S]*?<\/div>/i)?.[1];
    const obsoleteDetail = normalizeWhitespace(stripTags(
        obsoleteNoteDetail
            ?? obsoleteParagraphs.find(paragraph => /^Obsolete method/i.test(paragraph))?.replace(/^Obsolete method\.?\s*/i, '')
            ?? '',
    ));
    const replacementMatch = obsoleteDetail.match(/use\s+([A-Za-z_][A-Za-z0-9_]*)\s+instead/i);
    const cleanedObsoleteDetail = normalizeWhitespace(
        obsoleteDetail.replace(/\s*Use\s+[A-Za-z_][A-Za-z0-9_]*\s+instead\.?/i, ''),
    );
    const obsoleteMessage = obsolete
        ? (cleanedObsoleteDetail ? normalizeWhitespace(`Obsolete method ${cleanedObsoleteDetail}`) : 'Obsolete method.')
        : undefined;
    const replacement = replacementMatch?.[1];

    const returnSectionHtml = extractSectionHtml(primaryContentHtml, 'Return value', [
        'Examples',
        'Usage',
        'See also',
    ]);
    const returnParagraphs = [...returnSectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);
    const returnTypeMatch = returnParagraphs[0]?.match(/^([A-Za-z_][A-Za-z0-9_]*)\./);
    const inferredReturnType = signatures[0]?.label.match(/^([A-Za-z_][A-Za-z0-9_]*)\s+/)?.[1];
    const returnType = returnTypeMatch?.[1]
        ?? (inferredReturnType ? `${inferredReturnType.charAt(0).toUpperCase()}${inferredReturnType.slice(1)}` : undefined);

    const argumentRows = extractTableRows(extractSectionHtml(primaryContentHtml, 'Arguments', [
        'Return value',
        'Examples',
        'See also',
        'Usage',
    ]));

    const finalSignatures = signatures.map(signature => {
        const parameters = argumentRows
            .map(([label, documentation]) => ({
                label: normalizeWhitespace(label),
                documentation: normalizeWhitespace(documentation),
            }))
            .filter(parameter => {
                const normalizedLabel = parameter.label.toLowerCase();
                const normalizedSignature = signature.label.toLowerCase();

                return normalizedSignature.includes(normalizedLabel)
                    || (normalizedLabel === 'dwcontrol' && normalizedSignature.includes('('));
            })
            .filter(parameter => parameter.label.toLowerCase() !== 'dwcontrol');

        return {
            ...signature,
            parameters: parameters.length > 0 ? parameters : undefined,
            returnType: returnType || undefined,
        };
    });

    return [{
        name: sanitizeOfficialTitle(title),
        appliesTo: rawAppliesToLabels,
        description,
        ownerInfo: {
            appliesTo: rawAppliesToLabels,
            ownerScope: ownerTypes.length > 0 ? 'specific' : 'any',
            ownerTypes: unique(ownerTypes),
        },
        obsolete,
        obsoleteMessage,
        replacement,
        risk: obsolete ? 'deprecated' : undefined,
        returnType,
        signatures: finalSignatures,
        examples: examples.length > 0 ? examples : undefined,
        sourceUrl: url,
    }];
}

async function loadDataWindowMethodChapterPages() {
    const html = await fetchText(DATAWINDOW_INDEX_URL);

    return [...html.matchAll(/<dt><span class="chapter"><a href="([^"]+)">([^<]+)<\/a><\/span><\/dt>/g)]
        .map(match => ({
            title: normalizeWhitespace(stripTags(match[2])),
            url: new URL(match[1], DATAWINDOW_BASE_URL).toString(),
        }))
        .filter(chapter => /Methods for /i.test(chapter.title));
}

async function loadDataWindowMethodPageUrls() {
    const chapters = await loadDataWindowMethodChapterPages();
    const pageReferences = [];

    for (const chapter of chapters) {
        const html = await fetchText(chapter.url);
        const hrefs = unique(
            [...html.matchAll(/<dt><span class="section"><a href="([^"]+\.html)"/g)]
                .map(match => match[1]),
        );

        for (const href of hrefs) {
            pageReferences.push({
                chapterTitle: chapter.title,
                url: new URL(href, DATAWINDOW_BASE_URL).toString(),
            });
        }
    }

    const seen = new Set();
    return pageReferences.filter(reference => {
        const key = `${reference.chapterTitle}|${reference.url}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

async function loadDataWindowConstantReferences() {
    const html = await fetchText(DATAWINDOW_CONSTANTS_CHAPTER_URL);
    const directReferences = [...html.matchAll(/<dt><span class="section"><a href="([^"]+\.html)"[^>]*>([\s\S]*?)<\/a><\/span><\/dt>/gi)]
        .map(match => ({
            label: normalizeWhitespace(stripTags(match[2])),
            url: new URL(match[1], DATAWINDOW_BASE_URL).toString(),
        }));
    const references = (directReferences.length > 0
        ? directReferences
        : [...html.matchAll(/<a href="([^"]+\.html)"[^>]*>([\s\S]*?)<\/a>/gi)]
            .map(match => ({
                label: normalizeWhitespace(stripTags(match[2])),
                url: new URL(match[1], DATAWINDOW_BASE_URL).toString(),
            })))
        .filter(reference => reference.label)
        .filter(reference => /^[A-Za-z_][A-Za-z0-9_]*(?:\s*\((?:obsolete|obsoleta)\))?$/i.test(reference.label))
        .filter(reference => !DATAWINDOW_CONSTANT_SECTION_BLACKLIST.has(normalizeLabel(reference.label)));
    const seen = new Set();

    return references.filter(reference => {
        const key = `${normalizeSystemSymbolName(reference.label) ?? reference.label}|${reference.url}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

module.exports = {
    parseDataWindowPage,
    loadDataWindowMethodChapterPages,
    loadDataWindowMethodPageUrls,
    loadDataWindowConstantReferences,
    unknownDataWindowAppliesToLabels,
};
