import assert from 'node:assert/strict';
import * as vscode from 'vscode';

const EXTENSION_ID = 'lopez.vsc-powersyntax';

async function waitFor<T>(
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

function hoverToString(hover: vscode.Hover | undefined): string {
  if (!hover) {
    return '';
  }

  return hover.contents.map((content) => {
    if (typeof content === 'string') {
      return content;
    }
    return content.value;
  }).join('\n');
}

suite('smoke/datawindow-b344-extension', () => {
  test('completion y hover resuelven report child con columna dropdown en fixtures .srd reales', async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `La extensión ${EXTENSION_ID} debería estar presente`);
    await ext!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const fixtureFolder = vscode.Uri.joinPath(workspaceFolder.uri, 'test', 'fixtures', 'datawindow-b344');
    const dataWindowUris = [
      vscode.Uri.joinPath(fixtureFolder, 'd_parent_report_smoke.srd'),
      vscode.Uri.joinPath(fixtureFolder, 'd_orders_report_smoke.srd'),
      vscode.Uri.joinPath(fixtureFolder, 'd_status_report_smoke.srd'),
    ];

    for (const uri of dataWindowUris) {
      const document = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(document, { preview: false });
      await waitFor(
        async () => (await vscode.commands.executeCommand<vscode.DocumentSymbol[] | undefined>('vscode.executeDocumentSymbolProvider', uri)) ?? [],
        (symbols) => Array.isArray(symbols),
      );
    }

    const scriptUri = vscode.Uri.joinPath(fixtureFolder, 'w_report_smoke.srw');
    const scriptDocument = await vscode.workspace.openTextDocument(scriptUri);
    await vscode.window.showTextDocument(scriptDocument, { preview: false });

    const scriptLines = scriptDocument.getText().split(/\r?\n/);
    const completionLineIndex = scriptLines.findIndex((line) => line.includes('rpt_orders.'));
    const completionPosition = new vscode.Position(
      completionLineIndex,
      scriptLines[completionLineIndex].indexOf('rpt_orders.') + 'rpt_orders.'.length,
    );

    const completions = await waitFor(
      async () => await vscode.commands.executeCommand<vscode.CompletionList | undefined>(
        'vscode.executeCompletionItemProvider',
        scriptUri,
        completionPosition,
      ),
      (value) => {
        const labels = value?.items.map((item) => typeof item.label === 'string' ? item.label : item.label.label) ?? [];
        return labels.includes('status_id') && labels.includes('DataWindow');
      },
    );

    const completionLabels = completions?.items.map((item) => typeof item.label === 'string' ? item.label : item.label.label) ?? [];
    assert.ok(completionLabels.includes('status_id'));
    assert.ok(completionLabels.includes('DataWindow'));

    const hoverLineIndex = scriptLines.findIndex((line) => line.includes('rpt_orders.status_id.dddw.name'));
    const hoverPosition = new vscode.Position(
      hoverLineIndex,
      scriptLines[hoverLineIndex].indexOf('rpt_orders.status_id.dddw.name') + 2,
    );

    const hovers = await waitFor(
      async () => await vscode.commands.executeCommand<vscode.Hover[] | undefined>(
        'vscode.executeHoverProvider',
        scriptUri,
        hoverPosition,
      ),
      (value) => hoverToString(value?.[0]).includes('d_status_report_smoke'),
    );

    const hoverText = hoverToString(hovers?.[0]);
    assert.match(hoverText, /rpt_orders\.status_id\.dddw\.name/);
    assert.match(hoverText, /d_status_report_smoke/);
  });
});