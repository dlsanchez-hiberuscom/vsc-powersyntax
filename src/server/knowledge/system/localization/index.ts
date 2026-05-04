export { PB_SYSTEM_SYMBOL_LOCALIZATION_ES } from './es';
export {
  createDocumentationService,
  getDisplayDocumentation,
  getDisplayObsoleteMessage,
  getDisplayParameterDocumentation,
  getDisplayReturnDocumentation,
  getDisplaySummary,
  getDisplayUsageNotes,
  type DocumentationLocale,
  type SystemSymbolDocumentationService,
} from './documentationService';
export {
  buildSystemSymbolLocalizationIndex,
  getSystemSymbolLocalizationCatalogReport,
  getSystemSymbolLocalizationIndex,
  getSystemSymbolLocalizationOverlay,
  PB_SYSTEM_SYMBOL_LOCALIZATION_OVERLAYS,
} from './localizationResolver';
export type {
  PbCatalogLocale,
  PbLocalizedEventReturnCodeDocumentation,
  PbLocalizedParameterDocumentation,
  PbLocalizedText,
  PbResolvedSystemSymbolLocalizationOverlay,
  PbSystemSymbolLocalizationCatalogReport,
  PbSystemSymbolLocalizationIndex,
  PbSystemSymbolLocalizationLocaleSummary,
  PbSystemSymbolLocalizationOrphan,
  PbSystemSymbolLocalizationOrphanReason,
  PbSystemSymbolLocalizationOverlay,
  PbSystemSymbolLocalizationOverlaySource,
  PbSystemSymbolLocalizationTargetKey,
} from './types';