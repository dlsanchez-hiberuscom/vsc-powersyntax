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

const PB_CLASS_EXTENSIONS = [
  '.sru',
  '.srw',
  '.srm',
  '.sra',
  '.srs',
  '.srf',
];

const PREFERRED_REPRO_CLASSES = [
  'pfc_n_cst_dwsrv_dropdownsearch.sru',
  'pfc_n_cst_dwsrv_find.sru',
  'pfc_n_cst_filterattrib.sru',
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

function pickDeterministicSampleClassFiles(root: string, count: number): string[] {
  const files = listFilesRecursive(root, PB_CLASS_EXTENSIONS)
    .filter(file => !file.includes(`${path.sep}.git${path.sep}`))
    .sort((a, b) => a.localeCompare(b));

  assert.ok(files.length > 0, 'No se encontraron clases PowerBuilder en PFC Solution');

  const selected: string[] = [];
  const remaining = [...files];

  for (const fileName of PREFERRED_REPRO_CLASSES) {
    const index = remaining.findIndex(file => path.basename(file).toLowerCase() === fileName);
    if (index >= 0) {
      selected.push(remaining.splice(index, 1)[0]);
    }
  }

  let seed = 0x9e3779b9;
  const targetCount = Math.min(count, files.length);
  while (remaining.length > 0 && selected.length < targetCount) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const index = seed % remaining.length;
    selected.push(remaining.splice(index, 1)[0]);
  }

  return selected;
}

suite('smoke/pfc-solution-extension', () => {
  test('activa la extensión, arranca el cliente y responde sobre archivos reales de PFC Solution', async function () {
    this.timeout(120000);

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
  });

  test('mantiene el servidor vivo al abrir una muestra determinista de clases PFC y pedir symbols', async function () {
    this.timeout(120000);

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
    await ext!.activate();

    const sampleTargets = pickDeterministicSampleClassFiles(root, 6);
    assert.ok(sampleTargets.length >= 3, 'La muestra debería incluir varias clases reales de PFC Solution');

    for (const [index, target] of sampleTargets.entries()) {
      const document = await vscode.workspace.openTextDocument(vscode.Uri.file(target));
      await vscode.window.showTextDocument(document, { preview: false });

      assert.ok(
        document.languageId.startsWith('powerbuilder'),
        `El archivo debería abrirse como powerbuilder: ${target} (obtenido: ${document.languageId})`
      );

      const symbols = await waitFor(
        async () =>
          (await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
            'vscode.executeDocumentSymbolProvider',
            document.uri
          )) ?? [],
        value => Array.isArray(value),
        20000,
        250
      );

      assert.ok(Array.isArray(symbols), `Document Symbols debería responder sobre la clase ${target}`);
      console.log(`[smoke] lote PFC ${index + 1}/${sampleTargets.length}: ${path.basename(target)} -> ${symbols.length} symbols`);
    }

    const finalTarget = sampleTargets[sampleTargets.length - 1];
    const finalDocument = await vscode.workspace.openTextDocument(vscode.Uri.file(finalTarget));
    const finalSymbols = await waitFor(
      async () =>
        (await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
          'vscode.executeDocumentSymbolProvider',
          finalDocument.uri
        )) ?? [],
      value => Array.isArray(value),
      20000,
      250
    );

    assert.ok(Array.isArray(finalSymbols), 'Document Symbols debería seguir respondiendo tras abrir el lote completo');
  });
});