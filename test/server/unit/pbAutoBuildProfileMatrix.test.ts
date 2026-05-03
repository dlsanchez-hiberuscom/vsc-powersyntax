import * as assert from 'assert/strict';

import { buildPbAutoBuildProfileMatrix } from '../../../src/client/build/pbAutoBuildProfileMatrix';

suite('unit/pbAutoBuildProfileMatrix (B257)', () => {
  test('prioriza el último profile y marca ejecutables los utilizables con tooling disponible', () => {
    const matrix = buildPbAutoBuildProfileMatrix({
      inventory: [
        {
          uri: 'file:///workspace/build-ambiguous.json',
          label: 'build-ambiguous.json',
          status: 'ambiguous',
          detail: 'Referencia dos markers utilizables.',
        },
        {
          uri: 'file:///workspace/build-main.json',
          label: 'build-main.json',
          representedProjectUri: 'file:///workspace/app.pbproj',
          status: 'usable',
        },
      ],
      preferredBuildFileUri: 'file:///workspace/build-main.json',
      buildTooling: {
        status: 'available',
        source: 'config',
        executablePath: 'C:/Appeon/pbautobuild250.exe',
        versionLabel: '25.0 / 2025',
        capabilities: ['json-build'],
        detail: 'PBAutoBuild disponible vía configuración.',
      },
    });

    assert.equal(matrix.available, true);
    assert.equal(matrix.summary.totalProfiles, 2);
    assert.equal(matrix.summary.usableProfiles, 1);
    assert.equal(matrix.summary.ambiguousProfiles, 1);
    assert.equal(matrix.summary.invalidProfiles, 0);
    assert.equal(matrix.summary.runnableProfiles, 1);
    assert.equal(matrix.summary.healthState, 'ready');
    assert.equal(matrix.profiles[0]?.buildFileUri, 'file:///workspace/build-main.json');
    assert.equal(matrix.profiles[0]?.isLastUsed, true);
    assert.equal(matrix.profiles[0]?.canRun, true);
    assert.equal(matrix.profiles[0]?.validationState, 'ready');
    assert.equal(matrix.profiles[1]?.validationState, 'warning');
  });

  test('avisa cuando falta tooling o el último profile recordado ya no existe', () => {
    const matrix = buildPbAutoBuildProfileMatrix({
      inventory: [
        {
          uri: 'file:///workspace/build-main.json',
          label: 'build-main.json',
          status: 'usable',
        },
      ],
      preferredBuildFileUri: 'file:///workspace/build-missing.json',
      buildTooling: {
        status: 'missing',
        source: 'unresolved',
        capabilities: [],
        detail: 'No se encontró PBAutoBuild250.exe.',
      },
    });

    assert.equal(matrix.summary.totalProfiles, 1);
    assert.equal(matrix.summary.runnableProfiles, 0);
    assert.equal(matrix.summary.healthState, 'blocked');
    assert.equal(matrix.profiles[0]?.canRun, false);
    assert.equal(matrix.profiles[0]?.validationState, 'error');
    assert.ok(matrix.findings.some((finding) => finding.code === 'tooling-unavailable'));
    assert.ok(matrix.findings.some((finding) => finding.code === 'preferred-profile-stale'));
  });

  test('identifica el último profile por URI aunque existan labels duplicados entre roots', () => {
    const matrix = buildPbAutoBuildProfileMatrix({
      inventory: [
        {
          uri: 'file:///workspace-a/app.build.json',
          label: 'app.build.json',
          representedProjectUri: 'file:///workspace-a/app.pbt',
          status: 'usable',
        },
        {
          uri: 'file:///workspace-b/app.build.json',
          label: 'app.build.json',
          representedProjectUri: 'file:///workspace-b/app.pbt',
          status: 'usable',
        },
      ],
      preferredBuildFileUri: 'file:///workspace-b/app.build.json',
      buildTooling: {
        status: 'available',
        source: 'config',
        executablePath: 'C:/Appeon/pbautobuild250.exe',
        versionLabel: '25.0 / 2025',
        capabilities: ['json-build'],
        detail: 'PBAutoBuild disponible vía configuración.',
      },
    });

    assert.equal(matrix.summary.totalProfiles, 2);
    assert.equal(matrix.summary.runnableProfiles, 2);
    assert.equal(matrix.summary.preferredProfileUri, 'file:///workspace-b/app.build.json');
    assert.equal(matrix.profiles[0]?.buildFileUri, 'file:///workspace-b/app.build.json');
    assert.equal(matrix.profiles[0]?.isLastUsed, true);
    assert.equal(matrix.profiles[1]?.buildFileUri, 'file:///workspace-a/app.build.json');
    assert.equal(matrix.profiles[1]?.isLastUsed, false);
  });
});