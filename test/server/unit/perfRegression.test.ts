/**
 * Sprint 3 / Spec 131: regresión de rendimiento.
 *
 * Mide `analyzeDocument` sobre un archivo sintético de 1000 líneas y
 * exige que termine bajo un presupuesto holgado para CI compartido.
 */
import { ok } from 'assert';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { suite, test } from 'mocha';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';

const PERF_BUDGET_MS = Number.parseInt(process.env.PB_PERF_BUDGET_MS ?? '500', 10);

function syntheticDoc(numLines: number): string {
  const out: string[] = [];
  out.push('forward');
  out.push('global type w_perf from window');
  out.push('end type');
  out.push('end forward');
  out.push('global type w_perf from window');
  out.push('end type');
  out.push('on w_perf.create');
  out.push('end on');
  out.push('public function integer f_loop()');
  for (let i = 0; i < numLines; i++) {
    out.push(`  ls_x = ${i} + ls_y_${i % 7}`);
  }
  out.push('  return 0');
  out.push('end function');
  return out.join('\n');
}

suite('Sprint 3 / perf regression', () => {
  test(`analyzeDocument 1000 líneas < ${PERF_BUDGET_MS}ms`, () => {
    const text = syntheticDoc(1000);
    const doc = TextDocument.create('file:///perf.pbl', 'powerbuilder', 1, text);
    const t0 = Date.now();
    const r = analyzeDocument(doc);
    const elapsed = Date.now() - t0;
    ok(r.lines.length >= 1000, 'líneas analizadas');
    ok(elapsed < PERF_BUDGET_MS, `analyzeDocument tardó ${elapsed}ms (budget ${PERF_BUDGET_MS}ms)`);
  });
});
