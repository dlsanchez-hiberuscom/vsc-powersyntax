import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');

suite('unit/productionBundlingContract (B385)', () => {
  test('package.json publica el runtime bundlado desde dist y empaqueta solo la superficie productiva', () => {
    const packageJsonPath = path.join(REPO_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      main?: string;
      files?: string[];
      scripts?: Record<string, string>;
    };

    assert.equal(packageJson.main, './dist/client/extension.js');
    assert.ok(packageJson.files?.includes('dist/**'));
    assert.ok(!packageJson.files?.includes('out/**'));
    assert.ok(!packageJson.files?.includes('node_modules/**'));
    assert.equal(packageJson.scripts?.['vscode:prepublish'], 'npm run bundle');
    assert.match(packageJson.scripts?.bundle ?? '', /tools\/esbuild\.mjs --production/);
    assert.match(packageJson.scripts?.['package:vsix'] ?? '', /npm run bundle/);
    assert.match(packageJson.scripts?.['package:vsix'] ?? '', /vsce package/);
  });

  test('esbuild genera cliente y servidor en dist y mantiene vscode como external del cliente', () => {
    const esbuildPath = path.join(REPO_ROOT, 'tools', 'esbuild.mjs');
    const source = fs.readFileSync(esbuildPath, 'utf8');

    assert.match(source, /src', 'client', 'extension\.ts/);
    assert.match(source, /distRoot, 'client', 'extension\.js'/);
    assert.match(source, /external: \['vscode'\]/);
    assert.match(source, /src', 'server', 'server\.ts/);
    assert.match(source, /distRoot, 'server', 'server\.js'/);
    assert.match(source, /const production = args\.has\('--production'\)/);
    assert.match(source, /const watch = args\.has\('--watch'\)/);
  });

  test('el cliente arranca el LSP desde dist y deja out solo como fallback de desarrollo', () => {
    const extensionPath = path.join(REPO_ROOT, 'src', 'client', 'extension.ts');
    const source = fs.readFileSync(extensionPath, 'utf8');

    assert.match(source, /path\.join\('dist', 'server', 'server\.js'\)/);
    assert.match(source, /context\.extensionMode === vscode\.ExtensionMode\.Development/);
    assert.match(source, /path\.join\('out', 'server', 'server\.js'\)/);
  });
});