import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

suite('unit/architectureImports (B228)', () => {
  test('knowledge, parsing y utils puros no importan vscode-languageserver', async () => {
    const roots = [
      path.resolve(__dirname, '../../../src/server/knowledge'),
      path.resolve(__dirname, '../../../src/server/parsing'),
      path.resolve(__dirname, '../../../src/server/utils'),
    ];

    const files = (await Promise.all(roots.map((root) => collectTsFiles(root)))).flat();
    const offenders: string[] = [];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8');
      if (/from\s+['"]vscode-languageserver(?:\/node)?['"]/.test(content)) {
        offenders.push(path.relative(path.resolve(__dirname, '../../..'), filePath).replace(/\\/g, '/'));
      }
    }

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