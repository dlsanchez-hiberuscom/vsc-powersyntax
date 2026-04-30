import * as assert from 'assert/strict';
import { buildHierarchyTree } from '../../../src/server/features/hierarchyTree';

suite('unit/hierarchyTree (B137)', () => {
  const map: Record<string, string[]> = {
    window: ['w_a', 'w_b'],
    w_a: ['w_a1'],
    w_b: [],
    w_a1: []
  };

  test('construye árbol', () => {
    const t = buildHierarchyTree('window', (n) => map[n.toLowerCase()] ?? []);
    assert.equal(t.children.length, 2);
    assert.equal(t.children[0].children[0].name, 'w_a1');
  });

  test('ciclo no produce loop', () => {
    const cyc: Record<string, string[]> = { a: ['b'], b: ['a'] };
    const t = buildHierarchyTree('a', (n) => cyc[n]);
    assert.ok(t.children.length === 1);
  });
});
