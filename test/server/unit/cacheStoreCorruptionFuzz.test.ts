import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { createCacheCheckpoint } from '../../../src/server/cache/cacheCheckpoint';
import { createSemanticCacheStore } from '../../../src/server/cache/cacheStore';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { fsPathToUri } from '../../../src/server/system/uriUtils';
import type { UnifiedProjectModel } from '../../../src/server/workspace/unifiedProjectModel';

type CorruptionCase = {
  name: string;
  mutate: (persistedRoot: string, projectKeys: Map<string, string>) => Promise<void>;
};

suite('unit/cacheStoreCorruptionFuzz (B270)', () => {
  const projectA = 'file:///workspace/project-a.pbt';
  const projectB = 'file:///workspace/project-b.pbt';
  const metadata = {
    workspaceMode: 'workspace' as const,
    rootUris: ['file:///workspace'],
    projectStats: { projects: 2, libraries: 2, orphanFiles: 0 },
  };
  const cases: CorruptionCase[] = [
    {
      name: 'manifest sin particiones array',
      async mutate(persistedRoot) {
        await fs.writeFile(
          path.join(persistedRoot, 'project-partitions.json'),
          JSON.stringify({ schemaVersion: 2 }),
          'utf8',
        );
      },
    },
    {
      name: 'manifest con entrada de particion incompleta',
      async mutate(persistedRoot) {
        await fs.writeFile(
          path.join(persistedRoot, 'project-partitions.json'),
          JSON.stringify({ schemaVersion: 2, partitions: [{ projectUri: projectA }] }),
          'utf8',
        );
      },
    },
    {
      name: 'checkpoint particionado truncado',
      async mutate(persistedRoot, projectKeys) {
        await fs.writeFile(
          path.join(persistedRoot, 'projects', projectKeys.get(projectA)!, 'semantic-checkpoint.json'),
          '{"schemaVersion":',
          'utf8',
        );
      },
    },
    {
      name: 'journal particionado truncado',
      async mutate(persistedRoot, projectKeys) {
        await fs.writeFile(
          path.join(persistedRoot, 'projects', projectKeys.get(projectB)!, 'semantic-journal.json'),
          '[{"schemaVersion":2',
          'utf8',
        );
      },
    },
  ];

  for (const corruptionCase of cases) {
    test(`load degrada a rebuild limpio ante ${corruptionCase.name}`, async () => {
      const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'vsc-powersyntax-store-fuzz-'));
      const storageUri = fsPathToUri(tempRoot);
      const store = createSemanticCacheStore(new NodeFileSystem(), storageUri, ['file:///workspace'], createProjectModel(projectA, projectB));

      try {
        await store.persistCheckpoint(createCacheCheckpoint(5, [
          { uri: 'file:///workspace/project-a/u_a.sru', version: 'hash-a', facts: [], scopes: [] },
          { uri: 'file:///workspace/project-b/u_b.sru', version: 'hash-b', facts: [], scopes: [] },
        ], metadata));
        await store.appendJournalMutation({
          semanticEpoch: 6,
          kind: 'upsert',
          uris: ['file:///workspace/project-b/u_b_2.sru'],
          documents: [{ uri: 'file:///workspace/project-b/u_b_2.sru', version: 'hash-b2', facts: [], scopes: [] }],
        });

        const persistedRoot = path.join(tempRoot, store.workspaceKey);
        const manifest = JSON.parse(
          await fs.readFile(path.join(persistedRoot, 'project-partitions.json'), 'utf8')
        ) as { partitions: Array<{ projectUri: string; projectKey: string }> };
        const projectKeys = new Map(manifest.partitions.map((entry) => [entry.projectUri, entry.projectKey]));

        await corruptionCase.mutate(persistedRoot, projectKeys);

        const restored = await store.load(metadata);
        assert.equal(restored.decision.action, 'rebuild');
        assert.equal(restored.decision.reason, 'invalid-checkpoint-payload');
        assert.deepEqual(restored.checkpoint.documents, []);
      } finally {
        await fs.rm(tempRoot, { recursive: true, force: true });
      }
    });
  }
});

function createProjectModel(projectA: string, projectB: string): UnifiedProjectModel {
  return {
    getProjects() {
      return [
        { projectUri: projectA, kind: 'target', name: 'project-a', libraries: ['file:///workspace/project-a/'] },
        { projectUri: projectB, kind: 'target', name: 'project-b', libraries: ['file:///workspace/project-b/'] },
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
      if (projectUri === projectB) return ['file:///workspace/project-b/u_b.sru', 'file:///workspace/project-b/u_b_2.sru'];
      return [];
    },
    getLibrariesForFile(uri: string) {
      return this.getProjectForFile(uri)?.libraries ?? [];
    },
    getStats() {
      return { projects: 2, libraries: 2, orphanFiles: 0 };
    },
  };
}