import type { Connection } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { publishDiagnostics } from '../features/diagnostics';
import { TaskScheduler, TaskPriority } from '../runtime/scheduler';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import type { WorkspaceState } from '../workspace/workspaceState';

const DEFAULT_DIAGNOSTIC_DELAY_MS = 180;

const scheduledDiagnosticsByUri = new Map<string, NodeJS.Timeout>();

export function scheduleDiagnostics(
  connection: Connection,
  document: TextDocument,
  scheduler: TaskScheduler,
  delayMs: number = DEFAULT_DIAGNOSTIC_DELAY_MS,
  kb?: KnowledgeBase,
  systemCatalog?: SystemCatalog,
  inheritanceGraph?: InheritanceGraph,
  workspaceState?: WorkspaceState
): void {
  cancelScheduledDiagnostics(document.uri);

  // PB-PERF-P2-LAZY-DIAGNOSTICS-01: Tier 1 (Syntactic) se envía inmediatamente
  // al cliente para que vea los errores de sintaxis al vuelo sin lag.
  publishDiagnostics(connection, document, undefined, undefined, undefined, undefined, 'syntactic');

  const handle = setTimeout(() => {
    scheduledDiagnosticsByUri.delete(document.uri);
    void scheduler.runInteractive({
      id: `diagnostics-${document.uri}`,
      priority: TaskPriority.Interactive,
      workload: 'diagnostics',
      execute: () => publishDiagnostics(connection, document, kb, systemCatalog, inheritanceGraph, workspaceState, 'full')
    });
  }, delayMs);

  scheduledDiagnosticsByUri.set(document.uri, handle);
}

export function publishDiagnosticsNow(
  connection: Connection,
  document: TextDocument,
  scheduler: TaskScheduler,
  kb?: KnowledgeBase,
  systemCatalog?: SystemCatalog,
  inheritanceGraph?: InheritanceGraph,
  workspaceState?: WorkspaceState
): void {
  cancelScheduledDiagnostics(document.uri);
  void scheduler.runInteractive({
    id: `diagnostics-${document.uri}`,
    priority: TaskPriority.Interactive,
    workload: 'diagnostics',
    execute: () => publishDiagnostics(connection, document, kb, systemCatalog, inheritanceGraph, workspaceState, 'full')
  });
}

export function cancelScheduledDiagnostics(uri: string): void {
  const handle = scheduledDiagnosticsByUri.get(uri);
  if (!handle) {
    return;
  }

  clearTimeout(handle);
  scheduledDiagnosticsByUri.delete(uri);
}

export function clearAllScheduledDiagnostics(): void {
  for (const handle of scheduledDiagnosticsByUri.values()) {
    clearTimeout(handle);
  }

  scheduledDiagnosticsByUri.clear();
}
