import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const reportDir = path.join(repoRoot, 'artifacts', 'performance');
const reportPath = path.join(reportDir, 'architecture-rapid-gate.json');
const nodeCommand = process.execPath;
const tscEntry = path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc');
const vscodeTestEntry = path.join(repoRoot, 'node_modules', '@vscode', 'test-cli', 'out', 'bin.mjs');

const corpora = {
  pfcWorkspace: path.join(repoRoot, 'fixtures-local', 'pfc', '2025-Workspace'),
  pfcSolution: path.join(repoRoot, 'fixtures-local', 'pfc', '2025-Solution'),
  orderEntry: path.join(repoRoot, 'fixtures-local', 'STD_FC_OrderEntry'),
};

const smokeGrep = 'smoke/pfc-workspace-extension|smoke/pfc-solution-extension';
const performanceGrep = [
  'performance/pfc-workspace',
  'performance/pfc-workspace-smoke',
  'performance/pfc-solution-smoke',
  'performance/orderentry',
  'performance/orderentry-smoke',
  'performance/orderentry-semantic',
].join('|');

function corpusStatus(rootPath) {
  return {
    path: rootPath,
    present: existsSync(rootPath),
  };
}

function summarizeOutput(output) {
  const passing = output.match(/(\d+) passing/g)?.at(-1);
  const pending = output.match(/(\d+) pending/g)?.at(-1);
  const failing = output.match(/(\d+) failing/g)?.at(-1);
  return {
    passing: passing ?? '0 passing',
    pending: pending ?? '0 pending',
    failing: failing ?? '0 failing',
  };
}

function writeReport(payload) {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(reportPath, JSON.stringify(payload, null, 2));
}

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
      resolve({
        code: 1,
        stdout,
        stderr: `${stderr}\n${error instanceof Error ? error.message : String(error)}`,
      });
    });

    child.on('close', (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

const availability = Object.fromEntries(
  Object.entries(corpora).map(([key, rootPath]) => [key, corpusStatus(rootPath)]),
);

console.log('[arch-gate] Corpus availability');
for (const [name, info] of Object.entries(availability)) {
  console.log(`[arch-gate] ${name}: ${info.present ? 'present' : 'missing'} (${info.path})`);
}

if (!Object.values(availability).some((info) => info.present)) {
  const report = {
    status: 'skipped',
    generatedAt: new Date().toISOString(),
    availability,
    reason: 'No hay corpus locales PFC/STD disponibles.',
    steps: [],
  };
  writeReport(report);
  console.log(`[arch-gate] No hay corpus locales; gate marcado como skipped. Report: ${reportPath}`);
  process.exit(0);
}

console.log('[arch-gate] Building extension and tests');
const buildResult = await runCommand(nodeCommand, [tscEntry, '-b']);
if (buildResult.code !== 0) {
  writeReport({
    status: 'failed',
    generatedAt: new Date().toISOString(),
    availability,
    failedStep: 'tsc -b',
  });
  process.exit(buildResult.code);
}

const testBuildResult = await runCommand(nodeCommand, [tscEntry, '-p', 'tsconfig.test.json']);
if (testBuildResult.code !== 0) {
  writeReport({
    status: 'failed',
    generatedAt: new Date().toISOString(),
    availability,
    failedStep: 'tsc -p tsconfig.test.json',
  });
  process.exit(testBuildResult.code);
}

const steps = [];

if (availability.pfcWorkspace.present || availability.pfcSolution.present) {
  console.log(`[arch-gate] Running smoke suites filtered by ${smokeGrep}`);
  const smokeResult = await runCommand(nodeCommand, [
    vscodeTestEntry,
    '--label',
    'smoke',
    '--grep',
    smokeGrep,
  ]);

  steps.push({
    name: 'pfc-extension-smoke',
    grep: smokeGrep,
    exitCode: smokeResult.code,
    summary: summarizeOutput(`${smokeResult.stdout}\n${smokeResult.stderr}`),
  });

  if (smokeResult.code !== 0) {
    writeReport({
      status: 'failed',
      generatedAt: new Date().toISOString(),
      availability,
      steps,
    });
    process.exit(smokeResult.code);
  }
} else {
  steps.push({
    name: 'pfc-extension-smoke',
    skipped: true,
    reason: 'PFC Workspace y PFC Solution no están disponibles localmente.',
  });
}

console.log(`[arch-gate] Running performance suites filtered by ${performanceGrep}`);
const performanceResult = await runCommand(nodeCommand, [
  vscodeTestEntry,
  '--label',
  'performance',
  '--grep',
  performanceGrep,
]);

steps.push({
  name: 'real-corpora-performance',
  grep: performanceGrep,
  exitCode: performanceResult.code,
  summary: summarizeOutput(`${performanceResult.stdout}\n${performanceResult.stderr}`),
});

const status = performanceResult.code !== 0
  ? 'failed'
  : Object.values(availability).every((info) => info.present)
    ? 'passed'
    : 'passed-with-skips';

writeReport({
  status,
  generatedAt: new Date().toISOString(),
  availability,
  steps,
});

if (performanceResult.code !== 0) {
  process.exit(performanceResult.code);
}

console.log(`[arch-gate] Architecture rapid gate ${status}. Report: ${reportPath}`);