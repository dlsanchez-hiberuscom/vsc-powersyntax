import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { createCacheCheckpoint } from '../../../src/server/cache/cacheCheckpoint';
import {
  buildWorkspaceCacheKey,
  createSemanticCacheStore
} from '../../../src/server/cache/cacheStore';
import type { SemanticCacheDocumentRecord } from '../../../src/server/cache/cacheSchema';
import type { ServingCacheEntry } from '../../../src/server/knowledge/ServingCache';
import { ScopeKind, type Scope } from '../../../src/server/knowledge/types';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { fsPathToUri } from '../../../src/server/system/uriUtils';
import { IndexStateInvariants } from '../../../src/server/workspace/indexStateInvariants';
import type { UnifiedProjectModel } from '../../../src/server/workspace/unifiedProjectModel';

function createCircularRecord(uri = 'file:///a.sru', version = 'hash-a'): SemanticCacheDocumentRecord {
  const rootScope: Scope = {
    id: 'global',
    kind: ScopeKind.Global,
    uri,
    startLine: 0,
    endLine: 20,
    children: [],
    symbols: []
  };
  const functionScope: Scope = {
    id: 'pfc_n_cst_dwsrv_dropdownsearch.of_register',
    kind: ScopeKind.Function,
    uri,
    startLine: 5,
    endLine: 12,
    parent: rootScope,
    children: [],
    symbols: []
  };
  rootScope.children.push(functionScope);

  return {
    uri,
    version,
    facts: [],
    scopes: [rootScope],
    snapshot: {
      uri,
      version: 1,
      fingerprint: 1,
      identity: `${uri}@1`,
      pass: 'enriched',
      readiness: 'nearby-semantic-ready',
      containerModel: {
        sections: [],
        typeBlocks: []
      },
      symbols: [],
      scopes: [rootScope],
      logicalStatements: [],
      maskedText: {
        lines: [],
        masks: []
      },
      controlBlocks: []
    }
  };
}

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

  test('serializa scopes circulares sin tumbar el journal y rehidrata parent al restaurar', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);
    const record = createCircularRecord('file:///workspace/pfc_n_cst_dwsrv_dropdownsearch.sru');

    try {
      await store.persistCheckpoint(createCacheCheckpoint(3, [record], {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      }));

      await store.appendJournalMutation({
        semanticEpoch: 4,
        kind: 'upsert',
        uris: [record.uri],
        documents: [record]
      });

      const restored = await store.load({
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      });

      assert.equal(restored.decision.action, 'reuse');
      assert.equal(restored.checkpoint.documents.length, 1);
      assert.equal(restored.checkpoint.documents[0].scopes[0].children[0].parent?.id, 'global');
      assert.equal(restored.checkpoint.documents[0].snapshot?.scopes[0].children[0].parent?.id, 'global');

      const persistedRoot = path.join(tempRoot, store.workspaceKey);
      const journalRaw = await fs.readFile(path.join(persistedRoot, 'semantic-journal.json'), 'utf8');
      assert.doesNotMatch(journalRaw, /"parent"\s*:/);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('restore de checkpoint soporta una transición restoring -> restored coherente', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);

    try {
      await store.persistCheckpoint(createCacheCheckpoint(5, [createCircularRecord('file:///restored.sru', 'hash-restored')], {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      }));

      const restored = await store.load({
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      });

      const invariants = new IndexStateInvariants({
        phase: 'empty',
        epoch: 0,
        fingerprintMap: new Map(),
        publishedSnapshotVersion: 0,
      });

      invariants.transition('restoring');
      invariants.transition('restored', {
        epoch: restored.checkpoint.semanticEpoch,
        fingerprintMap: new Map(restored.checkpoint.documents.map((document) => [document.uri, String(document.version ?? '')])),
        publishedSnapshotVersion: restored.checkpoint.semanticEpoch,
      });

      assert.equal(invariants.isCoherent(), true);
      assert.equal(
        invariants.assertCanRestore(new Map(restored.checkpoint.documents.map((document) => [document.uri, String(document.version ?? '')]))),
        true,
      );
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('load fuerza rebuild limpio si el checkpoint persistido esta truncado', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);

    try {
      const persistedRoot = path.join(tempRoot, store.workspaceKey);
      await fs.mkdir(persistedRoot, { recursive: true });
      await fs.writeFile(path.join(persistedRoot, 'semantic-checkpoint.json'), '{"schemaVersion":', 'utf8');

      const restored = await store.load({
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      });

      assert.equal(restored.decision.action, 'rebuild');
      assert.equal(restored.decision.reason, 'invalid-checkpoint-payload');
      assert.deepEqual(restored.checkpoint.documents, []);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('load fuerza rebuild limpio si el journal persistido esta corrupto', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);

    try {
      await store.persistCheckpoint(createCacheCheckpoint(3, [{ uri: 'file:///a.sru', version: 'hash-a', facts: [], scopes: [] }], {
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      }));

      const persistedRoot = path.join(tempRoot, store.workspaceKey);
      await fs.writeFile(path.join(persistedRoot, 'semantic-journal.json'), '[{"schemaVersion":1', 'utf8');

      const restored = await store.load({
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      });

      assert.equal(restored.decision.action, 'rebuild');
      assert.equal(restored.decision.reason, 'invalid-checkpoint-payload');
      assert.deepEqual(restored.checkpoint.documents, []);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('load limpia workspaces persistidos obsoletos por TTL', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);
    const staleRoot = path.join(tempRoot, 'obsolete-workspace-key');
    const staleCheckpoint = path.join(staleRoot, 'semantic-checkpoint.json');
    const expiredAt = Date.now() - store.retentionPolicy.staleWorkspaceTtlMs - 1000;

    try {
      await fs.mkdir(staleRoot, { recursive: true });
      await fs.writeFile(staleCheckpoint, JSON.stringify(createCacheCheckpoint(1, [], {
        workspaceMode: 'workspace',
        rootUris: ['file:///obsolete']
      })), 'utf8');
      await fs.utimes(staleCheckpoint, new Date(expiredAt), new Date(expiredAt));
      await fs.utimes(staleRoot, new Date(expiredAt), new Date(expiredAt));

      await store.load({
        workspaceMode: 'workspace',
        rootUris: ['file:///workspace']
      });

      await assert.rejects(() => fs.stat(staleRoot));
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
      getFilesForProject(projectUri: string) {
        if (projectUri === projectA) return ['file:///workspace/project-a/u_a.sru'];
        if (projectUri === projectB) return ['file:///workspace/project-b/u_b.sru'];
        return [];
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
      getFilesForProject(projectUri: string) {
        if (projectUri === projectA) return ['file:///workspace/project-a/u_a.sru'];
        if (projectUri === projectB) return ['file:///workspace/project-b/u_b.sru'];
        return [];
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

  test('checkpoint mantiene particiones distintas para proyectos homónimos en roots distintos', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const projectA = 'file:///workspace-a/app.pbt';
    const projectB = 'file:///workspace-b/app.pbt';
    const projectModel: UnifiedProjectModel = {
      getProjects() {
        return [
          { projectUri: projectA, kind: 'target', name: 'app', libraries: ['file:///workspace-a/lib_shared.pbl'] },
          { projectUri: projectB, kind: 'target', name: 'app', libraries: ['file:///workspace-b/lib_shared.pbl'] }
        ];
      },
      getProjectForFile(uri: string) {
        if (uri.startsWith('file:///workspace-a/')) {
          return { projectUri: projectA, kind: 'target', name: 'app', libraries: ['file:///workspace-a/lib_shared.pbl'] };
        }
        if (uri.startsWith('file:///workspace-b/')) {
          return { projectUri: projectB, kind: 'target', name: 'app', libraries: ['file:///workspace-b/lib_shared.pbl'] };
        }
        return null;
      },
      getFilesForProject(projectUri: string) {
        if (projectUri === projectA) return ['file:///workspace-a/lib_shared.pbl/u_shared.sru'];
        if (projectUri === projectB) return ['file:///workspace-b/lib_shared.pbl/u_shared.sru'];
        return [];
      },
      getLibrariesForFile(uri: string) {
        return this.getProjectForFile(uri)?.libraries ?? [];
      },
      getStats() {
        return { projects: 2, libraries: 2, orphanFiles: 0 };
      }
    };
    const store = createSemanticCacheStore(
      new NodeFileSystem(),
      storageUri,
      ['file:///workspace-a', 'file:///workspace-b'],
      projectModel
    );

    try {
      await store.persistCheckpoint(createCacheCheckpoint(9, [
        { uri: 'file:///workspace-a/lib_shared.pbl/u_shared.sru', version: 'hash-a', facts: [], scopes: [] },
        { uri: 'file:///workspace-b/lib_shared.pbl/u_shared.sru', version: 'hash-b', facts: [], scopes: [] }
      ], {
        workspaceMode: 'mixed',
        rootUris: ['file:///workspace-a', 'file:///workspace-b'],
        projectStats: projectModel.getStats()
      }));

      const persistedRoot = path.join(tempRoot, store.workspaceKey);
      const manifest = JSON.parse(
        await fs.readFile(path.join(persistedRoot, 'project-partitions.json'), 'utf8')
      ) as { partitions: Array<{ projectUri: string; projectKey: string }> };
      const projectKeys = new Map(manifest.partitions.map((entry) => [entry.projectUri, entry.projectKey]));

      assert.equal(manifest.partitions.length, 2);
      assert.notEqual(projectKeys.get(projectA), projectKeys.get(projectB));
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

  test('runMaintenance compacta journals grandes y valida el restore posterior', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);
    const metadata = {
      workspaceMode: 'workspace' as const,
      rootUris: ['file:///workspace']
    };

    try {
      await store.persistCheckpoint(createCacheCheckpoint(3, [{ uri: 'file:///a.sru', version: 'hash-a', facts: [], scopes: [] }], metadata));

      for (let index = 0; index <= store.retentionPolicy.maxJournalEntries; index++) {
        await store.appendJournalMutation({
          semanticEpoch: 4 + index,
          kind: 'remove',
          uris: [`file:///obsolete-${index}.sru`]
        });
      }

      const before = await store.inspectMaintenance();
      assert.equal(before.needsCompaction, true);
      assert.equal(before.maintenanceRecommended, true);
      assert.ok(before.currentWorkspace.journalEntries > store.retentionPolicy.maxJournalEntries);

      const result = await store.runMaintenance(metadata);
      assert.equal(result.compacted, true);
      assert.equal(result.restoreValidated, true);
      assert.equal(result.currentWorkspace.journalEntries, 0);
      assert.equal(result.needsCompaction, false);

      const restored = await store.load(metadata);
      assert.equal(restored.decision.action, 'reuse');
      assert.equal(restored.checkpoint.documents.length, 1);
      assert.equal(restored.checkpoint.documents[0].uri, 'file:///a.sru');
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('getStats reporta pendingMutations y autoCompactions', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-'));
    const storageUri = fsPathToUri(tempRoot);
    const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace']);

    try {
      assert.deepEqual(store.getStats(), { pendingMutations: 0, autoCompactions: 0 });

      await store.appendJournalMutation({ semanticEpoch: 2, kind: 'remove', uris: ['file:///a.sru'] });
      await store.appendJournalMutation({ semanticEpoch: 3, kind: 'remove', uris: ['file:///b.sru'] });
      
      assert.deepEqual(store.getStats(), { pendingMutations: 2, autoCompactions: 0 });

      const metadata = { workspaceMode: 'workspace' as const, rootUris: ['file:///workspace'] };
      await store.persistCheckpoint(createCacheCheckpoint(3, [], metadata));
      
      assert.deepEqual(store.getStats(), { pendingMutations: 0, autoCompactions: 0 });

      // Simular threshold alcanzado (maxJournalEntries es 24)
      for (let i = 0; i < 25; i++) {
        await store.appendJournalMutation({ semanticEpoch: 4 + i, kind: 'remove', uris: [`file:///c-${i}.sru`] });
      }
      assert.deepEqual(store.getStats(), { pendingMutations: 25, autoCompactions: 0 });

      await store.runMaintenance(metadata);
      
      assert.deepEqual(store.getStats(), { pendingMutations: 0, autoCompactions: 1 });
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });
});