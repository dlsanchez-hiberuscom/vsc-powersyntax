import assert from 'node:assert/strict';
import * as vscode from 'vscode';

import { DIAGNOSTIC_CODES } from '../../src/shared/diagnosticCodes';

const EXTENSION_ID = 'lopez.vsc-powersyntax';

async function waitForDiagnostic(
  uri: vscode.Uri,
  code: string,
  timeoutMs = 15000,
  intervalMs = 100,
): Promise<vscode.Diagnostic> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const diagnostics = vscode.languages.getDiagnostics(uri);
    const match = diagnostics.find((diagnostic) => {
      const diagnosticCode = typeof diagnostic.code === 'object' && diagnostic.code
        ? String(diagnostic.code.value ?? '')
        : String(diagnostic.code ?? '');

      return diagnosticCode.toUpperCase() === code
        || diagnostic.source === 'PowerScript:SD7'
        || /RunFork.*obsolet/i.test(diagnostic.message);
    });
    if (match) {
      return match;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`No apareció el diagnóstico ${code} para ${uri.toString()} dentro del tiempo esperado.`);
}

suite('smoke/code-actions-extension', () => {
  test('expone quick fixes seguras para diagnósticos obsoletos en Problems/CodeAction', async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `La extensión ${EXTENSION_ID} debería estar presente`);
    await ext!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const uri = vscode.Uri.joinPath(workspaceFolder.uri, 'test', 'fixtures', 'basic', 'sample.sru');
    const document = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(document, { preview: false });

    try {
      await editor.edit((builder) => {
        builder.insert(new vscode.Position(13, 0), '    RunFork("demo.exe")\n');
      });

      await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', uri);

      const diagnostic = await waitForDiagnostic(uri, DIAGNOSTIC_CODES.sd7ObsoleteFunction);
      const actions = await vscode.commands.executeCommand<Array<vscode.CodeAction | vscode.Command>>(
        'vscode.executeCodeActionProvider',
        uri,
        diagnostic.range
      );

      assert.ok(Array.isArray(actions), 'El provider de code actions debería devolver un array.');

      const quickFix = actions.find(
        (candidate): candidate is vscode.CodeAction => 'title' in candidate && candidate.title === "Reemplazar 'RunFork' por 'Run'"
      );

      assert.ok(quickFix, 'Problems/CodeAction debería exponer el quick fix versionado para RunFork.');
      assert.equal(quickFix.kind?.value, vscode.CodeActionKind.QuickFix.value);
      assert.equal(quickFix.disabled, undefined);
      assert.equal(quickFix.isPreferred, true);
    } finally {
      await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor');
    }
  });
});