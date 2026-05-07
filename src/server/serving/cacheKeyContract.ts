import { normalizeUri } from '../system/uriUtils';

import type { SourceOrigin } from '../../shared/sourceOrigin';

export type InteractiveServingCacheClass = 'serving' | 'view-model' | 'negative';

export type InteractiveServingPressureClass = 'hot' | 'heavy' | 'negative';

export type InteractiveServingCacheFeature =
  | 'hover'
  | 'hover-view-model'
  | 'hover-negative'
  | 'completion'
  | 'completion-resolve'
  | 'completion-view-model'
  | 'signatureHelp'
  | 'signatureHelp-view-model'
  | 'definition'
  | 'references'
  | 'documentSymbols'
  | 'semanticTokens';

/**
 * Campos canónicos compartidos por caches de serving, presentation ViewModel y negative cache.
 *
 * Obligatorios:
 * - `cacheClass`, `feature`, `uri`, `documentVersion`, `kbVersion`, `documentFingerprint`, `sourceOrigin`
 *
 * Opcionales y dependientes de la feature:
 * - `locale`, `line`/`character`, `range*`, `context`, `trigger*`, `prefix`, `extra`
 *
 * CACHE-P0-SERVING-KEY-DOCUMENT-EPOCH-01:
 * `documentFingerprint` reemplaza al antiguo `semanticEpoch` global.
 * El fingerprint solo cambia cuando el contenido de ESTE documento cambia,
 * no cuando se indexa cualquier otro archivo del workspace.
 */
export interface InteractiveServingCacheKeyDescriptor {
  cacheClass: InteractiveServingCacheClass;
  feature: InteractiveServingCacheFeature;
  pressureClass?: InteractiveServingPressureClass;
  uri: string;
  documentVersion: string | number;
  kbVersion: number;
  /**
   * Per-document content hash. Replaces global semanticEpoch.
   * Only changes when THIS document's content changes.
   */
  documentFingerprint: number | string;
  sourceOrigin: SourceOrigin | 'unknown';
  locale?: string;
  line?: number;
  character?: number;
  rangeStartLine?: number;
  rangeStartCharacter?: number;
  rangeEndLine?: number;
  rangeEndCharacter?: number;
  context?: string;
  triggerKind?: number | string;
  triggerCharacter?: string;
  prefix?: string;
  extra?: string;
}

export interface InteractiveServingInvalidationScope {
  cacheClass: InteractiveServingCacheClass;
  feature: InteractiveServingCacheFeature;
  pressureClass: InteractiveServingPressureClass;
  uri: string;
  documentVersion: string;
  kbVersion: number;
  documentFingerprint: number | string;
  sourceOrigin: SourceOrigin | 'unknown';
  locale: string;
}

function normalizeStringValue(value: string | number | undefined): string {
  if (value === undefined || value === '') {
    return '';
  }

  return encodeURIComponent(String(value));
}

function buildPositionFragment(descriptor: InteractiveServingCacheKeyDescriptor): string {
  if (typeof descriptor.line === 'number' && typeof descriptor.character === 'number') {
    return `pos:${descriptor.line}:${descriptor.character}`;
  }

  return 'pos:';
}

function buildRangeFragment(descriptor: InteractiveServingCacheKeyDescriptor): string {
  const hasStart = typeof descriptor.rangeStartLine === 'number' && typeof descriptor.rangeStartCharacter === 'number';
  const hasEnd = typeof descriptor.rangeEndLine === 'number' && typeof descriptor.rangeEndCharacter === 'number';
  if (!hasStart || !hasEnd) {
    return 'range:';
  }

  return `range:${descriptor.rangeStartLine}:${descriptor.rangeStartCharacter}-${descriptor.rangeEndLine}:${descriptor.rangeEndCharacter}`;
}

export function buildInteractiveServingInvalidationScope(
  descriptor: InteractiveServingCacheKeyDescriptor
): InteractiveServingInvalidationScope {
  return {
    cacheClass: descriptor.cacheClass,
    feature: descriptor.feature,
    pressureClass: descriptor.pressureClass ?? (descriptor.cacheClass === 'negative' ? 'negative' : 'hot'),
    uri: normalizeUri(descriptor.uri),
    documentVersion: String(descriptor.documentVersion),
    kbVersion: descriptor.kbVersion,
    documentFingerprint: descriptor.documentFingerprint,
    sourceOrigin: descriptor.sourceOrigin,
    locale: descriptor.locale ?? '',
  };
}

export function buildInteractiveServingCacheKey(descriptor: InteractiveServingCacheKeyDescriptor): string {
  const scope = buildInteractiveServingInvalidationScope(descriptor);

  return [
    `class:${scope.cacheClass}`,
    `feature:${scope.feature}`,
    `pressure:${scope.pressureClass}`,
    `uri:${normalizeStringValue(scope.uri)}`,
    `doc:${normalizeStringValue(scope.documentVersion)}`,
    `kb:${scope.kbVersion}`,
    `fp:${scope.documentFingerprint}`,
    `origin:${normalizeStringValue(scope.sourceOrigin)}`,
    `locale:${normalizeStringValue(scope.locale)}`,
    buildPositionFragment(descriptor),
    buildRangeFragment(descriptor),
    `context:${normalizeStringValue(descriptor.context)}`,
    `trigger:${normalizeStringValue(descriptor.triggerKind)}:${normalizeStringValue(descriptor.triggerCharacter)}`,
    `prefix:${normalizeStringValue(descriptor.prefix)}`,
    `extra:${normalizeStringValue(descriptor.extra)}`,
  ].join('|');
}