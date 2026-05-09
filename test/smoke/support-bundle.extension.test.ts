import assert from 'node:assert/strict';
import * as vscode from 'vscode';

import { restoreSmokeWorkspaceBaseline } from './workspaceSettingsBaseline';

const EXTENSION_ID = 'lopez.vsc-powersyntax';

suite('smoke/support-bundle-extension', () => {
  suiteSetup(async function () {
    this.timeout(10000);
    await restoreSmokeWorkspaceBaseline();
  });

  teardown(async function () {
    this.timeout(10000);
    await restoreSmokeWorkspaceBaseline();
  });

  test('exporta un support bundle saneado desde el workspace activo', async function () {
    this.timeout(20000);

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `La extensión ${EXTENSION_ID} debería estar presente`);
    await ext!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const sourceUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test', 'fixtures', 'basic', 'sample.sru');
    const destinationUri = vscode.Uri.joinPath(workspaceFolder.uri, 'test', '.tmp', 'support-bundle');
    const configuration = vscode.workspace.getConfiguration();
    const previousProfile = configuration.inspect<string>('vscPowerSyntax.profile')?.workspaceValue;

    await vscode.workspace.fs.delete(destinationUri, { recursive: true, useTrash: false }).then(undefined, () => undefined);

    try {
      const document = await vscode.workspace.openTextDocument(sourceUri);
      await vscode.window.showTextDocument(document, { preview: false });
      await configuration.update('vscPowerSyntax.profile', 'ci-support', vscode.ConfigurationTarget.Workspace);

      const result = await vscode.commands.executeCommand<{
        bundleUri: string;
        manifestUri: string;
        fileCount: number;
      }>('vscPowerSyntax.exportSupportBundle', {
        destinationUri: destinationUri.toString(),
      });

      assert.ok(result, 'El comando debería devolver la ubicación del support bundle exportado');
      assert.equal(result?.bundleUri, destinationUri.toString());
      assert.ok((result?.fileCount ?? 0) >= 8, 'El support bundle debería incluir varios artefactos saneados');

      const manifest = JSON.parse(Buffer.from(
        await vscode.workspace.fs.readFile(vscode.Uri.parse(result!.manifestUri))
      ).toString('utf8'));
      assert.equal(manifest.summary.rawSourceIncluded, false);
      assert.equal(manifest.summary.redactionProfile, 'ci-support');
      assert.equal(manifest.summary.redactionPolicy.settings, 'summary-only');
      assert.ok(manifest.files.some((file: { relativePath?: string }) => file.relativePath === 'build-orca-snapshot.json'));

      const settings = JSON.parse(Buffer.from(
        await vscode.workspace.fs.readFile(vscode.Uri.joinPath(destinationUri, 'settings-sanitized.json'))
      ).toString('utf8'));
      assert.equal(settings.redaction, 'summary-only');
      assert.ok(Array.isArray(settings.managedSettings));
      assert.ok(settings.managedSettings.every((entry: { valueType?: string; value?: unknown }) => typeof entry.valueType === 'string' && entry.value === undefined));

      const diagnostics = JSON.parse(Buffer.from(
        await vscode.workspace.fs.readFile(vscode.Uri.joinPath(destinationUri, 'diagnostics-snapshot.sanitized.json'))
      ).toString('utf8'));
      assert.equal(diagnostics.redaction, 'summary-only');
      assert.equal('topDocuments' in diagnostics, false);

      const readme = Buffer.from(
        await vscode.workspace.fs.readFile(vscode.Uri.joinPath(destinationUri, 'README.md'))
      ).toString('utf8');
      assert.match(readme, /support bundle/i);

      const rawSourceUri = vscode.Uri.joinPath(destinationUri, 'files', 'workspace', 'test', 'fixtures', 'basic', 'sample.sru');
      const rawSourceExists = await vscode.workspace.fs.stat(rawSourceUri).then(() => true, () => false);
      assert.equal(rawSourceExists, false, 'El support bundle no debe incluir código bruto por defecto');
    } finally {
      await configuration.update('vscPowerSyntax.profile', previousProfile, vscode.ConfigurationTarget.Workspace);
      await vscode.workspace.fs.delete(destinationUri, { recursive: true, useTrash: false }).then(undefined, () => undefined);
    }
  });
});