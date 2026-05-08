import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');

suite('unit/packageSelfVerificationContract (B315)', () => {
  test('la smoke instalada desde VSIX valida descriptor, comandos, handshake LSP y settings defaults', () => {
    const smokePath = path.join(REPO_ROOT, 'test', 'smoke', 'extension.test.ts');
    const source = fs.readFileSync(smokePath, 'utf8');

    assert.match(source, /getConfiguration\('vscPowerSyntax'\)/);
    assert.match(source, /inspect<string>\('profile'\)/);
    assert.match(source, /profileInspection\?\.defaultValue, 'balanced'/);
    assert.match(source, /profileInspection\?\.workspaceValue, 'legacy-orca'/);
    assert.match(source, /get\('profile'\), 'legacy-orca'/);
    assert.match(source, /get\('progress\.show'\), true/);
    assert.match(source, /get\('formatting\.enabled'\), true/);
    assert.match(source, /get\('formatting\.formatOnSave'\), false/);
    assert.match(source, /get\('formatting\.maxDocumentChars'\), 120000/);
    assert.match(source, /get\('formatting\.maxDocumentLines'\), 4000/);
    assert.match(source, /commands\.includes\('powerbuilder\.openWorkspaceCheck'\)/);
    assert.match(source, /commands\.includes\('powerbuilder\.openExtensionUpgradeCompatibilityCheck'\)/);
    assert.match(source, /await api!?\.getServerStats\(\)/);
    assert.match(source, /await api!?\.querySymbols\(/);
    assert.match(source, /await api!?\.getCurrentObjectContext\(/);
    assert.match(source, /invokeReadOnlyTool\(\{ tool: 'contract' \}\)/);
  });

  test('release:verify mantiene la smoke instalada del VSIX como self-verification del paquete', () => {
    const packageJsonPath = path.join(REPO_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    assert.equal(
      packageJson.scripts?.['test:smoke:installed-vsix'],
      'vscode-test --label smoke-installed --grep "la extensión se activa en menos de 500ms"'
    );
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run package:vsix/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run verify:vsix-contents/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run test:smoke:installed-vsix/);
  });
});