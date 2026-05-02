import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

import {
  LANGUAGE_ID,
  SERVER_ID,
  SERVER_NAME
} from '../shared/types';
import {
  PROGRESS_NOTIFICATION,
  type ProgressNotification
} from '../shared/types';
import {
  PBAUTOBUILD_BUILD_FILE_GLOB,
  POWERBUILDER_PROJECT_MARKER_GLOB,
  POWERBUILDER_SOURCE_GLOB
} from '../shared/powerbuilderFiles';
import {
  type ApiPublicContractDescriptor,
  type ApiReadOnlyToolBridgeDescriptor,
  type ApiReadOnlyToolCallRequest,
  type ApiReadOnlyToolCallResult,
  type ApiSemanticWorkspaceSnapshotExportRequest,
  type ApiSemanticWorkspaceSnapshotExportResult,
  type ApiSemanticWorkspaceSnapshotImportRequest,
  type ApiSemanticWorkspaceSnapshotImportResult,
  type ApiCurrentObjectContext,
  type ApiCurrentObjectContextRequest,
  type ApiImpactAnalysis,
  type ApiImpactAnalysisRequest,
  type ApiSafeBatchRefactorPlan,
  type ApiSafeBatchRefactorPlanRequest,
  type ApiSafeEditPlan,
  type ApiSafeEditPlanRequest,
  type ApiSpecDrivenPblUpdateBatchRequest,
  type ApiSpecDrivenPblUpdateBatchResult,
  type ApiSpecDrivenPblUpdateRequest,
  type ApiSpecDrivenPblUpdateResult,
  type ApiSemanticWorkspaceManifest,
  type ApiSemanticWorkspaceManifestRequest,
  PUBLIC_API_EXTENSION_ID,
  PUBLIC_API_VERSION,
  getPublicApiContractDescriptor,
  getReadOnlyToolBridgeDescriptor,
  isApiVersionCompatible,
  type ApiCurrentObjectAncestor,
  type ApiSymbol,
  type ApiQuerySymbolsRequest,
  type ApiServerStats,
  type VscPowerSyntaxApi,
} from '../shared/publicApi';
import {
  buildStatusHealthReport,
  buildStatusStatsReport,
  buildStatusTooltipMarkdown,
  enrichRuntimeStatusStats,
  formatPbAutoBuildRunInline,
  formatStatusBarSummary,
  type RuntimeStatusStats,
} from './statusBarPresentation';
import { buildProjectHealthDashboardMarkdown } from './projectHealthDashboard';
import { PowerBuilderObjectExplorerController } from './objectExplorer';
import { CurrentObjectContextPanelController } from './currentObjectContextPanel';
import {
  collectExplainableDiagnosticsFromActiveEditor,
  DiagnosticsExplainabilityPanelController,
} from './diagnosticsExplainabilityPanel';
import {
  createOrcaDetector,
  formatOrcaStatusInline,
  type OrcaDetector,
} from './build/orcaDetection';
import {
  createPbAutoBuildDetector,
  formatPbAutoBuildStatusInline,
  type PbAutoBuildCapabilitySnapshot,
  type PbAutoBuildDetector,
} from './build/pbAutoBuildDetection';
import {
  buildPbAutoBuildCiHelperBundle,
  suggestPbAutoBuildCiHelperDirectoryName
} from './build/pbAutoBuildCiHelper';
import {
  buildSemanticReproPackBundle,
  suggestSemanticReproDirectoryName,
  type SemanticReproCapturedFile,
  type SemanticReproEditorDiagnostic,
  type SemanticReproMissingFile,
} from './repro/semanticReproPack';
import {
  buildSemanticWorkspaceSnapshot,
  importSemanticWorkspaceSnapshot as parseSemanticWorkspaceSnapshot,
} from './semanticWorkspaceSnapshot';
import {
  buildSettingsGovernanceReport,
  getGovernedSettingKeys,
  getSettingsProfileDescriptors,
  type PowerSyntaxProfileId,
  type PowerSyntaxSettingsGovernanceReport,
} from './settingsGovernance';
import {
  type PbAutoBuildCancelResult as PbAutoBuildCancelResultProtocol,
  type PbAutoBuildBuildFileOption,
  type PbAutoBuildProblem,
  type PbAutoBuildRunRequest as PbAutoBuildRunRequestProtocol,
  type PbAutoBuildRunResult as PbAutoBuildRunResultProtocol
} from '../shared/pbAutoBuildProtocol';
import {
  type OrcaCancelResult as OrcaCancelResultProtocol,
  type OrcaStagingImportResult as OrcaStagingImportResultProtocol,
  type OrcaStagingExportResult as OrcaStagingExportResultProtocol,
  type OrcaWriteResult as OrcaWriteResultProtocol,
  type OrcaRunResult as OrcaRunResultProtocol,
} from '../shared/orcaProtocol';
import { registerFormatting } from './formatting/registerFormatting';

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
let lastProgressNotification: ProgressNotification = { phase: 'idle' };
let lastStatusStats: RuntimeStatusStats | undefined;
let statusRefreshHandle: ReturnType<typeof setTimeout> | undefined;
let statusRefreshVersion = 0;
let commandsRegistered = false;
let hostInitialized = false;
let orcaDetector: OrcaDetector | undefined;
let pbAutoBuildDetector: PbAutoBuildDetector | undefined;
let pbAutoBuildDiagnostics: vscode.DiagnosticCollection | undefined;
let objectExplorerController: PowerBuilderObjectExplorerController | undefined;
let currentObjectContextPanelController: CurrentObjectContextPanelController | undefined;
let diagnosticsExplainabilityPanelController: DiagnosticsExplainabilityPanelController | undefined;
let extensionContextRef: vscode.ExtensionContext | undefined;
const publicApiSingleton = createPublicApi();
const LAST_PBAUTOBUILD_PROFILE_KEY = 'pbAutoBuild.lastProfile';
const MAX_SEMANTIC_REPRO_FILES = 20;

interface SemanticReproPackCommandOptions {
  destinationUri?: string;
}

interface SemanticReproPackExportResult {
  reproUri: string;
  manifestUri: string;
  includedFiles: number;
  missingFiles: number;
}

export async function activate(context: vscode.ExtensionContext): Promise<VscPowerSyntaxApi | undefined> {
  const activationStart = performance.now();

  ensureHostInitialized(context);
  const channel = outputChannel;

  if (!channel) {
    throw new Error('No se pudo inicializar el canal de salida de VSC PowerSyntax.');
  }

  channel.appendLine('[VSC PowerSyntax] Activando extensión...');

  try {
    await startClient(context, { activationStart });
    return publicApiSingleton;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    channel.appendLine(
      `[VSC PowerSyntax] ERROR al iniciar el cliente LSP: ${message}`
    );

    vscode.window.showErrorMessage(
      `No se pudo iniciar VSC PowerSyntax: ${message}`
    );

    await stopClient();
    return undefined;
  }
}

export async function deactivate(): Promise<void> {
  await stopClient();
}

async function restartClient(context: vscode.ExtensionContext): Promise<void> {
  const restartStart = performance.now();

  try {
    await stopClient();
    await startClient(context);

    if (!client || client.needsStart()) {
      throw new Error('El cliente LSP no quedó operativo tras el reinicio.');
    }

    const elapsed = performance.now() - restartStart;
    outputChannel?.appendLine(
      `[TIEMPO] Reinicio total del servidor: ${elapsed.toFixed(2)}ms`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(
      `[VSC PowerSyntax] ERROR al reiniciar: ${message}`
    );
    vscode.window.showErrorMessage(
      `Error al reiniciar VSC PowerSyntax: ${message}`
    );
  }
}

async function stopClient(): Promise<void> {
  clearStatusRefreshHandle();
  if (client) {
    try {
      await client.stop();
      outputChannel?.appendLine(
        '[VSC PowerSyntax] Cliente LSP detenido correctamente.'
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      outputChannel?.appendLine(
        `[VSC PowerSyntax] ERROR al detener el cliente LSP: ${message}`
      );
    } finally {
      client = undefined;
    }
  }
}

function ensureHostInitialized(context: vscode.ExtensionContext): void {
  extensionContextRef = context;

  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('VSC PowerSyntax');
    context.subscriptions.push(outputChannel);
  }

  if (!hostInitialized) {
    context.subscriptions.push(...registerFormatting((request) => executeServerCommand('powerbuilder.formatDocument', [request])));

    objectExplorerController = new PowerBuilderObjectExplorerController(() => publicApiSingleton.getSemanticWorkspaceManifest({
      maxObjects: 1000,
      maxSymbols: 400,
    }));
    context.subscriptions.push(objectExplorerController);

    currentObjectContextPanelController = new CurrentObjectContextPanelController(() => publicApiSingleton.getCurrentObjectContext({
      maxExcerptLines: 32,
      maxReferencedSymbols: 24,
    }));
    context.subscriptions.push(currentObjectContextPanelController);

    diagnosticsExplainabilityPanelController = new DiagnosticsExplainabilityPanelController(async () => collectExplainableDiagnosticsFromActiveEditor());
    context.subscriptions.push(diagnosticsExplainabilityPanelController);

    pbAutoBuildDiagnostics = vscode.languages.createDiagnosticCollection('vscPowerSyntax-build');
    context.subscriptions.push(pbAutoBuildDiagnostics);

    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.name = 'VSC PowerSyntax';
    statusBarItem.command = 'vscPowerSyntax.openStatusMenu';
    context.subscriptions.push(statusBarItem);
    applyProgressVisibility(statusBarItem);

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('vscPowerSyntax.progress.show') && statusBarItem) {
          applyProgressVisibility(statusBarItem);
          renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
        }
        if (e.affectsConfiguration('vscPowerSyntax.build.pbAutoBuildPath')) {
          pbAutoBuildDetector?.invalidate();
          void refreshPbAutoBuildCapability(true);
        }
        if (e.affectsConfiguration('vscPowerSyntax.legacy.orcaPath')) {
          orcaDetector?.invalidate();
          void refreshOrcaCapability(true);
        }
      })
    );

    context.subscriptions.push(
      vscode.window.onDidChangeActiveTextEditor(() => {
        if (statusBarItem) {
          scheduleStatusRefresh(statusBarItem, 60);
        }
      })
    );

    context.subscriptions.push({
      dispose: () => {
        clearStatusRefreshHandle();
        void stopClient();
      }
    });

    hostInitialized = true;
  }

  const storedProfile = getStoredPbAutoBuildProfile();
  if (storedProfile) {
    lastStatusStats = enrichRuntimeStatusStats({
      ...(lastStatusStats ?? {}),
      buildProfile: storedProfile
    });
  }

  void refreshPbAutoBuildCapability();
  void refreshOrcaCapability();

  ensureCommandsRegistered(context);
}

function ensureCommandsRegistered(context: vscode.ExtensionContext): void {
  if (commandsRegistered) {
    return;
  }

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.restartServer', async () => {
      outputChannel?.appendLine('[VSC PowerSyntax] Reiniciando servidor...');
      await restartClient(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.inspectHierarchy', async () => {
      if (!client) {
        vscode.window.showErrorMessage('El cliente LSP no está disponible.');
        return;
      }

      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage('No hay un editor activo para inspeccionar.');
        return;
      }

      const payload = await client.sendRequest('workspace/executeCommand', {
        command: 'powerbuilder.inspectHierarchy',
        arguments: [
          editor.document.uri.toString(),
          editor.selection.active.line,
          editor.selection.active.character
        ]
      });

      renderHierarchyInspection(payload);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.refreshCurrentObjectContextPanel', async () => {
      await currentObjectContextPanelController?.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.focusCurrentObjectContextPanel', async () => {
      const result = await currentObjectContextPanelController?.focusPanel();
      if (!result) {
        vscode.window.showInformationMessage('PowerSyntax: no hay contexto disponible para el objeto activo.');
      }
      return result;
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.openCurrentObjectContextLocation', async (target?: { uri?: string; line?: number; character?: number }) => {
      if (!target?.uri) {
        return;
      }
      const locationTarget = {
        uri: target.uri,
        ...(typeof target.line === 'number' ? { line: target.line } : {}),
        ...(typeof target.character === 'number' ? { character: target.character } : {}),
      };
      await currentObjectContextPanelController?.openLocation(locationTarget);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.refreshDiagnosticsExplainabilityPanel', async () => {
      await diagnosticsExplainabilityPanelController?.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.focusDiagnosticsExplainabilityPanel', async () => {
      const result = await diagnosticsExplainabilityPanelController?.focusPanel();
      if (!result) {
        vscode.window.showInformationMessage('PowerSyntax: no hay diagnostics explicables para el archivo activo.');
      }
      return result;
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.openDiagnosticsExplainabilityLocation', async (target?: { uri?: string; line?: number; character?: number }) => {
      if (!target?.uri) {
        return;
      }
      const locationTarget = {
        uri: target.uri,
        ...(typeof target.line === 'number' ? { line: target.line } : {}),
        ...(typeof target.character === 'number' ? { character: target.character } : {}),
      };
      await diagnosticsExplainabilityPanelController?.openLocation(locationTarget);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.refreshObjectExplorer', async () => {
      await objectExplorerController?.refresh();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.focusObjectExplorerOnCurrentProject', async () => {
      const result = await objectExplorerController?.focusCurrentProject();
      if (!result) {
        vscode.window.showInformationMessage('PowerSyntax: no se pudo resolver el proyecto activo para el Object Explorer.');
      }
      return result;
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.focusObjectExplorerOnCurrentFile', async () => {
      const result = await objectExplorerController?.focusCurrentFile();
      if (!result) {
        vscode.window.showInformationMessage('PowerSyntax: no se pudo resolver el archivo activo en el Object Explorer.');
      }
      return result;
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.clearObjectExplorerFocus', async () => {
      await objectExplorerController?.clearFocus();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.openObjectExplorerObject', async (target?: { uri?: string } | string) => {
      await objectExplorerController?.openObject(target);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.openProjectHealthDashboard', async () => {
      await openProjectHealthDashboard();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.showStatusStats', async () => {
      const stats = await fetchRuntimeStatusStats();
      if (stats) {
        lastStatusStats = stats;
        if (statusBarItem) {
          renderProgress(statusBarItem, lastProgressNotification, stats);
        }
      }
      outputChannel?.show(true);
      outputChannel?.appendLine(buildStatusStatsReport(stats));
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.showStatusHealth', async () => {
      const stats = await fetchRuntimeStatusStats();
      if (stats) {
        lastStatusStats = stats;
        if (statusBarItem) {
          renderProgress(statusBarItem, lastProgressNotification, stats);
        }
      }
      const report = buildStatusHealthReport(lastProgressNotification, stats);
      outputChannel?.show(true);
      outputChannel?.appendLine(report);
      void vscode.window.showInformationMessage('PowerSyntax: resumen de salud escrito en el canal de salida.', 'Abrir salida')
        .then(selection => {
          if (selection === 'Abrir salida') {
            outputChannel?.show(true);
          }
        });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.runPbAutoBuild', async () => {
      await runPbAutoBuild();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.runLastPbAutoBuild', async () => {
      await runLastPbAutoBuild();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.runPbAutoBuildWithPicker', async () => {
      await runPbAutoBuildWithPicker();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.cancelPbAutoBuild', async () => {
      await cancelPbAutoBuild();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.exportPbAutoBuildCiHelper', async () => {
      await exportPbAutoBuildCiHelper();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.runActiveOrcaScript', async () => {
      return runActiveOrcaScript();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.cancelOrcaScript', async () => {
      return cancelOrcaScript();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.exportOrcaStaging', async () => {
      return exportOrcaStaging();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.importOrcaStaging', async () => {
      return importOrcaStaging();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.regenerateOrcaLibraries', async () => {
      return runOrcaWriteOperation('regenerate');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.rebuildOrcaProject', async () => {
      return runOrcaWriteOperation('rebuild');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.exportSemanticReproPack', async (options?: SemanticReproPackCommandOptions) => {
      return exportSemanticReproPack(options);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.showSettingsGovernance', async () => {
      await showSettingsGovernance();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.applySettingsProfile', async () => {
      await applySettingsProfile();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('vscPowerSyntax.openStatusMenu', async () => {
      const stats = await fetchRuntimeStatusStats();
      if (stats) {
        lastStatusStats = stats;
      }

      const selection = await vscode.window.showQuickPick([
        {
          label: '$(dashboard) Abrir dashboard de salud',
          description: stats?.health?.summary ?? 'Vista read-only sobre salud, manifest y build del workspace',
          command: 'vscPowerSyntax.openProjectHealthDashboard'
        },
        {
          label: '$(pulse) Ver salud del runtime',
          description: stats?.readiness?.state ?? 'sin datos',
          command: 'vscPowerSyntax.showStatusHealth'
        },
        {
          label: '$(graph) Ver stats del servidor',
          description: stats?.projectStatus?.summary ?? 'resumen del estado actual',
          command: 'vscPowerSyntax.showStatusStats'
        },
        {
          label: stats?.buildRunner?.state === 'running' ? '$(debug-stop) Cancelar PBAutoBuild' : '$(tools) Ejecutar PBAutoBuild',
          description: [
            stats?.buildProfile?.label,
            stats?.buildHealth?.summary,
            formatPbAutoBuildStatusInline(stats?.buildTooling),
            formatPbAutoBuildRunInline(stats?.buildRunner)
          ].filter((part): part is string => Boolean(part)).join(' · ') || 'Usa el build file utilizable del proyecto activo',
          command: stats?.buildRunner?.state === 'running' ? 'vscPowerSyntax.cancelPbAutoBuild' : 'vscPowerSyntax.runPbAutoBuild'
        },
        {
          label: '$(history) Repetir último build frecuente',
          description: stats?.buildProfile?.label ?? 'Usa el último build file ejecutado o te deja elegir uno utilizable',
          command: 'vscPowerSyntax.runLastPbAutoBuild'
        },
        {
          label: '$(list-selection) Elegir build file y ejecutar',
          description: 'Muestra los build files PBAutoBuild utilizables y recuerda el elegido como último build',
          command: 'vscPowerSyntax.runPbAutoBuildWithPicker'
        },
        {
          label: '$(export) Exportar helper CI/CD',
          description: stats?.buildProfile?.label
            ? `${stats.buildProfile.label} · bundle neutral en tools/pbautobuild-ci`
            : 'Genera scripts versionables para CI/CD desde un build file PBAutoBuild utilizable',
          command: 'vscPowerSyntax.exportPbAutoBuildCiHelper'
        },
        {
          label: '$(package) Exportar repro pack semántico',
          description: vscode.window.activeTextEditor?.document
            ? `${path.basename(vscode.window.activeTextEditor.document.uri.fsPath || vscode.window.activeTextEditor.document.uri.path)} · bundle en tools/semantic-repros`
            : 'Captura contexto, impacto, plan seguro y archivos relacionados del editor activo',
          command: 'vscPowerSyntax.exportSemanticReproPack'
        },
        {
          label: '$(settings-gear) Ver gobernanza de settings',
          description: 'Resume el perfil activo y las divergencias de configuración respecto al contrato recomendado',
          command: 'vscPowerSyntax.showSettingsGovernance'
        },
        {
          label: '$(symbol-enum) Aplicar perfil de settings',
          description: 'Aplica en el workspace uno de los perfiles gobernados del producto',
          command: 'vscPowerSyntax.applySettingsProfile'
        },
        {
          label: '$(comment-discussion) Abrir explainability de diagnostics',
          description: 'Explica los diagnostics del archivo activo con código, causa probable y siguientes pasos',
          command: 'vscPowerSyntax.focusDiagnosticsExplainabilityPanel'
        },
        {
          label: stats?.orcaRunner?.state === 'running' ? '$(debug-stop) Cancelar ORCA legacy' : '$(tools) Ejecutar ORCA legacy',
          description: [
            formatOrcaStatusInline(stats?.orcaTooling),
            stats?.orcaRunner?.state && stats.orcaRunner.state !== 'idle'
              ? `${stats.orcaRunner.state}${stats.orcaRunner.detail ? ` · ${stats.orcaRunner.detail}` : ''}`
              : undefined
          ].filter((part): part is string => Boolean(part)).join(' · ') || 'Usa el script activo con un ejecutable ORCA válido',
          command: stats?.orcaRunner?.state === 'running' ? 'vscPowerSyntax.cancelOrcaScript' : 'vscPowerSyntax.runActiveOrcaScript'
        },
        {
          label: '$(archive) Exportar PBL legacy a ORCA staging',
          description: 'Genera .vsc-powersyntax/orca-export/orca-staging y ejecuta un script pborca-compatible sobre las librerías legacy resueltas por el workspace',
          command: 'vscPowerSyntax.exportOrcaStaging'
        },
        {
          label: '$(cloud-upload) Importar ORCA staging a PBL legacy',
          description: 'Ejecuta preflight, backup y script import-from-staging.orc sobre el último export ORCA persistido del workspace',
          command: 'vscPowerSyntax.importOrcaStaging'
        },
        {
          label: '$(sync) Regenerate librerías legacy vía ORCA',
          description: 'Reutiliza el rail ORCA controlado para regenerar las librerías del último export persistido',
          command: 'vscPowerSyntax.regenerateOrcaLibraries'
        },
        {
          label: '$(tools) Rebuild proyecto legacy vía ORCA',
          description: 'Ejecuta rebuild sobre el target/project legacy persistido por el último export válido',
          command: 'vscPowerSyntax.rebuildOrcaProject'
        },
        {
          label: '$(git-branch) Inspeccionar jerarquía activa',
          description: 'Usa el editor activo para navegación jerárquica',
          command: 'vscPowerSyntax.inspectHierarchy'
        },
        {
          label: '$(debug-restart) Reiniciar servidor',
          description: 'Reinicia el cliente y el servidor LSP',
          command: 'vscPowerSyntax.restartServer'
        }
      ], {
        title: 'VSC PowerSyntax',
        placeHolder: stats?.projectStatus?.summary ?? 'Selecciona una acción de mantenimiento'
      });

      if (!selection) {
        return;
      }

      await vscode.commands.executeCommand(selection.command);
    })
  );

  commandsRegistered = true;
}

function createLanguageClient(
  serverOptions: ServerOptions,
  clientOptions: LanguageClientOptions
): LanguageClient {
  return new LanguageClient(
    SERVER_ID,
    SERVER_NAME,
    serverOptions,
    clientOptions
  );
}

function buildClientRuntime(
  context: vscode.ExtensionContext,
  channel: vscode.OutputChannel
): {
  serverModule: string;
  serverOptions: ServerOptions;
  clientOptions: LanguageClientOptions;
} {
  const serverModule = context.asAbsolutePath(
    path.join('out', 'server', 'server.js')
  );

  if (!fs.existsSync(serverModule)) {
    throw new Error(
      `No se ha encontrado el servidor LSP en: ${serverModule}. ` +
      'Ejecuta la compilación del servidor antes de iniciar la extensión.'
    );
  }

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: {
        execArgv: ['--nolazy', '--inspect=6010']
      }
    }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'powerbuilder', pattern: '**/*.srj' },
      { scheme: 'file', language: 'powerbuilder', pattern: '**/*.srq' },
      { scheme: 'file', language: 'powerbuilder-window' },
      { scheme: 'file', language: 'powerbuilder-datawindow' },
      { scheme: 'file', language: 'powerbuilder-userobject' },
      { scheme: 'file', language: 'powerbuilder-function' },
      { scheme: 'file', language: 'powerbuilder-menu' },
      { scheme: 'file', language: 'powerbuilder-application' },
      { scheme: 'file', language: 'powerbuilder-structure' },
      { scheme: 'file', language: 'powerbuilder-pipeline' },
      { scheme: 'untitled', language: 'powerbuilder' }
    ],
    outputChannel: channel,
    synchronize: {
      fileEvents: [
        vscode.workspace.createFileSystemWatcher(POWERBUILDER_PROJECT_MARKER_GLOB),
        vscode.workspace.createFileSystemWatcher(POWERBUILDER_SOURCE_GLOB),
        vscode.workspace.createFileSystemWatcher(PBAUTOBUILD_BUILD_FILE_GLOB)
      ]
    },
    initializationOptions: {
      cacheStorageUri: (context.storageUri ?? context.globalStorageUri)?.toString()
    }
  };

  return {
    serverModule,
    serverOptions,
    clientOptions
  };
}

async function startClient(
  context: vscode.ExtensionContext,
  options: { activationStart?: number } = {}
): Promise<void> {
  if (client && !client.needsStart()) {
    return;
  }

  const channel = outputChannel;
  if (!channel) {
    throw new Error('No se pudo inicializar el canal de salida de VSC PowerSyntax.');
  }

  const { serverModule, serverOptions, clientOptions } = buildClientRuntime(context, channel);
  const nextClient = createLanguageClient(serverOptions, clientOptions);
  const clientStartTime = performance.now();

  channel.appendLine(
    `[VSC PowerSyntax] Iniciando cliente LSP usando: ${serverModule}`
  );

  client = nextClient;

  try {
    await nextClient.start();

    if (statusBarItem) {
      const item = statusBarItem;
      nextClient.onNotification(PROGRESS_NOTIFICATION, (p: ProgressNotification) => {
        lastProgressNotification = p;
        renderProgress(item, p, lastStatusStats);
        scheduleStatusRefresh(item);
      });

      scheduleStatusRefresh(item, 0);
    }

    const clientElapsed = performance.now() - clientStartTime;
    channel.appendLine(
      `[TIEMPO] Inicio del cliente LSP: ${clientElapsed.toFixed(2)}ms`
    );

    if (typeof options.activationStart === 'number') {
      const totalElapsed = performance.now() - options.activationStart;
      channel.appendLine(
        `[TIEMPO] Activación total del cliente: ${totalElapsed.toFixed(2)}ms`
      );
    }

    channel.appendLine(
      '[VSC PowerSyntax] Cliente LSP activado correctamente.'
    );
  } catch (error) {
    await stopClient();
    throw error;
  }
}

function createPublicApi(): VscPowerSyntaxApi {
  const publicContract = getPublicApiContractDescriptor();

  const readOnlyToolBridge = getReadOnlyToolBridgeDescriptor();

  const normalizeToolArgs = (args: unknown): Record<string, unknown> => {
    if (args === undefined || args === null) {
      return {};
    }
    if (typeof args !== 'object' || Array.isArray(args)) {
      throw new Error('El bridge read-only requiere `args` como objeto JSON opcional.');
    }
    return args as Record<string, unknown>;
  };

  const api: VscPowerSyntaxApi = {
    version: PUBLIC_API_VERSION,
    extensionId: PUBLIC_API_EXTENSION_ID,
    get contract(): ApiPublicContractDescriptor {
      return clonePlainData(publicContract);
    },
    isVersionCompatible: isApiVersionCompatible,
    getPublicContract(): ApiPublicContractDescriptor {
      return clonePlainData(publicContract);
    },
    getReadOnlyToolBridge(): ApiReadOnlyToolBridgeDescriptor {
      return clonePlainData(readOnlyToolBridge);
    },
    async invokeReadOnlyTool(request: ApiReadOnlyToolCallRequest): Promise<ApiReadOnlyToolCallResult> {
      const args = normalizeToolArgs(request.args);

      switch (request.tool) {
        case 'contract':
          return {
            tool: 'contract',
            mode: 'read-only',
            schema: 'ApiPublicContractDescriptor',
            payload: api.getPublicContract(),
          };
        case 'server-stats':
          return {
            tool: 'server-stats',
            mode: 'read-only',
            schema: 'ApiServerStats',
            payload: await api.getServerStats(),
          };
        case 'query-symbols':
          return {
            tool: 'query-symbols',
            mode: 'read-only',
            schema: 'ApiSymbol[]',
            payload: await api.querySymbols({
              query: typeof args.query === 'string' ? args.query : '',
              ...(typeof args.limit === 'number' ? { limit: args.limit } : {}),
            }),
          };
        case 'current-object-context':
          return {
            tool: 'current-object-context',
            mode: 'read-only',
            schema: 'ApiCurrentObjectContext',
            payload: await api.getCurrentObjectContext(args as ApiCurrentObjectContextRequest),
          };
        case 'impact-analysis':
          return {
            tool: 'impact-analysis',
            mode: 'read-only',
            schema: 'ApiImpactAnalysis',
            payload: await api.analyzeImpact(args as ApiImpactAnalysisRequest),
          };
        case 'safe-edit-plan':
          return {
            tool: 'safe-edit-plan',
            mode: 'read-only',
            schema: 'ApiSafeEditPlan',
            payload: await api.generateSafeEditPlan(args as ApiSafeEditPlanRequest),
          };
        case 'safe-batch-refactor-plan':
          return {
            tool: 'safe-batch-refactor-plan',
            mode: 'read-only',
            schema: 'ApiSafeBatchRefactorPlan',
            payload: await api.generateSafeBatchRefactorPlan(args as unknown as ApiSafeBatchRefactorPlanRequest),
          };
        case 'semantic-workspace-manifest':
          return {
            tool: 'semantic-workspace-manifest',
            mode: 'read-only',
            schema: 'ApiSemanticWorkspaceManifest',
            payload: await api.getSemanticWorkspaceManifest(args as ApiSemanticWorkspaceManifestRequest),
          };
      }
    },
    async exportSemanticWorkspaceSnapshot(request: ApiSemanticWorkspaceSnapshotExportRequest = {}): Promise<ApiSemanticWorkspaceSnapshotExportResult> {
      const workspaceManifest = await api.getSemanticWorkspaceManifest({
        ...(typeof request.maxObjects === 'number' ? { maxObjects: request.maxObjects } : {}),
        ...(typeof request.maxSymbols === 'number' ? { maxSymbols: request.maxSymbols } : {}),
      });
      const serverStats = request.includeServerStats === false
        ? undefined
        : await api.getServerStats();
      const snapshot = buildSemanticWorkspaceSnapshot({
        apiVersion: PUBLIC_API_VERSION,
        contract: api.getPublicContract(),
        readOnlyToolBridge: api.getReadOnlyToolBridge(),
        workspaceManifest,
        ...(serverStats ? { serverStats } : {}),
      });

      if (!request.destinationUri) {
        return { snapshot };
      }

      const destinationUri = vscode.Uri.parse(request.destinationUri);
      const parentDirectory = parentUriOf(destinationUri);
      if (parentDirectory) {
        await vscode.workspace.fs.createDirectory(parentDirectory);
      }
      await vscode.workspace.fs.writeFile(destinationUri, Buffer.from(`${JSON.stringify(snapshot, null, 2)}\n`, 'utf8'));
      return {
        snapshot,
        destinationUri: destinationUri.toString(),
      };
    },
    async importSemanticWorkspaceSnapshot(request: ApiSemanticWorkspaceSnapshotImportRequest): Promise<ApiSemanticWorkspaceSnapshotImportResult> {
      if (request.sourceUri) {
        try {
          const sourceUri = vscode.Uri.parse(request.sourceUri);
          const content = Buffer.from(await vscode.workspace.fs.readFile(sourceUri)).toString('utf8');
          return parseSemanticWorkspaceSnapshot(JSON.parse(content), sourceUri.toString());
        } catch (error) {
          return {
            valid: false,
            reason: error instanceof Error ? error.message : String(error),
            sourceUri: request.sourceUri,
          };
        }
      }

      if (typeof request.serializedSnapshot === 'string') {
        try {
          return parseSemanticWorkspaceSnapshot(JSON.parse(request.serializedSnapshot));
        } catch (error) {
          return {
            valid: false,
            reason: error instanceof Error ? error.message : String(error),
          };
        }
      }

      if (request.snapshot) {
        return parseSemanticWorkspaceSnapshot(request.snapshot);
      }

      return {
        valid: false,
        reason: 'La importación requiere sourceUri, serializedSnapshot o snapshot.',
      };
    },
    async getServerStats(): Promise<ApiServerStats> {
      return clonePlainData((await fetchRuntimeStatusStats()) ?? {});
    },
    async querySymbols(request: ApiQuerySymbolsRequest) {
      const query = request.query ?? '';
      const limit = typeof request.limit === 'number'
        ? Math.max(0, Math.trunc(request.limit))
        : Number.POSITIVE_INFINITY;
      return executeServerCommand<ApiSymbol[]>('powerbuilder.querySymbols', [query, limit]);
    },
    async getCurrentObjectContext(request: ApiCurrentObjectContextRequest = {}): Promise<ApiCurrentObjectContext> {
      const editor = vscode.window.activeTextEditor;
      const uri = request.uri ?? editor?.document.uri.toString();
      if (!uri) {
        throw new Error('No hay un editor activo para construir el context pack.');
      }

      const line = typeof request.line === 'number'
        ? Math.max(0, Math.trunc(request.line))
        : editor?.selection.active.line;
      const character = typeof request.character === 'number'
        ? Math.max(0, Math.trunc(request.character))
        : editor?.selection.active.character;

      return executeServerCommand<ApiCurrentObjectContext>('powerbuilder.currentObjectContext', [
        uri,
        line,
        character,
        request.maxExcerptLines,
        request.maxReferencedSymbols,
      ]);
    },
    async analyzeImpact(request: ApiImpactAnalysisRequest = {}): Promise<ApiImpactAnalysis> {
      const editor = vscode.window.activeTextEditor;
      const uri = request.uri ?? editor?.document.uri.toString();
      if (!uri) {
        throw new Error('No hay un editor activo para analizar impacto.');
      }

      const line = typeof request.line === 'number'
        ? Math.max(0, Math.trunc(request.line))
        : editor?.selection.active.line;
      const character = typeof request.character === 'number'
        ? Math.max(0, Math.trunc(request.character))
        : editor?.selection.active.character;

      return executeServerCommand<ApiImpactAnalysis>('powerbuilder.analyzeImpact', [
        uri,
        line,
        character,
        request.maxSafeReferences,
      ]);
    },
    async generateSafeEditPlan(request: ApiSafeEditPlanRequest = {}): Promise<ApiSafeEditPlan> {
      const editor = vscode.window.activeTextEditor;
      const uri = request.uri ?? editor?.document.uri.toString();
      if (!uri) {
        throw new Error('No hay un editor activo para generar un plan de edición seguro.');
      }

      const line = typeof request.line === 'number'
        ? Math.max(0, Math.trunc(request.line))
        : editor?.selection.active.line;
      const character = typeof request.character === 'number'
        ? Math.max(0, Math.trunc(request.character))
        : editor?.selection.active.character;

      return executeServerCommand<ApiSafeEditPlan>('powerbuilder.safeEditPlan', [
        uri,
        line,
        character,
        request.maxSafeReferences,
      ]);
    },
    async generateSafeBatchRefactorPlan(request: ApiSafeBatchRefactorPlanRequest = { items: [] }): Promise<ApiSafeBatchRefactorPlan> {
      const normalizedRequest = {
        items: (request.items ?? []).map((item) => ({
          ...(item.uri ? { uri: item.uri } : {}),
          ...(item.label ? { label: item.label } : {}),
          ...(item.newName ? { newName: item.newName } : {}),
          ...(typeof item.line === 'number' ? { line: Math.max(0, Math.trunc(item.line)) } : {}),
          ...(typeof item.character === 'number' ? { character: Math.max(0, Math.trunc(item.character)) } : {}),
          ...(typeof item.maxSafeReferences === 'number' ? { maxSafeReferences: Math.max(0, Math.trunc(item.maxSafeReferences)) } : {}),
        })),
        ...(request.stopOnBlocked === true ? { stopOnBlocked: true } : {}),
      };

      return executeServerCommand<ApiSafeBatchRefactorPlan>('powerbuilder.safeBatchRefactorPlan', [normalizedRequest]);
    },
    async applySpecDrivenPblUpdate(request: ApiSpecDrivenPblUpdateRequest): Promise<ApiSpecDrivenPblUpdateResult> {
      const editor = vscode.window.activeTextEditor;
      const uri = request.uri ?? editor?.document.uri.toString();
      if (!uri) {
        throw new Error('No hay un editor activo para aplicar un update PBL spec-driven.');
      }
      if (!Array.isArray(request.edits) || request.edits.length === 0) {
        throw new Error('Se requiere al menos un edit explícito para aplicar el update PBL spec-driven.');
      }

      const line = typeof request.line === 'number'
        ? Math.max(0, Math.trunc(request.line))
        : editor?.selection.active.line;
      const character = typeof request.character === 'number'
        ? Math.max(0, Math.trunc(request.character))
        : editor?.selection.active.character;

      return executeServerCommand<ApiSpecDrivenPblUpdateResult>('powerbuilder.applySpecDrivenPblUpdate', [{
        ...request,
        uri,
        ...(typeof line === 'number' ? { line } : {}),
        ...(typeof character === 'number' ? { character } : {}),
      }]);
    },
    async applySpecDrivenPblUpdateBatch(request: ApiSpecDrivenPblUpdateBatchRequest): Promise<ApiSpecDrivenPblUpdateBatchResult> {
      if (!Array.isArray(request.requests) || request.requests.length === 0) {
        throw new Error('Se requiere un batch no vacío de requests para aplicar updates PBL.');
      }

      const editor = vscode.window.activeTextEditor;
      const fallbackUri = editor?.document.uri.toString();
      const normalizedRequests = request.requests.map((item) => {
        const uri = item.uri ?? fallbackUri;
        if (!uri) {
          throw new Error('Cada item del batch necesita `uri` o un editor activo que la resuelva.');
        }
        return {
          ...item,
          uri,
        };
      });

      return executeServerCommand<ApiSpecDrivenPblUpdateBatchResult>('powerbuilder.applySpecDrivenPblUpdateBatch', [{
        ...request,
        requests: normalizedRequests,
      }]);
    },
    async getSemanticWorkspaceManifest(request: ApiSemanticWorkspaceManifestRequest = {}): Promise<ApiSemanticWorkspaceManifest> {
      return executeServerCommand<ApiSemanticWorkspaceManifest>('powerbuilder.semanticWorkspaceManifest', [
        request.maxObjects,
        request.maxSymbols,
      ]);
    }
  };

  return Object.freeze(api);
}

async function executeServerCommand<T>(command: string, args: unknown[] = []): Promise<T> {
  if (!client) {
    throw new Error('El cliente LSP no está disponible.');
  }

  const sendRequest = async (): Promise<T> => {
    if (client!.needsStart()) {
      await client!.start();
    }
    const result = await client!.sendRequest('workspace/executeCommand', {
      command,
      arguments: args,
    });
    return clonePlainData(result) as T;
  };

  try {
    return await sendRequest();
  } catch (error) {
    if (!(error instanceof Error) || !/Client is not running/i.test(error.message)) {
      throw error;
    }

    if (client.needsStart()) {
      await client.start();
    }
    return sendRequest();
  }
}

function clonePlainData<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

// ---------------------------------------------------------------------------
// Status bar de progreso
// ---------------------------------------------------------------------------

function applyProgressVisibility(item: vscode.StatusBarItem): void {
  const show = vscode.workspace
    .getConfiguration('vscPowerSyntax')
    .get<boolean>('progress.show', true);

  if (show) {
    item.show();
  } else {
    item.hide();
  }
}

function clearStatusRefreshHandle(): void {
  if (statusRefreshHandle) {
    clearTimeout(statusRefreshHandle);
    statusRefreshHandle = undefined;
  }
}

async function fetchRuntimeStatusStats(): Promise<RuntimeStatusStats | undefined> {
  const buildTooling = await refreshPbAutoBuildCapability();
  const orcaTooling = await refreshOrcaCapability();

  if (!client) {
    return enrichRuntimeStatusStats({
      ...(lastStatusStats ?? {}),
      ...(buildTooling ? { buildTooling } : {}),
      ...(orcaTooling ? { orcaTooling } : {}),
    });
  }

  try {
    const stats = clonePlainData(await executeServerCommand<RuntimeStatusStats>('powerbuilder.showStats'));
    return enrichRuntimeStatusStats({
      ...stats,
      ...(buildTooling ? { buildTooling } : {}),
      ...(orcaTooling ? { orcaTooling } : {}),
      ...(lastStatusStats?.buildProfile ? { buildProfile: lastStatusStats.buildProfile } : {}),
      ...(lastStatusStats?.buildProblems ? { buildProblems: lastStatusStats.buildProblems } : {})
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[VSC PowerSyntax] No se pudieron actualizar stats de status bar: ${message}`);
    return lastStatusStats;
  }
}

function ensurePbAutoBuildDetector(): PbAutoBuildDetector {
  if (!pbAutoBuildDetector) {
    pbAutoBuildDetector = createPbAutoBuildDetector({
      pathExists: async (candidate) => {
        try {
          await fs.promises.access(candidate, fs.constants.F_OK);
          return true;
        } catch {
          return false;
        }
      },
    });
  }

  return pbAutoBuildDetector;
}

function ensureOrcaDetector(): OrcaDetector {
  if (!orcaDetector) {
    orcaDetector = createOrcaDetector({
      inspectPath: async (candidate) => {
        try {
          const stats = await fs.promises.stat(candidate);
          return stats.isDirectory() ? 'directory' : 'file';
        } catch {
          return 'missing';
        }
      },
    });
  }

  return orcaDetector;
}

async function refreshPbAutoBuildCapability(force = false): Promise<PbAutoBuildCapabilitySnapshot | undefined> {
  try {
    const snapshot = await ensurePbAutoBuildDetector().detect({
      configuredPath: vscode.workspace.getConfiguration('vscPowerSyntax').get<string>('build.pbAutoBuildPath', ''),
      envPath: process.env.PB_AUTOBUILD_PATH,
    }, force);

    lastStatusStats = enrichRuntimeStatusStats({ ...(lastStatusStats ?? {}), buildTooling: snapshot });
    if (statusBarItem) {
      renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
    }
    return snapshot;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[VSC PowerSyntax] No se pudo detectar PBAutoBuild: ${message}`);
    return lastStatusStats?.buildTooling;
  }
}

async function refreshOrcaCapability(force = false): Promise<RuntimeStatusStats['orcaTooling'] | undefined> {
  try {
    const snapshot = await ensureOrcaDetector().detect({
      configuredPath: vscode.workspace.getConfiguration('vscPowerSyntax').get<string>('legacy.orcaPath', ''),
      envPath: process.env.PB_ORCA_PATH,
    }, force);

    lastStatusStats = enrichRuntimeStatusStats({ ...(lastStatusStats ?? {}), orcaTooling: snapshot });
    if (statusBarItem) {
      renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
    }
    return snapshot;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[VSC PowerSyntax] No se pudo detectar ORCA: ${message}`);
    return lastStatusStats?.orcaTooling;
  }
}

function scheduleStatusRefresh(item: vscode.StatusBarItem, delayMs = 120): void {
  if (!client) {
    return;
  }

  clearStatusRefreshHandle();
  const requestVersion = ++statusRefreshVersion;
  statusRefreshHandle = setTimeout(() => {
    void (async () => {
      const stats = await fetchRuntimeStatusStats();
      if (requestVersion !== statusRefreshVersion) {
        return;
      }
      lastStatusStats = stats;
      renderProgress(item, lastProgressNotification, stats);
    })();
  }, delayMs);
}

function progressIcon(phase: ProgressNotification['phase']): string {
  switch (phase) {
    case 'discovering':
    case 'indexing':
      return '$(sync~spin)';
    case 'degraded':
    case 'partial':
      return '$(warning)';
    case 'ready':
      return '$(check)';
    case 'idle':
      return '$(dashboard)';
  }
}

function renderProgress(item: vscode.StatusBarItem, p: ProgressNotification, stats?: RuntimeStatusStats): void {
  const show = vscode.workspace
    .getConfiguration('vscPowerSyntax')
    .get<boolean>('progress.show', true);

  if (!show) {
    item.hide();
    return;
  }

  const icon = progressIcon(p.phase);
  const summary = formatStatusBarSummary(p, stats);
  item.text = `${icon ? `${icon} ` : ''}PB: ${summary}`;
  const tooltip = new vscode.MarkdownString(buildStatusTooltipMarkdown(p, stats), true);
  tooltip.isTrusted = true;
  item.tooltip = tooltip;
  item.command = 'vscPowerSyntax.openStatusMenu';
  item.show();
}

function renderHierarchyInspection(payload: unknown): void {
  outputChannel?.show(true);

  if (!payload || typeof payload !== 'object') {
    outputChannel?.appendLine('[Hierarchy] Respuesta inválida del servidor.');
    return;
  }

  const inspection = payload as {
    available?: boolean;
    reason?: string;
    uri?: string;
    focusType?: string | null;
    immediateAncestor?: string | null;
    ancestorChain?: string[];
    immediateAncestorDescriptor?: ApiCurrentObjectAncestor | null;
    ancestorDescriptors?: ApiCurrentObjectAncestor[];
    overriddenMembers?: Array<{ name: string; inheritedFrom: string | null }>;
    closureSummary?: { own: number; inherited: number; override: number; inaccessible: number };
    lifecycle?: Array<{
      phase: 'create' | 'destroy';
      declaredIn: string | null;
      callsAncestor: boolean;
      triggersHook: 'constructor' | 'destructor' | null;
      hookResolved: boolean;
      hookDeclaredIn: string | null;
      warnings: string[];
    }>;
    lifecycleWarnings?: string[];
    hierarchyTree?: HierarchyTreeNodePayload | null;
  };

  if (!inspection.available) {
    outputChannel?.appendLine(`[Hierarchy] No disponible: ${inspection.reason ?? 'sin detalle'}`);
    return;
  }

  const formatAncestor = (ancestor: ApiCurrentObjectAncestor | null | undefined, fallback?: string | null): string => {
    if (!ancestor) {
      return fallback ?? 'ninguno';
    }
    return ancestor.isSystemType ? `${ancestor.name} [system]` : ancestor.name;
  };

  const ancestorChain = inspection.ancestorDescriptors?.length
    ? inspection.ancestorDescriptors.map((ancestor) => formatAncestor(ancestor))
    : inspection.ancestorChain ?? [];

  outputChannel?.appendLine(`[Hierarchy] URI: ${inspection.uri ?? 'desconocida'}`);
  outputChannel?.appendLine(`- Tipo foco: ${inspection.focusType ?? 'desconocido'}`);
  outputChannel?.appendLine(`- Ancestro inmediato: ${formatAncestor(inspection.immediateAncestorDescriptor, inspection.immediateAncestor)}`);
  outputChannel?.appendLine(`- Cadena de ancestros: ${ancestorChain.join(' -> ') || 'sin cadena'}`);
  if (inspection.closureSummary) {
    outputChannel?.appendLine(
      `- Closure: propios=${inspection.closureSummary.own}, heredados=${inspection.closureSummary.inherited}, overrides=${inspection.closureSummary.override}, inaccesibles=${inspection.closureSummary.inaccessible}`
    );
  }
  if (inspection.overriddenMembers && inspection.overriddenMembers.length > 0) {
    outputChannel?.appendLine('- Overrides locales:');
    for (const item of inspection.overriddenMembers) {
      outputChannel?.appendLine(`  - ${item.name} <- ${item.inheritedFrom ?? 'origen desconocido'}`);
    }
  }
  if (inspection.lifecycle && inspection.lifecycle.length > 0) {
    outputChannel?.appendLine('- Lifecycle:');
    for (const item of inspection.lifecycle) {
      const details = [
        `declarado en ${item.declaredIn ?? 'origen desconocido'}`,
        item.callsAncestor ? 'call super presente' : 'sin call super',
        item.triggersHook
          ? `${item.triggersHook} ${item.hookResolved ? `resuelto en ${item.hookDeclaredIn ?? 'origen desconocido'}` : 'no resuelto'}`
          : 'sin trigger hook'
      ];
      outputChannel?.appendLine(`  - ${item.phase}: ${details.join(' · ')}`);
      for (const warning of item.warnings) {
        outputChannel?.appendLine(`    - warning: ${warning}`);
      }
    }
  }
  if (inspection.lifecycleWarnings && inspection.lifecycleWarnings.length > 0) {
    outputChannel?.appendLine(`- Lifecycle warnings: ${inspection.lifecycleWarnings.join(', ')}`);
  }
  if (inspection.hierarchyTree) {
    outputChannel?.appendLine('- Árbol de jerarquía:');
    for (const line of formatHierarchyTreeLines(inspection.hierarchyTree)) {
      outputChannel?.appendLine(`  ${line}`);
    }
  }
}

interface HierarchyTreeNodePayload {
  name: string;
  children: HierarchyTreeNodePayload[];
}

function formatHierarchyTreeLines(node: HierarchyTreeNodePayload, depth = 0): string[] {
  const prefix = depth === 0 ? '- ' : `${'  '.repeat(depth)}- `;
  const lines = [`${prefix}${node.name}`];
  for (const child of node.children) {
    lines.push(...formatHierarchyTreeLines(child, depth + 1));
  }
  return lines;
}

async function runPbAutoBuild(selectedProfile?: PbAutoBuildBuildFileOption): Promise<void> {
  const buildTooling = await refreshPbAutoBuildCapability(true);
  if (!buildTooling || buildTooling.status !== 'available' || !buildTooling.executablePath) {
    const detail = buildTooling?.detail ?? 'No se encontró PBAutoBuild disponible.';
    outputChannel?.appendLine(`[PBAutoBuild] ${detail}`);
    void vscode.window.showErrorMessage(detail);
    return;
  }

  outputChannel?.show(true);
  outputChannel?.appendLine(
    `[PBAutoBuild] Iniciando build${selectedProfile ? ` (${selectedProfile.label})` : ''} con ${buildTooling.executablePath}.`
  );
  lastStatusStats = enrichRuntimeStatusStats({
    ...(lastStatusStats ?? {}),
    buildTooling,
    ...(selectedProfile ? { buildProfile: selectedProfile } : {}),
    buildProblems: undefined,
    buildRunner: {
      state: 'running',
      ...(selectedProfile ? { buildFileUri: selectedProfile.uri } : {}),
      executablePath: buildTooling.executablePath,
      detail: 'Solicitud enviada al servidor.'
    }
  });
  if (statusBarItem) {
    renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
  }

  try {
    const result = await executeServerCommand<PbAutoBuildRunResultProtocol>('powerbuilder.runPbAutoBuild', [{
      executablePath: buildTooling.executablePath,
      ...(selectedProfile ? { buildFileUri: selectedProfile.uri } : {})
    } satisfies PbAutoBuildRunRequestProtocol]);
    if (result.snapshot.detail) {
      outputChannel?.appendLine(`[PBAutoBuild] ${result.snapshot.detail}`);
    }
    if (result.output.trim()) {
      outputChannel?.appendLine(result.output);
    }
    applyPbAutoBuildProblems(result.problems ?? []);
    const executedProfile = toPbAutoBuildProfile(result.snapshot.buildFileUri, selectedProfile);
    await persistPbAutoBuildProfile(executedProfile);
    lastStatusStats = enrichRuntimeStatusStats({
      ...(lastStatusStats ?? {}),
      ...(executedProfile ? { buildProfile: executedProfile } : {}),
      buildProblems: result.problemSummary,
      buildRunner: result.snapshot
    });
    if (result.problemSummary) {
      outputChannel?.appendLine(
        `[PBAutoBuild] Problemas publicados: ${result.problemSummary.published}/${result.problemSummary.total}` +
        (result.problemSummary.unresolved > 0 ? ` · sin ubicación fiable: ${result.problemSummary.unresolved}` : '')
      );
    }

    const stats = await fetchRuntimeStatusStats();
    if (stats) {
      lastStatusStats = stats;
      if (statusBarItem) {
        renderProgress(statusBarItem, lastProgressNotification, stats);
      }
    }

    const message = result.snapshot.detail ?? 'PBAutoBuild finalizado.';
    if (result.snapshot.state === 'succeeded') {
      void vscode.window.showInformationMessage(message);
      return;
    }
    if (result.snapshot.state === 'cancelled') {
      void vscode.window.showWarningMessage(message);
      return;
    }
    void vscode.window.showErrorMessage(message);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[PBAutoBuild] ERROR: ${message}`);
    const stats = await fetchRuntimeStatusStats();
    if (stats) {
      lastStatusStats = stats;
      if (statusBarItem) {
        renderProgress(statusBarItem, lastProgressNotification, stats);
      }
    }
    void vscode.window.showErrorMessage(`No se pudo ejecutar PBAutoBuild: ${message}`);
  }
}

async function runLastPbAutoBuild(): Promise<void> {
  const profile = await resolveLastPbAutoBuildProfile();
  if (!profile) {
    return;
  }
  await runPbAutoBuild(profile);
}

async function runPbAutoBuildWithPicker(): Promise<void> {
  const profile = await pickPbAutoBuildProfile();
  if (!profile) {
    return;
  }
  await runPbAutoBuild(profile);
}

async function cancelPbAutoBuild(): Promise<void> {
  try {
    const result = await executeServerCommand<PbAutoBuildCancelResultProtocol>('powerbuilder.cancelPbAutoBuild');
    if (!result.cancelled) {
      void vscode.window.showInformationMessage('No hay un build PBAutoBuild en curso.');
      return;
    }

    outputChannel?.appendLine('[PBAutoBuild] Cancelación solicitada.');
    lastStatusStats = enrichRuntimeStatusStats({
      ...(lastStatusStats ?? {}),
      buildRunner: result.snapshot
    });
    if (statusBarItem) {
      renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[PBAutoBuild] ERROR cancelando build: ${message}`);
    void vscode.window.showErrorMessage(`No se pudo cancelar PBAutoBuild: ${message}`);
  }
}

async function runActiveOrcaScript(): Promise<OrcaRunResultProtocol | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showWarningMessage('PowerSyntax: no hay un script activo para ejecutar con ORCA.');
    return undefined;
  }

  const orcaTooling = await refreshOrcaCapability(true);
  if (!orcaTooling || orcaTooling.status !== 'available' || !orcaTooling.executablePath) {
    void vscode.window.showWarningMessage(`PowerSyntax: ${orcaTooling?.detail ?? 'No se encontró ORCA disponible.'}`);
    return undefined;
  }

  outputChannel?.appendLine(`[ORCA] Iniciando adapter legacy sobre ${editor.document.uri.toString()} con ${orcaTooling.executablePath}.`);

  const result = await executeServerCommand<OrcaRunResultProtocol>('powerbuilder.runOrcaScript', [{
    executablePath: orcaTooling.executablePath,
    scriptUri: editor.document.uri.toString(),
  }]);

  if (result.snapshot.detail) {
    outputChannel?.appendLine(`[ORCA] ${result.snapshot.detail}`);
  }
  if (result.output.trim()) {
    outputChannel?.appendLine(result.output);
  }

  lastStatusStats = enrichRuntimeStatusStats({
    ...(lastStatusStats ?? {}),
    orcaTooling,
    orcaRunner: result.snapshot,
  });
  if (statusBarItem) {
    renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
  }

  if (result.snapshot.state === 'succeeded') {
    void vscode.window.showInformationMessage('PowerSyntax: ORCA finalizó correctamente.');
  } else if (result.snapshot.state === 'cancelled') {
    void vscode.window.showWarningMessage('PowerSyntax: ORCA fue cancelado.');
  } else {
    void vscode.window.showWarningMessage(`PowerSyntax: ORCA terminó en estado ${result.snapshot.state}.`);
  }

  return result;
}

async function cancelOrcaScript(): Promise<OrcaCancelResultProtocol> {
  const result = await executeServerCommand<OrcaCancelResultProtocol>('powerbuilder.cancelOrcaScript');
  if (!result.cancelled) {
    void vscode.window.showInformationMessage('PowerSyntax: no hay una ejecución ORCA en curso.');
    return result;
  }

  outputChannel?.appendLine('[ORCA] Cancelación solicitada.');
  lastStatusStats = enrichRuntimeStatusStats({
    ...(lastStatusStats ?? {}),
    orcaRunner: result.snapshot,
  });
  if (statusBarItem) {
    renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
  }
  void vscode.window.showInformationMessage('PowerSyntax: se solicitó cancelar la ejecución ORCA.');
  return result;
}

async function exportOrcaStaging(): Promise<OrcaStagingExportResultProtocol | undefined> {
  const orcaTooling = await refreshOrcaCapability(true);
  if (!orcaTooling || orcaTooling.status !== 'available' || !orcaTooling.executablePath) {
    void vscode.window.showWarningMessage(`PowerSyntax: ${orcaTooling?.detail ?? 'No se encontró ORCA disponible.'}`);
    return undefined;
  }

  const sessionLibrary = resolveOrcaSessionLibrary();
  const focusUri = vscode.window.activeTextEditor?.document.uri.toString();

  outputChannel?.appendLine(`[ORCA] Preparando export legacy a staging con ${orcaTooling.executablePath} y sesión ${sessionLibrary}.`);

  try {
    const result = await executeServerCommand<OrcaStagingExportResultProtocol>('powerbuilder.exportOrcaStaging', [{
      executablePath: orcaTooling.executablePath,
      sessionLibrary,
      ...(focusUri ? { focusUri } : {}),
    }]);

    outputChannel?.appendLine(`[ORCA] Staging root: ${result.stagingRootUri}`);
    outputChannel?.appendLine(`[ORCA] Script generado: ${result.scriptUri}`);
    outputChannel?.appendLine(`[ORCA] Estado export: ${result.stateUri}`);
    for (const library of result.exportedLibraries) {
      outputChannel?.appendLine(`[ORCA] ${library.libraryUri} -> ${library.stagingDirectoryUri}`);
    }
    if (result.snapshot.detail) {
      outputChannel?.appendLine(`[ORCA] ${result.snapshot.detail}`);
    }
    if (result.output.trim()) {
      outputChannel?.appendLine(result.output);
    }

    lastStatusStats = enrichRuntimeStatusStats({
      ...(lastStatusStats ?? {}),
      orcaTooling,
      orcaRunner: result.snapshot,
    });
    if (statusBarItem) {
      renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
    }

    if (result.snapshot.state === 'succeeded') {
      void vscode.window.showInformationMessage(
        `PowerSyntax: export ORCA completado en ${result.exportedLibraries.length} librería(s).`
      );
    } else if (result.snapshot.state === 'cancelled') {
      void vscode.window.showWarningMessage('PowerSyntax: la exportación ORCA fue cancelada.');
    } else {
      void vscode.window.showWarningMessage(`PowerSyntax: la exportación ORCA terminó en estado ${result.snapshot.state}.`);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[ORCA] ERROR exportando a staging: ${message}`);
    void vscode.window.showErrorMessage(`No se pudo exportar a ORCA staging: ${message}`);
    return undefined;
  }
}

async function importOrcaStaging(): Promise<OrcaStagingImportResultProtocol | undefined> {
  const orcaTooling = await refreshOrcaCapability(true);
  if (!orcaTooling || orcaTooling.status !== 'available' || !orcaTooling.executablePath) {
    void vscode.window.showWarningMessage(`PowerSyntax: ${orcaTooling?.detail ?? 'No se encontró ORCA disponible.'}`);
    return undefined;
  }

  const sessionLibrary = resolveOrcaSessionLibrary();
  const focusUri = vscode.window.activeTextEditor?.document.uri.toString();

  outputChannel?.appendLine(`[ORCA] Preparando import legacy desde staging con ${orcaTooling.executablePath} y sesión ${sessionLibrary}.`);

  try {
    const result = await executeServerCommand<OrcaStagingImportResultProtocol>('powerbuilder.importOrcaStaging', [{
      executablePath: orcaTooling.executablePath,
      sessionLibrary,
      ...(focusUri ? { focusUri } : {}),
    }]);

    outputChannel?.appendLine(`[ORCA] Ledger import: ${result.ledgerUri}`);
    if (result.scriptUri) {
      outputChannel?.appendLine(`[ORCA] Script import: ${result.scriptUri}`);
    }
    if (result.backupRootUri) {
      outputChannel?.appendLine(`[ORCA] Backup root: ${result.backupRootUri}`);
    }
    for (const issue of result.preflight.issues) {
      outputChannel?.appendLine(`[ORCA] Preflight ${issue.severity}/${issue.code}: ${issue.message}`);
    }
    for (const library of result.importedLibraries) {
      outputChannel?.appendLine(`[ORCA] ${library.libraryUri} <= ${library.stagingDirectoryUri}`);
      if (library.backupUri) {
        outputChannel?.appendLine(`[ORCA] Backup ${library.libraryUri} -> ${library.backupUri}`);
      }
    }
    outputChannel?.appendLine(`[ORCA] Compile result: ${result.compileResult.summary}`);
    if (result.snapshot.detail) {
      outputChannel?.appendLine(`[ORCA] ${result.snapshot.detail}`);
    }
    if (result.output.trim()) {
      outputChannel?.appendLine(result.output);
    }

    lastStatusStats = enrichRuntimeStatusStats({
      ...(lastStatusStats ?? {}),
      orcaTooling,
      orcaRunner: result.snapshot,
    });
    if (statusBarItem) {
      renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
    }

    if (result.blocked) {
      void vscode.window.showWarningMessage(
        `PowerSyntax: el import ORCA fue bloqueado por preflight (${result.preflight.issues.length} incidencia(s)).`
      );
      return result;
    }

    if (result.snapshot.state === 'succeeded' && result.compileResult.status === 'succeeded') {
      void vscode.window.showInformationMessage(
        `PowerSyntax: import ORCA completado en ${result.importedLibraries.length} librería(s).`
      );
    } else if (result.snapshot.state === 'cancelled') {
      void vscode.window.showWarningMessage('PowerSyntax: el import ORCA fue cancelado.');
    } else {
      void vscode.window.showWarningMessage(`PowerSyntax: el import ORCA terminó con incidencias. ${result.compileResult.summary}`);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[ORCA] ERROR importando desde staging: ${message}`);
    void vscode.window.showErrorMessage(`No se pudo importar ORCA staging: ${message}`);
    return undefined;
  }
}

async function runOrcaWriteOperation(operation: 'regenerate' | 'rebuild'): Promise<OrcaWriteResultProtocol | undefined> {
  const orcaTooling = await refreshOrcaCapability(true);
  if (!orcaTooling || orcaTooling.status !== 'available' || !orcaTooling.executablePath) {
    void vscode.window.showWarningMessage(`PowerSyntax: ${orcaTooling?.detail ?? 'No se encontró ORCA disponible.'}`);
    return undefined;
  }

  const sessionLibrary = resolveOrcaSessionLibrary();
  const focusUri = vscode.window.activeTextEditor?.document.uri.toString();
  const operationLabel = operation === 'regenerate' ? 'regenerate' : 'rebuild';
  const serverCommand = operation === 'regenerate'
    ? 'powerbuilder.regenerateOrcaLibraries'
    : 'powerbuilder.rebuildOrcaProject';

  outputChannel?.appendLine(`[ORCA] Preparando ${operationLabel} legacy con ${orcaTooling.executablePath} y sesión ${sessionLibrary}.`);

  try {
    const result = await executeServerCommand<OrcaWriteResultProtocol>(serverCommand, [{
      executablePath: orcaTooling.executablePath,
      sessionLibrary,
      ...(focusUri ? { focusUri } : {}),
    }]);

    outputChannel?.appendLine(`[ORCA] Ledger ${operationLabel}: ${result.ledgerUri}`);
    if (result.scriptUri) {
      outputChannel?.appendLine(`[ORCA] Script ${operationLabel}: ${result.scriptUri}`);
    }
    if (result.backupRootUri) {
      outputChannel?.appendLine(`[ORCA] Backup root: ${result.backupRootUri}`);
    }
    for (const issue of result.preflight.issues) {
      outputChannel?.appendLine(`[ORCA] Preflight ${issue.severity}/${issue.code}: ${issue.message}`);
    }
    outputChannel?.appendLine(`[ORCA] Compile result: ${result.compileResult.summary}`);
    if (result.snapshot.detail) {
      outputChannel?.appendLine(`[ORCA] ${result.snapshot.detail}`);
    }
    if (result.output.trim()) {
      outputChannel?.appendLine(result.output);
    }

    lastStatusStats = enrichRuntimeStatusStats({
      ...(lastStatusStats ?? {}),
      orcaTooling,
      orcaRunner: result.snapshot,
    });
    if (statusBarItem) {
      renderProgress(statusBarItem, lastProgressNotification, lastStatusStats);
    }

    if (result.blocked) {
      void vscode.window.showWarningMessage(
        `PowerSyntax: ${operationLabel} ORCA bloqueado por preflight (${result.preflight.issues.length} incidencia(s)).`
      );
      return result;
    }

    if (result.snapshot.state === 'succeeded' && result.compileResult.status === 'succeeded') {
      void vscode.window.showInformationMessage(`PowerSyntax: ${operationLabel} ORCA completado correctamente.`);
    } else if (result.snapshot.state === 'cancelled') {
      void vscode.window.showWarningMessage(`PowerSyntax: ${operationLabel} ORCA fue cancelado.`);
    } else {
      void vscode.window.showWarningMessage(`PowerSyntax: ${operationLabel} ORCA terminó con incidencias. ${result.compileResult.summary}`);
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[ORCA] ERROR en ${operationLabel}: ${message}`);
    void vscode.window.showErrorMessage(`No se pudo ejecutar ${operationLabel} ORCA: ${message}`);
    return undefined;
  }
}

function resolveOrcaSessionLibrary(): string {
  const configured = vscode.workspace.getConfiguration('vscPowerSyntax').get<string>('legacy.orcaSessionDll', '').trim();
  const fromEnv = process.env.PB_ORCA_DLL?.trim();
  return configured || fromEnv || 'pborc250.dll';
}

async function exportPbAutoBuildCiHelper(): Promise<void> {
  const profile = await resolveLastPbAutoBuildProfile();
  if (!profile) {
    return;
  }

  const workspaceFolder = resolveWorkspaceFolderForPbAutoBuildProfile(profile);
  if (!workspaceFolder) {
    void vscode.window.showErrorMessage('No se pudo resolver el workspace para exportar el helper CI/CD de PBAutoBuild.');
    return;
  }

  const buildFileUri = vscode.Uri.parse(profile.uri);
  const helperDirectoryName = suggestPbAutoBuildCiHelperDirectoryName(profile.label ?? basenameFromPathOrUri(profile.uri));
  const helperRootUri = vscode.Uri.joinPath(workspaceFolder.uri, 'tools', 'pbautobuild-ci', helperDirectoryName);
  const buildTooling = await refreshPbAutoBuildCapability();
  const bundle = buildPbAutoBuildCiHelperBundle({
    workspaceRootPath: workspaceFolder.uri.fsPath,
    helperRootPath: helperRootUri.fsPath,
    buildFilePath: buildFileUri.fsPath,
    profileLabel: profile.label,
    ...(profile.representedProjectUri
      ? { representedProjectPath: vscode.Uri.parse(profile.representedProjectUri).fsPath }
      : {}),
    ...(buildTooling ? { capability: buildTooling } : {})
  });

  await writePbAutoBuildCiHelperBundle(helperRootUri, bundle.files);

  outputChannel?.show(true);
  outputChannel?.appendLine(`[PBAutoBuild] Helper CI/CD exportado en ${helperRootUri.fsPath}.`);
  for (const file of bundle.files) {
    outputChannel?.appendLine(`[PBAutoBuild]   - ${bundle.helperWorkspaceRelativePath}/${file.relativePath}`);
  }

  void vscode.window.showInformationMessage(
    `Helper CI/CD exportado en ${bundle.helperWorkspaceRelativePath}.`
  );
}

async function exportSemanticReproPack(options?: SemanticReproPackCommandOptions): Promise<SemanticReproPackExportResult | undefined> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showInformationMessage('No hay un editor activo para exportar un repro pack semántico.');
    return undefined;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  if (!workspaceFolder) {
    void vscode.window.showErrorMessage('El documento activo debe pertenecer a un workspace para exportar un repro pack semántico.');
    return undefined;
  }

  const currentObjectContext = await publicApiSingleton.getCurrentObjectContext({
    uri: editor.document.uri.toString(),
    line: editor.selection.active.line,
    character: editor.selection.active.character,
    maxExcerptLines: 40,
    maxReferencedSymbols: 50,
  });
  const impactAnalysis = await publicApiSingleton.analyzeImpact({
    uri: editor.document.uri.toString(),
    line: editor.selection.active.line,
    character: editor.selection.active.character,
    maxSafeReferences: 50,
  });
  const safeEditPlan = await publicApiSingleton.generateSafeEditPlan({
    uri: editor.document.uri.toString(),
    line: editor.selection.active.line,
    character: editor.selection.active.character,
    maxSafeReferences: 50,
  });
  const workspaceManifest = await publicApiSingleton.getSemanticWorkspaceManifest({
    maxObjects: 200,
    maxSymbols: 400,
  });
  const serverStats = await publicApiSingleton.getServerStats();

  const generatedAt = new Date().toISOString();
  const focusLabel = safeEditPlan.targetSymbol?.name
    ?? currentObjectContext.objectInfo?.globalType
    ?? path.basename(editor.document.uri.fsPath || editor.document.uri.path, path.extname(editor.document.uri.fsPath || editor.document.uri.path));
  const destinationUri = resolveSemanticReproDestinationUri(workspaceFolder, generatedAt, focusLabel, options?.destinationUri);
  const { capturedFiles, missingFiles } = await collectSemanticReproFiles(
    editor,
    workspaceFolder,
    currentObjectContext,
    impactAnalysis,
    safeEditPlan
  );
  const editorDiagnostics = serializeEditorDiagnostics(vscode.languages.getDiagnostics(editor.document.uri));
  const bundle = buildSemanticReproPackBundle({
    workspaceRootPath: workspaceFolder.uri.fsPath,
    reproRootPath: destinationUri.fsPath,
    focusUri: editor.document.uri.toString(),
    ...(resolveWorkspaceRelativePath(workspaceFolder, editor.document.uri)
      ? { focusWorkspaceRelativePath: resolveWorkspaceRelativePath(workspaceFolder, editor.document.uri) }
      : {}),
    focusLine: editor.selection.active.line,
    focusCharacter: editor.selection.active.character,
    ...(safeEditPlan.targetSymbol?.name ? { focusSymbolName: safeEditPlan.targetSymbol.name } : {}),
    ...(currentObjectContext.objectInfo?.globalType ? { focusObjectName: currentObjectContext.objectInfo.globalType } : {}),
    ...(currentObjectContext.objectInfo?.sourceOrigin ? { focusSourceOrigin: currentObjectContext.objectInfo.sourceOrigin } : {}),
    currentObjectContext,
    impactAnalysis,
    safeEditPlan,
    workspaceManifest,
    serverStats,
    editorDiagnostics,
    capturedFiles,
    missingFiles,
    generatedAt,
  });

  await writeSemanticReproPackBundle(destinationUri, bundle.files);

  outputChannel?.show(true);
  outputChannel?.appendLine(`[ReproPack] Repro pack semántico exportado en ${destinationUri.fsPath}.`);
  for (const file of bundle.files) {
    outputChannel?.appendLine(`[ReproPack]   - ${bundle.reproWorkspaceRelativePath}/${file.relativePath}`);
  }

  void vscode.window.showInformationMessage(
    `Repro pack semántico exportado en ${bundle.reproWorkspaceRelativePath}.`
  );

  return {
    reproUri: destinationUri.toString(),
    manifestUri: joinUriPath(destinationUri, 'manifest.json').toString(),
    includedFiles: capturedFiles.length,
    missingFiles: missingFiles.length,
  };
}

async function showSettingsGovernance(): Promise<void> {
  const report = buildCurrentSettingsGovernanceReport();
  const rendered = renderSettingsGovernanceReport(report);

  outputChannel?.show(true);
  outputChannel?.appendLine(rendered);

  void vscode.window.showInformationMessage(
    `PowerSyntax: perfil ${report.selectedProfile} · ${report.conflicts.length} conflicto(s) de settings.`,
    'Abrir salida'
  ).then((selection) => {
    if (selection === 'Abrir salida') {
      outputChannel?.show(true);
    }
  });
}

async function applySettingsProfile(): Promise<void> {
  const profiles = getSettingsProfileDescriptors();
  const picked = await vscode.window.showQuickPick(
    profiles.map((profile) => ({
      label: profile.label,
      description: profile.id,
      detail: profile.description,
      profile,
    })),
    {
      title: 'Aplicar perfil de settings de PowerSyntax',
      placeHolder: 'Selecciona el perfil gobernado que quieres aplicar al workspace',
    }
  );

  if (!picked) {
    return;
  }

  const configuration = vscode.workspace.getConfiguration();
  await configuration.update('vscPowerSyntax.profile', picked.profile.id, vscode.ConfigurationTarget.Workspace);
  for (const [key, value] of Object.entries(picked.profile.managedSettings)) {
    await configuration.update(key, value, vscode.ConfigurationTarget.Workspace);
  }

  const report = buildCurrentSettingsGovernanceReport(picked.profile.id);
  outputChannel?.show(true);
  outputChannel?.appendLine(`[Settings] Perfil aplicado: ${picked.profile.id}`);
  outputChannel?.appendLine(renderSettingsGovernanceReport(report));

  void vscode.window.showInformationMessage(
    `PowerSyntax: perfil ${picked.profile.id} aplicado al workspace.`
  );
}

function buildCurrentSettingsGovernanceReport(selectedProfileOverride?: PowerSyntaxProfileId): PowerSyntaxSettingsGovernanceReport {
  const configuration = vscode.workspace.getConfiguration();
  const currentValues = Object.fromEntries(
    getGovernedSettingKeys().map((key) => [key, configuration.get(key)])
  );
  const selectedProfile = selectedProfileOverride
    ?? vscode.workspace.getConfiguration('vscPowerSyntax').get<string>('profile');
  return buildSettingsGovernanceReport(currentValues, selectedProfile);
}

function renderSettingsGovernanceReport(report: PowerSyntaxSettingsGovernanceReport): string {
  const lines = [
    `[Settings] Perfil activo: ${report.selectedProfile}`,
    `[Settings] Perfiles disponibles: ${report.availableProfiles.map((profile) => profile.id).join(', ')}`,
    '[Settings] Claves gobernadas:',
    ...report.managedSettings.map((entry) => `  - ${entry.key}: actual=${JSON.stringify(entry.currentValue)} esperado=${JSON.stringify(entry.expectedValue)} match=${entry.matchesProfile}`),
  ];

  if (report.conflicts.length === 0) {
    lines.push('[Settings] Sin conflictos activos.');
  } else {
    lines.push('[Settings] Conflictos:');
    for (const conflict of report.conflicts) {
      lines.push(`  - [${conflict.severity}] ${conflict.key}: ${conflict.message}`);
    }
  }

  return lines.join('\n');
}

function getStoredPbAutoBuildProfile(): PbAutoBuildBuildFileOption | undefined {
  return extensionContextRef?.workspaceState.get<PbAutoBuildBuildFileOption>(LAST_PBAUTOBUILD_PROFILE_KEY);
}

async function persistPbAutoBuildProfile(profile?: PbAutoBuildBuildFileOption): Promise<void> {
  if (extensionContextRef) {
    await extensionContextRef.workspaceState.update(LAST_PBAUTOBUILD_PROFILE_KEY, profile);
  }

  lastStatusStats = enrichRuntimeStatusStats({
    ...(lastStatusStats ?? {}),
    ...(profile ? { buildProfile: profile } : { buildProfile: undefined })
  });
}

async function fetchPbAutoBuildBuildFileOptions(): Promise<PbAutoBuildBuildFileOption[]> {
  const options = await executeServerCommand<PbAutoBuildBuildFileOption[]>('powerbuilder.listPbAutoBuildBuildFiles');
  return Array.isArray(options) ? options : [];
}

async function writePbAutoBuildCiHelperBundle(
  helperRootUri: vscode.Uri,
  files: readonly { relativePath: string; content: string }[]
): Promise<void> {
  await vscode.workspace.fs.createDirectory(helperRootUri);

  for (const file of files) {
    const fileUri = joinUriPath(helperRootUri, file.relativePath);
    const parentRelativePath = path.posix.dirname(file.relativePath);
    if (parentRelativePath && parentRelativePath !== '.') {
      await vscode.workspace.fs.createDirectory(joinUriPath(helperRootUri, parentRelativePath));
    }
    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(file.content, 'utf8'));
  }
}

async function writeSemanticReproPackBundle(
  reproRootUri: vscode.Uri,
  files: readonly { relativePath: string; content: string }[]
): Promise<void> {
  await vscode.workspace.fs.createDirectory(reproRootUri);

  for (const file of files) {
    const fileUri = joinUriPath(reproRootUri, file.relativePath);
    const parentRelativePath = path.posix.dirname(file.relativePath);
    if (parentRelativePath && parentRelativePath !== '.') {
      await vscode.workspace.fs.createDirectory(joinUriPath(reproRootUri, parentRelativePath));
    }
    await vscode.workspace.fs.writeFile(fileUri, Buffer.from(file.content, 'utf8'));
  }
}

function resolveSemanticReproDestinationUri(
  workspaceFolder: vscode.WorkspaceFolder,
  generatedAt: string,
  focusLabel: string,
  overrideDestinationUri?: string
): vscode.Uri {
  if (overrideDestinationUri) {
    return vscode.Uri.parse(overrideDestinationUri);
  }

  const timestampSegment = generatedAt.slice(0, 19).replace(/[:T]/g, '-');
  const directoryName = `${suggestSemanticReproDirectoryName(focusLabel)}-${timestampSegment}`;
  return vscode.Uri.joinPath(workspaceFolder.uri, 'tools', 'semantic-repros', directoryName);
}

async function collectSemanticReproFiles(
  editor: vscode.TextEditor,
  workspaceFolder: vscode.WorkspaceFolder,
  currentObjectContext: ApiCurrentObjectContext,
  impactAnalysis: ApiImpactAnalysis,
  safeEditPlan: ApiSafeEditPlan
): Promise<{ capturedFiles: SemanticReproCapturedFile[]; missingFiles: SemanticReproMissingFile[] }> {
  const candidates = new Map<string, { uri: vscode.Uri; workspaceRelativePath?: string; sourceOrigin?: string; reasons: Set<string> }>();

  addSemanticReproCandidate(candidates, workspaceFolder, editor.document.uri, 'active-document', currentObjectContext.objectInfo?.sourceOrigin);
  for (const file of safeEditPlan.files) {
    addSemanticReproCandidate(candidates, workspaceFolder, vscode.Uri.parse(file.uri), `plan:${file.reason}`, file.sourceOrigin);
    addSemanticReproCandidate(candidates, workspaceFolder, vscode.Uri.parse(file.uri), `plan-risk:${file.risk}`, file.sourceOrigin);
  }
  for (const file of currentObjectContext.relatedFiles ?? []) {
    addSemanticReproCandidate(candidates, workspaceFolder, vscode.Uri.parse(file.uri), `context:${file.role}`);
  }
  for (const file of impactAnalysis.probableImpactFiles) {
    addSemanticReproCandidate(candidates, workspaceFolder, vscode.Uri.parse(file.uri), `impact:${file.role}`);
  }

  const capturedFiles: SemanticReproCapturedFile[] = [];
  const missingFiles: SemanticReproMissingFile[] = [];
  const orderedCandidates = [...candidates.values()].slice(0, MAX_SEMANTIC_REPRO_FILES);

  for (const candidate of orderedCandidates) {
    try {
      const content = candidate.uri.toString() === editor.document.uri.toString()
        ? editor.document.getText()
        : (await vscode.workspace.openTextDocument(candidate.uri)).getText();
      capturedFiles.push({
        uri: candidate.uri.toString(),
        ...(candidate.workspaceRelativePath ? { workspaceRelativePath: candidate.workspaceRelativePath } : {}),
        ...(candidate.sourceOrigin ? { sourceOrigin: candidate.sourceOrigin } : {}),
        reasons: [...candidate.reasons],
        content,
      });
    } catch (error) {
      missingFiles.push({
        uri: candidate.uri.toString(),
        ...(candidate.workspaceRelativePath ? { workspaceRelativePath: candidate.workspaceRelativePath } : {}),
        reasons: [...candidate.reasons],
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { capturedFiles, missingFiles };
}

function addSemanticReproCandidate(
  candidates: Map<string, { uri: vscode.Uri; workspaceRelativePath?: string; sourceOrigin?: string; reasons: Set<string> }>,
  workspaceFolder: vscode.WorkspaceFolder,
  uri: vscode.Uri,
  reason: string,
  sourceOrigin?: string
): void {
  const key = uri.toString();
  const existing = candidates.get(key);
  if (existing) {
    existing.reasons.add(reason);
    if (!existing.sourceOrigin && sourceOrigin) {
      existing.sourceOrigin = sourceOrigin;
    }
    return;
  }

  candidates.set(key, {
    uri,
    ...(resolveWorkspaceRelativePath(workspaceFolder, uri)
      ? { workspaceRelativePath: resolveWorkspaceRelativePath(workspaceFolder, uri) }
      : {}),
    ...(sourceOrigin ? { sourceOrigin } : {}),
    reasons: new Set([reason]),
  });
}

function resolveWorkspaceRelativePath(
  workspaceFolder: vscode.WorkspaceFolder,
  uri: vscode.Uri
): string | undefined {
  if (uri.scheme !== 'file') {
    return undefined;
  }

  const relativePath = path.relative(workspaceFolder.uri.fsPath, uri.fsPath);
  if (!relativePath) {
    return path.basename(uri.fsPath);
  }
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return undefined;
  }
  return relativePath.replace(/\\/g, '/');
}

function serializeEditorDiagnostics(diagnostics: readonly vscode.Diagnostic[]): SemanticReproEditorDiagnostic[] {
  return diagnostics.map((diagnostic) => ({
    message: diagnostic.message,
    severity: vscode.DiagnosticSeverity[diagnostic.severity] ?? 'Unknown',
    ...(diagnostic.source ? { source: diagnostic.source } : {}),
    ...(typeof diagnostic.code === 'string' || typeof diagnostic.code === 'number'
      ? { code: String(diagnostic.code) }
      : {}),
    startLine: diagnostic.range.start.line,
    startCharacter: diagnostic.range.start.character,
    endLine: diagnostic.range.end.line,
    endCharacter: diagnostic.range.end.character,
  }));
}

async function pickPbAutoBuildProfile(): Promise<PbAutoBuildBuildFileOption | undefined> {
  const options = await fetchPbAutoBuildBuildFileOptions();
  if (options.length === 0) {
    void vscode.window.showWarningMessage('No hay build files PBAutoBuild utilizables para elegir.');
    return undefined;
  }

  const picked = await vscode.window.showQuickPick(
    options.map((option) => ({
      label: option.label,
      description: option.detail,
      detail: option.representedProjectUri ? basenameFromPathOrUri(option.representedProjectUri) : option.uri,
      option,
    })),
    {
      title: 'Elegir build file PBAutoBuild',
      placeHolder: 'Selecciona un build file utilizable para ejecutar y recordar como último build'
    }
  );

  return picked?.option;
}

async function resolveLastPbAutoBuildProfile(): Promise<PbAutoBuildBuildFileOption | undefined> {
  const stored = getStoredPbAutoBuildProfile();
  if (!stored) {
    return pickPbAutoBuildProfile();
  }

  const options = await fetchPbAutoBuildBuildFileOptions();
  const fresh = options.find((option) => option.uri === stored.uri);
  if (fresh) {
    return fresh;
  }

  void vscode.window.showWarningMessage('El último build recordado ya no está utilizable. Elige uno nuevo.');
  return pickPbAutoBuildProfile();
}

function toPbAutoBuildProfile(
  buildFileUri: string | undefined,
  fallback?: PbAutoBuildBuildFileOption
): PbAutoBuildBuildFileOption | undefined {
  if (buildFileUri) {
    return {
      uri: buildFileUri,
      label: fallback?.uri === buildFileUri ? fallback.label : basenameFromPathOrUri(buildFileUri),
      ...(fallback?.detail ? { detail: fallback.detail } : {}),
      ...(fallback?.representedProjectUri ? { representedProjectUri: fallback.representedProjectUri } : {})
    };
  }
  return fallback;
}

function basenameFromPathOrUri(value: string): string {
  const normalized = value.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
}

function resolveWorkspaceFolderForPbAutoBuildProfile(
  profile: PbAutoBuildBuildFileOption
): vscode.WorkspaceFolder | undefined {
  const activeEditorWorkspaceFolder = vscode.window.activeTextEditor?.document
    ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri)
    : undefined;

  return vscode.workspace.getWorkspaceFolder(vscode.Uri.parse(profile.uri))
    ?? activeEditorWorkspaceFolder
    ?? vscode.workspace.workspaceFolders?.[0];
}

function joinUriPath(baseUri: vscode.Uri, relativePath: string): vscode.Uri {
  const segments = relativePath.split('/').filter((segment) => segment.length > 0);
  return vscode.Uri.joinPath(baseUri, ...segments);
}

function parentUriOf(uri: vscode.Uri): vscode.Uri | undefined {
  const parentPath = path.posix.dirname(uri.path);
  if (!parentPath || parentPath === uri.path) {
    return undefined;
  }
  return uri.with({ path: parentPath });
}

function applyPbAutoBuildProblems(problems: readonly PbAutoBuildProblem[]): void {
  if (!pbAutoBuildDiagnostics) {
    return;
  }

  pbAutoBuildDiagnostics.clear();
  if (problems.length === 0) {
    return;
  }

  const grouped = new Map<string, vscode.Diagnostic[]>();
  for (const problem of problems) {
    const diagnostic = new vscode.Diagnostic(
      new vscode.Range(problem.line, problem.character, problem.line, problem.character),
      problem.message,
      problem.severity === 'warning' ? vscode.DiagnosticSeverity.Warning : vscode.DiagnosticSeverity.Error
    );
    diagnostic.source = problem.source;
    if (problem.code) {
      diagnostic.code = problem.code;
    }

    const bucket = grouped.get(problem.uri) ?? [];
    bucket.push(diagnostic);
    grouped.set(problem.uri, bucket);
  }

  for (const [uri, diagnostics] of grouped.entries()) {
    pbAutoBuildDiagnostics.set(vscode.Uri.parse(uri), diagnostics);
  }
}

async function openProjectHealthDashboard(): Promise<void> {
  const stats = await fetchRuntimeStatusStats();
  if (stats) {
    lastStatusStats = stats;
    if (statusBarItem) {
      renderProgress(statusBarItem, lastProgressNotification, stats);
    }
  }

  let manifest: ApiSemanticWorkspaceManifest | undefined;
  try {
    manifest = clonePlainData(await publicApiSingleton.getSemanticWorkspaceManifest({
      maxObjects: 200,
      maxSymbols: 400,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[Dashboard] No se pudo obtener el manifest semántico: ${message}`);
  }

  const document = await vscode.workspace.openTextDocument({
    language: 'markdown',
    content: buildProjectHealthDashboardMarkdown(lastProgressNotification, stats, manifest),
  });

  await vscode.window.showTextDocument(document, {
    preview: false,
    viewColumn: vscode.ViewColumn.Beside,
  });
}