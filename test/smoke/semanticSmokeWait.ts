import * as vscode from 'vscode';

export async function waitFor<T>(
  producer: () => Promise<T>,
  predicate: (value: T) => boolean,
  timeoutMs = 20000,
  intervalMs = 250,
): Promise<T> {
  const start = Date.now();
  let lastValue: T;

  while (Date.now() - start < timeoutMs) {
    lastValue = await producer();
    if (predicate(lastValue)) {
      return lastValue;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timeout esperando condición (${timeoutMs} ms)`);
}

export async function waitForDocumentSymbols(
  uri: vscode.Uri,
  timeoutMs = 20000,
  intervalMs = 250,
): Promise<vscode.DocumentSymbol[]> {
  return waitFor(
    async () => (await vscode.commands.executeCommand<vscode.DocumentSymbol[] | undefined>(
      'vscode.executeDocumentSymbolProvider',
      uri,
    )) ?? [],
    (value) => Array.isArray(value),
    timeoutMs,
    intervalMs,
  );
}