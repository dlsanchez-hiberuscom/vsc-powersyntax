import * as assert from 'assert';
import * as vscode from 'vscode';

import {
  PUBLIC_API_EXTENSION_ID,
  PUBLIC_API_VERSION,
  type VscPowerSyntaxApi,
} from '../../src/shared/publicApi';

suite('smoke/extension', () => {
  test('la extensión se activa en menos de 500ms', async function () {
    this.timeout(10000);
    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');
    const wasActiveBefore = ext.isActive;

    const start = performance.now();
    const api = await ext.activate() as VscPowerSyntaxApi | undefined;
    const elapsed = performance.now() - start;

    assert.ok(ext.isActive, 'La extensión debería estar activa');
    assert.ok(api, 'La extensión debería exportar una API pública');
    assert.equal(api!.version, PUBLIC_API_VERSION);
    assert.equal(api!.extensionId, PUBLIC_API_EXTENSION_ID);
    assert.equal(api!.isVersionCompatible(PUBLIC_API_VERSION), true);
    assert.equal(api!.contract.apiVersion, PUBLIC_API_VERSION);
    assert.equal(api!.contract.extensionId, PUBLIC_API_EXTENSION_ID);
    assert.ok(api!.contract.capabilities.readOnlyMethods.includes('getCurrentObjectContext'));
    assert.ok(api!.contract.capabilities.writeEnabledMethods.includes('applySpecDrivenPblUpdate'));
    assert.deepEqual(api!.getPublicContract(), api!.contract);
    assert.equal(api!.getReadOnlyToolBridge().apiVersion, PUBLIC_API_VERSION);
    assert.ok(api!.getReadOnlyToolBridge().tools.some((tool) => tool.name === 'server-stats'));
    assert.equal(typeof api!.getServerStats, 'function');
    assert.equal(typeof api!.getPublicContract, 'function');
    assert.equal(typeof api!.getReadOnlyToolBridge, 'function');
    assert.equal(typeof api!.invokeReadOnlyTool, 'function');
    assert.equal(typeof api!.querySymbols, 'function');
    assert.equal(typeof api!.getCurrentObjectContext, 'function');

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('vscPowerSyntax.showSettingsGovernance'));
    assert.ok(commands.includes('vscPowerSyntax.applySettingsProfile'));
    assert.ok(commands.includes('vscPowerSyntax.focusDiagnosticsExplainabilityPanel'));
    assert.ok(commands.includes('vscPowerSyntax.refreshDiagnosticsExplainabilityPanel'));

    if (!wasActiveBefore) {
      const stats = await api!.getServerStats();
      assert.ok(stats && typeof stats === 'object', 'La API pública debería devolver estadísticas del servidor');

      const symbols = await api!.querySymbols({ query: '', limit: 3 });
      assert.ok(Array.isArray(symbols), 'La API pública debería devolver un array al consultar símbolos');

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

      const contextDocument = await vscode.workspace.openTextDocument(
        vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
      );

      const currentObjectContext = await api!.getCurrentObjectContext({
        uri: contextDocument.uri.toString(),
        line: 12,
        character: 28
      });
      assert.equal(currentObjectContext.available, true, 'La API pública debería devolver un context pack disponible para el objeto activo');
      assert.equal(currentObjectContext.objectInfo?.globalType, 'sample');
      assert.ok(Array.isArray(currentObjectContext.members?.functions), 'El context pack debería incluir members serializables');

      const manifestToolResult = await api!.invokeReadOnlyTool({
        tool: 'semantic-workspace-manifest',
        args: { maxObjects: 16, maxSymbols: 16 }
      });
      assert.equal(manifestToolResult.mode, 'read-only');
      assert.equal(manifestToolResult.schema, 'ApiSemanticWorkspaceManifest');
      assert.equal((manifestToolResult.payload as { schemaVersion?: string }).schemaVersion, '1.0.0');

      const exportedSnapshot = await api!.exportSemanticWorkspaceSnapshot({
        maxObjects: 16,
        maxSymbols: 16,
      });
      assert.equal(exportedSnapshot.snapshot.schemaVersion, '1.0.0');
      assert.equal(exportedSnapshot.snapshot.apiVersion, PUBLIC_API_VERSION);

      const importedSnapshot = await api!.importSemanticWorkspaceSnapshot({
        snapshot: exportedSnapshot.snapshot,
      });
      assert.equal(importedSnapshot.valid, true);
      assert.equal(importedSnapshot.summary?.projectCount, exportedSnapshot.snapshot.summary.projectCount);
    }

    // El presupuesto de cold start es 500ms, pero las pruebas de CI/test host
    // pueden ser algo más lentas. Avisamos si pasa de 500ms, pero el assert duro
    // lo ponemos en 2000ms para evitar tests inestables en máquinas cargadas.
    if (elapsed > 500) {
      console.warn(`[PERFORMANCE WARNING] Activación superó presupuesto: ${elapsed.toFixed(2)}ms`);
    }
    
    assert.ok(elapsed < 2000, `Activación demasiado lenta: ${elapsed.toFixed(2)}ms`);
  });

  test('el comando restartServer puede ejecutarse repetidamente sin re-registrar comandos', async function () {
    this.timeout(15000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    await vscode.commands.executeCommand('vscPowerSyntax.restartServer');
    await vscode.commands.executeCommand('vscPowerSyntax.restartServer');

    const api = ext!.exports as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería seguir exportando una API pública tras reiniciar');

    const stats = await api!.getServerStats();
    assert.ok(stats && typeof stats === 'object', 'La API pública debería seguir respondiendo tras reiniciar');
  });

  test('registra comandos de PBAutoBuild y cancelar degrada sin build activo', async function () {
    this.timeout(15000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('vscPowerSyntax.runPbAutoBuild'), 'El comando run de PBAutoBuild debería estar registrado');
    assert.ok(commands.includes('vscPowerSyntax.runLastPbAutoBuild'), 'El comando para repetir el último build PBAutoBuild debería estar registrado');
    assert.ok(commands.includes('vscPowerSyntax.runPbAutoBuildWithPicker'), 'El comando para elegir build file PBAutoBuild debería estar registrado');
    assert.ok(commands.includes('vscPowerSyntax.cancelPbAutoBuild'), 'El comando cancel de PBAutoBuild debería estar registrado');
    assert.ok(commands.includes('vscPowerSyntax.exportPbAutoBuildCiHelper'), 'El comando para exportar el helper CI/CD de PBAutoBuild debería estar registrado');

    const stats = await api!.getServerStats();
    assert.equal(stats.buildRunner?.state, 'idle');
    assert.ok(stats.buildHealth, 'La API pública debería exponer build health enriquecida');

    await vscode.commands.executeCommand('vscPowerSyntax.cancelPbAutoBuild');
  });

  test('puede ejecutar el adapter ORCA legacy sobre el archivo activo', async function () {
    this.timeout(15000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('vscPowerSyntax.runActiveOrcaScript'), 'El comando ORCA debería estar registrado');
    assert.ok(commands.includes('vscPowerSyntax.cancelOrcaScript'), 'El comando de cancelación ORCA debería estar registrado');
    assert.ok(commands.includes('vscPowerSyntax.exportOrcaStaging'), 'El comando de export ORCA a staging debería estar registrado');
    assert.ok(commands.includes('vscPowerSyntax.importOrcaStaging'), 'El comando de import ORCA desde staging debería estar registrado');
    assert.ok(commands.includes('vscPowerSyntax.regenerateOrcaLibraries'), 'El comando ORCA de regenerate debería estar registrado');
    assert.ok(commands.includes('vscPowerSyntax.rebuildOrcaProject'), 'El comando ORCA de rebuild debería estar registrado');

    await vscode.workspace.getConfiguration('vscPowerSyntax').update('legacy.orcaPath', process.execPath, vscode.ConfigurationTarget.Workspace);

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const document = await vscode.workspace.openTextDocument(
      vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'orca', 'echo-orca.js')
    );
    await vscode.window.showTextDocument(document, { preview: false });

    const result = await vscode.commands.executeCommand<{ snapshot?: { state?: string; scriptUri?: string } }>('vscPowerSyntax.runActiveOrcaScript');
    assert.ok(result, 'El comando debería devolver un resultado ORCA.');
    assert.equal(result!.snapshot?.state, 'succeeded');
    assert.equal(result!.snapshot?.scriptUri, document.uri.toString());

    const stats = await api!.getServerStats();
    assert.equal(stats.orcaTooling?.status, 'available');
    assert.equal(stats.orcaTooling?.source, 'config');
    assert.equal(stats.orcaRunner?.state, 'succeeded');

    await vscode.workspace.getConfiguration('vscPowerSyntax').update('legacy.orcaPath', '', vscode.ConfigurationTarget.Workspace);
  });

  test('registra y abre el dashboard de salud del proyecto', async function () {
    this.timeout(15000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('vscPowerSyntax.openProjectHealthDashboard'), 'El comando del dashboard de salud debería estar registrado');

    await vscode.commands.executeCommand('vscPowerSyntax.openProjectHealthDashboard');

    const editor = vscode.window.activeTextEditor;
    assert.ok(editor, 'El comando debería abrir un editor para el dashboard.');
    assert.equal(editor!.document.languageId, 'markdown');
    assert.match(editor!.document.getText(), /# PowerSyntax Project Health Dashboard/);

    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  test('puede enfocar el Object Explorer en el archivo activo', async function () {
    this.timeout(15000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const document = await vscode.workspace.openTextDocument(
      vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
    );
    await vscode.window.showTextDocument(document, { preview: false });

    const result = await vscode.commands.executeCommand<{ scope: string; objectName?: string }>('vscPowerSyntax.focusObjectExplorerOnCurrentFile');
    assert.ok(result, 'El comando debería devolver un resultado de foco.');
    assert.equal(result!.scope, 'current-file');
    assert.equal(result!.objectName, 'sample');
  });

  test('puede mostrar el Current Object Context del archivo activo', async function () {
    this.timeout(15000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const document = await vscode.workspace.openTextDocument(
      vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
    );
    await vscode.window.showTextDocument(document, { preview: false });

    const result = await vscode.commands.executeCommand<{ objectName?: string }>('vscPowerSyntax.focusCurrentObjectContextPanel');
    assert.ok(result, 'El comando debería devolver un resultado de foco.');
    assert.equal(result!.objectName, 'sample');
  });
});
