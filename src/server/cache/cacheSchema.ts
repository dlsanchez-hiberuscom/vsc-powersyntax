import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import type { Fact, Scope } from '../knowledge/types';
import type { SourceOrigin } from '../../shared/sourceOrigin';

export const CACHE_SCHEMA_VERSION = 1;

export interface SemanticCacheProjectStats {
  projects: number;
  libraries: number;
  orphanFiles: number;
}

export interface SemanticCacheDiscoverySnapshot {
  sourceFiles: string[];
  sourceOrigins?: Record<string, SourceOrigin>;
  roots: {
    workspaces: string[];
    targets: string[];
    libraries: string[];
    solutions: string[];
    projects: string[];
  };
}

export interface SemanticCacheCheckpointMetadata {
  workspaceMode?: 'workspace' | 'solution' | 'mixed' | 'unknown';
  rootUris: string[];
  projectStats?: SemanticCacheProjectStats;
  publishedAt?: number;
  discovery?: SemanticCacheDiscoverySnapshot;
}

export interface SemanticCacheDocumentRecord {
  uri: string;
  version?: string | number;
  facts: Fact[];
  scopes: Scope[];
  snapshot?: SemanticDocumentSnapshot;
}

export interface SemanticCacheCheckpoint {
  schemaVersion: number;
  semanticEpoch: number;
  createdAt: number;
  metadata: SemanticCacheCheckpointMetadata;
  documents: SemanticCacheDocumentRecord[];
}

export type CacheMutationKind = 'upsert' | 'remove' | 'clear';

export interface SemanticCacheJournalEntry {
  schemaVersion: number;
  sequence: number;
  semanticEpoch: number;
  createdAt: number;
  kind: CacheMutationKind;
  uris: string[];
  documents?: SemanticCacheDocumentRecord[];
}

function cloneScopeForPersistence(scope: Scope): Scope {
  return {
    id: scope.id,
    kind: scope.kind,
    uri: scope.uri,
    startLine: scope.startLine,
    endLine: scope.endLine,
    children: scope.children.map((child) => cloneScopeForPersistence(child)),
    symbols: structuredClone(scope.symbols)
  };
}

function cloneScopesForPersistence(scopes: Scope[]): Scope[] {
  return scopes.map((scope) => cloneScopeForPersistence(scope));
}

function hydrateScopes(scopes: Scope[]): Scope[] {
  const hydrated = structuredClone(scopes);

  const visit = (scope: Scope, parent?: Scope): Scope => {
    scope.parent = parent;
    scope.children = scope.children.map((child) => visit(child, scope));
    return scope;
  };

  return hydrated.map((scope) => visit(scope));
}

export function cloneDocumentRecordForPersistence(record: SemanticCacheDocumentRecord): SemanticCacheDocumentRecord {
  return {
    uri: record.uri,
    version: record.version,
    facts: structuredClone(record.facts),
    scopes: cloneScopesForPersistence(record.scopes),
    ...(record.snapshot
      ? {
          snapshot: {
            ...structuredClone(record.snapshot),
            scopes: cloneScopesForPersistence(record.snapshot.scopes)
          }
        }
      : {})
  };
}

export function hydrateDocumentRecord(record: SemanticCacheDocumentRecord): SemanticCacheDocumentRecord {
  const hydrated = structuredClone(record);
  hydrated.scopes = hydrateScopes(hydrated.scopes);
  if (hydrated.snapshot) {
    hydrated.snapshot.scopes = hydrateScopes(hydrated.snapshot.scopes);
  }
  return hydrated;
}

export function migrateCheckpoint(payload: Partial<SemanticCacheCheckpoint>): SemanticCacheCheckpoint {
  return {
    schemaVersion: payload.schemaVersion ?? CACHE_SCHEMA_VERSION,
    semanticEpoch: payload.semanticEpoch ?? 0,
    createdAt: payload.createdAt ?? Date.now(),
    metadata: {
      rootUris: [...(payload.metadata?.rootUris ?? [])].sort(),
      workspaceMode: payload.metadata?.workspaceMode,
      projectStats: payload.metadata?.projectStats,
      publishedAt: payload.metadata?.publishedAt,
      discovery: payload.metadata?.discovery
        ? {
            sourceFiles: [...(payload.metadata.discovery.sourceFiles ?? [])],
            ...(payload.metadata.discovery.sourceOrigins ? { sourceOrigins: { ...payload.metadata.discovery.sourceOrigins } } : {}),
            roots: {
              workspaces: [...(payload.metadata.discovery.roots?.workspaces ?? [])],
              targets: [...(payload.metadata.discovery.roots?.targets ?? [])],
              libraries: [...(payload.metadata.discovery.roots?.libraries ?? [])],
              solutions: [...(payload.metadata.discovery.roots?.solutions ?? [])],
              projects: [...(payload.metadata.discovery.roots?.projects ?? [])]
            }
          }
        : undefined
    },
    documents: payload.documents ?? []
  };
}

export function migrateJournalEntry(payload: Partial<SemanticCacheJournalEntry>): SemanticCacheJournalEntry {
  return {
    schemaVersion: payload.schemaVersion ?? CACHE_SCHEMA_VERSION,
    sequence: payload.sequence ?? 0,
    semanticEpoch: payload.semanticEpoch ?? 0,
    createdAt: payload.createdAt ?? Date.now(),
    kind: payload.kind ?? 'clear',
    uris: payload.uris ?? [],
    documents: payload.documents
  };
}