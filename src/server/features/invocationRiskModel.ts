import type { SourceOrigin } from '../../shared/sourceOrigin';
import type { ApiInvocationRisk, ApiInvocationRiskSummary } from '../../shared/publicApi';
import type { DynamicStringReferenceHit } from './dynamicStringReferences';

const RISK_ORDER: Record<ApiInvocationRisk, number> = {
  safe: 0,
  inherited: 1,
  fallback: 2,
  dynamic: 3,
  external: 4,
};

const NON_CANONICAL_SOURCE_ORIGINS = new Set<SourceOrigin>([
  'manual-export-source',
  'orca-staging',
  'pbl-dump-source',
  'generated',
  'backup',
  'unknown',
]);

export function combineInvocationRisk(...risks: Array<ApiInvocationRisk | undefined>): ApiInvocationRisk {
  return risks.reduce<ApiInvocationRisk>((current, candidate) => {
    if (!candidate) {
      return current;
    }
    return RISK_ORDER[candidate] > RISK_ORDER[current] ? candidate : current;
  }, 'safe');
}

export function sourceOriginRisk(sourceOrigin: SourceOrigin | undefined): ApiInvocationRisk | undefined {
  if (!sourceOrigin || !NON_CANONICAL_SOURCE_ORIGINS.has(sourceOrigin)) {
    return undefined;
  }
  return sourceOrigin === 'orca-staging' || sourceOrigin === 'generated' ? 'dynamic' : 'fallback';
}

export function dynamicStringRisk(hits: readonly DynamicStringReferenceHit[]): ApiInvocationRisk | undefined {
  const blockingHits = hits.filter((hit) => hit.classification !== 'safe-literal');
  if (blockingHits.length === 0) {
    return undefined;
  }
  return blockingHits.some((hit) => hit.classification === 'dynamic' || hit.classification === 'probable')
    ? 'dynamic'
    : 'fallback';
}

export function buildInvocationRiskSummary(input: {
  baseRisk?: ApiInvocationRisk;
  sourceOrigin?: SourceOrigin;
  dynamicStringHits?: readonly DynamicStringReferenceHit[];
  evidenceKinds?: readonly string[];
  hasExternalTarget?: boolean;
  dataWindowBindingStates?: readonly string[];
}): ApiInvocationRiskSummary {
  const dynamicHits = input.dynamicStringHits ?? [];
  const blockingDynamicHits = dynamicHits.filter((hit) => hit.classification !== 'safe-literal');
  const dataWindowDynamic = (input.dataWindowBindingStates ?? []).some((state) => state === 'dynamic' || state === 'ambiguous' || state === 'missing');
  const evidenceFallback: ApiInvocationRisk | undefined = (input.evidenceKinds ?? []).some((kind) => kind === 'fallback-ambiguity' || kind === 'discarded-context')
    ? 'fallback'
    : undefined;
  const risk = combineInvocationRisk(
    input.baseRisk,
    input.hasExternalTarget ? 'external' : undefined,
    sourceOriginRisk(input.sourceOrigin),
    dynamicStringRisk(dynamicHits),
    dataWindowDynamic ? 'dynamic' : undefined,
    evidenceFallback
  );

  const reasons: string[] = [];
  if (input.baseRisk && input.baseRisk !== 'safe') {
    reasons.push(`query:${input.baseRisk}`);
  }
  if (input.hasExternalTarget) {
    reasons.push('external-target');
  }
  if (input.sourceOrigin && sourceOriginRisk(input.sourceOrigin)) {
    reasons.push(`source-origin:${input.sourceOrigin}`);
  }
  if (blockingDynamicHits.length > 0) {
    reasons.push(`dynamic-strings:${blockingDynamicHits.length}`);
    const dynamicApis = new Map<string, number>();
    for (const hit of blockingDynamicHits) {
      if (hit.api !== 'dynamic-sql') {
        continue;
      }
      dynamicApis.set(hit.api, (dynamicApis.get(hit.api) ?? 0) + 1);
    }
    for (const [api, total] of [...dynamicApis.entries()].sort(([left], [right]) => left.localeCompare(right))) {
      reasons.push(`${api}:${total}`);
    }
  }
  if (dataWindowDynamic) {
    reasons.push('datawindow-binding-dynamic');
  }
  for (const kind of input.evidenceKinds ?? []) {
    if (kind === 'fallback-ambiguity' || kind === 'discarded-context') {
      reasons.push(`evidence:${kind}`);
    }
  }

  return {
    risk,
    reasons: [...new Set(reasons)],
    ...(blockingDynamicHits.length > 0 ? { dynamicStringReferenceCount: blockingDynamicHits.length } : {}),
  };
}