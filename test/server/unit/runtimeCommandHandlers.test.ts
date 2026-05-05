import * as assert from 'assert/strict';

import { tryHandleRuntimeCommand } from '../../../src/server/handlers/runtimeCommandHandlers';
import { InteractiveServingStatsTracker } from '../../../src/server/runtime/interactiveServingStats';
import { RuntimeJournal } from '../../../src/server/runtime/runtimeJournal';

suite('unit/runtimeCommandHandlers', () => {
  test('showStats expone métricas de serving interactivo por feature', async () => {
    const tracker = new InteractiveServingStatsTracker();
    tracker.record({
      feature: 'hover',
      reason: 'cache-hit',
      totalMs: 1.2,
      payloadBytes: 42,
      locale: 'en',
      kbVersion: 7,
      semanticEpoch: 11,
      budgetMs: 50,
    });

    const handled = await tryHandleRuntimeCommand({ command: 'powerbuilder.showStats' } as any, {
      knowledgeBase: { getStats: () => ({ totalEntities: 1, totalScopes: 1, indexedScopes: 1, version: 7 }) },
      scheduler: { getStatus: () => ({ pendingNear: 0, pendingBackground: 0, interactiveBusy: false }) },
      workspaceState: {
        getProjectModel: () => null,
        getProjectContextForFile: () => null,
        getMode: () => 'workspace',
        getAllSourceFiles: () => [],
        getSourceOriginSummary: () => ({}),
        getBuildFileSummary: () => ({ total: 0, usable: 0, invalid: 0, ambiguous: 0 }),
      },
      documentCache: { getStats: () => ({ size: 0, internedStrings: 0 }) },
      servingCache: {
        getStats: () => ({
          size: 1,
          capacity: 256,
          hits: 1,
          misses: 0,
          evictions: 0,
          ttlMs: 0,
          byFeature: {
            hover: { size: 1, capacity: 76, hits: 1, misses: 0, evictions: 0 },
            completion: { size: 0, capacity: 90, hits: 0, misses: 0, evictions: 0 },
            signatureHelp: { size: 0, capacity: 38, hits: 0, misses: 0, evictions: 0 },
            definition: { size: 0, capacity: 52, hits: 0, misses: 0, evictions: 0 },
          },
        })
      },
      hotContextCache: { getStats: () => ({ activeUri: null, kbVersion: 0, inheritedTypes: 0, capacity: 128 }) },
      inheritanceGraph: {},
      pbAutoBuildRunner: { getSnapshot: () => undefined },
      orcaRunner: { getSnapshot: () => undefined },
      runtimeJournal: new RuntimeJournal(8),
      buildOrcaJournal: { storageUri: null },
      getActiveDocumentUri: () => null,
      getCacheStore: () => null,
      buildRuntimeProgressReadiness: () => ({
        readiness: {
          state: 'ready',
          levels: { workspaceReady: false, projectReady: false, activeContextReady: true },
        },
        projectStatusText: 'ready',
        projectStatus: undefined,
      }),
      buildRuntimeMemorySnapshot: () => ({
        status: 'healthy',
        totalEstimatedBytes: 1,
        totalBudgetBytes: 10,
        layers: [],
      }),
      getCodeLensCacheStats: () => ({ size: 0, capacity: 0, hits: 0, misses: 0, evictions: 0 }),
      getWatcherStats: () => ({ pending: 0, dropped: 0, flushes: 0, lastFlushSize: 0, maxPending: 256 }),
      getLastPersistenceRestoreState: () => undefined,
      getLastPersistenceRestoreReason: () => undefined,
      getLastRestoredCheckpointDocuments: () => 0,
      getLastServingSnapshotRestoreEntries: () => 0,
      getLastServingSnapshotPersistEntries: () => 0,
      getInteractiveServingStats: () => tracker.snapshot(),
      getLastHealthJournalSignature: () => '',
      setLastHealthJournalSignature: () => undefined,
      ensureRuntimeMemoryPressureRelief: () => ({
        level: 'healthy',
        reason: 'healthy',
        purgeServingCache: false,
        allowServingCacheWrites: true,
        deferredWorkloads: [],
      }),
      resolveAdaptiveLimit: () => undefined,
      runExportReportingWorkload: async (_id: string, execute: () => unknown) => execute(),
      runMaintenanceWorkload: async (_id: string, execute: () => unknown) => execute(),
      buildCacheCheckpointMetadata: () => ({}),
    } as any);

    assert.equal(handled.handled, true);
    const result = handled.result as { interactiveServing?: { features?: Record<string, { requests?: number; reasons?: Record<string, number> }> } };
    assert.equal(result.interactiveServing?.features?.hover?.requests, 1);
    assert.deepEqual(result.interactiveServing?.features?.hover?.reasons, { 'cache-hit': 1 });
    assert.equal((handled.result as any).caches?.serving?.byFeature?.hover?.hits, 1);
  });
});