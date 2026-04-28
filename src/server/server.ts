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
import { invalidateDocumentAnalysis, clearDocumentAnalysisCache } from './analysis/analysisCache';
import {
  cancelScheduledDiagnostics,
  clearAllScheduledDiagnostics,
  publishDiagnosticsNow,
  scheduleDiagnostics
} from './analysis/diagnosticScheduler';
import { extractDocumentSymbols } from './features/documentSymbols';
import { provideHover } from './features/hover';
import { measureMs, measureMsAsync, formatTiming, FirstInvocationTracker } from './runtime/timing';
import { TaskScheduler, TaskPriority } from './runtime/scheduler';
import { NodeFileSystem } from './system/fileSystem';
import { discoverWorkspace } from './workspace/discovery';
import { WorkspaceState } from './workspace/workspaceState';
import { DocumentCache } from './knowledge/DocumentCache';
import { KnowledgeBase } from './knowledge/KnowledgeBase';
import { indexWorkspace } from './indexer/workspaceIndexer';

// ---------------------------------------------------------------------------
// Bootstrap
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

let activeDocumentUri: string | null = null;
let workspaceFolders: string[] = [];

scheduler.setLogger((msg) => connection.console.log(msg));

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const initElapsed = performance.now() - serverStartTime;
  connection.console.log(formatTiming('Server process to onInitialize', initElapsed));

  if (params.workspaceFolders) {
    workspaceFolders = params.workspaceFolders.map(f => f.uri);
  }

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      documentSymbolProvider: true,
      hoverProvider: true
    }
  };
});

connection.onInitialized(() => {
  const readyElapsed = performance.now() - serverStartTime;
  connection.console.log(`${SERVER_NAME} inicializado.`);
  connection.console.log(formatTiming('Server process to onInitialized (ready)', readyElapsed));

  // Lanzar el descubrimiento global de workspace en background
  if (workspaceFolders.length > 0) {
    connection.console.log(`[WORKSPACE] Iniciando descubrimiento en ${workspaceFolders.length} roots...`);
    
    scheduler.enqueueBackground({
      id: 'workspace-discovery',
      priority: TaskPriority.Background,
      execute: async (token) => {
        const { elapsedMs: discoveryMs } = await measureMsAsync(async () => {
          await discoverWorkspace(workspaceFolders, fs, workspaceState, token);
        });
        
        if (token.isCancelled) {
          connection.console.log(`[WORKSPACE] Descubrimiento cancelado/pausado.`);
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
            await indexWorkspace(fs, documentCache, knowledgeBase, workspaceState, token);
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
      connection.console.error(`[ERROR] workspace discovery: ${String(err)}`);
    });
  }
});

// ---------------------------------------------------------------------------
// Features — Document Symbols
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
          connection.console.log(formatTiming('First documentSymbols (since server start)', sinceStart));
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
// Features — Hover
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
        const { result, elapsedMs } = measureMs(() => provideHover(document, params.position));

        if (firstInvocation.isFirst('hover')) {
          const sinceStart = performance.now() - serverStartTime;
          connection.console.log(formatTiming('First hover (since server start)', sinceStart));
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
// Document events
// ---------------------------------------------------------------------------

documents.onDidOpen((event) => {
  activeDocumentUri = event.document.uri;

  try {
    const { elapsedMs } = measureMs(() => publishDiagnosticsNow(connection, event.document, scheduler));

    if (firstInvocation.isFirst('diagnostics')) {
      const sinceStart = performance.now() - serverStartTime;
      connection.console.log(formatTiming('First diagnostics (since server start)', sinceStart));
    }

    connection.console.log(formatTiming('diagnostics (onDidOpen)', elapsedMs));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] diagnostics onDidOpen: ${message}`);
  }
});

documents.onDidChangeContent((event) => {
  activeDocumentUri = event.document.uri;

  try {
    scheduleDiagnostics(connection, event.document, scheduler);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    connection.console.error(`[ERROR] diagnostics onDidChangeContent: ${message}`);
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
// Shutdown
// ---------------------------------------------------------------------------

connection.onShutdown(() => {
  scheduler.shutdown();
  clearAllScheduledDiagnostics();
  clearDocumentAnalysisCache();
  firstInvocation.reset();
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

documents.listen(connection);
connection.listen();
