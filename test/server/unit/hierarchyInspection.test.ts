import * as assert from 'assert/strict';

import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { EntityKind } from '../../../src/server/knowledge/types';
import { buildHierarchyInspection } from '../../../src/server/features/hierarchyInspection';

suite('unit/hierarchyInspection (B065)', () => {
  test('expone ancestro inmediato, arbol y overrides heredados', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);

    kb.beginBatchUpdate();
    kb.upsertDocument('file:///w_base.srw', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base.srw', line: 0, character: 0, baseTypeName: 'window' },
      { id: 'base.of_init', name: 'of_init', kind: EntityKind.Function, uri: 'file:///w_base.srw', line: 5, character: 2, containerName: 'w_base', access: 'protected' }
    ]);
    kb.upsertDocument('file:///w_child.srw', [
      { id: 'w_child', name: 'w_child', kind: EntityKind.Type, uri: 'file:///w_child.srw', line: 0, character: 0, baseTypeName: 'w_base' },
      { id: 'child.of_init', name: 'of_init', kind: EntityKind.Function, uri: 'file:///w_child.srw', line: 7, character: 2, containerName: 'w_child' },
      { id: 'child.of_only', name: 'of_only', kind: EntityKind.Function, uri: 'file:///w_child.srw', line: 10, character: 2, containerName: 'w_child' }
    ]);
    kb.upsertDocument('file:///w_grandchild.srw', [
      { id: 'w_grandchild', name: 'w_grandchild', kind: EntityKind.Type, uri: 'file:///w_grandchild.srw', line: 0, character: 0, baseTypeName: 'w_child' }
    ]);
    kb.endBatchUpdate();

    const inspection = buildHierarchyInspection('w_child', graph);

    assert.equal(inspection.immediateAncestor, 'w_base');
    assert.deepEqual(inspection.ancestorChain, ['w_base', 'window']);
    assert.equal(inspection.hierarchyTree?.name, 'w_child');
    assert.deepEqual(inspection.hierarchyTree?.children.map((child) => child.name), ['w_grandchild']);
    assert.equal(inspection.overriddenMembers.length, 1);
    assert.equal(inspection.overriddenMembers[0].name, 'of_init');
    assert.equal(inspection.overriddenMembers[0].inheritedFrom, 'w_base');
    assert.equal(inspection.closureSummary.override, 1);
    assert.equal(inspection.closureSummary.own, 1);
  });
});