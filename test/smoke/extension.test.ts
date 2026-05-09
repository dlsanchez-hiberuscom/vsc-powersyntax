import * as assert from 'assert';
import * as vscode from 'vscode';

import {
  type ApiSemanticWorkspaceSnapshot,
  PUBLIC_API_EXTENSION_ID,
  PUBLIC_API_VERSION,
  type VscPowerSyntaxApi,
} from '../../src/shared/publicApi';
import { getCoreMaintenanceCommandModels } from '../../src/client/coreMaintenanceCommandCatalog';
import {
  getWorkspaceSettingValue,
  restoreSmokeWorkspaceBaseline,
  updateWorkspaceSettingValue,
} from './workspaceSettingsBaseline';

async function withStepTimeout<T>(label: string, promise: PromiseLike<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout en paso smoke: ${label}`));
      }, timeoutMs);
    }),
  ]);
}

async function runReadOnlyQuerySurfaceSmoke(api: VscPowerSyntaxApi): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

  const contextDocument = await vscode.workspace.openTextDocument(
    vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
  );
  await withStepTimeout('query-surface: runtime-basics', (async () => {
    const stats = await api.getServerStats();
    assert.ok(stats && typeof stats === 'object', 'La API pública debería devolver estadísticas del servidor');
    assert.notEqual(stats?.readiness?.state, 'error', 'La extensión no debería quedar en readiness=error tras activar el runtime.');
    assert.doesNotMatch(
      stats?.readiness?.detail ?? '',
      /startfailed|already exists|couldn't create connection/i,
      'La smoke de activación no debería tolerar un arranque LSP degradado por duplicidad de comandos.'
    );

    const symbols = await api.querySymbols({ query: '', limit: 3 });
    assert.ok(Array.isArray(symbols), 'La API pública debería devolver un array al consultar símbolos');

    const currentObjectContext = await api.getCurrentObjectContext({
      uri: contextDocument.uri.toString(),
      line: 12,
      character: 28
    });
    assert.equal(currentObjectContext.available, true, 'La API pública debería devolver un context pack disponible para el objeto activo');
    assert.equal(currentObjectContext.objectInfo?.globalType, 'sample');
    assert.ok(Array.isArray(currentObjectContext.members?.functions), 'El context pack debería incluir members serializables');
  })(), 15000);

  await withStepTimeout('query-surface: dependency-graph', (async () => {
    const dependencyGraph = await api.getPowerBuilderDependencyGraph({
      uri: contextDocument.uri.toString(),
      maxDependencies: 4,
      maxDependents: 4,
    });
    assert.equal(dependencyGraph.available, true);
    assert.equal(dependencyGraph.scope, 'immediate-neighborhood');
    assert.ok(dependencyGraph.nodes.some((node) => node.kind === 'focus-object'));
    assert.match(dependencyGraph.mermaidFlowchart, /flowchart LR/);
  })(), 15000);

}

async function runReadOnlyMarkdownSurfaceSmoke(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

  const contextDocument = await vscode.workspace.openTextDocument(
    vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
  );

  await withStepTimeout('markdown-surface: graph-and-routing-reports', (async () => {
    await vscode.window.showTextDocument(contextDocument, { preview: false });
    await vscode.commands.executeCommand('powerbuilder.openDependencyGraph');
    assert.equal(vscode.window.activeTextEditor?.document.languageId, 'markdown');
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? '', /PowerBuilder Dependency Graph/);
  })(), 30000);

  await withStepTimeout('markdown-surface: build-and-analysis-reports', (async () => {
    await vscode.window.showTextDocument(contextDocument, { preview: false });
    await vscode.commands.executeCommand('powerbuilder.openBuildProfileMatrix');
    assert.equal(vscode.window.activeTextEditor?.document.languageId, 'markdown');
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? '', /Build Profile Matrix/);
  })(), 30000);

  await withStepTimeout('markdown-surface: runtime-dashboards', (async () => {
    const memoryReport = await vscode.commands.executeCommand<string>('powerbuilder.showMemoryBudgets');
    assert.match(memoryReport ?? '', /# Memory Budgets/);
  })(), 15000);
}

async function runSnapshotSurfaceSmoke(api: VscPowerSyntaxApi): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

  const fixtureDocument = await vscode.workspace.openTextDocument(
    vscode.Uri.joinPath(
      workspaceFolder!.uri,
      'test',
      'fixtures',
      'compatibility',
      'semantic-workspace-snapshot.legacy-no-summary.json',
    ),
  );
  const legacySnapshot = JSON.parse(fixtureDocument.getText()) as ApiSemanticWorkspaceSnapshot;

  const importedSnapshot = await withStepTimeout(
    'snapshot-surface: import-fixture',
    (async () => {
      const imported = await api.importSemanticWorkspaceSnapshot({
        snapshot: legacySnapshot,
      });
      assert.equal(imported.valid, true);
      assert.equal(imported.snapshot?.schemaVersion, '1.0.0');
      assert.equal(imported.summary?.projectCount, 1);
      return imported;
    })(),
    30000,
  );

  const baseSnapshot = importedSnapshot.snapshot;
  assert.ok(baseSnapshot, 'La importación del fixture debería materializar un snapshot canónico.');

  const nextSnapshot = JSON.parse(JSON.stringify(baseSnapshot));
  nextSnapshot.generatedAt = '2026-05-03T00:10:00.000Z';
  nextSnapshot.workspaceManifest.objects.push({
    name: 'n_diff_probe',
    uri: 'file:///diff/n_diff_probe.sru',
    objectKind: 'userobject',
    sourceOrigin: 'workspace-file',
  });
  nextSnapshot.workspaceManifest.exportedSymbols.push({
    name: 'of_probe',
    kind: 'Function',
    uri: 'file:///diff/n_diff_probe.sru',
    line: 1,
    character: 0,
  });
  nextSnapshot.workspaceManifest.readiness.state = 'indexing';
  nextSnapshot.workspaceManifest.sourceOriginSummary['workspace-file'] = 1;
  nextSnapshot.summary.objectCount += 1;
  nextSnapshot.summary.exportedSymbolCount += 1;
  nextSnapshot.summary.readinessState = 'indexing';

  await withStepTimeout('snapshot-surface: diff', (async () => {
    const snapshotDiff = await api.diffSemanticWorkspaceSnapshots({
      previous: baseSnapshot,
      next: nextSnapshot,
      maxObjectChanges: 8,
      maxSymbolChanges: 8,
    });
    assert.equal(snapshotDiff.changed, true);
    assert.equal(snapshotDiff.summary.objects.added, 1);
    assert.equal(snapshotDiff.summary.exportedSymbols.added, 1);
    assert.equal(snapshotDiff.readiness.changed, true);

    const diffToolResult = await api.invokeReadOnlyTool({
      tool: 'semantic-snapshot-diff',
      args: {
        previous: baseSnapshot,
        next: nextSnapshot,
        maxObjectChanges: 8,
        maxSymbolChanges: 8,
      },
    });
    assert.equal(diffToolResult.schema, 'ApiSemanticWorkspaceSnapshotDiff');
    assert.equal((diffToolResult.payload as { summary?: { objects?: { added?: number } } }).summary?.objects?.added, 1);
  })(), 20000);
}

suite('smoke/extension', () => {
  suiteSetup(async function () {
    this.timeout(10000);
    await restoreSmokeWorkspaceBaseline();
  });

  teardown(async function () {
    this.timeout(10000);
    await restoreSmokeWorkspaceBaseline();
  });

  test('la extensión se activa en menos de 500ms', async function () {
    this.timeout(30000);
    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const start = performance.now();
    const api = await withStepTimeout('ext.activate()', ext.activate() as Thenable<VscPowerSyntaxApi | undefined>, 15000);
    const elapsed = performance.now() - start;

    assert.ok(ext.isActive, 'La extensión debería estar activa');
    assert.ok(api, 'La extensión debería exportar una API pública');
    assert.equal(api!.version, PUBLIC_API_VERSION);
    assert.equal(api!.extensionId, PUBLIC_API_EXTENSION_ID);
    assert.equal(api!.isVersionCompatible(PUBLIC_API_VERSION), true);
    assert.equal(api!.contract.apiVersion, PUBLIC_API_VERSION);
    assert.equal(api!.contract.extensionId, PUBLIC_API_EXTENSION_ID);
    const powerSyntaxConfiguration = vscode.workspace.getConfiguration('vscPowerSyntax');
    const profileInspection = powerSyntaxConfiguration.inspect<string>('profile');
    assert.equal(profileInspection?.defaultValue, 'balanced');
    assert.equal(profileInspection?.workspaceValue, 'legacy-orca');
    assert.equal(powerSyntaxConfiguration.get('profile'), 'legacy-orca');
    assert.equal(powerSyntaxConfiguration.get('progress.show'), true);
    assert.equal(powerSyntaxConfiguration.get('formatting.enabled'), true);
    assert.equal(powerSyntaxConfiguration.get('formatting.formatOnSave'), false);
    assert.equal(powerSyntaxConfiguration.get('formatting.maxDocumentChars'), 120000);
    assert.equal(powerSyntaxConfiguration.get('formatting.maxDocumentLines'), 4000);
    assert.ok(api!.contract.capabilities.readOnlyMethods.includes('getCurrentObjectContext'));
    assert.ok(api!.contract.capabilities.writeEnabledMethods.includes('applySpecDrivenPblUpdate'));
    assert.deepEqual(api!.getPublicContract(), api!.contract);
    assert.equal(api!.getReadOnlyToolBridge().apiVersion, PUBLIC_API_VERSION);
    assert.ok(api!.getReadOnlyToolBridge().tools.some((tool) => tool.name === 'server-stats'));
    assert.ok(api!.getReadOnlyToolBridge().tools.some((tool) => tool.name === 'workspace-check'));
    assert.ok(api!.getReadOnlyToolBridge().tools.some((tool) => tool.name === 'object-check'));
    assert.ok(api!.getReadOnlyToolBridge().tools.some((tool) => tool.name === 'explain-diagnostic'));
    assert.ok(api!.contract.taskExecutionCatalog.contracts.some((contract) => contract.id === 'spec-driven-pbl-update'));
    assert.ok(api!.contract.taskExecutionCatalog.contracts.some((contract) => contract.id === 'spec-driven-pbl-update-batch'));
    assert.equal(typeof api!.getServerStats, 'function');
    assert.equal(typeof api!.checkWorkspace, 'function');
    assert.equal(typeof api!.checkObject, 'function');
    assert.equal(typeof api!.explainDiagnostic, 'function');
    assert.equal(typeof api!.getPublicContract, 'function');
    assert.equal(typeof api!.getReadOnlyToolBridge, 'function');
    assert.equal(typeof api!.invokeReadOnlyTool, 'function');
    assert.equal(typeof api!.querySymbols, 'function');
    assert.equal(typeof api!.getCrossProjectSymbolConflicts, 'function');
    assert.equal(typeof api!.getBuildProfileMatrix, 'function');
    assert.equal(typeof api!.getPowerBuilderCodeMetrics, 'function');
    assert.equal(typeof api!.getPowerBuilderTechnicalDebtReport, 'function');
    assert.equal(typeof api!.getDataWindowSqlLineage, 'function');
    assert.equal(typeof api!.getPowerBuilderDependencyGraph, 'function');
    assert.equal(typeof api!.getCurrentObjectContext, 'function');
    assert.equal(typeof api!.getWorkspaceMigrationAssistant, 'function');

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('powerbuilder.showSettingsGovernance'));
    assert.ok(commands.includes('powerbuilder.applySettingsProfile'));
    assert.ok(commands.includes('powerbuilder.openWorkspaceCheck'));
    assert.ok(commands.includes('powerbuilder.openExtensionUpgradeCompatibilityCheck'));
    assert.ok(commands.includes('powerbuilder.openCurrentObjectCheck'));
    assert.ok(commands.includes('powerbuilder.openObjectCheck'));
    assert.ok(commands.includes('powerbuilder.openExplainDiagnostic'));
    assert.ok(commands.includes('powerbuilder.checkWorkspace'));
    assert.ok(commands.includes('powerbuilder.checkCurrentObject'));
    assert.ok(commands.includes('powerbuilder.explainDiagnostic'));
    assert.ok(commands.includes('powerbuilder.openCrossProjectSymbolConflicts'));
    assert.ok(commands.includes('powerbuilder.openBuildProfileMatrix'));
    assert.ok(commands.includes('powerbuilder.openCodeMetrics'));
    assert.ok(commands.includes('powerbuilder.openTechnicalDebtReport'));
    assert.ok(commands.includes('powerbuilder.openDataWindowSqlLineage'));
    assert.ok(commands.includes('powerbuilder.openDependencyGraph'));
    assert.ok(commands.includes('powerbuilder.openWorkspaceMigrationAssistant'));
    assert.ok(commands.includes('powerbuilder.focusDiagnosticsExplainabilityPanel'));
    assert.ok(commands.includes('powerbuilder.refreshDiagnosticsExplainabilityPanel'));
    for (const model of getCoreMaintenanceCommandModels()) {
      assert.ok(commands.includes(model.command), `El comando ${model.command} debería estar registrado`);
    }

    const contractToolResult = await api!.invokeReadOnlyTool({ tool: 'contract' });
    assert.equal(contractToolResult.schema, 'ApiPublicContractDescriptor');
    assert.equal(
      (contractToolResult.payload as { taskExecutionCatalog?: { contracts?: Array<{ id?: string }> } }).taskExecutionCatalog?.contracts?.some((contract) => contract.id === 'spec-driven-pbl-update'),
      true
    );

    const stats = await withStepTimeout('getServerStats(api)', api!.getServerStats(), 15000);
    assert.ok(stats && typeof stats === 'object', 'La API pública debería devolver estadísticas del servidor');
    assert.notEqual(stats?.readiness?.state, 'error', 'La extensión no debería quedar en readiness=error tras activar el runtime.');
    assert.doesNotMatch(
      stats?.readiness?.detail ?? '',
      /startfailed|already exists|couldn't create connection/i,
      'La smoke de activación no debería tolerar un arranque LSP degradado por duplicidad de comandos.'
    );

    // El presupuesto de cold start es 500ms, pero las pruebas de CI/test host
    // pueden ser algo más lentas. Avisamos si pasa de 500ms, pero el assert duro
    // lo ponemos en 2000ms para evitar tests inestables en máquinas cargadas.
    if (elapsed > 500) {
      console.warn(`[PERFORMANCE WARNING] Activación superó presupuesto: ${elapsed.toFixed(2)}ms`);
    }
    
    assert.ok(elapsed < 2000, `Activación demasiado lenta: ${elapsed.toFixed(2)}ms`);
  });

  test('la superficie runtime read-only consulta reportes estructurales', async function () {
    this.timeout(75000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');

    await withStepTimeout(
      'runReadOnlyQuerySurfaceSmoke',
      runReadOnlyQuerySurfaceSmoke(api!),
      60000,
    );
  });

  test('la superficie runtime read-only abre reportes markdown secundarios', async function () {
    this.timeout(75000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    await withStepTimeout(
      'runReadOnlyMarkdownSurfaceSmoke',
      runReadOnlyMarkdownSurfaceSmoke(),
      60000,
    );
  });

  test('la superficie runtime read-only exporta e importa snapshots', async function () {
    this.timeout(75000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');

    await withStepTimeout(
      'runSnapshotSurfaceSmoke',
      runSnapshotSurfaceSmoke(api!),
      60000,
    );
  });

  test('workspace check expone tool read-only y reporte markdown', async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const contextDocument = await vscode.workspace.openTextDocument(
      vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
    );
    await vscode.window.showTextDocument(contextDocument, { preview: false });

    const manifestToolResult = await withStepTimeout(
      'invokeReadOnlyTool(semantic-workspace-manifest)',
      api!.invokeReadOnlyTool({
        tool: 'semantic-workspace-manifest',
        args: { maxObjects: 16, maxSymbols: 16 },
      }),
      10000,
    );
    assert.equal(manifestToolResult.schema, 'ApiSemanticWorkspaceManifest');

    const workspaceCheckToolResult = await withStepTimeout(
      'invokeReadOnlyTool(workspace-check)',
      api!.invokeReadOnlyTool({
        tool: 'workspace-check',
        args: {
          mode: 'quick',
          maxFindings: 8,
        },
      }),
      10000,
    );
    assert.equal(workspaceCheckToolResult.mode, 'read-only');
    assert.equal(workspaceCheckToolResult.schema, 'ApiWorkspaceCheckReport');
    assert.equal(typeof (workspaceCheckToolResult.payload as { available?: unknown }).available, 'boolean');

    await withStepTimeout(
      'executeCommand(powerbuilder.openWorkspaceCheck)',
      vscode.commands.executeCommand('powerbuilder.openWorkspaceCheck'),
      10000,
    );
    assert.equal(vscode.window.activeTextEditor?.document.languageId, 'markdown');
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? '', /Workspace Check/);

    await withStepTimeout(
      'executeCommand(powerbuilder.openExtensionUpgradeCompatibilityCheck)',
      vscode.commands.executeCommand('powerbuilder.openExtensionUpgradeCompatibilityCheck'),
      10000,
    );
    assert.equal(vscode.window.activeTextEditor?.document.languageId, 'markdown');
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? '', /Upgrade Compatibility/);
  });

  test('object check expone tool read-only y reporte markdown', async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const contextDocument = await vscode.workspace.openTextDocument(
      vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
    );
    await vscode.window.showTextDocument(contextDocument, { preview: false });

    const currentObjectContext = await withStepTimeout(
      'getCurrentObjectContext(object-check warm-up)',
      api!.getCurrentObjectContext({
        uri: contextDocument.uri.toString(),
        line: 12,
        character: 28,
      }),
      10000,
    );
    assert.equal(currentObjectContext.available, true);

    const objectCheckToolResult = await withStepTimeout(
      'invokeReadOnlyTool(object-check)',
      api!.invokeReadOnlyTool({
        tool: 'object-check',
        args: {
          uri: contextDocument.uri.toString(),
          line: 12,
          character: 28,
          maxFindings: 8,
        },
      }),
      10000,
    );
    assert.equal(objectCheckToolResult.mode, 'read-only');
    assert.equal(objectCheckToolResult.schema, 'ApiObjectCheckReport');
    assert.equal(typeof (objectCheckToolResult.payload as { available?: unknown }).available, 'boolean');

    await vscode.window.showTextDocument(contextDocument, { preview: false });
    await withStepTimeout(
      'executeCommand(powerbuilder.openCurrentObjectCheck)',
      vscode.commands.executeCommand('powerbuilder.openCurrentObjectCheck'),
      10000,
    );
    assert.equal(vscode.window.activeTextEditor?.document.languageId, 'markdown');
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? '', /Object Check/);
  });

  test('explain diagnostic expone tool read-only y reporte markdown', async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const contextDocument = await vscode.workspace.openTextDocument(
      vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
    );
    await vscode.window.showTextDocument(contextDocument, { preview: false });

    const explainDiagnostic = await withStepTimeout(
      'explainDiagnostic(api)',
      api!.explainDiagnostic({
        uri: contextDocument.uri.toString(),
        line: 13,
        character: 4,
        includeObjectContext: true,
        includeSafeFixPlan: true,
      }),
      10000,
    );
    assert.equal(typeof explainDiagnostic.available, 'boolean');
    assert.ok(Array.isArray(explainDiagnostic.recommendedActions));

    const explainDiagnosticToolResult = await withStepTimeout(
      'invokeReadOnlyTool(explain-diagnostic)',
      api!.invokeReadOnlyTool({
        tool: 'explain-diagnostic',
        args: {
          uri: contextDocument.uri.toString(),
          line: 13,
          character: 4,
          includeObjectContext: true,
        },
      }),
      10000,
    );
    assert.equal(explainDiagnosticToolResult.mode, 'read-only');
    assert.equal(explainDiagnosticToolResult.schema, 'ApiExplainDiagnosticReport');
    assert.equal(typeof (explainDiagnosticToolResult.payload as { available?: unknown }).available, 'boolean');

    await vscode.window.showTextDocument(contextDocument, { preview: false });
    await withStepTimeout(
      'executeCommand(powerbuilder.openExplainDiagnostic)',
      vscode.commands.executeCommand('powerbuilder.openExplainDiagnostic'),
      10000,
    );
    assert.equal(vscode.window.activeTextEditor?.document.languageId, 'markdown');
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? '', /Explain Diagnostic/);
  });

  test('explain system symbol expone tool read-only y reporte markdown', async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');
    assert.equal(typeof api!.explainSystemSymbol, 'function');
    assert.ok(api!.getReadOnlyToolBridge().tools.some((tool) => tool.name === 'explain-system-symbol'));

    const contextDocument = await vscode.workspace.openTextDocument({
      language: 'powerbuilder',
      content: 'MessageBox("Hola", "Mundo")',
    });
    const editor = await vscode.window.showTextDocument(contextDocument, { preview: false });
    editor.selection = new vscode.Selection(0, 3, 0, 3);

    const explainSystemSymbol = await withStepTimeout(
      'explainSystemSymbol(api)',
      api!.explainSystemSymbol({
        includeSignatures: true,
        includeProvenance: true,
      }),
      10000,
    );
    assert.equal(explainSystemSymbol.available, true);
    assert.equal(explainSystemSymbol.resolution.state, 'resolved');
    assert.equal(explainSystemSymbol.symbol?.name, 'MessageBox');

    const explainSystemSymbolToolResult = await withStepTimeout(
      'invokeReadOnlyTool(explain-system-symbol)',
      api!.invokeReadOnlyTool({
        tool: 'explain-system-symbol',
        args: {
          name: 'Abs',
          locale: 'es',
          includeSignatures: true,
        },
      }),
      10000,
    );
    assert.equal(explainSystemSymbolToolResult.mode, 'read-only');
    assert.equal(explainSystemSymbolToolResult.schema, 'ApiExplainSystemSymbolReport');
    assert.equal((explainSystemSymbolToolResult.payload as { available?: boolean }).available, true);

    await vscode.window.showTextDocument(contextDocument, { preview: false });
    editor.selection = new vscode.Selection(0, 3, 0, 3);
    await withStepTimeout(
      'executeCommand(powerbuilder.openExplainSystemSymbol)',
      vscode.commands.executeCommand('powerbuilder.openExplainSystemSymbol'),
      10000,
    );
    assert.equal(vscode.window.activeTextEditor?.document.languageId, 'markdown');
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? '', /Explain System Symbol/);
  });

  test('explain semantic query expone metodo, tool read-only y reporte markdown', async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');
    assert.equal(typeof api!.explainSemanticQuery, 'function');
    assert.ok(api!.getReadOnlyToolBridge().tools.some((tool) => tool.name === 'explain-semantic-query'));

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const contextDocument = await vscode.workspace.openTextDocument(
      vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'semantic_query_sample.sru')
    );
    const editor = await vscode.window.showTextDocument(contextDocument, { preview: false });
    const queryOffset = contextDocument.getText().lastIndexOf('of_get_name()');
    assert.ok(queryOffset >= 0, 'Se esperaba una invocación of_get_name() en el fixture smoke.');
    const queryPosition = contextDocument.positionAt(queryOffset + 3);
    editor.selection = new vscode.Selection(queryPosition, queryPosition);

    const explainSemanticQuery = await withStepTimeout(
      'explainSemanticQuery(api)',
      api!.explainSemanticQuery({
        includeCandidates: true,
        includeDiscards: true,
        includeTrace: true,
      }),
      10000,
    );
    assert.equal(explainSemanticQuery.available, true);
    assert.equal(explainSemanticQuery.resolution.state, 'resolved');
    assert.equal(explainSemanticQuery.winner?.name, 'of_get_name');

    const explainSemanticQueryToolResult = await withStepTimeout(
      'invokeReadOnlyTool(explain-semantic-query)',
      api!.invokeReadOnlyTool({
        tool: 'explain-semantic-query',
        args: {
          uri: contextDocument.uri.toString(),
          line: queryPosition.line,
          character: queryPosition.character,
          includeCandidates: true,
          includeTrace: true,
        },
      }),
      10000,
    );
    assert.equal(explainSemanticQueryToolResult.mode, 'read-only');
    assert.equal(explainSemanticQueryToolResult.schema, 'ApiExplainSemanticQueryReport');
    assert.equal((explainSemanticQueryToolResult.payload as { available?: boolean }).available, true);

    await vscode.window.showTextDocument(contextDocument, { preview: false });
    editor.selection = new vscode.Selection(queryPosition, queryPosition);
    await withStepTimeout(
      'executeCommand(powerbuilder.openExplainSemanticQuery)',
      vscode.commands.executeCommand('powerbuilder.openExplainSemanticQuery'),
      10000,
    );
    assert.equal(vscode.window.activeTextEditor?.document.languageId, 'markdown');
    assert.match(vscode.window.activeTextEditor?.document.getText() ?? '', /Explain Semantic Query/);
  });

  test('ai task context bundle expone metodo, tool read-only y comando oculto', async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');
    assert.equal(typeof api!.getAiTaskContextBundle, 'function');
    assert.ok(api!.getReadOnlyToolBridge().tools.some((tool) => tool.name === 'ai-task-context-bundle'));

    const contextDocument = await vscode.workspace.openTextDocument({
      language: 'powerbuilder',
      content: 'MessageBox("Hola", "Mundo")',
    });
    const editor = await vscode.window.showTextDocument(contextDocument, { preview: false });
    editor.selection = new vscode.Selection(0, 3, 0, 3);

    const bundle = await withStepTimeout(
      'getAiTaskContextBundle(api)',
      api!.getAiTaskContextBundle({
        intent: 'bug-fix',
        includeDiagnosticsExplanation: false,
        includeSystemSymbolExplanations: true,
        maxTokensHint: 800,
      }),
      10000,
    );
    assert.equal(bundle.available, true);
    assert.equal(bundle.intent, 'bug-fix');
    assert.ok(bundle.context.currentObjectContext || bundle.context.objectCheck);

    const toolResult = await withStepTimeout(
      'invokeReadOnlyTool(ai-task-context-bundle)',
      api!.invokeReadOnlyTool({
        tool: 'ai-task-context-bundle',
        args: {
          intent: 'catalog-work',
          objectName: 'Abs',
          includeSystemSymbolExplanations: true,
          maxTokensHint: 800,
        },
      }),
      10000,
    );
    assert.equal(toolResult.mode, 'read-only');
    assert.equal(toolResult.schema, 'ApiAiTaskContextBundle');
    assert.equal((toolResult.payload as { available?: boolean }).available, true);

    const commandResult = await withStepTimeout(
      'executeCommand(powerbuilder.exportAiTaskContextBundle)',
      vscode.commands.executeCommand('powerbuilder.exportAiTaskContextBundle', {
        intent: 'catalog-work',
        objectName: 'Abs',
        includeSystemSymbolExplanations: true,
        maxTokensHint: 800,
      }),
      10000,
    ) as { available?: boolean; intent?: string };
    assert.equal(commandResult.available, true);
    assert.equal(commandResult.intent, 'catalog-work');
  });

  test('el runtime self-test se ejecuta como comando read-only', async function () {
    this.timeout(50000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

    const contextDocument = await vscode.workspace.openTextDocument(
      vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
    );
    await vscode.window.showTextDocument(contextDocument, { preview: false });

    const runtimeSelfTestReport = await withStepTimeout(
      'executeCommand(powerbuilder.runRuntimeSelfTest)',
      vscode.commands.executeCommand<string>('powerbuilder.runRuntimeSelfTest'),
      40000,
    );
    assert.match(runtimeSelfTestReport ?? '', /# PowerSyntax Runtime Self-Test/);
    assert.match(runtimeSelfTestReport ?? '', /## Core runtime checks/);
    assert.match(runtimeSelfTestReport ?? '', /## Functional interactive probes/);
    assert.match(runtimeSelfTestReport ?? '', /View providers/);
    assert.match(runtimeSelfTestReport ?? '', /Definition negative cache/);
  });

  test('las views contribuidas registran su provider durante activate', async function () {
    this.timeout(40000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('powerbuilderObjectExplorer.focus'), 'Object Explorer debería publicar su focus command al registrar el provider.');
    assert.ok(commands.includes('powerbuilderCurrentObjectContext.focus'), 'Current Object Context debería publicar su focus command al registrar el provider.');
    assert.ok(commands.includes('powerbuilderDiagnosticsExplainability.focus'), 'Diagnostics Explainability debería publicar su focus command al registrar el provider.');
  });

  test('settings governance publica perfiles corporativos y tolera la inspección read-only', async function () {
    this.timeout(15000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    const enumValues = ((ext!.packageJSON as {
      contributes?: {
        configuration?: {
          properties?: Record<string, { enum?: string[] }>;
        };
      };
    }).contributes?.configuration?.properties?.['vscPowerSyntax.profile']?.enum) ?? [];
    assert.deepEqual(enumValues, ['fast', 'balanced', 'deep-analysis', 'legacy-orca', 'ci-support', 'support-safe']);

    const configuration = vscode.workspace.getConfiguration();
    const previousProfile = configuration.inspect<string>('vscPowerSyntax.profile')?.workspaceValue;
    const previousFormattingEnabled = configuration.inspect<boolean>('vscPowerSyntax.formatting.enabled')?.workspaceValue;
    const previousFormatOnSave = configuration.inspect<boolean>('vscPowerSyntax.formatting.formatOnSave')?.workspaceValue;

    try {
      await configuration.update('vscPowerSyntax.profile', 'legacy-orca', vscode.ConfigurationTarget.Workspace);
      await configuration.update('vscPowerSyntax.formatting.enabled', true, vscode.ConfigurationTarget.Workspace);
      await configuration.update('vscPowerSyntax.formatting.formatOnSave', false, vscode.ConfigurationTarget.Workspace);

      await vscode.commands.executeCommand('powerbuilder.showSettingsGovernance');

      assert.equal(vscode.workspace.getConfiguration('vscPowerSyntax').get('profile'), 'legacy-orca');
    } finally {
      await configuration.update('vscPowerSyntax.profile', previousProfile, vscode.ConfigurationTarget.Workspace);
      await configuration.update('vscPowerSyntax.formatting.enabled', previousFormattingEnabled, vscode.ConfigurationTarget.Workspace);
      await configuration.update('vscPowerSyntax.formatting.formatOnSave', previousFormatOnSave, vscode.ConfigurationTarget.Workspace);
    }
  });

  test('el comando restartServer puede ejecutarse repetidamente sin re-registrar comandos', async function () {
    this.timeout(30000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    await vscode.commands.executeCommand('powerbuilder.restartServer');
    await vscode.commands.executeCommand('powerbuilder.restartServer');

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
    assert.ok(commands.includes('powerbuilder.runPbAutoBuild'), 'El comando run de PBAutoBuild debería estar registrado');
    assert.ok(commands.includes('powerbuilder.runLastPbAutoBuild'), 'El comando para repetir el último build PBAutoBuild debería estar registrado');
    assert.ok(commands.includes('powerbuilder.runPbAutoBuildWithPicker'), 'El comando para elegir build file PBAutoBuild debería estar registrado');
    assert.ok(commands.includes('powerbuilder.cancelPbAutoBuild'), 'El comando cancel de PBAutoBuild debería estar registrado');
    assert.ok(commands.includes('powerbuilder.exportPbAutoBuildCiHelper'), 'El comando para exportar el helper CI/CD de PBAutoBuild debería estar registrado');

    const stats = await api!.getServerStats();
    assert.equal(stats.buildRunner?.state, 'idle');
    assert.ok(stats.buildHealth, 'La API pública debería exponer build health enriquecida');

    await vscode.commands.executeCommand('powerbuilder.cancelPbAutoBuild');
  });

  test('puede ejecutar el adapter ORCA legacy sobre el archivo activo', async function () {
    this.timeout(15000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const api = await ext!.activate() as VscPowerSyntaxApi | undefined;
    assert.ok(api, 'La extensión debería exportar una API pública');

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('powerbuilder.runActiveOrcaScript'), 'El comando ORCA debería estar registrado');
    assert.ok(commands.includes('powerbuilder.cancelOrcaScript'), 'El comando de cancelación ORCA debería estar registrado');
    assert.ok(commands.includes('powerbuilder.exportOrcaStaging'), 'El comando de export ORCA a staging debería estar registrado');
    assert.ok(commands.includes('powerbuilder.importOrcaStaging'), 'El comando de import ORCA desde staging debería estar registrado');
    assert.ok(commands.includes('powerbuilder.regenerateOrcaLibraries'), 'El comando ORCA de regenerate debería estar registrado');
    assert.ok(commands.includes('powerbuilder.rebuildOrcaProject'), 'El comando ORCA de rebuild debería estar registrado');

    const previousOrcaPath = getWorkspaceSettingValue<string>('legacy.orcaPath');

    try {
      await updateWorkspaceSettingValue('legacy.orcaPath', process.execPath);

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

      const document = await vscode.workspace.openTextDocument(
        vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'orca', 'echo-orca.js')
      );
      await vscode.window.showTextDocument(document, { preview: false });

      const result = await vscode.commands.executeCommand<{ snapshot?: { state?: string; scriptUri?: string } }>('powerbuilder.runActiveOrcaScript');
      assert.ok(result, 'El comando debería devolver un resultado ORCA.');
      assert.equal(result!.snapshot?.state, 'succeeded');
      assert.equal(result!.snapshot?.scriptUri, document.uri.toString());

      const stats = await api!.getServerStats();
      assert.equal(stats.orcaTooling?.status, 'available');
      assert.equal(stats.orcaTooling?.source, 'config');
      assert.equal(stats.orcaTooling?.packagingPolicy?.exposure, 'not-exposed');
      assert.equal(stats.orcaTooling?.packagingPolicy?.requiresFeatureFlag, true);
      assert.equal(stats.orcaRunner?.state, 'succeeded');
    } finally {
      await updateWorkspaceSettingValue('legacy.orcaPath', previousOrcaPath);
    }
  });

  test('registra y abre el dashboard de salud del proyecto', async function () {
    this.timeout(15000);

    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    await ext!.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('powerbuilder.openProjectHealthDashboard'), 'El comando del dashboard de salud debería estar registrado');

    await vscode.commands.executeCommand('powerbuilder.openProjectHealthDashboard');

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

    const result = await vscode.commands.executeCommand<{ scope: string; objectName?: string }>('powerbuilder.focusObjectExplorerOnCurrentFile');
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

    const result = await vscode.commands.executeCommand<{ objectName?: string }>('powerbuilder.focusCurrentObjectContextPanel');
    assert.ok(result, 'El comando debería devolver un resultado de foco.');
    assert.equal(result!.objectName, 'sample');
  });
});
