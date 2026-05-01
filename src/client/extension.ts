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
  PUBLIC_API_VERSION,
  isApiVersionCompatible,
  toApiSymbol,
  type ApiQuerySymbolsRequest,
  type ApiServerStats,
  type VscPowerSyntaxApi,
} from '../shared/publicApi';

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

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
  context.subscriptions.push(statusBarItem);
  applyProgressVisibility(statusBarItem);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('vscPowerSyntax.progress.show') && statusBarItem) {
        applyProgressVisibility(statusBarItem);
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

  // ---- Limpieza (Disposable) ----------------------------------------------

  context.subscriptions.push({
    dispose: () => {
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
        renderProgress(item, p);
      });
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
      const symbols = (await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
        'vscode.executeWorkspaceSymbolProvider',
        query
      )) ?? [];
      return symbols.slice(0, limit).map((symbol) => toApiSymbol({
        name: symbol.name,
        kind: vscode.SymbolKind[symbol.kind] ?? String(symbol.kind),
        uri: symbol.location.uri.toString(),
        line: symbol.location.range.start.line,
        character: symbol.location.range.start.character,
      }));
    }
  });
}

async function executeServerCommand<T>(command: string, args: unknown[] = []): Promise<T> {
  if (!client) {
    throw new Error('El cliente LSP no está disponible.');
  }

  const result = await client.sendRequest('workspace/executeCommand', {
    command,
    arguments: args,
  });
  return clonePlainData(result) as T;
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

function renderProgress(item: vscode.StatusBarItem, p: ProgressNotification): void {
  const show = vscode.workspace
    .getConfiguration('vscPowerSyntax')
    .get<boolean>('progress.show', true);

  if (!show) {
    item.hide();
    return;
  }

  switch (p.phase) {
    case 'discovering':
      item.text = '$(sync~spin) PB: descubriendo';
      item.tooltip = 'VSC PowerSyntax: descubriendo workspace';
      item.show();
      break;
    case 'indexing': {
      const cur = p.current ?? 0;
      const total = p.total ?? 0;
      const passLabel = p.pass === 'structural' ? 'estructural' : p.pass === 'enriched' ? 'semántico' : 'indexando';
      item.text = total > 0
        ? `$(sync~spin) PB: ${passLabel} ${cur}/${total}`
        : `$(sync~spin) PB: ${passLabel}`;
      item.tooltip = `VSC PowerSyntax: ${passLabel} archivos${p.budgetMs ? ` (budget ${p.budgetMs}ms)` : ''}`;
      item.show();
      break;
    }
    case 'partial':
      item.text = '$(warning) PB: parcial';
      item.tooltip = 'VSC PowerSyntax: indexación parcial (cancelada o reiniciada)';
      item.show();
      break;
    case 'degraded': {
      const skipped = p.skipped ?? 0;
      const failed = p.failed ?? 0;
      item.text = `$(warning) PB: degradado${p.total ? ` (${p.total})` : ''}`;
      item.tooltip = `VSC PowerSyntax: índice degradado${skipped || failed ? ` · omitidos ${skipped}, fallidos ${failed}` : ''}`;
      item.show();
      break;
    }
    case 'ready':
      item.text = `$(check) PB: listo${p.total ? ` (${p.total})` : ''}`;
      item.tooltip = 'VSC PowerSyntax: índice listo';
      item.show();
      break;
    case 'idle':
      item.hide();
      break;
  }
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