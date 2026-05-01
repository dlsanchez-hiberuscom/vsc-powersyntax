import {
  CACHE_SCHEMA_VERSION,
  type CacheMutationKind,
  type SemanticCacheCheckpoint,
  type SemanticCacheCheckpointMetadata,
  type SemanticCacheDocumentRecord,
  type SemanticCacheJournalEntry
} from './cacheSchema';
import {
  createCacheCheckpoint,
  resolveCheckpointRestore,
  type CacheRestoreResult
} from './cacheCheckpoint';
import { calculateHash } from '../system/hash';
import type { IFileSystem } from '../system/fileSystem';
import { normalizeUri } from '../system/uriUtils';

const CHECKPOINT_FILE = 'semantic-checkpoint.json';
const JOURNAL_FILE = 'semantic-journal.json';

interface AppendJournalInput {
  semanticEpoch: number;
  kind: CacheMutationKind;
  uris: string[];
  documents?: SemanticCacheDocumentRecord[];
}

export interface SemanticCacheStore {
  readonly storageUri: string;
  readonly checkpointUri: string;
  readonly journalUri: string;
  readonly workspaceKey: string;
  load(expectedMetadata: Partial<SemanticCacheCheckpointMetadata>): Promise<CacheRestoreResult>;
  persistCheckpoint(checkpoint: SemanticCacheCheckpoint): Promise<void>;
  saveSnapshot(
    semanticEpoch: number,
    documents: SemanticCacheDocumentRecord[],
    metadata: Partial<SemanticCacheCheckpointMetadata>
  ): Promise<void>;
  appendJournalMutation(entry: AppendJournalInput): Promise<void>;
  clear(): Promise<void>;
}

function joinUri(baseUri: string, segment: string): string {
  return `${baseUri.replace(/\/$/, '')}/${segment}`;
}

async function tryReadJson<T>(fs: IFileSystem, uri: string): Promise<{ ok: true; value: T | undefined } | { ok: false }> {
  try {
    const raw = await fs.readFile(uri);
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return { ok: true, value: undefined };
  }
}

async function tryWriteJson(fs: IFileSystem, uri: string, payload: unknown): Promise<void> {
  await fs.writeFile(uri, JSON.stringify(payload, null, 2));
}

export function buildWorkspaceCacheKey(workspaceFolders: string[]): string {
  const normalizedRoots = [...new Set(workspaceFolders.map((uri) => normalizeUri(uri)))].sort();
  return calculateHash(normalizedRoots.join('|') || 'workspace-empty');
}

export function createSemanticCacheStore(
  fs: IFileSystem,
  baseStorageUri: string,
  workspaceFolders: string[]
): SemanticCacheStore {
  const workspaceKey = buildWorkspaceCacheKey(workspaceFolders);
  const storageUri = joinUri(baseStorageUri, workspaceKey);
  const checkpointUri = joinUri(storageUri, CHECKPOINT_FILE);
  const journalUri = joinUri(storageUri, JOURNAL_FILE);
  let journalEntries: SemanticCacheJournalEntry[] = [];
  let nextSequence = 0;

  return {
    storageUri,
    checkpointUri,
    journalUri,
    workspaceKey,
    async load(expectedMetadata: Partial<SemanticCacheCheckpointMetadata>): Promise<CacheRestoreResult> {
      await fs.createDirectory(storageUri);

      const checkpointRead = await tryReadJson<SemanticCacheCheckpoint>(fs, checkpointUri);
      const journalRead = await tryReadJson<SemanticCacheJournalEntry[]>(fs, journalUri);

      if (!checkpointRead.ok || !journalRead.ok) {
        return {
          checkpoint: createCacheCheckpoint(0, [], expectedMetadata),
          decision: { action: 'rebuild', reason: 'invalid-checkpoint-payload' }
        };
      }

      const result = resolveCheckpointRestore(
        checkpointRead.value ?? {},
        journalRead.value ?? [],
        expectedMetadata
      );

      journalEntries = (journalRead.value ?? [])
        .filter((entry) => entry.schemaVersion === CACHE_SCHEMA_VERSION)
        .sort((left, right) => left.sequence - right.sequence);
      nextSequence = journalEntries[journalEntries.length - 1]?.sequence ?? 0;

      return result;
    },
    async persistCheckpoint(checkpoint: SemanticCacheCheckpoint): Promise<void> {
      await fs.createDirectory(storageUri);
      await tryWriteJson(fs, checkpointUri, checkpoint);
      journalEntries = [];
      nextSequence = 0;
      await fs.deletePath(journalUri);
    },
    async saveSnapshot(
      semanticEpoch: number,
      documents: SemanticCacheDocumentRecord[],
      metadata: Partial<SemanticCacheCheckpointMetadata>
    ): Promise<void> {
      await this.persistCheckpoint(createCacheCheckpoint(semanticEpoch, documents, metadata));
    },
    async appendJournalMutation(entry: AppendJournalInput): Promise<void> {
      await fs.createDirectory(storageUri);
      const nextEntry: SemanticCacheJournalEntry = {
        schemaVersion: CACHE_SCHEMA_VERSION,
        sequence: ++nextSequence,
        semanticEpoch: entry.semanticEpoch,
        createdAt: Date.now(),
        kind: entry.kind,
        uris: [...entry.uris],
        documents: entry.documents ? structuredClone(entry.documents) : undefined
      };
      journalEntries.push(nextEntry);
      await tryWriteJson(fs, journalUri, journalEntries);
    },
    async clear(): Promise<void> {
      journalEntries = [];
      nextSequence = 0;
      await fs.deletePath(storageUri);
    }
  };
}