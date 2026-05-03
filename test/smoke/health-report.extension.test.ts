import assert from 'node:assert/strict';
import * as vscode from 'vscode';

const EXTENSION_ID = 'lopez.vsc-powersyntax';

suite('smoke/health-report-extension', () => {
  test('exporta un health report reutilizando stats y manifest del workspace activo', async function () {
    this.timeout(20000);

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `La extensión ${EXTENSION_ID} debería estar presente`);
    await ext!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const sourceUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test', 'fixtures', 'basic', 'sample.sru');
    const destinationUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test', '.tmp', 'health-report');

    await vscode.workspace.fs.delete(destinationUri, { recursive: true, useTrash: false }).then(undefined, () => undefined);

    try {
      const document = await vscode.workspace.openTextDocument(sourceUri);
      await vscode.window.showTextDocument(document, { preview: false });

      const result = await vscode.commands.executeCommand<{
        directoryUri: string;
        reportUri: string;
        statsUri: string;
        manifestUri?: string;
      }>('vscPowerSyntax.exportHealthReport', {
        destinationUri: destinationUri.toString(),
        workspaceFolderUri: workspaceFolder.uri.toString(),
      });

      assert.ok(result, 'El comando debería devolver la ubicación del health report exportado');
      assert.equal(result?.directoryUri, destinationUri.toString());

      const readme = Buffer.from(
        await vscode.workspace.fs.readFile(vscode.Uri.parse(result!.reportUri))
      ).toString('utf8');
      assert.match(readme, /PowerSyntax Project Health Dashboard/i);
      assert.match(readme, /Dashboard/i);
      assert.match(readme, /## Enterprise health score/i);
      assert.match(readme, /Score total:/i);
      assert.match(readme, /## Matriz de soporte/i);
      assert.match(readme, /PowerBuilder 2025 Workspace/i);

      const stats = JSON.parse(Buffer.from(
        await vscode.workspace.fs.readFile(vscode.Uri.parse(result!.statsUri))
      ).toString('utf8'));
      assert.equal(typeof stats, 'object');
      assert.ok(stats.readiness || stats.health || stats.workspace, 'El health report debería incluir stats serializadas');

      assert.ok(result?.manifestUri, 'El health report debería incluir el manifest semántico');
      const manifest = JSON.parse(Buffer.from(
        await vscode.workspace.fs.readFile(vscode.Uri.parse(result!.manifestUri!))
      ).toString('utf8'));
      assert.equal(manifest.schemaVersion, '1.0.0');
    } finally {
      await vscode.workspace.fs.delete(destinationUri, { recursive: true, useTrash: false }).then(undefined, () => undefined);
    }
  });
});