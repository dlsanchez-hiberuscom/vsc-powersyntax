import * as assert from 'assert/strict';
import { buildSymbolKey, dedupeBySymbolKey } from '../../../src/server/knowledge/symbolKey';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';

function fn(name: string, container?: string, parameters: { label: string }[] = []): Entity {
  return {
    id: name.toLowerCase(),
    name,
    kind: EntityKind.Function,
    uri: 'file:///x',
    line: 0,
    character: 0,
    containerName: container,
    parameters
  };
}

suite('unit/symbolKey (B101)', () => {
  test('claves distintas para mismo nombre en distintos containers', () => {
    const a = fn('of_setdata', 'w_base');
    const b = fn('of_setdata', 'w_main');
    assert.notEqual(buildSymbolKey(a), buildSymbolKey(b));
  });

  test('dedupe colapsa duplicados estructurales', () => {
    const a = fn('of_setdata', 'w_base');
    const b = fn('of_setdata', 'w_base');
    assert.equal(dedupeBySymbolKey([a, b]).length, 1);
  });

  test('aridad afecta clave', () => {
    const a = fn('foo', 'w', [{ label: 'a' }]);
    const b = fn('foo', 'w', [{ label: 'a' }, { label: 'b' }]);
    assert.notEqual(buildSymbolKey(a), buildSymbolKey(b));
  });
});
