import { mkdirSync, writeFileSync } from 'node:fs';
import { appendFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const reportDir = path.join(repoRoot, 'artifacts', 'performance');
const reportPath = path.join(reportDir, 'performance-budget-gate.json');
const grepPattern = 'performance/ci-budget-gate|performance/knowledgeBase|performance/large-workspace-incremental';
const nodeCommand = process.execPath;
const tscEntry = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const vscodeTestEntry = path.join(repoRoot, 'node_modules', '@vscode', 'test-cli', 'out', 'bin.mjs');

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repoRoot,
      env: process.env,
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

function extractMetrics(output) {
  const metrics = [];
  const regex = /^\[perf-budget\] (?<name>[^ ]+) elapsedMs=(?<elapsed>[0-9.]+) budgetMs=(?<budget>[0-9.]+)$/gm;

  for (const match of output.matchAll(regex)) {
    metrics.push({
      name: match.groups?.name,
      elapsedMs: Number(match.groups?.elapsed ?? '0'),
      budgetMs: Number(match.groups?.budget ?? '0'),
      withinBudget: Number(match.groups?.elapsed ?? '0') <= Number(match.groups?.budget ?? '0'),
    });
  }

  return metrics;
}

function printSummary(metrics) {
  console.log('');
  console.log('[perf-gate] summary');
  for (const metric of metrics) {
    console.log(`[perf-gate] ${metric.name}: ${metric.elapsedMs.toFixed(2)}ms / ${metric.budgetMs.toFixed(2)}ms (${metric.withinBudget ? 'ok' : 'fail'})`);
  }
}

async function writeGithubSummary(metrics, status) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  const lines = [
    '## Performance Budget Gate',
    '',
    `Status: ${status}`,
    '',
    '| Metric | Elapsed (ms) | Budget (ms) | Status |',
    '| --- | ---: | ---: | --- |',
    ...metrics.map((metric) => `| ${metric.name} | ${metric.elapsedMs.toFixed(2)} | ${metric.budgetMs.toFixed(2)} | ${metric.withinBudget ? 'ok' : 'fail'} |`),
    '',
  ];

  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`, 'utf8');
}

console.log('[perf-gate] Building extension and tests');
const buildResult = await runCommand(nodeCommand, [tscEntry, '-b']);
if (buildResult.code !== 0) {
  process.exit(buildResult.code);
}

const testBuildResult = await runCommand(nodeCommand, [tscEntry, '-p', 'tsconfig.test.json']);
if (testBuildResult.code !== 0) {
  process.exit(testBuildResult.code);
}

console.log(`[perf-gate] Running performance suites filtered by ${grepPattern}`);
const result = await runCommand(nodeCommand, [vscodeTestEntry, '--label', 'performance', '--grep', grepPattern]);
const combinedOutput = `${result.stdout}\n${result.stderr}`;
const metrics = extractMetrics(combinedOutput);
const status = result.code === 0 && metrics.length > 0 && metrics.every((metric) => metric.withinBudget) ? 'passed' : 'failed';

mkdirSync(reportDir, { recursive: true });
writeFileSync(reportPath, JSON.stringify({
  status,
  grepPattern,
  exitCode: result.code,
  metrics,
  generatedAt: new Date().toISOString(),
}, null, 2));

printSummary(metrics);
await writeGithubSummary(metrics, status);

if (metrics.length === 0) {
  console.error('[perf-gate] No se recogieron métricas. El gate no es válido.');
  process.exit(1);
}

if (result.code !== 0 || status !== 'passed') {
  console.error('[perf-gate] Performance budget gate failed.');
  process.exit(1);
}

console.log(`[perf-gate] Report written to ${reportPath}`);