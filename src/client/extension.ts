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

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let statusBarItem: vscode.StatusBarItem | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const activationStart = performance.now();

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
    return;
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
      fileEvents: vscode.workspace.createFileSystemWatcher(
        '**/*.{pbw,pbt,pbproj,pbsln}'
      )
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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    outputChannel.appendLine(
      `[VSC PowerSyntax] ERROR al iniciar el cliente LSP: ${message}`
    );

    vscode.window.showErrorMessage(
      `No se pudo iniciar VSC PowerSyntax: ${message}`
    );

    await stopClient();
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
      item.text = total > 0
        ? `$(sync~spin) PB: indexando ${cur}/${total}`
        : '$(sync~spin) PB: indexando';
      item.tooltip = 'VSC PowerSyntax: indexando archivos';
      item.show();
      break;
    }
    case 'partial':
      item.text = '$(warning) PB: parcial';
      item.tooltip = 'VSC PowerSyntax: indexación parcial (cancelada o reiniciada)';
      item.show();
      break;
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