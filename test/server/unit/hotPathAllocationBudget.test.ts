import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');
const HOT_PATH_FILES = [
  'src/server/features/completion.ts',
  'src/server/features/definition.ts',
  'src/server/features/diagnostics.ts',
  'src/server/features/documentSymbols.ts',
  'src/server/features/hover.ts',
  'src/server/features/queryContext.ts',
  'src/server/features/references.ts',
  'src/server/features/referenceSourcePool.ts',
  'src/server/features/rename.ts',
  'src/server/features/semanticTokens.ts',
  'src/server/features/signatureHelp.ts',
  'src/server/features/workspaceSymbols.ts',
];

suite('unit/hotPathAllocationBudget (B276)', () => {
  test('hot path por documento no parte el texto completo para inspeccionar una sola linea', async () => {
    const offenders = await collectForbiddenMatches(
      HOT_PATH_FILES,
      /document\.getText\(\)\.split\(/,
    );

    assert.deepEqual(offenders, []);
  });

  test('hot path interactivo no serializa JSON ni exporta snapshots completos', async () => {
    const offenders = await collectForbiddenMatches(
      HOT_PATH_FILES,
      /JSON\.stringify\(|getAllEntities\(|exportDocumentRecords\(/,
    );

    assert.deepEqual(offenders, []);
  });

  test('completion y referenceSourcePool no clonan catalogos globales completos por inercia', async () => {
    const offenders = [
      ...(await collectForbiddenMatches([
        'src/server/features/completion.ts',
      ], /getAllSystemSymbols\(/)),
      ...(await collectForbiddenMatches([
        'src/server/features/referenceSourcePool.ts',
      ], /getAllSourceFiles\(\)\.map\(\(uri\)\s*=>\s*normalizeUri\(uri\)\)/)),
    ];

    assert.deepEqual(offenders, []);
  });
});

async function collectForbiddenMatches(files: readonly string[], pattern: RegExp): Promise<string[]> {
  const offenders: string[] = [];

  for (const relativePath of files) {
    const filePath = path.join(REPO_ROOT, relativePath);
    const content = await fs.readFile(filePath, 'utf8');
    if (pattern.test(content)) {
      offenders.push(relativePath);
    }
  }

  return offenders.sort();
}