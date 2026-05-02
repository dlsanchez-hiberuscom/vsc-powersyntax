import * as assert from 'assert/strict';

import {
  parsePbAutoBuildBuildFileCandidate,
  resolvePbAutoBuildBuildFiles,
  summarizePbAutoBuildBuildFiles,
  type PbAutoBuildBuildFileCandidate,
} from '../../../src/server/workspace/pbAutoBuildBuildFiles';
import { emptyTopology } from '../../../src/server/workspace/topology';

suite('unit/pbAutoBuildBuildFiles (B182)', () => {
  test('descubre un build file con BuildPlan y referencia explícita a pbproj', () => {
    const candidate = parsePbAutoBuildBuildFileCandidate(
      'file:///workspace/app.build.json',
      JSON.stringify({
        MetaInfo: { IDEVersion: '25.0' },
        BuildPlan: {
          Projects: [{ Path: 'app.pbproj' }]
        }
      })
    );

    assert.deepEqual(candidate, {
      uri: 'file:///workspace/app.build.json',
      hasBuildPlan: true,
      referencedProjectUris: ['file:///workspace/app.pbproj']
    });
  });

  test('ignora JSON genéricos que no parecen build files de PBAutoBuild', () => {
    const candidate = parsePbAutoBuildBuildFileCandidate(
      'file:///workspace/package.json',
      JSON.stringify({ name: 'vsc-powersyntax', version: '1.0.0' })
    );

    assert.equal(candidate, null);
  });

  test('marca como inválido un JSON malformado que sí parece build file', () => {
    const candidate = parsePbAutoBuildBuildFileCandidate(
      'file:///workspace/app.build.json',
      '{"BuildPlan":{"Projects":["app.pbproj",]}'
    );

    assert.equal(candidate?.hasBuildPlan, true);
    assert.ok(candidate?.parseError);
    assert.deepEqual(candidate?.referencedProjectUris, ['file:///workspace/app.pbproj']);
  });

  test('resuelve como usable un build file con un único marker conocido', () => {
    const candidates: PbAutoBuildBuildFileCandidate[] = [
      {
        uri: 'file:///workspace/app.build.json',
        hasBuildPlan: true,
        referencedProjectUris: ['file:///workspace/app.pbproj']
      }
    ];
    const topology = emptyTopology();
    topology.projects.push({
      uri: 'file:///workspace/app.pbproj',
      name: 'app',
      libraries: []
    });

    const resolved = resolvePbAutoBuildBuildFiles(candidates, topology);

    assert.equal(resolved[0]?.status, 'usable');
    assert.equal(resolved[0]?.representedProjectUri, 'file:///workspace/app.pbproj');
  });

  test('resuelve como ambiguo un build file con múltiples markers conocidos', () => {
    const candidates: PbAutoBuildBuildFileCandidate[] = [
      {
        uri: 'file:///workspace/app.build.json',
        hasBuildPlan: true,
        referencedProjectUris: ['file:///workspace/app.pbproj', 'file:///workspace/app.pbt']
      }
    ];
    const topology = emptyTopology();
    topology.projects.push({ uri: 'file:///workspace/app.pbproj', name: 'app', libraries: [] });
    topology.targets.push({ uri: 'file:///workspace/app.pbt', name: 'app', libraries: [] });

    const resolved = resolvePbAutoBuildBuildFiles(candidates, topology);

    assert.equal(resolved[0]?.status, 'ambiguous');
    assert.equal(resolved[0]?.reasonCode, 'ambiguous-project-reference');
  });

  test('resume counts por estado', () => {
    const summary = summarizePbAutoBuildBuildFiles([
      {
        uri: 'file:///workspace/usable.build.json',
        hasBuildPlan: true,
        referencedProjectUris: ['file:///workspace/app.pbproj'],
        status: 'usable',
        representedProjectUri: 'file:///workspace/app.pbproj'
      },
      {
        uri: 'file:///workspace/invalid.build.json',
        hasBuildPlan: false,
        referencedProjectUris: [],
        status: 'invalid',
        reasonCode: 'missing-build-plan'
      },
      {
        uri: 'file:///workspace/ambiguous.build.json',
        hasBuildPlan: true,
        referencedProjectUris: ['file:///workspace/app.pbproj', 'file:///workspace/app.pbt'],
        status: 'ambiguous',
        reasonCode: 'ambiguous-project-reference'
      }
    ]);

    assert.deepEqual(summary, {
      total: 3,
      usable: 1,
      invalid: 1,
      ambiguous: 1
    });
  });
});