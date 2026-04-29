import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  InitializeParams,
  InitializeResult,
  Hover,
  Diagnostic
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { SERVER_NAME } from '../shared/types';
import { invalidateDocumentAnalysis, clearDocumentAnalysisCache, setAnalysisBackends } from './analysis/analysisCache';
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
import { provideSignatureHelp } from './features/signatureHelp';
import { provideCompletion } from './features/completion';
import { measureMs, measureMsAsync, formatTiming, FirstInvocationTracker } from './runtime/timing';
import { TaskScheduler, TaskPriority } from './runtime/scheduler';
import { NodeFileSystem } from './system/fileSystem';
import { discoverWorkspace } from './workspace/discovery';
import { WorkspaceState } from './workspace/workspaceState';
import { DocumentCache } from './knowledge/DocumentCache';
import { KnowledgeBase } from './knowledge/KnowledgeBase';
import { InheritanceGraph } from './knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from './knowledge/system/SystemCatalog';
import { indexWorkspace } from './indexer/workspaceIndexer';

// ---------------------------------------------------------------------------
// Inicialización (Bootstrap)
// ---------------------------------------------------------------------------

const serverStartTime = performance.now();

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const scheduler = new TaskScheduler();
const firstInvocation = new FirstInvocationTracker();
const fs = new NodeFileSystem();
const workspaceState = new WorkspaceState();
const documentCache = new DocumentCache();
const knowledgeBase = new KnowledgeBase();
const inheritanceGraph = new InheritanceGraph(knowledgeBase);
const systemCatalog = new SystemCatalog();

// Conectar caché interactiva con backends globales para evitar doble parseo
setAnalysisBackends(documentCache, knowledgeBase);

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

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      documentSymbolProvider: true,
      hoverProvider: true,
      workspaceSymbolProvider: true,
      definitionProvider: true,
      completionProvider: {
        triggerCharacters: ['.']
      },
      signatureHelpProvider: {
        triggerCharacters: ['(', ',']
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
    
    scheduler.enqueueBackground({
      id: 'workspace-discovery',
      priority: TaskPriority.Background,
      execute: async (token) => {
        const { elapsedMs: discoveryMs } = await measureMsAsync(async () => {
          await discoverWorkspace(workspaceFolders, fs, workspaceState, token);
        });
        
        if (token.isCancelled) {
          connection.console.log(`[WORKSPACE] Descubrimiento cancelado o pausado.`);
          return;
        }

        const filesCount = workspaceState.getAllSourceFiles().length;
        const roots = workspaceState.getRoots();
        connection.console.log(`[WORKSPACE] Descubrimiento completado:`);
        connection.console.log(`  - Tiempos: ${formatTiming('discoverWorkspace', discoveryMs)}`);
        connection.console.log(`  - Archivos de código: ${filesCount}`);
        connection.console.log(`  - PBW: ${roots.workspaces.length}, PBT: ${roots.targets.length}, PBL: ${roots.libraries.length}`);

        // Iniciamos indexación incremental
        if (filesCount > 0) {
          connection.console.log(`[WORKSPACE] Iniciando indexación de ${filesCount} archivos...`);
          
          const { elapsedMs: indexingMs } = await measureMsAsync(async () => {
            await indexWorkspace(fs, documentCache, knowledgeBase, workspaceState, token, (msg) => connection.console.error(msg));
          });

          if (!token.isCancelled) {
            const stats = knowledgeBase.getStats();
            connection.console.log(`[WORKSPACE] Indexación completada:`);
            connection.console.log(`  - Tiempos: ${formatTiming('indexWorkspace', indexingMs)}`);
            connection.console.log(`  - Entidades en KB: ${stats.totalEntities}`);
          } else {
            connection.console.log(`[WORKSPACE] Indexación pausada cooperativamente.`);
          }
        }
      }
    }).catch(err => {
      connection.console.error(`[ERROR] Descubrimiento de workspace: ${String(err)}`);
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
        const { result, elapsedMs } = measureMs(() => provideHover(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph));

        if (firstInvocation.isFirst('hover')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primer hover (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('hover', elapsedMs));
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
    const { result, elapsedMs } = measureMs(() => provideDefinition(document, params.position, knowledgeBase, inheritanceGraph));

    if (firstInvocation.isFirst('definition')) {
      const sinceStart = performance.now() - serverStartTime;
      connection.console.log(formatTiming('Primera definición (desde el inicio)', sinceStart));
    }

    connection.console.log(formatTiming('definition', elapsedMs));
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] definition: ${message}`);
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
        const { result, elapsedMs } = measureMs(() => provideSignatureHelp(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph));

        if (firstInvocation.isFirst('signatureHelp')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primer signatureHelp (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('signatureHelp', elapsedMs));
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
        const { result, elapsedMs } = measureMs(() => provideCompletion(document, params.position, knowledgeBase, systemCatalog, inheritanceGraph));

        if (firstInvocation.isFirst('completion')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('Primer completion (desde el inicio)', sinceStart));
        }

        connection.console.log(formatTiming('completion', elapsedMs));
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

  try {
    scheduleDiagnostics(connection, event.document, scheduler, undefined, knowledgeBase, systemCatalog, inheritanceGraph);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] diagnósticos onDidChangeContent: ${message}`);
  }
});

documents.onDidClose((event) => {
  cancelScheduledDiagnostics(event.document.uri);
  invalidateDocumentAnalysis(event.document.uri);

  connection.sendDiagnostics({
    uri: event.document.uri,
    diagnostics: [] as Diagnostic[]
  });
});

// ---------------------------------------------------------------------------
// Apagado (Shutdown)
// ---------------------------------------------------------------------------

connection.onShutdown(() => {
  scheduler.shutdown();
  clearAllScheduledDiagnostics();
  clearDocumentAnalysisCache();
  firstInvocation.reset();
});

// ---------------------------------------------------------------------------
// Inicio
// ---------------------------------------------------------------------------

documents.listen(connection);
connection.listen();
