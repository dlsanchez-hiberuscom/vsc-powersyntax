import {
  CACHE_SCHEMA_VERSION,
  type CacheMutationKind,
  cloneDocumentRecordForPersistence,
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
import type { ServingCacheEntry } from '../knowledge/ServingCache';
import type { UnifiedProjectModel } from '../workspace/unifiedProjectModel';

const CHECKPOINT_FILE = 'semantic-checkpoint.json';
const JOURNAL_FILE = 'semantic-journal.json';
const SERVING_SNAPSHOT_FILE = 'serving-cache.json';
const PROJECTS_DIR = 'projects';
const PARTITIONS_MANIFEST_FILE = 'project-partitions.json';

interface ServingCacheSnapshotPayload {
  schemaVersion: number;
  createdAt: number;
  entries: ServingCacheEntry<unknown>[];
}

interface ProjectPartitionManifestEntry {
  projectKey: string;
  projectUri: string;
}

interface ProjectPartitionsManifest {
  schemaVersion: number;
  partitions: ProjectPartitionManifestEntry[];
}

interface ProjectPartitionBucket {
  projectKey: string;
  projectUri: string;
  documents: SemanticCacheDocumentRecord[];
}

interface ProjectJournalPartition {
  projectKey: string;
  projectUri: string;
  uris: string[];
  documents?: SemanticCacheDocumentRecord[];
}

interface AppendJournalInput {
  semanticEpoch: number;
  kind: CacheMutationKind;
  uris: string[];
  documents?: SemanticCacheDocumentRecord[];
}

function isValidProjectPartitionManifestEntry(value: unknown): value is ProjectPartitionManifestEntry {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const entry = value as Partial<ProjectPartitionManifestEntry>;
  return typeof entry.projectKey === 'string'
    && entry.projectKey.length > 0
    && typeof entry.projectUri === 'string'
    && entry.projectUri.length > 0;
}

function isValidProjectPartitionsManifest(value: unknown): value is ProjectPartitionsManifest {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const manifest = value as Partial<ProjectPartitionsManifest>;
  return manifest.schemaVersion === CACHE_SCHEMA_VERSION
    && Array.isArray(manifest.partitions)
    && manifest.partitions.every((entry) => isValidProjectPartitionManifestEntry(entry));
}

export interface SemanticCacheRetentionPolicy {
  version: 2;
  staleWorkspaceTtlMs: number;
  maxJournalEntries: number;
  maxJournalBytes: number;
  maxWorkspaceBytes: number;
  maxPendingMutations: number;
}

export interface SemanticCacheWorkspaceMaintenanceSnapshot {
  workspaceKey: string;
  totalBytes: number;
  checkpointBytes: number;
  journalBytes: number;
  servingSnapshotBytes: number;
  partitionBytes: number;
  partitionCount: number;
  journalEntries: number;
  lastModifiedAt: number;
}

export interface SemanticCacheMaintenanceSnapshot {
  policy: SemanticCacheRetentionPolicy;
  currentWorkspace: SemanticCacheWorkspaceMaintenanceSnapshot;
  staleWorkspaces: SemanticCacheWorkspaceMaintenanceSnapshot[];
  maintenanceRecommended: boolean;
  needsCompaction: boolean;
}

export interface SemanticCacheMaintenanceResult extends SemanticCacheMaintenanceSnapshot {
  compacted: boolean;
  restoreValidated: boolean;
  prunedWorkspaceKeys: string[];
}

const DEFAULT_CACHE_RETENTION_POLICY: SemanticCacheRetentionPolicy = {
  version: 2,
  staleWorkspaceTtlMs: 1000 * 60 * 60 * 24 * 14,
  maxJournalEntries: 24,
  maxJournalBytes: 1024 * 128,
  maxWorkspaceBytes: 1024 * 1024 * 32,
  maxPendingMutations: 500
};

export interface SemanticCacheStore {
  readonly storageUri: string;
  readonly checkpointUri: string;
  readonly journalUri: string;
  readonly workspaceKey: string;
  readonly retentionPolicy: SemanticCacheRetentionPolicy;
  load(expectedMetadata: Partial<SemanticCacheCheckpointMetadata>): Promise<CacheRestoreResult>;
  persistCheckpoint(checkpoint: SemanticCacheCheckpoint): Promise<void>;
  loadServingCacheSnapshot<T>(): Promise<ServingCacheEntry<T>[]>;
  persistServingCacheSnapshot<T>(entries: ServingCacheEntry<T>[]): Promise<void>;
  saveSnapshot(
    semanticEpoch: number,
    documents: SemanticCacheDocumentRecord[],
    metadata: Partial<SemanticCacheCheckpointMetadata>
  ): Promise<void>;
  appendJournalMutation(entry: AppendJournalInput): Promise<void>;
  inspectMaintenance(now?: number): Promise<SemanticCacheMaintenanceSnapshot>;
  runMaintenance(
    expectedMetadata: Partial<SemanticCacheCheckpointMetadata>,
    now?: number
  ): Promise<SemanticCacheMaintenanceResult>;
  clear(): Promise<void>;
  getStats(): { pendingMutations: number; autoCompactions: number };
}

function joinUri(baseUri: string, segment: string): string {
  return `${baseUri.replace(/\/$/, '')}/${segment}`;
}

async function tryReadJson<T>(fs: IFileSystem, uri: string): Promise<{ ok: true; value: T | undefined } | { ok: false }> {
  const stat = await fs.stat(uri);
  if (!stat?.isFile) {
    return { ok: true, value: undefined };
  }

  try {
    const raw = await fs.readFile(uri);
    return { ok: true, value: JSON.parse(raw) as T };
  } catch {
    return { ok: false };
  }
}

async function tryWriteJson(fs: IFileSystem, uri: string, payload: unknown): Promise<void> {
  await fs.writeFile(uri, JSON.stringify(payload, null, 2));
}

async function tryReadJournalEntries(fs: IFileSystem, uri: string): Promise<SemanticCacheJournalEntry[]> {
  const read = await tryReadJson<SemanticCacheJournalEntry[]>(fs, uri);
  if (!read.ok || !Array.isArray(read.value)) {
    return [];
  }

  return read.value
    .filter((entry) => entry.schemaVersion === CACHE_SCHEMA_VERSION)
    .sort((left, right) => left.sequence - right.sequence);
}

async function readSize(fs: IFileSystem, uri: string): Promise<number> {
  return (await fs.stat(uri))?.size ?? 0;
}

async function measureTree(fs: IFileSystem, uri: string): Promise<{ totalBytes: number; lastModifiedAt: number; directoryCount: number }> {
  const stat = await fs.stat(uri);
  if (!stat) {
    return { totalBytes: 0, lastModifiedAt: 0, directoryCount: 0 };
  }

  if (stat.isFile) {
    return {
      totalBytes: stat.size,
      lastModifiedAt: stat.mtime,
      directoryCount: 0
    };
  }

  let totalBytes = 0;
  let lastModifiedAt = stat.mtime;
  let directoryCount = 1;

  for (const [name, entry] of await fs.readDirectory(uri)) {
    if (entry.isDirectory) {
      const measuredChild = await measureTree(fs, joinUri(uri, encodeURIComponent(name)));
      totalBytes += measuredChild.totalBytes;
      lastModifiedAt = Math.max(lastModifiedAt, measuredChild.lastModifiedAt);
      directoryCount += measuredChild.directoryCount;
      continue;
    }

    totalBytes += entry.size;
    lastModifiedAt = Math.max(lastModifiedAt, entry.mtime);
  }

  return { totalBytes, lastModifiedAt, directoryCount };
}

async function buildWorkspaceMaintenanceSnapshot(
  fs: IFileSystem,
  rootUri: string,
  workspaceKey: string
): Promise<SemanticCacheWorkspaceMaintenanceSnapshot> {
  const checkpointBytes = await readSize(fs, joinUri(rootUri, CHECKPOINT_FILE));
  const journalBytes = await readSize(fs, joinUri(rootUri, JOURNAL_FILE));
  const servingSnapshotBytes = await readSize(fs, joinUri(rootUri, SERVING_SNAPSHOT_FILE));
  const partitionManifestBytes = await readSize(fs, joinUri(rootUri, PARTITIONS_MANIFEST_FILE));
  const projectTree = await measureTree(fs, joinUri(rootUri, PROJECTS_DIR));
  const tree = await measureTree(fs, rootUri);
  const journalEntries = (await tryReadJournalEntries(fs, joinUri(rootUri, JOURNAL_FILE))).length;

  return {
    workspaceKey,
    totalBytes: tree.totalBytes,
    checkpointBytes,
    journalBytes,
    servingSnapshotBytes,
    partitionBytes: partitionManifestBytes + projectTree.totalBytes,
    partitionCount: Math.max(0, projectTree.directoryCount - 1),
    journalEntries,
    lastModifiedAt: tree.lastModifiedAt,
  };
}

export function buildWorkspaceCacheKey(workspaceFolders: string[]): string {
  const normalizedRoots = [...new Set(workspaceFolders.map((uri) => normalizeUri(uri)))].sort();
  return calculateHash(normalizedRoots.join('|') || 'workspace-empty');
}

function buildProjectCacheKey(projectUri: string): string {
  return calculateHash(normalizeUri(projectUri));
}

function buildProjectCheckpointUri(projectsUri: string, projectKey: string): string {
  return joinUri(joinUri(projectsUri, projectKey), CHECKPOINT_FILE);
}

function buildProjectJournalUri(projectsUri: string, projectKey: string): string {
  return joinUri(joinUri(projectsUri, projectKey), JOURNAL_FILE);
}

function partitionCheckpointDocuments(
  documents: SemanticCacheDocumentRecord[],
  projectModel?: UnifiedProjectModel | null
): { workspaceDocuments: SemanticCacheDocumentRecord[]; projectPartitions: ProjectPartitionBucket[] } | null {
  if (!projectModel) {
    return null;
  }

  const projectBuckets = new Map<string, ProjectPartitionBucket>();
  for (const project of projectModel.getProjects()) {
    const normalizedProjectUri = normalizeUri(project.projectUri);
    projectBuckets.set(normalizedProjectUri, {
      projectKey: buildProjectCacheKey(normalizedProjectUri),
      projectUri: normalizedProjectUri,
      documents: []
    });
  }

  if (projectBuckets.size === 0) {
    return null;
  }

  const workspaceDocuments: SemanticCacheDocumentRecord[] = [];

  for (const document of documents) {
    const project = projectModel.getProjectForFile(document.uri);
    const partition = project ? projectBuckets.get(normalizeUri(project.projectUri)) : undefined;

    if (!partition) {
      workspaceDocuments.push(cloneDocumentRecordForPersistence(document));
      continue;
    }

    partition.documents.push(cloneDocumentRecordForPersistence(document));
  }

  return {
    workspaceDocuments,
    projectPartitions: [...projectBuckets.values()]
      .filter((partition) => partition.documents.length > 0)
      .sort((left, right) => left.projectUri.localeCompare(right.projectUri))
  };
}

function partitionJournalMutation(
  entry: AppendJournalInput,
  projectModel?: UnifiedProjectModel | null
): {
  workspaceEntry: AppendJournalInput | null;
  projectEntries: ProjectJournalPartition[];
} | null {
  if (!projectModel) {
    return null;
  }

  const projectPartitions = new Map<string, ProjectJournalPartition>();
  for (const project of projectModel.getProjects()) {
    const normalizedProjectUri = normalizeUri(project.projectUri);
    projectPartitions.set(normalizedProjectUri, {
      projectKey: buildProjectCacheKey(normalizedProjectUri),
      projectUri: normalizedProjectUri,
      uris: [],
      documents: entry.kind === 'upsert' ? [] : undefined
    });
  }

  if (projectPartitions.size === 0) {
    return null;
  }

  if (entry.kind === 'clear') {
    return {
      workspaceEntry: {
        semanticEpoch: entry.semanticEpoch,
        kind: 'clear',
        uris: []
      },
      projectEntries: [...projectPartitions.values()].sort((left, right) => left.projectUri.localeCompare(right.projectUri))
    };
  }

  const workspaceEntry: AppendJournalInput = {
    semanticEpoch: entry.semanticEpoch,
    kind: entry.kind,
    uris: [],
    documents: entry.kind === 'upsert' ? [] : undefined
  };

  if (entry.kind === 'upsert') {
    for (const document of entry.documents ?? []) {
      const project = projectModel.getProjectForFile(document.uri);
      const partition = project ? projectPartitions.get(normalizeUri(project.projectUri)) : undefined;
      if (!partition) {
        workspaceEntry.uris.push(document.uri);
        workspaceEntry.documents?.push(cloneDocumentRecordForPersistence(document));
        continue;
      }
      partition.uris.push(document.uri);
      partition.documents?.push(cloneDocumentRecordForPersistence(document));
    }
  } else {
    for (const uri of entry.uris) {
      const project = projectModel.getProjectForFile(uri);
      const partition = project ? projectPartitions.get(normalizeUri(project.projectUri)) : undefined;
      if (!partition) {
        workspaceEntry.uris.push(uri);
        continue;
      }
      partition.uris.push(uri);
    }
  }

  return {
    workspaceEntry: workspaceEntry.uris.length > 0 || workspaceEntry.kind === 'clear' ? workspaceEntry : null,
    projectEntries: [...projectPartitions.values()]
      .filter((partition) => partition.uris.length > 0 || entry.kind === 'clear')
      .sort((left, right) => left.projectUri.localeCompare(right.projectUri))
  };
}

export function createSemanticCacheStore(
  fs: IFileSystem,
  baseStorageUri: string,
  workspaceFolders: string[],
  projectModel?: UnifiedProjectModel | null
): SemanticCacheStore {
  const workspaceKey = buildWorkspaceCacheKey(workspaceFolders);
  const storageUri = joinUri(baseStorageUri, workspaceKey);
  const checkpointUri = joinUri(storageUri, CHECKPOINT_FILE);
  const journalUri = joinUri(storageUri, JOURNAL_FILE);
  const servingSnapshotUri = joinUri(storageUri, SERVING_SNAPSHOT_FILE);
  const projectsUri = joinUri(storageUri, PROJECTS_DIR);
  const partitionsManifestUri = joinUri(storageUri, PARTITIONS_MANIFEST_FILE);
  let journalEntries: SemanticCacheJournalEntry[] = [];
  let nextSequence = 0;
  let partitionedPersistenceEnabled = false;
  const projectJournalEntries = new Map<string, SemanticCacheJournalEntry[]>();
  const projectNextSequences = new Map<string, number>();
  let pendingMutations = 0;
  let autoCompactions = 0;

  async function listStaleWorkspaceSnapshots(now: number): Promise<SemanticCacheWorkspaceMaintenanceSnapshot[]> {
    await fs.createDirectory(baseStorageUri);
    const entries = await fs.readDirectory(baseStorageUri);
    const staleSnapshots: SemanticCacheWorkspaceMaintenanceSnapshot[] = [];

    for (const [entryName, entry] of entries) {
      if (!entry.isDirectory || entryName === workspaceKey) {
        continue;
      }

      const entryUri = joinUri(baseStorageUri, encodeURIComponent(entryName));
      const snapshot = await buildWorkspaceMaintenanceSnapshot(fs, entryUri, entryName);
      if (snapshot.lastModifiedAt <= 0) {
        continue;
      }

      if (now - snapshot.lastModifiedAt >= DEFAULT_CACHE_RETENTION_POLICY.staleWorkspaceTtlMs) {
        staleSnapshots.push(snapshot);
      }
    }

    return staleSnapshots.sort((left, right) => left.lastModifiedAt - right.lastModifiedAt);
  }

  async function pruneStaleWorkspaceSnapshots(now: number): Promise<string[]> {
    const staleSnapshots = await listStaleWorkspaceSnapshots(now);
    for (const snapshot of staleSnapshots) {
      await fs.deletePath(joinUri(baseStorageUri, snapshot.workspaceKey));
    }
    return staleSnapshots.map((snapshot) => snapshot.workspaceKey);
  }

  async function writeJournalEntry(
    journalTargetUri: string,
    entries: SemanticCacheJournalEntry[],
    sequence: number,
    entry: AppendJournalInput
  ): Promise<number> {
    const nextEntry: SemanticCacheJournalEntry = {
      schemaVersion: CACHE_SCHEMA_VERSION,
      sequence,
      semanticEpoch: entry.semanticEpoch,
      createdAt: Date.now(),
      kind: entry.kind,
      uris: [...entry.uris],
      documents: entry.documents
        ? entry.documents.map((document) => cloneDocumentRecordForPersistence(document))
        : undefined
    };
    entries.push(nextEntry);
    await tryWriteJson(fs, journalTargetUri, entries);
    return nextEntry.sequence;
  }

  return {
    storageUri,
    checkpointUri,
    journalUri,
    workspaceKey,
    retentionPolicy: DEFAULT_CACHE_RETENTION_POLICY,
    async load(expectedMetadata: Partial<SemanticCacheCheckpointMetadata>): Promise<CacheRestoreResult> {
      await pruneStaleWorkspaceSnapshots(Date.now());
      await fs.createDirectory(storageUri);

      const checkpointRead = await tryReadJson<SemanticCacheCheckpoint>(fs, checkpointUri);
      const journalRead = await tryReadJson<SemanticCacheJournalEntry[]>(fs, journalUri);
      const manifestRead = await tryReadJson<ProjectPartitionsManifest>(fs, partitionsManifestUri);

      if (!checkpointRead.ok || !journalRead.ok || !manifestRead.ok) {
        return {
          checkpoint: createCacheCheckpoint(0, [], expectedMetadata),
          decision: { action: 'rebuild', reason: 'invalid-checkpoint-payload' }
        };
      }

      if (manifestRead.value !== undefined && !isValidProjectPartitionsManifest(manifestRead.value)) {
        return {
          checkpoint: createCacheCheckpoint(0, [], expectedMetadata),
          decision: { action: 'rebuild', reason: 'invalid-checkpoint-payload' }
        };
      }

      journalEntries = (journalRead.value ?? [])
        .filter((entry) => entry.schemaVersion === CACHE_SCHEMA_VERSION)
        .sort((left, right) => left.sequence - right.sequence);
      nextSequence = journalEntries[journalEntries.length - 1]?.sequence ?? 0;
      projectJournalEntries.clear();
      projectNextSequences.clear();

      if (manifestRead.value && manifestRead.value.partitions.length > 0) {
        partitionedPersistenceEnabled = true;

        const workspaceRestore = resolveCheckpointRestore(
          checkpointRead.value ?? {},
          journalRead.value ?? [],
          expectedMetadata
        );
        if (workspaceRestore.decision.action !== 'reuse') {
          return {
            checkpoint: createCacheCheckpoint(0, [], expectedMetadata),
            decision: workspaceRestore.decision
          };
        }

        const partitionDocuments: SemanticCacheDocumentRecord[] = [];
        let semanticEpoch = workspaceRestore.checkpoint.semanticEpoch;

        for (const partition of manifestRead.value.partitions) {
          const partitionCheckpointRead = await tryReadJson<SemanticCacheCheckpoint>(
            fs,
            buildProjectCheckpointUri(projectsUri, partition.projectKey)
          );
          const partitionJournalRead = await tryReadJson<SemanticCacheJournalEntry[]>(
            fs,
            buildProjectJournalUri(projectsUri, partition.projectKey)
          );

          if (!partitionCheckpointRead.ok || !partitionCheckpointRead.value || !partitionJournalRead.ok) {
            return {
              checkpoint: createCacheCheckpoint(0, [], expectedMetadata),
              decision: { action: 'rebuild', reason: 'invalid-checkpoint-payload' }
            };
          }

          const partitionJournalState = (partitionJournalRead.value ?? [])
            .filter((entry) => entry.schemaVersion === CACHE_SCHEMA_VERSION)
            .sort((left, right) => left.sequence - right.sequence);
          projectJournalEntries.set(partition.projectKey, partitionJournalState);
          projectNextSequences.set(
            partition.projectKey,
            partitionJournalState[partitionJournalState.length - 1]?.sequence ?? 0
          );

          const partitionRestore = resolveCheckpointRestore(
            partitionCheckpointRead.value,
            partitionJournalRead.value ?? [],
            workspaceRestore.checkpoint.metadata
          );

          if (partitionRestore.decision.action !== 'reuse') {
            return {
              checkpoint: createCacheCheckpoint(0, [], expectedMetadata),
              decision: partitionRestore.decision
            };
          }

          semanticEpoch = Math.max(semanticEpoch, partitionRestore.checkpoint.semanticEpoch);
          partitionDocuments.push(...partitionRestore.checkpoint.documents);
        }

        return {
          checkpoint: {
            ...workspaceRestore.checkpoint,
            semanticEpoch,
            documents: [...workspaceRestore.checkpoint.documents, ...partitionDocuments]
          },
          decision: { action: 'reuse' }
        };
      }

      partitionedPersistenceEnabled = false;
      return resolveCheckpointRestore(
        checkpointRead.value ?? {},
        journalRead.value ?? [],
        expectedMetadata
      );
    },
    async persistCheckpoint(checkpoint: SemanticCacheCheckpoint): Promise<void> {
      await pruneStaleWorkspaceSnapshots(Date.now());
      await fs.createDirectory(storageUri);

      const partitioned = partitionCheckpointDocuments(checkpoint.documents, projectModel);
      if (!partitioned) {
        partitionedPersistenceEnabled = false;
        projectJournalEntries.clear();
        projectNextSequences.clear();
        await fs.deletePath(partitionsManifestUri);
        await fs.deletePath(projectsUri);
        await tryWriteJson(fs, checkpointUri, {
          ...checkpoint,
          documents: checkpoint.documents.map((document) => cloneDocumentRecordForPersistence(document))
        });
      } else {
        partitionedPersistenceEnabled = true;
        projectJournalEntries.clear();
        projectNextSequences.clear();
        await fs.deletePath(projectsUri);
        await tryWriteJson(fs, checkpointUri, {
          ...checkpoint,
          documents: partitioned.workspaceDocuments
        });

        const manifest: ProjectPartitionsManifest = {
          schemaVersion: CACHE_SCHEMA_VERSION,
          partitions: []
        };

        for (const partition of partitioned.projectPartitions) {
          const partitionCheckpointUri = buildProjectCheckpointUri(projectsUri, partition.projectKey);
          await tryWriteJson(fs, partitionCheckpointUri, {
            ...checkpoint,
            documents: partition.documents
          });
          projectJournalEntries.set(partition.projectKey, []);
          projectNextSequences.set(partition.projectKey, 0);
          manifest.partitions.push({
            projectKey: partition.projectKey,
            projectUri: partition.projectUri
          });
        }

        await tryWriteJson(fs, partitionsManifestUri, manifest);
      }

      journalEntries = [];
      nextSequence = 0;
      pendingMutations = 0;
      await fs.deletePath(journalUri);
    },
    async loadServingCacheSnapshot<T>(): Promise<ServingCacheEntry<T>[]> {
      await fs.createDirectory(storageUri);
      const snapshotRead = await tryReadJson<ServingCacheSnapshotPayload>(fs, servingSnapshotUri);
      if (!snapshotRead.ok) {
        return [];
      }

      const payload = snapshotRead.value;
      if (!payload || payload.schemaVersion !== CACHE_SCHEMA_VERSION || !Array.isArray(payload.entries)) {
        return [];
      }

      return structuredClone(payload.entries) as ServingCacheEntry<T>[];
    },
    async persistServingCacheSnapshot<T>(entries: ServingCacheEntry<T>[]): Promise<void> {
      await fs.createDirectory(storageUri);
      await tryWriteJson(fs, servingSnapshotUri, {
        schemaVersion: CACHE_SCHEMA_VERSION,
        createdAt: Date.now(),
        entries: structuredClone(entries)
      } satisfies ServingCacheSnapshotPayload);
    },
    async saveSnapshot(
      semanticEpoch: number,
      documents: SemanticCacheDocumentRecord[],
      metadata: Partial<SemanticCacheCheckpointMetadata>
    ): Promise<void> {
      await this.persistCheckpoint(createCacheCheckpoint(semanticEpoch, documents, metadata));
    },
    async appendJournalMutation(entry: AppendJournalInput): Promise<void> {
      pendingMutations++;
      await fs.createDirectory(storageUri);

      if (!partitionedPersistenceEnabled) {
        nextSequence = await writeJournalEntry(journalUri, journalEntries, ++nextSequence, entry);
        return;
      }

      const partitionedEntry = partitionJournalMutation(entry, projectModel);
      if (!partitionedEntry) {
        nextSequence = await writeJournalEntry(journalUri, journalEntries, ++nextSequence, entry);
        return;
      }

      if (partitionedEntry.workspaceEntry) {
        nextSequence = await writeJournalEntry(journalUri, journalEntries, ++nextSequence, partitionedEntry.workspaceEntry);
      }

      for (const projectEntry of partitionedEntry.projectEntries) {
        const currentEntries = projectJournalEntries.get(projectEntry.projectKey) ?? [];
        const currentSequence = projectNextSequences.get(projectEntry.projectKey) ?? 0;
        const nextPartitionSequence = await writeJournalEntry(
          buildProjectJournalUri(projectsUri, projectEntry.projectKey),
          currentEntries,
          currentSequence + 1,
          {
            semanticEpoch: entry.semanticEpoch,
            kind: entry.kind,
            uris: projectEntry.uris,
            documents: projectEntry.documents
          }
        );
        projectJournalEntries.set(projectEntry.projectKey, currentEntries);
        projectNextSequences.set(projectEntry.projectKey, nextPartitionSequence);
      }
    },
    async inspectMaintenance(now = Date.now()): Promise<SemanticCacheMaintenanceSnapshot> {
      await fs.createDirectory(storageUri);
      const currentWorkspace = await buildWorkspaceMaintenanceSnapshot(fs, storageUri, workspaceKey);
      const staleWorkspaces = await listStaleWorkspaceSnapshots(now);
      const needsCompaction = currentWorkspace.journalEntries > DEFAULT_CACHE_RETENTION_POLICY.maxJournalEntries
        || currentWorkspace.journalBytes > DEFAULT_CACHE_RETENTION_POLICY.maxJournalBytes
        || pendingMutations >= DEFAULT_CACHE_RETENTION_POLICY.maxPendingMutations;

      return {
        policy: DEFAULT_CACHE_RETENTION_POLICY,
        currentWorkspace,
        staleWorkspaces,
        needsCompaction,
        maintenanceRecommended: needsCompaction
          || staleWorkspaces.length > 0
          || currentWorkspace.totalBytes > DEFAULT_CACHE_RETENTION_POLICY.maxWorkspaceBytes,
      };
    },
    async runMaintenance(
      expectedMetadata: Partial<SemanticCacheCheckpointMetadata>,
      now = Date.now()
    ): Promise<SemanticCacheMaintenanceResult> {
      const prunedWorkspaceKeys = await pruneStaleWorkspaceSnapshots(now);
      const before = await this.inspectMaintenance(now);
      let compacted = false;
      let restoreValidated = true;

      if (before.needsCompaction) {
        const restored = await this.load(expectedMetadata);
        if (restored.decision.action === 'reuse') {
          await this.persistCheckpoint(restored.checkpoint);
          const validation = await this.load(expectedMetadata);
          compacted = true;
          restoreValidated = validation.decision.action === 'reuse';
        } else {
          restoreValidated = false;
        }
      }

      const after = await this.inspectMaintenance(now);
      if (compacted) {
        autoCompactions++;
      }
      return {
        ...after,
        compacted,
        restoreValidated,
        prunedWorkspaceKeys,
      };
    },
    async clear(): Promise<void> {
      journalEntries = [];
      nextSequence = 0;
      pendingMutations = 0;
      autoCompactions = 0;
      partitionedPersistenceEnabled = false;
      projectJournalEntries.clear();
      projectNextSequences.clear();
      await fs.deletePath(storageUri);
    },
    getStats() {
      return { pendingMutations, autoCompactions };
    }
  };
}