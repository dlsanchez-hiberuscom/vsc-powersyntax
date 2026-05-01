import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { createCacheCheckpoint } from '../../../src/server/cache/cacheCheckpoint';
import {
  buildWorkspaceCacheKey,
  createSemanticCacheStore
} from '../../../src/server/cache/cacheStore';
import type { ServingCacheEntry } from '../../../src/server/knowledge/ServingCache';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { fsPathToUri } from '../../../src/server/system/uriUtils';
import type { UnifiedProjectModel } from '../../../src/server/workspace/unifiedProjectModel';

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

  test('persistCheckpoint particiona checkpoints por proyecto y recompone el restore agregado', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const projectA = 'file:///workspace/project-a.pbt';
    const projectB = 'file:///workspace/project-b.pbt';
    const projectModel: UnifiedProjectModel = {
      getProjects() {
        return [
          { projectUri: projectA, kind: 'target', name: 'project-a', libraries: ['file:///workspace/project-a/'] },
          { projectUri: projectB, kind: 'target', name: 'project-b', libraries: ['file:///workspace/project-b/'] }
        ];
      },
      getProjectForFile(uri: string) {
        if (uri.startsWith('file:///workspace/project-a/')) {
          return { projectUri: projectA, kind: 'target', name: 'project-a', libraries: ['file:///workspace/project-a/'] };
        }
        if (uri.startsWith('file:///workspace/project-b/')) {
          return { projectUri: projectB, kind: 'target', name: 'project-b', libraries: ['file:///workspace/project-b/'] };
        }
        return null;
      },
      getLibrariesForFile(uri: string) {
        return this.getProjectForFile(uri)?.libraries ?? [];
      },
      getStats() {
        return { projects: 2, libraries: 2, orphanFiles: 1 };
      }
    };
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace'], projectModel);

    try {
      await store.persistCheckpoint(createCacheCheckpoint(5, [
        { uri: 'file:///workspace/project-a/u_a.sru', version: 'hash-a', facts: [], scopes: [] },
        { uri: 'file:///workspace/project-b/u_b.sru', version: 'hash-b', facts: [], scopes: [] },
        { uri: 'file:///workspace/orphans/u_orphan.sru', version: 'hash-o', facts: [], scopes: [] }
      ], {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace'],
        projectStats: projectModel.getStats()
      }));

      const restored = await store.load({
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace'],
        projectStats: projectModel.getStats()
      });

      assert.equal(restored.decision.action, 'reuse');
      assert.equal(restored.checkpoint.documents.length, 3);

      const persistedRoot = path.join(tempRoot, store.workspaceKey);
      const partitions = await fs.readdir(path.join(persistedRoot, 'projects'));
      assert.equal(partitions.length, 2);

      const workspaceCheckpoint = JSON.parse(
        await fs.readFile(path.join(persistedRoot, 'semantic-checkpoint.json'), 'utf8')
      ) as { documents: Array<{ uri: string }> };
      assert.deepEqual(workspaceCheckpoint.documents.map((document) => document.uri), ['file:///workspace/orphans/u_orphan.sru']);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('appendJournalMutation particiona journal por proyecto y mantiene restore agregado', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const projectA = 'file:///workspace/project-a.pbt';
    const projectB = 'file:///workspace/project-b.pbt';
    const projectModel: UnifiedProjectModel = {
      getProjects() {
        return [
          { projectUri: projectA, kind: 'target', name: 'project-a', libraries: ['file:///workspace/project-a/'] },
          { projectUri: projectB, kind: 'target', name: 'project-b', libraries: ['file:///workspace/project-b/'] }
        ];
      },
      getProjectForFile(uri: string) {
        if (uri.startsWith('file:///workspace/project-a/')) {
          return { projectUri: projectA, kind: 'target', name: 'project-a', libraries: ['file:///workspace/project-a/'] };
        }
        if (uri.startsWith('file:///workspace/project-b/')) {
          return { projectUri: projectB, kind: 'target', name: 'project-b', libraries: ['file:///workspace/project-b/'] };
        }
        return null;
      },
      getLibrariesForFile(uri: string) {
        return this.getProjectForFile(uri)?.libraries ?? [];
      },
      getStats() {
        return { projects: 2, libraries: 2, orphanFiles: 1 };
      }
    };
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace'], projectModel);

    try {
      const metadata = {
        workspaceMode: 'workspace' as const,
        rootUris: ['file:///workspace'],
        projectStats: projectModel.getStats()
      };

      await store.persistCheckpoint(createCacheCheckpoint(5, [
        { uri: 'file:///workspace/project-a/u_a.sru', version: 'hash-a', facts: [], scopes: [] },
        { uri: 'file:///workspace/project-b/u_b.sru', version: 'hash-b', facts: [], scopes: [] },
        { uri: 'file:///workspace/orphans/u_orphan.sru', version: 'hash-o', facts: [], scopes: [] }
      ], metadata));

      await store.appendJournalMutation({
        semanticEpoch: 6,
        kind: 'remove',
        uris: ['file:///workspace/project-a/u_a.sru']
      });
      await store.appendJournalMutation({
        semanticEpoch: 7,
        kind: 'upsert',
        uris: ['file:///workspace/project-b/u_b_2.sru'],
        documents: [{ uri: 'file:///workspace/project-b/u_b_2.sru', version: 'hash-b2', facts: [], scopes: [] }]
      });
      await store.appendJournalMutation({
        semanticEpoch: 8,
        kind: 'remove',
        uris: ['file:///workspace/orphans/u_orphan.sru']
      });

      const restored = await store.load(metadata);

      assert.equal(restored.decision.action, 'reuse');
      assert.equal(restored.checkpoint.semanticEpoch, 8);
      assert.deepEqual(
        restored.checkpoint.documents.map((document) => document.uri).sort(),
        ['file:///workspace/project-b/u_b.sru', 'file:///workspace/project-b/u_b_2.sru']
      );

      const persistedRoot = path.join(tempRoot, store.workspaceKey);
      const manifest = JSON.parse(
        await fs.readFile(path.join(persistedRoot, 'project-partitions.json'), 'utf8')
      ) as { partitions: Array<{ projectUri: string; projectKey: string }> };
      const projectKeys = new Map(manifest.partitions.map((entry) => [entry.projectUri, entry.projectKey]));

      const workspaceJournal = JSON.parse(
        await fs.readFile(path.join(persistedRoot, 'semantic-journal.json'), 'utf8')
      ) as Array<{ uris: string[] }>;
      assert.deepEqual(workspaceJournal.map((entry) => entry.uris), [['file:///workspace/orphans/u_orphan.sru']]);

      const projectAJournal = JSON.parse(
        await fs.readFile(path.join(persistedRoot, 'projects', projectKeys.get(projectA)!, 'semantic-journal.json'), 'utf8')
      ) as Array<{ uris: string[] }>;
      assert.deepEqual(projectAJournal.map((entry) => entry.uris), [['file:///workspace/project-a/u_a.sru']]);

      const projectBJournal = JSON.parse(
        await fs.readFile(path.join(persistedRoot, 'projects', projectKeys.get(projectB)!, 'semantic-journal.json'), 'utf8')
      ) as Array<{ uris: string[] }>;
      assert.deepEqual(projectBJournal.map((entry) => entry.uris), [['file:///workspace/project-b/u_b_2.sru']]);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('persistServingCacheSnapshot guarda y restaura snapshots válidos de ServingCache', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);
    const snapshot: ServingCacheEntry<{ label: string }>[] = [
      { key: 'hover|file:///a.sru|1|2|5|', value: { label: 'A' } },
      { key: 'definition|file:///b.sru|3|1|5|', value: { label: 'B' } }
    ];

    try {
      await store.persistServingCacheSnapshot(snapshot);

      const restored = await store.loadServingCacheSnapshot<{ label: string }>();
      assert.deepEqual(restored, snapshot);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('loadServingCacheSnapshot degrada a vacío ante payload inválido', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);

    try {
      const persistedRoot = path.join(tempRoot, store.workspaceKey);
      await fs.mkdir(persistedRoot, { recursive: true });
      await fs.writeFile(
        path.join(persistedRoot, 'serving-cache.json'),
        JSON.stringify({ schemaVersion: 999, entries: 'invalid' }),
        'utf8'
      );

      const restored = await store.loadServingCacheSnapshot<{ label: string }>();
      assert.deepEqual(restored, []);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });
});