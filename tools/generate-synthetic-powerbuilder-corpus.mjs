import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const result = {
    mode: 'smoke',
    output: path.join(repoRoot, 'artifacts', 'synthetic-corpus', 'smoke'),
    revision: 0,
  };

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === '--mode' && argv[index + 1]) {
      result.mode = argv[++index];
      result.output = path.join(repoRoot, 'artifacts', 'synthetic-corpus', result.mode);
      continue;
    }
    if (token === '--output' && argv[index + 1]) {
      result.output = path.resolve(repoRoot, argv[++index]);
      continue;
    }
    if (token === '--revision' && argv[index + 1]) {
      result.revision = Number(argv[++index] ?? '0');
    }
  }

  return result;
}

const { mode, output, revision } = parseArgs(process.argv.slice(2));
const helperPath = path.join(repoRoot, 'out', 'test', 'server', 'helpers', 'syntheticPowerBuilderCorpus.js');

let helper;
try {
  helper = require(helperPath);
} catch (error) {
  console.error('[synthetic-corpus] No se pudo cargar el helper compilado. Ejecuta npm run build:test antes de generar el corpus.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (typeof helper.materializeSyntheticPowerBuilderCorpus !== 'function') {
  console.error('[synthetic-corpus] El helper compilado no expone materializeSyntheticPowerBuilderCorpus.');
  process.exit(1);
}

const result = await helper.materializeSyntheticPowerBuilderCorpus(output, mode, revision);
console.log(JSON.stringify({
  mode,
  revision,
  rootDir: result.rootDir,
  rootUri: result.rootUri,
  targetUri: result.targetUri,
  metadataPath: result.metadataPath,
  fileCount: result.files.length,
}, null, 2));