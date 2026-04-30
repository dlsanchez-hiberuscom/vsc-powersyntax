import * as assert from 'assert/strict';
import { buildProjectRegistry } from '../../../src/server/workspace/projectRegistry';
import { emptyTopology } from '../../../src/server/workspace/topology';

suite('unit/projectRegistry', () => {
  test('asocia archivos por library prefix más largo', () => {
    const topology = emptyTopology();
    topology.targets.push({
      uri: 'file:///proj/main.pbt',
      name: 'main',
      libraries: ['file:///proj/lib1.pbl']
    });
    topology.targets.push({
      uri: 'file:///proj/extra.pbt',
      name: 'extra',
      libraries: ['file:///proj/lib2.pbl']
    });

    const reg = buildProjectRegistry(topology, [
      'file:///proj/lib1.pbl/n_a.sru',
      'file:///proj/lib2.pbl/n_b.sru'
    ]);

    assert.equal(reg.getProjectForFile('file:///proj/lib1.pbl/n_a.sru'), 'file:///proj/main.pbt');
    assert.equal(reg.getProjectForFile('file:///proj/lib2.pbl/n_b.sru'), 'file:///proj/extra.pbt');
  });

  test('fallback por proximidad de path cuando no hay match de library', () => {
    const topology = emptyTopology();
    topology.targets.push({
      uri: 'file:///proj/sub1/main.pbt',
      name: 'main',
      libraries: []
    });
    topology.targets.push({
      uri: 'file:///proj/sub2/extra.pbt',
      name: 'extra',
      libraries: []
    });

    const reg = buildProjectRegistry(topology, [
      'file:///proj/sub1/n_a.sru',
      'file:///proj/sub2/n_b.sru'
    ]);

    assert.equal(reg.getProjectForFile('file:///proj/sub1/n_a.sru'), 'file:///proj/sub1/main.pbt');
    assert.equal(reg.getProjectForFile('file:///proj/sub2/n_b.sru'), 'file:///proj/sub2/extra.pbt');
  });

  test('sin markers devuelve null', () => {
    const reg = buildProjectRegistry(emptyTopology(), ['file:///x.sru']);
    assert.equal(reg.getProjectForFile('file:///x.sru'), null);
    assert.equal(reg.getAllProjects().length, 0);
  });

  test('getFilesForProject devuelve la lista', () => {
    const topology = emptyTopology();
    topology.targets.push({
      uri: 'file:///p/m.pbt',
      name: 'm',
      libraries: ['file:///p/lib.pbl']
    });
    const reg = buildProjectRegistry(topology, [
      'file:///p/lib.pbl/a.sru',
      'file:///p/lib.pbl/b.sru'
    ]);
    assert.equal(reg.getFilesForProject('file:///p/m.pbt').length, 2);
  });
});
