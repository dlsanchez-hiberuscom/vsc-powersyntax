import type { Connection } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { publishDiagnostics } from '../features/diagnostics';

const DEFAULT_DIAGNOSTIC_DELAY_MS = 180;

const scheduledDiagnosticsByUri = new Map<string, NodeJS.Timeout>();

export function scheduleDiagnostics(
  connection: Connection,
  document: TextDocument,
  delayMs: number = DEFAULT_DIAGNOSTIC_DELAY_MS
): void {
  cancelScheduledDiagnostics(document.uri);

  const handle = setTimeout(() => {
    scheduledDiagnosticsByUri.delete(document.uri);
    publishDiagnostics(connection, document);
  }, delayMs);

  scheduledDiagnosticsByUri.set(document.uri, handle);
}

export function publishDiagnosticsNow(
  connection: Connection,
  document: TextDocument
): void {
  cancelScheduledDiagnostics(document.uri);
  publishDiagnostics(connection, document);
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
