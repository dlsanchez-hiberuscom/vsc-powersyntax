import type {
  SemanticCacheCheckpoint,
  SemanticCacheDocumentRecord,
  SemanticCacheCheckpointMetadata,
} from './cacheSchema';
import type { SemanticCacheStore } from './cacheStore';
import { persistServingCacheSnapshot } from './servingCachePersistence';
import { ServingCacheFlushCoordinator } from './servingCacheFlushCoordinator';
import type { ServingCache } from '../knowledge/ServingCache';
import { PersistenceWriteQueue } from '../workspace/indexStateInvariants';

type PersistenceRestoreState = 'restored' | 'reused' | 'rebuilt' | undefined;

type PersistenceRestoreReport = {
  reason?: string;
  state?: 'restored' | 'reused' | 'rebuilt';
  documents: number;
  servingEntries: number;
};

export interface SemanticCacheRuntimeController {
  readonly flushCoordinator: ServingCacheFlushCoordinator;
  setCacheStore(store: SemanticCacheStore | null): void;
  getCacheStore(): SemanticCacheStore | null;
  appendUpsert(record: SemanticCacheDocumentRecord, semanticEpoch: number): void | Promise<void>;
  appendRemove(uri: string, semanticEpoch: number): void | Promise<void>;
  persistCheckpoint(checkpoint: SemanticCacheCheckpoint): Promise<void>;
  persistServingSnapshot(): Promise<void>;
  flushPersistenceWrites(): Promise<void>;
  setPersistenceRestoreReport(report: PersistenceRestoreReport): void;
  getLastPersistenceRestoreState(): PersistenceRestoreState;
  getLastPersistenceRestoreReason(): string | undefined;
  getLastRestoredCheckpointDocuments(): number;
  getLastServingSnapshotRestoreEntries(): number;
  getLastServingSnapshotPersistEntries(): number;
}

export function createSemanticCacheRuntimeController(
  servingCache: ServingCache,
  getSemanticEpoch: () => number,
  buildExpectedMetadata: () => Partial<SemanticCacheCheckpointMetadata>,
): SemanticCacheRuntimeController {
  let cacheStore: SemanticCacheStore | null = null;
  let lastServingSnapshotRestoreEntries = 0;
  let lastServingSnapshotPersistEntries = 0;
  let lastPersistenceRestoreState: PersistenceRestoreState;
  let lastPersistenceRestoreReason: string | undefined;
  let lastRestoredCheckpointDocuments = 0;
  const writeQueue = new PersistenceWriteQueue(async (_key, value) => {
    const write = value as () => Promise<void>;
    await write();
  });

  const persistServingSnapshot = async (): Promise<void> => {
    if (!cacheStore) {
      lastServingSnapshotPersistEntries = 0;
      return;
    }

    lastServingSnapshotPersistEntries = await persistServingCacheSnapshot(servingCache, cacheStore, getSemanticEpoch());
  };

  const flushCoordinator = new ServingCacheFlushCoordinator(async () => {
    await persistServingSnapshot();
  });

  let compactionInProgress = false;

  const checkCompactionThreshold = async () => {
    if (!cacheStore || compactionInProgress) return;
    const stats = cacheStore.getStats();
    if (stats.pendingMutations >= cacheStore.retentionPolicy.maxPendingMutations) {
      compactionInProgress = true;
      try {
        await cacheStore.runMaintenance(buildExpectedMetadata());
      } catch (err) {
        // Ignorar errores asíncronos de compactación
      } finally {
        compactionInProgress = false;
      }
    }
  };

  return {
    flushCoordinator,
    setCacheStore(store: SemanticCacheStore | null): void {
      cacheStore = store;
    },
    getCacheStore(): SemanticCacheStore | null {
      return cacheStore;
    },
    appendUpsert(record: SemanticCacheDocumentRecord, semanticEpoch: number): void | Promise<void> {
      if (!cacheStore) return;
      const promise = writeQueue.enqueue(`journal-upsert:${record.uri}`, () => cacheStore!.appendJournalMutation({
        semanticEpoch,
        kind: 'upsert',
        uris: [record.uri],
        documents: [record],
      }));
      void promise.then(() => checkCompactionThreshold());
      return promise;
    },
    appendRemove(uri: string, semanticEpoch: number): void | Promise<void> {
      if (!cacheStore) return;
      const promise = writeQueue.enqueue(`journal-remove:${uri}`, () => cacheStore!.appendJournalMutation({
        semanticEpoch,
        kind: 'remove',
        uris: [uri],
      }));
      void promise.then(() => checkCompactionThreshold());
      return promise;
    },
    async persistCheckpoint(checkpoint: SemanticCacheCheckpoint): Promise<void> {
      if (!cacheStore) {
        return;
      }

      await writeQueue.enqueue(`checkpoint:${checkpoint.semanticEpoch}`, () => cacheStore!.persistCheckpoint(checkpoint));
    },
    async persistServingSnapshot(): Promise<void> {
      await writeQueue.enqueue('serving-snapshot', () => persistServingSnapshot());
    },
    flushPersistenceWrites(): Promise<void> {
      return writeQueue.flush();
    },
    setPersistenceRestoreReport(report: PersistenceRestoreReport): void {
      lastPersistenceRestoreReason = report.reason;
      lastPersistenceRestoreState = report.state;
      lastRestoredCheckpointDocuments = report.documents;
      lastServingSnapshotRestoreEntries = report.servingEntries;
    },
    getLastPersistenceRestoreState(): PersistenceRestoreState {
      return lastPersistenceRestoreState;
    },
    getLastPersistenceRestoreReason(): string | undefined {
      return lastPersistenceRestoreReason;
    },
    getLastRestoredCheckpointDocuments(): number {
      return lastRestoredCheckpointDocuments;
    },
    getLastServingSnapshotRestoreEntries(): number {
      return lastServingSnapshotRestoreEntries;
    },
    getLastServingSnapshotPersistEntries(): number {
      return lastServingSnapshotPersistEntries;
    },
  };
}