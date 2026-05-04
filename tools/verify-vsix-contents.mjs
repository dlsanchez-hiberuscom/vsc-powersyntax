import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const vsixPath = path.join(repoRoot, '.dist', 'vsc-powersyntax.vsix');

const requiredPathAlternatives = [
  ['dist/client/extension.js'],
  ['dist/server/server.js'],
  ['syntaxes/powerbuilder.tmlanguage.json'],
  ['language-configuration.json'],
  ['package.json'],
  ['readme.md', 'README.md'],
  ['changelog.md', 'CHANGELOG.md'],
  ['license.txt', 'LICENSE', 'LICENSE.txt'],
];

const requiredPrefixes = [
  'icons/',
];

const forbiddenPrefixes = [
  'src/',
  'test/',
  'fixtures-local/',
  'node_modules/',
  'coverage/',
  '.cache/',
  '.tmp/',
  'tools/',
  'scripts/',
  'out/',
];

function normalizeEntry(entry) {
  return entry
    .trim()
    .replace(/\\/g, '/')
    .replace(/^extension\//i, '')
    .replace(/\/$/, '')
    .toLowerCase();
}

function listVsixContents() {
  const powershellCommand = [
    "$ErrorActionPreference = 'Stop'",
    'Add-Type -AssemblyName System.IO.Compression.FileSystem',
    `$archive = [System.IO.Compression.ZipFile]::OpenRead('${vsixPath.replace(/'/g, "''")}')`,
    'try { $archive.Entries | ForEach-Object { $_.FullName } } finally { $archive.Dispose() }',
  ].join('; ');

  const output = execFileSync(
    'pwsh',
    ['-NoProfile', '-Command', powershellCommand],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  return output
    .split(/\r?\n/)
    .map(normalizeEntry)
    .filter((entry) => entry.length > 0 && entry !== '[content_types].xml' && entry !== 'extension.vsixmanifest');
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function verify(entries) {
  for (const alternatives of requiredPathAlternatives) {
    ensure(
      alternatives.some((candidate) => entries.includes(candidate.toLowerCase())),
      `Falta archivo obligatorio en el VSIX. Se esperaba una de estas rutas: ${alternatives.join(', ')}`
    );
  }

  for (const requiredPrefix of requiredPrefixes) {
    ensure(entries.some((entry) => entry.startsWith(requiredPrefix.toLowerCase())), `Falta contenido obligatorio con prefijo: ${requiredPrefix}`);
  }

  for (const forbiddenPrefix of forbiddenPrefixes) {
    ensure(!entries.some((entry) => entry.startsWith(forbiddenPrefix.toLowerCase())), `Contenido prohibido detectado en el VSIX: ${forbiddenPrefix}`);
  }

  ensure(!entries.some((entry) => entry.endsWith('.tsbuildinfo')), 'El VSIX no debe incluir archivos .tsbuildinfo.');
}

function main() {
  ensure(existsSync(vsixPath), `No se ha encontrado el VSIX esperado en ${vsixPath}. Ejecuta primero npm run package:vsix.`);
  const entries = listVsixContents();
  verify(entries);
  console.log(`VSIX verificado correctamente con ${entries.length} entradas.`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}