import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';

import { performance } from 'node:perf_hooks';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { getPfcWorkspacePath, hasPfcWorkspace, listFilesRecursive } from '../helpers/pfcPaths';

test('PFC Workspace perf: análisis y documentSymbols sobre muestra de archivos', { skip: !hasPfcWorkspace() }, () => {
  const root = getPfcWorkspacePath();
  const files = listFilesRecursive(root, ['.sru', '.srw', '.srm']).slice(0, 25);

  assert.ok(files.length > 0, 'No hay archivos suficientes para prueba de rendimiento');

  const start = performance.now();

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const document = TextDocument.create(`file://${file}`, 'powerbuilder', 1, source);
    analyzeDocument(document);
    extractDocumentSymbols(document);
  }

  const elapsedMs = performance.now() - start;

  assert.ok(elapsedMs >= 0);
  console.log(`[perf] PFC Workspace: ${files.length} archivos en ${elapsedMs.toFixed(2)} ms`);
});
