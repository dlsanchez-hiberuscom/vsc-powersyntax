import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { provideHover } from '../../../src/server/features/hover';
import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { validateStructure } from '../../../src/server/features/diagnostics';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { getPfcWorkspacePath, hasPfcWorkspace, listFilesRecursive } from '../helpers/pfcPaths';

test('PFC Workspace smoke: hover, symbols y diagnostics sobre un archivo real', { skip: !hasPfcWorkspace() }, () => {
  const root = getPfcWorkspacePath();
  const files = listFilesRecursive(root, ['.sru', '.srw', '.srm', '.sra', '.srs', '.srf', '.srd', '.srp', '.srj', '.srq']);

  assert.ok(files.length > 0, 'No se encontraron archivos PowerBuilder en PFC Workspace');

  const targetFile = files[0];
  const source = fs.readFileSync(targetFile, 'utf8');
  const document = TextDocument.create(`file://${targetFile}`, 'powerbuilder', 1, source);

  const symbols = extractDocumentSymbols(document);
  const diagnostics = validateStructure(document);
  const hover = provideHover(document, { line: 0, character: 0 }, new KnowledgeBase(), new SystemCatalog());

  assert.ok(Array.isArray(symbols));
  assert.ok(Array.isArray(diagnostics));
  assert.ok(hover === null || typeof hover === 'object');
});
