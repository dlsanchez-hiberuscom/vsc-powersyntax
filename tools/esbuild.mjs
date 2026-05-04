import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, rm } from 'node:fs/promises';
import * as esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const distRoot = path.join(repoRoot, 'dist');

const args = new Set(process.argv.slice(2));
const production = args.has('--production');
const watch = args.has('--watch');
const sourcemap = !production;

const sharedOptions = {
  bundle: true,
  color: true,
  format: 'cjs',
  logLevel: 'info',
  platform: 'node',
  sourcemap,
  target: 'node22',
};

const buildTargets = [
  {
    ...sharedOptions,
    entryPoints: [path.join(repoRoot, 'src', 'client', 'extension.ts')],
    external: ['vscode'],
    outfile: path.join(distRoot, 'client', 'extension.js'),
  },
  {
    ...sharedOptions,
    entryPoints: [path.join(repoRoot, 'src', 'server', 'server.ts')],
    outfile: path.join(distRoot, 'server', 'server.js'),
  },
];

async function ensureDistRoot() {
  if (!watch) {
    await rm(distRoot, { force: true, recursive: true });
  }

  await mkdir(path.join(distRoot, 'client'), { recursive: true });
  await mkdir(path.join(distRoot, 'server'), { recursive: true });
}

async function run() {
  await ensureDistRoot();

  if (watch) {
    const contexts = await Promise.all(buildTargets.map((options) => esbuild.context(options)));
    await Promise.all(contexts.map((context) => context.watch()));
    console.log('esbuild watch activo para client y server.');
    return;
  }

  await Promise.all(buildTargets.map((options) => esbuild.build(options)));
  console.log(`Bundles generados en ${path.relative(repoRoot, distRoot)}.`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});