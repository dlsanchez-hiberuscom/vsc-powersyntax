import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { createCacheCheckpoint } from '../../../src/server/cache/cacheCheckpoint';
import {
  buildWorkspaceCacheKey,
  createSemanticCacheStore
} from '../../../src/server/cache/cacheStore';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { fsPathToUri } from '../../../src/server/system/uriUtils';

suite('unit/cacheStore', () => {
  test('workspace key es estable sin depender del orden de roots', () => {
    const a = buildWorkspaceCacheKey(['file:///B', 'file:///A']);
    const b = buildWorkspaceCacheKey(['file:///a', 'file:///b']);

    assert.equal(a, b);
  });

  test('persistCheckpoint guarda estado reutilizable y limpia journal', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);

    try {
      await store.appendJournalMutation({ semanticEpoch: 2, kind: 'remove', uris: ['file:///a.sru'] });
      await store.persistCheckpoint(createCacheCheckpoint(3, [{ uri: 'file:///a.sru', version: 'hash-a', facts: [], scopes: [] }], {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      }));

      const restored = await store.load({
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      });

      assert.equal(restored.decision.action, 'reuse');
      assert.equal(restored.checkpoint.documents.length, 1);
      assert.equal(restored.checkpoint.documents[0].version, 'hash-a');
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('load aplica journal compatible sobre el checkpoint', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);

    try {
      await store.persistCheckpoint(createCacheCheckpoint(3, [{ uri: 'file:///a.sru', version: 'hash-a', facts: [], scopes: [] }], {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      }));
      await store.appendJournalMutation({
        semanticEpoch: 4,
        kind: 'upsert',
        uris: ['file:///b.sru'],
        documents: [{ uri: 'file:///b.sru', version: 'hash-b', facts: [], scopes: [] }]
      });

      const restored = await store.load({
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      });

      assert.equal(restored.decision.action, 'reuse');
      assert.equal(restored.checkpoint.semanticEpoch, 4);
      assert.equal(restored.checkpoint.documents.length, 2);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });
});