export type PbSystemSymbolKind =
    | 'callable'
    | 'event'
    | 'statement'
    | 'keyword'
    | 'reserved-word'
    | 'datatype'
    | 'system-type'
    | 'enumerated-type'
    | 'operator'
    | 'pronoun'
    | 'enumerated-value'
    | 'system-global'
    | 'property'
    | 'constant';

export type PbSystemSymbolNamespace =
    | 'powerscript'
    | 'object'
    | 'datawindow'
    | 'datawindow-expression'
    | 'embedded-sql'
    | 'powerbuilder-runtime'
    | 'powerbuilder-tooling';

export type PbSystemSymbolInvocation =
    | 'global'
    | 'member';

export type PbSystemSymbolDomain =
    | 'global-functions'
    | 'object-functions'
    | 'datawindow-functions'
    | 'system-events'
    | 'datawindow-events'
    | 'statements'
    | 'reserved-words'
    | 'keywords'
    | 'datatypes'
    | 'system-object-datatypes'
    | 'operators'
    | 'pronouns'
    | 'enumerated-types'
    | 'enumerated-values'
    | 'system-globals'
    | 'datawindow-properties'
    | 'datawindow-expression-functions'
    | 'datawindow-constants'
    | 'obsolete-symbols'
    | 'tooling-symbols';

export type PbSystemSymbolDataset =
    | 'manual-core'
    | 'generated'
    | `project:${string}`
    | `workspace:${string}`
    | `custom:${string}`;

export type PbSystemSymbolProvenanceKind =
    | 'manual'
    | 'generated'
    | 'project'
    | 'workspace'
    | 'custom';

export type PbSystemSymbolProvenanceAuthority =
    | 'curated'
    | 'official'
    | 'project'
    | 'workspace'
    | 'custom';

export interface PbSystemSymbolProvenance {
    kind: PbSystemSymbolProvenanceKind;
    authority: PbSystemSymbolProvenanceAuthority;
    source: string;
    sourceUrl?: string;
    version?: string;
    generatedAt?: string;
}

export type PbSystemManualOverlayMode = 'gap' | 'enrichment' | 'override' | 'candidate';

export interface PbSystemManualOverlayTargetKey {
    domain: PbSystemSymbolDomain;
    kind: PbSystemSymbolKind;
    namespace: PbSystemSymbolNamespace;
    invocation: PbSystemSymbolInvocation;
    name: string;
    ownerTypes?: readonly string[];
    enumValueOf?: string;
}

export interface PbSystemManualOverlay {
    targetId?: string;
    targetKey?: PbSystemManualOverlayTargetKey;
    mode: PbSystemManualOverlayMode;
    reason: string;
    evidence: readonly string[];
    sourceUrl?: string;
    reviewedBy?: string;
}

export type PbCatalogLocale = 'en' | 'es';

export interface PbLocalizedText {
    readonly summary?: string;
    readonly documentation?: string;
    readonly usageNotes?: readonly string[];
    readonly limitations?: readonly string[];
    readonly obsoleteMessage?: string;
    readonly returnDocumentation?: string;
    readonly category?: string;
}

export interface PbLocalizedParameterDocumentation {
    readonly signatureLabel: string;
    readonly parameterName: string;
    readonly documentation: string;
}

export interface PbLocalizedEventReturnCodeDocumentation {
    readonly value: string;
    readonly meaning: string;
}

export type PbSystemSymbolLocalizationTargetKey = Readonly<PbSystemManualOverlayTargetKey>;

export type PbSystemSymbolLocalizationOverlaySource =
    | 'manual-curated'
    | 'machine-assisted-reviewed'
    | 'generated-assisted';

export interface PbSystemSymbolLocalizationOverlay {
    readonly targetId?: string;
    readonly targetKey?: PbSystemSymbolLocalizationTargetKey;
    readonly locale: PbCatalogLocale;
    readonly source: PbSystemSymbolLocalizationOverlaySource;
    readonly reviewed: boolean;
    readonly text?: PbLocalizedText;
    readonly parameters?: readonly PbLocalizedParameterDocumentation[];
    readonly eventReturnCodes?: readonly PbLocalizedEventReturnCodeDocumentation[];
}

export interface PbSystemSymbolSignatureParameter {
    label: string;
    documentation?: string;
}

export interface PbSystemSymbolSignature {
    label: string;
    documentation?: string;
    parameters?: readonly PbSystemSymbolSignatureParameter[];
    returnType?: string;
}

export interface PbSystemSymbolEventId {
    id: string;
    ownerTypes?: readonly string[];
}

export type PbSystemIdentifierPolicy = 'reserved' | 'allowed-as-function-name' | 'literal' | 'operator';

export interface PbSystemSymbolEntryDraft {
    name: string;
    kind: PbSystemSymbolKind;
    namespace: PbSystemSymbolNamespace;
    invocation: PbSystemSymbolInvocation;
    domain: PbSystemSymbolDomain;
    category: string;
    summary: string;
    documentation?: string;
    returnType?: string;
    returnDocumentation?: string;
    usageNotes?: readonly string[];
    baseType?: string;
    properties?: readonly string[];
    functions?: readonly string[];
    events?: readonly string[];
    signatures: readonly PbSystemSymbolSignature[];
    dataset: PbSystemSymbolDataset;
    source: string;
    sourceUrl?: string;
    appliesTo?: readonly string[];
    ownerTypes?: readonly string[];
    enumValues?: readonly string[];
    enumValueOf?: string;
    enumNumericValue?: number;
    enumValueMeaning?: string;
    allowedOnOwners?: readonly string[];
    allowedOnProperties?: readonly string[];
    allowedInParameters?: readonly string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    eventId?: string;
    eventIds?: readonly PbSystemSymbolEventId[];
    lookupAliases?: readonly string[];
    reservedWordCanBeFunctionName?: boolean;
    identifierPolicy?: PbSystemIdentifierPolicy;
    provenance?: PbSystemSymbolProvenance;
    manualOverlay?: PbSystemManualOverlay;
    syntax?: string;
    tokenType?: string;
    tokenModifiers?: readonly string[];
    languageRole?: string;
    introducedIn?: string;
    valueType?: string;
    risk?: 'safe' | 'dynamic' | 'deprecated' | 'legacy' | 'external';
    examples?: readonly string[];
}

export interface PbSystemSymbolEntry extends PbSystemSymbolEntryDraft {
    id: string;
    normalizedName: string;
    lookupKeys: readonly string[];
    normalizedOwnerTypes: readonly string[];
    provenance: PbSystemSymbolProvenance;
}

export interface PbSystemSymbolDatasetSlice {
    dataset: PbSystemSymbolDataset;
    domain: PbSystemSymbolDomain;
    entries: readonly PbSystemSymbolEntry[];
    allowedCategories?: readonly string[];
    allowedOwnerTypes?: readonly string[];
    requireSourceUrl?: boolean;
}

export interface PbSystemSymbolIndexes {
    byId: ReadonlyMap<string, PbSystemSymbolEntry>;
    byName: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>;
    byLookupKey: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>;
    byDomainAndLookupKey: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>;
    byKindAndLookupKey: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>;
    byEnumValueOf: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>;
    byNamespace: ReadonlyMap<PbSystemSymbolNamespace, readonly PbSystemSymbolEntry[]>;
    byKind: ReadonlyMap<PbSystemSymbolKind, readonly PbSystemSymbolEntry[]>;
    byInvocation: ReadonlyMap<PbSystemSymbolInvocation, readonly PbSystemSymbolEntry[]>;
    byDomain: ReadonlyMap<PbSystemSymbolDomain, readonly PbSystemSymbolEntry[]>;
    byDataset: ReadonlyMap<PbSystemSymbolDataset, readonly PbSystemSymbolEntry[]>;
    byOwnerType: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>;
    byOwnerTypeAndDomain: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>;
}

export interface PbSystemSymbolRegistry {
    slices: readonly PbSystemSymbolDatasetSlice[];
    entries: readonly PbSystemSymbolEntry[];
    indexes: PbSystemSymbolIndexes;
}

export interface PbSystemSymbolHoverPayload {
    title: string;
    signatureMarkdown?: string;
    supplementMarkdown: string;
    markdown: string;
}

export interface PbSystemSymbolSignaturePayload {
    signatures: readonly PbSystemSymbolSignature[];
    activeSignatureIndex: number;
}
