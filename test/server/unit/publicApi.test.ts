import * as assert from 'assert/strict';
import { PUBLIC_API_VERSION, isApiVersionCompatible, toApiSymbol } from '../../../src/shared/publicApi';

suite('unit/publicApi (B109)', () => {
  test('versión exportada', () => {
    assert.match(PUBLIC_API_VERSION, /^\d+\.\d+\.\d+$/);
  });

  test('major igual ⇒ compatible', () => {
    const major = PUBLIC_API_VERSION.split('.')[0];
    assert.equal(isApiVersionCompatible(`${major}.0.0`), true);
    assert.equal(isApiVersionCompatible(`${major}.99.7`), true);
  });

  test('major distinto ⇒ incompatible', () => {
    assert.equal(isApiVersionCompatible('99.0.0'), false);
  });

  test('valor inválido ⇒ incompatible', () => {
    assert.equal(isApiVersionCompatible('abc'), false);
  });

  test('toApiSymbol preserva lineage mínimo estable', () => {
    const symbol = toApiSymbol({
      name: 'of_SetData',
      kind: 'Function',
      uri: 'file:///w_main.sru',
      line: 10,
      character: 4,
      lineage: {
        sourceKind: 'document',
        authority: 'derived',
        phase: 'implementation',
        confidence: 'direct'
      }
    });

    assert.deepEqual(symbol, {
      name: 'of_SetData',
      kind: 'Function',
      uri: 'file:///w_main.sru',
      line: 10,
      character: 4,
      lineage: {
        sourceKind: 'document',
        authority: 'derived',
        phase: 'implementation',
        confidence: 'direct'
      }
    });
  });

  test('toApiSymbol omite lineage vacío', () => {
    const symbol = toApiSymbol({
      name: 'of_SetData',
      kind: 'Function',
      uri: 'file:///w_main.sru',
      line: 10,
      character: 4,
      lineage: {}
    });

    assert.deepEqual(symbol, {
      name: 'of_SetData',
      kind: 'Function',
      uri: 'file:///w_main.sru',
      line: 10,
      character: 4
    });
  });
});
