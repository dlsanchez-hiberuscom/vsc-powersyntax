import * as assert from 'assert/strict';
import { sortByScore } from '../../../src/server/features/completionScoring';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';

function ent(name: string, container?: string, access?: string): Entity {
  return {
    id: name.toLowerCase(),
    name,
    kind: EntityKind.Function,
    uri: 'file:///x',
    line: 0,
    character: 0,
    containerName: container,
    access
  };
}

suite('unit/completionScoring (B061)', () => {
  test('local > miembro > global', () => {
    const local = ent('foo');
    const member = ent('bar', 'w_main');
    const global = ent('baz');
    const sorted = sortByScore([global, member, local], {
      currentType: 'w_main',
      locals: new Set(['foo'])
    });
    assert.deepEqual(sorted.map((e) => e.name), ['foo', 'bar', 'baz']);
  });

  test('miembro propio gana a heredado', () => {
    const own = ent('m', 'w_main');
    const ancestor = ent('m', 'w_base');
    const sorted = sortByScore([ancestor, own], {
      currentType: 'w_main',
      typeDistance: (t) => (t === 'w_base' ? 1 : Number.POSITIVE_INFINITY)
    });
    assert.equal(sorted[0].containerName, 'w_main');
  });

  test('privado de otro owner se descarta', () => {
    const priv = ent('m', 'w_other', 'private');
    const sorted = sortByScore([priv], { currentType: 'w_main' });
    assert.equal(sorted.length, 0);
  });
});
