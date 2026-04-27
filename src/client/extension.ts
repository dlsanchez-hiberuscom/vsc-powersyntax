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

let client: LanguageClient | undefined;
let outputChannel: vscode.OutputChannel | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
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
      { scheme: 'file', language: LANGUAGE_ID },
      { scheme: 'untitled', language: LANGUAGE_ID }
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

  context.subscriptions.push({
    dispose: () => {
      void stopClient();
    }
  });

  try {
    outputChannel.appendLine(
      `[VSC PowerSyntax] Iniciando cliente LSP usando: ${serverModule}`
    );

    await client.start();

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

  if (outputChannel) {
    outputChannel.dispose();
    outputChannel = undefined;
  }
}