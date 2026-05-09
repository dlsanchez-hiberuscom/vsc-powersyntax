import assert from 'node:assert/strict';
import * as vscode from 'vscode';

import { waitForDocumentSymbols } from './semanticSmokeWait';

const EXTENSION_ID = 'lopez.vsc-powersyntax';
const FORCED_SEMANTIC_LANGUAGE = 'powerbuilder-userobject';
const NON_SOURCE_FIXTURES = [
  'guard.pbw',
  'guard.pbt',
  'guard.pbproj',
  'guard.pbsln',
  'guard.pbl',
];

async function assertNoDiagnostics(uri: vscode.Uri, durationMs = 1000, intervalMs = 100): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < durationMs) {
    const diagnostics = vscode.languages.getDiagnostics(uri);
    assert.equal(diagnostics.length, 0, `No debería haber diagnósticos semánticos para ${uri.fsPath || uri.toString()}`);
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

suite('smoke/lsp-guards-extension', () => {
  test('markers y .pbl no reciben serving semántico aunque se fuerce un lenguaje servido por el cliente', async function () {
    this.timeout(20000);

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `La extensión ${EXTENSION_ID} debería estar presente`);
    await ext!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const sourceUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test', 'fixtures', 'basic', 'sample.sru');
    const sourceDocument = await vscode.workspace.openTextDocument(sourceUri);
    await vscode.window.showTextDocument(sourceDocument, { preview: false });

    const sourceSymbols = await waitForDocumentSymbols(sourceUri);
    assert.ok(Array.isArray(sourceSymbols), 'El control positivo sobre sample.sru debería seguir respondiendo Document Symbols');

    for (const fixture of NON_SOURCE_FIXTURES) {
      const uri = vscode.Uri.joinPath(workspaceFolder.uri, 'test', 'fixtures', 'lsp-guards', fixture);
      const opened = await vscode.workspace.openTextDocument(uri);
      const forced = await vscode.languages.setTextDocumentLanguage(opened, FORCED_SEMANTIC_LANGUAGE);
      await vscode.window.showTextDocument(forced, { preview: false });

      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[] | undefined>(
        'vscode.executeDocumentSymbolProvider',
        forced.uri
      );

      assert.ok(!symbols || symbols.length === 0, `${fixture} no debería recibir Document Symbols semánticos`);
      await assertNoDiagnostics(forced.uri);
    }
  });
});