import * as assert from 'assert/strict';

import { tryHandleRuntimeCommand } from '../../../src/server/handlers/runtimeCommandHandlers';
import { InteractiveServingStatsTracker } from '../../../src/server/runtime/interactiveServingStats';
import { RuntimeJournal } from '../../../src/server/runtime/runtimeJournal';

function createRuntimeCommandContext(tracker: InteractiveServingStatsTracker): any {
  return {
    knowledgeBase: {
      version: 7,
      semanticEpoch: 11,
      getStats: () => ({ totalEntities: 0, totalScopes: 0, indexedScopes: 0, version: 7 }),
      queryEntities: () => [],
      countEntities: () => 0,
      getDocumentSnapshot: () => undefined,
    },
    scheduler: { getStatus: () => ({ pendingNear: 0, pendingBackground: 0, interactiveBusy: false }) },
    workspaceState: {
      getProjectModel: () => null,
      getProjectContextForFile: () => null,
      getMode: () => 'workspace',
      getAllSourceFiles: () => [],
      getSourceOriginSummary: () => ({}),
      getBuildFileSummary: () => ({ total: 0, usable: 0, invalid: 0, ambiguous: 0 }),
      resolveLibraryForFile: () => undefined,
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
    getInteractiveServingStats: () => ({
      ...tracker.snapshot(),
      performanceEvents: tracker.runtimeMetricsSnapshot(),
    }),
    recordPerformanceEvent: (event: unknown) => {
      tracker.recordPerformanceEvent(event as never);
    },
    getEventLoopSnapshot: () => ({ enabled: true, resolutionMs: 20, samples: 2, utilization: 0.1 }),
    getRuntimeMemoryPressurePolicy: () => ({
      level: 'healthy',
      reason: 'memory-healthy',
      purgeServingCache: false,
      allowServingCacheWrites: true,
      requestDocumentCacheEviction: false,
      deferredWorkloads: [],
    }),
    getLastHealthJournalSignature: () => '',
    setLastHealthJournalSignature: () => undefined,
    ensureRuntimeMemoryPressureRelief: () => ({
      level: 'healthy',
      reason: 'healthy',
      purgeServingCache: false,
      allowServingCacheWrites: true,
      deferredWorkloads: [],
    }),
    resolveAdaptiveLimit: (requested: unknown, cap: number | undefined, minValue = 1) => {
      if (typeof requested === 'number') {
        return requested;
      }
      return typeof cap === 'number' ? Math.max(minValue, cap) : undefined;
    },
    runNearContextWorkload: async (_id: string, execute: () => unknown) => execute(),
    runExportReportingWorkload: async (_id: string, execute: () => unknown) => execute(),
    runMaintenanceWorkload: async (_id: string, execute: () => unknown) => execute(),
    buildCacheCheckpointMetadata: () => ({}),
  };
}

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
      documentFingerprint: 11,
      budgetMs: 50,
    });

    const handled = await tryHandleRuntimeCommand({ command: 'powerbuilder.showStats' } as any, createRuntimeCommandContext(tracker));

    assert.equal(handled.handled, true);
    const result = handled.result as { interactiveServing?: { features?: Record<string, { requests?: number; reasons?: Record<string, number> }> } };
    assert.equal(result.interactiveServing?.features?.hover?.requests, 1);
    assert.deepEqual(result.interactiveServing?.features?.hover?.reasons, { 'cache-hit': 1 });
    assert.equal((handled.result as any).interactiveServing?.performanceEvents?.totalRecorded, 1);
    assert.equal((handled.result as any).interactiveServing?.performanceEvents?.durationMs?.samples, 1);
    assert.equal((handled.result as any).interactiveServing?.performanceEvents?.payloadBytes?.p95, 42);
    assert.equal((handled.result as any).runtimeMetrics?.eventLoop?.enabled, true);
    assert.equal((handled.result as any).runtimeMetrics?.memoryPressure?.reason, 'memory-healthy');
    assert.equal((handled.result as any).caches?.serving?.byFeature?.hover?.hits, 1);
  });

  test('Object Explorer y manifest read-only registran PerformanceEvent fuera del pipeline interactivo inicial', async () => {
    const tracker = new InteractiveServingStatsTracker();
    const context = createRuntimeCommandContext(tracker);

    const projection = await tryHandleRuntimeCommand({
      command: 'powerbuilder.objectExplorerProjection',
      arguments: [{ scope: 'workspace', activeUri: 'file:///proj/u_demo.sru', pageSize: 5 }],
    } as any, context);
    const manifest = await tryHandleRuntimeCommand({
      command: 'powerbuilder.semanticWorkspaceManifest',
      arguments: [10, 10],
    } as any, context);
    const stats = await tryHandleRuntimeCommand({ command: 'powerbuilder.showStats' } as any, context);

    assert.equal(projection.handled, true);
    assert.equal(manifest.handled, true);

    const recentEvents = (stats.result as any).interactiveServing?.performanceEvents?.recentEvents ?? [];
    const objectExplorerEvent = recentEvents.find((event: { feature?: string }) => event.feature === 'objectExplorer');
    const manifestEvent = recentEvents.find((event: { feature?: string }) => event.feature === 'semanticWorkspaceManifest');

    assert.ok(objectExplorerEvent);
    assert.equal(objectExplorerEvent.lane, 'near');
    assert.equal(objectExplorerEvent.uri, 'file:///proj/u_demo.sru');
    assert.ok((objectExplorerEvent.durationMs ?? -1) >= 0);
    assert.ok((objectExplorerEvent.payloadBytes ?? -1) >= 0);
    assert.equal(objectExplorerEvent.resultSize, 0);

    assert.ok(manifestEvent);
    assert.equal(manifestEvent.lane, 'reporting');
    assert.ok((manifestEvent.durationMs ?? -1) >= 0);
    assert.ok((manifestEvent.payloadBytes ?? -1) >= 0);
    assert.equal(manifestEvent.resultSize, 0);
  });
});