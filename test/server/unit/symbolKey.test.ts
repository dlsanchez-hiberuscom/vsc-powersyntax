import * as assert from 'assert/strict';
import { buildSymbolKey, dedupeBySymbolKey } from '../../../src/server/knowledge/symbolKey';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';

function fn(
  name: string,
  container?: string,
  parameters: { label: string }[] = [],
  overrides: Partial<Entity> = {}
): Entity {
  return {
    id: name.toLowerCase(),
    name,
    kind: EntityKind.Function,
    uri: 'file:///x',
    line: 0,
    character: 0,
    containerName: container,
    parameters,
    ...overrides,
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

  test('sourceOrigin, uri y fileObjectName afectan la clave canónica', () => {
    const real = fn('of_setdata', 'w_main', [{ label: 'a' }], {
      uri: 'file:///proj/src/w_main.srw',
      fileObjectName: 'w_main',
      implementationKind: 'function',
      declarationScope: 'member',
      signature: 'of_setdata(integer a)',
      lineage: {
        sourceKind: 'document',
        sourceOrigin: 'solution-source',
        authority: 'derived',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'direct',
      },
    });
    const staged = fn('of_setdata', 'w_main', [{ label: 'a' }], {
      uri: 'file:///proj/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/w_main.srw',
      fileObjectName: 'w_main',
      implementationKind: 'function',
      declarationScope: 'member',
      signature: 'of_setdata(integer a)',
      lineage: {
        sourceKind: 'document',
        sourceOrigin: 'orca-staging',
        authority: 'derived',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'direct',
      },
    });

    assert.notEqual(buildSymbolKey(real), buildSymbolKey(staged));
  });

  test('dedupe no colapsa duplicados aparentes cuando cambia la identidad canónica', () => {
    const member = fn('of_setdata', 'w_main', [{ label: 'a' }], {
      uri: 'file:///proj/lib_app.pbl/w_main.srw',
      fileObjectName: 'w_main',
      implementationKind: 'function',
      declarationScope: 'member',
      signature: 'of_setdata(integer a)',
      lineage: {
        sourceKind: 'document',
        sourceOrigin: 'solution-source',
        authority: 'derived',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'direct',
      },
    });
    const sibling = fn('of_setdata', 'w_main', [{ label: 'a' }], {
      uri: 'file:///proj/lib_app.pbl/w_other.srw',
      fileObjectName: 'w_other',
      implementationKind: 'function',
      declarationScope: 'member',
      signature: 'of_setdata(integer a)',
      lineage: {
        sourceKind: 'document',
        sourceOrigin: 'solution-source',
        authority: 'derived',
        phase: 'implementation',
        role: 'implementation',
        confidence: 'direct',
      },
    });

    assert.equal(dedupeBySymbolKey([member, sibling]).length, 2);
  });
});
