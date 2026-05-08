import { PbSystemSymbolEntry, PbSystemSymbolSignature } from '../types';
import {
    PB_GENERATED_GLOBAL_FUNCTIONS,
    PB_GENERATED_KEYWORDS,
    PB_GENERATED_OBJECT_FUNCTIONS,
    PB_GENERATED_RESERVED_WORDS,
    PB_GENERATED_STATEMENTS,
} from './generated.generated';
import {
    PB_GENERATED_DATAWINDOW_FUNCTION_OWNER_TYPES,
    generatedGlobalFunction,
    generatedDataWindowFunction,
    generatedDatatype,
    generatedKeyword,
    generatedReservedWord,
    generatedStatement,
} from './common';

const POWERSCRIPT_REFERENCE_INDEX_URL = 'https://docs.appeon.com/pb2025/powerscript_reference/index.html';

const PROJECTED_GLOBAL_SUMMARY_OVERRIDES = new Map<string, string>([
    ['abs', 'Calculates the absolute value of a number.'],
    ['isnull', 'Reports whether the value of a variable or expression is null.'],
    ['dayname', 'Returns the name of the day of the week for a date.'],
    ['messagebox', 'Displays a message box and returns the button clicked.'],
    ['setnull', 'Assigns NULL to a variable.'],
    ['len', 'Returns the length of a string or blob.'],
    ['lower', 'Converts text to lowercase.'],
    ['upper', 'Converts text to uppercase.'],
]);

const PROJECTED_DATAWINDOW_FUNCTION_OWNER_TYPES = new Map<string, readonly string[]>([
    ['clipboard', ['datawindow']],
]);

function dedupeById(entries: readonly PbSystemSymbolEntry[]): readonly PbSystemSymbolEntry[] {
    const byId = new Map<string, PbSystemSymbolEntry>();

    for (const entry of entries) {
        if (!byId.has(entry.id)) {
            byId.set(entry.id, entry);
        }
    }

    return Array.from(byId.values());
}

function isLikelyProjectedGlobalFunction(entry: PbSystemSymbolEntry): boolean {
    if (entry.normalizedOwnerTypes.length > 0) {
        return false;
    }

    const sourceUrl = entry.sourceUrl?.toLowerCase() ?? '';
    if (!sourceUrl.includes('/powerscript_reference/')) {
        return false;
    }

    if (sourceUrl.includes('_event') || sourceUrl.includes('xref_')) {
        return false;
    }

    const signaturePrefix = entry.signatures[0]?.label.slice(0, entry.signatures[0].label.indexOf('(')).trim() ?? '';
    return signaturePrefix.length > 0 && !signaturePrefix.includes('.');
}

function overrideProjectedSignatures(
    entry: PbSystemSymbolEntry,
): readonly PbSystemSymbolSignature[] {
    if (entry.normalizedName !== 'abs') {
        return entry.signatures;
    }

    return [{
        label: 'Abs ( n )',
        parameters: [{
            label: 'n',
            documentation: 'The number for which you want the absolute value',
        }],
    }];
}

function projectGeneratedGlobalFunction(entry: PbSystemSymbolEntry): PbSystemSymbolEntry {
    return generatedGlobalFunction({
        name: entry.name,
        category: entry.category,
        summary: PROJECTED_GLOBAL_SUMMARY_OVERRIDES.get(entry.normalizedName) ?? entry.summary,
        signatures: overrideProjectedSignatures(entry),
        returnType: entry.returnType,
        returnDocumentation: entry.returnDocumentation,
        usageNotes: entry.usageNotes,
        appliesTo: entry.appliesTo,
        obsolete: entry.obsolete,
        obsoleteMessage: entry.obsoleteMessage,
        replacement: entry.replacement,
        risk: entry.risk,
        sourceUrl: entry.sourceUrl,
        examples: entry.examples,
    });
}

function projectGeneratedDataWindowFunction(entry: PbSystemSymbolEntry): PbSystemSymbolEntry | null {
    const projectedOwnerTypes = PROJECTED_DATAWINDOW_FUNCTION_OWNER_TYPES.get(entry.normalizedName);
    if (!projectedOwnerTypes) {
        return null;
    }

    const allowedOwnerTypes = projectedOwnerTypes.filter((ownerType) =>
        PB_GENERATED_DATAWINDOW_FUNCTION_OWNER_TYPES.includes(ownerType),
    );
    if (allowedOwnerTypes.length === 0) {
        return null;
    }

    const memberScopedSignatures = entry.signatures.filter((signature) => signature.label.includes('.'));

    return generatedDataWindowFunction({
        name: entry.name,
        category: entry.category,
        summary: entry.summary,
        signatures: memberScopedSignatures.length > 0 ? memberScopedSignatures : entry.signatures,
        returnType: entry.returnType,
        returnDocumentation: entry.returnDocumentation,
        usageNotes: entry.usageNotes,
        appliesTo: entry.appliesTo,
        ownerTypes: allowedOwnerTypes,
        obsolete: entry.obsolete,
        obsoleteMessage: entry.obsoleteMessage,
        replacement: entry.replacement,
        risk: entry.risk,
        sourceUrl: entry.sourceUrl,
        examples: entry.examples,
    });
}

const GENERATED_KEYWORD_FALLBACKS: readonly PbSystemSymbolEntry[] = [
    generatedKeyword({
        name: 'IF',
        category: 'Official language keyword',
        summary: 'Official PowerScript keyword that starts a conditional statement.',
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedKeyword({
        name: 'FOR',
        category: 'Official language keyword',
        summary: 'Official PowerScript keyword that starts a counted loop.',
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedKeyword({
        name: 'PUBLIC',
        category: 'Official language keyword',
        summary: 'Official PowerScript keyword used as an access modifier.',
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
] as const;

const GENERATED_DATATYPE_FALLBACKS: readonly PbSystemSymbolEntry[] = [
    generatedDatatype({
        name: 'Integer',
        category: 'Official language datatype',
        summary: '16-bit signed integer (-32768 to 32767).',
        lookupAliases: ['int'],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
] as const;

const GENERATED_RESERVED_WORD_FALLBACKS: readonly PbSystemSymbolEntry[] = [
    generatedReservedWord({
        name: 'TRUE',
        category: 'Official reserved word',
        summary: 'Boolean reserved literal that represents true.',
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedReservedWord({
        name: 'FALSE',
        category: 'Official reserved word',
        summary: 'Boolean reserved literal that represents false.',
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedReservedWord({
        name: 'NOT',
        category: 'Official reserved word',
        summary: 'Logical reserved operator that negates a Boolean expression.',
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedReservedWord({
        name: 'COMMIT',
        category: 'Official reserved word',
        summary: 'Reserved word used by transaction control statements in embedded SQL.',
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
] as const;

const GENERATED_STATEMENT_FALLBACKS: readonly PbSystemSymbolEntry[] = [
    generatedStatement({
        name: 'IF...THEN',
        category: 'Official control structure',
        summary: 'A control structure used to cause a script to perform a specified action if a stated condition is true. Syntax 1 uses a single-line format, and Syntax 2 uses a multiline format.',
        signatures: [{ label: 'IF condition THEN ... END IF' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'CHOOSE CASE',
        category: 'Official control structure',
        summary: 'Control structure used to choose one execution branch from a list of cases.',
        signatures: [{ label: 'CHOOSE CASE expression ... END CHOOSE' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'FOR...NEXT',
        category: 'Official loop statement',
        summary: 'Loop statement used to iterate a counted range of values.',
        signatures: [{ label: 'FOR counter = start TO finish ... NEXT' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'DO...LOOP',
        category: 'Official loop statement',
        summary: 'Loop statement used to repeat a block while or until a condition changes.',
        signatures: [{ label: 'DO ... LOOP' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'RETURN',
        category: 'Official control statement',
        summary: 'Statement used to return from a function, event, or subroutine.',
        signatures: [{ label: 'RETURN expression?' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'CONTINUE',
        category: 'Official control statement',
        summary: 'Statement used to continue with the next iteration of a loop.',
        signatures: [{ label: 'CONTINUE' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'EXIT',
        category: 'Official control statement',
        summary: 'Statement used to leave the current loop or block immediately.',
        signatures: [{ label: 'EXIT' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'OPEN',
        category: 'Official statement',
        summary: 'Statement used to open a window, object, or resource in PowerScript.',
        signatures: [{ label: 'OPEN object' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'CLOSE',
        category: 'Official statement',
        summary: 'Statement used to close a window, object, or resource in PowerScript.',
        signatures: [{ label: 'CLOSE object' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'CALL',
        category: 'Official statement',
        summary: 'Statement used to invoke a routine or external entry point.',
        signatures: [{ label: 'CALL target' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'CREATE',
        category: 'Official statement',
        summary: 'Statement used to instantiate a new object at runtime.',
        signatures: [{ label: 'CREATE object' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'DESTROY',
        category: 'Official statement',
        summary: 'Statement used to destroy an object instance at runtime.',
        signatures: [{ label: 'DESTROY object' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
    generatedStatement({
        name: 'THROW',
        category: 'Official exception statement',
        summary: 'Statement used to raise an exception explicitly.',
        signatures: [{ label: 'THROW exception' }],
        sourceUrl: POWERSCRIPT_REFERENCE_INDEX_URL,
    }),
] as const;

export const PB_GENERATED_RUNTIME_GLOBAL_FUNCTIONS: readonly PbSystemSymbolEntry[] = dedupeById([
    ...PB_GENERATED_GLOBAL_FUNCTIONS,
    ...PB_GENERATED_OBJECT_FUNCTIONS
        .filter(isLikelyProjectedGlobalFunction)
        .map(projectGeneratedGlobalFunction),
]);

export const PB_GENERATED_RUNTIME_DATATYPES: readonly PbSystemSymbolEntry[] = dedupeById([
    ...GENERATED_DATATYPE_FALLBACKS,
]);

export const PB_GENERATED_RUNTIME_DATAWINDOW_FUNCTIONS: readonly PbSystemSymbolEntry[] = dedupeById(
    PB_GENERATED_OBJECT_FUNCTIONS
        .map(projectGeneratedDataWindowFunction)
        .filter((entry): entry is PbSystemSymbolEntry => entry !== null),
);

export const PB_GENERATED_RUNTIME_KEYWORDS: readonly PbSystemSymbolEntry[] = dedupeById([
    ...PB_GENERATED_KEYWORDS,
    ...GENERATED_KEYWORD_FALLBACKS,
]);

export const PB_GENERATED_RUNTIME_RESERVED_WORDS: readonly PbSystemSymbolEntry[] = dedupeById([
    ...PB_GENERATED_RESERVED_WORDS,
    ...GENERATED_RESERVED_WORD_FALLBACKS,
]);

export const PB_GENERATED_RUNTIME_STATEMENTS: readonly PbSystemSymbolEntry[] = dedupeById([
    ...PB_GENERATED_STATEMENTS,
    ...GENERATED_STATEMENT_FALLBACKS,
]);