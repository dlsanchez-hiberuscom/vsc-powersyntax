import {
  createConnection,
  FileChangeType,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  InitializeParams,
  InitializeResult,
  Hover,
  Diagnostic,
  CodeActionKind,
  Position,
  Range
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { SERVER_NAME } from '../shared/types';
import { inferSourceOrigin } from '../shared/sourceOrigin';
import { isPowerBuilderSemanticUri } from '../shared/powerbuilderFiles';
import {
  PROGRESS_NOTIFICATION,
  type ProgressNotification
} from '../shared/types';
import { getDocumentAnalysis, invalidateDocumentAnalysis, evictDocumentAnalysis, clearDocumentAnalysisCache, setAnalysisBackends } from './analysis/analysisCache';
import { getAnalysisCacheStats } from './analysis/analysisCache';
import {
  cancelScheduledDiagnostics,
  clearAllScheduledDiagnostics,
  publishDiagnosticsNow,
  scheduleDiagnostics
} from './analysis/diagnosticScheduler';
import {
  extractDocumentSymbolsWithReconciliation,
  formatDocumentSymbolReconciliationReport,
} from './features/documentSymbols';
import { provideHover } from './features/hover';
import { provideWorkspaceSymbols, queryApiSymbols } from './features/workspaceSymbols';
import { provideDefinition } from './features/definition';
import { provideReferences } from './features/references';
import { provideSignatureHelp } from './features/signatureHelp';
import { provideCompletion } from './features/completion';
import { getSemanticTokensLegend, provideSemanticTokens } from './features/semanticTokens';
import { provideCodeActions } from './features/codeActions';
import { provideReferenceCodeLenses } from './features/codeLensReferences';
import { buildCurrentObjectContext } from './features/currentObjectContext';
import { buildCrossProjectSymbolConflicts } from './features/crossProjectSymbolConflicts';
import { buildImpactAnalysis } from './features/impactAnalysis';
import { buildPowerBuilderDependencyGraph } from './features/dependencyGraph';
import { buildPowerBuilderCodeMetrics } from './features/powerBuilderCodeMetrics';
import { buildPowerBuilderTechnicalDebtReport } from './features/powerBuilderTechnicalDebtReport';
import { buildDataWindowSqlLineage } from './features/dataWindowSqlLineage';
import { buildWorkspaceMigrationAssistant } from './features/workspaceMigrationAssistant';
import { buildHierarchyInspection } from './features/hierarchyInspection';
import { collectReferenceSourcePool } from './features/referenceSourcePool';
import { buildSemanticWorkspaceManifest } from './features/semanticWorkspaceManifest';
import { buildSafeBatchRefactorPlan } from './features/safeBatchRefactorPlan';
import { buildSafeEditPlan } from './features/safeEditPlan';
import {
  clearDiagnosticsSummary,
  getDiagnosticsSummary
} from './features/diagnostics';
import { provideRename } from './features/rename';
import { measureMs, measureMsAsync, formatTiming, FirstInvocationTracker } from './runtime/timing';
import { TaskScheduler, TaskPriority } from './runtime/scheduler';
import { createLatencyGovernor } from './runtime/latencyGovernor';
import { buildRuntimeHealthReport } from './runtime/runtimeHealth';
import { buildRuntimeMemoryReport } from './runtime/memoryBudgets';
import { BuildOrcaJournalStore } from './runtime/buildOrcaJournalStore';
import { RuntimeJournal } from './runtime/runtimeJournal';
import {
  PbAutoBuildRunner,
  selectPbAutoBuildBuildFile,
} from './build/pbAutoBuildRunner';
import { OrcaRunner } from './build/orcaRunner';
import { applySpecDrivenPblUpdate, applySpecDrivenPblUpdateBatch } from './build/specDrivenPblUpdate';
import { runOrcaStagingImport, runOrcaWriteOperation } from './build/orcaStagingImport';
import { prepareOrcaStagingExport, restoreOrcaStagingAliases } from './build/orcaStagingExport';
import { parsePbAutoBuildLog } from './build/pbAutoBuildLogParser';
import { resolvePbAutoBuildProblems } from './build/pbAutoBuildProblems';
import { NodeFileSystem } from './system/fileSystem';
import { createSemanticCacheStore, type SemanticCacheStore } from './cache/cacheStore';
import { createCacheCheckpoint } from './cache/cacheCheckpoint';
import type { SemanticCacheCheckpointMetadata } from './cache/cacheSchema';
import {
  persistServingCacheSnapshot,
  restoreServingCacheSnapshot
} from './cache/servingCachePersistence';
import { ServingCacheFlushCoordinator } from './cache/servingCacheFlushCoordinator';
import { cacheServingResult, invalidateServingCacheEntries } from './cache/servingCacheRuntime';
import {
  buildProgressReadinessSnapshot,
  toProgressNotification
} from './features/progressReadiness';
import { decideFeatureReadiness } from './features/featureReadiness';
import { createDocumentQueryContext } from './features/queryContext';
import { resolveServingReadiness } from './features/servingReadiness';
import { discoverWorkspace } from './workspace/discovery';
import { WorkspaceState } from './workspace/workspaceState';
import { createReadinessTracker } from './workspace/readiness';
import { DocumentCache } from './knowledge/DocumentCache';
import { KnowledgeBase } from './knowledge/KnowledgeBase';
import { InheritanceGraph } from './knowledge/resolution/InheritanceGraph';
import { HotContextCache } from './knowledge/HotContextCache';
import { Entity, EntityKind } from './knowledge/types';
import { buildObjectInfo } from './features/objectInfo';
import { formatDocument } from './features/formatDocument';
import {
  createSemanticInvalidationPlan,
  createSnapshotAwareInvalidationPlan
} from './knowledge/semanticInvalidation';
import { ServingCache, makeKey as makeServingKey } from './knowledge/ServingCache';
import { getLastTrace, subscribeTraceSnapshots } from './knowledge/queryTrace';
import { SystemCatalog } from './knowledge/system/SystemCatalog';
import { getFileIndexState, getIndexerStatus, indexWorkspace } from './indexer/workspaceIndexer';
import { createFileWatcherDebouncer } from './system/fileWatcherDebouncer';
import { applyWatchedFileEvents } from './workspace/watchedFileIntake';
import { toWatchedFsEvent } from './workspace/watchedFileChangeBridge';
import { findPowerBuilderIdentifierSpan } from './utils/pbIdentifier';

// ---------------------------------------------------------------------------
// Inicialización (Bootstrap)
// ---------------------------------------------------------------------------

const serverStartTime = performance.now();

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const scheduler = new TaskScheduler();
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
const documentCache = new DocumentCache();
const knowledgeBase = new KnowledgeBase();
const inheritanceGraph = new InheritanceGraph(knowledgeBase);
const systemCatalog = new SystemCatalog();
const hotContextCache = new HotContextCache();
const runtimeJournal = new RuntimeJournal(160);
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
const MAX_CODE_LENS_CACHE_ENTRIES = 128;
const codeLensCache = new Map<string, { key: string; lenses: ReturnType<typeof provideReferenceCodeLenses> }>();
const codeLensCacheCounters = { hits: 0, misses: 0, evictions: 0 };
let lastHealthJournalSignature = '';

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
          isDocumentOpen: (uri) => documents.get(uri) !== undefined,
          getOpenDocument: (uri) => documents.get(uri),
          clearDiagnostics: (uri) => {
            clearDiagnosticsSummary(uri);
            connection.sendDiagnostics({ uri, diagnostics: [] as Diagnostic[] });
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
let cacheStore: SemanticCacheStore | null = null;
let cacheStorageUri: string | null = null;
let lastServingSnapshotRestoreEntries = 0;
let lastServingSnapshotPersistEntries = 0;
let lastPersistenceRestoreState: 'restored' | 'reused' | 'rebuilt' | undefined;
let lastPersistenceRestoreReason: string | undefined;
let lastRestoredCheckpointDocuments = 0;
const persistServingSnapshot = async (): Promise<void> => {
  if (!cacheStore) {
    lastServingSnapshotPersistEntries = 0;
    return;
  }

  lastServingSnapshotPersistEntries = await persistServingCacheSnapshot(servingCache, cacheStore, knowledgeBase.semanticEpoch);
};

function buildCacheCheckpointMetadata(): Partial<SemanticCacheCheckpointMetadata> {
  return {
    workspaceMode: workspaceState.getMode(),
    rootUris: workspaceFolders,
    projectStats: workspaceState.getProjectModel()?.getStats(),
    discovery: workspaceState.exportDiscoverySnapshot()
  };
}

const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {
  await persistServingSnapshot();
});
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
    if (cacheStore) {
      return cacheStore.appendJournalMutation({
        semanticEpoch,
        kind: 'upsert',
        uris: [record.uri],
        documents: [record]
      });
    }
  },
  appendRemove(uri, semanticEpoch) {
    if (cacheStore) {
      return cacheStore.appendJournalMutation({
        semanticEpoch,
        kind: 'remove',
        uris: [uri]
      });
    }
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
const discoveryProgress = {
  current: 0,
  total: 0
};

function buildRuntimeProgressReadiness(activeUriOverride?: string | null) {
  const indexerStatus = getIndexerStatus();
  const workspaceFiles = workspaceState.getAllSourceFiles();
  const activeUri = activeUriOverride ?? activeDocumentUri;
  const activeProject = workspaceState.getProjectContextForFile(activeUri);
  const activeProjectFiles = activeProject
    ? workspaceState.getProjectModel()?.getFilesForProject(activeProject.projectUri) ?? []
    : [];

  return buildProgressReadinessSnapshot({
    discovery: discoveryProgress,
    indexer: indexerStatus,
    activeUri,
    activeProjectName: activeProject?.name,
    activeProjectFiles,
    workspaceFiles,
    isSemanticallyReady: (uri) => {
      const snapshot = knowledgeBase.getDocumentSnapshot(uri);
      return documentCache.hasSnapshot(uri)
        || snapshot?.readiness === 'nearby-semantic-ready'
        || getFileIndexState(uri) === 'indexed';
    }
  });
}

function publishRuntimeProgressReadiness(): void {
  const snapshot = buildRuntimeProgressReadiness();
  readiness.transition(snapshot.readiness.state, snapshot.readiness.detail);
  sendProgress(toProgressNotification(snapshot));
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

function getCodeLensCacheEntry(uri: string, key: string): ReturnType<typeof provideReferenceCodeLenses> | undefined {
  const cached = codeLensCache.get(uri);
  if (!cached || cached.key !== key) {
    codeLensCacheCounters.misses++;
    return undefined;
  }

  codeLensCache.delete(uri);
  codeLensCache.set(uri, cached);
  codeLensCacheCounters.hits++;
  return cached.lenses;
}

function setCodeLensCacheEntry(uri: string, key: string, lenses: ReturnType<typeof provideReferenceCodeLenses>): void {
  if (codeLensCache.has(uri)) {
    codeLensCache.delete(uri);
  } else if (codeLensCache.size >= MAX_CODE_LENS_CACHE_ENTRIES) {
    const oldest = codeLensCache.keys().next().value;
    if (oldest !== undefined) {
      codeLensCache.delete(oldest);
      codeLensCacheCounters.evictions++;
    }
  }

  codeLensCache.set(uri, { key, lenses });
}

function invalidateCodeLensCache(uri?: string): void {
  if (uri === undefined) {
    codeLensCache.clear();
    return;
  }
  codeLensCache.delete(uri);
}

function getCodeLensCacheStats(): { size: number; capacity: number; hits: number; misses: number; evictions: number } {
  return {
    size: codeLensCache.size,
    capacity: MAX_CODE_LENS_CACHE_ENTRIES,
    ...codeLensCacheCounters
  };
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
  queryContext?: ReturnType<typeof createDocumentQueryContext>
): Promise<Array<{ uri: string; content: string; lines?: string[]; maskedLines?: string[] }>> {
  const pool = await collectReferenceSourcePool({
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
scheduler.setBackgroundAdmissionGate(() => servingLatencyGovernor.isBackgroundAllowed());

// ---------------------------------------------------------------------------
// Ciclo de Vida (Lifecycle)
// ---------------------------------------------------------------------------

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const initElapsed = performance.now() - serverStartTime;
  connection.console.log(formatTiming('Proceso del servidor hasta onInitialize', initElapsed));

  if (params.workspaceFolders) {
    workspaceFolders = params.workspaceFolders.map(f => f.uri);
  }
  buildOrcaJournal.configure(workspaceFolders);
  const initOptions = params.initializationOptions as { cacheStorageUri?: string } | undefined;
  cacheStorageUri = typeof initOptions?.cacheStorageUri === 'string' ? initOptions.cacheStorageUri : null;

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      documentSymbolProvider: true,
      hoverProvider: true,
      workspaceSymbolProvider: true,
      definitionProvider: true,
      referencesProvider: true,
      completionProvider: {
        triggerCharacters: ['.']
      },
      signatureHelpProvider: {
        triggerCharacters: ['(', ',']
      },
      semanticTokensProvider: {
        legend: getSemanticTokensLegend(),
        full: true
      },
      // Spec 103: code actions (quick-fix). Proveedor existente
      // (`provideCodeActions`) se conecta aquí.
      codeActionProvider: {
        codeActionKinds: [CodeActionKind.QuickFix]
      },
      // Spec 104: code lens de referencias. Reusa el provider existente.
      codeLensProvider: { resolveProvider: false },
      // Spec 105: rename con pre-flight (validación de identificador).
      renameProvider: { prepareProvider: true },
      // Spec 106: comandos personalizados expuestos vía workspace/executeCommand.
      executeCommandProvider: {
        commands: ['powerbuilder.showStats', 'powerbuilder.objectInfo', 'powerbuilder.inspectHierarchy', 'powerbuilder.querySymbols', 'powerbuilder.crossProjectSymbolConflicts', 'powerbuilder.workspaceMigrationAssistant', 'powerbuilder.dependencyGraph', 'powerbuilder.codeMetrics', 'powerbuilder.technicalDebtReport', 'powerbuilder.dataWindowSqlLineage', 'powerbuilder.currentObjectContext', 'powerbuilder.analyzeImpact', 'powerbuilder.safeEditPlan', 'powerbuilder.safeBatchRefactorPlan', 'powerbuilder.applySpecDrivenPblUpdate', 'powerbuilder.applySpecDrivenPblUpdateBatch', 'powerbuilder.semanticWorkspaceManifest', 'powerbuilder.runSemanticCacheMaintenance', 'powerbuilder.formatDocument', 'powerbuilder.listPbAutoBuildBuildFiles', 'powerbuilder.listPbAutoBuildBuildInventory', 'powerbuilder.runPbAutoBuild', 'powerbuilder.cancelPbAutoBuild', 'powerbuilder.runOrcaScript', 'powerbuilder.cancelOrcaScript', 'powerbuilder.exportOrcaStaging', 'powerbuilder.importOrcaStaging', 'powerbuilder.regenerateOrcaLibraries', 'powerbuilder.rebuildOrcaProject']
      }
    }
  };
});

connection.onInitialized(() => {
  const readyElapsed = performance.now() - serverStartTime;
  connection.console.log(`${SERVER_NAME} inicializado.`);
  connection.console.log(formatTiming('Proceso del servidor hasta onInitialized (listo)', readyElapsed));

  // Lanzar el descubrimiento global de workspace en segundo plano (background)
  if (workspaceFolders.length > 0) {
    connection.console.log(`[WORKSPACE] Iniciando descubrimiento en ${workspaceFolders.length} raíces (roots)...`);
    discoveryProgress.current = 0;
    discoveryProgress.total = workspaceFolders.length;
    publishRuntimeProgressReadiness();

    scheduler.enqueueBackground({
      id: 'workspace-discovery',
      priority: TaskPriority.Background,
      execute: async (token) => {
        let earlyRestoreApplied = false;
        let earlyRestoreServingEntries = 0;

        if (cacheStorageUri) {
          cacheStore = createSemanticCacheStore(fs, cacheStorageUri, workspaceFolders);
          const earlyRestore = await cacheStore.load({ rootUris: workspaceFolders });
          if (earlyRestore.decision.action === 'reuse') {
            workspaceState.restoreDiscoverySnapshot(earlyRestore.checkpoint.metadata.discovery);
            if (earlyRestore.checkpoint.documents.length > 0) {
              earlyRestoreApplied = true;
              documentCache.restoreDocumentRecords(earlyRestore.checkpoint.documents);
              knowledgeBase.restoreDocumentRecords(earlyRestore.checkpoint.documents, earlyRestore.checkpoint.semanticEpoch);
              earlyRestoreServingEntries = await restoreServingCacheSnapshot(
                servingCache,
                cacheStore,
                earlyRestore.checkpoint.semanticEpoch
              );
              connection.console.log(
                `[CACHE] Warm resume restauró ${earlyRestore.checkpoint.documents.length} documentos antes del discovery.`
              );
              if (earlyRestoreServingEntries > 0) {
                connection.console.log(`[CACHE] ServingCache restauró ${earlyRestoreServingEntries} entries persistidas.`);
              }
            } else if ((earlyRestore.checkpoint.metadata.discovery?.sourceFiles.length ?? 0) > 0) {
              connection.console.log(
                `[CACHE] Warm resume recuperó snapshot de discovery con ${earlyRestore.checkpoint.metadata.discovery?.sourceFiles.length ?? 0} archivos.`
              );
            }
            publishRuntimeProgressReadiness();
          }
        }

        const discoveredState = new WorkspaceState();
        const { elapsedMs: discoveryMs } = await measureMsAsync(async () => {
          await discoverWorkspace(workspaceFolders, fs, discoveredState, token, (current, total) => {
            discoveryProgress.current = current;
            discoveryProgress.total = total;
            publishRuntimeProgressReadiness();
          });
        });

        if (token.isCancelled) {
          connection.console.log(`[WORKSPACE] Descubrimiento cancelado o pausado.`);
          sendProgress({ phase: 'partial' });
          readiness.transition('degraded', 'partial-discovery');
          return;
        }

        const restoredOrcaStagingAliases = await restoreOrcaStagingAliases(workspaceFolders, fs, discoveredState);
        if (restoredOrcaStagingAliases > 0) {
          connection.console.log(`[WORKSPACE] ORCA staging restauró ${restoredOrcaStagingAliases} aliases hacia librerías legacy.`);
        }

        discoveredState.refreshProjectRouting();
        workspaceState.replaceFrom(discoveredState);

        const filesCount = workspaceState.getAllSourceFiles().length;
        const roots = workspaceState.getRoots();
        discoveryProgress.current = discoveryProgress.total;
        connection.console.log(`[WORKSPACE] Descubrimiento completado:`);
        connection.console.log(`  - Tiempos: ${formatTiming('discoverWorkspace', discoveryMs)}`);
        connection.console.log(`  - Archivos de código: ${filesCount}`);
        connection.console.log(`  - PBW: ${roots.workspaces.length}, PBT: ${roots.targets.length}, PBL: ${roots.libraries.length}`);
        connection.console.log(`  - PBSLN: ${roots.solutions.length}, PBPROJ: ${roots.projects.length}`);
        connection.console.log(`  - Modo: ${workspaceState.getMode()}`);

        const projectModel = workspaceState.getProjectModel();
        connection.console.log(`  - Proyectos detectados: ${projectModel?.getProjects().length ?? 0}`);
        connection.console.log(`  - Build files PBAutoBuild: ${workspaceState.getBuildFileSummary().total}`);

        const cacheMetadata = buildCacheCheckpointMetadata();

        if (cacheStorageUri) {
          cacheStore = createSemanticCacheStore(fs, cacheStorageUri, workspaceFolders, projectModel);
          const restore = await cacheStore.load(cacheMetadata);
          lastPersistenceRestoreReason = restore.decision.reason;
          if (restore.decision.action === 'reuse' && restore.checkpoint.documents.length > 0) {
            lastPersistenceRestoreState = 'restored';
            lastRestoredCheckpointDocuments = restore.checkpoint.documents.length;
            if (!earlyRestoreApplied) {
              documentCache.restoreDocumentRecords(restore.checkpoint.documents);
              knowledgeBase.restoreDocumentRecords(restore.checkpoint.documents, restore.checkpoint.semanticEpoch);
              const restoredServingEntries = await restoreServingCacheSnapshot(
                servingCache,
                cacheStore,
                restore.checkpoint.semanticEpoch
              );
              lastServingSnapshotRestoreEntries = restoredServingEntries;
              connection.console.log(
                `[CACHE] Warm resume restauró ${restore.checkpoint.documents.length} documentos (epoch ${restore.checkpoint.semanticEpoch}).`
              );
              if (restoredServingEntries > 0) {
                connection.console.log(`[CACHE] ServingCache restauró ${restoredServingEntries} entries persistidas.`);
              }
            } else {
              lastServingSnapshotRestoreEntries = earlyRestoreServingEntries;
              connection.console.log(
                `[CACHE] Warm resume validó metadata compatible tras restaurar ${restore.checkpoint.documents.length} documentos antes del discovery.`
              );
            }
          } else if (restore.decision.action === 'reuse') {
            lastPersistenceRestoreState = 'reused';
            lastRestoredCheckpointDocuments = 0;
            lastServingSnapshotRestoreEntries = 0;
            connection.console.log('[CACHE] Warm resume reutilizó metadata compatible sin documentos persistidos.');
          } else {
            if (earlyRestoreApplied) {
              documentCache.clear();
              knowledgeBase.clear();
              servingCache.invalidate();
            }
            lastPersistenceRestoreState = 'rebuilt';
            lastRestoredCheckpointDocuments = 0;
            lastServingSnapshotRestoreEntries = 0;
            connection.console.log(
              `[CACHE] Warm resume descartado: ${restore.decision.reason ?? 'sin estado persistente compatible'}.`
            );
          }

          await cacheStore.persistCheckpoint(
            createCacheCheckpoint(
              knowledgeBase.semanticEpoch,
              documentCache.exportDocumentRecords(),
              cacheMetadata
            )
          );
        }

        // Iniciamos indexación incremental
        if (filesCount > 0) {
          connection.console.log(`[WORKSPACE] Iniciando indexación de ${filesCount} archivos...`);

          const { elapsedMs: indexingMs } = await measureMsAsync(async () => {
            await indexWorkspace(
              fs,
              documentCache,
              knowledgeBase,
              workspaceState,
              token,
              (msg) => connection.console.error(msg),
              (_current, _total, _meta) => {
                publishRuntimeProgressReadiness();
              },
              activeDocumentUri ?? undefined
            );
          });

          if (!token.isCancelled) {
            const stats = knowledgeBase.getStats();
            const runtimeStatus = buildRuntimeProgressReadiness();
            connection.console.log(`[WORKSPACE] Indexación completada:`);
            connection.console.log(`  - Tiempos: ${formatTiming('indexWorkspace', indexingMs)}`);
            connection.console.log(`  - Entidades en KB: ${stats.totalEntities}`);
            if (runtimeStatus.readiness.state === 'degraded') {
              publishRuntimeProgressReadiness();
            } else {
              if (cacheStore) {
                await cacheStore.persistCheckpoint(
                  createCacheCheckpoint(
                    knowledgeBase.semanticEpoch,
                    documentCache.exportDocumentRecords(),
                    {
                      ...cacheMetadata,
                      publishedAt: stats.publishedAt
                    }
                  )
                );
                await persistServingSnapshot();
              }
              publishRuntimeProgressReadiness();
            }
          } else {
            connection.console.log(`[WORKSPACE] Indexación pausada cooperativamente.`);
            sendProgress({ phase: 'partial' });
            readiness.transition('degraded', 'partial-index');
          }
        } else {
          publishRuntimeProgressReadiness();
        }
      }
    }).catch(err => {
      connection.console.error(`[ERROR] Descubrimiento de workspace: ${String(err)}`);
      void connection.sendNotification(PROGRESS_NOTIFICATION, { phase: 'partial' } satisfies ProgressNotification);
      readiness.transition('error', String(err));
    });
  }
});

// ---------------------------------------------------------------------------
// Funcionalidades (Features) — Símbolos del Documento
// ---------------------------------------------------------------------------

connection.onDocumentSymbol((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }
  if (!isSemanticallyServedDocument(document)) {
    return [];
  }

  try {
    return scheduler.runInteractive({
      id: `documentSymbols-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
        const { result, elapsedMs } = measureMs(() => extractDocumentSymbolsWithReconciliation(document));

        if (result.reconciliation.status !== 'healthy') {
          connection.console.warn(formatDocumentSymbolReconciliationReport(result.reconciliation));
          runtimeJournal.record({
            phase: 'serve',
            kind: 'documentSymbols',
            action: 'reconcile',
            severity: result.reconciliation.status,
            label: document.uri,
            detail: result.reconciliation,
          });
        }

        if (firstInvocation.isFirst('documentSymbols')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primer documentSymbols (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('documentSymbols', elapsedMs));
        return result.symbols;
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] documentSymbols: ${message}`);
    return [];
  }
});

// ---------------------------------------------------------------------------
// Funcionalidades (Features) — Información al pasar el ratón (Hover)
// ---------------------------------------------------------------------------

connection.onHover((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  if (!isSemanticallyServedDocument(document)) {
    return null;
  }

  try {
    return scheduler.runInteractive({
      id: `hover-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
        const readinessDecision = decideFeatureReadiness('hover', buildRuntimeProgressReadiness(document.uri), {
          latencyOverloaded: isLatencyPressureHigh()
        });
        hotContextCache.setActive(document.uri, knowledgeBase.version);
        // Caché de serving: misma posición + misma versión de KB → reutilizar.
        const cacheKey = makeServingKey({
          feature: 'hover',
          uri: document.uri,
          line: params.position.line,
          character: params.position.character,
          kbVersion: knowledgeBase.version
        });

        const cached = servingCache.get(cacheKey);
        if (cached !== undefined) {
          return cached as ReturnType<typeof provideHover>;
        }

        if (readinessDecision.action === 'block') {
          connection.console.warn(`[hover] bloqueado: ${readinessDecision.reason}`);
          return null;
        }

        const { result, elapsedMs } = measureMs(() => provideHover(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph, hotContextCache));
        recordInteractiveLatency('hover', elapsedMs);

        if (firstInvocation.isFirst('hover')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primer hover (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('hover', elapsedMs));
        cacheServingResult(servingCache, cacheKey, result, servingCacheFlushCoordinator);
        return result;
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] hover: ${message}`);
    return null;
  }
});

// ---------------------------------------------------------------------------
// Funcionalidades (Features) — Símbolos del Workspace
// ---------------------------------------------------------------------------

connection.onWorkspaceSymbol((params) => {
  try {
    const { result, elapsedMs } = measureMs(() => provideWorkspaceSymbols(params.query, knowledgeBase));
    connection.console.log(formatTiming('workspaceSymbol', elapsedMs));
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] workspaceSymbol: ${message}`);
    return [];
  }
});

// ---------------------------------------------------------------------------
// Funcionalidades (Features) — Ir a Definición
// ---------------------------------------------------------------------------

connection.onDefinition((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  if (!isSemanticallyServedDocument(document)) {
    return null;
  }

  try {
    return scheduler.runInteractive({
      id: `definition-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
        const runtimeReadiness = buildRuntimeProgressReadiness(document.uri);
        hotContextCache.setActive(document.uri, knowledgeBase.version);
        const cacheKey = makeServingKey({
          feature: 'definition',
          uri: document.uri,
          line: params.position.line,
          character: params.position.character,
          kbVersion: knowledgeBase.version
        });
        const cached = servingCache.get(cacheKey);
        if (isDefinitionCacheEntry(cached)) {
          const readiness = resolveServingReadiness({
            feature: 'definition',
            consumerLabel: 'definition',
            snapshot: runtimeReadiness,
            blockedResult: null,
            context: {
              latencyOverloaded: isLatencyPressureHigh(),
              resolutionConfidence: cached.resolutionConfidence
            }
          });
          if (readiness.blocked) {
            connection.console.warn(readiness.warningMessage);
            return readiness.blockedResult;
          }
          return cached.result;
        }

        const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'definition');
        const readinessDecision = decideFeatureReadiness('definition', runtimeReadiness, {
          latencyOverloaded: isLatencyPressureHigh(),
          resolutionConfidence: queryContext.resolutionConfidence
        });

        if (readinessDecision.action === 'block') {
          connection.console.warn(`[definition] bloqueado: ${readinessDecision.reason}`);
          return null;
        }

        const { result, elapsedMs } = measureMs(() => provideDefinition(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, queryContext));
        recordInteractiveLatency('definition', elapsedMs);

        if (firstInvocation.isFirst('definition')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primera definición (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('definition', elapsedMs));
        cacheServingResult(servingCache, cacheKey, {
          result,
          resolutionConfidence: queryContext.resolutionConfidence
        }, servingCacheFlushCoordinator);
        return result;
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] definition: ${message}`);
    return null;
  }
});

// ---------------------------------------------------------------------------
// Funcionalidades (Features) — Find References (Spec 025 / B023)
// ---------------------------------------------------------------------------

connection.onReferences(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;
  if (!isSemanticallyServedDocument(document)) return [];
  try {
    hotContextCache.setActive(document.uri, knowledgeBase.version);
    const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'references');
    const readiness = resolveServingReadiness({
      feature: 'references',
      consumerLabel: 'references',
      snapshot: buildRuntimeProgressReadiness(document.uri),
      blockedResult: [],
      context: {
        latencyOverloaded: isLatencyPressureHigh(),
        resolutionConfidence: queryContext.resolutionConfidence
      }
    });
    if (readiness.blocked) {
      connection.console.warn(readiness.warningMessage);
      return readiness.blockedResult;
    }
    const sources = await collectReferenceSourcesForQuery(document, queryContext);
    const { result, elapsedMs } = measureMs(() =>
      provideReferences(
        document,
        params.position,
        knowledgeBase,
        inheritanceGraph,
        sources,
        {
          includeDeclaration: params.context?.includeDeclaration ?? true
        },
        hotContextCache,
        queryContext
      )
    );
    recordInteractiveLatency('references', elapsedMs);
    connection.console.log(formatTiming('references', elapsedMs));
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] references: ${message}`);
    return null;
  }
});

// ---------------------------------------------------------------------------
// Funcionalidades (Features) — Ayuda de Firmas (Signature Help)
// ---------------------------------------------------------------------------

connection.onSignatureHelp((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  if (!isSemanticallyServedDocument(document)) {
    return null;
  }

  try {
    return scheduler.runInteractive({
      id: `signatureHelp-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
        hotContextCache.setActive(document.uri, knowledgeBase.version);
        const cacheKey = makeServingKey({
          feature: 'signatureHelp',
          uri: document.uri,
          line: params.position.line,
          character: params.position.character,
          kbVersion: knowledgeBase.version
        });
        const cached = servingCache.get(cacheKey);
        if (cached !== undefined) {
          return cached as ReturnType<typeof provideSignatureHelp>;
        }

        const { result, elapsedMs } = measureMs(() => provideSignatureHelp(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph, hotContextCache));
        recordInteractiveLatency('signatureHelp', elapsedMs);

        if (firstInvocation.isFirst('signatureHelp')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primer signatureHelp (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('signatureHelp', elapsedMs));
        cacheServingResult(servingCache, cacheKey, result, servingCacheFlushCoordinator);
        return result;
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] signatureHelp: ${message}`);
    return null;
  }
});

// ---------------------------------------------------------------------------
// Funcionalidades (Features) — Completado Contextual (Completion)
// ---------------------------------------------------------------------------

connection.onCompletion((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }
  if (!isSemanticallyServedDocument(document)) {
    return null;
  }

  try {
    return scheduler.runInteractive({
      id: `completion-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
        const readinessDecision = decideFeatureReadiness('completion', buildRuntimeProgressReadiness(document.uri), {
          latencyOverloaded: isLatencyPressureHigh()
        });
        hotContextCache.setActive(document.uri, knowledgeBase.version);
        const cacheKey = makeServingKey({
          feature: 'completion',
          uri: document.uri,
          line: params.position.line,
          character: params.position.character,
          kbVersion: knowledgeBase.version,
          extra: `${params.context?.triggerKind ?? ''}|${params.context?.triggerCharacter ?? ''}`
        });
        const cached = servingCache.get(cacheKey);
        if (cached !== undefined) {
          return cached as ReturnType<typeof provideCompletion>;
        }

        if (readinessDecision.action === 'block') {
          connection.console.warn(`[completion] bloqueado: ${readinessDecision.reason}`);
          return null;
        }

        const { result, elapsedMs } = measureMs(() => provideCompletion(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph, hotContextCache, knowledgeBase.version));
        recordInteractiveLatency('completion', elapsedMs);

        if (firstInvocation.isFirst('completion')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primer completion (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('completion', elapsedMs));
        cacheServingResult(servingCache, cacheKey, result, servingCacheFlushCoordinator);
        return result;
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] completion: ${message}`);
    return null;
  }
});

// ---------------------------------------------------------------------------
// Funcionalidades (Features) — Tokens Semánticos (Semantic Tokens)
// ---------------------------------------------------------------------------

connection.languages.semanticTokens.on((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return { data: [] };
  }
  if (!isSemanticallyServedDocument(document)) {
    return { data: [] };
  }

  try {
    return scheduler.runInteractive({
      id: `semanticTokens-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
        const { result, elapsedMs } = measureMs(() => provideSemanticTokens(document, knowledgeBase, inheritanceGraph));

        if (firstInvocation.isFirst('semanticTokens')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primer semanticTokens (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('semanticTokens', elapsedMs));
        return result;
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] semanticTokens: ${message}`);
    return { data: [] };
  }
});

// ---------------------------------------------------------------------------
// Eventos de Documento
// ---------------------------------------------------------------------------

documents.onDidOpen((event) => {
  activeDocumentUri = event.document.uri;

  if (!isSemanticallyServedDocument(event.document)) {
    cancelScheduledDiagnostics(event.document.uri);
    clearDiagnosticsSummary(event.document.uri);
    connection.sendDiagnostics({
      uri: event.document.uri,
      diagnostics: [] as Diagnostic[]
    });
    return;
  }

  try {
    const { elapsedMs } = measureMs(() => publishDiagnosticsNow(connection, event.document, scheduler, knowledgeBase, systemCatalog, inheritanceGraph, workspaceState));

    if (firstInvocation.isFirst('diagnostics')) {
      const sinceStart = performance.now() - serverStartTime;
    scheduleDiagnostics(connection, event.document, scheduler, undefined, knowledgeBase, systemCatalog, inheritanceGraph, workspaceState);
    }

    connection.console.log(formatTiming('diagnósticos (onDidOpen)', elapsedMs));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] diagnósticos onDidOpen: ${message}`);
  }
});

documents.onDidChangeContent((event) => {
  activeDocumentUri = event.document.uri;
  if (!isSemanticallyServedDocument(event.document)) {
    cancelScheduledDiagnostics(event.document.uri);
    clearDiagnosticsSummary(event.document.uri);
    connection.sendDiagnostics({
      uri: event.document.uri,
      diagnostics: [] as Diagnostic[]
    });
    return;
  }
  const previousSnapshot = knowledgeBase.getDocumentSnapshot(event.document.uri) ?? undefined;
  const previousPlan = createSemanticInvalidationPlan(event.document.uri, knowledgeBase);
  const nextAnalysis = getDocumentAnalysis(event.document);
  const nextPlan = createSemanticInvalidationPlan(event.document.uri, knowledgeBase);
  const invalidationPlan = createSnapshotAwareInvalidationPlan(
    event.document.uri,
    previousSnapshot,
    nextAnalysis.snapshot,
    previousPlan,
    nextPlan
  );
  for (const uri of invalidationPlan.allUris) {
    hotContextCache.invalidateForUri(uri);
    invalidateCodeLensCache(uri);
  }
  runtimeJournal.record({
    phase: 'invalidation',
    kind: 'semantic-invalidation',
    action: 'document-change',
    invalidationCount: invalidationPlan.allUris.length,
    detail: {
      uri: event.document.uri,
      allUris: invalidationPlan.allUris
    }
  });
  invalidateServingCacheEntries(servingCache, invalidationPlan.allUris, servingCacheFlushCoordinator);

  try {
    scheduleDiagnostics(connection, event.document, scheduler, undefined, knowledgeBase, systemCatalog, inheritanceGraph);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] diagnósticos onDidChangeContent: ${message}`);
  }
});

documents.onDidClose((event) => {
  if (!isSemanticallyServedDocument(event.document)) {
    cancelScheduledDiagnostics(event.document.uri);
    clearDiagnosticsSummary(event.document.uri);
    connection.sendDiagnostics({
      uri: event.document.uri,
      diagnostics: [] as Diagnostic[]
    });
    return;
  }
  cancelScheduledDiagnostics(event.document.uri);
  const invalidationPlan = createSemanticInvalidationPlan(event.document.uri, knowledgeBase);
  evictDocumentAnalysis(event.document.uri);
  for (const uri of invalidationPlan.allUris) {
    hotContextCache.invalidateForUri(uri);
    invalidateCodeLensCache(uri);
  }
  runtimeJournal.record({
    phase: 'invalidation',
    kind: 'semantic-invalidation',
    action: 'document-close',
    invalidationCount: invalidationPlan.allUris.length,
    detail: {
      uri: event.document.uri,
      allUris: invalidationPlan.allUris
    }
  });
  invalidateServingCacheEntries(servingCache, invalidationPlan.allUris, servingCacheFlushCoordinator);
  clearDiagnosticsSummary(event.document.uri);

  connection.sendDiagnostics({
    uri: event.document.uri,
    diagnostics: [] as Diagnostic[]
  });
});

connection.onDidChangeWatchedFiles((params) => {
  for (const change of params.changes) {
    const watcherEvent = toWatchedFsEvent(change);
    if (!watcherEvent) {
      continue;
    }

    watcherIntake.push(watcherEvent);
  }
});

// ---------------------------------------------------------------------------
// Apagado (Shutdown)
// ---------------------------------------------------------------------------

connection.onShutdown(async () => {
  disposeTraceSnapshotSubscription();
  watcherIntake.dispose();
  invalidateServingCacheEntries(servingCache, undefined, servingCacheFlushCoordinator);
  invalidateCodeLensCache();
  await servingCacheFlushCoordinator.flushIfDirty();
  scheduler.shutdown();
  clearAllScheduledDiagnostics();
  clearDocumentAnalysisCache();
  firstInvocation.reset();
});

// ---------------------------------------------------------------------------
// Funcionalidades — Code Actions / Code Lens / Rename / Custom commands
// (Specs 103-107). Conectan los providers ya implementados al LSP.
// ---------------------------------------------------------------------------

connection.onCodeAction((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];
  if (!isSemanticallyServedDocument(document)) return [];
  try {
    return provideCodeActions(
      params.textDocument.uri,
      document.getText(),
      params.context.diagnostics ?? [],
      {
        sourceOrigin: workspaceState.getSourceOrigin(params.textDocument.uri),
      }
    );
  } catch (error) {
    connection.console.error(`[ERROR] codeAction: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
});

connection.onCodeLens(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];
  if (!isSemanticallyServedDocument(document)) return [];
  try {
    const readinessDecision = decideFeatureReadiness('references', buildRuntimeProgressReadiness(document.uri), {
      latencyOverloaded: isLatencyPressureHigh()
    });
    const cacheKey = buildCodeLensCacheKey(document, readinessDecision.reason, readinessDecision.action);
    const cached = getCodeLensCacheEntry(document.uri, cacheKey);
    if (cached) {
      return cached;
    }

    const callableEntities = knowledgeBase.getEntitiesByUri(document.uri).filter((entity) =>
      entity.uri === document.uri &&
      (entity.kind === EntityKind.Function || entity.kind === EntityKind.Subroutine || entity.kind === EntityKind.Event)
    );

    const lensSymbols = callableEntities.map((entity) => {
      const hierarchy = getCodeLensHierarchyMeta(entity);
      return {
        key: makeCodeLensSymbolKey(entity),
        entity,
        name: entity.name,
        range: Range.create(entity.line, entity.character, entity.line, entity.character + entity.name.length),
        relation: hierarchy.relation,
        overrideCount: hierarchy.overrideCount,
        ...(readinessDecision.action === 'block'
          ? { unavailableReason: getCodeLensUnavailableReason(readinessDecision.reason) }
          : {})
      };
    });

    const counts = readinessDecision.action === 'block'
      ? new Map<string, number>()
      : await buildCodeLensReferenceCounts(lensSymbols);

    const lenses = provideReferenceCodeLenses(lensSymbols, counts);
    setCodeLensCacheEntry(document.uri, cacheKey, lenses);
    return lenses;
  } catch (error) {
    connection.console.error(`[ERROR] codeLens: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
});

// `prepareRename` valida el nombre nuevo. Aquí reutilizamos el preflight
// y exigimos que la posición caiga sobre un identificador.
connection.onPrepareRename((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;
  if (!isSemanticallyServedDocument(document)) return null;
  hotContextCache.setActive(document.uri, knowledgeBase.version);
  const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'rename-prepare');
  const readiness = resolveServingReadiness({
    feature: 'rename',
    consumerLabel: 'rename',
    snapshot: buildRuntimeProgressReadiness(document.uri),
    blockedResult: null,
    context: {
      latencyOverloaded: isLatencyPressureHigh(),
      resolutionConfidence: queryContext.resolutionConfidence
    }
  });
  if (readiness.blocked) {
    connection.console.warn(readiness.warningMessage);
    return readiness.blockedResult;
  }
  const line = document.getText().split(/\r?\n/)[params.position.line] ?? '';
  const match = wordAt(line, params.position.character);
  if (!match) return null;
  return {
    range: {
      start: { line: params.position.line, character: match.start },
      end: { line: params.position.line, character: match.end }
    },
    placeholder: match.word
  };
});

// `onRenameRequest`: aplicamos el rename de variables locales en el mismo
// scope (Spec 105). Renombrados cross-file siguen sin permitirse hasta
// disponer de resolución fuerte; en su lugar bloqueamos con un error claro.
connection.onRenameRequest(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;
  if (!isSemanticallyServedDocument(document)) return null;
  hotContextCache.setActive(document.uri, knowledgeBase.version);
  const queryContext = createDocumentQueryContext(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache, 'rename');
  const readiness = resolveServingReadiness({
    feature: 'rename',
    consumerLabel: 'rename',
    snapshot: buildRuntimeProgressReadiness(document.uri),
    blockedResult: null,
    context: {
      latencyOverloaded: isLatencyPressureHigh(),
      resolutionConfidence: queryContext.resolutionConfidence
    }
  });
  if (readiness.blocked) {
    connection.console.warn(readiness.warningMessage);
    return readiness.blockedResult;
  }
  const rename = provideRename(
    document,
    params.position,
    params.newName,
    knowledgeBase,
    inheritanceGraph,
    await collectReferenceSourcesForQuery(document, queryContext),
    systemCatalog,
    hotContextCache,
    queryContext
  );
  if (!rename.edit) {
    if (rename.reason) {
      connection.console.warn(`[rename] bloqueado: ${rename.reason}`);
    }
    return null;
  }
  return rename.edit;
});

connection.onExecuteCommand(async (params) => {
  switch (params.command) {
    case 'powerbuilder.showStats': {
      // Spec 107: estadísticas del servidor expuestas como comando.
      const stats = knowledgeBase.getStats();
      const sched = scheduler.getStatus();
      const projectStats = workspaceState.getProjectModel()?.getStats();
      const activeProject = workspaceState.getProjectContextForFile(activeDocumentUri);
      const progressReadiness = buildRuntimeProgressReadiness();
      const buildOrcaJournalUri = buildOrcaJournal.storageUri;
      const cacheMaintenance = cacheStore ? await cacheStore.inspectMaintenance() : undefined;
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
          watcher: watcherIntake.getStats()
        },
        memory: buildRuntimeMemoryReport({
          analysis: getAnalysisCacheStats(),
          serving: servingCache.getStats(),
          documents: documentCache.getStats(),
          hotContext: hotContextCache.getStats(),
          codeLens: getCodeLensCacheStats(),
          kb: stats,
        }),
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
                restoreState: lastPersistenceRestoreState,
                restoreReason: lastPersistenceRestoreReason,
                restoredDocuments: lastRestoredCheckpointDocuments,
                policy: cacheStore.retentionPolicy,
                maintenance: cacheMaintenance,
                servingSnapshot: {
                  lastRestoredEntries: lastServingSnapshotRestoreEntries,
                  lastPersistedEntries: lastServingSnapshotPersistEntries
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
      if (healthSignature !== lastHealthJournalSignature) {
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
        lastHealthJournalSignature = healthSignature;
      }
      return {
        ...baseStats,
        health,
        runtimeJournal: runtimeJournal.snapshot(50)
      };
    }
    case 'powerbuilder.formatDocument': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud de formato inválida.');
      }
      return formatDocument(request as Parameters<typeof formatDocument>[0]);
    }
    case 'powerbuilder.runPbAutoBuild': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud de build inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const buildFileUri = typeof (request as { buildFileUri?: unknown }).buildFileUri === 'string'
        ? (request as { buildFileUri: string }).buildFileUri
        : undefined;
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      const activeProjectUri = workspaceState.getProjectContextForFile(activeDocumentUri)?.projectUri;
      const selection = selectPbAutoBuildBuildFile(workspaceState.getBuildFiles(), activeProjectUri, buildFileUri);
      if (!selection.buildFile) {
        throw new Error(selection.detail ?? 'No se pudo seleccionar un build file utilizable.');
      }

      const runResult = await pbAutoBuildRunner.run({
        executablePath,
        buildFile: selection.buildFile,
        timeoutMs
      });

      const parsed = parsePbAutoBuildLog(runResult.output);
      const resolvedProblems = resolvePbAutoBuildProblems(
        parsed.issues,
        knowledgeBase,
        workspaceState,
        selection.buildFile.representedProjectUri
      );
      runtimeJournal.record({
        phase: 'build',
        kind: 'pbautobuild-problems',
        action: 'parsed',
        severity: resolvedProblems.summary.unresolved > 0 ? 'warning' : 'info',
        detail: {
          buildFileUri: selection.buildFile.uri,
          representedProjectUri: selection.buildFile.representedProjectUri,
          total: resolvedProblems.summary.total,
          published: resolvedProblems.summary.published,
          unresolved: resolvedProblems.summary.unresolved,
          parserSummary: parsed.summary,
        }
      });

      return {
        ...runResult,
        problems: resolvedProblems.problems,
        problemSummary: resolvedProblems.summary
      };
    }
    case 'powerbuilder.listPbAutoBuildBuildFiles': {
      return workspaceState.getBuildFiles()
        .filter((buildFile) => buildFile.status === 'usable')
        .map((buildFile) => ({
          uri: buildFile.uri,
          label: basenameFromPathOrUri(buildFile.uri),
          ...(buildFile.detail ? { detail: buildFile.detail } : {}),
          ...(buildFile.representedProjectUri ? { representedProjectUri: buildFile.representedProjectUri } : {})
        }));
    }
    case 'powerbuilder.listPbAutoBuildBuildInventory': {
      return workspaceState.getBuildFiles().map((buildFile) => ({
        uri: buildFile.uri,
        label: basenameFromPathOrUri(buildFile.uri),
        status: buildFile.status,
        ...(buildFile.reasonCode ? { reasonCode: buildFile.reasonCode } : {}),
        ...(buildFile.detail ? { detail: buildFile.detail } : {}),
        ...(buildFile.representedProjectUri ? { representedProjectUri: buildFile.representedProjectUri } : {}),
      }));
    }
    case 'powerbuilder.cancelPbAutoBuild': {
      const snapshot = pbAutoBuildRunner.cancel();
      return {
        cancelled: snapshot !== null,
        snapshot: snapshot ?? pbAutoBuildRunner.getSnapshot()
      };
    }
    case 'powerbuilder.runOrcaScript': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud ORCA inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const scriptUri = typeof (request as { scriptUri?: unknown }).scriptUri === 'string'
        ? (request as { scriptUri: string }).scriptUri
        : '';
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      return orcaRunner.run({
        executablePath,
        scriptUri,
        timeoutMs
      });
    }
    case 'powerbuilder.cancelOrcaScript': {
      const snapshot = orcaRunner.cancel();
      return {
        cancelled: snapshot !== null,
        snapshot: snapshot ?? orcaRunner.getSnapshot()
      };
    }
    case 'powerbuilder.exportOrcaStaging': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud de export ORCA inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const sessionLibrary = typeof (request as { sessionLibrary?: unknown }).sessionLibrary === 'string'
        ? (request as { sessionLibrary: string }).sessionLibrary
        : '';
      const focusUri = typeof (request as { focusUri?: unknown }).focusUri === 'string'
        ? (request as { focusUri: string }).focusUri
        : activeDocumentUri ?? undefined;
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      const prepared = await prepareOrcaStagingExport({
        executablePath,
        sessionLibrary,
        focusUri,
        timeoutMs
      }, {
        workspaceFolders,
        workspaceState,
        fs,
      });

      const result = await orcaRunner.run({
        executablePath,
        scriptUri: prepared.scriptUri,
        timeoutMs,
      });

      runtimeJournal.record({
        phase: 'legacy',
        kind: 'orca-export',
        action: result.snapshot.state === 'failed' || result.snapshot.state === 'timed-out' ? 'failed' : 'completed',
        severity: result.snapshot.state === 'failed' || result.snapshot.state === 'timed-out' ? 'warning' : 'info',
        detail: {
          stateUri: prepared.stateUri,
          scriptUri: prepared.scriptUri,
          stagingRootUri: prepared.stagingRootUri,
          sessionLibrary: prepared.sessionLibrary,
          ...(prepared.selectedProject ? { selectedProject: prepared.selectedProject } : {}),
          exportedLibraries: prepared.exportedLibraries.map((library) => ({
            libraryUri: library.libraryUri,
            stagingDirectoryUri: library.stagingDirectoryUri,
          })),
        }
      });

      return {
        ...result,
        stagingRootUri: prepared.stagingRootUri,
        scriptUri: prepared.scriptUri,
        stateUri: prepared.stateUri,
        exportedLibraries: prepared.exportedLibraries,
        sessionLibrary: prepared.sessionLibrary,
        ...(prepared.selectedProject ? { selectedProject: prepared.selectedProject } : {}),
      };
    }
    case 'powerbuilder.importOrcaStaging': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud de import ORCA inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const sessionLibrary = typeof (request as { sessionLibrary?: unknown }).sessionLibrary === 'string'
        ? (request as { sessionLibrary: string }).sessionLibrary
        : '';
      const focusUri = typeof (request as { focusUri?: unknown }).focusUri === 'string'
        ? (request as { focusUri: string }).focusUri
        : activeDocumentUri ?? undefined;
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      return runOrcaStagingImport({
        executablePath,
        sessionLibrary,
        focusUri,
        timeoutMs,
      }, {
        workspaceFolders,
        workspaceState,
        fs,
        runOrca: (orcaRequest) => orcaRunner.run(orcaRequest),
        journal: runtimeJournal,
      });
    }
    case 'powerbuilder.regenerateOrcaLibraries':
    case 'powerbuilder.rebuildOrcaProject': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        throw new Error('Solicitud ORCA legacy inválida.');
      }

      const executablePath = typeof (request as { executablePath?: unknown }).executablePath === 'string'
        ? (request as { executablePath: string }).executablePath
        : '';
      const sessionLibrary = typeof (request as { sessionLibrary?: unknown }).sessionLibrary === 'string'
        ? (request as { sessionLibrary: string }).sessionLibrary
        : '';
      const focusUri = typeof (request as { focusUri?: unknown }).focusUri === 'string'
        ? (request as { focusUri: string }).focusUri
        : activeDocumentUri ?? undefined;
      const timeoutMs = typeof (request as { timeoutMs?: unknown }).timeoutMs === 'number'
        ? (request as { timeoutMs: number }).timeoutMs
        : undefined;

      return runOrcaWriteOperation({
        executablePath,
        sessionLibrary,
        focusUri,
        timeoutMs,
        operation: params.command === 'powerbuilder.regenerateOrcaLibraries' ? 'regenerate' : 'rebuild',
      }, {
        workspaceFolders,
        workspaceState,
        fs,
        runOrca: (orcaRequest) => orcaRunner.run(orcaRequest),
        journal: runtimeJournal,
      });
    }
    case 'powerbuilder.inspectHierarchy': {
      const [uriArg, lineArg, characterArg] = params.arguments ?? [];
      const uri = typeof uriArg === 'string' ? uriArg : activeDocumentUri;
      if (!uri) {
        return { available: false, reason: 'No hay documento activo.' };
      }

      const line = typeof lineArg === 'number' ? lineArg : undefined;
      const character = typeof characterArg === 'number' ? characterArg : undefined;
      const readinessDecision = decideFeatureReadiness('definition', buildRuntimeProgressReadiness(uri), {
        latencyOverloaded: isLatencyPressureHigh()
      });
      if (readinessDecision.action === 'block') {
        return { available: false, reason: readinessDecision.reason, uri, line, character };
      }

      const openDocument = documents.get(uri);
      let content = openDocument?.getText();
      if (!content) {
        try {
          content = await fs.readFile(uri);
        } catch {
          return { available: false, reason: 'No se pudo leer el documento.', uri, line, character };
        }
      }
      const projectContext = workspaceState.getProjectContextForFile(uri);
      const objectInfo = buildObjectInfo({
        uri,
        content,
        line,
        library: projectContext?.libraries[0],
        project: projectContext?.projectUri
      });
      const focusType = objectInfo.globalType
        ?? knowledgeBase.getEntitiesByUri(uri).find((entity) => entity.kind === EntityKind.Type)?.name
        ?? null;

      if (!focusType) {
        return {
          available: false,
          reason: 'No se pudo determinar el tipo activo.',
          uri,
          line,
          character,
          objectInfo
        };
      }

      return {
        available: true,
        uri,
        line,
        character,
        objectInfo,
        ...buildHierarchyInspection(focusType, inheritanceGraph, knowledgeBase, systemCatalog)
      };
    }
    case 'powerbuilder.querySymbols': {
      const [queryArg, limitArg] = params.arguments ?? [];
      const query = typeof queryArg === 'string' ? queryArg : '';
      const limit = typeof limitArg === 'number' && Number.isFinite(limitArg)
        ? Math.max(0, Math.trunc(limitArg))
        : 200;
      return queryApiSymbols(query, knowledgeBase, limit);
    }
    case 'powerbuilder.currentObjectContext': {
      const [uriArg, lineArg, characterArg, excerptArg, refsArg] = params.arguments ?? [];
      const uri = typeof uriArg === 'string' ? uriArg : undefined;
      if (!uri) {
        return { available: false, reason: 'No se recibió una URI válida.' };
      }

      const openDocument = documents.get(uri);
      let document = openDocument;
      if (!document) {
        try {
          const content = await fs.readFile(uri);
          document = TextDocument.create(uri, 'powerbuilder', 0, content);
        } catch {
          return { available: false, reason: 'No se pudo leer el documento solicitado.', uri };
        }
      }

      return buildCurrentObjectContext(
        document,
        {
          ...(typeof lineArg === 'number' ? { line: Math.max(0, Math.trunc(lineArg)) } : {}),
          ...(typeof characterArg === 'number' ? { character: Math.max(0, Math.trunc(characterArg)) } : {}),
          ...(typeof excerptArg === 'number' ? { maxExcerptLines: Math.max(1, Math.trunc(excerptArg)) } : {}),
          ...(typeof refsArg === 'number' ? { maxReferencedSymbols: Math.max(0, Math.trunc(refsArg)) } : {}),
        },
        knowledgeBase,
        inheritanceGraph,
        systemCatalog,
        {
          workspaceState,
          hotContext: hotContextCache,
        }
      );
    }
    case 'powerbuilder.analyzeImpact': {
      const [uriArg, lineArg, characterArg, safeRefsArg] = params.arguments ?? [];
      const uri = typeof uriArg === 'string' ? uriArg : undefined;
      if (!uri) {
        return {
          available: false,
          reason: 'No se recibió una URI válida.',
          safeReferences: [],
          probableImpactFiles: [],
          descendants: [],
          overrides: [],
          relatedEvents: [],
          relatedDataWindows: [],
          affectedSymbols: [],
          buildTargets: [],
        };
      }

      const openDocument = documents.get(uri);
      let document = openDocument;
      if (!document) {
        try {
          const content = await fs.readFile(uri);
          document = TextDocument.create(uri, 'powerbuilder', 0, content);
        } catch {
          return {
            available: false,
            reason: 'No se pudo leer el documento solicitado.',
            safeReferences: [],
            probableImpactFiles: [],
            descendants: [],
            overrides: [],
            relatedEvents: [],
            relatedDataWindows: [],
            affectedSymbols: [],
            buildTargets: [],
          };
        }
      }

      return buildImpactAnalysis(
        document,
        {
          ...(typeof lineArg === 'number' ? { line: Math.max(0, Math.trunc(lineArg)) } : {}),
          ...(typeof characterArg === 'number' ? { character: Math.max(0, Math.trunc(characterArg)) } : {}),
          ...(typeof safeRefsArg === 'number' ? { maxSafeReferences: Math.max(0, Math.trunc(safeRefsArg)) } : {}),
        },
        knowledgeBase,
        inheritanceGraph,
        systemCatalog,
        async (targetUri) => {
          const opened = documents.get(targetUri);
          if (opened) {
            return opened.getText();
          }
          try {
            return await fs.readFile(targetUri);
          } catch {
            return null;
          }
        },
        {
          workspaceState,
          hotContext: hotContextCache,
        }
      );
    }
    case 'powerbuilder.safeEditPlan': {
      const [uriArg, lineArg, characterArg, safeRefsArg] = params.arguments ?? [];
      const uri = typeof uriArg === 'string' ? uriArg : undefined;
      if (!uri) {
        return {
          available: false,
          blocked: true,
          reason: 'No se recibió una URI válida.',
          objects: [],
          files: [],
          risks: [],
          recommendedTests: [],
          docsToReview: [],
          blockedReasons: ['No se recibió una URI válida.'],
        };
      }

      const openDocument = documents.get(uri);
      let document = openDocument;
      if (!document) {
        try {
          const content = await fs.readFile(uri);
          document = TextDocument.create(uri, 'powerbuilder', 0, content);
        } catch {
          return {
            available: false,
            blocked: true,
            reason: 'No se pudo leer el documento solicitado.',
            objects: [],
            files: [],
            risks: [],
            recommendedTests: [],
            docsToReview: [],
            blockedReasons: ['No se pudo leer el documento solicitado.'],
          };
        }
      }

      return buildSafeEditPlan(
        document,
        {
          ...(typeof lineArg === 'number' ? { line: Math.max(0, Math.trunc(lineArg)) } : {}),
          ...(typeof characterArg === 'number' ? { character: Math.max(0, Math.trunc(characterArg)) } : {}),
          ...(typeof safeRefsArg === 'number' ? { maxSafeReferences: Math.max(0, Math.trunc(safeRefsArg)) } : {}),
        },
        knowledgeBase,
        inheritanceGraph,
        systemCatalog,
        async (targetUri) => {
          const opened = documents.get(targetUri);
          if (opened) {
            return opened.getText();
          }
          try {
            return await fs.readFile(targetUri);
          } catch {
            return null;
          }
        },
        {
          workspaceState,
          hotContext: hotContextCache,
        }
      );
    }
    case 'powerbuilder.safeBatchRefactorPlan': {
      const [requestArg] = params.arguments ?? [];
      const request = typeof requestArg === 'object' && requestArg !== null ? requestArg as import('./../shared/publicApi').ApiSafeBatchRefactorPlanRequest : undefined;

      return buildSafeBatchRefactorPlan(
        request,
        async (targetUri) => {
          const opened = documents.get(targetUri);
          if (opened) {
            return opened;
          }
          try {
            const content = await fs.readFile(targetUri);
            return TextDocument.create(targetUri, 'powerbuilder', 0, content);
          } catch {
            return null;
          }
        },
        knowledgeBase,
        inheritanceGraph,
        systemCatalog,
        async (targetUri) => {
          const opened = documents.get(targetUri);
          if (opened) {
            return opened.getText();
          }
          try {
            return await fs.readFile(targetUri);
          } catch {
            return null;
          }
        },
        {
          workspaceState,
          hotContext: hotContextCache,
        }
      );
    }
    case 'powerbuilder.applySpecDrivenPblUpdate': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        return {
          available: false,
          blocked: true,
          reason: 'No se recibió una solicitud válida para el update PBL spec-driven.',
          blockedReasons: ['No se recibió una solicitud válida para el update PBL spec-driven.'],
          safeEditPlan: {
            available: false,
            blocked: true,
            reason: 'No se recibió una solicitud válida para el update PBL spec-driven.',
            objects: [],
            files: [],
            risks: [],
            recommendedTests: [],
            docsToReview: [],
            blockedReasons: ['No se recibió una solicitud válida para el update PBL spec-driven.'],
          },
          appliedEdits: [],
          ...(buildOrcaJournal.storageUri ? { journalUri: buildOrcaJournal.storageUri } : {}),
        };
      }

      const uri = typeof (request as { uri?: unknown }).uri === 'string'
        ? (request as { uri: string }).uri
        : undefined;
      if (!uri) {
        return {
          available: false,
          blocked: true,
          reason: 'No se recibió una URI válida para el update PBL spec-driven.',
          blockedReasons: ['No se recibió una URI válida para el update PBL spec-driven.'],
          safeEditPlan: {
            available: false,
            blocked: true,
            reason: 'No se recibió una URI válida para el update PBL spec-driven.',
            objects: [],
            files: [],
            risks: [],
            recommendedTests: [],
            docsToReview: [],
            blockedReasons: ['No se recibió una URI válida para el update PBL spec-driven.'],
          },
          appliedEdits: [],
          ...(buildOrcaJournal.storageUri ? { journalUri: buildOrcaJournal.storageUri } : {}),
        };
      }

      const openDocument = documents.get(uri);
      let document = openDocument;
      if (!document) {
        try {
          const content = await fs.readFile(uri);
          document = TextDocument.create(uri, 'powerbuilder', 0, content);
        } catch {
          return {
            available: false,
            blocked: true,
            reason: 'No se pudo leer el documento solicitado para el update PBL spec-driven.',
            blockedReasons: ['No se pudo leer el documento solicitado para el update PBL spec-driven.'],
            safeEditPlan: {
              available: false,
              blocked: true,
              reason: 'No se pudo leer el documento solicitado para el update PBL spec-driven.',
              objects: [],
              files: [],
              risks: [],
              recommendedTests: [],
              docsToReview: [],
              blockedReasons: ['No se pudo leer el documento solicitado para el update PBL spec-driven.'],
            },
            appliedEdits: [],
            ...(buildOrcaJournal.storageUri ? { journalUri: buildOrcaJournal.storageUri } : {}),
          };
        }
      }

      return applySpecDrivenPblUpdate(
        document,
        request as import('../shared/publicApi').ApiSpecDrivenPblUpdateRequest,
        {
          workspaceFolders,
          workspaceState,
          fs,
          kb: knowledgeBase,
          graph: inheritanceGraph,
          systemCatalog,
          runOrca: (orcaRequest) => orcaRunner.run(orcaRequest),
          loadSource: async (targetUri) => {
            const opened = documents.get(targetUri);
            if (opened) {
              return opened.getText();
            }
            try {
              return await fs.readFile(targetUri);
            } catch {
              return null;
            }
          },
          journal: runtimeJournal,
          journalUri: buildOrcaJournal.storageUri,
        }
      );
    }
    case 'powerbuilder.applySpecDrivenPblUpdateBatch': {
      const request = Array.isArray(params.arguments) ? params.arguments[0] : undefined;
      if (!request || typeof request !== 'object') {
        return {
          blocked: true,
          stoppedEarly: false,
          total: 0,
          succeeded: 0,
          blockedCount: 0,
          items: [],
          ...(buildOrcaJournal.storageUri ? { journalUri: buildOrcaJournal.storageUri } : {}),
        };
      }

      return applySpecDrivenPblUpdateBatch(
        request as import('../shared/publicApi').ApiSpecDrivenPblUpdateBatchRequest,
        {
          workspaceFolders,
          workspaceState,
          fs,
          kb: knowledgeBase,
          graph: inheritanceGraph,
          systemCatalog,
          runOrca: (orcaRequest) => orcaRunner.run(orcaRequest),
          loadSource: async (targetUri) => {
            const opened = documents.get(targetUri);
            if (opened) {
              return opened.getText();
            }
            try {
              return await fs.readFile(targetUri);
            } catch {
              return null;
            }
          },
          loadDocument: async (targetUri) => {
            const opened = documents.get(targetUri);
            if (opened) {
              return opened;
            }
            const content = await fs.readFile(targetUri);
            return TextDocument.create(targetUri, 'powerbuilder', 0, content);
          },
          journal: runtimeJournal,
          journalUri: buildOrcaJournal.storageUri,
        }
      );
    }
    case 'powerbuilder.semanticWorkspaceManifest': {
      const [maxObjectsArg, maxSymbolsArg] = params.arguments ?? [];
      const progressReadiness = buildRuntimeProgressReadiness();
      return buildSemanticWorkspaceManifest(
        {
          ...(typeof maxObjectsArg === 'number' ? { maxObjects: Math.max(1, Math.trunc(maxObjectsArg)) } : {}),
          ...(typeof maxSymbolsArg === 'number' ? { maxSymbols: Math.max(1, Math.trunc(maxSymbolsArg)) } : {}),
        },
        knowledgeBase,
        inheritanceGraph,
        workspaceState,
        getDiagnosticsSummary(),
        {
          state: progressReadiness.readiness.state,
          detail: progressReadiness.readiness.detail,
        }
      );
    }
    case 'powerbuilder.runSemanticCacheMaintenance': {
      if (!cacheStore) {
        throw new Error('No hay una caché semántica persistida activa para mantener.');
      }

      return cacheStore.runMaintenance(buildCacheCheckpointMetadata());
    }
    case 'powerbuilder.crossProjectSymbolConflicts': {
      const [symbolNameArg, maxConflictsArg, maxCandidatesPerConflictArg] = params.arguments ?? [];
      return buildCrossProjectSymbolConflicts(
        {
          ...(typeof symbolNameArg === 'string' && symbolNameArg.trim().length > 0 ? { symbolName: symbolNameArg } : {}),
          ...(typeof maxConflictsArg === 'number' ? { maxConflicts: Math.max(0, Math.trunc(maxConflictsArg)) } : {}),
          ...(typeof maxCandidatesPerConflictArg === 'number' ? { maxCandidatesPerConflict: Math.max(0, Math.trunc(maxCandidatesPerConflictArg)) } : {}),
        },
        knowledgeBase,
        workspaceState,
      );
    }
    case 'powerbuilder.workspaceMigrationAssistant': {
      const [preferredTargetModeArg, maxRecommendationsArg] = params.arguments ?? [];
      return buildWorkspaceMigrationAssistant(
        {
          ...(preferredTargetModeArg === 'workspace' || preferredTargetModeArg === 'solution'
            ? { preferredTargetMode: preferredTargetModeArg }
            : {}),
          ...(typeof maxRecommendationsArg === 'number' ? { maxRecommendations: Math.max(0, Math.trunc(maxRecommendationsArg)) } : {}),
        },
        workspaceState,
      );
    }
    case 'powerbuilder.dependencyGraph': {
      const [uriArg, objectNameArg, maxDependenciesArg, maxDependentsArg] = params.arguments ?? [];
      return buildPowerBuilderDependencyGraph(
        {
          ...(typeof uriArg === 'string' ? { uri: uriArg } : {}),
          ...(typeof objectNameArg === 'string' && objectNameArg.trim().length > 0 ? { objectName: objectNameArg } : {}),
          ...(typeof maxDependenciesArg === 'number' ? { maxDependencies: Math.max(0, Math.trunc(maxDependenciesArg)) } : {}),
          ...(typeof maxDependentsArg === 'number' ? { maxDependents: Math.max(0, Math.trunc(maxDependentsArg)) } : {}),
        },
        knowledgeBase,
        workspaceState,
      );
    }
    case 'powerbuilder.codeMetrics': {
      const [maxObjectsArg] = params.arguments ?? [];
      return buildPowerBuilderCodeMetrics(
        {
          ...(typeof maxObjectsArg === 'number' ? { maxObjects: Math.max(0, Math.trunc(maxObjectsArg)) } : {}),
        },
        knowledgeBase,
        workspaceState,
        getDiagnosticsSummary(),
      );
    }
    case 'powerbuilder.technicalDebtReport': {
      const [maxObjectsArg, maxHotspotsArg, maxRecommendationsArg] = params.arguments ?? [];
      return buildPowerBuilderTechnicalDebtReport(
        {
          ...(typeof maxObjectsArg === 'number' ? { maxObjects: Math.max(0, Math.trunc(maxObjectsArg)) } : {}),
          ...(typeof maxHotspotsArg === 'number' ? { maxHotspots: Math.max(0, Math.trunc(maxHotspotsArg)) } : {}),
          ...(typeof maxRecommendationsArg === 'number' ? { maxRecommendations: Math.max(0, Math.trunc(maxRecommendationsArg)) } : {}),
        },
        knowledgeBase,
        workspaceState,
        getDiagnosticsSummary(),
      );
    }
    case 'powerbuilder.dataWindowSqlLineage': {
      const [uriArg, lineArg, dataObjectNameArg, maxDepthArg] = params.arguments ?? [];
      return buildDataWindowSqlLineage(
        {
          ...(typeof uriArg === 'string' ? { uri: uriArg } : {}),
          ...(typeof lineArg === 'number' ? { line: Math.max(0, Math.trunc(lineArg)) } : {}),
          ...(typeof dataObjectNameArg === 'string' && dataObjectNameArg.trim().length > 0 ? { dataObjectName: dataObjectNameArg } : {}),
          ...(typeof maxDepthArg === 'number' ? { maxDepth: Math.max(0, Math.trunc(maxDepthArg)) } : {}),
        },
        knowledgeBase,
      );
    }
    default:
      return null;
  }
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
