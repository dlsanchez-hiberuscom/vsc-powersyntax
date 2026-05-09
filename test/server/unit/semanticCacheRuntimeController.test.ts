import * as assert from 'assert/strict';

import { createCacheCheckpoint } from '../../../src/server/cache/cacheCheckpoint';
import { createSemanticCacheRuntimeController } from '../../../src/server/cache/semanticCacheRuntimeController';
import type { SemanticCacheCheckpoint, SemanticCacheDocumentRecord } from '../../../src/server/cache/cacheSchema';

suite('unit/semanticCacheRuntimeController', () => {
  test('serializa appendUpsert, appendRemove y persistCheckpoint en orden estable', async () => {
    const started: string[] = [];
    const finished: string[] = [];

    const controller = createSemanticCacheRuntimeController({} as never, () => 7, () => ({ rootUris: ['file:///workspace'] }));
    controller.setCacheStore({
      retentionPolicy: { maxPendingMutations: 999 },
      getStats() {
        return { pendingMutations: 0, autoCompactions: 0 };
      },
      async appendJournalMutation(entry: { kind: string; uris: string[] }) {
        const label = `${entry.kind}:${entry.uris.join(',')}`;
        started.push(label);
        await delay(label.startsWith('upsert') ? 20 : 5);
        finished.push(label);
      },
      async persistCheckpoint(checkpoint: SemanticCacheCheckpoint) {
        const label = `checkpoint:${checkpoint.semanticEpoch}`;
        started.push(label);
        await delay(1);
        finished.push(label);
      },
      async persistServingCacheSnapshot() {
        started.push('serving-snapshot');
        finished.push('serving-snapshot');
      },
      async loadServingCacheSnapshot() {
        return [];
      },
      async load() {
        throw new Error('not used');
      },
      async saveSnapshot() {
        throw new Error('not used');
      },
      async inspectMaintenance() {
        throw new Error('not used');
      },
      async runMaintenance() {
        return { compacted: false, droppedEntries: 0, pendingMutations: 0, reason: 'below-threshold' } as never;
      },
      async clear() {
        throw new Error('not used');
      },
      storageUri: 'file:///storage',
      checkpointUri: 'file:///storage/semantic-checkpoint.json',
      journalUri: 'file:///storage/semantic-journal.json',
      workspaceKey: 'workspace',
    } as never);

    const record: SemanticCacheDocumentRecord = {
      uri: 'file:///workspace/u_demo.sru',
      version: 'hash-a',
      facts: [],
      scopes: [],
    };

    const first = controller.appendUpsert(record, 1) as Promise<void>;
    const second = controller.appendRemove(record.uri, 2) as Promise<void>;
    const third = controller.persistCheckpoint(createCacheCheckpoint(3, [record], { rootUris: ['file:///workspace'] }));

    await Promise.all([first, second, third]);

    assert.deepEqual(started, [
      'upsert:file:///workspace/u_demo.sru',
      'remove:file:///workspace/u_demo.sru',
      'checkpoint:3',
    ]);
    assert.deepEqual(finished, started);
  });

  test('flushPersistenceWrites espera a que termine la cola activa', async () => {
    const controller = createSemanticCacheRuntimeController({} as never, () => 3, () => ({ rootUris: ['file:///workspace'] }));
    let completed = false;

    controller.setCacheStore({
      retentionPolicy: { maxPendingMutations: 999 },
      getStats() {
        return { pendingMutations: 0, autoCompactions: 0 };
      },
      async appendJournalMutation() {
        await delay(10);
        completed = true;
      },
      async persistCheckpoint() {
        throw new Error('not used');
      },
      async persistServingCacheSnapshot() {
        return;
      },
      async loadServingCacheSnapshot() {
        return [];
      },
      async load() {
        throw new Error('not used');
      },
      async saveSnapshot() {
        throw new Error('not used');
      },
      async inspectMaintenance() {
        throw new Error('not used');
      },
      async runMaintenance() {
        return { compacted: false, droppedEntries: 0, pendingMutations: 0, reason: 'below-threshold' } as never;
      },
      async clear() {
        throw new Error('not used');
      },
      storageUri: 'file:///storage',
      checkpointUri: 'file:///storage/semantic-checkpoint.json',
      journalUri: 'file:///storage/semantic-journal.json',
      workspaceKey: 'workspace',
    } as never);

    void controller.appendRemove('file:///workspace/u_demo.sru', 1);
    await controller.flushPersistenceWrites();

    assert.equal(completed, true);
  });
});

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}