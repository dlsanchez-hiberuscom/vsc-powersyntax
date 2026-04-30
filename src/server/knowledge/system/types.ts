export type PbSystemSymbolKind =
    | 'callable'
    | 'event'
    | 'statement';

export type PbSystemSymbolNamespace =
    | 'powerscript'
    | 'object'
    | 'datawindow';

export type PbSystemSymbolInvocation =
    | 'global'
    | 'member';

export type PbSystemSymbolDomain =
    | 'global-functions'
    | 'object-functions'
    | 'datawindow-functions'
    | 'system-events'
    | 'datawindow-events'
    | 'statements';

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

export interface PbSystemSymbolSignatureParameter {
    label: string;
    documentation?: string;
}

export interface PbSystemSymbolSignature {
    label: string;
    documentation?: string;
    parameters?: readonly PbSystemSymbolSignatureParameter[];
}

export interface PbSystemSymbolEntryDraft {
    name: string;
    kind: PbSystemSymbolKind;
    namespace: PbSystemSymbolNamespace;
    invocation: PbSystemSymbolInvocation;
    domain: PbSystemSymbolDomain;
    category: string;
    summary: string;
    signatures: readonly PbSystemSymbolSignature[];
    dataset: PbSystemSymbolDataset;
    source: string;
    sourceUrl?: string;
    appliesTo?: readonly string[];
    ownerTypes?: readonly string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    lookupAliases?: readonly string[];
    provenance?: PbSystemSymbolProvenance;
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
    byNamespace: ReadonlyMap<PbSystemSymbolNamespace, readonly PbSystemSymbolEntry[]>;
    byKind: ReadonlyMap<PbSystemSymbolKind, readonly PbSystemSymbolEntry[]>;
    byInvocation: ReadonlyMap<PbSystemSymbolInvocation, readonly PbSystemSymbolEntry[]>;
    byDomain: ReadonlyMap<PbSystemSymbolDomain, readonly PbSystemSymbolEntry[]>;
    byDataset: ReadonlyMap<PbSystemSymbolDataset, readonly PbSystemSymbolEntry[]>;
    byOwnerType: ReadonlyMap<string, readonly PbSystemSymbolEntry[]>;
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
