import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');

suite('unit/vsixPackageSurfaceContract (B386)', () => {
  test('package.json fija una allowlist productiva y no convive con .vscodeignore', () => {
    const packageJsonPath = path.join(REPO_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      files?: string[];
      scripts?: Record<string, string>;
    };

    assert.deepEqual(packageJson.files, [
      'dist/**',
      'syntaxes/**',
      'icons/**',
      'language-configuration.json',
      'package.json',
      'LICENSE',
      'README.md',
      'CHANGELOG.md',
    ]);
    assert.equal(fs.existsSync(path.join(REPO_ROOT, '.vscodeignore')), false);
    assert.equal(packageJson.scripts?.['package:vsix:list'], 'vsce ls --no-yarn');
  });

  test('verify-vsix-contents congela required paths y forbidden prefixes del VSIX', () => {
    const verifyScriptPath = path.join(REPO_ROOT, 'tools', 'verify-vsix-contents.mjs');
    const source = fs.readFileSync(verifyScriptPath, 'utf8');

    assert.match(source, /const vsixPath = path\.join\(repoRoot, '\.dist', 'vsc-powersyntax\.vsix'\)/);
    assert.match(source, /\['dist\/client\/extension\.js'\]/);
    assert.match(source, /\['dist\/server\/server\.js'\]/);
    assert.match(source, /\['syntaxes\/powerbuilder\.tmlanguage\.json'\]/i);
    assert.match(source, /const requiredPrefixes = \[\s*'icons\/'/s);
    assert.match(source, /'src\/'/);
    assert.match(source, /'test\/'/);
    assert.match(source, /'fixtures-local\/'/);
    assert.match(source, /'node_modules\/'/);
    assert.match(source, /'coverage\/'/);
    assert.match(source, /'\.cache\/'/);
    assert.match(source, /'\.tmp\/'/);
    assert.match(source, /'tools\/'/);
    assert.match(source, /'scripts\/'/);
    assert.match(source, /'out\/'/);
    assert.match(source, /endsWith\('\.tsbuildinfo'\)/);
    assert.match(source, /No se ha encontrado el VSIX esperado/);
  });

  test('release:verify encadena la verificación del VSIX hardenizado', () => {
    const packageJsonPath = path.join(REPO_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    assert.equal(packageJson.scripts?.['verify:vsix-contents'], 'node ./tools/verify-vsix-contents.mjs');
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run package:vsix/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run verify:vsix-contents/);
  });
});