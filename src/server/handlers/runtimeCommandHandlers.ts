import type { ExecuteCommandParams } from 'vscode-languageserver/node';

import { getAnalysisCacheStats } from '../analysis/analysisCache';
import type { SemanticCacheStore } from '../cache/cacheStore';
import type { SemanticCacheCheckpointMetadata } from '../cache/cacheSchema';
import { getDiagnosticsSummary } from '../features/diagnostics';
import { buildSemanticWorkspaceManifest } from '../features/semanticWorkspaceManifest';
import { getIndexerStatus } from '../indexer/workspaceIndexer';
import type { DocumentCache } from '../knowledge/DocumentCache';
import type { HotContextCache } from '../knowledge/HotContextCache';
import type { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { getLastTrace } from '../knowledge/queryTrace';
import type { ServingCache } from '../knowledge/ServingCache';
import type { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { OrcaRunner } from '../build/orcaRunner';
import type { PbAutoBuildRunner } from '../build/pbAutoBuildRunner';
import type { BuildOrcaJournalStore } from '../runtime/buildOrcaJournalStore';
import { buildRuntimeMemoryReport } from '../runtime/memoryBudgets';
import type { RuntimeMemoryPressurePolicy } from '../runtime/memoryPressurePolicy';
import type { RuntimeJournal } from '../runtime/runtimeJournal';
import { buildRuntimeHealthReport } from '../runtime/runtimeHealth';
import type { TaskScheduler } from '../runtime/scheduler';
import type { FileWatcherDebouncerStats } from '../system/fileWatcherDebouncer';
import type { WorkspaceState } from '../workspace/workspaceState';

type RuntimeProgressReadinessSnapshotLike = {
  readiness: {
    state: string;
    detail?: string;
    levels?: unknown;
  };
  projectStatusText?: unknown;
  projectStatus?: unknown;
};

type CodeLensCacheStats = {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
};

export interface RuntimeCommandHandlerContext {
  knowledgeBase: KnowledgeBase;
  scheduler: TaskScheduler;
  workspaceState: WorkspaceState;
  documentCache: DocumentCache;
  servingCache: ServingCache;
  hotContextCache: HotContextCache;
  inheritanceGraph: InheritanceGraph;
  pbAutoBuildRunner: PbAutoBuildRunner;
  orcaRunner: OrcaRunner;
  runtimeJournal: RuntimeJournal;
  buildOrcaJournal: BuildOrcaJournalStore;
  getActiveDocumentUri(): string | null;
  getCacheStore(): SemanticCacheStore | null;
  buildRuntimeProgressReadiness(activeUriOverride?: string | null): RuntimeProgressReadinessSnapshotLike;
  buildRuntimeMemorySnapshot(): ReturnType<typeof buildRuntimeMemoryReport>;
  getCodeLensCacheStats(): CodeLensCacheStats;
  getWatcherStats(): FileWatcherDebouncerStats;
  getLastPersistenceRestoreState(): 'restored' | 'reused' | 'rebuilt' | undefined;
  getLastPersistenceRestoreReason(): string | undefined;
  getLastRestoredCheckpointDocuments(): number;
  getLastServingSnapshotRestoreEntries(): number;
  getLastServingSnapshotPersistEntries(): number;
  getLastHealthJournalSignature(): string;
  setLastHealthJournalSignature(signature: string): void;
  ensureRuntimeMemoryPressureRelief(): RuntimeMemoryPressurePolicy;
  resolveAdaptiveLimit(requested: unknown, cap: number | undefined, minValue?: number): number | undefined;
  runExportReportingWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T>;
  runMaintenanceWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T>;
  buildCacheCheckpointMetadata(): Partial<SemanticCacheCheckpointMetadata>;
}

export async function tryHandleRuntimeCommand(
  params: ExecuteCommandParams,
  context: RuntimeCommandHandlerContext,
): Promise<{ handled: boolean; result?: unknown }> {
  const {
    knowledgeBase,
    scheduler,
    workspaceState,
    documentCache,
    servingCache,
    hotContextCache,
    inheritanceGraph,
    pbAutoBuildRunner,
    orcaRunner,
    runtimeJournal,
    buildOrcaJournal,
    getActiveDocumentUri,
    getCacheStore,
    buildRuntimeProgressReadiness,
    buildRuntimeMemorySnapshot,
    getCodeLensCacheStats,
    getWatcherStats,
    getLastPersistenceRestoreState,
    getLastPersistenceRestoreReason,
    getLastRestoredCheckpointDocuments,
    getLastServingSnapshotRestoreEntries,
    getLastServingSnapshotPersistEntries,
    getLastHealthJournalSignature,
    setLastHealthJournalSignature,
    ensureRuntimeMemoryPressureRelief,
    resolveAdaptiveLimit,
    runExportReportingWorkload,
    runMaintenanceWorkload,
    buildCacheCheckpointMetadata,
  } = context;

  switch (params.command) {
    case 'powerbuilder.showStats': {
      const stats = knowledgeBase.getStats();
      const sched = scheduler.getStatus();
      const projectStats = workspaceState.getProjectModel()?.getStats();
      const activeProject = workspaceState.getProjectContextForFile(getActiveDocumentUri());
      const progressReadiness = buildRuntimeProgressReadiness();
      const buildOrcaJournalUri = buildOrcaJournal.storageUri;
      const cacheStore = getCacheStore();
      const cacheMaintenance = cacheStore ? await cacheStore.inspectMaintenance() : undefined;
      const memory = buildRuntimeMemorySnapshot();
      const baseStats = {
        kb: stats,
        scheduler: sched,
        readiness: {
          state: progressReadiness.readiness.state,
          detail: progressReadiness.readiness.detail,
          levels: progressReadiness.readiness.levels
        },
        workspace: {
          mode: workspaceState.getMode(),
          files: workspaceState.getAllSourceFiles().length,
          sourceOrigins: workspaceState.getSourceOriginSummary(),
          activeProject
        },
        indexer: getIndexerStatus(),
        progressReadiness,
        projectStatus: {
          summary: progressReadiness.projectStatusText,
          snapshot: progressReadiness.projectStatus
        },
        diagnostics: getDiagnosticsSummary(),
        caches: {
          analysis: getAnalysisCacheStats(),
          serving: servingCache.getStats(),
          documents: documentCache.getStats(),
          hotContext: hotContextCache.getStats(),
          codeLens: getCodeLensCacheStats(),
          watcher: getWatcherStats()
        },
        memory,
        projectModel: projectStats,
        buildFiles: workspaceState.getBuildFileSummary(),
        buildRunner: pbAutoBuildRunner.getSnapshot(),
        orcaRunner: orcaRunner.getSnapshot(),
        lastQueryTrace: getLastTrace(),
        persistence: cacheStore || buildOrcaJournalUri
          ? {
            ...(buildOrcaJournalUri ? { buildOrcaJournalUri } : {}),
            ...(cacheStore
              ? {
                storageUri: cacheStore.storageUri,
                checkpointUri: cacheStore.checkpointUri,
                journalUri: cacheStore.journalUri,
                workspaceKey: cacheStore.workspaceKey,
                restoreState: getLastPersistenceRestoreState(),
                restoreReason: getLastPersistenceRestoreReason(),
                restoredDocuments: getLastRestoredCheckpointDocuments(),
                policy: cacheStore.retentionPolicy,
                maintenance: cacheMaintenance,
                servingSnapshot: {
                  lastRestoredEntries: getLastServingSnapshotRestoreEntries(),
                  lastPersistedEntries: getLastServingSnapshotPersistEntries()
                }
              }
              : {})
          }
          : undefined
      };
      const health = buildRuntimeHealthReport({
        readiness: baseStats.readiness,
        indexer: baseStats.indexer,
        scheduler: baseStats.scheduler,
        projectModel: baseStats.projectModel,
        caches: baseStats.caches,
        memory: baseStats.memory,
        lastQueryTrace: baseStats.lastQueryTrace ?? undefined,
        persistence: baseStats.persistence,
        diagnostics: undefined
      });
      const healthSignature = `${health.status}|${health.summary}`;
      if (healthSignature !== getLastHealthJournalSignature()) {
        runtimeJournal.record({
          phase: 'health',
          kind: 'runtime-health',
          action: 'stats-snapshot',
          severity: health.status === 'error' ? 'error' : health.status === 'warning' ? 'warning' : 'info',
          detail: {
            summary: health.summary,
            counts: health.counts,
          }
        });
        setLastHealthJournalSignature(healthSignature);
      }
      return {
        handled: true,
        result: {
          ...baseStats,
          health,
          runtimeJournal: runtimeJournal.snapshot(50)
        }
      };
    }
    case 'powerbuilder.semanticWorkspaceManifest': {
      const [maxObjectsArg, maxSymbolsArg] = params.arguments ?? [];
      const progressReadiness = buildRuntimeProgressReadiness();
      const reportLimits = ensureRuntimeMemoryPressureRelief().reportLimits?.semanticWorkspaceManifest;
      const maxObjects = resolveAdaptiveLimit(maxObjectsArg, reportLimits?.maxObjects, 1);
      const maxSymbols = resolveAdaptiveLimit(maxSymbolsArg, reportLimits?.maxSymbols, 1);
      return {
        handled: true,
        result: await runExportReportingWorkload('semantic-workspace-manifest', () => buildSemanticWorkspaceManifest(
          {
            ...(typeof maxObjects === 'number' ? { maxObjects } : {}),
            ...(typeof maxSymbols === 'number' ? { maxSymbols } : {}),
          },
          knowledgeBase,
          inheritanceGraph,
          workspaceState,
          getDiagnosticsSummary(),
          {
            state: progressReadiness.readiness.state,
            detail: progressReadiness.readiness.detail,
          }
        ))
      };
    }
    case 'powerbuilder.runSemanticCacheMaintenance': {
      const cacheStore = getCacheStore();
      if (!cacheStore) {
        throw new Error('No hay una caché semántica persistida activa para mantener.');
      }

      return {
        handled: true,
        result: await runMaintenanceWorkload('semantic-cache-maintenance', () => cacheStore.runMaintenance(buildCacheCheckpointMetadata()))
      };
    }
    case 'powerbuilder.validatePersistentCache': {
      const cacheStore = getCacheStore();
      if (!cacheStore) {
        return {
          handled: true,
          result: {
            valid: false,
            decision: { action: 'rebuild', reason: 'missing-persisted-state' },
            documentCount: 0,
          }
        };
      }

      return {
        handled: true,
        result: await runMaintenanceWorkload('semantic-cache-validate', async () => {
          const restore = await cacheStore.load(buildCacheCheckpointMetadata());
          const maintenance = await cacheStore.inspectMaintenance();
          return {
            valid: restore.decision.action === 'reuse',
            decision: restore.decision,
            documentCount: restore.checkpoint.documents.length,
            workspaceKey: cacheStore.workspaceKey,
            checkpointUri: cacheStore.checkpointUri,
            journalUri: cacheStore.journalUri,
            maintenance: maintenance.currentWorkspace,
          };
        })
      };
    }
    case 'powerbuilder.clearSemanticCache': {
      const cacheStore = getCacheStore();
      if (!cacheStore) {
        return {
          handled: true,
          result: {
            cleared: false,
            reason: 'no-persisted-cache-active',
          }
        };
      }

      return {
        handled: true,
        result: await runMaintenanceWorkload('semantic-cache-clear', async () => {
          await cacheStore.clear();
          return {
            cleared: true,
            workspaceKey: cacheStore.workspaceKey,
            storageUri: cacheStore.storageUri,
            checkpointUri: cacheStore.checkpointUri,
            journalUri: cacheStore.journalUri,
          };
        })
      };
    }
    default:
      return { handled: false };
  }
}