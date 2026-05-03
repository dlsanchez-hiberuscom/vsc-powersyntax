import { KnowledgeBase } from '../KnowledgeBase';
import { buildCallableImplementationKey, getCallableParameterCount, getCallableParameterTypes, isCallableEntity } from '../callSignature';
import { InheritanceGraph } from './InheritanceGraph';
import type { HotContextCache } from '../HotContextCache';
import type { InvocationContext } from '../../utils/invocationContext';
import { Entity, EntityKind, ScopeKind, type EntityLineageConfidence, type Scope } from '../types';
import { resolveSystemGlobal } from '../system/services/queryService';
import { compareSourceOriginPriority, type SourceOrigin } from '../../../shared/sourceOrigin';
import { normalizeUri } from '../../system/uriUtils';
import { annotateLastTraceResolution, recordTraceStep, type TraceStep, withTrace } from '../queryTrace';

export type QueryReasonCode =
  | 'local-scope'
  | 'member-hierarchy'
  | 'super-hierarchy'
  | 'parent-hierarchy'
  | 'ancestor-hierarchy'
  | 'qualifier-type'
  | 'global-fallback';

export type QueryInvocationKind =
  | 'local-symbol'
  | 'unqualified-call'
  | 'this-call'
  | 'parent-call'
  | 'super-call'
  | 'ancestor-call'
  | 'qualified-call'
  | 'qualified-static-call'
  | 'global-call'
  | 'dynamic-call'
  | 'external-call';

export type QueryInvocationRisk = 'safe' | 'inherited' | 'fallback' | 'dynamic' | 'external';

export type ResolvedWinnerLineage = NonNullable<Entity['lineage']> & {
  confidence: EntityLineageConfidence;
  resolutionKind: QueryReasonCode;
};

export type QueryResolutionConfidence = 'high' | 'medium' | 'low';
export type QueryAmbiguityKind = 'distance-minimum' | 'global-fallback';

export interface QueryEvidence {
  kind: 'winner-target';
  reasonCode: QueryReasonCode;
  confidence: EntityLineageConfidence;
  targetName: string;
  targetKind: EntityKind;
  targetUri: string;
  targetContainer?: string;
  sourceKind?: NonNullable<Entity['lineage']>['sourceKind'];
  sourceOrigin?: NonNullable<Entity['lineage']>['sourceOrigin'];
  authority?: NonNullable<Entity['lineage']>['authority'];
  phase?: NonNullable<Entity['lineage']>['phase'];
  role?: NonNullable<Entity['lineage']>['role'];
  inheritedFrom?: string;
}

const VARIABLE_SCOPE_PRIORITY = new Map<NonNullable<Entity['scope']>, number>([
  ['Local', 0],
  ['Compartida', 1],
  ['Global', 2],
  ['Instancia', 3],
  ['Argumento', 4],
]);

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

export interface SourceOriginConflictEvidence {
  kind: 'source-origin-conflict';
  reasonCode: QueryReasonCode;
  preferredOrigin: SourceOrigin;
  discardedOrigins: SourceOrigin[];
  candidateCount: number;
}

export interface FallbackAmbiguityEvidence {
  kind: 'fallback-ambiguity';
  reasonCode: 'global-fallback';
  candidateCount: number;
}

export interface SignatureDiscardEvidence {
  kind: 'discarded-signature';
  reasonCode: QueryReasonCode;
  reason: 'arity-mismatch' | 'type-mismatch' | 'prototype-shadowed';
  targetName: string;
  targetKind: EntityKind;
  targetUri: string;
  targetContainer?: string;
  invocationArgumentCount?: number;
  candidateParameterCount?: number;
  expectedParameterTypes?: string[];
  invocationArgumentTypes?: string[];
  signature?: string;
}

export type QueryEvidenceEntry = QueryEvidence | DistanceDiscardEvidence | ContextDiscardEvidence | DistanceAmbiguityEvidence | SourceOriginConflictEvidence | FallbackAmbiguityEvidence | SignatureDiscardEvidence;

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
  invocationKind: QueryInvocationKind;
  invocationRisk: QueryInvocationRisk;
  ambiguityKind?: QueryAmbiguityKind;
  resolvedQualifierType?: string;
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

interface SignatureDiscard {
  entity: Entity;
  reason: SignatureDiscardEvidence['reason'];
  invocationArgumentCount?: number;
  candidateParameterCount?: number;
  expectedParameterTypes?: string[];
  invocationArgumentTypes?: string[];
}

interface SignatureHardenResult {
  candidates: Entity[];
  discarded: SignatureDiscard[];
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

function findTypeEntityByName(documentEntities: ReadonlyArray<Entity>, typeName: string | undefined): Entity | undefined {
  if (!typeName) {
    return undefined;
  }

  const wanted = typeName.toLowerCase();
  return documentEntities.find(
    (entity) => entity.kind === EntityKind.Type && entity.name.toLowerCase() === wanted
  );
}

export function resolveCurrentObjectAtLine(
  currentUri: string,
  documentEntities: ReadonlyArray<Entity>,
  kb: KnowledgeBase,
  line?: number
): Entity | undefined {
  const typeEntities = documentEntities.filter((entity) => entity.kind === EntityKind.Type);
  const rootType = typeEntities.find((entity) => !entity.containerName) ?? typeEntities[0];

  if (line === undefined) {
    return rootType;
  }

  const scope = kb.getScopeAt(currentUri, line);
  let cursor: Scope | undefined = scope ?? undefined;
  while (cursor) {
    if (cursor.kind === ScopeKind.Type) {
      const matched = findTypeEntityByName(typeEntities, cursor.id);
      if (matched) {
        return matched;
      }
    }
    cursor = cursor.parent;
  }

  const nearestType = [...typeEntities]
    .filter((entity) => entity.line <= line)
    .sort((left, right) => right.line - left.line)[0];

  return nearestType ?? rootType;
}

function deriveWinnerLineage(target: Entity | undefined, reasonCodes: QueryReasonCode[]): ResolvedWinnerLineage | null {
  if (!target || reasonCodes.length === 0) {
    return null;
  }

  const resolutionKind = reasonCodes[0];
  const base = target.lineage ?? {};
  const confidence = base.confidence ?? (resolutionKind === 'global-fallback'
    ? 'fallback'
    : resolutionKind === 'super-hierarchy' || resolutionKind === 'ancestor-hierarchy'
      ? 'inherited'
      : 'direct');

  return {
    sourceKind: base.sourceKind ?? 'document',
    ...(base.sourceOrigin ? { sourceOrigin: base.sourceOrigin } : {}),
    authority: base.authority ?? 'derived',
    ...(base.phase ? { phase: base.phase } : {}),
    ...(base.role ? { role: base.role } : {}),
    ...(base.inheritedFrom ? { inheritedFrom: base.inheritedFrom } : {}),
    confidence,
    resolutionKind
  };
}

function deriveInvocationKind(
  context: InvocationContext,
  reasonCodes: QueryReasonCode[],
  target: Entity | undefined,
  contextDiscards: ContextDiscardEvidence[]
): QueryInvocationKind {
  const qualifierLower = context.qualifier?.toLowerCase();

  if (target?.isExternal) {
    return 'external-call';
  }

  if (contextDiscards.length > 0) {
    return 'dynamic-call';
  }

  if (reasonCodes[0] === 'local-scope') {
    return 'local-symbol';
  }

  if (!context.qualifier) {
    return reasonCodes[0] === 'global-fallback' ? 'global-call' : 'unqualified-call';
  }

  if (qualifierLower === 'this') {
    return 'this-call';
  }

  if (qualifierLower === 'parent') {
    return 'parent-call';
  }

  if (qualifierLower === 'super') {
    return 'super-call';
  }

  if (qualifierLower === 'ancestor') {
    return 'ancestor-call';
  }

  return context.separator === '::' ? 'qualified-static-call' : 'qualified-call';
}

function deriveInvocationRisk(
  context: InvocationContext,
  reasonCodes: QueryReasonCode[],
  target: Entity | undefined,
  contextDiscards: ContextDiscardEvidence[]
): QueryInvocationRisk {
  if (target?.isExternal) {
    return 'external';
  }

  if (!target) {
    return context.qualifier ? 'dynamic' : 'fallback';
  }

  if (contextDiscards.length > 0) {
    return 'dynamic';
  }

  if (reasonCodes[0] === 'global-fallback') {
    return 'fallback';
  }

  if (reasonCodes[0] === 'super-hierarchy' || reasonCodes[0] === 'ancestor-hierarchy') {
    return 'inherited';
  }

  return 'safe';
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

  if (
    winnerLineage?.confidence === 'inherited'
    || reasonCodes[0] === 'super-hierarchy'
    || reasonCodes[0] === 'ancestor-hierarchy'
  ) {
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
    ...(winnerLineage.sourceOrigin ? { sourceOrigin: winnerLineage.sourceOrigin } : {}),
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

function getDistinctSourceOrigins(entities: ReadonlyArray<Entity>): SourceOrigin[] {
  return [...new Set(entities.map((entity) => getEntitySourceOrigin(entity)))].sort((left, right) => compareSourceOriginPriority(left, right));
}

function buildSourceOriginConflictEvidence(
  candidates: Entity[],
  winners: Entity[],
  reasonCode: QueryReasonCode | undefined
): QueryEvidenceEntry[] {
  if (!reasonCode || candidates.length === 0 || winners.length === 0) {
    return [];
  }

  const candidateOrigins = getDistinctSourceOrigins(candidates);
  const winnerOrigins = getDistinctSourceOrigins(winners);
  if (candidateOrigins.length <= 1 || winnerOrigins.length !== 1) {
    return [];
  }

  const preferredOrigin = winnerOrigins[0]!;
  const discardedOrigins = candidateOrigins.filter((origin) => origin !== preferredOrigin);
  if (discardedOrigins.length === 0) {
    return [];
  }

  return [{
    kind: 'source-origin-conflict',
    reasonCode,
    preferredOrigin,
    discardedOrigins,
    candidateCount: candidates.length
  }];
}

function buildFallbackAmbiguityEvidence(
  winners: Entity[],
  reasonCode: QueryReasonCode | undefined
): QueryEvidenceEntry[] {
  if (reasonCode !== 'global-fallback' || winners.length <= 1) {
    return [];
  }

  return [{
    kind: 'fallback-ambiguity',
    reasonCode,
    candidateCount: winners.length
  }];
}

function buildSignatureDiscardEvidence(
  discarded: SignatureDiscard[],
  reasonCode: QueryReasonCode | undefined
): QueryEvidenceEntry[] {
  if (!reasonCode || discarded.length === 0) {
    return [];
  }

  return discarded.map(({ entity, reason, invocationArgumentCount, candidateParameterCount, expectedParameterTypes, invocationArgumentTypes }) => ({
    kind: 'discarded-signature',
    reasonCode,
    reason,
    targetName: entity.name,
    targetKind: entity.kind,
    targetUri: entity.uri,
    ...(entity.containerName ? { targetContainer: entity.containerName } : {}),
    ...(invocationArgumentCount !== undefined ? { invocationArgumentCount } : {}),
    ...(candidateParameterCount !== undefined ? { candidateParameterCount } : {}),
    ...(expectedParameterTypes && expectedParameterTypes.length > 0 ? { expectedParameterTypes } : {}),
    ...(invocationArgumentTypes && invocationArgumentTypes.length > 0 ? { invocationArgumentTypes } : {}),
    ...(entity.signatureLabel ?? entity.signature ? { signature: entity.signatureLabel ?? entity.signature } : {})
  }));
}

function normalizeComparableType(typeName: string | undefined): string {
  const normalized = (typeName ?? '').trim().toLowerCase();
  switch (normalized) {
    case 'int': return 'integer';
    case 'dec': return 'decimal';
    case 'bool': return 'boolean';
    default: return normalized;
  }
}

function isNumericType(typeName: string): boolean {
  return new Set(['integer', 'long', 'longlong', 'decimal', 'double', 'real', 'number']).has(typeName);
}

function areArgumentTypesCompatible(expectedType: string, actualType: string): boolean {
  const expected = normalizeComparableType(expectedType);
  const actual = normalizeComparableType(actualType);
  if (!expected || !actual || actual === 'unknown') {
    return true;
  }
  if (expected === actual) {
    return true;
  }
  return isNumericType(expected) && isNumericType(actual);
}

function matchesInvocationArgumentTypes(candidate: Entity, argumentTypes: readonly string[] | undefined): boolean {
  if (!argumentTypes || argumentTypes.length === 0 || argumentTypes.every((typeName) => typeName === 'unknown')) {
    return true;
  }
  const parameterTypes = getCallableParameterTypes(candidate);
  if (parameterTypes.length !== argumentTypes.length) {
    return false;
  }
  return parameterTypes.every((parameterType, index) => areArgumentTypesCompatible(parameterType, argumentTypes[index]));
}

function isPrototypeEntity(entity: Entity): boolean {
  return entity.isPrototype === true
    || entity.lineage?.phase === 'prototype'
    || entity.lineage?.role === 'prototype';
}

function deriveAmbiguityKind(
  targets: Entity[],
  reasonCodes: QueryReasonCode[],
  ambiguity: RankedTargetsResult['ambiguity']
): QueryAmbiguityKind | undefined {
  if (ambiguity) {
    return 'distance-minimum';
  }

  if (reasonCodes[0] === 'global-fallback' && targets.length > 1) {
    return 'global-fallback';
  }

  return undefined;
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

function getEntitySourceOrigin(entity: Entity): NonNullable<NonNullable<Entity['lineage']>['sourceOrigin']> | 'unknown' {
  return entity.lineage?.sourceOrigin ?? 'unknown';
}

function compareEntitiesBySourcePriority(left: Entity, right: Entity): number {
  const sourcePriority = compareSourceOriginPriority(getEntitySourceOrigin(left), getEntitySourceOrigin(right));
  if (sourcePriority !== 0) {
    return sourcePriority;
  }

  if (left.kind === EntityKind.Variable && right.kind === EntityKind.Variable) {
    const leftPriority = VARIABLE_SCOPE_PRIORITY.get(left.scope ?? 'Instancia') ?? Number.MAX_SAFE_INTEGER;
    const rightPriority = VARIABLE_SCOPE_PRIORITY.get(right.scope ?? 'Instancia') ?? Number.MAX_SAFE_INTEGER;
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }
  }

  const uriOrder = left.uri.localeCompare(right.uri);
  if (uriOrder !== 0) {
    return uriOrder;
  }

  const lineOrder = left.line - right.line;
  if (lineOrder !== 0) {
    return lineOrder;
  }

  return left.character - right.character;
}

function preferTargetsBySourceOrigin(targets: Entity[], currentUri?: string): Entity[] {
  if (targets.length <= 1) {
    return targets;
  }

  const normalizedCurrentUri = currentUri ? normalizeUri(currentUri) : undefined;
  const sameDocumentTargets = normalizedCurrentUri
    ? targets.filter((target) => normalizeUri(target.uri) === normalizedCurrentUri)
    : [];
  const preferredTargets = sameDocumentTargets.length > 0 ? sameDocumentTargets : targets;

  const sorted = [...preferredTargets].sort(compareEntitiesBySourcePriority);
  const preferredOrigin = getEntitySourceOrigin(sorted[0]!);
  return sorted.filter((target) => compareSourceOriginPriority(getEntitySourceOrigin(target), preferredOrigin) === 0);
}

function rankTargetsByDistance(targets: Entity[], fromType: string, graph: InheritanceGraph, currentUri?: string): RankedTargetsResult {
  if (targets.length <= 1) {
    return { winners: targets, discarded: [], ambiguity: null };
  }

  const withDistance = targets.map((entity) => ({
    entity,
    distance: entity.containerName ? graph.getTypeDistance(fromType, entity.containerName) : Number.POSITIVE_INFINITY
  }));

  withDistance.sort((left, right) => left.distance - right.distance);
  const winnerDistance = withDistance[0].distance;
  const winners = preferTargetsBySourceOrigin(
    withDistance.filter((entry) => entry.distance === winnerDistance).map((entry) => entry.entity),
    currentUri
  );

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

function hardenCallableCandidates(candidates: Entity[], context: InvocationContext): SignatureHardenResult {
  if (candidates.length <= 1 && context.argumentCount === undefined) {
    return { candidates, discarded: [] };
  }

  let current = candidates;
  const discarded: SignatureDiscard[] = [];
  const callableCandidates = current.filter(isCallableEntity);

  if (context.argumentCount !== undefined && callableCandidates.length > 0) {
    const arityMatches = callableCandidates.filter((candidate) => getCallableParameterCount(candidate) === context.argumentCount);
    if (arityMatches.length > 0) {
      const arityMatchSet = new Set(arityMatches);
      for (const candidate of callableCandidates) {
        if (!arityMatchSet.has(candidate)) {
          discarded.push({
            entity: candidate,
            reason: 'arity-mismatch',
            invocationArgumentCount: context.argumentCount,
            candidateParameterCount: getCallableParameterCount(candidate)
          });
        }
      }
      current = current.filter((candidate) => !isCallableEntity(candidate) || arityMatchSet.has(candidate));
    }
  }

  const callableArityMatches = current.filter(isCallableEntity);
  if (context.argumentTypes && callableArityMatches.length > 1) {
    const typeMatches = callableArityMatches.filter((candidate) => matchesInvocationArgumentTypes(candidate, context.argumentTypes));
    if (typeMatches.length > 0 && typeMatches.length < callableArityMatches.length) {
      const typeMatchSet = new Set(typeMatches);
      for (const candidate of callableArityMatches) {
        if (!typeMatchSet.has(candidate)) {
          discarded.push({
            entity: candidate,
            reason: 'type-mismatch',
            invocationArgumentCount: context.argumentCount,
            candidateParameterCount: getCallableParameterCount(candidate),
            expectedParameterTypes: getCallableParameterTypes(candidate),
            invocationArgumentTypes: [...context.argumentTypes]
          });
        }
      }
      current = current.filter((candidate) => !isCallableEntity(candidate) || typeMatchSet.has(candidate));
    }
  }

  const implementationKeys = new Set(
    current
      .filter((candidate) => isCallableEntity(candidate) && !isPrototypeEntity(candidate))
      .map(buildCallableImplementationKey)
  );

  if (implementationKeys.size > 0) {
    const next: Entity[] = [];
    for (const candidate of current) {
      if (isPrototypeEntity(candidate) && implementationKeys.has(buildCallableImplementationKey(candidate))) {
        discarded.push({
          entity: candidate,
          reason: 'prototype-shadowed',
          candidateParameterCount: getCallableParameterCount(candidate)
        });
        continue;
      }
      next.push(candidate);
    }
    current = next;
  }

  return { candidates: current, discarded };
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
    recordTraceStep('resolve:start', { identifier, qualifier, separator: context.separator, line: options.line });

    const documentEntities = getDocumentEntities(currentUri, kb, options.hotContext);
    const currentMainObject = resolveCurrentObjectAtLine(currentUri, documentEntities, kb, options.line);
    recordTraceStep('scope:current-object', { currentObject: currentMainObject?.name, owner: currentMainObject?.containerName, baseTypeName: currentMainObject?.baseTypeName });

    let possibleTargets: Entity[] = [];
    let reasonCodes: QueryReasonCode[] = [];
    let candidatePool: Entity[] = [];
    let distanceDiscards: DistanceDiscard[] = [];
    let signatureDiscards: SignatureDiscard[] = [];
    let contextDiscards: ContextDiscardEvidence[] = [];
    let distanceAmbiguity: RankedTargetsResult['ambiguity'] = null;
    let resolvedQualifierType: string | undefined;

    if (qualifier) {
      const qualifierLower = qualifier.toLowerCase();
      resolvedQualifierType = resolveQualifierType(qualifier, currentUri, kb, options.line, currentMainObject);
      recordTraceStep('qualifier:resolved', {
        qualifier,
        separator: context.separator,
        resolvedQualifierType,
        currentObject: currentMainObject?.name
      });
      if (resolvedQualifierType) {
        if (qualifierLower === 'super' && currentMainObject?.baseTypeName) {
          const members = getMembersForType(currentMainObject.baseTypeName, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.baseTypeName, graph, currentUri);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('super-hierarchy');
        } else if (qualifierLower === 'ancestor' && currentMainObject?.baseTypeName) {
          const members = getMembersForType(currentMainObject.baseTypeName, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.baseTypeName, graph, currentUri);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('ancestor-hierarchy');
        } else if (qualifierLower === 'parent' && currentMainObject?.containerName) {
          const members = getMembersForType(currentMainObject.containerName, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.containerName, graph, currentUri);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('parent-hierarchy');
        } else if (qualifierLower === 'this' && currentMainObject) {
          const members = getMembersForType(currentMainObject.name, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.name, graph, currentUri);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('member-hierarchy');
        } else {
          const members = getMembersForType(resolvedQualifierType, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, resolvedQualifierType, graph, currentUri);
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
            resolvedType: resolvedQualifierType
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
            recordTraceStep('invocation:classified', { invocationKind: 'local-symbol', invocationRisk: 'safe' });
            return {
              targets: [localMatch],
              reasonCodes: ['local-scope'] as QueryReasonCode[],
              invocationKind: 'local-symbol' as QueryInvocationKind,
              invocationRisk: 'safe' as QueryInvocationRisk,
              candidatePool: [localMatch],
              distanceDiscards: [],
              signatureDiscards: [],
              contextDiscards: [],
              distanceAmbiguity: null,
              resolvedQualifierType: undefined
            };
          }
        }
      }

      if (currentMainObject) {
        const members = getMembersForType(currentMainObject.name, currentUri, kb, graph, options.hotContext);
        candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
        if (candidatePool.length > 0) {
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.name, graph, currentUri);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          reasonCodes.push('member-hierarchy');
          recordTraceStep('targets:member-hierarchy', { count: possibleTargets.length });
        }
      }

      if (possibleTargets.length === 0) {
        candidatePool = kb.findAllDefinitions(identifier);
        const hardened = hardenCallableCandidates(candidatePool, context);
        candidatePool = hardened.candidates;
        signatureDiscards.push(...hardened.discarded);
        possibleTargets = preferTargetsBySourceOrigin(candidatePool, currentUri);
        if (possibleTargets.length > 0) {
          reasonCodes.push('global-fallback');
          recordTraceStep('targets:global-fallback', {
            count: possibleTargets.length,
            candidateCount: candidatePool.length
          });
        }
      }
    }

    const invocationKind = deriveInvocationKind(context, reasonCodes, possibleTargets[0], contextDiscards);
    const invocationRisk = deriveInvocationRisk(context, reasonCodes, possibleTargets[0], contextDiscards);
    recordTraceStep('invocation:classified', {
      invocationKind,
      invocationRisk,
      resolvedQualifierType
    });

    return {
      targets: possibleTargets,
      reasonCodes,
      invocationKind,
      invocationRisk,
      resolvedQualifierType,
      candidatePool,
      distanceDiscards,
      signatureDiscards,
      contextDiscards,
      distanceAmbiguity
    };
  });

  const winnerLineage = deriveWinnerLineage(result.targets[0], result.reasonCodes);
  const ambiguityKind = deriveAmbiguityKind(result.targets, result.reasonCodes, result.distanceAmbiguity);
  const confidence = deriveResolutionConfidence(
    result.targets,
    result.reasonCodes,
    winnerLineage,
    result.contextDiscards,
    result.distanceAmbiguity
  );
  const evidence = [
    ...buildWinnerEvidence(result.targets[0], winnerLineage),
    ...buildDistanceDiscardEvidence(result.distanceDiscards, result.reasonCodes[0]),
    ...buildSignatureDiscardEvidence(result.signatureDiscards, result.reasonCodes[0]),
    ...buildDistanceAmbiguityEvidence(result.distanceAmbiguity, result.reasonCodes[0]),
    ...buildFallbackAmbiguityEvidence(result.targets, result.reasonCodes[0]),
    ...buildSourceOriginConflictEvidence(result.candidatePool, result.targets, result.reasonCodes[0]),
    ...result.contextDiscards
  ];

  annotateLastTraceResolution({
    confidence,
    ...(result.reasonCodes[0] ? { primaryReasonCode: result.reasonCodes[0] } : {}),
    invocationKind: result.invocationKind,
    invocationRisk: result.invocationRisk,
    evidenceKinds: evidence.map((entry) => entry.kind),
    targetCount: result.targets.length,
    hasAmbiguity: result.targets.length > 1
  });

  return {
    context,
    targets: result.targets,
    reasonCodes: result.reasonCodes,
    invocationKind: result.invocationKind,
    invocationRisk: result.invocationRisk,
    ...(ambiguityKind ? { ambiguityKind } : {}),
    ...(result.resolvedQualifierType ? { resolvedQualifierType: result.resolvedQualifierType } : {}),
    winnerLineage,
    confidence,
    evidence,
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
 * Devuelve keywords contextuales (`super`, `this`, `ancestor`) o el tipo
 * resultante si puede resolverse de forma estática.
 */
export function resolveQualifierType(
  qualifier: string,
  currentDocumentUri: string,
  kb: KnowledgeBase,
  line?: number,
  currentObject?: Entity
): string | undefined {
  const qLower = qualifier.toLowerCase();

  if (qLower === 'super' || qLower === 'this' || qLower === 'ancestor') {
    return qLower;
  }

  if (qLower === 'parent') {
    return currentObject?.containerName;
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

  const systemGlobal = resolveSystemGlobal(qualifier);
  if (systemGlobal?.valueType) {
    return systemGlobal.valueType.toLowerCase();
  }

  const typeTarget = kb.findDefinition(qLower);
  if (typeTarget && typeTarget.kind === EntityKind.Type) {
    return typeTarget.name;
  }

  return undefined;
}
