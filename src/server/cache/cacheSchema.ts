import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import type { Fact, Scope } from '../knowledge/types';

export const CACHE_SCHEMA_VERSION = 1;

export interface SemanticCacheProjectStats {
  projects: number;
  libraries: number;
  orphanFiles: number;
}

export interface SemanticCacheCheckpointMetadata {
  workspaceMode?: 'workspace' | 'solution' | 'mixed' | 'unknown';
  rootUris: string[];
  projectStats?: SemanticCacheProjectStats;
  publishedAt?: number;
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
      publishedAt: payload.metadata?.publishedAt
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