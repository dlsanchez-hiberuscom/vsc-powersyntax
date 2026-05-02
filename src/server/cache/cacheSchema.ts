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