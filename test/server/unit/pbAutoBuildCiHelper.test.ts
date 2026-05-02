import * as assert from 'assert/strict';
import * as path from 'path';

import {
  buildPbAutoBuildCiHelperBundle,
  suggestPbAutoBuildCiHelperDirectoryName,
} from '../../../src/client/build/pbAutoBuildCiHelper';

suite('unit/pbAutoBuildCiHelper (B186)', () => {
  test('normaliza un nombre de carpeta estable para el helper exportado', () => {
    assert.equal(suggestPbAutoBuildCiHelperDirectoryName(' Demo Build.json '), 'demo-build-json');
    assert.equal(suggestPbAutoBuildCiHelperDirectoryName('***'), 'pbautobuild-ci-helper');
  });

  test('genera manifest y scripts neutrales para CI/CD desde un build file utilizable', () => {
    const workspaceRootPath = path.join('C:', 'repo');
    const helperRootPath = path.join(workspaceRootPath, 'tools', 'pbautobuild-ci', 'demo-build-json');
    const buildFilePath = path.join(workspaceRootPath, 'targets', 'demo.build.json');
    const representedProjectPath = path.join(workspaceRootPath, 'targets', 'demo.pbproj');

    const bundle = buildPbAutoBuildCiHelperBundle({
      workspaceRootPath,
      helperRootPath,
      buildFilePath,
      profileLabel: 'demo.build.json',
      representedProjectPath,
      capability: {
        status: 'available',
        source: 'config',
        versionLabel: '25.0 / 2025',
        executablePath: 'C:/Appeon/pbautobuild250.exe',
        capabilities: ['json-build'],
        detail: 'PBAutoBuild disponible vía configuración.'
      },
      generatedAt: '2026-05-02T12:00:00.000Z'
    });

    assert.equal(bundle.helperWorkspaceRelativePath, 'tools/pbautobuild-ci/demo-build-json');
    assert.equal(bundle.files.length, 5);

    const manifest = JSON.parse(bundle.files.find((file) => file.relativePath === 'manifest.json')?.content ?? '{}');
    assert.deepEqual(manifest.command.args, ['/f', 'targets/demo.build.json']);
    assert.equal(manifest.build.buildFileHelperRelativePath, '../../../targets/demo.build.json');
    assert.equal(manifest.build.representedProjectWorkspaceRelativePath, 'targets/demo.pbproj');
    assert.equal(manifest.localValidation.versionLabel, '25.0 / 2025');

    const readme = bundle.files.find((file) => file.relativePath === 'README.md')?.content ?? '';
    assert.match(readme, /agnostico del proveedor CI\/CD/i);
    assert.match(readme, /PB_AUTOBUILD_PATH/);
    assert.match(readme, /tools\/pbautobuild-ci\/demo-build-json\/run-pbautobuild\.ps1/);

    const powershell = bundle.files.find((file) => file.relativePath === 'run-pbautobuild.ps1')?.content ?? '';
    assert.match(powershell, /PB_AUTOBUILD_PATH/);
    assert.match(powershell, /\.\.\\\.\.\\\.\.\\targets\\demo\.build\.json/);

    const cmd = bundle.files.find((file) => file.relativePath === 'run-pbautobuild.cmd')?.content ?? '';
    assert.match(cmd, /%PB_AUTOBUILD_PATH%/);
    assert.match(cmd, /\.\.\\\.\.\\\.\.\\targets\\demo\.build\.json/);

    const bash = bundle.files.find((file) => file.relativePath === 'run-pbautobuild.sh')?.content ?? '';
    assert.match(bash, /PB_AUTOBUILD_PATH/);
    assert.match(bash, /\.\.\/\.\.\/\.\.\/targets\/demo\.build\.json/);
  });
});