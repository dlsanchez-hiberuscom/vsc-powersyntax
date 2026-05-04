import { finalizeSystemSymbolEntry } from '../normalization';
import {
    PbSystemManualOverlay,
    PbSystemSymbolEntry,
    PbSystemSymbolEntryDraft,
    PbSystemSymbolSignature,
} from '../types';
import {
    DATAWINDOW_REFERENCE,
    DATAWINDOW_REFERENCE_URL,
    OBJECTS_AND_CONTROLS_REFERENCE,
    OBJECTS_AND_CONTROLS_REFERENCE_URL,
    POWERSCRIPT_REFERENCE,
    POWERSCRIPT_REFERENCE_URL,
} from './sources';

type ManualSymbolArgs = {
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
    risk?: 'safe' | 'dynamic' | 'deprecated' | 'legacy' | 'external';
    manualOverlay?: PbSystemManualOverlay;
};

function defineManualEntry(
    entry: Omit<PbSystemSymbolEntryDraft, 'dataset' | 'source'>,
    source: string,
    defaultSourceUrl: string,
): PbSystemSymbolEntry {
    return finalizeSystemSymbolEntry({
        ...entry,
        dataset: 'manual-core',
        source,
        sourceUrl: entry.sourceUrl ?? defaultSourceUrl,
    });
}

export function globalFunction(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'callable',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'global-functions',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function objectFunction(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'callable',
        namespace: 'object',
        invocation: 'member',
        domain: 'object-functions',
    }, OBJECTS_AND_CONTROLS_REFERENCE, OBJECTS_AND_CONTROLS_REFERENCE_URL);
}

export function dataWindowFunction(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'callable',
        namespace: 'datawindow',
        invocation: 'member',
        domain: 'datawindow-functions',
    }, DATAWINDOW_REFERENCE, DATAWINDOW_REFERENCE_URL);
}

export function systemEvent(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'event',
        namespace: 'object',
        invocation: 'member',
        domain: 'system-events',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function dataWindowEvent(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'event',
        namespace: 'datawindow',
        invocation: 'member',
        domain: 'datawindow-events',
    }, DATAWINDOW_REFERENCE, DATAWINDOW_REFERENCE_URL);
}

export function dataWindowProperty(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'property',
        namespace: 'datawindow',
        invocation: 'member',
        domain: 'datawindow-properties',
    }, DATAWINDOW_REFERENCE, DATAWINDOW_REFERENCE_URL);
}

export function dataWindowExpressionFunction(args: ManualSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'callable',
        namespace: 'datawindow-expression',
        invocation: 'global',
        domain: 'datawindow-expression-functions',
    }, DATAWINDOW_REFERENCE, DATAWINDOW_REFERENCE_URL);
}

export function statement(args: Omit<ManualSymbolArgs, 'ownerTypes'>): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        kind: 'statement',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'statements',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

// -- Factorias para catalog v2: language constructs --

type LanguageSymbolArgs = {
    name: string;
    category: string;
    summary: string;
    documentation?: string;
    lookupAliases?: readonly string[];
    syntax?: string;
    languageRole?: string;
    signatures?: readonly PbSystemSymbolSignature[];
    enumValues?: readonly string[];
    enumValueOf?: string;
    enumNumericValue?: number;
    enumValueMeaning?: string;
    allowedOnOwners?: readonly string[];
    allowedOnProperties?: readonly string[];
    allowedInParameters?: readonly string[];
    valueType?: string;
    risk?: PbSystemSymbolEntry['risk'];
    manualOverlay?: PbSystemManualOverlay;
};

export function languageKeyword(args: LanguageSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'keyword',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'keywords',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function reservedWord(args: LanguageSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'reserved-word',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'reserved-words',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function datatype(args: LanguageSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'datatype',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'datatypes',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function systemObjectDatatype(args: LanguageSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'system-type',
        namespace: 'powerbuilder-runtime',
        invocation: 'global',
        domain: 'system-object-datatypes',
    }, OBJECTS_AND_CONTROLS_REFERENCE, OBJECTS_AND_CONTROLS_REFERENCE_URL);
}

export function pronoun(args: LanguageSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'pronoun',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'pronouns',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function operator(args: LanguageSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'operator',
        namespace: 'powerscript',
        invocation: 'global',
        domain: 'operators',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function systemGlobal(args: LanguageSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'system-global',
        namespace: 'powerbuilder-runtime',
        invocation: 'global',
        domain: 'system-globals',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function enumeratedType(args: LanguageSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'enumerated-type',
        namespace: 'powerbuilder-runtime',
        invocation: 'global',
        domain: 'enumerated-types',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}

export function enumeratedValue(args: LanguageSymbolArgs): PbSystemSymbolEntry {
    return defineManualEntry({
        ...args,
        signatures: args.signatures ?? [{ label: args.name }],
        kind: 'enumerated-value',
        namespace: 'powerbuilder-runtime',
        invocation: 'global',
        domain: 'enumerated-values',
    }, POWERSCRIPT_REFERENCE, POWERSCRIPT_REFERENCE_URL);
}
