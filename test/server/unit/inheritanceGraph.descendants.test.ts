import * as assert from 'assert/strict';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/InheritanceGraph descendants (B058)', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);
    kb.beginBatchUpdate();
    kb.upsertDocument('file:///a.sru', [
      { id: 'a', name: 'A', kind: EntityKind.Type, uri: 'file:///a.sru', line: 0, character: 0 }
    ]);
    kb.upsertDocument('file:///b.sru', [
      { id: 'b', name: 'B', kind: EntityKind.Type, uri: 'file:///b.sru', line: 0, character: 0, baseTypeName: 'A' }
    ]);
    kb.upsertDocument('file:///c.sru', [
      { id: 'c', name: 'C', kind: EntityKind.Type, uri: 'file:///c.sru', line: 0, character: 0, baseTypeName: 'B' }
    ]);
    kb.endBatchUpdate();
  });

  test('getDirectDescendants', () => {
    assert.deepEqual(graph.getDirectDescendants('A').map((s) => s.toLowerCase()), ['b']);
    assert.deepEqual(graph.getDirectDescendants('B').map((s) => s.toLowerCase()), ['c']);
    assert.deepEqual(graph.getDirectDescendants('C'), []);
  });

  test('getDescendants transitivo', () => {
    const descA = graph.getDescendants('A').map((s) => s.toLowerCase()).sort();
    assert.deepEqual(descA, ['b', 'c']);
  });

  test('isDescendantOf', () => {
    assert.equal(graph.isDescendantOf('C', 'A'), true);
    assert.equal(graph.isDescendantOf('B', 'A'), true);
    assert.equal(graph.isDescendantOf('A', 'C'), false);
    assert.equal(graph.isDescendantOf('A', 'A'), false);
  });
});
