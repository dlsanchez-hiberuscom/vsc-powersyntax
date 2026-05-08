import * as assert from 'assert/strict';
import * as childProcess from 'node:child_process';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const SCANNER = path.join(REPO_ROOT, 'tools', 'architecture-conformance-scanner.mjs');
const NEGATIVE_FIXTURE_ROOT = path.join(REPO_ROOT, 'test', 'fixtures', 'architecture-conformance', 'negative');
const FIXED_GENERATED_AT = '2026-05-08T00:00:00.000Z';

type ConformanceReport = {
  status: 'passed' | 'failed';
  generatedAt: string;
  roots: string[];
  summary: {
    filesScanned: number;
    violations: number;
    byKind: Record<string, number>;
  };
  violations: Array<{
    kind: string;
    ruleId: string;
    path: string;
    message: string;
    evidence?: unknown;
  }>;
};

suite('unit/architectureConformanceScanner', () => {
  test('emite JSON estable y sin violaciones sobre el repo actual', () => {
    const first = runScanner(['--report-only']);
    const second = runScanner(['--report-only']);

    assert.equal(first.status, 0, buildFailureMessage(first));
    assert.equal(second.status, 0, buildFailureMessage(second));
    assert.deepEqual(first.report, second.report);
    assert.equal(first.report.status, 'passed');
    assert.equal(first.report.generatedAt, FIXED_GENERATED_AT);
    assert.deepEqual(first.report.summary.byKind, {
      'cache-contract': 0,
      'full-scan': 0,
      'import-cycle': 0,
      'parallel-store': 0,
      'provider-bypass': 0,
      'published-state-write': 0,
    });
    assert.ok(first.report.summary.filesScanned >= 300, 'El scanner debe cubrir el árbol src completo.');
  });

  test('detecta fixtures negativos por categoría y conserva el modo report-only', () => {
    const result = runScanner(['--report-only', '--root', NEGATIVE_FIXTURE_ROOT]);

    assert.equal(result.status, 0, buildFailureMessage(result));
    assert.equal(result.report.status, 'failed');
    assert.ok(result.report.summary.byKind['provider-bypass'] >= 1);
    assert.ok(result.report.summary.byKind['full-scan'] >= 1);
    assert.ok(result.report.summary.byKind['import-cycle'] >= 1);
    assert.ok(result.report.summary.byKind['cache-contract'] >= 1);
    assert.ok(result.report.summary.byKind['parallel-store'] >= 1);
    assert.ok(result.report.summary.byKind['published-state-write'] >= 1);
  });

  test('sale con código 1 en fail mode cuando hay violaciones', () => {
    const result = runScanner(['--root', NEGATIVE_FIXTURE_ROOT]);

    assert.equal(result.status, 1, buildFailureMessage(result));
    assert.equal(result.report.status, 'failed');
    assert.ok(result.report.summary.violations >= 6);
  });
});

function runScanner(args: string[]): { status: number; report: ConformanceReport; stdout: string; stderr: string } {
  const result = childProcess.spawnSync(process.execPath, [
    SCANNER,
    '--json',
    '--generated-at',
    FIXED_GENERATED_AT,
    ...args,
  ], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
  });

  assert.equal(result.error, undefined, `El scanner lanzó un error de proceso: ${result.error?.message ?? 'desconocido'}`);
  assert.ok(result.stdout?.trim(), `El scanner no emitió JSON. STDERR:\n${result.stderr ?? ''}`);

  return {
    status: result.status ?? 1,
    report: JSON.parse(result.stdout) as ConformanceReport,
    stdout: result.stdout,
    stderr: result.stderr ?? '',
  };
}

function buildFailureMessage(result: { stdout: string; stderr: string }): string {
  return `STDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`;
}