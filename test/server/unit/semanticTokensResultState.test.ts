import * as assert from 'assert/strict';

import { SemanticTokensResultState } from '../../../src/server/features/semanticTokensResultState';

suite('unit/semanticTokensResultState', () => {
  let state: SemanticTokensResultState;

  setup(() => {
    state = new SemanticTokensResultState();
  });

  test('store retorna resultId no vacío', () => {
    const id = state.store('file:///a.sru', 1, 'fp1', 0, [1, 2, 3]);
    assert.ok(id.length > 0);
  });

  test('get recupera entrada almacenada', () => {
    const rid = state.store('file:///a.sru', 1, 'fp1', 0, [1, 2, 3]);
    const entry = state.get('file:///a.sru', rid);
    assert.ok(entry);
    assert.deepEqual([...entry.data], [1, 2, 3]);
  });

  test('get retorna undefined para resultId incorrecto', () => {
    state.store('file:///a.sru', 1, 'fp1', 0, [1]);
    assert.equal(state.get('file:///a.sru', 'bad-id'), undefined);
  });

  test('get retorna undefined cuando URI no coincide', () => {
    const rid = state.store('file:///a.sru', 1, 'fp1', 0, [1]);
    assert.equal(state.get('file:///b.sru', rid), undefined);
  });

  test('isCompatible retorna true para parámetros iguales', () => {
    const rid = state.store('file:///a.sru', 2, 'fp2', 5, [1, 2], {
      sourceOrigin: 'pbl-folder-source',
      legendVersion: 'legend-v1',
    });
    const entry = state.get('file:///a.sru', rid)!;
    assert.ok(state.isCompatible(entry, 2, 'fp2', 5, {
      sourceOrigin: 'pbl-folder-source',
      legendVersion: 'legend-v1',
    }));
  });

  test('isCompatible retorna false si versión cambia', () => {
    const rid = state.store('file:///a.sru', 2, 'fp2', 5, [1, 2], {
      sourceOrigin: 'pbl-folder-source',
      legendVersion: 'legend-v1',
    });
    const entry = state.get('file:///a.sru', rid)!;
    assert.ok(!state.isCompatible(entry, 3, 'fp2', 5, {
      sourceOrigin: 'pbl-folder-source',
      legendVersion: 'legend-v1',
    }));
  });

  test('store conserva sourceOrigin, legendVersion y createdAt', () => {
    const rid = state.store('file:///a.sru', 2, 'fp2', 5, [1, 2], {
      sourceOrigin: 'pbl-folder-source',
      legendVersion: 'legend-v1',
    });
    const entry = state.get('file:///a.sru', rid)!;

    assert.equal(entry.sourceOrigin, 'pbl-folder-source');
    assert.equal(entry.legendVersion, 'legend-v1');
    assert.equal(typeof entry.createdAt, 'number');
    assert.ok(entry.createdAt > 0);
  });

  test('isCompatible retorna false si legendVersion cambia', () => {
    const rid = state.store('file:///a.sru', 2, 'fp2', 5, [1, 2], {
      sourceOrigin: 'pbl-folder-source',
      legendVersion: 'legend-v1',
    });
    const entry = state.get('file:///a.sru', rid)!;

    assert.ok(!state.isCompatible(entry, 2, 'fp2', 5, {
      sourceOrigin: 'pbl-folder-source',
      legendVersion: 'legend-v2',
    }));
  });

  test('evict elimina entradas del URI', () => {
    const rid = state.store('file:///a.sru', 1, 'fp1', 0, [1]);
    state.evict('file:///a.sru');
    assert.equal(state.get('file:///a.sru', rid), undefined);
  });

  test('clear vacía todas las entradas', () => {
    state.store('file:///a.sru', 1, 'fp1', 0, [1]);
    state.store('file:///b.sru', 1, 'fp1', 0, [2]);
    state.clear();
    assert.equal(state.get('file:///a.sru', state.computeResultId('file:///a.sru', 1, 'fp1', 0)), undefined);
  });

  test('getOrFull computa cuando no hay caché', () => {
    let called = false;
    const result = state.getOrFull('file:///a.sru', undefined, 1, 'fp1', 0, () => {
      called = true;
      return [10, 20];
    });
    assert.ok(called);
    assert.ok(result.wasFull);
    assert.deepEqual([...result.data], [10, 20]);
  });

  test('getOrFull devuelve caché cuando es compatible', () => {
    const rid = state.store('file:///a.sru', 1, 'fp1', 0, [10, 20]);
    let called = false;
    const result = state.getOrFull('file:///a.sru', rid, 1, 'fp1', 0, () => {
      called = true;
      return [99];
    });
    assert.ok(!called, 'no debe recalcular cuando hay caché compatible');
    assert.ok(!result.wasFull);
    assert.deepEqual([...result.data], [10, 20]);
  });

  test('resultId changes when payload changes even if fingerprint matches', () => {
    const first = state.store('file:///a.sru', 1, 'fp1', 0, [10, 20]);
    const second = state.store('file:///a.sru', 1, 'fp1', 0, [10, 21]);
    assert.notEqual(first, second);
  });

  test('resultId changes when legendVersion changes even if payload matches', () => {
    const first = state.store('file:///a.sru', 1, 'fp1', 0, [10, 20], {
      legendVersion: 'legend-v1',
    });
    const second = state.store('file:///a.sru', 1, 'fp1', 0, [10, 20], {
      legendVersion: 'legend-v2',
    });

    assert.notEqual(first, second);
  });

  test('evicción LRU respeta máximo de 100 entradas', () => {
    for (let i = 0; i < 105; i++) {
      state.store(`file:///f${i}.sru`, i, `fp${i}`, 0, [i]);
    }
    // Las primeras 5 deben haber sido desalojadas
    const firstId = state.computeResultId('file:///f0.sru', 0, 'fp0', 0);
    assert.equal(state.get('file:///f0.sru', firstId), undefined, 'entrada más antigua debe estar eviccionada');
  });
});
