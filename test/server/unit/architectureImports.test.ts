import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const SERVER_ROOT = path.join(REPO_ROOT, 'src', 'server');
const CLIENT_ROOT = path.join(REPO_ROOT, 'src', 'client');
const SHARED_ROOT = path.join(REPO_ROOT, 'src', 'shared');
const HOT_PATH_FEATURE_PATTERN = /src\/server\/features\/(completion|definition|diagnostics|documentSymbols|hover|queryContext|references|referenceSourcePool|rename|semanticTokens|signatureHelp|workspaceSymbols)\.ts$/;

suite('unit/architectureImports (B228, B277)', () => {
  test('knowledge, parsing y utils puros no importan vscode ni vscode-languageserver', async () => {
    const offenders = await collectViolations([
      path.join(SERVER_ROOT, 'knowledge'),
      path.join(SERVER_ROOT, 'parsing'),
      path.join(SERVER_ROOT, 'utils'),
    ], async ({ filePath, importSpecifiers }) => {
      const invalid = importSpecifiers.filter((specifier) => specifier === 'vscode' || /^vscode-languageserver(?:\/node)?$/.test(specifier));
      return invalid.map((specifier) => `${toRelativePath(filePath)} -> ${specifier}`);
    });

    assert.deepEqual(offenders, []);
  });

  test('client no importa modulos server', async () => {
    const offenders = await collectViolations([CLIENT_ROOT], async ({ filePath, importSpecifiers }) => {
      const invalid: string[] = [];
      for (const specifier of importSpecifiers) {
        const resolved = await resolveImportTarget(filePath, specifier);
        if (resolved?.startsWith('src/server/')) {
          invalid.push(`${toRelativePath(filePath)} -> ${specifier} (${resolved})`);
        }
      }
      return invalid;
    });

    assert.deepEqual(offenders, []);
  });

  test('runtime y features no importan client', async () => {
    const offenders = await collectViolations([
      path.join(SERVER_ROOT, 'runtime'),
      path.join(SERVER_ROOT, 'features'),
    ], async ({ filePath, importSpecifiers }) => {
      const invalid: string[] = [];
      for (const specifier of importSpecifiers) {
        const resolved = await resolveImportTarget(filePath, specifier);
        if (resolved?.startsWith('src/client/')) {
          invalid.push(`${toRelativePath(filePath)} -> ${specifier} (${resolved})`);
        }
      }
      return invalid;
    });

    assert.deepEqual(offenders, []);
  });

  test('shared no importa modulos client ni server', async () => {
    const offenders = await collectViolations([SHARED_ROOT], async ({ filePath, importSpecifiers }) => {
      const invalid: string[] = [];
      for (const specifier of importSpecifiers) {
        const resolved = await resolveImportTarget(filePath, specifier);
        if (resolved?.startsWith('src/client/') || resolved?.startsWith('src/server/')) {
          invalid.push(`${toRelativePath(filePath)} -> ${specifier} (${resolved})`);
        }
      }
      return invalid;
    });

    assert.deepEqual(offenders, []);
  });

  test('build y ORCA no importan hot path semantico interactivo', async () => {
    const offenders = await collectViolations([path.join(SERVER_ROOT, 'build')], async ({ filePath, importSpecifiers }) => {
      const invalid: string[] = [];
      for (const specifier of importSpecifiers) {
        const resolved = await resolveImportTarget(filePath, specifier);
        if (!resolved) {
          continue;
        }
        if (
          resolved === 'src/server/analysis/documentAnalysis.ts'
          || resolved === 'src/server/knowledge/resolution/semanticQueryService.ts'
          || resolved.startsWith('src/server/parsing/')
          || HOT_PATH_FEATURE_PATTERN.test(resolved)
        ) {
          invalid.push(`${toRelativePath(filePath)} -> ${specifier} (${resolved})`);
        }
      }
      return invalid;
    });

    assert.deepEqual(offenders, []);
  });
});

async function collectTsFiles(root: string): Promise<string[]> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectTsFiles(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function collectViolations(
  roots: string[],
  inspect: (file: { filePath: string; importSpecifiers: string[] }) => Promise<string[]>
): Promise<string[]> {
  const files = (await Promise.all(roots.map((root) => collectTsFiles(root)))).flat();
  const offenders: string[] = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    offenders.push(...await inspect({ filePath, importSpecifiers: collectImportSpecifiers(content) }));
  }

  return offenders.sort();
}

function collectImportSpecifiers(content: string): string[] {
  const specifiers: string[] = [];
  const matches = content.matchAll(/from\s+['"]([^'"]+)['"]/g);
  for (const match of matches) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

async function resolveImportTarget(filePath: string, specifier: string): Promise<string | null> {
  if (!specifier.startsWith('.')) {
    return null;
  }

  const basePath = path.resolve(path.dirname(filePath), specifier);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
  ];

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return toRelativePath(candidate);
    }
  }

  return toRelativePath(basePath);
}

async function exists(candidate: string): Promise<boolean> {
  try {
    await fs.access(candidate);
    return true;
  } catch {
    return false;
  }
}

function toRelativePath(filePath: string): string {
  return path.relative(REPO_ROOT, filePath).replace(/\\/g, '/');
}