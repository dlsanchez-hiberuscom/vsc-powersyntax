import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
const vsixRelativePath = '.dist/vsc-powersyntax.vsix';
const vsixPath = path.join(repoRoot, vsixRelativePath);

const validations = [
  'npm test',
  'npm run test:architecture:rapid',
  'npm run test:docs:drift',
  'npm run test:performance:gate',
  'npm run verify:catalog-coverage',
  'npm run package:vsix',
  'npm run verify:vsix-contents',
  'npm run test:smoke:installed-vsix',
];

function readGitCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'unknown';
  }
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

try {
  ensure(existsSync(vsixPath), `No se ha encontrado el VSIX esperado en ${vsixRelativePath}.`);

  console.log('Release readiness summary');
  console.log(`version: ${packageJson.version}`);
  console.log(`commit: ${readGitCommit()}`);
  console.log(`vsix: ${vsixRelativePath}`);
  console.log('validations:');
  for (const validation of validations) {
    console.log(`- ${validation}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}