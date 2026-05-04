import type { SemanticCacheDocumentRecord } from './cacheSchema';
import type { SemanticCacheStore } from './cacheStore';
import { persistServingCacheSnapshot } from './servingCachePersistence';
import { ServingCacheFlushCoordinator } from './servingCacheFlushCoordinator';
import type { ServingCache } from '../knowledge/ServingCache';

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
  persistServingSnapshot(): Promise<void>;
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
): SemanticCacheRuntimeController {
  let cacheStore: SemanticCacheStore | null = null;
  let lastServingSnapshotRestoreEntries = 0;
  let lastServingSnapshotPersistEntries = 0;
  let lastPersistenceRestoreState: PersistenceRestoreState;
  let lastPersistenceRestoreReason: string | undefined;
  let lastRestoredCheckpointDocuments = 0;

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

  return {
    flushCoordinator,
    setCacheStore(store: SemanticCacheStore | null): void {
      cacheStore = store;
    },
    getCacheStore(): SemanticCacheStore | null {
      return cacheStore;
    },
    appendUpsert(record: SemanticCacheDocumentRecord, semanticEpoch: number): void | Promise<void> {
      return cacheStore?.appendJournalMutation({
        semanticEpoch,
        kind: 'upsert',
        uris: [record.uri],
        documents: [record],
      });
    },
    appendRemove(uri: string, semanticEpoch: number): void | Promise<void> {
      return cacheStore?.appendJournalMutation({
        semanticEpoch,
        kind: 'remove',
        uris: [uri],
      });
    },
    async persistServingSnapshot(): Promise<void> {
      await persistServingSnapshot();
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