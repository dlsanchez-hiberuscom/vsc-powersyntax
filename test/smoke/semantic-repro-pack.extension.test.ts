import assert from 'node:assert/strict';
import * as vscode from 'vscode';

const EXTENSION_ID = 'lopez.vsc-powersyntax';

suite('smoke/semantic-repro-pack-extension', () => {
  test('exporta un repro pack semántico reproducible desde el editor activo', async function () {
    this.timeout(20000);

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `La extensión ${EXTENSION_ID} debería estar presente`);
    await ext!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const sourceUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test', 'fixtures', 'basic', 'sample.sru');
    const destinationUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test', '.tmp', 'semantic-repro-pack');

    await vscode.workspace.fs.delete(destinationUri, { recursive: true, useTrash: false }).then(undefined, () => undefined);

    try {
      const document = await vscode.workspace.openTextDocument(sourceUri);
      const editor = await vscode.window.showTextDocument(document, { preview: false });
      editor.selection = new vscode.Selection(new vscode.Position(12, 28), new vscode.Position(12, 28));

      const result = await vscode.commands.executeCommand<{
        reproUri: string;
        manifestUri: string;
        includedFiles: number;
        missingFiles: number;
      }>('vscPowerSyntax.exportSemanticReproPack', {
        destinationUri: destinationUri.toString()
      });

      assert.ok(result, 'El comando debería devolver la ubicación del repro pack exportado');
      assert.equal(result?.reproUri, destinationUri.toString());
      assert.ok((result?.includedFiles ?? 0) >= 1, 'El repro pack debería incluir al menos el archivo activo');

      const manifest = JSON.parse(Buffer.from(
        await vscode.workspace.fs.readFile(vscode.Uri.parse(result!.manifestUri))
      ).toString('utf8'));

      assert.equal(manifest.focus.workspaceRelativePath, 'test/fixtures/basic/sample.sru');
      assert.ok(
        manifest.capturedFiles.some((file: { workspaceRelativePath?: string }) => file.workspaceRelativePath === 'test/fixtures/basic/sample.sru'),
        'El repro pack debería capturar el archivo activo'
      );

      const safeEditPlan = JSON.parse(Buffer.from(
        await vscode.workspace.fs.readFile(vscode.Uri.joinPath(destinationUri, 'safe-edit-plan.json'))
      ).toString('utf8'));
      assert.equal(typeof safeEditPlan.available, 'boolean');
    } finally {
      await vscode.workspace.fs.delete(destinationUri, { recursive: true, useTrash: false }).then(undefined, () => undefined);
    }
  });
});