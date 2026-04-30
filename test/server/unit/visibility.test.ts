import * as assert from 'assert/strict';
import { parseVisibility, isAccessibleFrom } from '../../../src/server/knowledge/visibility';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';

function ent(access: string | undefined, owner: string | undefined): Entity {
  return {
    id: 'm',
    name: 'm',
    kind: EntityKind.Function,
    uri: 'file:///x',
    line: 0,
    character: 0,
    access,
    ownerName: owner
  };
}

suite('unit/visibility', () => {
  test('parseVisibility colapsa variantes', () => {
    assert.equal(parseVisibility('PROTECTEDREAD'), 'protected');
    assert.equal(parseVisibility('privatewrite'), 'private');
    assert.equal(parseVisibility('public'), 'public');
    assert.equal(parseVisibility(undefined), 'public');
  });

  test('public siempre accesible', () => {
    assert.equal(isAccessibleFrom(ent('public', 'A'), { contextOwner: 'B' }), true);
  });

  test('private solo mismo owner', () => {
    assert.equal(isAccessibleFrom(ent('private', 'A'), { contextOwner: 'a' }), true);
    assert.equal(isAccessibleFrom(ent('private', 'A'), { contextOwner: 'B' }), false);
  });

  test('protected respeta descendencia', () => {
    const isDescendant = (child: string, ancestor: string) =>
      child === 'b' && ancestor === 'a';
    assert.equal(
      isAccessibleFrom(ent('protected', 'A'), { contextOwner: 'B', isDescendant }),
      true
    );
    assert.equal(
      isAccessibleFrom(ent('protected', 'A'), { contextOwner: 'C', isDescendant }),
      false
    );
  });
});
