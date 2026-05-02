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

  test('normaliza lineage mínimo cuando falta', () => {
    const e: Entity = {
      id: 'foo',
      name: 'foo',
      kind: EntityKind.Function,
      uri: 'file:///x.sru',
      line: 0,
      character: 0,
      isPrototype: true,
      baseTypeName: 'window'
    };

    assert.deepEqual(enrichEntity(e).lineage, {
      sourceKind: 'document',
      authority: 'derived',
      phase: 'prototype',
      role: 'prototype',
      inheritedFrom: 'window',
      confidence: 'direct'
    });
  });

  test('preserva lineage explícito del caller', () => {
    const e: Entity = {
      id: 'foo',
      name: 'foo',
      kind: EntityKind.Function,
      uri: 'file:///x.sru',
      line: 0,
      character: 0,
      lineage: {
        sourceKind: 'system',
        authority: 'official',
        phase: 'implementation',
        role: 'override',
        inheritedFrom: 'powerobject',
        confidence: 'fallback'
      }
    };

    assert.deepEqual(enrichEntity(e).lineage, e.lineage);
  });

  test('deriva owner real para locals y parameters desde el callable container', () => {
    const local: Entity = {
      id: 'li_total',
      name: 'li_total',
      kind: EntityKind.Variable,
      uri: 'file:///x.sru',
      line: 0,
      character: 0,
      containerName: 'w_main.of_calc',
      declarationScope: 'local'
    };

    const parameter: Entity = {
      id: 'as_name',
      name: 'as_name',
      kind: EntityKind.Variable,
      uri: 'file:///x.sru',
      line: 0,
      character: 0,
      containerName: 'w_main.of_calc',
      declarationScope: 'parameter'
    };

    assert.equal(enrichEntity(local).ownerName, 'w_main');
    assert.equal(enrichEntity(parameter).ownerName, 'w_main');
  });

  test('distingue on-handler y external-function en implementationKind', () => {
    const onHandler: Entity = {
      id: 'w_main.create',
      name: 'w_main.create',
      kind: EntityKind.Event,
      uri: 'file:///x.sru',
      line: 0,
      character: 0,
      signature: 'on w_main.create'
    };

    const externalFn: Entity = {
      id: 'of_external',
      name: 'of_external',
      kind: EntityKind.Function,
      uri: 'file:///x.sru',
      line: 0,
      character: 0,
      isExternal: true
    };

    assert.equal(enrichEntity(onHandler).implementationKind, 'on-handler');
    assert.equal(enrichEntity(externalFn).implementationKind, 'external-function');
  });
});
