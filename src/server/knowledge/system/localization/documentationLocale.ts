import type { DocumentationLocale } from './documentationService';

export type DocumentationLocaleSetting = DocumentationLocale | 'auto';

export const DEFAULT_DOCUMENTATION_LOCALE_SETTING: DocumentationLocaleSetting = 'auto';

export function sanitizeDocumentationLocaleSetting(value: unknown): DocumentationLocaleSetting {
  return value === 'en' || value === 'es' || value === 'auto'
    ? value
    : DEFAULT_DOCUMENTATION_LOCALE_SETTING;
}

export function resolveDocumentationLocale(
  setting: DocumentationLocaleSetting,
  uiLocale?: string | null,
): DocumentationLocale {
  const sanitizedSetting = sanitizeDocumentationLocaleSetting(setting);
  if (sanitizedSetting !== 'auto') {
    return sanitizedSetting;
  }

  const normalizedUiLocale = normalizeUiLocale(uiLocale);
  return normalizedUiLocale ?? 'en';
}

function normalizeUiLocale(uiLocale?: string | null): DocumentationLocale | undefined {
  const normalized = uiLocale?.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === 'es' || normalized.startsWith('es-')) {
    return 'es';
  }

  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }

  return undefined;
}