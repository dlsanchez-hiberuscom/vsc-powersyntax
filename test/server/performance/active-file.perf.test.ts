import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';

import { performance } from 'node:perf_hooks';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { provideHover } from '../../../src/server/features/hover';
import { validateStructure } from '../../../src/server/features/diagnostics';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { getPfcWorkspacePath, hasPfcWorkspace, listFilesRecursive } from '../helpers/pfcPaths';

const HOVER_BUDGET_MS = 50;
const DIAGNOSTICS_BUDGET_MS = 100;

function findFirstIdentifierPosition(source: string): { line: number; character: number } {
  const lines = source.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex] ?? '';
    const match = /[A-Za-z_][A-Za-z0-9_]*/.exec(line);
    if (match && typeof match.index === 'number') {
      return { line: lineIndex, character: match.index };
    }
  }

  return { line: 0, character: 0 };
}

test('PFC Workspace perf: primer hover y primeros diagnostics sobre archivo activo', { skip: !hasPfcWorkspace() }, () => {
  const root = getPfcWorkspacePath();
  const files = listFilesRecursive(root, ['.sru', '.srw', '.srm'])
    .sort((a, b) => a.localeCompare(b));

  assert.ok(files.length > 0, 'No se encontraron archivos PowerBuilder en PFC Workspace');

  const targetFile = files[0];
  const source = fs.readFileSync(targetFile, 'utf8');
  const document = TextDocument.create(`file://${targetFile}`, 'powerbuilder', 1, source);
  const hoverPosition = findFirstIdentifierPosition(source);

  const kb = new KnowledgeBase();
  const graph = new InheritanceGraph(kb);
  const systemCatalog = new SystemCatalog();

  const hoverStart = performance.now();
  const hover = provideHover(document, hoverPosition, kb, systemCatalog, graph);
  const hoverElapsed = performance.now() - hoverStart;

  const diagnosticsStart = performance.now();
  const diagnostics = validateStructure(document);
  const diagnosticsElapsed = performance.now() - diagnosticsStart;

  console.log(`[perf] active file hover: ${hoverElapsed.toFixed(2)} ms`);
  console.log(`[perf] active file diagnostics: ${diagnosticsElapsed.toFixed(2)} ms`);

  assert.ok(hover === null || typeof hover === 'object');
  assert.ok(Array.isArray(diagnostics));
  assert.ok(hoverElapsed < HOVER_BUDGET_MS, `Primer hover demasiado lento: ${hoverElapsed.toFixed(2)}ms`);
  assert.ok(diagnosticsElapsed < DIAGNOSTICS_BUDGET_MS, `Primer diagnostics demasiado lento: ${diagnosticsElapsed.toFixed(2)}ms`);
});