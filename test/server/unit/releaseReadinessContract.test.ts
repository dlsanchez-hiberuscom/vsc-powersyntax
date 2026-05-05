import * as assert from 'assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../../../..');

suite('unit/releaseReadinessContract (B387)', () => {
  test('.vscode-test publica una smoke instalada desde VSIX sin extensionDevelopmentPath', () => {
    const configPath = path.join(REPO_ROOT, '.vscode-test.js');
    const source = fs.readFileSync(configPath, 'utf8');

    assert.match(source, /label: 'smoke-installed'/);
    assert.match(source, /files: 'out\/test\/smoke\/extension\.test\.js'/);
    assert.match(source, /extensionDevelopmentPath: \[\]/);
    assert.match(source, /installExtensions: \['\.dist\/vsc-powersyntax\.vsix'\]/);
    assert.match(source, /installedExtensionsDir/);
    assert.match(source, /installedUserDataDir/);
  });

  test('package.json encadena la smoke instalada dentro de release:verify', () => {
    const packageJsonPath = path.join(REPO_ROOT, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    assert.equal(
      packageJson.scripts?.['test:smoke:installed-vsix'],
      'vscode-test --label smoke-installed --grep "la extensión se activa en menos de 500ms"'
    );
    assert.equal(
      packageJson.scripts?.['verify:catalog-coverage'],
      'npm run compile && node ./tools/verify-catalog-coverage.cjs'
    );
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm test/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run test:architecture:rapid/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run test:docs:drift/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run test:performance:gate/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run verify:catalog-coverage/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run package:vsix/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run verify:vsix-contents/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run test:smoke:installed-vsix/);
    assert.match(packageJson.scripts?.['release:verify'] ?? '', /npm run release:summary/);
    assert.equal(packageJson.scripts?.['release:summary'], 'node ./tools/release-readiness-summary.mjs');
  });

  test('release summary publica version, commit, VSIX y validaciones ejecutadas', () => {
    const summaryScriptPath = path.join(REPO_ROOT, 'tools', 'release-readiness-summary.mjs');
    const source = fs.readFileSync(summaryScriptPath, 'utf8');

    assert.match(source, /Release readiness summary/);
    assert.match(source, /version:/);
    assert.match(source, /commit:/);
    assert.match(source, /vsix:/);
    assert.match(source, /validations:/);
    assert.match(source, /npm run test:architecture:rapid/);
    assert.match(source, /npm run test:docs:drift/);
    assert.match(source, /npm run test:smoke:installed-vsix/);
  });

  test('verify:catalog-coverage falla sobre drift de official coverage y publica el detalle ADR-0001', () => {
    const verifyScriptPath = path.join(REPO_ROOT, 'tools', 'verify-catalog-coverage.cjs');
    const source = fs.readFileSync(verifyScriptPath, 'utf8');

    assert.match(source, /Verificacion ADR-0001 de official coverage/);
    assert.match(source, /officialCoverageDriftDomains/);
    assert.match(source, /manualPrimaryDomains/);
    assert.match(source, /candidateHotPathViolations/);
    assert.match(source, /officialCoverageDriftDomains\.length > 0/);
    assert.match(source, /process\.exitCode = 1/);
  });

  test('release-readiness usa el carril release:verify y publica el VSIX resultante', () => {
    const workflowPath = path.join(REPO_ROOT, '.github', 'workflows', 'release-readiness.yml');
    const source = fs.readFileSync(workflowPath, 'utf8');

    assert.match(source, /workflow_dispatch:/);
    assert.match(source, /push:/);
    assert.match(source, /pull_request:/);
    assert.match(source, /run: xvfb-run -a npm run release:verify/);
    assert.match(source, /name: vsc-powersyntax-vsix/);
    assert.match(source, /path: \.\/\.dist\/vsc-powersyntax\.vsix/);
    assert.match(source, /retention-days: 14/);
  });

  test('release y troubleshooting tienen owner documental sin publicar automaticamente', () => {
    const releaseDoc = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'release.md'), 'utf8');
    const troubleshootingDoc = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'troubleshooting.md'), 'utf8');

    for (const expected of [
      'npm run release:verify',
      '.dist/vsc-powersyntax.vsix',
      'npm run test:smoke:installed-vsix',
      'retention-days: 14',
      'VSCE_PAT',
      'never publishes automatically',
    ]) {
      assert.ok(releaseDoc.includes(expected), `${expected} debe estar documentado en release.md`);
    }

    for (const expected of [
      'tool-missing',
      'config-json-invalid',
      'source-control-auth-failure',
      'unsupported-platform',
      'orca-tool-missing',
      'packaging-disabled',
      'Workspace Trust',
    ]) {
      assert.ok(troubleshootingDoc.includes(expected), `${expected} debe estar documentado en troubleshooting.md`);
    }
  });
});