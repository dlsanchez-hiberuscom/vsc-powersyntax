import * as assert from 'assert/strict';
import { formatHoverViewModel, formatUserHover } from '../../../src/server/features/hoverFormat';
import {
  buildLanguageHoverViewModel,
  buildPreformattedHoverViewModel,
  buildSystemHoverViewModel,
} from '../../../src/server/features/hoverViewModel';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
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
    assert.match(md, /Function/);
  });

  test('muestra external library', () => {
    const md = formatUserHover(fn({ isExternal: true, externalLibraryName: 'kernel32.dll' }));
    assert.match(md, /External function/);
    assert.match(md, /external\/native call/i);
  });

  test('muestra tipo y alias de dependencia nativa', () => {
    const md = formatUserHover(fn({
      isExternal: true,
      externalCallableKind: 'library',
      externalLibraryName: 'native_driver.pbx',
      externalDependencyKind: 'pbx',
      externalAlias: 'PBXEntry'
    }));

    assert.match(md, /External function/);
    assert.match(md, /external\/native call/i);
  });

  test('muestra etiqueta explícita para RPCFUNC', () => {
    const md = formatUserHover(fn({
      isExternal: true,
      externalCallableKind: 'rpcfunc',
      externalAlias: 'sp_update_customer'
    }));

    assert.match(md, /External function/);
    assert.match(md, /stored procedure declaration/i);
  });

  test('muestra container', () => {
    const md = formatUserHover(fn());
    assert.match(md, /Defined in:.*w_main/);
  });

  test('muestra herencia útil cuando existe', () => {
    const md = formatUserHover(fn({
      lineage: {
        sourceKind: 'document',
        authority: 'derived',
        phase: 'prototype',
        inheritedFrom: 'w_base',
        confidence: 'direct'
      }
    }));

    assert.match(md, /Inherited from:.*w_base/);
    assert.doesNotMatch(md, /Origen:/);
    assert.doesNotMatch(md, /Autoridad:/);
    assert.doesNotMatch(md, /Confianza:/);
  });

  test('solo muestra warnings de resolución cuando aportan valor', () => {
    const md = formatUserHover(fn(), { reasonCode: 'global-fallback', confidence: 'low' });
    assert.match(md, /workspace fallback/i);
    assert.doesNotMatch(md, /Confianza de resolución/);
    assert.doesNotMatch(md, /Motivo de resolución/);
  });

  test('muestra nota de ambiguedad cuando se aporta', () => {
    const md = formatUserHover(fn(), { ambiguous: true, targetCount: 2 });
    assert.match(md, /ambiguous target/i);
  });

  test('distingue la ambiguedad de global fallback cuando se aporta', () => {
    const md = formatUserHover(fn(), { ambiguous: true, ambiguityKind: 'global-fallback', targetCount: 2 });
    assert.match(md, /workspace fallback/i);
  });

  test('muestra contexto útil para locals sin metadata interna', () => {
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

    assert.match(md, /Local variable/);
    assert.match(md, /Scope:.*of_calc/);
    assert.doesNotMatch(md, /Declaration scope:/);
    assert.doesNotMatch(md, /Owner real:/);
    assert.doesNotMatch(md, /Callable contenedor:/);
    assert.doesNotMatch(md, /Container kind:/);
  });

  test('sanea la firma del callable visible cuando la cabecera viene contaminada por ;', () => {
    const md = formatUserHover({
      id: 'ls_sqlsyntax',
      name: 'ls_sqlsyntax',
      kind: EntityKind.Variable,
      uri: 'file:///x',
      line: 0,
      character: 0,
      datatype: 'string',
      containerName: 'w_main.pfc_values',
      declarationScope: 'local',
      containerKind: 'event',
      containerSignature: 'event pfc_values; call super::pfc_values()',
      fileObjectName: 'w_main'
    });

    assert.match(md, /Scope:.*event pfc_values/);
    assert.doesNotMatch(md, /call super::pfc_values/);
  });

  test('mantiene etiquetas útiles para on-handler y external function', () => {
    const onHandler = formatUserHover(fn({
      kind: EntityKind.Event,
      signature: 'on w_main.create',
      isPrototype: false
    }));
    const external = formatUserHover(fn({
      isExternal: true,
      externalLibraryName: 'kernel32.dll'
    }));

    assert.match(onHandler, /Event/);
    assert.match(external, /External function/);
  });

  test('renderiza markdown preformateado sin recomponer bloques', () => {
    const md = formatHoverViewModel(buildPreformattedHoverViewModel('datawindow-property', '**DataWindow**\n- Retrieve'));

    assert.equal(md, '**DataWindow**\n- Retrieve');
  });

  test('clasifica SQLCA como sql-symbol con riesgo visible', () => {
    const catalog = new SystemCatalog();
    const symbol = catalog.resolveSystemGlobal('SQLCA');

    assert.ok(symbol, 'SQLCA debe existir en el catálogo runtime.');
    const viewModel = buildSystemHoverViewModel(symbol, catalog, 'es');
    const md = formatHoverViewModel(viewModel);

    assert.equal(viewModel.kind, 'sql-symbol');
    assert.equal(viewModel.confidence, 'high');
    assert.match(md, /Riesgo de uso:/i);
    assert.match(md, /SQLCA/i);
  });

  test('expone categoría visible para símbolos de lenguaje', () => {
    const catalog = new SystemCatalog();
    const symbol = catalog.resolveLanguageSymbol('if');

    assert.ok(symbol, 'if debe existir como símbolo de lenguaje.');
    const viewModel = buildLanguageHoverViewModel(symbol, catalog, 'es');
    const md = formatHoverViewModel(viewModel);

    assert.equal(viewModel.confidence, 'high');
    assert.match(md, /Categoría:/i);
    assert.match(md, /if/i);
  });
});
