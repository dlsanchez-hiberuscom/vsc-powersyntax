import type { Position, Range } from 'vscode-languageserver/node';
import type { Entity, EntityKind, EntityLineageConfidence } from '../types';
import type { QueryConsumerId } from '../../features/queryScopePolicy';
import type { SourceOrigin } from '../../../shared/sourceOrigin';
import type {
  QueryReasonCode,
  QueryInvocationKind,
  QueryInvocationRisk,
  QueryEvidenceEntry,
  QueryCandidate,
  ResolvedTargetInfo,
} from './semanticQueryService';
import type { TraceStep } from '../queryTrace';

const CATALOG_URI_PREFIX = 'catalog:';
const SEMANTIC_EPOCH_SNAPSHOT_ID_PREFIX = 'semantic-epoch';
const TRACE_STEP_BUDGET_EXCEEDED = 'budget:exceeded';
const QUERY_REASON_GLOBAL_FALLBACK = 'global-fallback';

const SOURCE_AUTHORITY_OFFICIAL = 'official';
const SOURCE_AUTHORITY_DERIVED = 'derived';
const OWNER_KIND_CONTAINER = 'container';

const DEGRADED_STATE_TIMEOUT = 'timeout';
const DEGRADED_STATE_LOW_READINESS = 'low-readiness';
const DEGRADED_STATE_DYNAMIC = 'dynamic';
const DEGRADED_STATE_UNSUPPORTED_DOMAIN = 'unsupported-domain';

/**
 * Confianza de la resolución semántica.
 * unknown: no se pudo determinar o no aplica.
 */
export type SemanticConfidence = 'high' | 'medium' | 'low' | 'unknown';

/**
 * Origen de la confianza (lineage).
 * direct: declarado en el propio objeto/contexto.
 * inherited: heredado de ancestros.
 * fallback: resuelto mediante búsqueda global heurística.
 */
export type LineageConfidence = 'direct' | 'inherited' | 'fallback' | 'unknown';

export interface SemanticQuery {
  consumer?: QueryConsumerId;
  uri: string;
  position?: Position;
  range?: Range;
  identifier?: string;
  qualifier?: string;
  invocationKind?: QueryInvocationKind;
  expectedKind?: EntityKind;
  project?: string;
  library?: string;
  sourceOriginPolicy?: {
    allowStaging: boolean;
    allowGenerated: boolean;
    allowExternal: boolean;
  };
  budgetMs?: number;
  resultCap?: number;
  cancellation?: boolean;
  readiness?: 'low' | 'partial' | 'ready';
}

export interface SemanticQueryResult {
  /** Query original que produjo este resultado. */
  query: SemanticQuery;

  /** Target principal resuelto. */
  target: Entity | null;

  /** Categoría del target. */
  kind:
    | 'workspace-symbol'
    | 'system-symbol'
    | 'datawindow'
    | 'sql-anchor'
    | 'transaction'
    | 'external-native'
    | 'framework-advisory'
    | 'diagnostic'
    | 'unknown';

  /** Owner lógico normalizado. */
  owner?: {
    name: string;
    kind: 'object' | 'type' | 'container' | 'callable' | 'project' | 'library' | 'system-domain';
  };

  /** Contexto de visibilidad y scope. */
  scope?: {
    pbScope?: string;
    visibility?: string;
    currentObject?: string;
    librarySearchPath?: string[];
  };

  /** Detalles del origen del símbolo. */
  source?: {
    origin: SourceOrigin | 'unknown';
    authority: string;
    uri?: string;
    range?: Range;
    project?: string;
    library?: string;
    snapshotIdentity?: string;
  };

  /** Confianza y evidencia de la resolución. */
  confidence: {
    level: SemanticConfidence;
    lineage?: LineageConfidence;
  };

  /** Entradas de evidencia que justifican el resultado. */
  evidence: QueryEvidenceEntry[];

  /** Reason codes estables mapeables a diagnósticos. */
  reasons: QueryReasonCode[];

  /** Candidatos alternativos o rechazados. */
  alternatives?: {
    ambiguousTargets?: Entity[];
    overloads?: Entity[];
    fallbackTargets?: Entity[];
    rejected?: Array<{
      target: Entity | QueryCandidate;
      reason: string;
    }>;
  };

  /** Detalles de degradación si el resultado no es óptimo. */
  degraded?: {
    state: 'low-readiness' | 'timeout' | 'unsupported-domain' | 'dynamic' | 'cap-reached';
    reason: string;
    userVisible: boolean;
    fallbackAction?: string;
  };

  /** Información para el control de caches. */
  cacheability?: {
    cacheable: boolean;
    cacheClass?: string;
    keyParts?: string[];
    ttlHint?: number;
    epoch?: number;
    fingerprint?: string;
  };

  /** Versión de la KnowledgeBase usada. */
  semanticEpoch: number;

  /** Naturaleza de la invocación (local, miembro, global, super, etc). */
  invocationKind: QueryInvocationKind;

  /** Nivel de riesgo técnico de la invocación (segura, dinámica, fallback). */
  invocationRisk: QueryInvocationRisk;

  /** Trazas internas de resolución (opcional). */
  trace?: TraceStep[];
}

/**
 * Mapea el resultado interno ResolvedTargetInfo al contrato público SemanticQueryResult.
 * Implementado como envelope incremental según PB-ARCH-P0-SEMANTIC-QUERY-CONTRACT-01.
 */
export function toSemanticQueryResult(
  info: ResolvedTargetInfo,
  query: SemanticQuery,
  epoch: number
): SemanticQueryResult {
  const target = info.targets[0] ?? null;
  const source = buildSource(target, epoch);
  const scope = buildScope(target);
  const degraded = buildDegradedState(info, query);

  return {
    query,
    target,
    kind: mapResultKind(target),
    owner: buildOwner(target),
    ...(scope ? { scope } : {}),
    ...(source ? { source } : {}),
    confidence: {
      level: info.confidence,
      lineage: mapLineageConfidence(info.winnerLineage?.confidence),
    },
    evidence: info.evidence,
    reasons: info.reasonCodes,
    semanticEpoch: epoch,
    invocationKind: info.invocationKind,
    invocationRisk: info.invocationRisk,
    trace: info.trace,
    cacheability: buildCacheability(epoch),
    ...(degraded ? { degraded } : {}),
    alternatives: buildAlternatives(info),
  };
}

function isCatalogUri(uri: string): boolean {
  return uri.startsWith(CATALOG_URI_PREFIX);
}

function buildSemanticSnapshotIdentity(epoch: number): string {
  return `${SEMANTIC_EPOCH_SNAPSHOT_ID_PREFIX}:${epoch}`;
}

function buildOwner(target: Entity | null): SemanticQueryResult['owner'] | undefined {
  if (!target?.containerName) {
    return undefined;
  }

  return {
    name: target.containerName,
    kind: OWNER_KIND_CONTAINER,
  };
}

function buildAlternatives(info: ResolvedTargetInfo): SemanticQueryResult['alternatives'] {
  return {
    ambiguousTargets: info.targets.length > 1 ? info.targets.slice(1) : undefined,
    fallbackTargets: info.reasonCodes.includes(QUERY_REASON_GLOBAL_FALLBACK) ? info.targets : undefined,
  };
}

function buildCacheability(epoch: number): SemanticQueryResult['cacheability'] {
  return {
    cacheable: true,
    epoch,
  };
}

function mapResultKind(target: Entity | null): SemanticQueryResult['kind'] {
  if (!target) {
    return 'unknown';
  }

  if (target.isExternal) {
    return 'external-native';
  }

  return isCatalogUri(target.uri) ? 'system-symbol' : 'workspace-symbol';
}

function buildScope(target: Entity | null): SemanticQueryResult['scope'] | undefined {
  if (!target) {
    return undefined;
  }

  const scope: NonNullable<SemanticQueryResult['scope']> = {
    ...(target.scope ? { pbScope: target.scope } : {}),
    ...(target.access ? { visibility: target.access } : {}),
    ...(target.fileObjectName ?? target.containerName
      ? { currentObject: target.fileObjectName ?? target.containerName }
      : {}),
  };

  return Object.keys(scope).length > 0 ? scope : undefined;
}

function buildSource(target: Entity | null, epoch: number): SemanticQueryResult['source'] | undefined {
  if (!target) {
    return undefined;
  }

  return {
    origin: target.lineage?.sourceOrigin ?? 'unknown',
    authority: target.lineage?.authority ?? (isCatalogUri(target.uri) ? SOURCE_AUTHORITY_OFFICIAL : SOURCE_AUTHORITY_DERIVED),
    uri: target.uri,
    range: {
      start: { line: target.line, character: target.character },
      end: { line: target.line, character: target.character + target.name.length },
    },
    ...(target.externalLibraryName ? { library: target.externalLibraryName } : {}),
    snapshotIdentity: buildSemanticSnapshotIdentity(epoch),
  };
}

function buildDegradedState(
  info: ResolvedTargetInfo,
  query: SemanticQuery,
): SemanticQueryResult['degraded'] | undefined {
  if (info.trace.some((step) => step.name === TRACE_STEP_BUDGET_EXCEEDED)) {
    return {
      state: DEGRADED_STATE_TIMEOUT,
      reason: query.budgetMs !== undefined
        ? `Semantic query exceeded its ${query.budgetMs}ms budget.`
        : 'Semantic query exceeded its configured budget.',
      userVisible: true,
    };
  }

  if (query.readiness && query.readiness !== 'ready') {
    return {
      state: DEGRADED_STATE_LOW_READINESS,
      reason: `Semantic readiness=${query.readiness}.`,
      userVisible: query.readiness === 'low',
    };
  }

  if (info.invocationRisk === 'dynamic' || info.invocationRisk === 'fallback') {
    return {
      state: DEGRADED_STATE_DYNAMIC,
      reason: `Semantic resolution uses invocationRisk=${info.invocationRisk}.`,
      userVisible: true,
    };
  }

  if (info.invocationRisk === 'external' && info.targets.length === 0) {
    return {
      state: DEGRADED_STATE_UNSUPPORTED_DOMAIN,
      reason: 'Semantic resolution depends on external/native metadata not materialized in the result.',
      userVisible: true,
    };
  }

  return undefined;
}

function mapLineageConfidence(confidence?: EntityLineageConfidence): LineageConfidence {
  switch (confidence) {
    case 'direct':
      return 'direct';

    case 'inherited':
      return 'inherited';

    case 'fallback':
      return 'fallback';

    default:
      return 'unknown';
  }
}