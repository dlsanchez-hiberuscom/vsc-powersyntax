import { finalizeSystemSymbolEntry } from '../normalization';
import { PB_MANUAL_CORE_OWNER_TYPE_GROUPS } from '../manual';
import { PB_GENERATED_OBJECT_OWNER_TYPES_EXTENDED } from './ownerTypes.generated';
import { PB_GENERATED_CATALOG_GENERATED_AT } from './provenance.generated';
import {
    PbSystemSymbolEntry,
    PbSystemSymbolEntryDraft,
    PbSystemSymbolSignature,
} from '../types';

const POWERSCRIPT_REFERENCE = 'Appeon PowerScript Reference 2025';
const POWERSCRIPT_REFERENCE_URL = 'https://docs.appeon.com/pb2025/powerscript_reference/index.html';
const POWERSCRIPT_REFERENCE_PREFIX = 'https://docs.appeon.com/pb2025/powerscript_reference/';
const OBJECTS_AND_CONTROLS_REFERENCE = 'Appeon Objects and Controls 2025';
const OBJECTS_AND_CONTROLS_REFERENCE_URL = 'https://docs.appeon.com/pb2025/objects_and_controls/index.html';
const OBJECTS_AND_CONTROLS_REFERENCE_PREFIX = 'https://docs.appeon.com/pb2025/objects_and_controls/';
const DATAWINDOW_REFERENCE = 'Appeon DataWindow Reference 2025';
const DATAWINDOW_REFERENCE_URL = 'https://docs.appeon.com/pb2025/datawindow_reference/index.html';
const DATAWINDOW_REFERENCE_PREFIX = 'https://docs.appeon.com/pb2025/datawindow_reference/';
const OFFICIAL_REFERENCE_VERSION = 'PowerBuilder 2025';

function mergeUniqueValues(...valueGroups: readonly (readonly string[])[]): string[] {
    const values = new Set<string>();

    for (const valueGroup of valueGroups) {
        for (const value of valueGroup) {
            values.add(value);
        }
    }

    return Array.from(values);
}

export const PB_GENERATED_OBJECT_OWNER_TYPES = mergeUniqueValues(
    PB_MANUAL_CORE_OWNER_TYPE_GROUPS.object,
    PB_GENERATED_OBJECT_OWNER_TYPES_EXTENDED,
);

export const PB_GENERATED_DATAWINDOW_FUNCTION_OWNER_TYPES = mergeUniqueValues(
    PB_MANUAL_CORE_OWNER_TYPE_GROUPS.dataWindowFunction,
);

type GeneratedSymbolArgs = {
    name: string;
    category: string;
    summary: string;
    signatures: readonly PbSystemSymbolSignature[];
    returnType?: string;
    returnDocumentation?: string;
    usageNotes?: readonly string[];
    baseType?: string;
    properties?: readonly string[];
    functions?: readonly string[];
    events?: readonly string[];
    appliesTo?: readonly string[];
    ownerTypes?: readonly string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    eventId?: string;
    eventIds?: PbSystemSymbolEntryDraft['eventIds'];
    lookupAliases?: readonly string[];
    reservedWordCanBeFunctionName?: boolean;
    identifierPolicy?: PbSystemSymbolEntryDraft['identifierPolicy'];
    risk?: PbSystemSymbolEntryDraft['risk'];
    sourceUrl?: string;
    examples?: readonly string[];
};

type GeneratedLanguageSymbolArgs = {
    name: string;
    category: string;
    summary: string;
    documentation?: string;
    baseType?: string;
    properties?: readonly string[];
    functions?: readonly string[];
    events?: readonly string[];
    lookupAliases?: readonly string[];
    signatures?: readonly PbSystemSymbolSignature[];
    sourceUrl?: string;
    examples?: readonly string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    reservedWordCanBeFunctionName?: boolean;
    identifierPolicy?: PbSystemSymbolEntryDraft['identifierPolicy'];
    risk?: PbSystemSymbolEntryDraft['risk'];
    enumValues?: readonly string[];
    enumValueOf?: string;
    enumNumericValue?: number;
    enumValueMeaning?: string;
    allowedOnOwners?: readonly string[];
    allowedOnProperties?: readonly string[];
    allowedInParameters?: readonly string[];
};

function resolveGeneratedReferenceFromSourceUrl(sourceUrl?: string): {
    source: string;
    defaultSourceUrl: string;
} {
    if (sourceUrl?.startsWith(DATAWINDOW_REFERENCE_PREFIX)) {
        return {
            source: DATAWINDOW_REFERENCE,
            defaultSourceUrl: DATAWINDOW_REFERENCE_URL,
        };
    }

    if (sourceUrl?.startsWith(OBJECTS_AND_CONTROLS_REFERENCE_PREFIX)) {
        return {
            source: OBJECTS_AND_CONTROLS_REFERENCE,
            defaultSourceUrl: OBJECTS_AND_CONTROLS_REFERENCE_URL,
        };
    }

    if (sourceUrl?.startsWith(POWERSCRIPT_REFERENCE_PREFIX)) {
        return {
            source: POWERSCRIPT_REFERENCE,
            defaultSourceUrl: POWERSCRIPT_REFERENCE_URL,
        };
    }

    return {
        source: POWERSCRIPT_REFERENCE,
        defaultSourceUrl: POWERSCRIPT_REFERENCE_URL,
    };
}

function defineGeneratedEntry(
    entry: Omit<PbSystemSymbolEntryDraft, 'dataset' | 'source'>,
    source: string,
    defaultSourceUrl: string,
): PbSystemSymbolEntry {
    const sourceUrl = entry.sourceUrl ?? defaultSourceUrl;

    return finalizeSystemSymbolEntry({
        ...entry,
        dataset: 'generated',
        source,
        sourceUrl,
        provenance: {
            kind: 'generated',
            authority: 'official',
            source,
            sourceUrl,
            version: OFFICIAL_REFERENCE_VERSION,
            generatedAt: PB_GENERATED_CATALOG_GENERATED_AT,
        },
    });
}

export function generatedGlobalFunction(args: GeneratedSymbolArgs): PbSystemSymbolEntry {
    return defineGeneratedEntry({
        ...args,
        kind: 'callable',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'global-functions',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function generatedObjectFunction(args: GeneratedSymbolArgs): PbSystemSymbolEntry {
    return defineGeneratedEntry({
        ...args,
        kind: 'callable',
        namespace: 'object',
        invocation: 'member',
        domain: 'object-functions',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function generatedDataWindowFunction(args: GeneratedSymbolArgs): PbSystemSymbolEntry {
    return defineGeneratedEntry({
        ...args,
        kind: 'callable',
        namespace: 'datawindow',
        invocation: 'member',
        domain: 'datawindow-functions',
    }, DATAWINDOW_REFERENCE, DATAWINDOW_REFERENCE_URL);
}

export function generatedEvent(args: GeneratedSymbolArgs): PbSystemSymbolEntry {
    return defineGeneratedEntry({
        ...args,
        kind: 'event',
        namespace: 'object',
        invocation: 'member',
        domain: 'system-events',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function generatedStatement(args: GeneratedSymbolArgs): PbSystemSymbolEntry {
    return defineGeneratedEntry({
        ...args,
        kind: 'statement',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'statements',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function generatedKeyword(args: GeneratedLanguageSymbolArgs): PbSystemSymbolEntry {
    return defineGeneratedEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'keyword',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'keywords',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function generatedReservedWord(args: GeneratedLanguageSymbolArgs): PbSystemSymbolEntry {
    return defineGeneratedEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'reserved-word',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'reserved-words',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function generatedDatatype(args: GeneratedLanguageSymbolArgs): PbSystemSymbolEntry {
    return defineGeneratedEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'datatype',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'datatypes',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function generatedSystemObjectDatatype(args: GeneratedLanguageSymbolArgs): PbSystemSymbolEntry {
    return defineGeneratedEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'system-type',
        namespace: 'powerbuilder-runtime',
        invocation: 'global',
        domain: 'system-object-datatypes',
    }, OBJECTS_AND_CONTROLS_REFERENCE, OBJECTS_AND_CONTROLS_REFERENCE_URL);
}

export function generatedEnumeratedType(args: GeneratedLanguageSymbolArgs): PbSystemSymbolEntry {
    const reference = resolveGeneratedReferenceFromSourceUrl(args.sourceUrl);

    return defineGeneratedEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'enumerated-type',
        namespace: 'powerbuilder-runtime',
        invocation: 'global',
        domain: 'enumerated-types',
    }, reference.source, reference.defaultSourceUrl);
}

export function generatedEnumeratedValue(args: GeneratedLanguageSymbolArgs): PbSystemSymbolEntry {
    const reference = resolveGeneratedReferenceFromSourceUrl(args.sourceUrl);

    return defineGeneratedEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'enumerated-value',
        namespace: 'powerbuilder-runtime',
        invocation: 'global',
        domain: 'enumerated-values',
    }, reference.source, reference.defaultSourceUrl);
}

export function generatedDataWindowConstant(args: GeneratedLanguageSymbolArgs): PbSystemSymbolEntry {
    const reference = resolveGeneratedReferenceFromSourceUrl(args.sourceUrl);

    return defineGeneratedEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'constant',
        namespace: 'datawindow',
        invocation: 'global',
        domain: 'datawindow-constants',
    }, reference.source, reference.defaultSourceUrl);
}