'use strict';

const {
    unique,
    normalizeWhitespace,
    stripTags,
    escapeRegExp,
    extractSectionHtml,
    extractTitle,
    sanitizeOfficialTitle,
    extractPrimaryContentHtml,
    extractDescription,
    extractSectionParagraphs,
    normalizeLabel,
} = require('../utils.cjs');

const {
    APPLY_TO_OWNER_TYPE_OVERRIDES,
    SKIP_APPLIES_TO_LABELS,
    OFFICIAL_GENERATED_KEYWORD_CATEGORY_OVERRIDES,
    OFFICIAL_LITERAL_RESERVED_WORDS,
    OFFICIAL_LOGICAL_RESERVED_WORDS,
} = require('../constants.cjs');

const unknownPowerScriptAppliesToLabels = new Map();

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

    const linkTexts = [...html.matchAll(/<a [^>]*>([\s\S]*?)<\/a>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);
    const linkTextSet = new Set(linkTexts.map(text => normalizeLabel(text)));

    const paragraphTexts = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);

    const tableCellTexts = [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);

    const filteredParagraphTexts = paragraphTexts.filter(text => {
        const normalized = normalizeLabel(text);
        return !linkTextSet.has(normalized) || paragraphTexts.length === 1;
    });
    const filteredTableCellTexts = tableCellTexts.filter(text => {
        const normalized = normalizeLabel(text);
        return !linkTextSet.has(normalized) || tableCellTexts.length === 1;
    });

    const sourceTexts = filteredTableCellTexts.length > 0
        ? filteredTableCellTexts
        : filteredParagraphTexts.length > 0
            ? filteredParagraphTexts
            : linkTexts;

    return unique(
        sourceTexts
            .flatMap(splitAppliesToText)
            .filter(label => !SKIP_APPLIES_TO_LABELS.has(normalizeLabel(label))),
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

function extractSyntaxSectionHtml(html) {
    const sectionHtml = extractSectionHtml(html, 'Syntax', [
        'Return value',
        'Examples',
        'Example',
        'See also',
        'Values',
    ]);

    const tableStart = sectionHtml.search(/<div class="table">/i);
    return tableStart >= 0 ? sectionHtml.slice(0, tableStart) : sectionHtml;
}

function extractCallableName(signature) {
    const compact = normalizeWhitespace(signature);
    const beforeParenthesis = compact.split('(')[0]?.trim() ?? '';

    if (!beforeParenthesis) {
        return undefined;
    }

    const lastToken = beforeParenthesis.split(/\s+/).pop();

    if (!lastToken) {
        return undefined;
    }

    const qualifiedName = lastToken.includes('.')
        ? lastToken.split('.').pop()
        : lastToken;
    const cleaned = qualifiedName?.replace(/[^A-Za-z0-9_]+$/g, '');

    return cleaned && /[A-Za-z]/.test(cleaned) ? cleaned : undefined;
}

function normalizeTitleToCallableName(title) {
    return normalizeWhitespace(
        title
            .replace(/\s*\(.*?\)\s*/g, ' ')
            .split('.')
            .pop() ?? '',
    );
}

function extractSignatureGroups(html, title) {
    const sectionHtml = extractSyntaxSectionHtml(html);
    const signatureLabels = extractSignatureLabels(sectionHtml);

    if (signatureLabels.length === 0) {
        return [];
    }

    const groupedLabels = new Map();

    for (const label of signatureLabels) {
        const callableName = extractCallableName(label) ?? normalizeTitleToCallableName(title);

        if (!callableName || !label.includes('(')) {
            continue;
        }

        const existingLabels = groupedLabels.get(callableName) ?? [];
        existingLabels.push(label);
        groupedLabels.set(callableName, existingLabels);
    }

    return Array.from(groupedLabels.entries()).map(([name, labels]) => ({
        name,
        signatures: labels.map(label => ({ label })),
    }));
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
        .filter(row => {
            const normalizedRow = row.map(cell => normalizeLabel(cell));
            return !normalizedRow.every(cell => [
                'argument',
                'description',
                'event id',
                'object',
                'objects',
                'see',
            ].includes(cell));
        })
        .filter(row => row.length > 0);
}

function extractUsageNotes(html) {
    return extractSectionParagraphs(html, 'Usage', [
        'Examples',
        'Example',
        'See also',
    ]);
}

function parsePowerScriptPage(html, url) {
    const title = extractTitle(html);
    const primaryContentHtml = extractPrimaryContentHtml(html);
    const description = extractDescription(html);
    const groups = extractSignatureGroups(primaryContentHtml, title);
    const usageNotes = extractUsageNotes(primaryContentHtml);

    const appliesToHtml = extractSectionHtml(primaryContentHtml, 'Applies to', [
        'Syntax',
        'Return value',
    ]);
    const rawAppliesToLabels = extractAppliesToLabels(appliesToHtml);

    const isGlobal = rawAppliesToLabels.some(label => normalizeLabel(label).includes('global function'));
    const ownerTypes = [];

    if (!isGlobal) {
        const unknownLabels = [];

        for (const label of rawAppliesToLabels) {
            const normalized = normalizeLabel(label);
            const mapped = APPLY_TO_OWNER_TYPE_OVERRIDES.get(normalized);

            if (mapped !== undefined) {
                if (Array.isArray(mapped)) {
                    ownerTypes.push(...mapped);
                } else {
                    ownerTypes.push(mapped);
                }
                continue;
            }

            if (normalized.includes('object')) {
                ownerTypes.push(normalized.replace(/\s+object$/, ''));
                continue;
            }

            unknownLabels.push(label);
        }

        if (unknownLabels.length > 0) {
            unknownPowerScriptAppliesToLabels.set(url, unknownLabels);
        }
    }

    const argumentRows = extractTableRows(extractSectionHtml(primaryContentHtml, 'Arguments', [
        'Return value',
        'Examples',
        'See also',
        'Usage',
    ]));

    const anonymousTableUnderSyntax = extractTableRows(extractSyntaxSectionHtml(primaryContentHtml));
    const finalArgumentRows = argumentRows.length > 0 ? argumentRows : anonymousTableUnderSyntax;

    const returnSectionHtml = extractSectionHtml(primaryContentHtml, 'Return value', [
        'Examples',
        'Usage',
        'See also',
    ]);
    const returnParagraphs = [...returnSectionHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);
    const returnTypeMatch = returnParagraphs[0]?.match(/^([A-Za-z_][A-Za-z0-9_]*)\./);
    const returnType = returnTypeMatch?.[1];
    const returnDocumentation = returnParagraphs.join(' ');

    return groups.map(group => {
        const signatures = group.signatures.map(signature => {
            const parameters = finalArgumentRows
                .map(([label, documentation]) => ({
                    label: normalizeWhitespace(label),
                    documentation: normalizeWhitespace(documentation),
                }))
                .filter(parameter => {
                    const normalizedLabel = parameter.label.toLowerCase();
                    const normalizedSignature = signature.label.toLowerCase();

                    return normalizedSignature.includes(normalizedLabel)
                        || (normalizedLabel === 'objectname' && normalizedSignature.includes('('))
                        || (normalizedLabel === 'dwcontrol' && normalizedSignature.includes('('));
                })
                .filter(parameter => {
                    const normalizedLabel = parameter.label.toLowerCase();
                    return normalizedLabel !== 'objectname' && normalizedLabel !== 'dwcontrol';
                });

            return {
                ...signature,
                parameters: parameters.length > 0 ? parameters : undefined,
                returnType: returnType || undefined,
            };
        });

        return {
            description,
            isGlobal,
            name: group.name,
            obsolete: /\((?:obsolete|obsoleta)\)$/i.test(title),
            ownerInfo: {
                appliesTo: rawAppliesToLabels,
                ownerScope: ownerTypes.length > 0 ? 'specific' : 'any',
                ownerTypes: unique(ownerTypes),
            },
            returnDocumentation: returnDocumentation || undefined,
            returnType: returnType || undefined,
            signatures,
            sourceUrl: url,
            usageNotes: usageNotes.length > 0 ? usageNotes : undefined,
        };
    });
}

function parsePowerScriptStatementPage(html, url) {
    const title = extractTitle(html);
    const primaryContentHtml = extractPrimaryContentHtml(html);
    const description = extractDescription(html);
    const signatures = extractSignatureLabels(extractSyntaxSectionHtml(primaryContentHtml))
        .map(label => ({ label }));
    const usageNotes = extractUsageNotes(primaryContentHtml);

    if (signatures.length === 0) {
        return undefined;
    }

    return {
        name: sanitizeOfficialTitle(title),
        description,
        signatures,
        sourceUrl: url,
        usageNotes: usageNotes.length > 0 ? usageNotes : undefined,
    };
}

function parsePowerScriptReservedWordPage(html, url) {
    const rows = extractTableRows(html);

    return rows.flatMap(row => row.map(cell => {
        const canBeFunctionName = cell.endsWith('*');
        const name = cell.replace('*', '').trim();

        if (!name) {
            return undefined;
        }

        return {
            name,
            canBeFunctionName,
            sourceUrl: url,
        };
    })).filter(Boolean);
}

function buildGeneratedReservedWordEntry(entry) {
    const isLiteral = OFFICIAL_LITERAL_RESERVED_WORDS.has(entry.name.toLowerCase());
    const isLogical = OFFICIAL_LOGICAL_RESERVED_WORDS.has(entry.name.toLowerCase());

    const category = OFFICIAL_GENERATED_KEYWORD_CATEGORY_OVERRIDES.get(entry.name.toLowerCase())
        ?? (isLiteral ? 'Literales' : isLogical ? 'Operadores lógicos' : 'Palabras reservadas');

    const identifierPolicy = entry.canBeFunctionName ? 'allowed-as-function-name' : undefined;
    const summary = entry.canBeFunctionName
        ? `Palabra reservada oficial de PowerBuilder que puede utilizarse como nombre de función. Fuente: ${entry.sourceUrl}`
        : `Palabra reservada oficial de PowerBuilder. Fuente: ${entry.sourceUrl}`;

    return {
        category,
        identifierPolicy,
        name: entry.name,
        reservedWordCanBeFunctionName: entry.canBeFunctionName,
        signatures: [{ label: entry.name }],
        sourceUrl: entry.sourceUrl,
        summary,
    };
}

function buildStatementLookupAliases(name) {
    const normalized = name.toLowerCase();

    if (normalized === 'do...loop') {
        return ['do', 'loop', 'until', 'while'];
    }

    if (normalized === 'for...next') {
        return ['for', 'to', 'step', 'next'];
    }

    if (normalized === 'if...then') {
        return ['if', 'then', 'elseif', 'else', 'endif'];
    }

    if (normalized === 'choose case') {
        return ['choose', 'case', 'is', 'else', 'end choose'];
    }

    if (normalized === 'try...catch...finally') {
        return ['try', 'catch', 'finally', 'end try'];
    }

    return undefined;
}

function extractStatementSignatures(html) {
    const sectionHtml = extractSectionHtml(html, 'Syntax', [
        'Examples',
        'Example',
        'Usage',
        'See also',
    ]);

    return unique(
        [...sectionHtml.matchAll(/<pre class="programlisting">([\s\S]*?)<\/pre>/gi)]
            .map(match => normalizeWhitespace(stripTags(match[1])))
            .filter(Boolean),
    );
}

module.exports = {
    parsePowerScriptPage,
    parsePowerScriptStatementPage,
    parsePowerScriptReservedWordPage,
    buildGeneratedReservedWordEntry,
    buildStatementLookupAliases,
    extractStatementSignatures,
    unknownPowerScriptAppliesToLabels,
};
