import assert from 'node:assert/strict';
import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs';

import {
  getPfcSolutionPath,
  hasPfcSolution,
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

  assert.ok(files.length > 0, 'No se encontraron archivos PowerBuilder en PFC Solution');

  // Preferimos .sru / .srw / .srm como targets iniciales “más útiles”
  const preferred =
    files.find(file => file.endsWith('.sru')) ??
    files.find(file => file.endsWith('.srw')) ??
    files.find(file => file.endsWith('.srm')) ??
    files[0];

  return preferred;
}

function pickSecondTargetFile(root: string, first: string): string | undefined {
  const files = listFilesRecursive(root, PB_EXTENSIONS)
    .filter(file => file !== first)
    .sort((a, b) => a.localeCompare(b));

  return files[0];
}

suite('smoke/pfc-solution-extension', () => {
  test('activa la extensión, arranca el cliente y responde sobre archivos reales de PFC Solution', async function () {
    this.timeout(60000);

    if (!hasPfcSolution()) {
      this.skip();
    }

    const root = getPfcSolutionPath();
    const pbsln = path.join(root, 'PFC.pbsln');

    if (!fs.existsSync(root) || !fs.existsSync(pbsln)) {
      this.skip();
    }

    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `La extensión ${EXTENSION_ID} debería estar presente`);

    // Activación explícita
    const activationStart = Date.now();
    await ext!.activate();
    const activationElapsed = Date.now() - activationStart;

    assert.ok(ext!.isActive, 'La extensión debería estar activa');
    console.log(`[smoke] activación extensión: ${activationElapsed} ms`);

    // Abrimos un archivo real del corpus
    const firstTarget = pickTargetFile(root);
    const firstDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(firstTarget));
    await vscode.window.showTextDocument(firstDoc, { preview: false });

    assert.ok(
      firstDoc.languageId.startsWith('powerbuilder'),
      `El archivo debería abrirse como powerbuilder: ${firstTarget} (obtenido: ${firstDoc.languageId})`
    );

    // Esperamos una respuesta real del servidor: Document Symbols
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

    assert.ok(Array.isArray(firstSymbols), 'Document Symbols debería responder sobre el primer archivo');
    console.log(`[smoke] primer archivo listo: ${firstTarget}`);
    console.log(`[smoke] symbols primer archivo: ${firstSymbols.length}`);

    // Abrimos un segundo archivo para forzar prioridad del archivo activo
    const secondTarget = pickSecondTargetFile(root, firstTarget);
    assert.ok(secondTarget, 'Debería existir un segundo archivo PowerBuilder para validar prioridad');

    const secondDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(secondTarget!));
    await vscode.window.showTextDocument(secondDoc, { preview: false });

    assert.ok(
      secondDoc.languageId.startsWith('powerbuilder'),
      `El segundo archivo debería abrirse como powerbuilder: ${secondTarget} (obtenido: ${secondDoc.languageId})`
    );

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

    assert.ok(Array.isArray(secondSymbols), 'Document Symbols debería responder sobre el segundo archivo');
    console.log(`[smoke] segundo archivo listo: ${secondTarget}`);
    console.log(`[smoke] symbols segundo archivo: ${secondSymbols.length}`);

    // Comprobar que el servidor indexa y el provider de workspace symbols
    // descubre símbolos diversos dentro de la solución PFC.
    const workspaceSymbols = await waitFor(
      async () =>
        (await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
          'vscode.executeWorkspaceSymbolProvider',
          ''
        )) ?? [],
      value => Array.isArray(value) && value.length > 0,
      20000,
      250
    );

    const pfcWorkspaceSymbols = workspaceSymbols.filter(s => {
      const loc: any = (s as any).location;
      const uriPath = loc && loc.uri ? loc.uri.fsPath || loc.uri : undefined;
      return typeof uriPath === 'string' && uriPath.startsWith(root);
    });

    assert.ok(
      pfcWorkspaceSymbols.length > 0,
      'No se encontraron workspace symbols dentro de PFC Solution'
    );

    const kinds = new Set<number>();
    for (const s of pfcWorkspaceSymbols) {
      kinds.add((s as any).kind as number);
    }

    assert.ok(
      kinds.size >= 2,
      `Se esperaban símbolos de distintas clases; encontrados kinds: ${Array.from(kinds).join(',')}`
    );

    console.log(`[smoke] workspace symbols PFC Solution: ${pfcWorkspaceSymbols.length}`);
  });
});