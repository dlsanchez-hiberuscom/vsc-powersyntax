import { KnowledgeBase } from '../KnowledgeBase';
import { buildCallableImplementationKey, getCallableParameterCount, getCallableParameterTypes, isCallableEntity } from '../callSignature';
import { InheritanceGraph } from './InheritanceGraph';
import type { HotContextCache } from '../HotContextCache';
import type { InvocationContext } from '../../utils/invocationContext';
import { Entity, EntityKind, ScopeKind, type EntityLineageConfidence, type Scope } from '../types';
import { resolveSystemGlobal } from '../system/services/queryService';
import { compareSourceOriginPriority, type SourceOrigin } from '../../../shared/sourceOrigin';
import { normalizeUri } from '../../system/uriUtils';
import { isAccessibleFrom } from '../visibility';
import { annotateLastTraceResolution, appendLastTraceStep, getLastTrace, recordTraceStep, type TraceStep, withTrace } from '../queryTrace';

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

import { getVariableScopePriority } from '../scopePriority';

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

export interface SourceOriginAccessPolicy {
  allowStaging: boolean;
  allowGenerated: boolean;
  allowExternal: boolean;
}

export interface ResolveTargetOptions {
  line?: number;
  hotContext?: HotContextCache;
  traceLabel?: string;
  budgetMs?: number;
  sourceOriginPolicy?: SourceOriginAccessPolicy;
}

export function getDocumentEntities(
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

function preferThisQualifiedVariableCandidates(
  candidates: Entity[],
  currentObjectName: string,
  isCall: boolean
): Entity[] {
  if (isCall) {
    return candidates;
  }

  const normalizedOwner = currentObjectName.toLowerCase();
  const instanceCandidates = candidates.filter((candidate) =>
    candidate.kind === EntityKind.Variable
    && candidate.scope === 'Instancia'
    && (candidate.ownerName ?? candidate.containerName ?? '').toLowerCase() === normalizedOwner
  );

  return instanceCandidates.length > 0 ? instanceCandidates : candidates;
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

  const scope = kb.getScopeAtReadonly(currentUri, line);
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

function isSourceOriginAllowedByPolicy(
  sourceOrigin: ReturnType<typeof getEntitySourceOrigin>,
  policy: SourceOriginAccessPolicy | undefined
): boolean {
  if (!policy) {
    return true;
  }

  if (sourceOrigin === 'orca-staging') {
    return policy.allowStaging;
  }

  if (sourceOrigin === 'generated') {
    return policy.allowGenerated;
  }

  return true;
}

function isEntityAllowedBySourceOriginPolicy(entity: Entity, policy: SourceOriginAccessPolicy | undefined): boolean {
  if (!policy) {
    return true;
  }

  if (entity.isExternal && !policy.allowExternal) {
    return false;
  }

  return isSourceOriginAllowedByPolicy(getEntitySourceOrigin(entity), policy);
}

function filterEntitiesBySourceOriginPolicy(entities: Entity[], policy: SourceOriginAccessPolicy | undefined): Entity[] {
  if (!policy || entities.length === 0) {
    return entities;
  }

  return entities.filter((entity) => isEntityAllowedBySourceOriginPolicy(entity, policy));
}

function compareEntitiesBySourcePriority(left: Entity, right: Entity): number {
  const sourcePriority = compareSourceOriginPriority(getEntitySourceOrigin(left), getEntitySourceOrigin(right));
  if (sourcePriority !== 0) {
    return sourcePriority;
  }

  if (left.kind === EntityKind.Variable && right.kind === EntityKind.Variable) {
    const leftPriority = getVariableScopePriority(left.scope);
    const rightPriority = getVariableScopePriority(right.scope);
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

function preferTargetsBySourceOrigin(
  targets: Entity[],
  currentUri?: string,
  sourceOriginPolicy?: SourceOriginAccessPolicy
): Entity[] {
  const allowedTargets = filterEntitiesBySourceOriginPolicy(targets, sourceOriginPolicy);
  if (allowedTargets.length <= 1) {
    return allowedTargets;
  }

  const normalizedCurrentUri = currentUri ? normalizeUri(currentUri) : undefined;
  const sameDocumentTargets = normalizedCurrentUri
    ? allowedTargets.filter((target) => normalizeUri(target.uri) === normalizedCurrentUri)
    : [];
  const preferredTargets = sameDocumentTargets.length > 0 ? sameDocumentTargets : allowedTargets;

  const sorted = [...preferredTargets].sort(compareEntitiesBySourcePriority);
  const preferredOrigin = getEntitySourceOrigin(sorted[0]!);
  return sorted.filter((target) => compareSourceOriginPriority(getEntitySourceOrigin(target), preferredOrigin) === 0);
}

function rankTargetsByDistance(
  targets: Entity[],
  fromType: string,
  graph: InheritanceGraph,
  currentUri?: string,
  sourceOriginPolicy?: SourceOriginAccessPolicy
): RankedTargetsResult {
  const allowedTargets = filterEntitiesBySourceOriginPolicy(targets, sourceOriginPolicy);
  if (allowedTargets.length <= 1) {
    return { winners: allowedTargets, discarded: [], ambiguity: null };
  }

  const withDistance = allowedTargets.map((entity) => ({
    entity,
    distance: entity.containerName ? graph.getTypeDistance(fromType, entity.containerName) : Number.POSITIVE_INFINITY
  }));

  withDistance.sort((left, right) => left.distance - right.distance);
  const winnerDistance = withDistance[0].distance;
  const winners = preferTargetsBySourceOrigin(
    withDistance.filter((entry) => entry.distance === winnerDistance).map((entry) => entry.entity),
    currentUri,
    sourceOriginPolicy
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
      resolvedQualifierType = resolveQualifierType(qualifier, currentUri, kb, options.line, currentMainObject, options.hotContext);
      recordTraceStep('qualifier:resolved', {
        qualifier,
        separator: context.separator,
        resolvedQualifierType,
        currentObject: currentMainObject?.name
      });
      if (resolvedQualifierType) {
        if (qualifierLower === 'super' && currentMainObject?.baseTypeName) {
          const members = getMembersForType(currentMainObject.baseTypeName, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase())
            .filter(member => isAccessibleFrom(member, {
              contextOwner: currentMainObject.name,
              isDescendant: (child, ancestor) => graph.getTypeDistance(child, ancestor) !== Number.POSITIVE_INFINITY
            }));
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.baseTypeName, graph, currentUri, options.sourceOriginPolicy);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('super-hierarchy');
          recordTraceStep('targets:super-hierarchy', { count: possibleTargets.length });
        } else if (qualifierLower === 'ancestor' && currentMainObject?.baseTypeName) {
          const members = getMembersForType(currentMainObject.baseTypeName, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase())
            .filter(member => isAccessibleFrom(member, {
              contextOwner: currentMainObject.name,
              isDescendant: (child, ancestor) => graph.getTypeDistance(child, ancestor) !== Number.POSITIVE_INFINITY
            }));
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.baseTypeName, graph, currentUri, options.sourceOriginPolicy);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('ancestor-hierarchy');
          recordTraceStep('targets:ancestor-hierarchy', { count: possibleTargets.length });
        } else if (qualifierLower === 'this' && currentMainObject) {
          const members = getMembersForType(currentMainObject.name, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase());
          candidatePool = preferThisQualifiedVariableCandidates(
            candidatePool,
            currentMainObject.name,
            context.argumentCount !== undefined
          );
          // 'this' is always accessible, so no need to filter isAccessibleFrom(contextOwner: currentMainObject.name)
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.name, graph, currentUri, options.sourceOriginPolicy);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('member-hierarchy');
          recordTraceStep('targets:member-hierarchy', { count: possibleTargets.length });
        } else if (qualifierLower === 'parent' && currentMainObject?.containerName) {
          const members = getMembersForType(currentMainObject.containerName, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase())
            .filter(member => isAccessibleFrom(member, {
              contextOwner: currentMainObject.name,
              isDescendant: (child, ancestor) => graph.getTypeDistance(child, ancestor) !== Number.POSITIVE_INFINITY
            }));
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject.containerName, graph, currentUri, options.sourceOriginPolicy);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('parent-hierarchy');
          recordTraceStep('targets:parent-hierarchy', { count: possibleTargets.length });
        } else if (resolvedQualifierType) {
          const members = getMembersForType(resolvedQualifierType, currentUri, kb, graph, options.hotContext);
          candidatePool = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase())
            .filter(member => isAccessibleFrom(member, {
              contextOwner: currentMainObject?.name ?? null,
              isDescendant: (child, ancestor) => graph.getTypeDistance(child, ancestor) !== Number.POSITIVE_INFINITY
            }));
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, resolvedQualifierType, graph, currentUri, options.sourceOriginPolicy);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) reasonCodes.push('qualifier-type');
          recordTraceStep('targets:qualifier-type', { count: possibleTargets.length });
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
    } else if (context.separator === '::') {
      candidatePool = kb.findAllDefinitions(identifier).filter((e) => e.scope === 'Global' || e.kind !== EntityKind.Variable);
      const hardened = hardenCallableCandidates(candidatePool, context);
      candidatePool = hardened.candidates;
      signatureDiscards.push(...hardened.discarded);
      possibleTargets = preferTargetsBySourceOrigin(candidatePool, currentUri, options.sourceOriginPolicy);
      if (possibleTargets.length > 0) {
        reasonCodes.push('global-fallback');
        recordTraceStep('targets:global-fallback', {
          count: possibleTargets.length,
          candidateCount: candidatePool.length
        });
      }
    } else {
      if (options.line !== undefined) {
        const scope = kb.getScopeAtReadonly(currentUri, options.line);
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

      let instanceCandidates: Entity[] = [];
      if (currentMainObject) {
        const members = getMembersForType(currentMainObject.name, currentUri, kb, graph, options.hotContext);
        instanceCandidates = members.filter((member) => member.name.toLowerCase() === identifier.toLowerCase())
          .filter((member) =>
            isAccessibleFrom(member, {
              contextOwner: currentMainObject.name,
              isDescendant: (child, ancestor) => graph.getTypeDistance(child, ancestor) !== Number.POSITIVE_INFINITY
            })
          );
      }

      const globalCandidates = kb.findAllDefinitions(identifier);
      const isCall = context.argumentCount !== undefined;

      if (isCall) {
        if (instanceCandidates.length > 0) {
          candidatePool = instanceCandidates;
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject!.name, graph, currentUri, options.sourceOriginPolicy);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) {
            reasonCodes.push('member-hierarchy');
            recordTraceStep('targets:member-hierarchy', { count: possibleTargets.length });
          }
        }

        if (possibleTargets.length === 0 && globalCandidates.length > 0) {
          candidatePool = globalCandidates;
          const hardened = hardenCallableCandidates(candidatePool, context);
          candidatePool = hardened.candidates;
          signatureDiscards.push(...hardened.discarded);
          possibleTargets = preferTargetsBySourceOrigin(candidatePool, currentUri, options.sourceOriginPolicy);
          if (possibleTargets.length > 0) {
            reasonCodes.push('global-fallback');
            recordTraceStep('targets:global-fallback', {
              count: possibleTargets.length,
              candidateCount: candidatePool.length
            });
          }
        }
      } else {
        const sharedVars = globalCandidates.filter((e) => e.kind === EntityKind.Variable && e.scope === 'Compartida');
        const globalVars = globalCandidates.filter((e) => e.kind === EntityKind.Variable && e.scope === 'Global');
        const instanceVars = instanceCandidates.filter((e) => e.kind === EntityKind.Variable);

        if (sharedVars.length > 0) {
          candidatePool = sharedVars;
          possibleTargets = preferTargetsBySourceOrigin(candidatePool, currentUri, options.sourceOriginPolicy);
          if (possibleTargets.length > 0) {
            reasonCodes.push('global-fallback');
            recordTraceStep('targets:global-fallback', { count: possibleTargets.length });
          }
        } else if (globalVars.length > 0) {
          candidatePool = globalVars;
          possibleTargets = preferTargetsBySourceOrigin(candidatePool, currentUri, options.sourceOriginPolicy);
          if (possibleTargets.length > 0) {
            reasonCodes.push('global-fallback');
            recordTraceStep('targets:global-fallback', { count: possibleTargets.length });
          }
        } else if (instanceVars.length > 0) {
          candidatePool = instanceVars;
          const ranked = rankTargetsByDistance(candidatePool, currentMainObject!.name, graph, currentUri, options.sourceOriginPolicy);
          possibleTargets = ranked.winners;
          distanceDiscards = ranked.discarded;
          distanceAmbiguity = ranked.ambiguity;
          if (possibleTargets.length > 0) {
            reasonCodes.push('member-hierarchy');
            recordTraceStep('targets:member-hierarchy', { count: possibleTargets.length });
          }
        } else {
          if (instanceCandidates.length > 0) {
            candidatePool = instanceCandidates;
            const hardened = hardenCallableCandidates(candidatePool, context);
            candidatePool = hardened.candidates;
            signatureDiscards.push(...hardened.discarded);
            const ranked = rankTargetsByDistance(candidatePool, currentMainObject!.name, graph, currentUri, options.sourceOriginPolicy);
            possibleTargets = ranked.winners;
            distanceDiscards = ranked.discarded;
            distanceAmbiguity = ranked.ambiguity;
            if (possibleTargets.length > 0) {
              reasonCodes.push('member-hierarchy');
              recordTraceStep('targets:member-hierarchy', { count: possibleTargets.length });
            }
          }
          if (possibleTargets.length === 0 && globalCandidates.length > 0) {
            candidatePool = globalCandidates;
            const hardened = hardenCallableCandidates(candidatePool, context);
            candidatePool = hardened.candidates;
            signatureDiscards.push(...hardened.discarded);
            possibleTargets = preferTargetsBySourceOrigin(candidatePool, currentUri, options.sourceOriginPolicy);
            if (possibleTargets.length > 0) {
              reasonCodes.push('global-fallback');
              recordTraceStep('targets:global-fallback', { count: possibleTargets.length });
            }
          }
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

  const visibleTargets = filterEntitiesBySourceOriginPolicy(result.targets, options.sourceOriginPolicy);
  const visibleCandidatePool = filterEntitiesBySourceOriginPolicy(result.candidatePool, options.sourceOriginPolicy);
  const visibleDistanceDiscards = result.distanceDiscards.filter(({ entity }) => isEntityAllowedBySourceOriginPolicy(entity, options.sourceOriginPolicy));
  const visibleSignatureDiscards = result.signatureDiscards.filter(({ entity }) => isEntityAllowedBySourceOriginPolicy(entity, options.sourceOriginPolicy));
  const visibleDistanceAmbiguity = visibleTargets.length > 1 ? result.distanceAmbiguity : null;
  const invocationKind = deriveInvocationKind(context, result.reasonCodes, visibleTargets[0], result.contextDiscards);
  const invocationRisk = deriveInvocationRisk(context, result.reasonCodes, visibleTargets[0], result.contextDiscards);
  const winnerLineage = deriveWinnerLineage(visibleTargets[0], result.reasonCodes);
  const ambiguityKind = deriveAmbiguityKind(visibleTargets, result.reasonCodes, visibleDistanceAmbiguity);
  const confidence = deriveResolutionConfidence(
    visibleTargets,
    result.reasonCodes,
    winnerLineage,
    result.contextDiscards,
    visibleDistanceAmbiguity
  );
  const evidence = [
    ...buildWinnerEvidence(visibleTargets[0], winnerLineage),
    ...buildDistanceDiscardEvidence(visibleDistanceDiscards, result.reasonCodes[0]),
    ...buildSignatureDiscardEvidence(visibleSignatureDiscards, result.reasonCodes[0]),
    ...buildDistanceAmbiguityEvidence(visibleDistanceAmbiguity, result.reasonCodes[0]),
    ...buildFallbackAmbiguityEvidence(visibleTargets, result.reasonCodes[0]),
    ...buildSourceOriginConflictEvidence(visibleCandidatePool, visibleTargets, result.reasonCodes[0]),
    ...result.contextDiscards
  ];

  annotateLastTraceResolution({
    confidence,
    ...(result.reasonCodes[0] ? { primaryReasonCode: result.reasonCodes[0] } : {}),
    invocationKind,
    invocationRisk,
    evidenceKinds: evidence.map((entry) => entry.kind),
    targetCount: visibleTargets.length,
    hasAmbiguity: visibleTargets.length > 1
  });

  let finalTrace = trace;
  const lastTrace = getLastTrace();
  if (options.budgetMs !== undefined && lastTrace && lastTrace.durationMs > options.budgetMs) {
    const detail = {
      budgetMs: options.budgetMs,
      durationMs: lastTrace.durationMs,
      exceededByMs: lastTrace.durationMs - options.budgetMs
    };
    appendLastTraceStep('budget:exceeded', detail);
    finalTrace = [
      ...trace,
      {
        name: 'budget:exceeded',
        phase: 'budget',
        action: 'exceeded',
        detail,
        ts: Date.now()
      }
    ];
  }

  return {
    context,
    targets: visibleTargets,
    reasonCodes: result.reasonCodes,
    invocationKind,
    invocationRisk,
    ...(ambiguityKind ? { ambiguityKind } : {}),
    ...(result.resolvedQualifierType ? { resolvedQualifierType: result.resolvedQualifierType } : {}),
    winnerLineage,
    confidence,
    evidence,
    candidatePool: buildCandidatePool(visibleCandidatePool, result.reasonCodes[0]),
    trace: finalTrace
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
  currentObject?: Entity,
  hotContext?: HotContextCache
): string | undefined {
  const qLower = qualifier.toLowerCase();

  if (qLower === 'super' || qLower === 'this' || qLower === 'ancestor') {
    return qLower;
  }

  if (qLower === 'parent') {
    return currentObject?.kind === EntityKind.Type ? currentObject.containerName : undefined;
  }

  const currentUri = normalizeUri(currentDocumentUri);
  let varType: string | undefined;

  if (line !== undefined) {
    const scope = kb.getScopeAtReadonly(currentUri, line);
    if (scope) {
      const local = scope.symbols.find(s => s.name.toLowerCase() === qLower);
      if (local) varType = local.datatype;
    }
  }

  if (!varType) {
    const documentEntities = getDocumentEntities(currentUri, kb, hotContext);
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

  const typeTarget = kb.findDefinitionReadonly(qLower);
  if (typeTarget && typeTarget.kind === EntityKind.Type) {
    return typeTarget.name;
  }

  return undefined;
}
