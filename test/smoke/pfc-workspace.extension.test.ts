import assert from 'node:assert/strict';
import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs';

import {
  getPfcWorkspacePath,
  hasPfcWorkspace,
  listFilesRecursive,
} from '../server/helpers/pfcPaths';

const EXTENSION_ID = 'lopez.vsc-powersyntax';

const PB_EXTENSIONS = [
  '.sru',
  '.srw',
  '.srm',
  '.sra',
  '.srs',
  '.srf',
  '.srd',
  '.srp',
  '.srj',
  '.srq',
];

async function waitFor<T>(
  producer: () => Promise<T>,
  predicate: (value: T) => boolean,
  timeoutMs = 20000,
  intervalMs = 250
): Promise<T> {
  const start = Date.now();
  let lastValue: T;

  while (Date.now() - start < timeoutMs) {
    lastValue = await producer();
    if (predicate(lastValue)) {
      return lastValue;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timeout esperando condición (${timeoutMs} ms)`);
}

function pickTargetFile(root: string): string {
  const files = listFilesRecursive(root, PB_EXTENSIONS)
    .filter(file => !file.includes(`${path.sep}.git${path.sep}`))
    .sort((a, b) => a.localeCompare(b));

  assert.ok(files.length > 0, 'No se encontraron archivos PowerBuilder en PFC Workspace');

  return files.find(file => file.endsWith('.sru'))
    ?? files.find(file => file.endsWith('.srw'))
    ?? files.find(file => file.endsWith('.srm'))
    ?? files[0];
}

function pickSecondTargetFile(root: string, first: string): string | undefined {
  const files = listFilesRecursive(root, PB_EXTENSIONS)
    .filter(file => file !== first)
    .sort((a, b) => a.localeCompare(b));

  return files[0];
}

suite('smoke/pfc-workspace-extension', () => {
  test('activa la extensión, arranca el cliente y responde sobre archivos reales de PFC Workspace', async function () {
    this.timeout(120000);

    if (!hasPfcWorkspace()) {
      this.skip();
    }

    const root = getPfcWorkspacePath();
    const pbw = path.join(root, 'PFC.pbw');

    if (!fs.existsSync(root) || !fs.existsSync(pbw)) {
      this.skip();
    }

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `La extensión ${EXTENSION_ID} debería estar presente`);

    const activationStart = Date.now();
    await ext!.activate();
    const activationElapsed = Date.now() - activationStart;

    assert.ok(ext!.isActive, 'La extensión debería estar activa');
    console.log(`[smoke] activación extensión workspace: ${activationElapsed} ms`);

    const firstTarget = pickTargetFile(root);
    const firstDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(firstTarget));
    await vscode.window.showTextDocument(firstDoc, { preview: false });

    assert.ok(
      firstDoc.languageId.startsWith('powerbuilder'),
      `El archivo debería abrirse como powerbuilder: ${firstTarget} (obtenido: ${firstDoc.languageId})`
    );

    const firstSymbols = await waitFor(
      async () =>
        (await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
          'vscode.executeDocumentSymbolProvider',
          firstDoc.uri
        )) ?? [],
      value => Array.isArray(value),
      20000,
      250
    );

    assert.ok(Array.isArray(firstSymbols), 'Document Symbols debería responder sobre el primer archivo del workspace');

    const secondTarget = pickSecondTargetFile(root, firstTarget);
    assert.ok(secondTarget, 'Debería existir un segundo archivo PowerBuilder en PFC Workspace');

    const secondDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(secondTarget!));
    await vscode.window.showTextDocument(secondDoc, { preview: false });

    const secondSymbols = await waitFor(
      async () =>
        (await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
          'vscode.executeDocumentSymbolProvider',
          secondDoc.uri
        )) ?? [],
      value => Array.isArray(value),
      20000,
      250
    );

    assert.ok(Array.isArray(secondSymbols), 'Document Symbols debería responder sobre el segundo archivo del workspace');
  });
});