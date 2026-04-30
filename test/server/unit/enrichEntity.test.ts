import * as assert from 'assert/strict';
import { enrichEntity } from '../../../src/server/knowledge/enrichEntity';
import { EntityKind, type Entity } from '../../../src/server/knowledge/types';

suite('unit/enrichEntity', () => {
  test('deriva parameterCount, ownerName e implementationKind', () => {
    const e: Entity = {
      id: 'foo',
      name: 'foo',
      kind: EntityKind.Function,
      uri: 'file:///x.sru',
      line: 0,
      character: 0,
      containerName: 'w_main',
      parameters: [{ label: 'a' }, { label: 'b' }]
    };
    const enriched = enrichEntity(e);
    assert.equal(enriched.parameterCount, 2);
    assert.equal(enriched.ownerName, 'w_main');
    assert.equal(enriched.implementationKind, 'function');
  });

  test('respeta valores ya presentes', () => {
    const e: Entity = {
      id: 'x',
      name: 'x',
      kind: EntityKind.Variable,
      uri: 'file:///x.sru',
      line: 0,
      character: 0,
      ownerName: 'custom',
      parameterCount: 99,
      implementationKind: 'instance-var'
    };
    const enriched = enrichEntity(e);
    assert.equal(enriched.parameterCount, 99);
    assert.equal(enriched.ownerName, 'custom');
    assert.equal(enriched.implementationKind, 'instance-var');
  });

  test('variable Instancia → instance-var', () => {
    const e: Entity = {
      id: 'iv',
      name: 'iv',
      kind: EntityKind.Variable,
      uri: 'file:///x.sru',
      line: 0,
      character: 0,
      scope: 'Instancia'
    };
    assert.equal(enrichEntity(e).implementationKind, 'instance-var');
  });
});
