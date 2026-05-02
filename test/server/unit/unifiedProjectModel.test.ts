import * as assert from 'assert/strict';

import { buildUnifiedProjectModel } from '../../../src/server/workspace/unifiedProjectModel';
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
  const model = buildUnifiedProjectModel(topology, files);

    assert.equal(model.getProjects().length, 2);
    assert.equal(model.getProjectForFile('file:///proj/libCore.pbl/b.sru')?.projectUri, 'file:///proj/core.pbproj');
    assert.deepEqual(model.getFilesForProject('file:///proj/main.pbt'), ['file:///proj/liba.pbl/a.sru']);
    assert.deepEqual(model.getLibrariesForFile('file:///proj/libA.pbl/a.sru'), ['file:///proj/libA.pbl']);
    assert.equal(model.getStats().orphanFiles, 1);
  });

  test('no marca huérfanos cuando las librerías del project usan rutas con espacios', () => {
    const topology = emptyTopology();
    topology.projects.push({
      uri: 'file:///proj/generic_pfc_app.pbproj',
      name: 'generic_pfc_app',
      libraries: [
        'file:///proj/pfc libs/pfcmain.pbl',
        'file:///proj/pfc libs/pfemain.pbl'
      ]
    });

    const files = [
      'file:///proj/pfc libs/pfcmain.pbl/pfc_n_cst_baseattrib.sru',
      'file:///proj/pfc libs/pfemain.pbl/n_base.sru'
    ];
    const model = buildUnifiedProjectModel(topology, files);

    assert.equal(
      model.getProjectForFile('file:///proj/pfc libs/pfemain.pbl/n_base.sru')?.projectUri,
      'file:///proj/generic_pfc_app.pbproj'
    );
    assert.equal(model.getStats().orphanFiles, 0);
  });
});