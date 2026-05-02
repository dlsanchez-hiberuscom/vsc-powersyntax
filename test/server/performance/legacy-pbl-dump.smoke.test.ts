import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { validateStructure } from '../../../src/server/features/diagnostics';
import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { getLegacyPblDumpPath, hasLegacyPblDump } from '../helpers/publicCorpusPaths';
import { listFilesRecursive } from '../helpers/pfcPaths';

test('legacy PBL dump smoke: análisis, symbols y diagnostics sobre fuente real exportada', { skip: !hasLegacyPblDump() }, () => {
  const root = getLegacyPblDumpPath();
  const files = listFilesRecursive(root, ['.sru', '.srw', '.srm', '.sra', '.srs', '.srf', '.srd', '.srp', '.srj', '.srq']);

  assert.ok(files.length > 0, 'No se encontraron fuentes PowerBuilder en el corpus legacy PBL dump');

  const targetFile = files[0];
  const source = fs.readFileSync(targetFile, 'utf8');
  const document = TextDocument.create(`file://${targetFile}`, 'powerbuilder', 1, source);

  const analysis = analyzeDocument(document);
  const symbols = extractDocumentSymbols(document);
  const diagnostics = validateStructure(document);

  assert.ok(analysis.lines.length > 0, 'El análisis documental debería producir líneas');
  assert.ok(Array.isArray(symbols), 'Document Symbols debería responder sobre el corpus legacy');
  assert.ok(Array.isArray(diagnostics), 'Diagnostics estructurales debería responder sobre el corpus legacy');
});