import * as assert from 'assert/strict';
import { formatUserHover } from '../../../src/server/features/hoverFormat';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';

function fn(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'f',
    name: 'of_test',
    kind: EntityKind.Function,
    uri: 'file:///x',
    line: 0,
    character: 0,
    signature: 'public function integer of_test()',
    access: 'public',
    containerName: 'w_main',
    ...overrides
  };
}

suite('unit/hoverFormat (B103)', () => {
  test('muestra prototype tag', () => {
    const md = formatUserHover(fn({ isPrototype: true }));
    assert.match(md, /Prototype/);
  });

  test('muestra implementation tag', () => {
    const md = formatUserHover(fn({ isPrototype: false }));
    assert.match(md, /Implementation/);
  });

  test('muestra external library', () => {
    const md = formatUserHover(fn({ isExternal: true, externalLibraryName: 'kernel32.dll' }));
    assert.match(md, /kernel32\.dll/);
  });

  test('muestra container', () => {
    const md = formatUserHover(fn());
    assert.match(md, /w_main/);
  });

  test('muestra lineage mínimo cuando existe', () => {
    const md = formatUserHover(fn({
      lineage: {
        sourceKind: 'document',
        authority: 'derived',
        phase: 'prototype',
        confidence: 'direct'
      }
    }));

    assert.match(md, /Origen:\* document/);
    assert.match(md, /Autoridad:\* derived/);
    assert.match(md, /Confianza:\* direct/);
  });
});
