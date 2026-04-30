import * as assert from 'assert/strict';
import { sortByScore } from '../../../src/server/features/completionScoring';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';

function ent(name: string, owner?: string): Entity {
  return {
    id: name.toLowerCase(),
    name,
    kind: EntityKind.Function,
    uri: 'file:///x',
    line: 0,
    character: 0,
    containerName: owner,
    ownerName: owner,
    access: 'public'
  };
}

suite('unit/completionScoringSanity (B061)', () => {
  test('miembro propio queda antes que global', () => {
    const me = ent('of_local', 'w_main');
    const global = ent('gf_log');
    const sorted = sortByScore([global, me], { currentType: 'w_main' });
    assert.equal(sorted[0].name, 'of_local');
  });

  test('local supera a miembro propio', () => {
    const localName = ent('loc_x', 'w_main');
    const member = ent('of_member', 'w_main');
    const sorted = sortByScore([member, localName], {
      currentType: 'w_main',
      locals: new Set(['loc_x'])
    });
    assert.equal(sorted[0].name, 'loc_x');
  });
});
