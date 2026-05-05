import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../..', '..');
const TESTING_DOC_PATH = path.join(REPO_ROOT, 'docs', 'testing.md');
const PACKAGE_JSON_PATH = path.join(REPO_ROOT, 'package.json');

const REQUIRED_MATRIX_COMMANDS = [
  'npm run build:test',
  'npm run test:unit',
  'npm run test:integration',
  'npm run test:smoke',
  'npm test',
  'npm run test:architecture:rapid',
  'npm run test:architecture:metrics',
  'npm run test:docs:drift',
  'npm run test:performance:gate',
  'npm run test:performance:soak',
  'npm run test:smoke:installed-vsix',
  'npm run release:verify',
];

suite('unit/testingMatrixDocs (Bloque 9)', () => {
  test('la matriz canónica referencia comandos reales de package.json', () => {
    const testingDoc = fs.readFileSync(TESTING_DOC_PATH, 'utf8');
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { scripts: Record<string, string> };

    assert.match(testingDoc, /### 3\.6 Matriz canónica de lanes/);

    for (const command of REQUIRED_MATRIX_COMMANDS) {
      const scriptName = command === 'npm test' ? 'test' : command.replace(/^npm run /, '');
      assert.ok(packageJson.scripts[scriptName], `${command} debe existir en package.json`);
      assert.ok(testingDoc.includes(`\`${command}\``), `${command} debe aparecer en docs/testing.md`);
    }
  });

  test('el lane de corpora reales queda marcado como opt-in sin script obligatorio', () => {
    const testingDoc = fs.readFileSync(TESTING_DOC_PATH, 'utf8');
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8')) as { scripts: Record<string, string> };

    assert.equal(packageJson.scripts['test:real-corpora'], undefined);
    assert.ok(testingDoc.includes('`missing: test:real-corpora`'));
    assert.match(testingDoc, /No es dependencia obligatoria de CI/);
  });
});
