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

  test('muestra tipo y alias de dependencia nativa', () => {
    const md = formatUserHover(fn({
      isExternal: true,
      externalLibraryName: 'native_driver.pbx',
      externalDependencyKind: 'pbx',
      externalAlias: 'PBXEntry'
    }));

    assert.match(md, /pbx/);
    assert.match(md, /PBXEntry/);
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

  test('muestra confidence general de resolucion cuando se aporta', () => {
    const md = formatUserHover(fn(), { confidence: 'high' });
    assert.match(md, /Confianza de resolución:\* high/);
  });

  test('muestra reason code principal cuando se aporta', () => {
    const md = formatUserHover(fn(), { reasonCode: 'member-hierarchy' });
    assert.match(md, /Motivo de resolución:\* member-hierarchy/);
  });

  test('muestra nota de ambiguedad cuando se aporta', () => {
    const md = formatUserHover(fn(), { ambiguous: true, targetCount: 2 });
    assert.match(md, /Resolución ambigua:\* 2 candidatos con distancia mínima/);
  });

  test('distingue la ambiguedad de global fallback cuando se aporta', () => {
    const md = formatUserHover(fn(), { ambiguous: true, ambiguityKind: 'global-fallback', targetCount: 2 });
    assert.match(md, /Resolución ambigua:\* 2 candidatos ganadores por global fallback/);
  });

  test('muestra el numero de candidatos ganadores cuando se aporta', () => {
    const md = formatUserHover(fn(), { targetCount: 2 });
    assert.match(md, /Candidatos ganadores:\* 2/);
  });

  test('muestra metadata enriquecida de declarationScope, owner y callable contenedor', () => {
    const md = formatUserHover({
      id: 'li_total',
      name: 'li_total',
      kind: EntityKind.Variable,
      uri: 'file:///x',
      line: 0,
      character: 0,
      datatype: 'integer',
      containerName: 'w_main.of_calc',
      declarationScope: 'local',
      containerKind: 'function',
      containerSignature: 'public function integer of_calc (string as_name)',
      fileObjectName: 'w_main'
    });

    assert.match(md, /Declaration scope:\* local/);
    assert.match(md, /Owner real:.*w_main/);
    assert.match(md, /Callable contenedor:.*of_calc/);
    assert.match(md, /Container kind:\* function/);
  });

  test('muestra on-handler y external function con etiquetas específicas', () => {
    const onHandler = formatUserHover(fn({
      kind: EntityKind.Event,
      signature: 'on w_main.create',
      isPrototype: false
    }));
    const external = formatUserHover(fn({
      isExternal: true,
      externalLibraryName: 'kernel32.dll'
    }));

    assert.match(onHandler, /On-handler/);
    assert.match(external, /External function declaration/);
  });
});
