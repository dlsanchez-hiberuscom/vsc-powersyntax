import { finalizeSystemSymbolEntry } from '../normalization';
import {
    PB_MANUAL_CORE_DATAWINDOW_FUNCTION_OWNER_TYPES,
    PB_MANUAL_CORE_OBJECT_OWNER_TYPES,
} from '../manual/common';
import { PB_GENERATED_OBJECT_OWNER_TYPES_EXTENDED } from './ownerTypes.generated';
import { PB_GENERATED_CATALOG_GENERATED_AT } from './provenance.generated';
import {
    PbSystemSymbolEntry,
    PbSystemSymbolEntryDraft,
    PbSystemSymbolSignature,
} from '../types';

const POWERSCRIPT_REFERENCE = 'Appeon PowerScript Reference 2025';
const POWERSCRIPT_REFERENCE_URL = 'https://docs.appeon.com/pb2025/powerscript_reference/index.html';
const DATAWINDOW_REFERENCE = 'Appeon DataWindow Reference 2025';
const DATAWINDOW_REFERENCE_URL = 'https://docs.appeon.com/pb2025/datawindow_reference/index.html';
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
    PB_MANUAL_CORE_OBJECT_OWNER_TYPES,
    PB_GENERATED_OBJECT_OWNER_TYPES_EXTENDED,
);

export const PB_GENERATED_DATAWINDOW_FUNCTION_OWNER_TYPES = mergeUniqueValues(
    PB_MANUAL_CORE_DATAWINDOW_FUNCTION_OWNER_TYPES,
);

type GeneratedSymbolArgs = {
    name: string;
    category: string;
    summary: string;
    signatures: readonly PbSystemSymbolSignature[];
    appliesTo?: readonly string[];
    ownerTypes?: readonly string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    lookupAliases?: readonly string[];
    sourceUrl?: string;
};

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