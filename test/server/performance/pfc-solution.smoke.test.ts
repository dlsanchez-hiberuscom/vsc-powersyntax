import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { getPfcSolutionPath, hasPfcSolution, listFilesRecursive } from '../helpers/pfcPaths';

test('PFC Solution smoke: documentSymbols sobre un archivo real', { skip: !hasPfcSolution() }, () => {
  const root = getPfcSolutionPath();
  const files = listFilesRecursive(root, ['.sru', '.srw', '.srm', '.sra', '.srs', '.srf', '.srd', '.srp', '.srj', '.srq']);

  assert.ok(files.length > 0, 'No se encontraron archivos PowerBuilder en PFC Solution');

  const targetFile = files[0];
  const source = fs.readFileSync(targetFile, 'utf8');
  const document = TextDocument.create(`file://${targetFile}`, 'powerbuilder', 1, source);
  const symbols = extractDocumentSymbols(document);

  assert.ok(Array.isArray(symbols));
});
