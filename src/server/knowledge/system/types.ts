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
    sourceUrl?: string;
    appliesTo?: readonly string[];
    ownerTypes?: readonly string[];
    obsolete?: boolean;
    obsoleteMessage?: string;
    replacement?: string;
    lookupAliases?: readonly string[];
}

export interface PbSystemSymbolEntry extends PbSystemSymbolEntryDraft {
    id: string;
    normalizedName: string;
    lookupKeys: readonly string[];
    normalizedOwnerTypes: readonly string[];
}
