'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const fetchCache = new Map();

function unique(values) {
    return Array.from(new Set(values));
}

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeWhitespace(value) {
    return value.replace(/\s+/g, ' ').trim();
}

function decodeHtml(value) {
    return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
        const normalizedEntity = entity.toLowerCase();

        if (normalizedEntity === 'nbsp') {
            return ' ';
        }

        if (normalizedEntity === 'amp') {
            return '&';
        }

        if (normalizedEntity === 'lt') {
            return '<';
        }

        if (normalizedEntity === 'gt') {
            return '>';
        }

        if (normalizedEntity === 'quot') {
            return '"';
        }

        if (normalizedEntity === 'apos') {
            return "'";
        }

        if (normalizedEntity.startsWith('#x')) {
            return String.fromCodePoint(Number.parseInt(normalizedEntity.slice(2), 16));
        }

        if (normalizedEntity.startsWith('#')) {
            return String.fromCodePoint(Number.parseInt(normalizedEntity.slice(1), 10));
        }

        return match;
    });
}

function stripTags(value) {
    return decodeHtml(
        value
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' '),
    );
}

function normalizeLabel(value) {
    return normalizeWhitespace(stripTags(value))
        .toLowerCase()
        .replace(/[.:;]+$/g, '')
        .replace(/\bthe\b/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

async function fetchText(url, attempt = 1) {
    if (fetchCache.has(url)) {
        return fetchCache.get(url);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(url, {
            headers: {
                'user-agent': 'almunia-powersyntax-catalog-generator',
            },
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const text = await response.text();
        fetchCache.set(url, text);
        return text;
    } catch (error) {
        if (attempt < 3) {
            return fetchText(url, attempt + 1);
        }

        throw new Error(`No se pudo descargar ${url}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
        clearTimeout(timeout);
    }
}

function findLabelIndex(html, labels, fromIndex = 0) {
    let bestIndex = -1;

    for (const label of labels) {
        const expression = new RegExp(
            `<p><span class="bold"><strong>${escapeRegExp(label)}(?:\\s+\\d+)?<\\/strong><\\/span><\\/p>`,
            'i',
        );
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

function findDocPageEndIndex(html, fromIndex = 0) {
    const slice = html.slice(fromIndex);
    const candidateIndexes = [
        slice.search(/<div class="navfooter">/i),
        slice.search(/<table[^>]*summary="Navigation footer"/i),
        slice.search(/<div id="sidebar"/i),
        slice.search(/<\/body>/i),
    ].filter(index => index >= 0);

    if (candidateIndexes.length === 0) {
        return -1;
    }

    return fromIndex + Math.min(...candidateIndexes);
}

function extractSectionHtml(html, label, nextLabels) {
    const startExpression = new RegExp(
        `<p><span class="bold"><strong>${escapeRegExp(label)}(?:\\s+\\d+)?<\\/strong><\\/span><\\/p>`,
        'i',
    );
    const startMatch = startExpression.exec(html);

    if (!startMatch || typeof startMatch.index !== 'number') {
        return '';
    }

    const startIndex = startMatch.index + startMatch[0].length;
    const nextLabelIndex = findLabelIndex(html, nextLabels, startIndex);
    const pageEndIndex = findDocPageEndIndex(html, startIndex);
    const endIndex = nextLabelIndex >= 0
        ? pageEndIndex >= 0 ? Math.min(nextLabelIndex, pageEndIndex) : nextLabelIndex
        : pageEndIndex;
    return html.slice(startIndex, endIndex >= 0 ? endIndex : html.length);
}

function extractTitle(html) {
    const titleMatch = html.match(/<h[23][^>]*class="title"[^>]*>([\s\S]*?)<\/h[23]>/i);
    return normalizeWhitespace(stripTags(titleMatch?.[1] ?? ''));
}

function sanitizeOfficialTitle(title) {
    return normalizeWhitespace(title.replace(/\s*\((?:obsolete|obsoleta)\)\s*$/i, ''));
}

function extractPrimaryTitleMatch(html) {
    const titleExpression = /<h[23][^>]*class="title"[^>]*>[\s\S]*?<\/h[23]>/i;
    const match = titleExpression.exec(html);
    return match && typeof match.index === 'number' ? match : undefined;
}

function extractBodyAfterPrimaryTitle(html) {
    const titleMatch = extractPrimaryTitleMatch(html);

    if (!titleMatch) {
        return html;
    }

    return html.slice(titleMatch.index + titleMatch[0].length);
}

function extractPrimaryContentHtml(html) {
    const bodyHtml = extractBodyAfterPrimaryTitle(html);
    const endIndex = findDocPageEndIndex(bodyHtml);

    return bodyHtml.slice(0, endIndex >= 0 ? endIndex : bodyHtml.length);
}

function extractSectionParagraphs(html, label, nextLabels) {
    const sectionHtml = extractSectionHtml(html, label, nextLabels);

    if (!sectionHtml) {
        return [];
    }

    const paragraphs = [...sectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);

    if (paragraphs.length > 0) {
        return paragraphs;
    }

    const fallback = normalizeWhitespace(stripTags(sectionHtml));
    return fallback ? [fallback] : [];
}

function extractDescription(html) {
    const bodyHtml = extractBodyAfterPrimaryTitle(html);
    const firstPStart = bodyHtml.search(/<p[^>]*>/i);

    if (firstPStart < 0) {
        return '';
    }

    const firstPEnd = bodyHtml.indexOf('</p>', firstPStart);

    if (firstPEnd < 0) {
        return '';
    }

    return normalizeWhitespace(stripTags(bodyHtml.slice(firstPStart, firstPEnd + 4)));
}

async function mapConcurrent(items, concurrency, handler) {
    const results = new Array(items.length);
    let nextIndex = 0;
    let completed = 0;

    async function worker() {
        while (true) {
            const index = nextIndex;
            nextIndex += 1;

            if (index >= items.length) {
                return;
            }

            results[index] = await handler(items[index], index);
            completed += 1;

            if (completed % 100 === 0 || completed === items.length) {
                console.log(`Procesadas ${completed}/${items.length} páginas oficiales...`);
            }
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
    );

    return results;
}

module.exports = {
    unique,
    escapeRegExp,
    normalizeWhitespace,
    decodeHtml,
    stripTags,
    normalizeLabel,
    fetchText,
    findLabelIndex,
    findDocPageEndIndex,
    extractSectionHtml,
    extractTitle,
    sanitizeOfficialTitle,
    extractPrimaryTitleMatch,
    extractBodyAfterPrimaryTitle,
    extractPrimaryContentHtml,
    extractDescription,
    extractSectionParagraphs,
    mapConcurrent,
};
