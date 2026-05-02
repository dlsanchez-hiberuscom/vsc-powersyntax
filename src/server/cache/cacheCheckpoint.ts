import {
  CACHE_SCHEMA_VERSION,
  migrateCheckpoint,
  migrateJournalEntry,
  type SemanticCacheCheckpoint,
  type SemanticCacheCheckpointMetadata,
  type SemanticCacheJournalEntry
} from './cacheSchema';
import { normalizeUri } from '../system/uriUtils';
import { inferSourceOrigin } from '../../shared/sourceOrigin';

export interface CacheRestoreDecision {
  action: 'reuse' | 'rebuild';
  reason?:
    | 'missing-persisted-state'
    | 'invalid-checkpoint-payload'
    | 'unsupported-schema-version'
    | 'workspace-mode-mismatch'
    | 'root-uris-mismatch'
    | 'project-stats-mismatch'
    | 'invalid-journal-sequence'
    | 'invalid-journal-entry';
}

export interface CacheRestoreResult {
  checkpoint: SemanticCacheCheckpoint;
  decision: CacheRestoreDecision;
}

function cloneRecord<T>(value: T): T {
  return structuredClone(value);
}

function createEmptyCheckpoint(metadata: Partial<SemanticCacheCheckpointMetadata> = {}): SemanticCacheCheckpoint {
  return {
    schemaVersion: CACHE_SCHEMA_VERSION,
    semanticEpoch: 0,
    createdAt: Date.now(),
    metadata: normalizeMetadata(metadata),
    documents: []
  };
}

function normalizeMetadata(metadata: Partial<SemanticCacheCheckpointMetadata> = {}): SemanticCacheCheckpointMetadata {
  const discovery = metadata.discovery;
  return {
    workspaceMode: metadata.workspaceMode,
    rootUris: [...new Set((metadata.rootUris ?? []).map((uri) => normalizeUri(uri)))].sort(),
    projectStats: metadata.projectStats ? { ...metadata.projectStats } : undefined,
    publishedAt: metadata.publishedAt,
    discovery: discovery
      ? {
          sourceFiles: [...new Set((discovery.sourceFiles ?? []).map((uri) => normalizeUri(uri)))].sort(),
          ...(discovery.sourceOrigins
            ? {
                sourceOrigins: Object.fromEntries(
                  Object.entries(discovery.sourceOrigins)
                    .map(([uri, sourceOrigin]) => [normalizeUri(uri), sourceOrigin ?? inferSourceOrigin(uri)])
                    .sort(([left], [right]) => left.localeCompare(right))
                )
              }
            : {}),
          roots: {
            workspaces: [...new Set((discovery.roots?.workspaces ?? []).map((uri) => normalizeUri(uri)))].sort(),
            targets: [...new Set((discovery.roots?.targets ?? []).map((uri) => normalizeUri(uri)))].sort(),
            libraries: [...new Set((discovery.roots?.libraries ?? []).map((uri) => normalizeUri(uri)))].sort(),
            solutions: [...new Set((discovery.roots?.solutions ?? []).map((uri) => normalizeUri(uri)))].sort(),
            projects: [...new Set((discovery.roots?.projects ?? []).map((uri) => normalizeUri(uri)))].sort()
          }
        }
      : undefined
  };
}

function matchesMetadata(
  checkpoint: SemanticCacheCheckpoint,
  expectedMetadata: Partial<SemanticCacheCheckpointMetadata>
): CacheRestoreDecision | null {
  const expected = normalizeMetadata(expectedMetadata);
  if (expected.workspaceMode && checkpoint.metadata.workspaceMode !== expected.workspaceMode) {
    return { action: 'rebuild', reason: 'workspace-mode-mismatch' };
  }

  if (expected.rootUris.length > 0) {
    const currentRoots = checkpoint.metadata.rootUris;
    if (currentRoots.length !== expected.rootUris.length || currentRoots.some((uri, index) => uri !== expected.rootUris[index])) {
      return { action: 'rebuild', reason: 'root-uris-mismatch' };
    }
  }

  if (expected.projectStats && checkpoint.metadata.projectStats) {
    const currentStats = checkpoint.metadata.projectStats;
    if (
      currentStats.projects !== expected.projectStats.projects
      || currentStats.libraries !== expected.projectStats.libraries
      || currentStats.orphanFiles !== expected.projectStats.orphanFiles
    ) {
      return { action: 'rebuild', reason: 'project-stats-mismatch' };
    }
  }

  return null;
}

function validateJournalEntries(journal: SemanticCacheJournalEntry[]): CacheRestoreDecision | null {
  let previousSequence = 0;

  for (const entry of journal) {
    if (entry.schemaVersion !== CACHE_SCHEMA_VERSION || entry.sequence <= previousSequence) {
      return { action: 'rebuild', reason: 'invalid-journal-sequence' };
    }

    if (entry.kind === 'upsert') {
      const documents = entry.documents ?? [];
      if (documents.length === 0 || documents.length !== entry.uris.length) {
        return { action: 'rebuild', reason: 'invalid-journal-entry' };
      }
    }

    previousSequence = entry.sequence;
  }

  return null;
}

export function createCacheCheckpoint(
  semanticEpoch: number,
  documents: SemanticCacheCheckpoint['documents'],
  metadata: Partial<SemanticCacheCheckpointMetadata> = {}
): SemanticCacheCheckpoint {
  return {
    schemaVersion: CACHE_SCHEMA_VERSION,
    semanticEpoch,
    createdAt: Date.now(),
    metadata: normalizeMetadata(metadata),
    documents: documents.map((document) => cloneRecord(document))
  };
}

export function resolveCheckpointRestore(
  checkpointInput: Partial<SemanticCacheCheckpoint>,
  journalInput: Array<Partial<SemanticCacheJournalEntry>> = [],
  expectedMetadata: Partial<SemanticCacheCheckpointMetadata> = {}
): CacheRestoreResult {
  if (checkpointInput.schemaVersion === undefined && (checkpointInput.documents?.length ?? 0) === 0 && journalInput.length === 0) {
    return {
      checkpoint: createEmptyCheckpoint(expectedMetadata),
      decision: { action: 'rebuild', reason: 'missing-persisted-state' }
    };
  }

  if ((checkpointInput.schemaVersion ?? CACHE_SCHEMA_VERSION) !== CACHE_SCHEMA_VERSION) {
    return {
      checkpoint: createEmptyCheckpoint(expectedMetadata),
      decision: { action: 'rebuild', reason: 'unsupported-schema-version' }
    };
  }

  const checkpoint = migrateCheckpoint(checkpointInput);
  checkpoint.metadata = normalizeMetadata(checkpoint.metadata);

  const metadataMismatch = matchesMetadata(checkpoint, expectedMetadata);
  if (metadataMismatch) {
    return {
      checkpoint: createEmptyCheckpoint(expectedMetadata),
      decision: metadataMismatch
    };
  }

  const journal = journalInput
    .map((entry) => migrateJournalEntry(entry))
    .sort((a, b) => a.sequence - b.sequence);
  const journalValidation = validateJournalEntries(journal);
  if (journalValidation) {
    return {
      checkpoint: createEmptyCheckpoint(checkpoint.metadata),
      decision: journalValidation
    };
  }

  const documents = new Map(checkpoint.documents.map((document) => [document.uri, cloneRecord(document)]));
  let semanticEpoch = checkpoint.semanticEpoch;

  for (const entry of journal) {
    semanticEpoch = Math.max(semanticEpoch, entry.semanticEpoch);
    if (entry.kind === 'clear') {
      documents.clear();
      continue;
    }
    if (entry.kind === 'remove') {
      for (const uri of entry.uris) {
        documents.delete(uri);
      }
      continue;
    }
    for (const document of entry.documents ?? []) {
      documents.set(document.uri, cloneRecord(document));
    }
  }

  return {
    checkpoint: {
      schemaVersion: CACHE_SCHEMA_VERSION,
      semanticEpoch,
      createdAt: checkpoint.createdAt,
      metadata: checkpoint.metadata,
      documents: [...documents.values()]
    },
    decision: { action: 'reuse' }
  };
}

export function applyJournalToCheckpoint(
  checkpointInput: Partial<SemanticCacheCheckpoint>,
  journalInput: Array<Partial<SemanticCacheJournalEntry>>,
  expectedMetadata: Partial<SemanticCacheCheckpointMetadata> = {}
): SemanticCacheCheckpoint {
  return resolveCheckpointRestore(checkpointInput, journalInput, expectedMetadata).checkpoint;
}