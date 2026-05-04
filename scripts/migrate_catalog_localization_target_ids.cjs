'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const localizationRoot = path.join(repoRoot, 'src', 'server', 'knowledge', 'system', 'localization');

async function collectLocalizationFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectLocalizationFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const write = process.argv.includes('--write');
  const { buildCatalogConsistencyReport } = require(path.join(
    repoRoot,
    'out',
    'server',
    'knowledge',
    'system',
    'consistency',
  ));

  const recoveredTargetIds = buildCatalogConsistencyReport().localization.recoveredTargetIds;
  if (recoveredTargetIds.length === 0) {
    console.log('No hay targetIds recuperados por targetKey. No hace falta migracion.');
    return;
  }

  const files = await collectLocalizationFiles(localizationRoot);
  const fileContents = new Map();
  for (const filePath of files) {
    fileContents.set(filePath, await fs.readFile(filePath, 'utf8'));
  }

  let applied = 0;
  let skipped = 0;

  for (const recovery of recoveredTargetIds) {
    const oldSnippet = `targetId: '${recovery.previousTargetId}'`;
    const newSnippet = `targetId: '${recovery.targetEntryId}'`;
    const matchingFiles = files.filter(filePath => fileContents.get(filePath).includes(oldSnippet));

    if (matchingFiles.length !== 1) {
      skipped += 1;
      console.log(`SKIP ${recovery.targetName}: esperado 1 match para ${recovery.previousTargetId}, encontrados ${matchingFiles.length}.`);
      continue;
    }

    const filePath = matchingFiles[0];
    const content = fileContents.get(filePath);
    const updated = content.replace(oldSnippet, newSnippet);
    if (updated === content) {
      skipped += 1;
      console.log(`SKIP ${recovery.targetName}: no se pudo reemplazar ${recovery.previousTargetId}.`);
      continue;
    }

    applied += 1;
    fileContents.set(filePath, updated);
    const relativePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
    console.log(`${write ? 'WRITE' : 'PLAN'} ${recovery.targetName}: ${recovery.previousTargetId} -> ${recovery.targetEntryId} (${relativePath})`);
  }

  if (write) {
    for (const [filePath, content] of fileContents.entries()) {
      await fs.writeFile(filePath, content, 'utf8');
    }
  }

  console.log(`Resumen: ${applied} ${write ? 'aplicadas' : 'planificadas'}, ${skipped} omitidas.`);
  if (!write) {
    console.log('Usa --write para aplicar los reemplazos sobre los overlays fuente.');
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});