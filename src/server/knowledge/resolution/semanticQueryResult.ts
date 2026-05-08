import type { Position, Range } from 'vscode-languageserver/node';
import type { Entity, EntityKind, EntityLineageConfidence } from '../types';
import type { QueryConsumerId } from '../../features/queryScopePolicy';
import type { SourceOrigin } from '../../../shared/sourceOrigin';
import type { QueryReasonCode, QueryInvocationKind, QueryInvocationRisk, QueryAmbiguityKind, QueryEvidenceEntry, QueryCandidate, ResolvedTargetInfo } from './semanticQueryService';
import type { TraceStep } from '../queryTrace';

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
  cancellation?: boolean;
  readiness?: 'low' | 'partial' | 'ready';
}

export interface SemanticQueryResult {
  /** Query original que produjo este resultado. */
  query: SemanticQuery;
  
  /** Target principal resuelto. */
  target: Entity | null;
  
  /** Categoría del target. */
  kind: 'workspace-symbol' | 'system-symbol' | 'datawindow' | 'sql-anchor' | 'transaction' | 'external-native' | 'framework-advisory' | 'diagnostic' | 'unknown';
  
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

  return {
    query,
    target,
    kind: target ? (target.uri.startsWith('catalog:') ? 'system-symbol' : 'workspace-symbol') : 'unknown',
    owner: target?.containerName ? {
      name: target.containerName,
      kind: 'container' // Simplificación inicial
    } : undefined,
    confidence: {
      level: info.confidence,
      lineage: mapLineageConfidence(info.winnerLineage?.confidence)
    },
    evidence: info.evidence,
    reasons: info.reasonCodes,
    semanticEpoch: epoch,
    invocationKind: info.invocationKind,
    invocationRisk: info.invocationRisk,
    trace: info.trace,
    cacheability: {
      cacheable: true,
      epoch: epoch
    },
    alternatives: {
      ambiguousTargets: info.targets.length > 1 ? info.targets.slice(1) : undefined,
      fallbackTargets: info.reasonCodes.includes('global-fallback') ? info.targets : undefined
    }
  };
}

function mapLineageConfidence(c?: EntityLineageConfidence): LineageConfidence {
  switch (c) {
    case 'direct': return 'direct';
    case 'inherited': return 'inherited';
    case 'fallback': return 'fallback';
    default: return 'unknown';
  }
}
