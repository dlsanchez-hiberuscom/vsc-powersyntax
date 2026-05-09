import { CodeActionKind, type Connection, type InitializeParams, type InitializeResult, TextDocumentSyncKind } from 'vscode-languageserver/node';

import { PROGRESS_NOTIFICATION, SERVER_NAME, type ProgressNotification } from '../../shared/types';
import { createSemanticCacheStore, type SemanticCacheStore } from '../cache/cacheStore';
import { createCacheCheckpoint } from '../cache/cacheCheckpoint';
import type { SemanticCacheCheckpoint } from '../cache/cacheSchema';
import { restoreServingCacheSnapshot } from '../cache/servingCachePersistence';
import { BuildOrcaJournalStore } from '../runtime/buildOrcaJournalStore';
import { getSemanticTokensLegend } from '../features/semanticTokens';
import { formatTiming, measureMsAsync } from '../runtime/timing';
import { discoverWorkspace, discoverWorkspaceBounded } from '../workspace/discovery';
import { WorkspaceState } from '../workspace/workspaceState';
import { restoreOrcaStagingAliases } from '../build/orcaStagingExport';
import { indexWorkspace } from '../indexer/workspaceIndexer';
import { TaskPriority, type TaskScheduler } from '../runtime/scheduler';
import { NodeFileSystem } from '../system/fileSystem';
import { DocumentCache } from '../knowledge/DocumentCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { ServingCache } from '../knowledge/ServingCache';
import { sanitizeDocumentationLocaleSetting, type DocumentationLocaleSetting } from '../knowledge/system/localization';
import type { SemanticCacheCheckpointMetadata } from '../cache/cacheSchema';
import type { DiscoveryProgressState } from '../features/progressReadiness';

export const SERVER_EXECUTE_COMMANDS = [
  'powerbuilder.showStats',
  'powerbuilder.showInteractiveServingStats',
  'powerbuilder.workspaceCheckCatalogSummary',
  'powerbuilder.objectInfo',
  'powerbuilder.querySymbols',
  'powerbuilder.crossProjectSymbolConflicts',
  'powerbuilder.workspaceMigrationAssistant',
  'powerbuilder.dependencyGraph',
  'powerbuilder.codeMetrics',
  'powerbuilder.technicalDebtReport',
  'powerbuilder.dataWindowSqlLineage',
  'powerbuilder.currentObjectContext',
  'powerbuilder.analyzeImpact',
  'powerbuilder.safeEditPlan',
  'powerbuilder.safeBatchRefactorPlan',
  'powerbuilder.explainSystemSymbol',
  'powerbuilder.explainSemanticQuery',
  'powerbuilder.applySpecDrivenPblUpdate',
  'powerbuilder.applySpecDrivenPblUpdateBatch',
  'powerbuilder.objectExplorerProjection',
  'powerbuilder.semanticWorkspaceManifest',
  'powerbuilder.formatDocument',
  'powerbuilder.listPbAutoBuildBuildFiles',
  'powerbuilder.listPbAutoBuildBuildInventory',
  'powerbuilder.runOrcaScript',
] as const;

export interface InitializeHandlerContext {
  connection: Connection;
  serverStartTime: number;
  buildOrcaJournal: BuildOrcaJournalStore;
  setWorkspaceFolders(folders: string[]): void;
  setCacheStorageUri(uri: string | null): void;
  setDocumentationLocaleSetting(setting: DocumentationLocaleSetting): void;
  setUiLocale(locale: string | null): void;
}

type InitializeOptions = {
  cacheStorageUri?: string;
  documentationLocale?: unknown;
  uiLocale?: string;
};

type DidChangeConfigurationPayload = {
  settings?: {
    vscPowerSyntax?: {
      languageServices?: {
        documentationLocale?: unknown;
      };
    };
    languageServices?: {
      documentationLocale?: unknown;
    };
  };
};

function readDocumentationLocaleSetting(change: DidChangeConfigurationPayload['settings']): DocumentationLocaleSetting {
  const rawValue = change?.vscPowerSyntax?.languageServices?.documentationLocale
    ?? change?.languageServices?.documentationLocale;
  return sanitizeDocumentationLocaleSetting(rawValue);
}

type RuntimeProgressReadinessSnapshot = {
  readiness: {
    state: string;
  };
};

export interface InitializedHandlerContext {
  connection: Connection;
  serverStartTime: number;
  scheduler: TaskScheduler;
  fs: NodeFileSystem;
  workspaceState: WorkspaceState;
  documentCache: DocumentCache;
  knowledgeBase: KnowledgeBase;
  servingCache: ServingCache;
  publishRuntimeProgressReadiness(): void;
  buildRuntimeProgressReadiness(activeUriOverride?: string | null): RuntimeProgressReadinessSnapshot;
  sendProgress(progress: ProgressNotification): void;
  transitionReadiness(state: 'degraded' | 'error', detail: string): void;
  discoveryProgress: DiscoveryProgressState;
  getWorkspaceFolders(): string[];
  getCacheStorageUri(): string | null;
  getActiveDocumentUri(): string | null;
  republishOpenDiagnostics(uris?: readonly string[]): void;
  setCacheStore(store: SemanticCacheStore | null): void;
  buildCacheCheckpointMetadata(): Partial<SemanticCacheCheckpointMetadata>;
  persistCheckpoint(checkpoint: SemanticCacheCheckpoint): Promise<void>;
  persistServingSnapshot(): Promise<void>;
  setPersistenceRestoreReport(report: {
    reason?: string;
    state?: 'restored' | 'reused' | 'rebuilt';
    documents: number;
    servingEntries: number;
  }): void;
}

export function registerInitializeHandler(context: InitializeHandlerContext): void {
  const {
    connection,
    serverStartTime,
    buildOrcaJournal,
    setWorkspaceFolders,
    setCacheStorageUri,
    setDocumentationLocaleSetting,
    setUiLocale,
  } = context;

  connection.onInitialize((params: InitializeParams): InitializeResult => {
    const initElapsed = performance.now() - serverStartTime;
    connection.console.log(formatTiming('Proceso del servidor hasta onInitialize', initElapsed));

    const workspaceFolders = params.workspaceFolders?.map((folder) => folder.uri) ?? [];
    setWorkspaceFolders(workspaceFolders);
    buildOrcaJournal.configure(workspaceFolders);

    const initOptions = params.initializationOptions as InitializeOptions | undefined;
    setCacheStorageUri(typeof initOptions?.cacheStorageUri === 'string' ? initOptions.cacheStorageUri : null);
    setDocumentationLocaleSetting(sanitizeDocumentationLocaleSetting(initOptions?.documentationLocale));
    setUiLocale(typeof initOptions?.uiLocale === 'string' ? initOptions.uiLocale : null);

    connection.onDidChangeConfiguration((change: DidChangeConfigurationPayload) => {
      setDocumentationLocaleSetting(readDocumentationLocaleSetting(change.settings));
    });

    return {
      capabilities: {
        textDocumentSync: TextDocumentSyncKind.Incremental,
        documentSymbolProvider: true,
        hoverProvider: true,
        workspaceSymbolProvider: true,
        definitionProvider: true,
        referencesProvider: true,
        completionProvider: {
          triggerCharacters: ['.'],
          resolveProvider: true,
        },
        signatureHelpProvider: {
          triggerCharacters: ['(', ',']
        },
        semanticTokensProvider: {
          legend: getSemanticTokensLegend(),
          full: true
        },
        linkedEditingRangeProvider: true,
        codeActionProvider: {
          codeActionKinds: [CodeActionKind.QuickFix]
        },
        codeLensProvider: { resolveProvider: false },
        renameProvider: { prepareProvider: true },
        executeCommandProvider: {
          commands: [...SERVER_EXECUTE_COMMANDS]
        }
      }
    };
  });
}

export function registerInitializedHandler(context: InitializedHandlerContext): void {
  const {
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
    transitionReadiness,
    discoveryProgress,
    getWorkspaceFolders,
    getCacheStorageUri,
    getActiveDocumentUri,
    republishOpenDiagnostics,
    setCacheStore,
    buildCacheCheckpointMetadata,
    persistCheckpoint,
    persistServingSnapshot,
    setPersistenceRestoreReport,
  } = context;

  connection.onInitialized(() => {
    const readyElapsed = performance.now() - serverStartTime;
    connection.console.log(`${SERVER_NAME} inicializado.`);
    connection.console.log(formatTiming('Proceso del servidor hasta onInitialized (listo)', readyElapsed));

    const workspaceFolders = getWorkspaceFolders();
    if (workspaceFolders.length > 0) {
      connection.console.log(`[WORKSPACE] Iniciando descubrimiento en ${workspaceFolders.length} raíces (roots)...`);
      discoveryProgress.current = 0;
      discoveryProgress.total = workspaceFolders.length;
      discoveryProgress.startTimeMs = Date.now();
      publishRuntimeProgressReadiness();

      scheduler.enqueueBackground({
        id: 'workspace-discovery',
        priority: TaskPriority.Background,
        workload: 'critical-initialization',
        execute: async (token) => {
          let currentCacheStore: SemanticCacheStore | null = null;
          let earlyRestoreApplied = false;
          let earlyRestoreServingEntries = 0;
          const cacheStorageUri = getCacheStorageUri();

          if (cacheStorageUri) {
            currentCacheStore = createSemanticCacheStore(fs, cacheStorageUri, workspaceFolders);
            setCacheStore(currentCacheStore);
            const earlyRestore = await currentCacheStore.load({ rootUris: workspaceFolders });
            if (earlyRestore.decision.action === 'reuse') {
              workspaceState.restoreDiscoverySnapshot(earlyRestore.checkpoint.metadata.discovery);
              if (earlyRestore.checkpoint.documents.length > 0) {
                earlyRestoreApplied = true;
                documentCache.restoreDocumentRecords(earlyRestore.checkpoint.documents);
                knowledgeBase.restoreDocumentRecords(earlyRestore.checkpoint.documents, earlyRestore.checkpoint.semanticEpoch);
                earlyRestoreServingEntries = await restoreServingCacheSnapshot(
                  servingCache,
                  currentCacheStore,
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
          const useBoundedDiscovery = earlyRestoreApplied || process.env.PB_USE_BOUNDED_DISCOVERY === '1';
          let boundedDiscoveryResult: { skipped: number; processed: number } | undefined;
          const { elapsedMs: discoveryMs } = await measureMsAsync(async () => {
            const onProgress = (current: number, total: number) => {
              discoveryProgress.current = current;
              discoveryProgress.total = total;
              publishRuntimeProgressReadiness();
            };

            if (useBoundedDiscovery) {
              boundedDiscoveryResult = await discoverWorkspaceBounded(workspaceFolders, fs, discoveredState, token, {
                onProgress,
              });
              return;
            }

            await discoverWorkspace(workspaceFolders, fs, discoveredState, token, onProgress);
          });

          if (token.isCancelled) {
            connection.console.log(`[WORKSPACE] Descubrimiento cancelado o pausado.`);
            sendProgress({ phase: 'partial' });
            transitionReadiness('degraded', 'partial-discovery');
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
          if (boundedDiscoveryResult) {
            connection.console.log(
              `  - Bounded discovery: processed=${boundedDiscoveryResult.processed}, skipped=${boundedDiscoveryResult.skipped}`,
            );
          }

          const projectModel = workspaceState.getProjectModel();
          connection.console.log(`  - Proyectos detectados: ${projectModel?.getProjects().length ?? 0}`);
          connection.console.log(`  - Build files PBAutoBuild: ${workspaceState.getBuildFileSummary().total}`);

          const cacheMetadata = buildCacheCheckpointMetadata();

          if (cacheStorageUri) {
            currentCacheStore = createSemanticCacheStore(fs, cacheStorageUri, workspaceFolders, projectModel);
            setCacheStore(currentCacheStore);
            const restore = await currentCacheStore.load(cacheMetadata);
            if (restore.decision.action === 'reuse' && restore.checkpoint.documents.length > 0) {
              if (!earlyRestoreApplied) {
                documentCache.restoreDocumentRecords(restore.checkpoint.documents);
                knowledgeBase.restoreDocumentRecords(restore.checkpoint.documents, restore.checkpoint.semanticEpoch);
                const restoredServingEntries = await restoreServingCacheSnapshot(
                  servingCache,
                  currentCacheStore,
                  restore.checkpoint.semanticEpoch
                );
                setPersistenceRestoreReport({
                  reason: restore.decision.reason,
                  state: 'restored',
                  documents: restore.checkpoint.documents.length,
                  servingEntries: restoredServingEntries,
                });
                connection.console.log(
                  `[CACHE] Warm resume restauró ${restore.checkpoint.documents.length} documentos (epoch ${restore.checkpoint.semanticEpoch}).`
                );
                if (restoredServingEntries > 0) {
                  connection.console.log(`[CACHE] ServingCache restauró ${restoredServingEntries} entries persistidas.`);
                }
              } else {
                setPersistenceRestoreReport({
                  reason: restore.decision.reason,
                  state: 'restored',
                  documents: restore.checkpoint.documents.length,
                  servingEntries: earlyRestoreServingEntries,
                });
                connection.console.log(
                  `[CACHE] Warm resume validó metadata compatible tras restaurar ${restore.checkpoint.documents.length} documentos antes del discovery.`
                );
              }
            } else if (restore.decision.action === 'reuse') {
              setPersistenceRestoreReport({
                reason: restore.decision.reason,
                state: 'reused',
                documents: 0,
                servingEntries: 0,
              });
              connection.console.log('[CACHE] Warm resume reutilizó metadata compatible sin documentos persistidos.');
            } else {
              if (earlyRestoreApplied) {
                documentCache.clear();
                knowledgeBase.clear();
                servingCache.invalidate();
              }
              setPersistenceRestoreReport({
                reason: restore.decision.reason,
                state: 'rebuilt',
                documents: 0,
                servingEntries: 0,
              });
              connection.console.log(
                `[CACHE] Warm resume descartado: ${restore.decision.reason ?? 'sin estado persistente compatible'}.`
              );
            }

            await persistCheckpoint(
              createCacheCheckpoint(
                knowledgeBase.semanticEpoch,
                documentCache.exportDocumentRecords(),
                cacheMetadata
              )
            );
          }

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
                getActiveDocumentUri() ?? undefined
              );
            });

            if (!token.isCancelled) {
              const stats = knowledgeBase.getStats();
              const runtimeStatus = buildRuntimeProgressReadiness();
              republishOpenDiagnostics();
              connection.console.log(`[WORKSPACE] Indexación completada:`);
              connection.console.log(`  - Tiempos: ${formatTiming('indexWorkspace', indexingMs)}`);
              connection.console.log(`  - Entidades en KB: ${stats.totalEntities}`);
              if (runtimeStatus.readiness.state === 'degraded') {
                publishRuntimeProgressReadiness();
              } else {
                if (currentCacheStore) {
                  await persistCheckpoint(
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
              transitionReadiness('degraded', 'partial-index');
            }
          } else {
            publishRuntimeProgressReadiness();
          }
        }
      }).catch(err => {
        connection.console.error(`[ERROR] Descubrimiento de workspace: ${String(err)}`);
        void connection.sendNotification(PROGRESS_NOTIFICATION, { phase: 'partial' } satisfies ProgressNotification);
        transitionReadiness('error', String(err));
      });
    }
  });
}