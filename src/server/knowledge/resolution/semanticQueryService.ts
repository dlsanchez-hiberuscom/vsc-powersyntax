import { KnowledgeBase } from '../KnowledgeBase';
import { InheritanceGraph } from './InheritanceGraph';
import type { HotContextCache } from '../HotContextCache';
import { InvocationContext } from '../../utils/invocationContext';
import { Entity, EntityKind, type EntityLineageConfidence } from '../types';
import { normalizeUri } from '../../system/uriUtils';
import { recordTraceStep, type TraceStep, withTrace } from '../queryTrace';

export type QueryReasonCode =
  | 'local-scope'
  | 'member-hierarchy'
  | 'super-hierarchy'
  | 'qualifier-type'
  | 'global-fallback';

export type ResolvedWinnerLineage = NonNullable<Entity['lineage']> & {
  confidence: EntityLineageConfidence;
  resolutionKind: QueryReasonCode;
};

export type QueryResolutionConfidence = 'high' | 'medium' | 'low';

export interface QueryEvidence {
  kind: 'winner-target';
  reasonCode: QueryReasonCode;
  confidence: EntityLineageConfidence;
  targetName: string;
  targetKind: EntityKind;
  targetUri: string;
  targetContainer?: string;
  sourceKind?: NonNullable<Entity['lineage']>['sourceKind'];
  authority?: NonNullable<Entity['lineage']>['authority'];
  phase?: NonNullable<Entity['lineage']>['phase'];
  role?: NonNullable<Entity['lineage']>['role'];
  inheritedFrom?: string;
}

export interface DistanceDiscardEvidence {
  kind: 'discarded-distance';
  reasonCode: QueryReasonCode;
  targetName: string;
  targetKind: EntityKind;
  targetUri: string;
  targetContainer?: string;
  winnerDistance: number;
  candidateDistance: number;
}

export interface ContextDiscardEvidence {
  kind: 'discarded-context';
  stage: 'qualifier';
  reason: 'qualifier-unresolved' | 'qualifier-no-match';
  qualifier: string;
  resolvedType?: string;
}

export interface DistanceAmbiguityEvidence {
  kind: 'distance-ambiguity';
  reasonCode: QueryReasonCode;
  winnerDistance: number;
  candidateCount: number;
}

export type QueryEvidenceEntry = QueryEvidence | DistanceDiscardEvidence | ContextDiscardEvidence | DistanceAmbiguityEvidence;

export interface QueryCandidate {
  kind: 'candidate';
  reasonCode: QueryReasonCode;
  targetName: string;
  targetKind: EntityKind;
  targetUri: string;
  targetContainer?: string;
}

export interface ResolvedTargetInfo {
  context: InvocationContext;
  targets: Entity[];
  reasonCodes: QueryReasonCode[];
  winnerLineage: ResolvedWinnerLineage | null;
  confidence: QueryResolutionConfidence;
  evidence: QueryEvidenceEntry[];
  candidatePool: QueryCandidate[];
  trace: TraceStep[];
}

interface DistanceDiscard {
  entity: Entity;
  winnerDistance: number;
  candidateDistance: number;
}

interface RankedTargetsResult {
  winners: Entity[];
  discarded: DistanceDiscard[];
  ambiguity: { winnerDistance: number; candidateCount: number } | null;
}

export interface ResolveTargetOptions {
  line?: number;
  hotContext?: HotContextCache;
  traceLabel?: string;
}

function getDocumentEntities(
  currentUri: string,
  kb: KnowledgeBase,
  hotContext?: HotContextCache
): Entity[] {
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    const cached = hotContext.getActiveEntities();
    if (cached) {
      recordTraceStep('activeEntities:hit', { uri: currentUri, count: cached.length });
      return cached;
    }
  }

  const entities = kb.getEntitiesByUri(currentUri);
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    hotContext.setActiveEntities(entities);
    recordTraceStep('activeEntities:miss', { uri: currentUri, count: entities.length });
  }
  return entities;
}

function getMembersForType(
  typeName: string,
  currentUri: string,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  hotContext?: HotContextCache
): Entity[] {
  const cacheKey = typeName.toLowerCase();
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    const cached = hotContext.getInheritedMembers(cacheKey);
    if (cached) {
      recordTraceStep('members:hit', { typeName, count: cached.length });
      return cached;
    }
  }

  const members = graph.getMembers(typeName);
  if (hotContext && hotContext.getActiveUri() === currentUri && hotContext.getKbVersion() === kb.version) {
    hotContext.setInheritedMembers(cacheKey, members);
    recordTraceStep('members:miss', { typeName, count: members.length });
  }
  return members;
}

function deriveWinnerLineage(target: Entity | undefined, reasonCodes: QueryReasonCode[]): ResolvedWinnerLineage | null {
  if (!target || reasonCodes.length === 0) {
    return null;
  }

  const resolutionKind = reasonCodes[0];
  const base = target.lineage ?? {};
  const confidence = base.confidence ?? (resolutionKind === 'global-fallback'
    ? 'fallback'
    : resolutionKind === 'super-hierarchy'
      ? 'inherited'
      : 'direct');

  return {
    sourceKind: base.sourceKind ?? 'document',
    authority: base.authority ?? 'derived',
    ...(base.phase ? { phase: base.phase } : {}),
    ...(base.role ? { role: base.role } : {}),
    ...(base.inheritedFrom ? { inheritedFrom: base.inheritedFrom } : {}),
    confidence,
    resolutionKind
  };
}

function deriveResolutionConfidence(
  targets: Entity[],
  reasonCodes: QueryReasonCode[],
  winnerLineage: ResolvedWinnerLineage | null,
  contextDiscards: ContextDiscardEvidence[],
  ambiguity: RankedTargetsResult['ambiguity']
): QueryResolutionConfidence {
  if (targets.length === 0 || contextDiscards.length > 0) {
    return 'low';
  }

  if (ambiguity) {
    return 'medium';
  }

  if (winnerLineage?.confidence === 'fallback' || reasonCodes[0] === 'global-fallback') {
    return 'low';
  }

  if (winnerLineage?.confidence === 'inherited' || reasonCodes[0] === 'super-hierarchy') {
    return 'medium';
  }

  return 'high';
}

function buildWinnerEvidence(target: Entity | undefined, winnerLineage: ResolvedWinnerLineage | null): QueryEvidenceEntry[] {
  if (!target || !winnerLineage) {
    return [];
  }

  return [{
    kind: 'winner-target',
    reasonCode: winnerLineage.resolutionKind,
    confidence: winnerLineage.confidence,
    targetName: target.name,
    targetKind: target.kind,
    targetUri: target.uri,
    ...(target.containerName ? { targetContainer: target.containerName } : {}),
    ...(winnerLineage.sourceKind ? { sourceKind: winnerLineage.sourceKind } : {}),
    ...(winnerLineage.authority ? { authority: winnerLineage.authority } : {}),
    ...(winnerLineage.phase ? { phase: winnerLineage.phase } : {}),
    ...(winnerLineage.role ? { role: winnerLineage.role } : {}),
    ...(winnerLineage.inheritedFrom ? { inheritedFrom: winnerLineage.inheritedFrom } : {})
  }];
}

function buildDistanceDiscardEvidence(discarded: DistanceDiscard[], reasonCode: QueryReasonCode | undefined): QueryEvidenceEntry[] {
  if (!reasonCode || discarded.length === 0) {
    return [];
  }

  return discarded.map(({ entity, winnerDistance, candidateDistance }) => ({
    kind: 'discarded-distance',
    reasonCode,
    targetName: entity.name,
    targetKind: entity.kind,
    targetUri: entity.uri,
    ...(entity.containerName ? { targetContainer: entity.containerName } : {}),
    winnerDistance,
    candidateDistance
  }));
}

function buildDistanceAmbiguityEvidence(
  ambiguity: RankedTargetsResult['ambiguity'],
  reasonCode: QueryReasonCode | undefined
): QueryEvidenceEntry[] {
  if (!reasonCode || !ambiguity) {
    return [];
  }

  return [{
    kind: 'distance-ambiguity',
    reasonCode,
    winnerDistance: ambiguity.winnerDistance,
    candidateCount: ambiguity.candidateCount
  }];
}

function buildCandidatePool(candidates: Entity[], reasonCode: QueryReasonCode | undefined): QueryCandidate[] {
  if (!reasonCode || candidates.length === 0) {
    return [];
  }

  return candidates.map((candidate) => ({
    kind: 'candidate',
    reasonCode,
    targetName: candidate.name,
    targetKind: candidate.kind,
    targetUri: candidate.uri,
    ...(candidate.containerName ? { targetContainer: candidate.containerName } : {})
  }));
}

function rankTargetsByDistance(targets: Entity[], fromType: string, graph: InheritanceGraph): RankedTargetsResult {
  if (targets.length <= 1) {
    return { winners: targets, discarded: [], ambiguity: null };
  }

  const withDistance = targets.map((entity) => ({
    entity,
    distance: entity.containerName ? graph.getTypeDistance(fromType, entity.containerName) : Number.POSITIVE_INFINITY
  }));

  withDistance.sort((left, right) => left.distance - right.distance);
  const winnerDistance = withDistance[0].distance;
  const winners = withDistance.filter((entry) => entry.distance === winnerDistance).map((entry) => entry.entity);

  return {
    winners,
    discarded: withDistance
      .filter((entry) => entry.distance !== winnerDistance)
      .map((entry) => ({
        entity: entry.entity,
        winnerDistance,
        candidateDistance: entry.distance
      })),
    ambiguity: winners.length > 1
      ? { winnerDistance, candidateCount: winners.length }
      : null
  };
}

export function resolveTargetEntityDetailed(
  context: InvocationContext,
  currentDocumentUri: string,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  options: ResolveTargetOptions = {}
): ResolvedTargetInfo {
  const { result, trace } = withTrace(options.traceLabel ?? 'resolveTargetEntity', () => {
    const { identifier, qualifier } = context;
    const currentUri = normalizeUri(currentDocumentUri);
    recordTraceStep('resolve:start', { identifier, qualifier, line: options.line });

    const documentEntities = getDocumentEntities(currentUri, kb, options.hotContext);
    const currentMainObject = documentEntities.find(
      (entity) => entity.kind === EntityKind.Type
    );

    let possibleTargets: Entity[] = [];
    let reasonCodes: QueryReasonCode[] = [];
    let candidatePool: Entity[] = [];
    let distanceDiscards: DistanceDiscard[] = [];
    let contextDiscards: ContextDiscardEvidence[] = [];
    let distanceAmbiguity: RankedTargetsResult['ambiguity'] = null;

    if (qualifier) {
      const varType = resolveQualifierType(qualifier, currentUri, kb, options.line);
      recordTraceStep('qualifier:resolved', { qualifier, varType });
      if (varType) {
        if (varType.toLowerCase() === 'super' && currentMainObject?.baseTypeName) {
          const members = getMembersForType(currentMainObject.baseTypeName, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.baseTypeName, graph);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('super-hierarchy');
        } else if (varType.toLowerCase() === 'this' && currentMainObject) {
          const members = getMembersForType(currentMainObject.name, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.name, graph);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('member-hierarchy');
        } else {
          const members = getMembersForType(varType, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          const ranked = rankTargetsByDistance(candidatePool, varType, graph);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('qualifier-type');
        }
        if (candidatePool.length === 0) {
          contextDiscards.push({
            kind: 'discarded-context',
            stage: 'qualifier',
            reason: 'qualifier-no-match',
            qualifier,
            resolvedType: varType
          });
        }
      } else {
        contextDiscards.push({
          kind: 'discarded-context',
          stage: 'qualifier',
          reason: 'qualifier-unresolved',
          qualifier
        });
      }
    } else {
      if (options.line !== undefined) {
        const scope = kb.getScopeAt(currentUri, options.line);
        if (scope) {
          const localMatch = scope.symbols.find((symbol) => symbol.name.toLowerCase() === identifier.toLowerCase());
          if (localMatch) {
            recordTraceStep('targets:local-scope', { scope: scope.id });
            return {
              targets: [localMatch],
              reasonCodes: ['local-scope'] as QueryReasonCode[],
              candidatePool: [localMatch],
              distanceDiscards: [],
              contextDiscards: [],
              distanceAmbiguity: null
            };
          }
        }
      }

      if (currentMainObject) {
        const members = getMembersForType(currentMainObject.name, currentUri, kb, graph, options.hotContext);
        candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
        if (candidatePool.length > 0) {
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.name, graph);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          reasonCodes.push('member-hierarchy');
          recordTraceStep('targets:member-hierarchy', { count: possibleTargets.length });
        }
      }

      if (possibleTargets.length === 0) {
        possibleTargets = kb.findAllDefinitions(identifier);
        if (possibleTargets.length > 0) {
          candidatePool = [...possibleTargets];
          reasonCodes.push('global-fallback');
          recordTraceStep('targets:global-fallback', { count: possibleTargets.length });
        }
      }
    }

    return {
      targets: possibleTargets,
      reasonCodes,
      candidatePool,
      distanceDiscards,
      contextDiscards,
      distanceAmbiguity
    };
  });

  const winnerLineage = deriveWinnerLineage(result.targets[0], result.reasonCodes);
  const confidence = deriveResolutionConfidence(
    result.targets,
    result.reasonCodes,
    winnerLineage,
    result.contextDiscards,
    result.distanceAmbiguity
  );

  return {
    context,
    targets: result.targets,
    reasonCodes: result.reasonCodes,
    winnerLineage,
    confidence,
    evidence: [
      ...buildWinnerEvidence(result.targets[0], winnerLineage),
      ...buildDistanceDiscardEvidence(result.distanceDiscards, result.reasonCodes[0]),
      ...buildDistanceAmbiguityEvidence(result.distanceAmbiguity, result.reasonCodes[0]),
      ...result.contextDiscards
    ],
    candidatePool: buildCandidatePool(result.candidatePool, result.reasonCodes[0]),
    trace
  };
}

/**
 * Resuelve un contexto de invocación (identifier + qualifier) para encontrar
 * las entidades exactas a las que apunta.
 * Utiliza el InheritanceGraph para calcular herencia y overrides.
 */
export function resolveTargetEntity(
  context: InvocationContext,
  currentDocumentUri: string,
  kb: KnowledgeBase,
  graph: InheritanceGraph,
  line?: number
): Entity[] {
  return resolveTargetEntityDetailed(context, currentDocumentUri, kb, graph, { line }).targets;
}

/**
 * Ordena los targets encontrados por distancia en el árbol de herencia,
 * y devuelve solo los que están a la mínima distancia encontrada (el override más cercano).
 */
export function sortAndFilterByDistance(targets: Entity[], fromType: string, graph: InheritanceGraph): Entity[] {
  if (targets.length <= 1) return targets;

  const withDistance = targets.map(t => ({
    entity: t,
    distance: t.containerName ? graph.getTypeDistance(fromType, t.containerName) : Number.POSITIVE_INFINITY
  }));

  withDistance.sort((a, b) => a.distance - b.distance);

  const minDistance = withDistance[0].distance;
  return withDistance.filter(x => x.distance === minDistance).map(x => x.entity);
}

/**
 * Resuelve un cualificador a su tipo de dato base (e.g. 'super', 'this', o 'n_cst_math').
 * Devuelve 'super' o 'this' directamente si es el caso, para que el llamante maneje el contexto.
 */
export function resolveQualifierType(
  qualifier: string,
  currentDocumentUri: string,
  kb: KnowledgeBase,
  line?: number
): string | undefined {
  const qLower = qualifier.toLowerCase();
  if (qLower === 'super' || qLower === 'this') {
    return qLower;
  }

  const currentUri = normalizeUri(currentDocumentUri);
  let varType: string | undefined;

  if (line !== undefined) {
    const scope = kb.getScopeAt(currentUri, line);
    if (scope) {
      const local = scope.symbols.find(s => s.name.toLowerCase() === qLower);
      if (local) varType = local.datatype;
    }
  }

  if (!varType) {
    const documentEntities = kb.getEntitiesByUri(currentUri);
    const instanceVar = documentEntities.find(
      e => e.kind === EntityKind.Variable && e.name.toLowerCase() === qLower
    );
    if (instanceVar) varType = instanceVar.datatype;
  }

  if (varType) {
    return varType;
  }

  const typeTarget = kb.findDefinition(qLower);
  if (typeTarget && typeTarget.kind === EntityKind.Type) {
    return typeTarget.name;
  }

  return undefined;
}
