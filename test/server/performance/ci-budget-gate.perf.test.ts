import * as assert from 'assert/strict';
import * as fs from 'node:fs';

import { performance } from 'perf_hooks';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { validateStructure } from '../../../src/server/features/diagnostics';
import { extractDocumentSymbols } from '../../../src/server/features/documentSymbols';
import { provideHover } from '../../../src/server/features/hover';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { getLegacyPblDumpPath, hasLegacyPblDump } from '../helpers/publicCorpusPaths';
import { listFilesRecursive } from '../helpers/pfcPaths';

const HOVER_BUDGET_MS = 50;
const DIAGNOSTICS_BUDGET_MS = 100;
const BATCH_ANALYSIS_BUDGET_MS = 2500;
const BATCH_SIZE = 20;

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

function logBudget(metric: string, elapsedMs: number, budgetMs: number): void {
  console.log(`[perf-budget] ${metric} elapsedMs=${elapsedMs.toFixed(2)} budgetMs=${budgetMs.toFixed(2)}`);
}

suite('performance/ci-budget-gate', () => {
  test('public legacy corpus stays within executable CI budgets', function () {
    if (!hasLegacyPblDump()) {
      assert.fail('El corpus público legacy-pbl-dump debe estar disponible para el gate de CI.');
    }

    const root = getLegacyPblDumpPath();
    const files = listFilesRecursive(root, ['.sru', '.srw', '.srm', '.sra', '.srs', '.srf', '.srd', '.srp'])
      .sort((left, right) => left.localeCompare(right));

    assert.ok(files.length >= BATCH_SIZE, `Se esperaban al menos ${BATCH_SIZE} archivos PowerBuilder en el corpus público.`);

    const targetFile = files[0];
    const targetSource = fs.readFileSync(targetFile, 'utf8');
    const targetDocument = TextDocument.create(`file://${targetFile}`, 'powerbuilder', 1, targetSource);
    const hoverPosition = findFirstIdentifierPosition(targetSource);

    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    const systemCatalog = new SystemCatalog();

    const hoverStart = performance.now();
    const hover = provideHover(targetDocument, hoverPosition, kb, systemCatalog, graph);
    const hoverElapsedMs = performance.now() - hoverStart;

    const diagnosticsStart = performance.now();
    const diagnostics = validateStructure(targetDocument);
    const diagnosticsElapsedMs = performance.now() - diagnosticsStart;

    const batchFiles = files.slice(0, BATCH_SIZE);
    const batchStart = performance.now();
    for (const file of batchFiles) {
      const source = fs.readFileSync(file, 'utf8');
      const document = TextDocument.create(`file://${file}`, 'powerbuilder', 1, source);
      analyzeDocument(document);
      extractDocumentSymbols(document);
      validateStructure(document);
    }
    const batchElapsedMs = performance.now() - batchStart;

    logBudget('legacy-public-active-hover', hoverElapsedMs, HOVER_BUDGET_MS);
    logBudget('legacy-public-active-diagnostics', diagnosticsElapsedMs, DIAGNOSTICS_BUDGET_MS);
    logBudget('legacy-public-batch-analysis', batchElapsedMs, BATCH_ANALYSIS_BUDGET_MS);

    assert.ok(hover === null || typeof hover === 'object');
    assert.ok(Array.isArray(diagnostics));
    assert.ok(hoverElapsedMs < HOVER_BUDGET_MS, `Hover público demasiado lento: ${hoverElapsedMs.toFixed(2)}ms`);
    assert.ok(diagnosticsElapsedMs < DIAGNOSTICS_BUDGET_MS, `Diagnostics públicos demasiado lentos: ${diagnosticsElapsedMs.toFixed(2)}ms`);
    assert.ok(batchElapsedMs < BATCH_ANALYSIS_BUDGET_MS, `Batch público demasiado lento: ${batchElapsedMs.toFixed(2)}ms`);
  });
});