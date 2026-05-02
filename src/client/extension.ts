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
  POWERBUILDER_PROJECT_MARKER_GLOB,
  POWERBUILDER_SOURCE_GLOB
} from '../shared/powerbuilderFiles';
import {
  type ApiCurrentObjectContext,
  type ApiCurrentObjectContextRequest,
  type ApiImpactAnalysis,
  type ApiImpactAnalysisRequest,
  type ApiSafeEditPlan,
  type ApiSafeEditPlanRequest,
  type ApiSemanticWorkspaceManifest,
  type ApiSemanticWorkspaceManifestRequest,
  PUBLIC_API_VERSION,
  isApiVersionCompatible,
  type ApiSymbol,
  type ApiQuerySymbolsRequest,
  type ApiServerStats,
  type VscPowerSyntaxApi,
} from '../shared/publicApi';
import {
  buildStatusHealthReport,
  buildStatusStatsReport,
  buildStatusTooltipMarkdown,
  formatStatusBarSummary,
  type RuntimeStatusStats,
} from './statusBarPresentation';

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;
let lastProgressNotification: ProgressNotification = { phase: 'idle' };
let lastStatusStats: RuntimeStatusStats | undefined;
let statusRefreshHandle: ReturnType<typeof setTimeout> | undefined;
let statusRefreshVersion = 0;

export async function activate(context: vscode.ExtensionContext): Promise<VscPowerSyntaxApi | undefined> {
  const activationStart = performance.now();
  const publicApi = createPublicApi();

  outputChannel = vscode.window.createOutputChannel('VSC PowerSyntax');
  context.subscriptions.push(outputChannel);

  outputChannel.appendLine('[VSC PowerSyntax] Activando extensión...');

  const serverModule = context.asAbsolutePath(
    path.join('out', 'server', 'server.js')
  );

  if (!fs.existsSync(serverModule)) {
    const message =
      `No se ha encontrado el servidor LSP en: ${serverModule}. ` +
      `Ejecuta la compilación del servidor antes de iniciar la extensión.`;

    outputChannel.appendLine(`[VSC PowerSyntax] ERROR: ${message}`);
    vscode.window.showErrorMessage(message);
    return undefined;
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
      { scheme: 'file', language: 'powerbuilder' },
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
    outputChannel,
    synchronize: {
      fileEvents: [
        vscode.workspace.createFileSystemWatcher(POWERBUILDER_PROJECT_MARKER_GLOB),
        vscode.workspace.createFileSystemWatcher(POWERBUILDER_SOURCE_GLOB)
      ]
    },
    initializationOptions: {
      cacheStorageUri: (context.storageUri ?? context.globalStorageUri)?.toString()
    }
  };

  client = new LanguageClient(
    SERVER_ID,
    SERVER_NAME,
    serverOptions,
    clientOptions
  );

  // ---- Barra de estado de progreso ----------------------------------------

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
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => {
      if (statusBarItem) {
        scheduleStatusRefresh(statusBarItem, 60);
      }
    })
  );

  // ---- Comandos -----------------------------------------------------------

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
    vscode.commands.registerCommand('vscPowerSyntax.openStatusMenu', async () => {
      const stats = await fetchRuntimeStatusStats();
      if (stats) {
        lastStatusStats = stats;
      }

      const selection = await vscode.window.showQuickPick([
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
          label: '$(tools) Ejecutar build de VS Code',
          description: 'Abre la tarea de build configurada en el workspace',
          command: 'workbench.action.tasks.build'
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

  // ---- Limpieza (Disposable) ----------------------------------------------

  context.subscriptions.push({
    dispose: () => {
      clearStatusRefreshHandle();
      void stopClient();
    }
  });

  // ---- Inicio --------------------------------------------------------------

  const clientStartTime = performance.now();

  try {
    outputChannel.appendLine(
      `[VSC PowerSyntax] Iniciando cliente LSP usando: ${serverModule}`
    );

    await client.start();

    // Suscribir notificaciones de progreso del servidor.
    if (statusBarItem) {
      const item = statusBarItem;
      client.onNotification(PROGRESS_NOTIFICATION, (p: ProgressNotification) => {
        lastProgressNotification = p;
        renderProgress(item, p, lastStatusStats);
        scheduleStatusRefresh(item);
      });

      scheduleStatusRefresh(item, 0);
    }

    const clientElapsed = performance.now() - clientStartTime;
    const totalElapsed = performance.now() - activationStart;

    outputChannel.appendLine(
      `[TIEMPO] Inicio del cliente LSP: ${clientElapsed.toFixed(2)}ms`
    );
    outputChannel.appendLine(
      `[TIEMPO] Activación total del cliente: ${totalElapsed.toFixed(2)}ms`
    );
    outputChannel.appendLine(
      '[VSC PowerSyntax] Cliente LSP activado correctamente.'
    );
    return publicApi;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    outputChannel.appendLine(
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
    await activate(context);

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

function createPublicApi(): VscPowerSyntaxApi {
  return Object.freeze({
    version: PUBLIC_API_VERSION,
    isVersionCompatible: isApiVersionCompatible,
    async getServerStats(): Promise<ApiServerStats> {
      const stats = await executeServerCommand<ApiServerStats>('powerbuilder.showStats');
      return clonePlainData(stats ?? {});
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
    async getSemanticWorkspaceManifest(request: ApiSemanticWorkspaceManifestRequest = {}): Promise<ApiSemanticWorkspaceManifest> {
      return executeServerCommand<ApiSemanticWorkspaceManifest>('powerbuilder.semanticWorkspaceManifest', [
        request.maxObjects,
        request.maxSymbols,
      ]);
    }
  });
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
  if (!client) {
    return lastStatusStats;
  }

  try {
    return clonePlainData(await executeServerCommand<RuntimeStatusStats>('powerbuilder.showStats'));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel?.appendLine(`[VSC PowerSyntax] No se pudieron actualizar stats de status bar: ${message}`);
    return lastStatusStats;
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

  outputChannel?.appendLine(`[Hierarchy] URI: ${inspection.uri ?? 'desconocida'}`);
  outputChannel?.appendLine(`- Tipo foco: ${inspection.focusType ?? 'desconocido'}`);
  outputChannel?.appendLine(`- Ancestro inmediato: ${inspection.immediateAncestor ?? 'ninguno'}`);
  outputChannel?.appendLine(`- Cadena de ancestros: ${inspection.ancestorChain?.join(' -> ') || 'sin cadena'}`);
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