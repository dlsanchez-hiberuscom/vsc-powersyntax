import type { Connection, Diagnostic, FileEvent, TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getDocumentAnalysis, evictDocumentAnalysis } from '../analysis/analysisCache';
import { cancelScheduledDiagnostics, publishDiagnosticsNow, scheduleDiagnostics } from '../analysis/diagnosticScheduler';
import { invalidateServingCacheEntries } from '../cache/servingCacheRuntime';
import { clearDiagnosticsSummary } from '../features/diagnostics';
import { clearAllScheduledDiagnostics } from '../analysis/diagnosticScheduler';
import { clearDocumentAnalysisCache } from '../analysis/analysisCache';
import { ServingCacheFlushCoordinator } from '../cache/servingCacheFlushCoordinator';
import { createSemanticInvalidationPlan, createSnapshotAwareInvalidationPlan } from '../knowledge/semanticInvalidation';
import { HotContextCache } from '../knowledge/HotContextCache';
import { ServingCache } from '../knowledge/ServingCache';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { type FirstInvocationTracker, formatTiming, measureMs } from '../runtime/timing';
import type { TaskScheduler } from '../runtime/scheduler';
import { RuntimeJournal } from '../runtime/runtimeJournal';
import { WorkspaceState } from '../workspace/workspaceState';

export interface DocumentHandlerContext {
  connection: Connection;
  documents: TextDocuments<TextDocument>;
  scheduler: TaskScheduler;
  firstInvocation: FirstInvocationTracker;
  knowledgeBase: KnowledgeBase;
  systemCatalog: SystemCatalog;
  inheritanceGraph: InheritanceGraph;
  workspaceState: WorkspaceState;
  hotContextCache: HotContextCache;
  servingCache: ServingCache;
  servingCacheFlushCoordinator: ServingCacheFlushCoordinator;
  runtimeJournal: RuntimeJournal;
  serverStartTime: number;
  isSemanticallyServedDocument(document: TextDocument): boolean;
  setActiveDocumentUri(uri: string): void;
  invalidateCodeLensCache(uri?: string): void;
  pushWatchedFileChange(change: FileEvent): void;
}

export function registerDocumentHandlers(context: DocumentHandlerContext): void {
  const {
    connection,
    documents,
    scheduler,
    firstInvocation,
    knowledgeBase,
    systemCatalog,
    inheritanceGraph,
    workspaceState,
    hotContextCache,
    servingCache,
    servingCacheFlushCoordinator,
    runtimeJournal,
    serverStartTime,
    isSemanticallyServedDocument,
    setActiveDocumentUri,
    invalidateCodeLensCache,
    pushWatchedFileChange,
  } = context;

  documents.onDidOpen((event) => {
    setActiveDocumentUri(event.document.uri);

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
        void sinceStart;
      }

      connection.console.log(formatTiming('diagnósticos (onDidOpen)', elapsedMs));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      connection.console.error(`[ERROR] diagnósticos onDidOpen: ${message}`);
    }
  });

  documents.onDidChangeContent((event) => {
    setActiveDocumentUri(event.document.uri);
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
      pushWatchedFileChange(change);
    }
  });
}

export interface ShutdownHandlerContext {
  connection: Connection;
  servingCache: ServingCache;
  servingCacheFlushCoordinator: ServingCacheFlushCoordinator;
  scheduler: TaskScheduler;
  firstInvocation: FirstInvocationTracker;
  disposeTraceSnapshotSubscription(): void;
  disposeWatcherIntake(): void;
  invalidateCodeLensCache(uri?: string): void;
}

export function registerShutdownHandler(context: ShutdownHandlerContext): void {
  const {
    connection,
    servingCache,
    servingCacheFlushCoordinator,
    scheduler,
    firstInvocation,
    disposeTraceSnapshotSubscription,
    disposeWatcherIntake,
    invalidateCodeLensCache,
  } = context;

  connection.onShutdown(async () => {
    disposeTraceSnapshotSubscription();
    disposeWatcherIntake();
    invalidateServingCacheEntries(servingCache, undefined, servingCacheFlushCoordinator);
    invalidateCodeLensCache();
    await servingCacheFlushCoordinator.flushIfDirty();
    scheduler.shutdown();
    clearAllScheduledDiagnostics();
    clearDocumentAnalysisCache();
    firstInvocation.reset();
  });
}