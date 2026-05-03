import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const reportDir = path.join(repoRoot, 'artifacts', 'performance');
const jsonReportPath = path.join(reportDir, 'session-stability-soak.json');
const markdownReportPath = path.join(reportDir, 'session-stability-soak.md');
const grepPattern = 'performance/session-stability-soak';
const nodeCommand = process.execPath;
const tscEntry = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const vscodeTestEntry = path.join(repoRoot, 'node_modules', '@vscode', 'test-cli', 'out', 'bin.mjs');

function runCommand(command, args, env = process.env) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      stdout += text;
      process.stdout.write(text);
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('error', (error) => {
      resolve({ code: 1, stdout, stderr: `${stderr}\n${error instanceof Error ? error.message : String(error)}` });
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

function extractSoakReport(output) {
  const matches = [...output.matchAll(/^\[soak-report\] (?<json>\{.*\})$/gm)];
  const last = matches.at(-1);
  if (!last?.groups?.json) {
    return null;
  }

  try {
    return JSON.parse(last.groups.json);
  } catch {
    return null;
  }
}

function buildMarkdown(report) {
  return [
    '# Session Stability Soak',
    '',
    `Status: ${report.status}`,
    '',
    '| Metric | Value |',
    '| --- | ---: |',
    `| Iterations | ${report.iterations} |`,
    `| Baseline files | ${report.baselineFiles} |`,
    `| Active window | ${report.activeWindow} |`,
    `| Diagnostics runs | ${report.diagnosticsRuns} |`,
    `| Hover runs | ${report.hoverRuns} |`,
    `| Completion runs | ${report.completionRuns} |`,
    `| Incremental bursts | ${report.incrementalBursts} |`,
    `| Massive bursts | ${report.massiveBursts} |`,
    `| Support bundles | ${report.supportBundlesBuilt} |`,
    `| Build snapshots | ${report.buildSnapshotsBuilt} |`,
    `| Resume checks | ${report.resumeChecks} |`,
    `| Flushes | ${report.flushes} |`,
    `| Readiness broken iterations | ${report.readinessBrokenIterations} |`,
    `| Baseline document cache size | ${report.baselineDocumentCacheSize} |`,
    `| Final document cache size | ${report.finalDocumentCacheSize} |`,
    `| Baseline knowledge documents | ${report.baselineKnowledgeDocuments} |`,
    `| Final knowledge documents | ${report.finalKnowledgeDocuments} |`,
    `| Max serving cache entries | ${report.maxServingCacheEntries} |`,
    `| Final serving cache entries | ${report.finalServingCacheEntries} |`,
    `| Last resume action | ${report.lastResumeAction} |`,
    `| Last support bundle health | ${report.lastSupportBundleHealth ?? 'unknown'} |`,
    `| Last build health state | ${report.lastBuildHealthState ?? 'unknown'} |`,
    '',
  ].join('\n');
}

console.log('[soak] Building extension and tests');
const buildResult = await runCommand(nodeCommand, [tscEntry, '-b']);
if (buildResult.code !== 0) {
  process.exit(buildResult.code);
}

const testBuildResult = await runCommand(nodeCommand, [tscEntry, '-p', 'tsconfig.test.json']);
if (testBuildResult.code !== 0) {
  process.exit(testBuildResult.code);
}

console.log(`[soak] Running soak suite filtered by ${grepPattern}`);
const result = await runCommand(
  nodeCommand,
  [vscodeTestEntry, '--label', 'performance', '--grep', grepPattern],
  {
    ...process.env,
    POWERSYNTAX_ENABLE_SOAK: '1',
    ...(process.env.POWERSYNTAX_SOAK_ITERATIONS ? { POWERSYNTAX_SOAK_ITERATIONS: process.env.POWERSYNTAX_SOAK_ITERATIONS } : {}),
  },
);

const combinedOutput = `${result.stdout}\n${result.stderr}`;
const report = extractSoakReport(combinedOutput);
const status = result.code === 0 && report?.status === 'passed' ? 'passed' : 'failed';

mkdirSync(reportDir, { recursive: true });
writeFileSync(jsonReportPath, JSON.stringify({
  status,
  grepPattern,
  exitCode: result.code,
  generatedAt: new Date().toISOString(),
  report,
}, null, 2));
writeFileSync(markdownReportPath, report ? `${buildMarkdown(report)}\n` : '# Session Stability Soak\n\nStatus: failed\n');

if (!report) {
  console.error('[soak] No se pudo extraer el reporte soak del output.');
  process.exit(1);
}

if (result.code !== 0 || status !== 'passed') {
  console.error('[soak] Session stability soak failed.');
  process.exit(1);
}

console.log(`[soak] Reports written to ${jsonReportPath} and ${markdownReportPath}`);