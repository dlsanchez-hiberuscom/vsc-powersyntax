import type {
  PbCatalogLocale,
  PbLocalizedEventReturnCodeDocumentation,
  PbLocalizedParameterDocumentation,
  PbLocalizedText,
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

export interface PbSystemSymbolLocalizationIndex {
  readonly locales: ReadonlyMap<PbCatalogLocale, ReadonlyMap<string, PbResolvedSystemSymbolLocalizationOverlay>>;
  readonly localeSummaries: Partial<Record<PbCatalogLocale, PbSystemSymbolLocalizationLocaleSummary>>;
  readonly overlayCount: number;
  readonly orphanOverlays: readonly PbSystemSymbolLocalizationOrphan[];
}

export interface PbSystemSymbolLocalizationCatalogReport {
  readonly locales: Partial<Record<PbCatalogLocale, PbSystemSymbolLocalizationLocaleSummary>>;
  readonly orphanOverlays: readonly PbSystemSymbolLocalizationOrphan[];
}