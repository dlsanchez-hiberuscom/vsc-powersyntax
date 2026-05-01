import * as assert from 'assert/strict';
import { resolveByLibraryOrder } from '../../../src/server/knowledge/resolution/libraryOrder';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { buildUnifiedProjectModel } from '../../../src/server/workspace/unifiedProjectModel';
import type { Entity } from '../../../src/server/knowledge/types';
import { EntityKind } from '../../../src/server/knowledge/types';

function makeEntity(uri: string): Entity {
  return {
    id: 'foo',
    name: 'foo',
    kind: EntityKind.Function,
    uri,
    line: 0,
    character: 0
  } as Entity;
}

suite('unit/libraryOrder', () => {
  test('mismo proyecto: prioriza por library order', () => {
    const state = new WorkspaceState();
    state.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///p/main.pbt',
        name: 'main',
        libraries: ['file:///p/libA.pbl', 'file:///p/libB.pbl']
      }
    });
    state.setProjectModel(buildUnifiedProjectModel(state.getTopology(), [
      'file:///p/libA.pbl/x.sru',
      'file:///p/libB.pbl/x.sru'
    ]));

    const candidates = [
      makeEntity('file:///p/libB.pbl/x.sru'),
      makeEntity('file:///p/libA.pbl/x.sru')
    ];
    const sorted = resolveByLibraryOrder(candidates, { activeUri: null, state });
    assert.equal(sorted[0].uri, 'file:///p/libA.pbl/x.sru');
  });

  test('preferencia al proyecto del archivo activo', () => {
    const state = new WorkspaceState();
    state.addTopologyEntry({
      kind: 'target',
      data: { uri: 'file:///p/main.pbt', name: 'main', libraries: ['file:///p/libA.pbl'] }
    });
    state.addTopologyEntry({
      kind: 'target',
      data: { uri: 'file:///p/extra.pbt', name: 'extra', libraries: ['file:///p/libB.pbl'] }
    });
    state.setProjectModel(buildUnifiedProjectModel(state.getTopology(), [
      'file:///p/libA.pbl/x.sru',
      'file:///p/libB.pbl/x.sru'
    ]));

    const candidates = [
      makeEntity('file:///p/libB.pbl/x.sru'),
      makeEntity('file:///p/libA.pbl/x.sru')
    ];
    const sorted = resolveByLibraryOrder(candidates, {
      activeUri: 'file:///p/libB.pbl/y.sru',
      state
    });
    assert.equal(sorted[0].uri, 'file:///p/libB.pbl/x.sru');
  });

  test('candidato único se devuelve sin cambios', () => {
    const state = new WorkspaceState();
    const candidates = [makeEntity('file:///x.sru')];
    const sorted = resolveByLibraryOrder(candidates, { activeUri: null, state });
    assert.equal(sorted.length, 1);
  });
});
