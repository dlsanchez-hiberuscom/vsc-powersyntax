import * as assert from 'assert/strict';

import { ServingCacheFlushCoordinator } from '../../../src/server/cache/servingCacheFlushCoordinator';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { HotContextCache } from '../../../src/server/knowledge/HotContextCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { makeKey, ServingCache } from '../../../src/server/knowledge/ServingCache';
import type { IFileSystem, FileStat } from '../../../src/server/system/fileSystem';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { applyWatchedFileEvents } from '../../../src/server/workspace/watchedFileIntake';

class FakeFileSystem implements IFileSystem {
  readonly files = new Map<string, string>();

  async readFile(uri: string): Promise<string> {
    const value = this.files.get(uri);
    if (value === undefined) {
      throw new Error(`File not found: ${uri}`);
    }
    return value;
  }

  async readDirectory(): Promise<[string, FileStat][]> {
    return [];
  }

  async stat(uri: string): Promise<FileStat | null> {
    const content = this.files.get(uri);
    if (content === undefined) {
      return null;
    }
    return {
      isFile: true,
      isDirectory: false,
      size: content.length,
      mtime: 0
    };
  }

  async createDirectory(): Promise<void> {
    return;
  }

  async writeFile(uri: string, content: string): Promise<void> {
    this.files.set(uri, content);
  }

  async deletePath(uri: string): Promise<void> {
    this.files.delete(uri);
  }
}

suite('unit/watchedFileIntake', () => {
  test('reindexa cambios de archivos cerrados y los registra en workspaceState', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const uri = 'file:///proj/w_demo.sru';

    fs.files.set(uri, [
      'forward',
      'global type w_demo from window',
      'end type',
      'end forward',
      '',
      'global type w_demo from window',
      'public function integer of_demo();',
      '  return 1',
      'end function',
      'end type'
    ].join('\n'));

    const result = await applyWatchedFileEvents({
      events: [{ uri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.equal(result.reindexed, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.equal(result.massive, false);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(workspaceState.hasSourceFile(uri), true);
    assert.equal(knowledgeBase.getDocumentSnapshot(uri)?.pass, 'enriched');
    assert.ok(documentCache.get(uri)?.facts.some((fact) => fact.name.toLowerCase() === 'of_demo'));
  });

  test('create y delete refrescan el project model cuando cambia el inventario', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const uri = 'file:///proj/lib_app.pbl/u_refresh.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl']
      }
    });
    workspaceState.refreshProjectRouting();

    fs.files.set(uri, 'forward\nend forward\n');

    const createResult = await applyWatchedFileEvents({
      events: [{ uri, kind: 'create' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.equal(workspaceState.getProjectModel()?.getProjectForFile(uri)?.projectUri, 'file:///proj/app.pbt');
    assert.deepEqual(createResult.touchedProjects, ['file:///proj/app.pbt']);

    const deleteResult = await applyWatchedFileEvents({
      events: [{ uri, kind: 'delete' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.equal(workspaceState.getProjectModel()?.getProjectForFile(uri), null);
    assert.deepEqual(deleteResult.touchedProjects, ['file:///proj/app.pbt']);
  });

  test('delete elimina cache, snapshot y limpia diagnósticos', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const clearedDiagnostics: string[] = [];
    const uri = 'file:///proj/w_delete.sru';

    fs.files.set(uri, 'forward\nend forward\n');
    await applyWatchedFileEvents({
      events: [{ uri, kind: 'create' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    const result = await applyWatchedFileEvents({
      events: [{ uri, kind: 'delete' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      clearDiagnostics: (targetUri) => clearedDiagnostics.push(targetUri)
    });

    assert.equal(result.reindexed, 0);
    assert.equal(result.removed, 1);
    assert.equal(result.massive, false);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(workspaceState.hasSourceFile(uri), false);
    assert.equal(documentCache.get(uri), undefined);
    assert.equal(knowledgeBase.getDocumentSnapshot(uri), null);
    assert.deepEqual(clearedDiagnostics, [uri]);
  });

  test('omite reindexado si el documento está abierto', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const uri = 'file:///proj/w_open.sru';

    fs.files.set(uri, 'forward\nend forward\n');

    const result = await applyWatchedFileEvents({
      events: [{ uri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      isDocumentOpen: (targetUri) => targetUri === uri
    });

    assert.equal(result.reindexed, 0);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 1);
    assert.equal(result.massive, false);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(workspaceState.hasSourceFile(uri), true);
    assert.equal(knowledgeBase.getDocumentSnapshot(uri), null);
  });

  test('batch pequeño invalida serving cache solo para URIs afectadas', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const changedUri = 'file:///proj/w_small.sru';
    const otherUri = 'file:///proj/w_other.sru';

    fs.files.set(changedUri, 'forward\nend forward\n');
    servingCache.set(makeKey({ feature: 'hover', uri: changedUri, line: 0, character: 0, kbVersion: 1 }), 'changed');
    servingCache.set(makeKey({ feature: 'hover', uri: otherUri, line: 0, character: 0, kbVersion: 1 }), 'other');

    const result = await applyWatchedFileEvents({
      events: [{ uri: changedUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 8
    });

    assert.equal(result.massive, false);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: changedUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: otherUri, line: 0, character: 0, kbVersion: 1 })), 'other');
  });

  test('batch masivo invalida serving cache completo en un solo barrido lógico', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const firstUri = 'file:///proj/w_massive_a.sru';
    const secondUri = 'file:///proj/w_massive_b.sru';

    fs.files.set(firstUri, 'forward\nend forward\n');
    fs.files.set(secondUri, 'forward\nend forward\n');
    servingCache.set(makeKey({ feature: 'hover', uri: firstUri, line: 0, character: 0, kbVersion: 1 }), 'first');
    servingCache.set(makeKey({ feature: 'hover', uri: 'file:///proj/unrelated.sru', line: 0, character: 0, kbVersion: 1 }), 'unrelated');

    const result = await applyWatchedFileEvents({
      events: [
        { uri: firstUri, kind: 'change' },
        { uri: secondUri, kind: 'change' }
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 2
    });

    assert.equal(result.massive, true);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(servingCache.size(), 0);
  });
});