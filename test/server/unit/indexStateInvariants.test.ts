import * as assert from 'assert/strict';

import {
  IndexStateInvariants,
  IndexStateInvariantError,
  ALLOWED_TRANSITIONS,
  PersistenceWriteQueue,
  type IndexStateSnapshot,
  type IndexingPhase,
} from '../../../src/server/workspace/indexStateInvariants';

function makeSnapshot(phase: IndexingPhase, publishedSnapshotVersion = 0): IndexStateSnapshot {
  return {
    phase,
    epoch: 1,
    fingerprintMap: new Map(),
    publishedSnapshotVersion,
  };
}

suite('unit/indexStateInvariants', () => {
  suite('ALLOWED_TRANSITIONS', () => {
    test('empty puede ir a discovering y restoring', () => {
      assert.ok(ALLOWED_TRANSITIONS['empty'].includes('discovering'));
      assert.ok(ALLOWED_TRANSITIONS['empty'].includes('restoring'));
    });

    test('indexed puede ir a dirty y discovering', () => {
      assert.ok(ALLOWED_TRANSITIONS['indexed'].includes('dirty'));
      assert.ok(ALLOWED_TRANSITIONS['indexed'].includes('discovering'));
    });
  });

  suite('IndexStateInvariants', () => {
    test('transición válida cambia la fase', () => {
      const inv = new IndexStateInvariants(makeSnapshot('empty'));
      inv.transition('discovering');
      assert.equal(inv.getSnapshot().phase, 'discovering');
    });

    test('transición inválida lanza IndexStateInvariantError', () => {
      const inv = new IndexStateInvariants(makeSnapshot('empty'));
      assert.throws(
        () => inv.transition('indexed'),
        (err: unknown) => err instanceof IndexStateInvariantError
      );
    });

    test('isCoherent retorna false para fase dirty', () => {
      const inv = new IndexStateInvariants(makeSnapshot('dirty'));
      assert.ok(!inv.isCoherent());
    });

    test('isCoherent retorna false para indexed con publishedSnapshotVersion 0', () => {
      const inv = new IndexStateInvariants(makeSnapshot('indexed', 0));
      assert.ok(!inv.isCoherent());
    });

    test('isCoherent retorna true para indexed con version > 0', () => {
      const inv = new IndexStateInvariants(makeSnapshot('indexed', 1));
      assert.ok(inv.isCoherent());
    });

    test('markDirty actualiza fingerprint y cambia fase a dirty', () => {
      const inv = new IndexStateInvariants(makeSnapshot('indexed', 1));
      inv.markDirty('file:///a.sru', 'fp-new');
      assert.equal(inv.getSnapshot().phase, 'dirty');
      assert.equal(inv.getSnapshot().fingerprintMap.get('file:///a.sru'), 'fp-new');
    });

    test('assertCanRestore retorna true cuando fingerprints coinciden', () => {
      const snap = makeSnapshot('indexed', 1);
      snap.fingerprintMap.set('file:///a.sru', 'fp1');
      const inv = new IndexStateInvariants(snap);
      const fps = new Map([['file:///a.sru', 'fp1']]);
      assert.ok(inv.assertCanRestore(fps));
    });

    test('assertCanRestore retorna false cuando fingerprint difiere', () => {
      const snap = makeSnapshot('indexed', 1);
      snap.fingerprintMap.set('file:///a.sru', 'fp1');
      const inv = new IndexStateInvariants(snap);
      const fps = new Map([['file:///a.sru', 'fp-diferente']]);
      assert.ok(!inv.assertCanRestore(fps));
    });

    test('getSnapshot retorna copia inmutable del fingerprintMap', () => {
      const snap = makeSnapshot('empty');
      snap.fingerprintMap.set('file:///a.sru', 'fp1');
      const inv = new IndexStateInvariants(snap);
      const snapshot = inv.getSnapshot();
      // Modificar el mapa original no debe afectar al snapshot interno
      snap.fingerprintMap.set('file:///b.sru', 'fp2');
      assert.ok(!snapshot.fingerprintMap.has('file:///b.sru'));
    });
  });

  suite('PersistenceWriteQueue', () => {
    test('pendingCount empieza en 0', () => {
      const q = new PersistenceWriteQueue();
      assert.equal(q.pendingCount, 0);
    });

    test('enqueue ejecuta y reduce pendingCount', async () => {
      const q = new PersistenceWriteQueue();
      const p = q.enqueue('key', 'value');
      assert.ok(q.pendingCount >= 0);
      await p;
      assert.equal(q.pendingCount, 0);
    });

    test('flush se resuelve cuando no hay pendientes', async () => {
      const q = new PersistenceWriteQueue();
      await q.flush(); // no debe lanzar
    });

    test('flush espera a que todas las escrituras terminen', async () => {
      const q = new PersistenceWriteQueue();
      q.enqueue('k1', 'v1');
      q.enqueue('k2', 'v2');
      await q.flush();
      assert.equal(q.pendingCount, 0);
    });
  });
});
