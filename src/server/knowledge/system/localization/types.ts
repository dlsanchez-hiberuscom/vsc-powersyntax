import type {
  PbCatalogLocale,
  PbLocalizedEventReturnCodeDocumentation,
  PbLocalizedParameterDocumentation,
  PbLocalizedText,
  PbSystemSymbolDomain,
  PbSystemSymbolLocalizationOverlay,
  PbSystemSymbolLocalizationOverlaySource,
  PbSystemSymbolLocalizationTargetKey,
} from '../types';

export type {
  PbCatalogLocale,
  PbLocalizedEventReturnCodeDocumentation,
  PbLocalizedParameterDocumentation,
  PbLocalizedText,
  PbSystemSymbolLocalizationOverlay,
  PbSystemSymbolLocalizationOverlaySource,
  PbSystemSymbolLocalizationTargetKey,
} from '../types';

export type PbSystemSymbolLocalizationOrphanReason =
  | 'missing-target'
  | 'missing-target-id'
  | 'missing-target-key'
  | 'ambiguous-target-key'
  | 'target-mismatch';

export interface PbSystemSymbolLocalizationOrphan {
  readonly locale: PbCatalogLocale;
  readonly reason: PbSystemSymbolLocalizationOrphanReason;
  readonly targetId?: string;
  readonly targetKey?: PbSystemSymbolLocalizationTargetKey;
}

export interface PbResolvedSystemSymbolLocalizationOverlay extends PbSystemSymbolLocalizationOverlay {
  readonly targetEntryId: string;
}

export interface PbSystemSymbolLocalizationLocaleSummary {
  readonly overlayCount: number;
  readonly targetIdCount: number;
  readonly targetKeyCount: number;
  readonly reviewedCount: number;
  readonly orphanCount: number;
}

export type PbSystemSymbolLocalizationMissingField =
  | 'summary'
  | 'documentation'
  | 'usageNotes'
  | 'obsoleteMessage'
  | 'returnDocumentation'
  | 'parameterDocumentation';

export interface PbSystemSymbolLocalizationDomainCoverage {
  readonly domain: PbSystemSymbolDomain;
  readonly totalTargetCount: number;
  readonly localizedTargetCount: number;
  readonly reviewedTargetCount: number;
  readonly localizedRatio: number;
  readonly reviewedRatio: number;
}

export interface PbSystemSymbolLocalizationIncompleteOverlay {
  readonly locale: PbCatalogLocale;
  readonly targetEntryId: string;
  readonly targetName: string;
  readonly domain: PbSystemSymbolDomain;
  readonly targetId?: string;
  readonly targetKey?: PbSystemSymbolLocalizationTargetKey;
  readonly missingFields: readonly PbSystemSymbolLocalizationMissingField[];
}

export interface PbSystemSymbolLocalizationInvalidParameterTarget {
  readonly locale: PbCatalogLocale;
  readonly targetEntryId: string;
  readonly targetName: string;
  readonly domain: PbSystemSymbolDomain;
  readonly targetId?: string;
  readonly targetKey?: PbSystemSymbolLocalizationTargetKey;
  readonly signatureLabel: string;
  readonly parameterName: string;
}

export interface PbSystemSymbolLocalizationIndex {
  readonly locales: ReadonlyMap<PbCatalogLocale, ReadonlyMap<string, PbResolvedSystemSymbolLocalizationOverlay>>;
  readonly localeSummaries: Partial<Record<PbCatalogLocale, PbSystemSymbolLocalizationLocaleSummary>>;
  readonly domainCoverage: Partial<Record<PbCatalogLocale, Partial<Record<PbSystemSymbolDomain, PbSystemSymbolLocalizationDomainCoverage>>>>;
  readonly incompleteOverlays: readonly PbSystemSymbolLocalizationIncompleteOverlay[];
  readonly invalidParameterTargets: readonly PbSystemSymbolLocalizationInvalidParameterTarget[];
  readonly overlayCount: number;
  readonly orphanOverlays: readonly PbSystemSymbolLocalizationOrphan[];
}

export interface PbSystemSymbolLocalizationCatalogReport {
  readonly locales: Partial<Record<PbCatalogLocale, PbSystemSymbolLocalizationLocaleSummary>>;
  readonly domainCoverage: Partial<Record<PbCatalogLocale, Partial<Record<PbSystemSymbolDomain, PbSystemSymbolLocalizationDomainCoverage>>>>;
  readonly incompleteOverlays: readonly PbSystemSymbolLocalizationIncompleteOverlay[];
  readonly invalidParameterTargets: readonly PbSystemSymbolLocalizationInvalidParameterTarget[];
  readonly orphanOverlays: readonly PbSystemSymbolLocalizationOrphan[];
}