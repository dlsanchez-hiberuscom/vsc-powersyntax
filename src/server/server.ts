import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  InitializeParams,
  InitializeResult,
  Hover,
  Diagnostic,
  CodeActionKind
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { SERVER_NAME } from '../shared/types';
import {
  PROGRESS_NOTIFICATION,
  type ProgressNotification
} from '../shared/types';
import { invalidateDocumentAnalysis, clearDocumentAnalysisCache, setAnalysisBackends } from './analysis/analysisCache';
import { getAnalysisCacheStats } from './analysis/analysisCache';
import {
  cancelScheduledDiagnostics,
  clearAllScheduledDiagnostics,
  publishDiagnosticsNow,
  scheduleDiagnostics
} from './analysis/diagnosticScheduler';
import { extractDocumentSymbols } from './features/documentSymbols';
import { provideHover } from './features/hover';
import { provideWorkspaceSymbols } from './features/workspaceSymbols';
import { provideDefinition } from './features/definition';
import { provideReferences } from './features/references';
import { provideSignatureHelp } from './features/signatureHelp';
import { provideCompletion } from './features/completion';
import { getSemanticTokensLegend, provideSemanticTokens } from './features/semanticTokens';
import { provideCodeActions } from './features/codeActions';
import { provideReferenceCodeLenses } from './features/codeLensReferences';
import { validateRenameTarget } from './features/renamePreflight';
import { measureMs, measureMsAsync, formatTiming, FirstInvocationTracker } from './runtime/timing';
import { TaskScheduler, TaskPriority } from './runtime/scheduler';
import { NodeFileSystem } from './system/fileSystem';
import { createSemanticCacheStore, type SemanticCacheStore } from './cache/cacheStore';
import { createCacheCheckpoint } from './cache/cacheCheckpoint';
import {
  persistServingCacheSnapshot,
  restoreServingCacheSnapshot
} from './cache/servingCachePersistence';
import { ServingCacheFlushCoordinator } from './cache/servingCacheFlushCoordinator';
import { cacheServingResult, invalidateServingCacheEntries } from './cache/servingCacheRuntime';
import { discoverWorkspace } from './workspace/discovery';
import { WorkspaceState } from './workspace/workspaceState';
import { createReadinessTracker } from './workspace/readiness';
import { buildProjectRegistry } from './workspace/projectRegistry';
import { buildUnifiedProjectModel } from './workspace/unifiedProjectModel';
import { DocumentCache } from './knowledge/DocumentCache';
import { KnowledgeBase } from './knowledge/KnowledgeBase';
import { InheritanceGraph } from './knowledge/resolution/InheritanceGraph';
import { HotContextCache } from './knowledge/HotContextCache';
import { createSemanticInvalidationPlan } from './knowledge/semanticInvalidation';
import { ServingCache, makeKey as makeServingKey } from './knowledge/ServingCache';
import { getLastTrace } from './knowledge/queryTrace';
import { SystemCatalog } from './knowledge/system/SystemCatalog';
import { getIndexerStatus, indexWorkspace } from './indexer/workspaceIndexer';

// ---------------------------------------------------------------------------
// Inicialización (Bootstrap)
// ---------------------------------------------------------------------------

const serverStartTime = performance.now();

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const scheduler = new TaskScheduler();
const firstInvocation = new FirstInvocationTracker();
const readiness = createReadinessTracker();
const fs = new NodeFileSystem();
const workspaceState = new WorkspaceState();
const documentCache = new DocumentCache();
const knowledgeBase = new KnowledgeBase();
const inheritanceGraph = new InheritanceGraph(knowledgeBase);
const systemCatalog = new SystemCatalog();
const hotContextCache = new HotContextCache();
const servingCache = new ServingCache<unknown>();
let cacheStore: SemanticCacheStore | null = null;
let cacheStorageUri: string | null = null;
let lastServingSnapshotRestoreEntries = 0;
let lastServingSnapshotPersistEntries = 0;
const persistServingSnapshot = async (): Promise<void> => {
  if (!cacheStore) {
    lastServingSnapshotPersistEntries = 0;
    return;
  }

  lastServingSnapshotPersistEntries = await persistServingCacheSnapshot(servingCache, cacheStore, knowledgeBase.semanticEpoch);
};
const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {
  await persistServingSnapshot();
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
});

let activeDocumentUri: string | null = null;
let workspaceFolders: string[] = [];

scheduler.setLogger((msg) => connection.console.log(msg));

// ---------------------------------------------------------------------------
// Ciclo de Vida (Lifecycle)
// ---------------------------------------------------------------------------

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const initElapsed = performance.now() - serverStartTime;
  connection.console.log(formatTiming('Proceso del servidor hasta onInitialize', initElapsed));

  if (params.workspaceFolders) {
    workspaceFolders = params.workspaceFolders.map(f => f.uri);
  }
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
        commands: ['powerbuilder.showStats', 'powerbuilder.objectInfo']
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

    const sendProgress = (p: ProgressNotification): void => {
      void connection.sendNotification(PROGRESS_NOTIFICATION, p);
    };

    sendProgress({ phase: 'discovering' });
    readiness.transition('discovering');

    scheduler.enqueueBackground({
      id: 'workspace-discovery',
      priority: TaskPriority.Background,
      execute: async (token) => {
        const { elapsedMs: discoveryMs } = await measureMsAsync(async () => {
          await discoverWorkspace(workspaceFolders, fs, workspaceState, token);
        });

        if (token.isCancelled) {
          connection.console.log(`[WORKSPACE] Descubrimiento cancelado o pausado.`);
          sendProgress({ phase: 'partial' });
          readiness.transition('degraded', 'partial-discovery');
          return;
        }

        const filesCount = workspaceState.getAllSourceFiles().length;
        const roots = workspaceState.getRoots();
        connection.console.log(`[WORKSPACE] Descubrimiento completado:`);
        connection.console.log(`  - Tiempos: ${formatTiming('discoverWorkspace', discoveryMs)}`);
        connection.console.log(`  - Archivos de código: ${filesCount}`);
        connection.console.log(`  - PBW: ${roots.workspaces.length}, PBT: ${roots.targets.length}, PBL: ${roots.libraries.length}`);
        connection.console.log(`  - PBSLN: ${roots.solutions.length}, PBPROJ: ${roots.projects.length}`);
        connection.console.log(`  - Modo: ${workspaceState.getMode()}`);

        // Construir el project registry tras conocer topología y archivos.
        const registry = buildProjectRegistry(
          workspaceState.getTopology(),
          workspaceState.getAllSourceFiles()
        );
        workspaceState.setProjectRegistry(registry);
        const projectModel = buildUnifiedProjectModel(
          workspaceState.getTopology(),
          registry,
          workspaceState.getAllSourceFiles()
        );
        workspaceState.setProjectModel(projectModel);
        connection.console.log(`  - Proyectos detectados: ${registry.getAllProjects().length}`);

        const cacheMetadata = {
          workspaceMode: workspaceState.getMode(),
          rootUris: workspaceFolders,
          projectStats: projectModel.getStats()
        } as const;

        if (cacheStorageUri) {
          cacheStore = createSemanticCacheStore(fs, cacheStorageUri, workspaceFolders, projectModel);
          const restore = await cacheStore.load(cacheMetadata);
          if (restore.decision.action === 'reuse' && restore.checkpoint.documents.length > 0) {
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
            connection.console.log(
              `[CACHE] Warm resume descartado: ${restore.decision.reason ?? 'sin estado persistente compatible'}.`
            );
          }
        }

        // Iniciamos indexación incremental
        if (filesCount > 0) {
          connection.console.log(`[WORKSPACE] Iniciando indexación de ${filesCount} archivos...`);
          sendProgress({ phase: 'indexing', current: 0, total: filesCount, pass: 'structural' });
          readiness.transition('indexing', 'structural');

          const { elapsedMs: indexingMs } = await measureMsAsync(async () => {
            await indexWorkspace(
              fs,
              documentCache,
              knowledgeBase,
              workspaceState,
              token,
              (msg) => connection.console.error(msg),
              (current, total, meta) => {
                sendProgress({
                  phase: 'indexing',
                  current,
                  total,
                  pass: meta.pass,
                  degraded: meta.degraded,
                  skipped: meta.skipped,
                  failed: meta.failed,
                  budgetMs: meta.budgetMs
                });
                readiness.transition('indexing', meta.pass);
              }
            );
          });

          if (!token.isCancelled) {
            const stats = knowledgeBase.getStats();
            const indexerStatus = getIndexerStatus();
            connection.console.log(`[WORKSPACE] Indexación completada:`);
            connection.console.log(`  - Tiempos: ${formatTiming('indexWorkspace', indexingMs)}`);
            connection.console.log(`  - Entidades en KB: ${stats.totalEntities}`);
            if (indexerStatus.degraded) {
              readiness.transition('degraded', indexerStatus.degradedReason);
              sendProgress({
                phase: 'degraded',
                current: filesCount,
                total: filesCount,
                degraded: true,
                skipped: indexerStatus.byState.skipped,
                failed: indexerStatus.byState.failed
              });
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
              readiness.transition('ready');
              sendProgress({ phase: 'ready', current: filesCount, total: filesCount });
            }
          } else {
            connection.console.log(`[WORKSPACE] Indexación pausada cooperativamente.`);
            sendProgress({ phase: 'partial' });
            readiness.transition('degraded', 'partial-index');
          }
        } else {
          sendProgress({ phase: 'idle' });
          readiness.transition('idle');
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

  try {
    return scheduler.runInteractive({
      id: `documentSymbols-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
        const { result, elapsedMs } = measureMs(() => extractDocumentSymbols(document));

        if (firstInvocation.isFirst('documentSymbols')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primer documentSymbols (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('documentSymbols', elapsedMs));
        return result;
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

  try {
    return scheduler.runInteractive({
      id: `hover-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
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

        const { result, elapsedMs } = measureMs(() => provideHover(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph, hotContextCache));

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

  try {
    return scheduler.runInteractive({
      id: `definition-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
        hotContextCache.setActive(document.uri, knowledgeBase.version);
        const cacheKey = makeServingKey({
          feature: 'definition',
          uri: document.uri,
          line: params.position.line,
          character: params.position.character,
          kbVersion: knowledgeBase.version
        });
        const cached = servingCache.get(cacheKey);
        if (cached !== undefined) {
          return cached as ReturnType<typeof provideDefinition>;
        }

        const { result, elapsedMs } = measureMs(() => provideDefinition(document, params.position, knowledgeBase, inheritanceGraph, hotContextCache));

        if (firstInvocation.isFirst('definition')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primera definición (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('definition', elapsedMs));
        cacheServingResult(servingCache, cacheKey, result, servingCacheFlushCoordinator);
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

connection.onReferences((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;
  try {
    const sources: { uri: string; content: string }[] = [];
    for (const doc of documents.all()) {
      sources.push({ uri: doc.uri, content: doc.getText() });
    }
    const { result, elapsedMs } = measureMs(() =>
      provideReferences(document, params.position, knowledgeBase, sources, {
        includeDeclaration: params.context?.includeDeclaration ?? true
      })
    );
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

  try {
    return scheduler.runInteractive({
      id: `completion-${document.uri}`,
      priority: TaskPriority.Interactive,
      execute: () => {
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

        const { result, elapsedMs } = measureMs(() => provideCompletion(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph, hotContextCache, knowledgeBase.version));

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

  try {
    const { elapsedMs } = measureMs(() => publishDiagnosticsNow(connection, event.document, scheduler, knowledgeBase, systemCatalog, inheritanceGraph));

    if (firstInvocation.isFirst('diagnostics')) {
      const sinceStart = performance.now() - serverStartTime;
      connection.console.log(formatTiming('Primeros diagnósticos (desde el inicio)', sinceStart));
    }

    connection.console.log(formatTiming('diagnósticos (onDidOpen)', elapsedMs));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] diagnósticos onDidOpen: ${message}`);
  }
});

documents.onDidChangeContent((event) => {
  activeDocumentUri = event.document.uri;
  const invalidationPlan = createSemanticInvalidationPlan(event.document.uri, knowledgeBase);
  for (const uri of invalidationPlan.allUris) {
    hotContextCache.invalidateForUri(uri);
  }
  invalidateServingCacheEntries(servingCache, invalidationPlan.allUris, servingCacheFlushCoordinator);

  try {
    scheduleDiagnostics(connection, event.document, scheduler, undefined, knowledgeBase, systemCatalog, inheritanceGraph);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] diagnósticos onDidChangeContent: ${message}`);
  }
});

documents.onDidClose((event) => {
  cancelScheduledDiagnostics(event.document.uri);
  const invalidationPlan = createSemanticInvalidationPlan(event.document.uri, knowledgeBase);
  invalidateDocumentAnalysis(event.document.uri);
  for (const uri of invalidationPlan.allUris) {
    hotContextCache.invalidateForUri(uri);
  }
  invalidateServingCacheEntries(servingCache, invalidationPlan.allUris, servingCacheFlushCoordinator);

  connection.sendDiagnostics({
    uri: event.document.uri,
    diagnostics: [] as Diagnostic[]
  });
});

// ---------------------------------------------------------------------------
// Apagado (Shutdown)
// ---------------------------------------------------------------------------

connection.onShutdown(async () => {
  invalidateServingCacheEntries(servingCache, undefined, servingCacheFlushCoordinator);
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
  try {
    return provideCodeActions(
      params.textDocument.uri,
      document.getText(),
      params.context.diagnostics ?? []
    );
  } catch (error) {
    connection.console.error(`[ERROR] codeAction: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
});

connection.onCodeLens((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];
  try {
    // Reutilizamos los DocumentSymbols ya servidos para identificar callables.
    const docSymbols = extractDocumentSymbols(document);
    const lensSymbols: Array<{ name: string; range: import('vscode-languageserver/node').Range }> = [];
    const flatten = (syms: any[]): void => {
      for (const s of syms) {
        // SymbolKind.Function = 12, SymbolKind.Method = 6, SymbolKind.Event = 24
        if (s.kind === 12 || s.kind === 6 || s.kind === 24) {
          lensSymbols.push({ name: s.name, range: s.selectionRange ?? s.range });
        }
        if (Array.isArray(s.children) && s.children.length > 0) flatten(s.children);
      }
    };
    flatten(docSymbols);

    // Estimación rápida de referencias: cuenta de entidades global por nombre.
    const counts = new Map<string, number>();
    for (const s of lensSymbols) {
      const refs = knowledgeBase.findAllDefinitions(s.name);
      counts.set(s.name.toLowerCase(), Math.max(0, refs.length - 1));
    }
    return provideReferenceCodeLenses(lensSymbols, counts);
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
connection.onRenameRequest((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;
  const preflight = validateRenameTarget(params.newName, { systemCatalog });
  if (!preflight.ok) {
    connection.console.warn(`[rename] bloqueado: ${preflight.reason}`);
    return null;
  }
  const lines = document.getText().split(/\r?\n/);
  const lineText = lines[params.position.line] ?? '';
  const word = wordAt(lineText, params.position.character);
  if (!word) return null;

  // Solo aceptamos rename si el símbolo es local al scope actual.
  const scope = knowledgeBase.getScopeAt(params.textDocument.uri, params.position.line);
  if (!scope) return null;
  const target = scope.symbols.find((s) => s.name.toLowerCase() === word.word.toLowerCase());
  if (!target) {
    connection.console.warn(`[rename] solo se permite rename de variables locales en el scope actual.`);
    return null;
  }

  // Sustitución por word-boundary dentro del rango del scope.
  const edits: import('vscode-languageserver/node').TextEdit[] = [];
  const wordRe = new RegExp(`\\b${word.word.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'g');
  for (let i = scope.startLine; i <= scope.endLine; i++) {
    const text = lines[i] ?? '';
    let m: RegExpExecArray | null;
    wordRe.lastIndex = 0;
    while ((m = wordRe.exec(text)) !== null) {
      edits.push({
        range: {
          start: { line: i, character: m.index },
          end: { line: i, character: m.index + word.word.length }
        },
        newText: params.newName
      });
    }
  }
  return { changes: { [params.textDocument.uri]: edits } };
});

connection.onExecuteCommand(async (params) => {
  switch (params.command) {
    case 'powerbuilder.showStats': {
      // Spec 107: estadísticas del servidor expuestas como comando.
      const stats = knowledgeBase.getStats();
      const sched = scheduler.getStatus();
      const projectStats = workspaceState.getProjectModel()?.getStats();
      return {
        kb: stats,
        scheduler: sched,
        readiness: {
          state: readiness.getState(),
          detail: readiness.getDetail()
        },
        workspace: {
          mode: workspaceState.getMode(),
          files: workspaceState.getAllSourceFiles().length
        },
        indexer: getIndexerStatus(),
        caches: {
          analysis: getAnalysisCacheStats(),
          serving: servingCache.getStats(),
          documents: documentCache.getStats(),
          hotContext: hotContextCache.getStats()
        },
        projectModel: projectStats,
        lastQueryTrace: getLastTrace(),
        persistence: cacheStore
          ? {
            storageUri: cacheStore.storageUri,
            checkpointUri: cacheStore.checkpointUri,
            journalUri: cacheStore.journalUri,
            workspaceKey: cacheStore.workspaceKey,
            servingSnapshot: {
              lastRestoredEntries: lastServingSnapshotRestoreEntries,
              lastPersistedEntries: lastServingSnapshotPersistEntries
            }
          }
          : undefined
      };
    }
    default:
      return null;
  }
});

/** Spec 105: extracción de identificador alrededor de una columna. */
function wordAt(line: string, character: number): { word: string; start: number; end: number } | null {
  if (!line || character < 0 || character > line.length) return null;
  const ID_CHAR = /[A-Za-z0-9_$#%-]/;
  let start = character;
  while (start > 0 && ID_CHAR.test(line[start - 1])) start--;
  let end = character;
  while (end < line.length && ID_CHAR.test(line[end])) end++;
  if (start === end) return null;
  const word = line.slice(start, end);
  if (!/^[A-Za-z_]/.test(word)) return null;
  return { word, start, end };
}

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------

documents.listen(connection);
connection.listen();
