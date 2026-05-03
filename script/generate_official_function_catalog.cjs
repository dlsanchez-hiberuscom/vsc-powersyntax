'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');

const {
    listSystemDataWindowFunctions,
    listSystemGlobalFunctions,
    listSystemObjectFunctions,
    listSystemSymbolsByDataset,
} = require(path.join(repoRoot, 'out/server/knowledge/system/services/queryService'));
const {
    normalizeSystemSymbolName,
} = require(path.join(repoRoot, 'out/server/knowledge/system/normalization'));

const OUTPUT_CATALOG_FILE = path.join(
    repoRoot,
    'src/server/knowledge/system/generated/generated.generated.ts',
);
const OUTPUT_OWNER_TYPES_FILE = path.join(
    repoRoot,
    'src/server/knowledge/system/generated/ownerTypes.generated.ts',
);
const OUTPUT_PROVENANCE_FILE = path.join(
    repoRoot,
    'src/server/knowledge/system/generated/provenance.generated.ts',
);
const OUTPUT_OFFICIAL_COVERAGE_FILE = path.join(
    repoRoot,
    'src/server/knowledge/system/generated/officialCoverage.generated.ts',
);
const OUTPUT_PARSING_BUILTIN_TYPES_FILE = path.join(
    repoRoot,
    'src/server/parsing/generatedBuiltinTypes.generated.ts',
);
const OUTPUT_PARSING_KEYWORD_LEXEMES_FILE = path.join(
    repoRoot,
    'src/server/parsing/generatedKeywordLexemes.generated.ts',
);

const POWERSCRIPT_BASE_URL = 'https://docs.appeon.com/pb2025/powerscript_reference/';
const OBJECTS_AND_CONTROLS_BASE_URL = 'https://docs.appeon.com/pb2025/objects_and_controls/';
const DATAWINDOW_BASE_URL = 'https://docs.appeon.com/pb2025/datawindow_reference/';
const POWERSCRIPT_EVENTS_URL = new URL('ch02s03.html', POWERSCRIPT_BASE_URL).toString();
const POWERSCRIPT_FUNCTIONS_URL = new URL('PowerScript_Functions.html', POWERSCRIPT_BASE_URL).toString();
const POWERSCRIPT_STATEMENTS_URL = new URL('PowerScript_Statements.html', POWERSCRIPT_BASE_URL).toString();
const POWERSCRIPT_RESERVED_WORDS_URL = new URL('xREF_80481_Reserved_words.html', POWERSCRIPT_BASE_URL).toString();
const POWERSCRIPT_STANDARD_DATATYPES_URL = new URL('xREF_87805_Standard_datatypes.html', POWERSCRIPT_BASE_URL).toString();
const POWERSCRIPT_ANY_DATATYPE_URL = new URL('xREF_99128_The_Any_datatype.html', POWERSCRIPT_BASE_URL).toString();
const OBJECTS_AND_CONTROLS_INDEX_URL = new URL('index.html', OBJECTS_AND_CONTROLS_BASE_URL).toString();
const OBJECTS_AND_CONTROLS_UNDOCUMENTED_BASE_CLASSES_URL = new URL('ch01s03s01.html', OBJECTS_AND_CONTROLS_BASE_URL).toString();
const DATAWINDOW_INDEX_URL = new URL('index.html', DATAWINDOW_BASE_URL).toString();

const DATAWINDOW_OWNER_TYPES = new Set(['datawindow', 'datawindowchild', 'datastore']);
const NON_CONTROL_OBJECT_OWNER_TYPES = new Set(['application', 'menu', 'nonvisualobject']);

const SPECIAL_OWNER_SCOPE_ANY_OBJECT = '__any_object__';
const SPECIAL_OWNER_SCOPE_ALL_CONTROLS = '__all_controls__';
const SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_APPLICATION = '__any_object_except_application__';
const SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_MENU = '__any_object_except_menu__';
const SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_DATAWINDOWCHILD = '__any_object_except_datawindowchild__';
const SPECIAL_OWNER_SCOPE_ALL_CONTROLS_EXCEPT_DRAWING = '__all_controls_except_drawing__';

const DRAWING_CONTROL_OWNER_TYPES = new Set(['line', 'oval', 'rectangle', 'roundrectangle']);

const OFFICIAL_GENERATED_KEYWORD_CATEGORY_OVERRIDES = new Map([
    ['constant', 'Modificadores de declaración'],
    ['external', 'Modificadores de declaración'],
    ['global', 'Visibilidad y alcance'],
    ['indirect', 'Modificadores de declaración'],
    ['native', 'Modificadores de declaración'],
    ['private', 'Visibilidad y alcance'],
    ['privateread', 'Visibilidad y alcance'],
    ['privatewrite', 'Visibilidad y alcance'],
    ['protected', 'Visibilidad y alcance'],
    ['protectedread', 'Visibilidad y alcance'],
    ['protectedwrite', 'Visibilidad y alcance'],
    ['public', 'Visibilidad y alcance'],
    ['readonly', 'Modificadores de declaración'],
    ['ref', 'Modificadores de declaración'],
    ['rpcfunc', 'Modificadores de declaración'],
    ['shared', 'Visibilidad y alcance'],
    ['static', 'Modificadores de declaración'],
]);

const OFFICIAL_LITERAL_RESERVED_WORDS = new Set(['true', 'false', 'null']);
const OFFICIAL_LOGICAL_RESERVED_WORDS = new Set(['and', 'not', 'or', 'xor']);

const fetchCache = new Map();

const APPLY_TO_OWNER_TYPE_OVERRIDES = new Map([
    ['any object', SPECIAL_OWNER_SCOPE_ANY_OBJECT],
    ['all objects', SPECIAL_OWNER_SCOPE_ANY_OBJECT],
    ['any object except application', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_APPLICATION],
    ['any object except menu', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_MENU],
    ['any object except datawindowchild', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_DATAWINDOWCHILD],
    ['all controls', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['controls that can be placed in windows', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['controls that can be placed on a window', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['control', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['any control', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['all controls except drawing', SPECIAL_OWNER_SCOPE_ALL_CONTROLS_EXCEPT_DRAWING],
    ['all controls except drawing objects', SPECIAL_OWNER_SCOPE_ALL_CONTROLS_EXCEPT_DRAWING],
    ['a control within a window', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['any editable', ['singlelineedit', 'multilineedit', 'editmask', 'richtextedit', 'inkedit']],
    ['any object except a menu', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_MENU],
    ['except application object', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_APPLICATION],
    ['except a child datawindow', SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_DATAWINDOWCHILD],
    ['all text objects', ['singlelineedit', 'statictext', 'editmask', 'multilineedit']],
    ['visual controls', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['visual objects', SPECIAL_OWNER_SCOPE_ALL_CONTROLS],
    ['graph controls in windows', ['graph']],
    ['graph controls in windows and user objects', ['graph']],
    ['graph objects in windows', ['graph']],
    ['graphs in datawindow controls', ['datawindow']],
    ['in datawindow controls', ['datawindow']],
    ['powerbuilder datawindow', ['datawindow']],
    ['batch data objects', ['datawindow', 'datawindowchild', 'datastore']],
    ['datawindow control', ['datawindow']],
    ['datawindow control with richtextedit presentation style', ['datawindow']],
    ['datawindow controls with richtextedit style', ['datawindow']],
    ['datawindow controls whose content has richtextedit presentation style', ['datawindow']],
    ['datawindowchild object', ['datawindowchild']],
    ['datastore object', ['datastore']],
    ['datastores', ['datastore']],
    ['setitem', ['datawindow', 'datawindowchild', 'datastore']],
    ['a window', ['window']],
    ['windows', ['window']],
    ['mdi frame windows', ['mdiframe']],
    ['sheet windows', ['window']],
    ['visual user objects', ['userobject']],
    ['user objects used as tab pages', ['userobject']],
    ['web activex', []],
    ['datawindow web activex', []],
    ['client control', []],
    ['server component', []],
    ['window control', ['window']],
    ['window object', ['window']],
    ['menu object', ['menu']],
    ['application object', ['application']],
    ['nonvisualobject object', ['nonvisualobject']],
    ['ole control', ['olecontrol']],
    ['ole controls', ['olecontrol']],
    ['ole custom control', ['olecustomcontrol']],
    ['ole custom controls', ['olecustomcontrol']],
    ['ole dwobject', ['oledwobject']],
    ['ole dwobjects', ['oledwobject']],
]);

const SKIP_APPLIES_TO_LABELS = new Set([
    '',
    'argument',
    'description',
    'datawindow type',
    'method applies to',
    'powerbuilder',
    'web',
]);

const KNOWN_NON_FUNCTION_TITLES = [
    /^syntax\s+\d+$/i,
    /^syntax$/i,
    /^methods for /i,
    /^alphabetical list /i,
    /^appendix/i,
];

const OFFICIAL_STANDARD_DATATYPE_CELL_TO_NAME = new Map([
    ['blob', 'Blob'],
    ['boolean', 'Boolean'],
    ['byte', 'Byte'],
    ['char or character', 'Char'],
    ['date', 'Date'],
    ['datetime', 'DateTime'],
    ['decimal or dec', 'Decimal'],
    ['double', 'Double'],
    ['integer or int', 'Integer'],
    ['long', 'Long'],
    ['longlong', 'LongLong'],
    ['longptr', 'LongPtr'],
    ['real', 'Real'],
    ['string', 'String'],
    ['time', 'Time'],
    ['unsignedinteger, unsignedint, or uint', 'UnsignedInteger'],
    ['unsignedlong or ulong', 'UnsignedLong'],
]);

const OFFICIAL_SYSTEM_OBJECT_LABEL_BLACKLIST = new Set(['Home', 'Next', 'Prev', 'Sidebar', 'Up']);

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
    const endIndex = findLabelIndex(html, nextLabels, startIndex);
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

function extractDescription(html) {
    const sectionHtml = extractSectionHtml(html, 'Description', [
        'Applies to',
        'Syntax',
        'Return value',
        'Examples',
        'See also',
    ]);

    const paragraphMatch = sectionHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const description = normalizeWhitespace(stripTags(paragraphMatch?.[1] ?? sectionHtml));
    return description;
}

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

    const paragraphTexts = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);

    const tableCellTexts = [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
        .map(match => normalizeWhitespace(stripTags(match[1])))
        .filter(Boolean);

    const sourceTexts = linkTexts.length > 0
        ? linkTexts
        : paragraphTexts.length > 0
            ? paragraphTexts
            : tableCellTexts;

    return unique(
        sourceTexts
            .flatMap(splitAppliesToText)
            .filter(label => !SKIP_APPLIES_TO_LABELS.has(normalizeLabel(label))),
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
    const signatureLabels = unique(
        [...sectionHtml.matchAll(/<pre class="programlisting">([\s\S]*?)<\/pre>/gi)]
            .map(match => normalizeWhitespace(stripTags(match[1])))
            .filter(label => Boolean(label) && label.includes('(')),
    );

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

function extractArgumentNames(sectionHtml) {
    const argumentsHtml = extractSectionHtml(sectionHtml, 'Arguments', [
        'Applies to',
        'Return Values',
        'Usage',
        'Examples',
        'Example',
        'See also',
    ]);

    if (!argumentsHtml) {
        return [];
    }

    const argumentText = normalizeWhitespace(stripTags(argumentsHtml));

    if (!argumentText || /^none\b/i.test(argumentText)) {
        return [];
    }

    return unique(
        extractTableRows(argumentsHtml)
            .map(row => row[0])
            .filter(value => Boolean(value) && !/^none$/i.test(value)),
    );
}

function extractEventOwnerLabels(sectionHtml) {
    const eventIdHtml = extractSectionHtml(sectionHtml, 'Event ID', [
        'Applies to',
        'Arguments',
        'Return Values',
        'Usage',
        'Examples',
        'Example',
        'See also',
    ]);
    const eventIdRows = extractTableRows(eventIdHtml);
    const objectLabels = unique(
        eventIdRows
            .map(row => row[1] ?? '')
            .flatMap(splitAppliesToText)
            .filter(Boolean),
    );

    if (objectLabels.length > 0) {
        return objectLabels;
    }

    return extractAppliesToLabels(
        extractSectionHtml(sectionHtml, 'Applies to', [
            'Arguments',
            'Return Values',
            'Usage',
            'Examples',
            'Example',
            'See also',
        ]),
    );
}

function extractEventSections(html) {
    const bodyHtml = extractBodyAfterPrimaryTitle(html);
    const headingMatches = [...bodyHtml.matchAll(/<h[34][^>]*class="title"[^>]*>[\s\S]*?<\/h[34]>/gi)]
        .map(match => ({
            index: match.index,
            text: normalizeWhitespace(stripTags(match[0])),
            html: match[0],
        }))
        .filter(match => typeof match.index === 'number' && /^syntax\b/i.test(match.text));

    if (headingMatches.length === 0) {
        return [{ title: '', html: bodyHtml }];
    }

    return headingMatches.map((match, index) => {
        const startIndex = match.index + match.html.length;
        const endIndex = index + 1 < headingMatches.length
            ? headingMatches[index + 1].index
            : bodyHtml.length;

        return {
            title: match.text,
            html: bodyHtml.slice(startIndex, endIndex),
        };
    });
}

function extractStatementSignatures(html) {
    const sectionHtml = extractSyntaxSectionHtml(html);

    return unique(
        [...sectionHtml.matchAll(/<pre class="programlisting">([\s\S]*?)<\/pre>/gi)]
            .map(match => normalizeWhitespace(stripTags(match[1])))
            .filter(Boolean),
    );
}

const STATEMENT_LOOKUP_ALIASES = new Map([
    ['ASSIGNMENT', []],
    ['CALL', ['call']],
    ['CHOOSE CASE', ['choose', 'case', 'choose case']],
    ['CONTINUE', ['continue']],
    ['CREATE', ['create']],
    ['DESTROY', ['destroy']],
    ['DO...LOOP', ['do', 'loop', 'do while', 'do until', 'loop while', 'loop until']],
    ['EXIT', ['exit']],
    ['FOR...NEXT', ['for', 'next', 'for next']],
    ['GOTO', ['goto']],
    ['HALT', ['halt', 'halt close']],
    ['IF...THEN', ['if', 'then', 'else', 'elseif', 'end if', 'if then']],
    ['RETURN', ['return']],
    ['THROW', ['throw']],
    ['THROWS', ['throws']],
    ['TRY...CATCH...FINALLY...END TRY', ['try', 'catch', 'finally', 'end try', 'try catch finally end try']],
]);

function buildStatementLookupAliases(title) {
    return unique(STATEMENT_LOOKUP_ALIASES.get(title.toUpperCase()) ?? []);
}

function extractReplacement(html, callableName) {
    const flattenedText = normalizeWhitespace(stripTags(html));
    const replacementPatterns = [
        /use\s+([A-Za-z_][A-Za-z0-9_.]*)\s+instead/i,
        /replaced\s+by\s+([A-Za-z_][A-Za-z0-9_.]*)/i,
        /replacement\s+for\s+([A-Za-z_][A-Za-z0-9_.]*)/i,
    ];

    for (const pattern of replacementPatterns) {
        const match = pattern.exec(flattenedText);

        if (!match) {
            continue;
        }

        const candidate = match[1].split('.').pop();

        if (!candidate) {
            continue;
        }

        if (normalizeSystemSymbolName(candidate) === normalizeSystemSymbolName(callableName)) {
            continue;
        }

        return candidate;
    }

    return undefined;
}

function parseAppliesToOwnerInfo(appliesToLabels) {
    const ownerTypes = new Set();
    const mappings = [];
    const unknownLabels = [];
    let hasAnyObjectScope = false;
    let hasAllControlsScope = false;
    let specialOwnerScope = 'none';

    const normalizedLabels = appliesToLabels.map(label => normalizeLabel(label));
    const hasGraphWindowScope = normalizedLabels.some(label => label === 'graph controls in windows' || label === 'graph objects in windows');
    const shouldSkipGraphContextLabel = normalized => hasGraphWindowScope && (
        normalized.startsWith('user object')
        || normalized === 'graphs in datawindow controls'
        || normalized === 'in datawindow controls'
    );

    for (const label of appliesToLabels) {
        const normalized = normalizeLabel(label);

        if (!normalized || SKIP_APPLIES_TO_LABELS.has(normalized) || shouldSkipGraphContextLabel(normalized)) {
            continue;
        }

        const override = APPLY_TO_OWNER_TYPE_OVERRIDES.get(normalized);

        if (override === SPECIAL_OWNER_SCOPE_ANY_OBJECT) {
            hasAnyObjectScope = true;
            mappings.push({ label, ownerTypes: [], scope: 'any-object' });
            continue;
        }

        if (override === SPECIAL_OWNER_SCOPE_ALL_CONTROLS) {
            hasAllControlsScope = true;
            mappings.push({ label, ownerTypes: [], scope: 'all-controls' });
            continue;
        }

        if (override === SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_APPLICATION) {
            specialOwnerScope = 'any-object-except-application';
            mappings.push({ label, ownerTypes: [], scope: 'any-object-except-application' });
            continue;
        }

        if (override === SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_MENU) {
            specialOwnerScope = 'any-object-except-menu';
            mappings.push({ label, ownerTypes: [], scope: 'any-object-except-menu' });
            continue;
        }

        if (override === SPECIAL_OWNER_SCOPE_ANY_OBJECT_EXCEPT_DATAWINDOWCHILD) {
            specialOwnerScope = 'any-object-except-datawindowchild';
            mappings.push({ label, ownerTypes: [], scope: 'any-object-except-datawindowchild' });
            continue;
        }

        if (override === SPECIAL_OWNER_SCOPE_ALL_CONTROLS_EXCEPT_DRAWING) {
            specialOwnerScope = 'all-controls-except-drawing';
            mappings.push({ label, ownerTypes: [], scope: 'all-controls-except-drawing' });
            continue;
        }

        if (Array.isArray(override)) {
            override.forEach(ownerType => ownerTypes.add(ownerType));
            mappings.push({ label, ownerTypes: override, scope: 'specific' });
            continue;
        }

        let cleaned = normalized
            .replace(/\([^)]*\)/g, ' ')
            .replace(/\bthe\b/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        cleaned = cleaned
            .replace(/\bcontrols\b$/i, '')
            .replace(/\bcontrol\b$/i, '')
            .replace(/\bobjects\b$/i, '')
            .replace(/\bobject\b$/i, '')
            .trim();

        if (!cleaned) {
            unknownLabels.push(label);
            continue;
        }

        const ownerType = cleaned
            .replace(/dwobjects$/i, 'dwobject')
            .replace(/[^a-z0-9]+/gi, '')
            .toLowerCase();

        if (!ownerType || ownerType === 'all' || ownerType === 'any') {
            unknownLabels.push(label);
            continue;
        }

        ownerTypes.add(ownerType);
        mappings.push({ label, ownerTypes: [ownerType], scope: 'specific' });
    }

    const ownerScope = ownerTypes.size > 0
        ? 'specific'
        : specialOwnerScope !== 'none'
            ? specialOwnerScope
        : hasAnyObjectScope
            ? 'any-object'
            : hasAllControlsScope
                ? 'all-controls'
                : 'none';

    return {
        appliesTo: unique(appliesToLabels),
        mappings,
        ownerScope,
        ownerTypes: Array.from(ownerTypes).sort(),
        unknownLabels: unique(unknownLabels),
    };
}

function shouldSkipByTitle(title) {
    return KNOWN_NON_FUNCTION_TITLES.some(pattern => pattern.test(title));
}

function parsePowerScriptPage(html, pageUrl) {
    const title = sanitizeOfficialTitle(extractTitle(html));

    if (!title || shouldSkipByTitle(title)) {
        return [];
    }

    const signatureGroups = extractSignatureGroups(html, title);

    if (signatureGroups.length === 0) {
        return [];
    }

    const description = extractDescription(html);
    const appliesToLabels = extractAppliesToLabels(
        extractSectionHtml(html, 'Applies to', ['Syntax', 'Return value', 'Examples', 'See also']),
    );
    const ownerInfo = parseAppliesToOwnerInfo(appliesToLabels);
    const obsolete = /\bobsolete\b/i.test(title);

    return signatureGroups.map(group => ({
        appliesTo: ownerInfo.appliesTo,
        description,
        isGlobal: ownerInfo.appliesTo.length === 0,
        name: group.name,
        obsolete,
        obsoleteMessage: obsolete
            ? 'Marcada como obsoleta en la referencia oficial de Appeon.'
            : undefined,
        ownerInfo,
        replacement: obsolete ? extractReplacement(html, group.name) : undefined,
        signatures: group.signatures,
        sourceUrl: pageUrl,
        title,
    }));
}

function isLegacyWebDataWindowPage(title, description, signatureGroups) {
    const haystack = normalizeWhitespace([
        title,
        description,
        ...signatureGroups.flatMap(group => group.signatures.map(signature => signature.label)),
    ].join(' ')).toLowerCase();

    return [
        'web datawindow',
        'web activex',
        'server component',
        'client control',
        'client-side',
        'dwcomponent.',
        'generated html',
        'xhtml',
        'xml content',
        'html form',
        'htmlobjectname',
        'selflink',
    ].some(token => haystack.includes(token));
}

function parseDataWindowPage(html, pageUrl, chapterTitle) {
    const title = sanitizeOfficialTitle(extractTitle(html));

    if (!title || shouldSkipByTitle(title)) {
        return [];
    }

    const signatureGroups = extractSignatureGroups(html, title);

    if (signatureGroups.length === 0) {
        return [];
    }

    const description = extractDescription(html);
    const ownerInfo = parseAppliesToOwnerInfo(
        extractAppliesToLabels(
            extractSectionHtml(html, 'Applies to', ['Syntax', 'Return value', 'Examples', 'See also']),
        ),
    );

    if (isLegacyWebDataWindowPage(title, description, signatureGroups)) {
        return [];
    }

    const specificOwnerTypes = ownerInfo.ownerTypes.filter(ownerType => DATAWINDOW_OWNER_TYPES.has(ownerType));
    const specificAppliesTo = ownerInfo.appliesTo.filter(label => {
        const normalized = normalizeLabel(label);
        const override = APPLY_TO_OWNER_TYPE_OVERRIDES.get(normalized);
        return Array.isArray(override)
            ? override.some(ownerType => DATAWINDOW_OWNER_TYPES.has(ownerType))
            : false;
    });

    const fallbackOwnerTypes = /graphs/i.test(chapterTitle)
        ? ['datawindow', 'datastore']
        : [];
    const fallbackAppliesTo = /graphs/i.test(chapterTitle)
        ? ['DataWindow control', 'DataStore object']
        : [];

    const effectiveOwnerInfo = specificOwnerTypes.length > 0
        ? {
            ...ownerInfo,
            appliesTo: specificAppliesTo,
            ownerTypes: specificOwnerTypes,
            ownerScope: 'specific',
        }
        : fallbackOwnerTypes.length > 0
            ? {
            ...ownerInfo,
            appliesTo: fallbackAppliesTo,
            ownerTypes: fallbackOwnerTypes,
            ownerScope: 'specific',
        }
            : {
                ...ownerInfo,
                appliesTo: [],
                ownerTypes: [],
                ownerScope: 'none',
            };

    if (effectiveOwnerInfo.ownerTypes.length === 0) {
        return [];
    }

    const obsolete = /\bobsolete\b/i.test(title);

    return signatureGroups.map(group => ({
        appliesTo: effectiveOwnerInfo.appliesTo,
        description,
        name: group.name,
        obsolete,
        obsoleteMessage: obsolete
            ? 'Marcada como obsoleta en la referencia oficial de Appeon.'
            : undefined,
        ownerInfo: effectiveOwnerInfo,
        replacement: obsolete ? extractReplacement(html, group.name) : undefined,
        signatures: group.signatures,
        sourceUrl: pageUrl,
        title,
    }));
}

function parsePowerScriptEventPage(html, pageUrl, options = {}) {
    const title = sanitizeOfficialTitle(extractTitle(html));

    if (!title || shouldSkipByTitle(title)) {
        return [];
    }

    const sections = extractEventSections(html);
    const obsolete = options.obsolete === true || /\bobsolete\b/i.test(title);

    return sections.map(section => {
        const ownerLabels = extractEventOwnerLabels(section.html);
        const ownerInfo = parseAppliesToOwnerInfo(ownerLabels);
        const signatures = [{
            label: `${title}(${extractArgumentNames(section.html).join(', ')})`.replace(/\(\)$/, '()'),
        }];

        if (ownerInfo.ownerScope === 'none' && ownerInfo.ownerTypes.length === 0) {
            return undefined;
        }

        return {
            appliesTo: ownerInfo.appliesTo,
            description: extractDescription(section.html) || extractDescription(html),
            isGlobal: false,
            name: title,
            obsolete,
            obsoleteMessage: obsolete
                ? 'Marcada como obsoleta en la referencia oficial de Appeon.'
                : undefined,
            ownerInfo,
            replacement: undefined,
            signatures,
            sourceUrl: pageUrl,
            title: section.title ? `${title} — ${section.title}` : title,
        };
    }).filter(Boolean);
}

function parsePowerScriptStatementPage(html, pageUrl) {
    const title = sanitizeOfficialTitle(extractTitle(html));

    if (!title || shouldSkipByTitle(title)) {
        return undefined;
    }

    const syntaxLabels = extractStatementSignatures(html);

    if (syntaxLabels.length === 0) {
        return undefined;
    }

    return {
        appliesTo: ['sentencias PowerScript'],
        description: extractDescription(html),
        lookupAliases: buildStatementLookupAliases(title),
        name: title,
        signatures: syntaxLabels.map(label => ({ label })),
        sourceUrl: pageUrl,
        title,
    };
}

function parseOfficialStandardDatatypeNames(html) {
    const names = unique(
        [...html.matchAll(/<a class="link" href="xREF_87805_Standard_datatypes\.html#[^"]+">([\s\S]*?)<\/a>/gi)]
            .map(match => normalizeWhitespace(stripTags(match[1])).toLowerCase())
            .map(value => OFFICIAL_STANDARD_DATATYPE_CELL_TO_NAME.get(value))
            .filter(Boolean),
    );

    if (names.length < 10) {
        throw new Error('No se pudo extraer la lista oficial de standard datatypes.');
    }

    return names;
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

function parsePowerScriptReservedWordPage(html, sourceUrl) {
    const tableMatch = html.match(/<table[\s\S]*?<p>\s*alias\s*<\/p>[\s\S]*?<p>\s*autoinstantiate\s*<\/p>[\s\S]*?<\/table>/i);

    if (!tableMatch) {
        throw new Error('No se pudo extraer la tabla oficial de reserved words.');
    }

    const reservedWords = [];
    const seen = new Set();

    for (const match of tableMatch[0].matchAll(/<p[^>]*>\s*([a-z_][a-z0-9_]*\*?)\s*<\/p>/gi)) {
        const token = match[1];
        const canBeFunctionName = token.endsWith('*');
        const name = token.replace(/\*$/u, '');
        const normalizedName = normalizeSystemSymbolName(name);

        if (!normalizedName || seen.has(normalizedName)) {
            continue;
        }

        seen.add(normalizedName);
        reservedWords.push({
            name,
            canBeFunctionName,
            sourceUrl,
        });
    }

    if (reservedWords.length === 0) {
        throw new Error('La tabla oficial de reserved words no produjo unidades válidas.');
    }

    return reservedWords;
}

function buildOfficialKeywordCategoryMap(manualKeywordEntries) {
    const categoryByName = new Map();

    for (const entry of manualKeywordEntries) {
        if (entry.normalizedName) {
            categoryByName.set(entry.normalizedName, entry.category);
        }
    }

    for (const [name, category] of OFFICIAL_GENERATED_KEYWORD_CATEGORY_OVERRIDES.entries()) {
        categoryByName.set(name, category);
    }

    return categoryByName;
}

function buildGeneratedKeywordSummary(category, canBeFunctionName) {
    const summaryByCategory = {
        'Bloque': 'Keyword oficial de delimitación de bloques en PowerScript.',
        'Control de flujo': 'Keyword oficial de control de flujo en PowerScript.',
        'Declaración': 'Keyword oficial de declaración en PowerScript.',
        'Invocación': 'Keyword oficial de invocación en PowerScript.',
        'Manejo de errores': 'Keyword oficial de manejo de errores en PowerScript.',
        'Modificadores de declaración': 'Keyword oficial de modificación de declaraciones en PowerScript.',
        'Visibilidad y alcance': 'Keyword oficial de visibilidad o alcance en PowerScript.',
    };

    const summary = summaryByCategory[category] ?? 'Keyword oficial de PowerScript.';
    return canBeFunctionName ? `${summary} Puede usarse también como nombre de función.` : summary;
}

function buildGeneratedReservedWordCategory(normalizedName) {
    if (OFFICIAL_LITERAL_RESERVED_WORDS.has(normalizedName)) {
        return 'Literales';
    }

    if (OFFICIAL_LOGICAL_RESERVED_WORDS.has(normalizedName)) {
        return 'Operadores lógicos';
    }

    return 'Palabras reservadas';
}

function buildGeneratedReservedWordSummary(normalizedName, canBeFunctionName) {
    const summary = OFFICIAL_LITERAL_RESERVED_WORDS.has(normalizedName)
        ? 'Literal reservado oficial de PowerScript.'
        : OFFICIAL_LOGICAL_RESERVED_WORDS.has(normalizedName)
            ? 'Operador lógico reservado oficial de PowerScript.'
            : 'Palabra reservada oficial de PowerScript.';

    return canBeFunctionName ? `${summary} Puede usarse también como nombre de función.` : summary;
}

function buildGeneratedKeywordEntry(entry, category) {
    const label = entry.name.toUpperCase();

    return {
        category,
        name: label,
        signatures: [{ label }],
        sourceUrl: entry.sourceUrl,
        summary: buildGeneratedKeywordSummary(category, entry.canBeFunctionName),
    };
}

function buildGeneratedReservedWordEntry(entry) {
    const normalizedName = normalizeSystemSymbolName(entry.name);
    const label = entry.name.toUpperCase();

    return {
        category: buildGeneratedReservedWordCategory(normalizedName),
        name: label,
        signatures: [{ label }],
        sourceUrl: entry.sourceUrl,
        summary: buildGeneratedReservedWordSummary(normalizedName, entry.canBeFunctionName),
    };
}

function filterAppliesToLabels(ownerInfo, selectedOwnerTypes) {
    if (ownerInfo.ownerScope === 'any-object' || ownerInfo.ownerScope === 'all-controls') {
        return ownerInfo.appliesTo;
    }

    return unique(
        ownerInfo.mappings
            .filter(mapping => mapping.scope === 'specific'
                && mapping.ownerTypes.some(ownerType => selectedOwnerTypes.includes(ownerType)))
            .map(mapping => mapping.label),
    );
}

function sortGeneratedEntries(entries) {
    return [...entries].sort((left, right) => {
        const nameComparison = left.name.localeCompare(right.name, 'en', { sensitivity: 'base' });

        if (nameComparison !== 0) {
            return nameComparison;
        }

        return (left.ownerTypes ?? []).join('+').localeCompare((right.ownerTypes ?? []).join('+'));
    });
}

function renderString(value) {
    return JSON.stringify(value);
}

function renderStringArray(values) {
    return `[${values.map(renderString).join(', ')}]`;
}

function renderSignatures(signatures) {
    return `[${signatures.map(signature => `{ label: ${renderString(signature.label)} }`).join(', ')}]`;
}

function renderBuilderCall(builderName, entry) {
    const properties = [
        `name: ${renderString(entry.name)}`,
        `category: ${renderString(entry.category)}`,
        `summary: ${renderString(entry.summary)}`,
        `signatures: ${renderSignatures(entry.signatures)}`,
        entry.appliesTo?.length ? `appliesTo: ${renderStringArray(entry.appliesTo)}` : undefined,
        entry.ownerTypes?.length ? `ownerTypes: ${renderStringArray(entry.ownerTypes)}` : undefined,
        entry.lookupAliases?.length ? `lookupAliases: ${renderStringArray(entry.lookupAliases)}` : undefined,
        entry.obsolete ? 'obsolete: true' : undefined,
        entry.obsoleteMessage ? `obsoleteMessage: ${renderString(entry.obsoleteMessage)}` : undefined,
        entry.replacement ? `replacement: ${renderString(entry.replacement)}` : undefined,
        `sourceUrl: ${renderString(entry.sourceUrl)}`,
    ].filter(Boolean);

    return `    ${builderName}({ ${properties.join(', ')} }),`;
}

function renderCatalogFile(globalEntries, objectEntries, dataWindowEntries, systemTypeEntries, eventEntries, statementEntries) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        "import { PbSystemSymbolEntry } from '../types';",
        "import { generatedDataWindowFunction, generatedEvent, generatedGlobalFunction, generatedKeyword, generatedObjectFunction, generatedReservedWord, generatedStatement, generatedSystemObjectDatatype } from './common';",
        '',
        'export const PB_GENERATED_GLOBAL_FUNCTIONS: readonly PbSystemSymbolEntry[] = [',
        ...globalEntries.map(entry => renderBuilderCall('generatedGlobalFunction', entry)),
        '];',
        '',
        'export const PB_GENERATED_KEYWORDS: readonly PbSystemSymbolEntry[] = [',
        ...objectEntries.__keywords__.map(entry => renderBuilderCall('generatedKeyword', entry)),
        '];',
        '',
        'export const PB_GENERATED_RESERVED_WORDS: readonly PbSystemSymbolEntry[] = [',
        ...objectEntries.__reservedWords__.map(entry => renderBuilderCall('generatedReservedWord', entry)),
        '];',
        '',
        'export const PB_GENERATED_OBJECT_FUNCTIONS: readonly PbSystemSymbolEntry[] = [',
        ...objectEntries.entries.map(entry => renderBuilderCall('generatedObjectFunction', entry)),
        '];',
        '',
        'export const PB_GENERATED_DATAWINDOW_FUNCTIONS: readonly PbSystemSymbolEntry[] = [',
        ...dataWindowEntries.map(entry => renderBuilderCall('generatedDataWindowFunction', entry)),
        '];',
        '',
        'export const PB_GENERATED_SYSTEM_OBJECT_DATATYPES: readonly PbSystemSymbolEntry[] = [',
        ...systemTypeEntries.map(entry => renderBuilderCall('generatedSystemObjectDatatype', entry)),
        '];',
        '',
        'export const PB_GENERATED_EVENTS: readonly PbSystemSymbolEntry[] = [',
        ...eventEntries.map(entry => renderBuilderCall('generatedEvent', entry)),
        '];',
        '',
        'export const PB_GENERATED_STATEMENTS: readonly PbSystemSymbolEntry[] = [',
        ...statementEntries.map(entry => renderBuilderCall('generatedStatement', entry)),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderBuiltInTypesFile(typeNames) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        'export const PB_GENERATED_BUILTIN_TYPES: readonly string[] = [',
        ...typeNames.map(typeName => `    ${renderString(typeName)},`),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderKeywordLexemesFile(lexemes) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        'export const PB_GENERATED_KEYWORD_LEXEMES: readonly string[] = [',
        ...lexemes.map(lexeme => `    ${renderString(lexeme)},`),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderOwnerTypesFile(ownerTypes) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        'export const PB_GENERATED_OBJECT_OWNER_TYPES_EXTENDED: readonly string[] = [',
        ...ownerTypes.map(ownerType => `    ${renderString(ownerType)},`),
        '];',
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderProvenanceFile(generatedAt) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        `export const PB_GENERATED_CATALOG_GENERATED_AT = ${renderString(generatedAt)};`,
        '',
    ];

    return `${lines.join('\n')}\n`;
}

function renderOfficialCoverageFile(coverageByDomain) {
    const lines = [
        '// Auto-generated from the official Appeon references by scripts/generate_official_function_catalog.cjs.',
        'export const PB_GENERATED_OFFICIAL_COVERAGE = {',
    ];

    for (const [domain, coverage] of Object.entries(coverageByDomain)) {
        lines.push(`    ${renderString(domain)}: {`);
        lines.push(`        measurement: ${renderString(coverage.measurement)},`);
        lines.push(`        officialCount: ${coverage.officialCount},`);
        lines.push(`        coveredCount: ${coverage.coveredCount},`);
        lines.push(`        missingCount: ${coverage.missingCount},`);
        if (coverage.missingUnits.length > 0) {
            lines.push(`        missingUnits: ${renderStringArray(coverage.missingUnits)},`);
        }
        lines.push('    },');
    }

    lines.push('} as const;');
    lines.push('');

    return `${lines.join('\n')}\n`;
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

function collectManualObjectOwnerUniverse() {
    const manualEntries = listSystemSymbolsByDataset('manual-core');

    return unique(
        manualEntries
            .filter(entry => entry.domain === 'object-functions')
            .flatMap(entry => entry.normalizedOwnerTypes ?? []),
    ).sort();
}

function buildControlOwnerUniverse(objectOwnerUniverse) {
    return objectOwnerUniverse.filter(ownerType => !NON_CONTROL_OBJECT_OWNER_TYPES.has(ownerType));
}

async function loadPowerScriptLinks() {
    const html = await fetchText(POWERSCRIPT_FUNCTIONS_URL);

    return unique(
        [...html.matchAll(/<dt><span class="section"><a href="([^"]+\.html)"/g)]
            .map(match => match[1])
            .filter(href => !/^https?:/i.test(href) && !/CommonErrorCodes\.html$/i.test(href))
            .map(href => new URL(href, POWERSCRIPT_BASE_URL).toString()),
    );
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

async function loadPowerScriptStatementLinks() {
    const html = await fetchText(POWERSCRIPT_STATEMENTS_URL);

    return unique(
        [...html.matchAll(/<dt><span class="section"><a href="([^"]+\.html)"[^>]*>([\s\S]*?)<\/a><\/span><\/dt>/gi)]
            .map(match => ({
                label: normalizeWhitespace(stripTags(match[2])),
                url: new URL(match[1], POWERSCRIPT_BASE_URL).toString(),
            }))
            .filter(reference => reference.label && !/^powerscript statements$/i.test(reference.label))
            .map(reference => reference.url),
    );
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

function buildGeneratedEntry(baseEntry, ownerTypes, appliesTo) {
    return {
        appliesTo,
        category: 'Referencia oficial',
        lookupAliases: baseEntry.lookupAliases,
        name: baseEntry.name,
        obsolete: baseEntry.obsolete,
        obsoleteMessage: baseEntry.obsoleteMessage,
        ownerTypes: ownerTypes.length > 0 ? ownerTypes : undefined,
        replacement: baseEntry.replacement,
        signatures: baseEntry.signatures,
        sourceUrl: baseEntry.sourceUrl,
        summary: baseEntry.description || `Official generated coverage for ${baseEntry.name}.`,
    };
}

async function main() {
    console.log('Descargando índice oficial de PowerScript Functions...');
    const powerScriptUrls = await loadPowerScriptLinks();
    console.log(`PowerScript Functions: ${powerScriptUrls.length} páginas candidatas.`);

    const parsedPowerScriptPages = (await mapConcurrent(powerScriptUrls, 12, async url => {
        const html = await fetchText(url);
        return parsePowerScriptPage(html, url);
    })).flat();

    const manualEntries = listSystemSymbolsByDataset('manual-core');
    const manualGlobalEntries = manualEntries.filter(entry => entry.domain === 'global-functions');
    const manualObjectEntries = manualEntries.filter(entry => entry.domain === 'object-functions');
    const manualDataWindowEntries = manualEntries.filter(entry => entry.domain === 'datawindow-functions');
    const manualKeywordEntries = manualEntries.filter(entry => entry.domain === 'keywords');
    const manualReservedWordEntries = manualEntries.filter(entry => entry.domain === 'reserved-words');
    const manualDatatypeEntries = manualEntries.filter(entry => entry.domain === 'datatypes');
    const manualSystemTypeEntries = manualEntries.filter(entry => entry.domain === 'system-object-datatypes');
    const manualPronounEntries = manualEntries.filter(entry => entry.domain === 'pronouns');
    const manualSystemEventEntries = manualEntries.filter(entry => entry.domain === 'system-events');
    const manualStatementEntries = manualEntries.filter(entry => entry.domain === 'statements');
    const manualSystemGlobalEntries = manualEntries.filter(entry => entry.domain === 'system-globals');
    const currentObjectOwnerUniverse = collectManualObjectOwnerUniverse();
    const specificParsedObjectOwnerTypes = unique(
        parsedPowerScriptPages
            .filter(entry => !entry.isGlobal && entry.ownerInfo.ownerScope === 'specific')
            .flatMap(entry => entry.ownerInfo.ownerTypes)
            .filter(ownerType => !DATAWINDOW_OWNER_TYPES.has(ownerType)),
    );

    console.log('Descargando índice oficial de PowerScript Events...');
    const powerScriptEventReferences = await loadPowerScriptEventLinks();
    console.log(`PowerScript Events: ${powerScriptEventReferences.length} páginas candidatas.`);

    const parsedPowerScriptEventPages = (await mapConcurrent(powerScriptEventReferences, 12, async reference => {
        const html = await fetchText(reference.url);
        return parsePowerScriptEventPage(html, reference.url, { obsolete: reference.obsolete });
    })).flat();

    console.log('Descargando índice oficial de PowerScript Statements...');
    const powerScriptStatementUrls = await loadPowerScriptStatementLinks();
    console.log(`PowerScript Statements: ${powerScriptStatementUrls.length} páginas candidatas.`);

    const parsedPowerScriptStatements = (await mapConcurrent(powerScriptStatementUrls, 12, async url => {
        const html = await fetchText(url);
        return parsePowerScriptStatementPage(html, url);
    })).filter(Boolean);

    console.log('Descargando página oficial de Reserved words...');
    const officialReservedWordEntries = parsePowerScriptReservedWordPage(
        await fetchText(POWERSCRIPT_RESERVED_WORDS_URL),
        POWERSCRIPT_RESERVED_WORDS_URL,
    );

    const objectOwnerUniverse = unique([
        ...currentObjectOwnerUniverse,
        ...specificParsedObjectOwnerTypes,
        ...parsedPowerScriptEventPages
            .filter(entry => entry.ownerInfo.ownerScope === 'specific')
            .flatMap(entry => entry.ownerInfo.ownerTypes),
    ]).sort();
    const controlOwnerUniverse = buildControlOwnerUniverse(objectOwnerUniverse);

    const globalCoverage = buildCoverageMap(manualGlobalEntries, 'global-functions');
    const objectCoverage = buildCoverageMap(manualObjectEntries, 'object-functions');
    const dataWindowCoverage = buildCoverageMap(manualDataWindowEntries, 'datawindow-functions');
    const keywordCoverage = buildLookupCoverageSet(manualKeywordEntries);
    const reservedWordCoverage = buildLookupCoverageSet(manualReservedWordEntries);
    const datatypeCoverage = buildLookupCoverageSet(manualDatatypeEntries);
    const pronounCoverage = buildLookupCoverageSet(manualPronounEntries);
    const systemTypeCoverage = buildCoverageMap(manualSystemTypeEntries, 'system-object-datatypes');
    const systemEventCoverage = buildCoverageMap(manualSystemEventEntries, 'system-events');
    const systemGlobalCoverage = buildLookupCoverageSet(manualSystemGlobalEntries);
    const statementCoverage = buildCoverageMap(manualStatementEntries, 'statements');
    const officialKeywordCategoryMap = buildOfficialKeywordCategoryMap(manualKeywordEntries);

    const generatedGlobalEntries = [];
    const generatedKeywordEntries = [];
    const generatedObjectEntries = [];
    const generatedReservedWordEntries = [];
    const generatedEventEntries = [];
    const generatedStatementEntries = [];
    const officialKeywordUnits = [];
    const officialReservedWordUnits = [];
    const unknownPowerScriptAppliesToLabels = new Map();
    const unknownPowerScriptEventOwnerLabels = new Map();

    for (const entry of officialReservedWordEntries) {
        const normalizedName = normalizeSystemSymbolName(entry.name);

        if (!normalizedName || pronounCoverage.has(normalizedName) || systemGlobalCoverage.has(normalizedName)) {
            continue;
        }

        const keywordCategory = officialKeywordCategoryMap.get(normalizedName);

        if (keywordCategory) {
            officialKeywordUnits.push(entry.name);

            if (!keywordCoverage.has(normalizedName)) {
                generatedKeywordEntries.push(buildGeneratedKeywordEntry(entry, keywordCategory));
                keywordCoverage.add(normalizedName);
            }

            continue;
        }

        officialReservedWordUnits.push(entry.name);

        if (!reservedWordCoverage.has(normalizedName)) {
            generatedReservedWordEntries.push(buildGeneratedReservedWordEntry(entry));
            reservedWordCoverage.add(normalizedName);
        }
    }

    for (const entry of sortGeneratedEntries(parsedPowerScriptPages.filter(candidate => candidate.isGlobal))) {
        const normalizedName = normalizeSystemSymbolName(entry.name);

        if (!normalizedName) {
            continue;
        }

        const coverageKey = `global-functions|${normalizedName}`;

        if (globalCoverage.has(coverageKey)) {
            continue;
        }

        generatedGlobalEntries.push(buildGeneratedEntry(entry, [], []));
        registerCoverage(globalCoverage, 'global-functions', entry.name, []);
    }

    const specificObjectCandidates = parsedPowerScriptPages
        .filter(entry => !entry.isGlobal && entry.ownerInfo.ownerScope === 'specific')
        .map(entry => {
            const ownerTypes = entry.ownerInfo.ownerTypes.filter(ownerType => !DATAWINDOW_OWNER_TYPES.has(ownerType));
            return { ...entry, ownerTypes };
        })
        .filter(entry => entry.ownerTypes.length > 0);

    const universalObjectCandidates = parsedPowerScriptPages
        .filter(entry => !entry.isGlobal && (
            entry.ownerInfo.ownerScope === 'any-object'
            || entry.ownerInfo.ownerScope === 'all-controls'
            || entry.ownerInfo.ownerScope === 'any-object-except-application'
            || entry.ownerInfo.ownerScope === 'any-object-except-menu'
            || entry.ownerInfo.ownerScope === 'any-object-except-datawindowchild'
            || entry.ownerInfo.ownerScope === 'all-controls-except-drawing'
        ));

    for (const entry of sortGeneratedEntries(specificObjectCandidates)) {
        if (entry.ownerInfo.unknownLabels.length > 0) {
            unknownPowerScriptAppliesToLabels.set(entry.sourceUrl, entry.ownerInfo.unknownLabels);
        }

        const uncoveredOwnerTypes = getUncoveredOwnerTypes(
            objectCoverage,
            'object-functions',
            entry.name,
            entry.ownerTypes,
            [],
        );

        if (uncoveredOwnerTypes.length === 0) {
            continue;
        }

        generatedObjectEntries.push(
            buildGeneratedEntry(
                entry,
                uncoveredOwnerTypes,
                filterAppliesToLabels(entry.ownerInfo, uncoveredOwnerTypes),
            ),
        );
        registerCoverage(objectCoverage, 'object-functions', entry.name, uncoveredOwnerTypes);
    }

    for (const entry of sortGeneratedEntries(universalObjectCandidates)) {
        if (entry.ownerInfo.unknownLabels.length > 0) {
            unknownPowerScriptAppliesToLabels.set(entry.sourceUrl, entry.ownerInfo.unknownLabels);
        }

        const fallbackUniverse = entry.ownerInfo.ownerScope === 'all-controls'
            ? controlOwnerUniverse
            : entry.ownerInfo.ownerScope === 'all-controls-except-drawing'
                ? controlOwnerUniverse.filter(ownerType => !DRAWING_CONTROL_OWNER_TYPES.has(ownerType))
                : entry.ownerInfo.ownerScope === 'any-object-except-application'
                    ? objectOwnerUniverse.filter(ownerType => ownerType !== 'application')
                    : entry.ownerInfo.ownerScope === 'any-object-except-menu'
                        ? objectOwnerUniverse.filter(ownerType => ownerType !== 'menu')
                        : entry.ownerInfo.ownerScope === 'any-object-except-datawindowchild'
                            ? objectOwnerUniverse.filter(ownerType => ownerType !== 'datawindowchild')
                            : objectOwnerUniverse;
        const uncoveredOwnerTypes = getUncoveredOwnerTypes(
            objectCoverage,
            'object-functions',
            entry.name,
            [],
            fallbackUniverse,
        );

        if (uncoveredOwnerTypes.length === 0) {
            continue;
        }

        generatedObjectEntries.push(
            buildGeneratedEntry(entry, uncoveredOwnerTypes, entry.ownerInfo.appliesTo),
        );
        registerCoverage(objectCoverage, 'object-functions', entry.name, uncoveredOwnerTypes);
    }

    console.log('Descargando capítulos oficiales de métodos DataWindow...');
    const dataWindowPageReferences = await loadDataWindowMethodPageUrls();
    console.log(`DataWindow Methods: ${dataWindowPageReferences.length} páginas candidatas.`);

    console.log('Descargando referencias oficiales de datatypes y system objects...');
    const [standardDatatypesHtml, anyDatatypeHtml, systemObjectsIndexHtml, undocumentedBaseClassesHtml] = await Promise.all([
        fetchText(POWERSCRIPT_STANDARD_DATATYPES_URL),
        fetchText(POWERSCRIPT_ANY_DATATYPE_URL),
        fetchText(OBJECTS_AND_CONTROLS_INDEX_URL),
        fetchText(OBJECTS_AND_CONTROLS_UNDOCUMENTED_BASE_CLASSES_URL),
    ]);
    const officialDatatypeUnits = unique([
        ...parseOfficialStandardDatatypeNames(standardDatatypesHtml),
        sanitizeOfficialTitle(extractTitle(anyDatatypeHtml)).includes('Any') ? 'Any' : 'Any',
        'Int',
        'Dec',
        'Character',
        'UnsignedInt',
        'UInt',
        'ULong',
    ]);
    const officialSystemObjectDatatypeEntries = unique([
        ...parseOfficialSystemObjectDatatypeEntries(systemObjectsIndexHtml),
        ...parseUndocumentedBaseClassEntries(undocumentedBaseClassesHtml),
    ].map(entry => `${entry.name}|${entry.sourceUrl}|${entry.category}|${entry.summary}`)).map(serialized => {
        const [name, sourceUrl, category, summary] = serialized.split('|');
        return { name, sourceUrl, category, summary };
    });
    const officialSystemObjectDatatypeUnits = officialSystemObjectDatatypeEntries.map(entry => entry.name);

    const parsedDataWindowPages = (await mapConcurrent(dataWindowPageReferences, 12, async reference => {
        const html = await fetchText(reference.url);
        return parseDataWindowPage(html, reference.url, reference.chapterTitle);
    })).flat();

    const generatedDataWindowEntries = [];
    const generatedSystemTypeEntries = [];
    const unknownDataWindowAppliesToLabels = new Map();

    for (const entry of officialSystemObjectDatatypeEntries) {
        if (isCoverageUnitCovered(systemTypeCoverage, 'system-object-datatypes', entry.name)) {
            continue;
        }

        generatedSystemTypeEntries.push({
            category: entry.category,
            name: entry.name,
            signatures: [{ label: entry.name }],
            sourceUrl: entry.sourceUrl,
            summary: entry.summary,
        });
        registerCoverage(systemTypeCoverage, 'system-object-datatypes', entry.name, []);
    }

    for (const entry of sortGeneratedEntries(parsedDataWindowPages)) {
        if (entry.ownerInfo.unknownLabels.length > 0) {
            unknownDataWindowAppliesToLabels.set(entry.sourceUrl, entry.ownerInfo.unknownLabels);
        }

        const uncoveredOwnerTypes = getUncoveredOwnerTypes(
            dataWindowCoverage,
            'datawindow-functions',
            entry.name,
            entry.ownerInfo.ownerTypes,
            [],
        );

        if (uncoveredOwnerTypes.length === 0) {
            continue;
        }

        generatedDataWindowEntries.push(
            buildGeneratedEntry(
                entry,
                uncoveredOwnerTypes,
                filterAppliesToLabels(entry.ownerInfo, uncoveredOwnerTypes),
            ),
        );
        registerCoverage(dataWindowCoverage, 'datawindow-functions', entry.name, uncoveredOwnerTypes);
    }

    const specificEventCandidates = parsedPowerScriptEventPages
        .filter(entry => entry.ownerInfo.ownerScope === 'specific')
        .map(entry => ({
            ...entry,
            ownerTypes: entry.ownerInfo.ownerTypes.filter(ownerType => !DATAWINDOW_OWNER_TYPES.has(ownerType)),
        }))
        .filter(entry => entry.ownerTypes.length > 0);

    const universalEventCandidates = parsedPowerScriptEventPages
        .filter(entry => (
            entry.ownerInfo.ownerScope === 'any-object'
            || entry.ownerInfo.ownerScope === 'all-controls'
            || entry.ownerInfo.ownerScope === 'any-object-except-application'
            || entry.ownerInfo.ownerScope === 'any-object-except-menu'
            || entry.ownerInfo.ownerScope === 'any-object-except-datawindowchild'
            || entry.ownerInfo.ownerScope === 'all-controls-except-drawing'
        ));

    for (const entry of sortGeneratedEntries(specificEventCandidates)) {
        if (entry.ownerInfo.unknownLabels.length > 0) {
            unknownPowerScriptEventOwnerLabels.set(entry.sourceUrl, entry.ownerInfo.unknownLabels);
        }

        const uncoveredOwnerTypes = getUncoveredOwnerTypes(
            systemEventCoverage,
            'system-events',
            entry.name,
            entry.ownerTypes,
            [],
        );

        if (uncoveredOwnerTypes.length === 0) {
            continue;
        }

        generatedEventEntries.push(
            buildGeneratedEntry(
                entry,
                uncoveredOwnerTypes,
                filterAppliesToLabels(entry.ownerInfo, uncoveredOwnerTypes),
            ),
        );
        registerCoverage(systemEventCoverage, 'system-events', entry.name, uncoveredOwnerTypes);
    }

    for (const entry of sortGeneratedEntries(universalEventCandidates)) {
        if (entry.ownerInfo.unknownLabels.length > 0) {
            unknownPowerScriptEventOwnerLabels.set(entry.sourceUrl, entry.ownerInfo.unknownLabels);
        }

        const fallbackUniverse = entry.ownerInfo.ownerScope === 'all-controls'
            ? controlOwnerUniverse
            : entry.ownerInfo.ownerScope === 'all-controls-except-drawing'
                ? controlOwnerUniverse.filter(ownerType => !DRAWING_CONTROL_OWNER_TYPES.has(ownerType))
                : entry.ownerInfo.ownerScope === 'any-object-except-application'
                    ? objectOwnerUniverse.filter(ownerType => ownerType !== 'application')
                    : entry.ownerInfo.ownerScope === 'any-object-except-menu'
                        ? objectOwnerUniverse.filter(ownerType => ownerType !== 'menu')
                        : entry.ownerInfo.ownerScope === 'any-object-except-datawindowchild'
                            ? objectOwnerUniverse.filter(ownerType => ownerType !== 'datawindowchild')
                            : objectOwnerUniverse;
        const uncoveredOwnerTypes = getUncoveredOwnerTypes(
            systemEventCoverage,
            'system-events',
            entry.name,
            [],
            fallbackUniverse,
        );

        if (uncoveredOwnerTypes.length === 0) {
            continue;
        }

        generatedEventEntries.push(buildGeneratedEntry(entry, uncoveredOwnerTypes, entry.ownerInfo.appliesTo));
        registerCoverage(systemEventCoverage, 'system-events', entry.name, uncoveredOwnerTypes);
    }

    for (const entry of sortGeneratedEntries(parsedPowerScriptStatements)) {
        const alreadyCovered = getUncoveredOwnerTypes(
            statementCoverage,
            'statements',
            entry.name,
            [],
            ['__statement__'],
        ).length === 0;

        if (alreadyCovered) {
            continue;
        }

        generatedStatementEntries.push(buildGeneratedEntry(entry, [], []));
        registerCoverage(statementCoverage, 'statements', entry.name, []);
    }

    const generatedOfficialCoverageFile = renderOfficialCoverageFile({
        'global-functions': collectOfficialCoverageUnitKeys(
            'global-functions',
            parsedPowerScriptPages.filter(entry => entry.isGlobal),
            globalCoverage,
            'name',
            objectOwnerUniverse,
            controlOwnerUniverse,
        ),
        'object-functions': collectOfficialCoverageUnitKeys(
            'object-functions',
            parsedPowerScriptPages.filter(entry => !entry.isGlobal),
            objectCoverage,
            'name-owner',
            objectOwnerUniverse,
            controlOwnerUniverse,
        ),
        'datawindow-functions': collectOfficialCoverageUnitKeys(
            'datawindow-functions',
            parsedDataWindowPages,
            dataWindowCoverage,
            'name-owner',
            objectOwnerUniverse,
            controlOwnerUniverse,
        ),
        keywords: collectOfficialLookupKeyCoverage(
            officialKeywordUnits,
            keywordCoverage,
        ),
        'reserved-words': collectOfficialLookupKeyCoverage(
            officialReservedWordUnits,
            reservedWordCoverage,
        ),
        datatypes: collectOfficialLookupKeyCoverage(
            officialDatatypeUnits,
            datatypeCoverage,
        ),
        'system-object-datatypes': collectOfficialNameCoverage(
            officialSystemObjectDatatypeUnits,
            systemTypeCoverage,
            'system-object-datatypes',
        ),
        'system-events': collectOfficialCoverageUnitKeys(
            'system-events',
            parsedPowerScriptEventPages,
            systemEventCoverage,
            'name-owner',
            objectOwnerUniverse,
            controlOwnerUniverse,
        ),
        statements: collectOfficialCoverageUnitKeys(
            'statements',
            parsedPowerScriptStatements,
            statementCoverage,
            'name',
            objectOwnerUniverse,
            controlOwnerUniverse,
        ),
    });

    const generatedBuiltinTypesFile = renderBuiltInTypesFile(
        unique([
            ...officialDatatypeUnits,
            ...officialSystemObjectDatatypeUnits,
        ]
            .map(typeName => normalizeSystemSymbolName(typeName))
            .filter(Boolean))
            .sort(),
    );

    const generatedKeywordLexemesFile = renderKeywordLexemesFile(
        unique([
            ...keywordCoverage,
            ...reservedWordCoverage,
        ]).sort(),
    );

    const generatedCatalog = renderCatalogFile(
        sortGeneratedEntries(generatedGlobalEntries),
        {
            __keywords__: sortGeneratedEntries(generatedKeywordEntries),
            __reservedWords__: sortGeneratedEntries(generatedReservedWordEntries),
            entries: sortGeneratedEntries(generatedObjectEntries),
        },
        sortGeneratedEntries(generatedDataWindowEntries),
        sortGeneratedEntries(generatedSystemTypeEntries),
        sortGeneratedEntries(generatedEventEntries),
        sortGeneratedEntries(generatedStatementEntries),
    );
    const generatedOwnerTypes = objectOwnerUniverse.filter(ownerType => !currentObjectOwnerUniverse.includes(ownerType));
    const generatedOwnerTypesFile = renderOwnerTypesFile(generatedOwnerTypes);
    const generatedAt = new Date().toISOString();
    const generatedProvenanceFile = renderProvenanceFile(generatedAt);

    await fs.writeFile(OUTPUT_CATALOG_FILE, generatedCatalog, 'utf8');
    await fs.writeFile(OUTPUT_OWNER_TYPES_FILE, generatedOwnerTypesFile, 'utf8');
    await fs.writeFile(OUTPUT_PROVENANCE_FILE, generatedProvenanceFile, 'utf8');
    await fs.writeFile(OUTPUT_OFFICIAL_COVERAGE_FILE, generatedOfficialCoverageFile, 'utf8');
    await fs.writeFile(OUTPUT_PARSING_BUILTIN_TYPES_FILE, generatedBuiltinTypesFile, 'utf8');
    await fs.writeFile(OUTPUT_PARSING_KEYWORD_LEXEMES_FILE, generatedKeywordLexemesFile, 'utf8');

    console.log('Catálogo generated actualizado.');
    console.log(`  Global functions generadas: ${generatedGlobalEntries.length}`);
    console.log(`  Keywords generadas: ${generatedKeywordEntries.length}`);
    console.log(`  Object functions generadas: ${generatedObjectEntries.length}`);
    console.log(`  Reserved words generadas: ${generatedReservedWordEntries.length}`);
    console.log(`  DataWindow functions generadas: ${generatedDataWindowEntries.length}`);
    console.log(`  System events generados: ${generatedEventEntries.length}`);
    console.log(`  Statements generados: ${generatedStatementEntries.length}`);
    console.log(`  Owner types extendidos: ${generatedOwnerTypes.length}`);

    if (unknownPowerScriptAppliesToLabels.size > 0) {
        console.log('Applies to no triviales en PowerScript (heurística aplicada, revisar si hiciera falta):');

        for (const [url, labels] of unknownPowerScriptAppliesToLabels.entries()) {
            console.log(`  - ${url}`);
            console.log(`    ${labels.join(' | ')}`);
        }
    }

    if (unknownDataWindowAppliesToLabels.size > 0) {
        console.log('Applies to no triviales en DataWindow (heurística aplicada, revisar si hiciera falta):');

        for (const [url, labels] of unknownDataWindowAppliesToLabels.entries()) {
            console.log(`  - ${url}`);
            console.log(`    ${labels.join(' | ')}`);
        }
    }

    if (unknownPowerScriptEventOwnerLabels.size > 0) {
        console.log('Owners de eventos PowerScript no triviales (heurística aplicada, revisar si hiciera falta):');

        for (const [url, labels] of unknownPowerScriptEventOwnerLabels.entries()) {
            console.log(`  - ${url}`);
            console.log(`    ${labels.join(' | ')}`);
        }
    }
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
});