import * as assert from 'assert/strict';

import { buildUnifiedProjectModel } from '../../../src/server/workspace/unifiedProjectModel';
import { buildProjectRegistry } from '../../../src/server/workspace/projectRegistry';
import { emptyTopology } from '../../../src/server/workspace/topology';

suite('unit/unifiedProjectModel', () => {
  test('unifica targets y projects en una sola vista', () => {
    const topology = emptyTopology();
    topology.targets.push({
      uri: 'file:///proj/main.pbt',
      name: 'main',
      libraries: ['file:///proj/libA.pbl']
    });
    topology.projects.push({
      uri: 'file:///proj/core.pbproj',
      name: 'core',
      libraries: ['file:///proj/libCore.pbl']
    });

    const files = ['file:///proj/libA.pbl/a.sru', 'file:///proj/libCore.pbl/b.sru', 'file:///outside/orphan.sru'];
    const registry = buildProjectRegistry(topology, files);
    const model = buildUnifiedProjectModel(topology, registry, files);

    assert.equal(model.getProjects().length, 2);
    assert.equal(model.getProjectForFile('file:///proj/libCore.pbl/b.sru')?.projectUri, 'file:///proj/core.pbproj');
    assert.deepEqual(model.getLibrariesForFile('file:///proj/libA.pbl/a.sru'), ['file:///proj/libA.pbl']);
    assert.equal(model.getStats().orphanFiles, 1);
  });
});