import type { PbSystemSymbolEntry } from '../types';
import { getSystemSymbolLocalizationOverlay } from './localizationResolver';
import type {
  PbCatalogLocale,
  PbResolvedSystemSymbolLocalizationOverlay,
} from './types';

export type DocumentationLocale = PbCatalogLocale;

export interface SystemSymbolDocumentationService {
  getDisplaySummary(entry: PbSystemSymbolEntry, locale: DocumentationLocale): string;
  getDisplayDocumentation(entry: PbSystemSymbolEntry, locale: DocumentationLocale): string | undefined;
  getDisplayUsageNotes(entry: PbSystemSymbolEntry, locale: DocumentationLocale): readonly string[];
  getDisplayObsoleteMessage(entry: PbSystemSymbolEntry, locale: DocumentationLocale): string | undefined;
  getDisplayReturnDocumentation(entry: PbSystemSymbolEntry, locale: DocumentationLocale): string | undefined;
  getDisplayParameterDocumentation(
    entry: PbSystemSymbolEntry,
    signatureLabel: string,
    parameterName: string,
    locale: DocumentationLocale,
  ): string | undefined;
}

type LocalizationOverlayResolver = (
  entryId: string,
  locale: DocumentationLocale,
) => PbResolvedSystemSymbolLocalizationOverlay | undefined;

const EMPTY_USAGE_NOTES: readonly string[] = [];

function normalizeLookupText(value?: string): string | undefined {
  const normalized = value?.trim().replace(/\s+/g, ' ').toLowerCase();
  return normalized ? normalized : undefined;
}

function buildParameterDocumentationLookupKey(
  signatureLabel: string,
  parameterName: string,
): string | undefined {
  const normalizedSignatureLabel = normalizeLookupText(signatureLabel);
  const normalizedParameterName = normalizeLookupText(parameterName);

  if (!normalizedSignatureLabel || !normalizedParameterName) {
    return undefined;
  }

  return `${normalizedSignatureLabel}|${normalizedParameterName}`;
}

function buildEntryParameterDocumentationIndex(
  entry: PbSystemSymbolEntry,
): ReadonlyMap<string, string> {
  const parameterDocumentation = new Map<string, string>();

  for (const signature of entry.signatures) {
    for (const parameter of signature.parameters ?? []) {
      const lookupKey = buildParameterDocumentationLookupKey(signature.label, parameter.label);
      if (!lookupKey || !parameter.documentation?.trim() || parameterDocumentation.has(lookupKey)) {
        continue;
      }

      parameterDocumentation.set(lookupKey, parameter.documentation);
    }
  }

  return parameterDocumentation;
}

function buildOverlayParameterDocumentationIndex(
  overlay: PbResolvedSystemSymbolLocalizationOverlay,
): ReadonlyMap<string, string> {
  const parameterDocumentation = new Map<string, string>();

  for (const parameter of overlay.parameters ?? []) {
    const lookupKey = buildParameterDocumentationLookupKey(
      parameter.signatureLabel,
      parameter.parameterName,
    );
    if (!lookupKey || !parameter.documentation.trim() || parameterDocumentation.has(lookupKey)) {
      continue;
    }

    parameterDocumentation.set(lookupKey, parameter.documentation);
  }

  return parameterDocumentation;
}

export function createDocumentationService(
  resolveOverlay: LocalizationOverlayResolver,
): SystemSymbolDocumentationService {
  const entryParameterDocumentationIndex = new WeakMap<PbSystemSymbolEntry, ReadonlyMap<string, string>>();
  const overlayParameterDocumentationIndex = new WeakMap<PbResolvedSystemSymbolLocalizationOverlay, ReadonlyMap<string, string>>();

  function getPreferredOverlay(
    entry: PbSystemSymbolEntry,
    locale: DocumentationLocale,
  ): PbResolvedSystemSymbolLocalizationOverlay | undefined {
    if (locale === 'en') {
      return undefined;
    }

    return resolveOverlay(entry.id, locale);
  }

  function getEntryParameterDocumentation(
    entry: PbSystemSymbolEntry,
    signatureLabel: string,
    parameterName: string,
  ): string | undefined {
    const lookupKey = buildParameterDocumentationLookupKey(signatureLabel, parameterName);
    if (!lookupKey) {
      return undefined;
    }

    const cached = entryParameterDocumentationIndex.get(entry);
    if (cached) {
      return cached.get(lookupKey);
    }

    const built = buildEntryParameterDocumentationIndex(entry);
    entryParameterDocumentationIndex.set(entry, built);
    return built.get(lookupKey);
  }

  function getOverlayParameterDocumentation(
    overlay: PbResolvedSystemSymbolLocalizationOverlay,
    signatureLabel: string,
    parameterName: string,
  ): string | undefined {
    const lookupKey = buildParameterDocumentationLookupKey(signatureLabel, parameterName);
    if (!lookupKey) {
      return undefined;
    }

    const cached = overlayParameterDocumentationIndex.get(overlay);
    if (cached) {
      return cached.get(lookupKey);
    }

    const built = buildOverlayParameterDocumentationIndex(overlay);
    overlayParameterDocumentationIndex.set(overlay, built);
    return built.get(lookupKey);
  }

  return {
    getDisplaySummary(entry, locale) {
      return getPreferredOverlay(entry, locale)?.text?.summary ?? entry.summary;
    },

    getDisplayDocumentation(entry, locale) {
      return getPreferredOverlay(entry, locale)?.text?.documentation ?? entry.documentation;
    },

    getDisplayUsageNotes(entry, locale) {
      const localizedUsageNotes = getPreferredOverlay(entry, locale)?.text?.usageNotes;
      if (localizedUsageNotes !== undefined) {
        return localizedUsageNotes;
      }

      return entry.usageNotes ?? EMPTY_USAGE_NOTES;
    },

    getDisplayObsoleteMessage(entry, locale) {
      return getPreferredOverlay(entry, locale)?.text?.obsoleteMessage ?? entry.obsoleteMessage;
    },

    getDisplayReturnDocumentation(entry, locale) {
      return getPreferredOverlay(entry, locale)?.text?.returnDocumentation ?? entry.returnDocumentation;
    },

    getDisplayParameterDocumentation(entry, signatureLabel, parameterName, locale) {
      const preferredOverlay = getPreferredOverlay(entry, locale);
      const localizedDocumentation = preferredOverlay
        ? getOverlayParameterDocumentation(preferredOverlay, signatureLabel, parameterName)
        : undefined;

      if (localizedDocumentation !== undefined) {
        return localizedDocumentation;
      }

      return getEntryParameterDocumentation(entry, signatureLabel, parameterName);
    },
  };
}

const defaultDocumentationService = createDocumentationService(getSystemSymbolLocalizationOverlay);

export function getDisplaySummary(
  entry: PbSystemSymbolEntry,
  locale: DocumentationLocale,
): string {
  return defaultDocumentationService.getDisplaySummary(entry, locale);
}

export function getDisplayDocumentation(
  entry: PbSystemSymbolEntry,
  locale: DocumentationLocale,
): string | undefined {
  return defaultDocumentationService.getDisplayDocumentation(entry, locale);
}

export function getDisplayUsageNotes(
  entry: PbSystemSymbolEntry,
  locale: DocumentationLocale,
): readonly string[] {
  return defaultDocumentationService.getDisplayUsageNotes(entry, locale);
}

export function getDisplayObsoleteMessage(
  entry: PbSystemSymbolEntry,
  locale: DocumentationLocale,
): string | undefined {
  return defaultDocumentationService.getDisplayObsoleteMessage(entry, locale);
}

export function getDisplayReturnDocumentation(
  entry: PbSystemSymbolEntry,
  locale: DocumentationLocale,
): string | undefined {
  return defaultDocumentationService.getDisplayReturnDocumentation(entry, locale);
}

export function getDisplayParameterDocumentation(
  entry: PbSystemSymbolEntry,
  signatureLabel: string,
  parameterName: string,
  locale: DocumentationLocale,
): string | undefined {
  return defaultDocumentationService.getDisplayParameterDocumentation(
    entry,
    signatureLabel,
    parameterName,
    locale,
  );
}