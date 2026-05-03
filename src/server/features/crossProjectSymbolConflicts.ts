import {
  type ApiCrossProjectSymbolConflict,
  type ApiCrossProjectSymbolConflictCandidate,
  type ApiCrossProjectSymbolConflicts,
  type ApiCrossProjectSymbolConflictsRequest,
} from '../../shared/publicApi';
import { compareSourceOriginPriority, type SourceOrigin } from '../../shared/sourceOrigin';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { buildSymbolKey } from '../knowledge/symbolKey';
import { Entity, EntityKind } from '../knowledge/types';
import { normalizeUri } from '../system/uriUtils';
import type { WorkspaceState } from '../workspace/workspaceState';

const CONFLICT_SCHEMA_VERSION = '1.0.0';
const DEFAULT_MAX_CONFLICTS = 24;
const DEFAULT_MAX_CANDIDATES_PER_CONFLICT = 8;

type ConflictScope = ApiCrossProjectSymbolConflict['scope'];
type CandidateWithContext = {
  entity: Entity;
  projectUri?: string;
  projectName?: string;
  library?: string;
  sourceOrigin: SourceOrigin | 'unknown';
  locationKey: string;
};

function clamp(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(value));
}

function createUnavailableConflicts(reason: string): ApiCrossProjectSymbolConflicts {
  return {
    schemaVersion: CONFLICT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    available: false,
    reason,
    summary: {
      totalConflictCount: 0,
      returnedConflictCount: 0,
      totalCandidateCount: 0,
      crossProjectConflictCount: 0,
      crossLibraryConflictCount: 0,
      truncated: false,
    },
    conflicts: [],
  };
}

function normalizeSymbolName(value: string | undefined): string | undefined {
  const trimmed = value?.trim().toLowerCase();
  return trimmed ? trimmed : undefined;
}

function getEntitySourceOrigin(entity: Entity, workspaceState: WorkspaceState): SourceOrigin | 'unknown' {
  return entity.lineage?.sourceOrigin ?? workspaceState.getSourceOrigin(entity.uri) ?? 'unknown';
}

function getEntityOwnerName(entity: Entity): string | undefined {
  return entity.ownerName ?? entity.containerName;
}

function getPhasePriority(entity: Entity): number {
  if (entity.lineage?.phase === 'implementation' || entity.lineage?.role === 'implementation' || entity.lineage?.role === 'override') {
    return 0;
  }
  if (entity.lineage?.phase === 'prototype' || entity.lineage?.role === 'prototype' || entity.isPrototype) {
    return 1;
  }
  if (entity.lineage?.phase === 'declaration') {
    return 2;
  }
  return 3;
}

function compareLocationCandidates(left: CandidateWithContext, right: CandidateWithContext): number {
  const sourceOriginOrder = compareSourceOriginPriority(left.sourceOrigin, right.sourceOrigin);
  if (sourceOriginOrder !== 0) {
    return sourceOriginOrder;
  }

  const phaseOrder = getPhasePriority(left.entity) - getPhasePriority(right.entity);
  if (phaseOrder !== 0) {
    return phaseOrder;
  }

  const uriOrder = left.entity.uri.localeCompare(right.entity.uri);
  if (uriOrder !== 0) {
    return uriOrder;
  }

  const lineOrder = left.entity.line - right.entity.line;
  if (lineOrder !== 0) {
    return lineOrder;
  }

  return left.entity.character - right.entity.character;
}

function comparePreferredCandidates(left: CandidateWithContext, right: CandidateWithContext): number {
  const sourceOriginOrder = compareSourceOriginPriority(left.sourceOrigin, right.sourceOrigin);
  if (sourceOriginOrder !== 0) {
    return sourceOriginOrder;
  }

  const leftProject = left.projectUri ?? '';
  const rightProject = right.projectUri ?? '';
  const projectOrder = leftProject.localeCompare(rightProject);
  if (projectOrder !== 0) {
    return projectOrder;
  }

  const leftLibrary = left.library ?? '';
  const rightLibrary = right.library ?? '';
  const libraryOrder = leftLibrary.localeCompare(rightLibrary);
  if (libraryOrder !== 0) {
    return libraryOrder;
  }

  const ownerOrder = (getEntityOwnerName(left.entity) ?? '').localeCompare(getEntityOwnerName(right.entity) ?? '');
  if (ownerOrder !== 0) {
    return ownerOrder;
  }

  const uriOrder = left.entity.uri.localeCompare(right.entity.uri);
  if (uriOrder !== 0) {
    return uriOrder;
  }

  const lineOrder = left.entity.line - right.entity.line;
  if (lineOrder !== 0) {
    return lineOrder;
  }

  return left.entity.character - right.entity.character;
}

function isConflictCandidate(entity: Entity): boolean {
  if (entity.declarationScope === 'local' || entity.declarationScope === 'parameter') {
    return false;
  }

  if (entity.scope === 'Local' || entity.scope === 'Argumento') {
    return false;
  }

  if (entity.kind === EntityKind.Variable && entity.scope !== 'Global' && entity.declarationScope !== 'member') {
    return false;
  }

  return true;
}

function buildLocationKey(entity: Entity, workspaceState: WorkspaceState): string {
  const projectContext = workspaceState.getProjectContextForFile(entity.uri);
  const projectUri = projectContext?.projectUri ? normalizeUri(projectContext.projectUri) : undefined;
  const library = workspaceState.resolveLibraryForFile(entity.uri, projectContext?.libraries)
    ?? workspaceState.resolveLibraryForFile(entity.uri);
  const normalizedLibrary = library ? normalizeUri(library) : undefined;

  if (projectUri || normalizedLibrary) {
    return [
      projectUri ? `project:${projectUri}` : 'project:',
      normalizedLibrary ? `library:${normalizedLibrary}` : 'library:',
    ].join('|');
  }

  return `uri:${normalizeUri(entity.uri)}`;
}

function toCandidateWithContext(entity: Entity, workspaceState: WorkspaceState): CandidateWithContext {
  const projectContext = workspaceState.getProjectContextForFile(entity.uri);
  const library = workspaceState.resolveLibraryForFile(entity.uri, projectContext?.libraries)
    ?? workspaceState.resolveLibraryForFile(entity.uri);

  return {
    entity,
    ...(projectContext?.projectUri ? { projectUri: normalizeUri(projectContext.projectUri) } : {}),
    ...(projectContext?.name ? { projectName: projectContext.name } : {}),
    ...(library ? { library: normalizeUri(library) } : {}),
    sourceOrigin: getEntitySourceOrigin(entity, workspaceState),
    locationKey: buildLocationKey(entity, workspaceState),
  };
}

function toApiCandidate(candidate: CandidateWithContext): ApiCrossProjectSymbolConflictCandidate {
  return {
    name: candidate.entity.name,
    kind: candidate.entity.kind,
    uri: candidate.entity.uri,
    line: candidate.entity.line,
    character: candidate.entity.character,
    ...(getEntityOwnerName(candidate.entity) ? { ownerName: getEntityOwnerName(candidate.entity) } : {}),
    ...(typeof candidate.entity.parameterCount === 'number' ? { parameterCount: candidate.entity.parameterCount } : {}),
    ...(candidate.entity.signature ? { signature: candidate.entity.signature } : {}),
    ...(candidate.projectUri ? { projectUri: candidate.projectUri } : {}),
    ...(candidate.projectName ? { projectName: candidate.projectName } : {}),
    ...(candidate.library ? { library: candidate.library } : {}),
    ...(candidate.sourceOrigin !== 'unknown' ? { sourceOrigin: candidate.sourceOrigin } : {}),
  };
}

function deriveConflictScope(projectCount: number, libraryCount: number, candidateCount: number): ConflictScope | null {
  if (projectCount > 1) {
    return 'cross-project';
  }
  if (libraryCount > 1) {
    return 'cross-library';
  }
  if (candidateCount > 1) {
    return 'cross-workspace';
  }
  return null;
}

function compareConflictRanking(left: ApiCrossProjectSymbolConflict, right: ApiCrossProjectSymbolConflict): number {
  const scopePriority = (scope: ConflictScope): number => {
    switch (scope) {
      case 'cross-project':
        return 0;
      case 'cross-library':
        return 1;
      default:
        return 2;
    }
  };

  const scopeOrder = scopePriority(left.scope) - scopePriority(right.scope);
  if (scopeOrder !== 0) {
    return scopeOrder;
  }

  if (left.projectCount !== right.projectCount) {
    return right.projectCount - left.projectCount;
  }

  if (left.libraryCount !== right.libraryCount) {
    return right.libraryCount - left.libraryCount;
  }

  if (left.candidateCount !== right.candidateCount) {
    return right.candidateCount - left.candidateCount;
  }

  const kindOrder = left.kind.localeCompare(right.kind);
  if (kindOrder !== 0) {
    return kindOrder;
  }

  const ownerOrder = (left.ownerName ?? '').localeCompare(right.ownerName ?? '');
  if (ownerOrder !== 0) {
    return ownerOrder;
  }

  return left.symbolName.localeCompare(right.symbolName);
}

function buildEvidence(
  rawCandidates: CandidateWithContext[],
  preferredCandidates: CandidateWithContext[],
  scope: ConflictScope,
  libraryCount: number,
  sourceOrigins: string[],
): string[] {
  const evidence = [scope === 'cross-project' ? 'multiple-projects' : scope === 'cross-library' ? 'multiple-libraries' : 'multiple-workspace-locations'];

  if (libraryCount > 1) {
    evidence.push('multiple-libraries');
  }

  if (rawCandidates.length > preferredCandidates.length) {
    evidence.push('collapsed-same-location');
  }

  if (sourceOrigins.length > 1) {
    evidence.push('mixed-source-origins');
  }

  return [...new Set(evidence)];
}

export function buildCrossProjectSymbolConflicts(
  request: ApiCrossProjectSymbolConflictsRequest | undefined,
  kb: KnowledgeBase,
  workspaceState: WorkspaceState,
): ApiCrossProjectSymbolConflicts {
  const symbolName = normalizeSymbolName(request?.symbolName);
  const maxConflicts = clamp(request?.maxConflicts, DEFAULT_MAX_CONFLICTS);
  const maxCandidatesPerConflict = clamp(request?.maxCandidatesPerConflict, DEFAULT_MAX_CANDIDATES_PER_CONFLICT);

  const groupedCandidates = new Map<string, CandidateWithContext[]>();
  for (const entity of kb.queryEntities({
    include: (candidate) => isConflictCandidate(candidate) && (!symbolName || candidate.name.toLowerCase() === symbolName),
  })) {
    const symbolKey = buildSymbolKey(entity);
    const bucket = groupedCandidates.get(symbolKey) ?? [];
    bucket.push(toCandidateWithContext(entity, workspaceState));
    groupedCandidates.set(symbolKey, bucket);
  }

  if (groupedCandidates.size === 0) {
    return createUnavailableConflicts(symbolName
      ? `No hay símbolos indexados para ${request?.symbolName ?? symbolName}.`
      : 'No hay símbolos indexados para analizar conflictos cross-project.');
  }

  const conflicts: ApiCrossProjectSymbolConflict[] = [];
  for (const [symbolKey, rawCandidates] of groupedCandidates.entries()) {
    const preferredByLocation = new Map<string, CandidateWithContext>();
    for (const candidate of rawCandidates) {
      const current = preferredByLocation.get(candidate.locationKey);
      if (!current || compareLocationCandidates(candidate, current) < 0) {
        preferredByLocation.set(candidate.locationKey, candidate);
      }
    }

    const preferredCandidates = [...preferredByLocation.values()].sort(comparePreferredCandidates);
    const projectCount = new Set(preferredCandidates.map((candidate) => candidate.projectUri).filter((value): value is string => Boolean(value))).size;
    const libraryCount = new Set(preferredCandidates.map((candidate) => candidate.library).filter((value): value is string => Boolean(value))).size;
    const scope = deriveConflictScope(projectCount, libraryCount, preferredCandidates.length);
    if (!scope) {
      continue;
    }

    const representative = preferredCandidates[0]?.entity;
    if (!representative) {
      continue;
    }

    const sourceOrigins = [...new Set(preferredCandidates.map((candidate) => candidate.sourceOrigin).filter((origin): origin is SourceOrigin => origin !== 'unknown'))]
      .sort((left, right) => compareSourceOriginPriority(left, right));
    const truncatedCandidates = maxCandidatesPerConflict >= 0 && preferredCandidates.length > maxCandidatesPerConflict;

    conflicts.push({
      symbolKey,
      symbolName: representative.name,
      kind: representative.kind,
      ...(getEntityOwnerName(representative) ? { ownerName: getEntityOwnerName(representative) } : {}),
      ...(typeof representative.parameterCount === 'number' ? { parameterCount: representative.parameterCount } : {}),
      scope,
      candidateCount: preferredCandidates.length,
      projectCount,
      libraryCount,
      sourceOrigins,
      evidence: buildEvidence(rawCandidates, preferredCandidates, scope, libraryCount, sourceOrigins),
      ...(truncatedCandidates ? { truncatedCandidates: true } : {}),
      candidates: preferredCandidates.slice(0, maxCandidatesPerConflict === 0 ? 0 : maxCandidatesPerConflict).map(toApiCandidate),
    });
  }

  conflicts.sort(compareConflictRanking);
  const returnedConflicts = maxConflicts === 0 ? [] : conflicts.slice(0, maxConflicts);

  return {
    schemaVersion: CONFLICT_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    available: true,
    summary: {
      totalConflictCount: conflicts.length,
      returnedConflictCount: returnedConflicts.length,
      totalCandidateCount: conflicts.reduce((sum, conflict) => sum + conflict.candidateCount, 0),
      crossProjectConflictCount: conflicts.filter((conflict) => conflict.scope === 'cross-project').length,
      crossLibraryConflictCount: conflicts.filter((conflict) => conflict.scope === 'cross-library').length,
      truncated: returnedConflicts.length < conflicts.length,
    },
    conflicts: returnedConflicts,
  };
}
