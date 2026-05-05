import * as assert from 'assert/strict';
import * as childProcess from 'node:child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const WORKSPACE_ROOT = path.resolve(REPO_ROOT, '..');
const SERVER_ROOT = path.join(REPO_ROOT, 'src', 'server');
const CLIENT_ROOT = path.join(REPO_ROOT, 'src', 'client');
const SHARED_ROOT = path.join(REPO_ROOT, 'src', 'shared');
const PRESENTATION_ROOT = path.join(SERVER_ROOT, 'presentation');
const SRC_ROOT = path.join(REPO_ROOT, 'src');
const HOT_PATH_FEATURE_PATTERN = /src\/server\/features\/(completion|definition|diagnostics|documentSymbols|hover|queryContext|references|referenceSourcePool|rename|semanticTokens|signatureHelp|workspaceSymbols)\.ts$/;
const ARCHITECTURE_HOTSPOT_GUARD = path.join(WORKSPACE_ROOT, 'tools', 'run-architecture-hotspot-guard.mjs');
const ALLOWED_DATAWINDOW_PARSER_CONTRACTS = new Set([
  'src/server/parsing/grammar.ts',
  'src/server/parsing/statementSplitter.ts',
]);

suite('unit/architectureImports (B228, B277, B353)', () => {
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

  test('shared se mantiene como contratos puros sin IO ni runtime internals', async () => {
    const offenders = await collectViolations([SHARED_ROOT], async ({ filePath, importEntries }) => {
      const invalid: string[] = [];
      for (const entry of importEntries) {
        const resolved = await resolveImportTarget(filePath, entry.specifier);
        if (entry.specifier === 'vscode') {
          invalid.push(`${toRelativePath(filePath)} -> ${entry.specifier}`);
          continue;
        }
        if (entry.specifier === 'node:fs' || entry.specifier === 'fs') {
          invalid.push(`${toRelativePath(filePath)} -> ${entry.specifier}`);
          continue;
        }
        if (/^vscode-languageserver(?:\/node)?$/.test(entry.specifier) && !entry.isTypeOnly) {
          invalid.push(`${toRelativePath(filePath)} -> ${entry.specifier} (non-type import)`);
          continue;
        }
        if (
          resolved?.startsWith('src/server/parsing/')
          || resolved?.startsWith('src/server/analysis/')
          || resolved === 'src/server/knowledge/KnowledgeBase.ts'
          || resolved === 'src/server/knowledge/system/SystemCatalog.ts'
          || resolved?.startsWith('src/server/features/dataWindow')
        ) {
          invalid.push(`${toRelativePath(filePath)} -> ${entry.specifier} (${resolved})`);
        }
      }
      return invalid;
    });

    assert.deepEqual(offenders, []);
  });

  test('src no importa plugin_old como dependencia runtime', async () => {
    const offenders = await collectViolations([SRC_ROOT], async ({ filePath, importSpecifiers }) => {
      const invalid: string[] = [];
      for (const specifier of importSpecifiers) {
        const resolved = await resolveImportTarget(filePath, specifier);
        if (specifier.includes('plugin_old') || resolved?.startsWith('plugin_old/')) {
          invalid.push(`${toRelativePath(filePath)} -> ${specifier}${resolved ? ` (${resolved})` : ''} (plugin_old is reference-only)`);
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

  test('presentation no importa IO, workspace discovery, parser ni stores semanticos runtime', async () => {
    const offenders = await collectViolations([PRESENTATION_ROOT], async ({ filePath, importSpecifiers }) => {
      const invalid: string[] = [];
      for (const specifier of importSpecifiers) {
        const resolved = await resolveImportTarget(filePath, specifier);
        if (specifier === 'node:fs' || specifier === 'fs') {
          invalid.push(`${toRelativePath(filePath)} -> ${specifier}`);
          continue;
        }
        if (!resolved) {
          continue;
        }
        if (
          resolved.startsWith('src/server/analysis/')
          || resolved.startsWith('src/server/parsing/')
          || resolved.startsWith('src/server/workspace/')
          || resolved === 'src/server/knowledge/KnowledgeBase.ts'
          || resolved === 'src/server/knowledge/DocumentCache.ts'
          || resolved === 'src/server/knowledge/system/SystemCatalog.ts'
          || resolved === 'src/server/features/dataWindowModel.ts'
        ) {
          invalid.push(`${toRelativePath(filePath)} -> ${specifier} (${resolved})`);
        }
      }
      return invalid;
    });

    assert.deepEqual(offenders, []);
  });

  test('DataWindow features no entran al parser PowerScript generico', async () => {
    const offenders = await collectViolations([path.join(SERVER_ROOT, 'features')], async ({ filePath, importSpecifiers }) => {
      if (!path.basename(filePath).startsWith('dataWindow')) {
        return [];
      }

      const invalid: string[] = [];
      for (const specifier of importSpecifiers) {
        const resolved = await resolveImportTarget(filePath, specifier);
        if (resolved?.startsWith('src/server/parsing/') && !ALLOWED_DATAWINDOW_PARSER_CONTRACTS.has(resolved)) {
          invalid.push(`${toRelativePath(filePath)} -> ${specifier} (${resolved})`);
        }
      }
      return invalid;
    });

    assert.deepEqual(offenders, []);
  });

  test('hotspots TS permanecen dentro de budgets explicitos y los catalog slices quedan allowlisted', () => {
    const result = childProcess.spawnSync(process.execPath, [ARCHITECTURE_HOTSPOT_GUARD, '--json'], {
      cwd: WORKSPACE_ROOT,
      encoding: 'utf8',
    });

    assert.equal(
      result.status,
      0,
      `El guard de hotspots de arquitectura falló.\nSTDOUT:\n${result.stdout ?? ''}\nSTDERR:\n${result.stderr ?? ''}`,
    );

    const report = JSON.parse(result.stdout) as {
      status: string;
      summary: {
        totalHotspots: number;
        allowlistedHotspots: number;
        failingHotspots: number;
      };
      hotspots: Array<{
        path: string;
        allowlisted: boolean;
        growthPolicy: string;
        suggestions: string[];
        metrics: {
          lines: number;
          imports: number;
          topLevelDeclarations: number;
        };
        violations: unknown[];
      }>;
    };

    assert.equal(report.status, 'passed');
    assert.equal(report.summary.failingHotspots, 0);
    assert.ok(report.summary.totalHotspots >= 17, 'El reporte debe cubrir roots, features LSP/DataWindow y la allowlist de catálogo.');
    assert.ok(report.summary.allowlistedHotspots >= 5, 'El reporte debe distinguir la allowlist generated/manual.');

    const extensionHotspot = report.hotspots.find((entry) => entry.path === 'src/client/extension.ts');
    assert.ok(extensionHotspot, 'El reporte debe incluir src/client/extension.ts.');
    assert.equal(extensionHotspot?.allowlisted, false);
    assert.equal(extensionHotspot?.growthPolicy, 'composition-root-guarded');
    assert.ok(extensionHotspot?.suggestions.some((suggestion) => suggestion.includes('commandRegistration')));
    assert.ok((extensionHotspot?.metrics.lines ?? 0) >= 3000, 'extension.ts debe seguir trazado como hotspot real.');
    assert.equal(extensionHotspot?.violations.length, 0);

    const serverHotspot = report.hotspots.find((entry) => entry.path === 'src/server/server.ts');
    assert.ok(serverHotspot, 'El reporte debe incluir src/server/server.ts.');
    assert.equal(serverHotspot?.growthPolicy, 'composition-root-guarded');
    assert.ok(serverHotspot?.suggestions.some((suggestion) => suggestion.includes('composition')));

    for (const featurePath of [
      'src/server/handlers/featureHandlers.ts',
      'src/server/features/completion.ts',
      'src/server/features/hover.ts',
      'src/server/features/signatureHelp.ts',
      'src/server/features/definition.ts',
      'src/server/features/diagnostics.ts',
      'src/server/features/dataWindowFastContext.ts',
      'src/server/features/dataWindowServingAdapters.ts',
    ]) {
      const featureHotspot = report.hotspots.find((entry) => entry.path === featurePath);
      assert.ok(featureHotspot, `El reporte debe incluir ${featurePath}.`);
      assert.equal(featureHotspot?.allowlisted, false);
      assert.equal(featureHotspot?.violations.length, 0);
    }

    const generatedHotspot = report.hotspots.find((entry) => entry.path === 'src/server/knowledge/system/generated/generated.generated.ts');
    assert.ok(generatedHotspot, 'El reporte debe incluir el slice generated principal.');
    assert.equal(generatedHotspot?.allowlisted, true);
    assert.equal(generatedHotspot?.growthPolicy, 'allowlisted-source-data');
    assert.equal(generatedHotspot?.violations.length, 0);
  });
});

type ImportEntry = {
  specifier: string;
  isTypeOnly: boolean;
};

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
  inspect: (file: { filePath: string; importSpecifiers: string[]; importEntries: ImportEntry[] }) => Promise<string[]>
): Promise<string[]> {
  const files = (await Promise.all(roots.map((root) => collectTsFiles(root)))).flat();
  const offenders: string[] = [];

  for (const filePath of files) {
    const content = await fs.readFile(filePath, 'utf8');
    const importEntries = collectImportEntries(content);
    offenders.push(...await inspect({
      filePath,
      importSpecifiers: importEntries.map((entry) => entry.specifier),
      importEntries,
    }));
  }

  return offenders.sort();
}

function collectImportSpecifiers(content: string): string[] {
  return collectImportEntries(content).map((entry) => entry.specifier);
}

function collectImportEntries(content: string): ImportEntry[] {
  const specifiers: ImportEntry[] = [];
  const matches = content.matchAll(/import[\s\S]*?from\s+['"]([^'"]+)['"];?/g);
  for (const match of matches) {
    specifiers.push({
      specifier: match[1],
      isTypeOnly: match[0].trimStart().startsWith('import type '),
    });
  }

  const dynamicImportMatches = content.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const match of dynamicImportMatches) {
    specifiers.push({ specifier: match[1], isTypeOnly: false });
  }

  const requireMatches = content.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g);
  for (const match of requireMatches) {
    specifiers.push({ specifier: match[1], isTypeOnly: false });
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