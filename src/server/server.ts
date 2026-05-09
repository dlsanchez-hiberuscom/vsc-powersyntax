import {
  createConnection,
  FileChangeType,
  ProposedFeatures,
  TextDocuments,
  Diagnostic,
  Position
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { SERVER_NAME } from '../shared/types';
import { inferSourceOrigin } from '../shared/sourceOrigin';
import { isPowerBuilderSemanticUri } from '../shared/powerbuilderFiles';
import {
  PROGRESS_NOTIFICATION,
  CATALOG_UPDATED_NOTIFICATION,
  type ProgressNotification
} from '../shared/types';
import { setAnalysisBackends } from './analysis/analysisCache';
import { getAnalysisCacheStats } from './analysis/analysisCache';
import { republishOpenDiagnosticsForDocuments } from './analysis/openDocumentDiagnostics';
import { provideDefinition } from './features/definition';
import { provideReferences } from './features/references';
import { provideReferenceCodeLenses } from './features/codeLensReferences';
import { CodeLensResultCache } from './features/codeLensResultCache';
import { collectReferenceSourcePool } from './features/referenceSourcePool';
import type { QueryConsumerId } from './features/queryScopePolicy';
import { buildSemanticWorkspaceManifest } from './features/semanticWorkspaceManifest';
import {
  clearDiagnosticsSummary,
  getDiagnosticsSummary
} from './features/diagnostics';
import { measureMs, measureMsAsync, formatTiming, FirstInvocationTracker } from './runtime/timing';
import { TaskScheduler, TaskPriority } from './runtime/scheduler';
import { getRuntimeWorkloadPolicy } from './runtime/backpressurePolicy';
import { createManagedBuildWorkloads } from './runtime/managedBuildWorkloads';
import { createManagedRuntimeWorkloads } from './runtime/managedRuntimeWorkloads';
import { createLatencyGovernor } from './runtime/latencyGovernor';
import { RuntimeEventLoopMonitor } from './runtime/eventLoopMonitor';
import { buildRuntimeHealthReport } from './runtime/runtimeHealth';
import { buildRuntimeMemoryReport } from './runtime/memoryBudgets';
import {
  applyAdaptiveLimit,
  buildRuntimeMemoryPressurePolicy,
  isWorkloadDeferredByMemoryPressure,
  type RuntimeMemoryPressurePolicy,
} from './runtime/memoryPressurePolicy';
import { BuildOrcaJournalStore } from './runtime/buildOrcaJournalStore';
import { InteractiveServingStatsTracker } from './runtime/interactiveServingStats';
import { RuntimeJournal } from './runtime/runtimeJournal';
import { createRuntimeProgressController } from './runtime/runtimeProgressController';
import type { DiscoveryProgressState } from './features/progressReadiness';
import { InteractiveServingStaleGuard } from './serving/staleGuard';
import { PresentationCache } from './serving/presentationCache';
import {
  PbAutoBuildRunner,
} from './build/pbAutoBuildRunner';
import { OrcaRunner } from './build/orcaRunner';
import { restoreOrcaStagingAliases } from './build/orcaStagingExport';
import { NodeFileSystem } from './system/fileSystem';
import { createSemanticCacheStore } from './cache/cacheStore';
import { createCacheCheckpoint } from './cache/cacheCheckpoint';
import type { SemanticCacheCheckpointMetadata } from './cache/cacheSchema';
import {
  restoreServingCacheSnapshot
} from './cache/servingCachePersistence';
import { cacheServingResult, invalidateServingCacheEntries } from './cache/servingCacheRuntime';
import { createSemanticCacheRuntimeController } from './cache/semanticCacheRuntimeController';
import { createDocumentQueryContext } from './features/queryContext';
import { discoverWorkspace } from './workspace/discovery';
import { WorkspaceState } from './workspace/workspaceState';
import { createReadinessTracker } from './workspace/readiness';
import { DocumentCache } from './knowledge/DocumentCache';
import { KnowledgeBase } from './knowledge/KnowledgeBase';
import { InheritanceGraph } from './knowledge/resolution/InheritanceGraph';
import { HotContextCache } from './knowledge/HotContextCache';
import { Entity, EntityKind } from './knowledge/types';
import { ServingCache, makeKey as makeServingKey } from './knowledge/ServingCache';
import { getLastTrace, subscribeTraceSnapshots } from './knowledge/queryTrace';
import { SystemCatalog } from './knowledge/system/SystemCatalog';
import {
  DEFAULT_DOCUMENTATION_LOCALE_SETTING,
  resolveDocumentationLocale,
  type DocumentationLocale,
  type DocumentationLocaleSetting,
} from './knowledge/system/localization';
import { getFileIndexState, getIndexerStatus, indexWorkspace } from './indexer/workspaceIndexer';
import { createFileWatcherDebouncer } from './system/fileWatcherDebouncer';
import { applyWatchedFileEvents } from './workspace/watchedFileIntake';
import { toWatchedFsEvent } from './workspace/watchedFileChangeBridge';
import { findPowerBuilderIdentifierSpan } from './utils/pbIdentifier';
import type { CompletionResolveNegativeReason } from './features/completion';
import type { HoverNegativeReason, HoverViewModel } from './features/hoverViewModel';
import {
  registerAuxiliaryFeatureHandlers,
  registerPrimaryFeatureHandlers,
} from './handlers/featureHandlerRegistration';
import { registerDocumentHandlers, registerShutdownHandler } from './handlers/documentHandlers';
import { registerInitializeHandler, registerInitializedHandler } from './handlers/lifecycleHandlers';
import { registerServerCommandHandler } from './handlers/commandHandlerRegistration';

// ---------------------------------------------------------------------------
// Inicialización (Bootstrap)
// ---------------------------------------------------------------------------

const serverStartTime = performance.now();

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const scheduler = new TaskScheduler();
const eventLoopMonitor = new RuntimeEventLoopMonitor();
eventLoopMonitor.start();
const servingLatencyGovernor = createLatencyGovernor();
const firstInvocation = new FirstInvocationTracker();

const readiness = createReadinessTracker();
const sendProgress = (p: ProgressNotification): void => {
  void connection.sendNotification(PROGRESS_NOTIFICATION, p);
};

function isSemanticallyServedDocument(document: TextDocument): boolean {
  const scheme = document.uri.split(':', 1)[0]?.toLowerCase();
  return scheme !== 'file' || isPowerBuilderSemanticUri(document.uri);
}
const fs = new NodeFileSystem();
const workspaceState = new WorkspaceState();
const documentCache = new DocumentCache(512);
const knowledgeBase = new KnowledgeBase();

knowledgeBase.onEpochChange((epoch) => {
  connection.sendNotification(CATALOG_UPDATED_NOTIFICATION, { epoch });
});

const inheritanceGraph = new InheritanceGraph(knowledgeBase);
const systemCatalog = new SystemCatalog();
const hotContextCache = new HotContextCache();
const runtimeJournal = new RuntimeJournal(160);
const interactiveServingStats = new InteractiveServingStatsTracker(64);
const servingStaleGuard = new InteractiveServingStaleGuard();
const hoverViewModelCache = new PresentationCache<HoverViewModel>(128);
const hoverNegativeCache = new PresentationCache<{ reason: HoverNegativeReason }>(256);
const completionResolveNegativeCache = new PresentationCache<{ reason: CompletionResolveNegativeReason }>(256);
const definitionNegativeCache = new PresentationCache<{ reason: string }>(256);

function invalidateHoverPresentationCaches(uri?: string): void {
  hoverViewModelCache.invalidate(uri);
  hoverNegativeCache.invalidate(uri);
  completionResolveNegativeCache.invalidate(uri);
  definitionNegativeCache.invalidate(uri);
}

function republishOpenDiagnostics(uris?: readonly string[]): void {
  republishOpenDiagnosticsForDocuments({
    connection,
    documents: documents.all(),
    scheduler,
    knowledgeBase,
    systemCatalog,
    inheritanceGraph,
    workspaceState,
    isSemanticallyServedDocument,
    uris
  });
}

const buildOrcaJournal = new BuildOrcaJournalStore(fs, { maxEntries: 128 });
runtimeJournal.addObserver((event) => {
  buildOrcaJournal.record(event);
});
const pbAutoBuildRunner = new PbAutoBuildRunner({ journal: runtimeJournal });
const orcaRunner = new OrcaRunner({ journal: runtimeJournal });
const servingCache = new ServingCache<unknown>(256, 0, (event) => {
  runtimeJournal.record({
    phase: event.action === 'invalidate' ? 'invalidation' : 'cache',
    kind: 'serving-cache',
    action: event.action,
    severity: event.action === 'evict' ? 'warning' : 'info',
    ...(event.action === 'hit' ? { hits: 1 } : {}),
    ...(event.action === 'miss' ? { misses: 1 } : {}),
    ...(event.action === 'evict' ? { evictions: 1 } : {}),
    ...(event.action === 'invalidate' && event.removed !== undefined ? { invalidationCount: event.removed } : {}),
    detail: {
      ...(event.key ? { key: event.key } : {}),
      ...(event.uri ? { uri: event.uri } : {}),
      size: event.size,
      capacity: event.capacity,
      hits: event.hits,
      misses: event.misses,
      evictions: event.evictions
    }
  });
});
const codeLensCache = new CodeLensResultCache<ReturnType<typeof provideReferenceCodeLenses>>(128);
let lastHealthJournalSignature = '';
let lastMemoryPressureReliefReason: string | null = null;
let lastMemoryPressureSampleAt = 0;
let lastMemoryPressurePolicy: RuntimeMemoryPressurePolicy | null = null;
let documentationLocaleSetting: DocumentationLocaleSetting = DEFAULT_DOCUMENTATION_LOCALE_SETTING;
let uiLocale: string | null = null;
const MEMORY_PRESSURE_SAMPLE_TTL_MS = 200;

function getDocumentationLocale(): DocumentationLocale {
  return resolveDocumentationLocale(documentationLocaleSetting, uiLocale);
}

type DefinitionCacheEntry = {
  result: ReturnType<typeof provideDefinition>;
  resolutionConfidence?: ReturnType<typeof createDocumentQueryContext>['resolutionConfidence'];
};

function isDefinitionCacheEntry(value: unknown): value is DefinitionCacheEntry {
  return typeof value === 'object' && value !== null && 'result' in value;
}

const watcherIntake = createFileWatcherDebouncer({
  delayMs: 75,
  maxPending: 256,
  onFlush: (events) => {
    void scheduler.enqueueBackground({
      id: `watcher-intake-${Date.now()}`,
      priority: TaskPriority.Background,
      workload: 'background-indexing',
      execute: async (token) => {
        if (token.isCancelled) return;
        const result = await applyWatchedFileEvents({
          events,
          fs,
          documentCache,
          knowledgeBase,
          workspaceState,
          hotContextCache,
          servingCache,
          servingCacheFlushCoordinator,
          invalidateHoverPresentationCaches,
          isDocumentOpen: (uri) => documents.get(uri) !== undefined,
          getOpenDocument: (uri) => documents.get(uri),
          clearDiagnostics: (uri) => {
            clearDiagnosticsSummary(uri);
            connection.sendDiagnostics({ uri, diagnostics: [] as Diagnostic[] });
          },
          refreshDiagnostics: (uris) => {
            republishOpenDiagnostics(uris);
          },
          log: (message) => connection.console.log(message)
        });
        if (result.reindexed > 0 || result.removed > 0) {
          connection.console.log(
            `[WATCHER] Flush ${result.massive ? 'masivo' : 'incremental'} aplicado: ${result.reindexed} reindexados, ${result.removed} eliminados, ${result.skipped} omitidos, proyectos: ${result.touchedProjects.join(', ') || 'ninguno'}.`
          );
        }
        if (result.reindexed > 0 || result.removed > 0 || result.skipped > 0) {
          invalidateCodeLensCache();
          runtimeJournal.record({
            phase: 'invalidation',
            kind: 'watched-files',
            action: result.massive ? 'watcher-massive' : 'watcher-incremental',
            severity: result.massive ? 'warning' : 'info',
            invalidationCount: result.reindexed + result.removed,
            detail: {
              reindexed: result.reindexed,
              removed: result.removed,
              skipped: result.skipped,
              touchedProjects: result.touchedProjects,
            }
          });
        }
        if (result.reindexed > 0 || result.removed > 0 || result.skipped > 0) {
          publishRuntimeProgressReadiness();
        }
      }
    }).catch((error) => {
      connection.console.error(`[WATCHER] Error en intake: ${error instanceof Error ? error.message : String(error)}`);
    });
  }
});
let cacheStorageUri: string | null = null;
const semanticCacheRuntimeController = createSemanticCacheRuntimeController(
  servingCache,
  () => knowledgeBase.semanticEpoch,
  buildCacheCheckpointMetadata
);

function buildCacheCheckpointMetadata(): Partial<SemanticCacheCheckpointMetadata> {
  return {
    workspaceMode: workspaceState.getMode(),
    rootUris: workspaceFolders,
    projectStats: workspaceState.getProjectModel()?.getStats(),
    discovery: workspaceState.exportDiscoverySnapshot()
  };
}

const servingCacheFlushCoordinator = semanticCacheRuntimeController.flushCoordinator;
const disposeTraceSnapshotSubscription = subscribeTraceSnapshots((trace) => {
  runtimeJournal.record({
    phase: 'query',
    kind: 'query-trace',
    action: trace.label,
    label: trace.label,
    severity: trace.resolution?.confidence === 'low' || trace.resolution?.hasAmbiguity ? 'warning' : 'info',
    durationMs: trace.durationMs,
    detail: {
      stepCount: trace.stepCount,
      phases: trace.phases,
      actions: trace.actions,
      ...(trace.lastStepName ? { lastStepName: trace.lastStepName } : {}),
      ...(trace.resolution ? { resolution: trace.resolution } : {}),
    }
  });
});

// Conectar caché interactiva con backends globales para evitar doble parseo
setAnalysisBackends(documentCache, knowledgeBase, {
  appendUpsert(record, semanticEpoch) {
    return semanticCacheRuntimeController.appendUpsert(record, semanticEpoch);
  },
  appendRemove(uri, semanticEpoch) {
    return semanticCacheRuntimeController.appendRemove(uri, semanticEpoch);
  }
}, (uri) => (
  workspaceState.getSourceOrigin(uri) && workspaceState.getSourceOrigin(uri) !== 'unknown'
    ? workspaceState.getSourceOrigin(uri)!
    : inferSourceOrigin(uri, {
      hasSolutionRoots: workspaceState.getMode() === 'solution' || workspaceState.getMode() === 'mixed'
    })
));

let activeDocumentUri: string | null = null;
let workspaceFolders: string[] = [];
const discoveryProgress: DiscoveryProgressState = {
  current: 0,
  total: 0
};

const runtimeProgressController = createRuntimeProgressController({
  discoveryProgress,
  getIndexerStatus,
  getActiveDocumentUri: () => activeDocumentUri,
  getActiveProject: (activeUri) => {
    const activeProject = workspaceState.getProjectContextForFile(activeUri);
    if (!activeProject) {
      return null;
    }

    return {
      name: activeProject.name,
      files: workspaceState.getProjectModel()?.getFilesForProject(activeProject.projectUri) ?? [],
    };
  },
  getWorkspaceFiles: () => workspaceState.getAllSourceFiles(),
  isSemanticallyReady: (uri) => {
    const snapshot = knowledgeBase.getDocumentSnapshot(uri);
    return documentCache.hasSnapshot(uri)
      || snapshot?.readiness === 'nearby-semantic-ready'
      || getFileIndexState(uri) === 'indexed';
  },
  isSchedulerIdle: () => {
    const status = scheduler.getStatus();
    return !status.interactiveBusy && status.activeNearId === null && status.activeBackgroundId === null;
  },
  transitionReadiness: (state, detail) => {
    readiness.transition(state, detail);
  },
  sendProgress,
});

function buildRuntimeProgressReadiness(activeUriOverride?: string | null) {
  return runtimeProgressController.buildRuntimeProgressReadiness(activeUriOverride);
}

function publishRuntimeProgressReadiness(): void {
  runtimeProgressController.publishRuntimeProgressReadiness();
}

function buildRuntimeMemorySnapshot() {
  return buildRuntimeMemoryReport({
    analysis: getAnalysisCacheStats(),
    serving: servingCache.getStats(),
    documents: documentCache.getStats(),
    hotContext: hotContextCache.getStats(),
    codeLens: getCodeLensCacheStats(),
    kb: knowledgeBase.getStats(),
  });
}

function invalidateRuntimeMemoryPressureSample(): void {
  lastMemoryPressureSampleAt = 0;
  lastMemoryPressurePolicy = null;
}

function getRuntimeMemoryPressurePolicy(force = false): RuntimeMemoryPressurePolicy {
  const now = Date.now();
  if (!force && lastMemoryPressurePolicy && now - lastMemoryPressureSampleAt < MEMORY_PRESSURE_SAMPLE_TTL_MS) {
    return lastMemoryPressurePolicy;
  }

  lastMemoryPressurePolicy = buildRuntimeMemoryPressurePolicy(buildRuntimeMemorySnapshot());
  lastMemoryPressureSampleAt = now;

  if (lastMemoryPressurePolicy.level === 'healthy') {
    lastMemoryPressureReliefReason = null;
  }

  return lastMemoryPressurePolicy;
}

function ensureRuntimeMemoryPressureRelief(): RuntimeMemoryPressurePolicy {
  let policy = getRuntimeMemoryPressurePolicy();

  // CACHE-P0-MEMORY-PRESSURE-GRADUATED-POLICY-01:
  // Cooperate with document cache eviction requests before purging serving cache.
  if (policy.requestDocumentCacheEviction) {
    const targetSize = Math.max(Math.floor(documentCache.getStats().capacity * 0.5), documentCache.getStats().pinnedCount);
    const evicted = documentCache.evictUnpinned(targetSize);
    if (evicted > 0) {
      connection.console.log(`[MEMORY] Document cache eviction: ${evicted} unpinned entries evicted (target: ${targetSize}).`);
      runtimeJournal.record({
        phase: 'health',
        kind: 'memory-pressure',
        action: 'document-cache-eviction',
        severity: 'info',
        detail: { evicted, targetSize, remaining: documentCache.size }
      });
      // Re-evaluate pressure after eviction
      invalidateRuntimeMemoryPressureSample();
      policy = getRuntimeMemoryPressurePolicy(true);
    }
  }

  if (!policy.purgeServingCache) {
    lastMemoryPressureReliefReason = null;
    return policy;
  }

  if ((servingCache.size() === 0
    && hoverViewModelCache.size() === 0
    && hoverNegativeCache.size() === 0
    && completionResolveNegativeCache.size() === 0)
    || lastMemoryPressureReliefReason === policy.reason) {
    return policy;
  }

  invalidateServingCacheEntries(servingCache, undefined, servingCacheFlushCoordinator);
  invalidateHoverPresentationCaches();
  lastMemoryPressureReliefReason = policy.reason;
  connection.console.log(`[MEMORY] ${policy.reason}; serving cache vaciado para sostener el carril interactivo.`);
  runtimeJournal.record({
    phase: 'health',
    kind: 'memory-pressure',
    action: 'serving-cache-relief',
    severity: 'warning',
    detail: {
      level: policy.level,
      reason: policy.reason,
      ...(policy.triggerLayer ? { triggerLayer: policy.triggerLayer } : {}),
      deferredWorkloads: policy.deferredWorkloads,
    }
  });

  invalidateRuntimeMemoryPressureSample();
  policy = getRuntimeMemoryPressurePolicy(true);
  if (!policy.purgeServingCache) {
    lastMemoryPressureReliefReason = null;
  }
  return policy;
}

function resolveAdaptiveLimit(requested: unknown, cap: number | undefined, minValue = 0): number | undefined {
  if (typeof cap !== 'number' || !Number.isFinite(cap)) {
    return typeof requested === 'number' && Number.isFinite(requested)
      ? Math.max(minValue, Math.trunc(requested))
      : undefined;
  }

  return applyAdaptiveLimit(requested, cap, minValue);
}

function cacheServingResultWithMemoryPressure<T>(key: string, value: T): void {
  const policy = ensureRuntimeMemoryPressureRelief();
  if (!policy.allowServingCacheWrites) {
    return;
  }

  cacheServingResult(servingCache, key, value, servingCacheFlushCoordinator);
  invalidateRuntimeMemoryPressureSample();
}

function cacheHoverViewModelWithMemoryPressure(key: string, value: HoverViewModel): void {
  const policy = ensureRuntimeMemoryPressureRelief();
  if (!policy.allowServingCacheWrites) {
    return;
  }

  hoverViewModelCache.set(key, value);
  invalidateRuntimeMemoryPressureSample();
}

function cacheHoverNegativeWithMemoryPressure(key: string, value: { reason: HoverNegativeReason }): void {
  const policy = ensureRuntimeMemoryPressureRelief();
  if (!policy.allowServingCacheWrites) {
    return;
  }

  hoverNegativeCache.set(key, value);
  invalidateRuntimeMemoryPressureSample();
}

function cacheCompletionResolveNegativeWithMemoryPressure(
  key: string,
  value: { reason: CompletionResolveNegativeReason }
): void {
  const policy = ensureRuntimeMemoryPressureRelief();
  if (!policy.allowServingCacheWrites) {
    return;
  }

  completionResolveNegativeCache.set(key, value);
  invalidateRuntimeMemoryPressureSample();
}

function cacheDefinitionNegativeWithMemoryPressure(key: string, value: { reason: string }): void {
  const policy = ensureRuntimeMemoryPressureRelief();
  if (!policy.allowServingCacheWrites) {
    return;
  }

  definitionNegativeCache.set(key, value);
  invalidateRuntimeMemoryPressureSample();
}

function isLatencyPressureHigh(): boolean {
  return !servingLatencyGovernor.isBackgroundAllowed();
}

function recordInteractiveLatency(feature: string, elapsedMs: number): void {
  servingLatencyGovernor.recordElapsedMs(elapsedMs);
  scheduler.requestDrain();
  if (isLatencyPressureHigh()) {
    connection.console.log(`[LATENCY] Presion alta tras ${feature}: ${elapsedMs.toFixed(2)}ms.`);
  }
}

const managedRuntimeWorkloads = createManagedRuntimeWorkloads(scheduler);
const {
  runBackgroundWorkload,
  runNearContextWorkload,
  runExportReportingWorkload,
  runMaintenanceWorkload,
} = managedRuntimeWorkloads;
const managedBuildWorkloads = createManagedBuildWorkloads({
  runBackgroundWorkload,
  pbAutoBuildRunner,
  orcaRunner,
});
const { runPbAutoBuildWithBackpressure, runOrcaWithBackpressure } = managedBuildWorkloads;

function makeCodeLensSymbolKey(entity: Entity): string {
  return `${entity.uri}#${entity.line}:${entity.character}:${entity.kind}:${entity.name}`;
}

function getCodeLensUnavailableReason(reason: string): string {
  return reason.toLowerCase().includes('latencia') ? 'referencias pausadas' : 'referencias no listas';
}

function buildCodeLensCacheKey(document: TextDocument, readinessReason: string, readinessAction: string): string {
  return [
    document.uri,
    document.version,
    knowledgeBase.version,
    knowledgeBase.semanticEpoch,
    readinessAction,
    readinessReason,
    workspaceState.getAllSourceFiles().length
  ].join('|');
}

function invalidateCodeLensCache(uri?: string): void {
  codeLensCache.invalidate(uri);
}

function getCodeLensCacheStats(): { size: number; capacity: number; hits: number; misses: number; evictions: number } {
  return codeLensCache.getStats();
}

function getCodeLensHierarchyMeta(entity: Entity): { relation?: 'override'; overrideCount: number } {
  if (!entity.containerName) {
    return { overrideCount: 0 };
  }

  const closureEntry = inheritanceGraph.getMemberClosure(entity.containerName).find((entry) =>
    entry.entity.uri === entity.uri &&
    entry.entity.line === entity.line &&
    entry.entity.character === entity.character &&
    entry.entity.kind === entity.kind &&
    entry.entity.name === entity.name
  );

  const overrideCount = inheritanceGraph.getDescendants(entity.containerName).filter((descendant) =>
    inheritanceGraph.getMemberClosure(descendant).some((entry) =>
      entry.relation === 'override' &&
      entry.entity.kind === entity.kind &&
      entry.entity.name.toLowerCase() === entity.name.toLowerCase()
    )
  ).length;

  return {
    relation: closureEntry?.relation === 'override' ? 'override' : undefined,
    overrideCount
  };
}

async function collectReferenceSourcesForQuery(
  document: TextDocument,
  consumer: QueryConsumerId,
  queryContext?: ReturnType<typeof createDocumentQueryContext>
): Promise<Array<{ uri: string; content: string; lines?: string[]; maskedLines?: string[] }>> {
  const pool = await collectReferenceSourcePool({
    consumer,
    currentUri: document.uri,
    resolvedTargetUris: queryContext?.resolvedTargets?.targets.map((target) => target.uri) ?? [],
    workspaceState,
    fs,
    getOpenDocument: (uri) => documents.get(uri),
    getSnapshot: (uri) => knowledgeBase.getDocumentSnapshot(uri) ?? documentCache.getSnapshot(uri)
  });

  return pool.sources;
}

function buildReferenceProbe(entity: Entity): { document: TextDocument; position: Position } {
  const callable = entity.kind === EntityKind.Function || entity.kind === EntityKind.Subroutine || entity.kind === EntityKind.Event;
  const probeText = entity.containerName
    ? `this.${entity.name}${callable ? '()' : ''}`
    : `${entity.name}${callable ? '()' : ''}`;

  return {
    document: TextDocument.create(entity.uri, 'powerbuilder', 0, probeText),
    position: Position.create(0, probeText.indexOf(entity.name) + 1)
  };
}

async function buildCodeLensReferenceCounts(
  symbols: Array<{
    key: string;
    entity: Entity;
  }>
): Promise<Map<string, number>> {
  const sourceCache = new Map<string, Promise<Array<{ uri: string; content: string; lines?: string[]; maskedLines?: string[] }>>>();

  const getSourcesForEntity = (entity: Entity) => {
    const project = workspaceState.getProjectContextForFile(entity.uri);
    const cacheKey = project?.projectUri ?? (workspaceState.getAllSourceFiles().length > 1 ? 'workspace-fallback' : entity.uri);
    let pending = sourceCache.get(cacheKey);
    if (!pending) {
      pending = collectReferenceSourcePool({
        consumer: 'code-lens-references',
        currentUri: entity.uri,
        resolvedTargetUris: [entity.uri],
        workspaceState,
        fs,
        getOpenDocument: (uri) => documents.get(uri),
        getSnapshot: (uri) => knowledgeBase.getDocumentSnapshot(uri) ?? documentCache.getSnapshot(uri)
      }).then((pool) => pool.sources);
      sourceCache.set(cacheKey, pending);
    }
    return pending;
  };

  const entries = await Promise.all(symbols.map(async (symbol) => {
    const sources = await getSourcesForEntity(symbol.entity);
    const probe = buildReferenceProbe(symbol.entity);
    const references = provideReferences(
      probe.document,
      probe.position,
      knowledgeBase,
      inheritanceGraph,
      sources,
      { includeDeclaration: true },
      hotContextCache
    );

    const declarationKey = `${symbol.entity.uri}#${symbol.entity.line}:${symbol.entity.character}`;
    const count = references.filter((reference) =>
      `${reference.uri}#${reference.range.start.line}:${reference.range.start.character}` !== declarationKey
    ).length;

    return [symbol.key, count] as const;
  }));

  return new Map(entries);
}

scheduler.setLogger((msg) => connection.console.log(msg));
scheduler.setBackgroundAdmissionGate((task) => {
  const workload = task.workload ?? 'background-indexing';
  const memoryPolicy = ensureRuntimeMemoryPressureRelief();
  if (isWorkloadDeferredByMemoryPressure(memoryPolicy, workload)) {
    return {
      allowed: false,
      reason: `${memoryPolicy.reason}:${workload}`
    };
  }

  const policy = getRuntimeWorkloadPolicy(workload);
  if (!policy.throttledByLatency) {
    return { allowed: true };
  }
  if (servingLatencyGovernor.isBackgroundAllowed()) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `latency-pressure:${workload}`
  };
});

// ---------------------------------------------------------------------------
// Ciclo de Vida (Lifecycle)
// ---------------------------------------------------------------------------

registerInitializeHandler({
  connection,
  serverStartTime,
  buildOrcaJournal,
  setWorkspaceFolders: (folders: string[]) => {
    workspaceFolders = folders;
  },
  setCacheStorageUri: (uri: string | null) => {
    cacheStorageUri = uri;
  },
  setDocumentationLocaleSetting: (setting) => {
    documentationLocaleSetting = setting;
  },
  setUiLocale: (locale) => {
    uiLocale = locale;
  },
});

registerInitializedHandler({
  connection,
  serverStartTime,
  scheduler,
  fs,
  workspaceState,
  documentCache,
  knowledgeBase,
  servingCache,
  publishRuntimeProgressReadiness,
  buildRuntimeProgressReadiness,
  sendProgress,
  transitionReadiness: (state, detail) => {
    readiness.transition(state, detail);
  },
  discoveryProgress,
  getWorkspaceFolders: () => workspaceFolders,
  getCacheStorageUri: () => cacheStorageUri,
  getActiveDocumentUri: () => activeDocumentUri,
  republishOpenDiagnostics,
  setCacheStore: (store) => {
    semanticCacheRuntimeController.setCacheStore(store);
  },
  buildCacheCheckpointMetadata,
  persistCheckpoint: (checkpoint) => semanticCacheRuntimeController.persistCheckpoint(checkpoint),
  persistServingSnapshot: () => semanticCacheRuntimeController.persistServingSnapshot(),
  setPersistenceRestoreReport: (report) => {
    semanticCacheRuntimeController.setPersistenceRestoreReport(report);
  },
});

const featureHandlerContext = {
  connection,
  documents,
  scheduler,
  firstInvocation,
  runtimeJournal,
  interactiveServingStats,
  documentCache,
  servingStaleGuard,
  workspaceState,
  knowledgeBase,
  inheritanceGraph,
  systemCatalog,
  hotContextCache,
  servingCache,
  serverStartTime,
  getDocumentationLocale,
  isSemanticallyServedDocument,
  buildRuntimeProgressReadiness,
  ensureRuntimeMemoryPressureRelief,
  isLatencyPressureHigh,
  recordInteractiveLatency,
  cacheServingResultWithMemoryPressure,
  getHoverViewModelCacheEntry: (key: string) => hoverViewModelCache.get(key),
  cacheHoverViewModelWithMemoryPressure,
  getHoverNegativeCacheEntry: (key: string) => hoverNegativeCache.get(key),
  cacheHoverNegativeWithMemoryPressure,
  getCompletionResolveNegativeCacheEntry: (key: string) => completionResolveNegativeCache.get(key),
  cacheCompletionResolveNegativeWithMemoryPressure,
  getDefinitionNegativeCacheEntry: (key: string) => definitionNegativeCache.get(key),
  cacheDefinitionNegativeWithMemoryPressure,
  isDefinitionCacheEntry,
  collectReferenceSourcesForQuery,
  wordAt,
  codeLensCache,
  buildCodeLensCacheKey,
  makeCodeLensSymbolKey,
  getCodeLensHierarchyMeta,
  getCodeLensUnavailableReason,
  buildCodeLensReferenceCounts,
};

registerPrimaryFeatureHandlers(featureHandlerContext);

// ---------------------------------------------------------------------------
// Eventos de Documento
// ---------------------------------------------------------------------------

const documentHandlerContext = {
  connection,
  documents,
  scheduler,
  firstInvocation,
  knowledgeBase,
  systemCatalog,
  inheritanceGraph,
  workspaceState,
  hotContextCache,
  documentCache,
  servingCache,
  servingCacheFlushCoordinator,
  invalidateHoverPresentationCaches,
  runtimeJournal,
  serverStartTime,
  isSemanticallyServedDocument,
  setActiveDocumentUri: (uri: string) => {
    activeDocumentUri = uri;
  },
  invalidateCodeLensCache,
  pushWatchedFileChange: (change: FileChangeType extends never ? never : any) => {
    const watcherEvent = toWatchedFsEvent(change);
    if (!watcherEvent) {
      return;
    }

    watcherIntake.push(watcherEvent);
  }
};

registerDocumentHandlers(documentHandlerContext);

// ---------------------------------------------------------------------------
// Apagado (Shutdown)
// ---------------------------------------------------------------------------

registerShutdownHandler({
  connection,
  servingCache,
  servingCacheFlushCoordinator,
  scheduler,
  firstInvocation,
  disposeTraceSnapshotSubscription,
  disposeWatcherIntake: () => {
    watcherIntake.dispose();
  },
  disposeEventLoopMonitor: () => {
    eventLoopMonitor.stop();
  },
  invalidateCodeLensCache,
  invalidateHoverPresentationCaches,
});

registerAuxiliaryFeatureHandlers(featureHandlerContext);

registerServerCommandHandler({
  connection,
  build: {
    workspaceState,
    knowledgeBase,
    runtimeJournal,
    buildOrcaJournal,
    pbAutoBuildRunner,
    orcaRunner,
    fs,
    getActiveDocumentUri: () => activeDocumentUri,
    getWorkspaceFolders: () => workspaceFolders,
    basenameFromPathOrUri,
    runPbAutoBuildWithBackpressure,
    runOrcaWithBackpressure,
  },
  report: {
    workspaceState,
    knowledgeBase,
    inheritanceGraph,
    systemCatalog,
    hotContextCache,
    runtimeJournal,
    buildOrcaJournal,
    fs,
    getActiveDocumentUri: () => activeDocumentUri,
    getWorkspaceFolders: () => workspaceFolders,
    getOpenDocument: (uri) => documents.get(uri),
    buildRuntimeProgressReadiness,
    ensureRuntimeMemoryPressureRelief,
    isLatencyPressureHigh,
    getDiagnosticsSummary,
    resolveAdaptiveLimit,
    runNearContextWorkload,
    runExportReportingWorkload,
    runOrcaWithBackpressure,
  },
  runtime: {
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
    getActiveDocumentUri: () => activeDocumentUri,
    getCacheStore: () => semanticCacheRuntimeController.getCacheStore(),
    buildRuntimeProgressReadiness,
    buildRuntimeMemorySnapshot,
    getCodeLensCacheStats,
    getWatcherStats: () => watcherIntake.getStats(),
    getLastPersistenceRestoreState: () => semanticCacheRuntimeController.getLastPersistenceRestoreState(),
    getLastPersistenceRestoreReason: () => semanticCacheRuntimeController.getLastPersistenceRestoreReason(),
    getLastRestoredCheckpointDocuments: () => semanticCacheRuntimeController.getLastRestoredCheckpointDocuments(),
    getLastServingSnapshotRestoreEntries: () => semanticCacheRuntimeController.getLastServingSnapshotRestoreEntries(),
    getLastServingSnapshotPersistEntries: () => semanticCacheRuntimeController.getLastServingSnapshotPersistEntries(),
    getInteractiveServingStats: () => ({
      ...interactiveServingStats.snapshot(32),
      performanceEvents: interactiveServingStats.runtimeMetricsSnapshot(32),
    }),
    recordPerformanceEvent: (event) => {
      interactiveServingStats.recordPerformanceEvent(event);
    },
    getEventLoopSnapshot: () => eventLoopMonitor.snapshot(),
    getRuntimeMemoryPressurePolicy: () => getRuntimeMemoryPressurePolicy(),
    getLastHealthJournalSignature: () => lastHealthJournalSignature,
    setLastHealthJournalSignature: (signature: string) => {
      lastHealthJournalSignature = signature;
    },
    ensureRuntimeMemoryPressureRelief,
    resolveAdaptiveLimit,
    runNearContextWorkload,
    runExportReportingWorkload,
    runMaintenanceWorkload,
    buildCacheCheckpointMetadata,
  },
});

/** Spec 105: extracción de identificador alrededor de una columna. */
function wordAt(line: string, character: number): { word: string; start: number; end: number } | null {
  const span = findPowerBuilderIdentifierSpan(line, character, { allowCursorAfterIdentifier: true });
  return span ? { word: span.word, start: span.start, end: span.end } : null;
}

function basenameFromPathOrUri(value: string): string {
  const normalized = value.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
}

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------

documents.listen(connection);
connection.listen();
