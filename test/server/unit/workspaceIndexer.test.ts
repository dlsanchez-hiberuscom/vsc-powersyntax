import * as assert from 'assert/strict';
import {
  getIndexerStatus,
  indexWorkspace,
  prioritizeFilesForIndexing
} from '../../../src/server/indexer/workspaceIndexer';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { IFileSystem, FileStat } from '../../../src/server/system/fileSystem';
import { createCancellationSource } from '../../../src/server/runtime/cancellation';

class FakeFileSystem implements IFileSystem {
  files: Map<string, string> = new Map();
  async stat(uri: string): Promise<FileStat | null> {
    if (this.files.has(uri)) return { isFile: true, isDirectory: false, mtime: 0, size: 0 };
    return null;
  }
  async readDirectory(): Promise<[string, FileStat][]> {
    return [];
  }
  async readFile(uri: string): Promise<string> {
    return this.files.get(uri) ?? '';
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

suite('unit/workspaceIndexer/progress', () => {
  test('onProgress se invoca al inicio, intermedio y final', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();

    // Crear 60 archivos para forzar al menos 2 reportes intermedios (cada 25).
    for (let i = 0; i < 60; i++) {
      const uri = `file:///proj/n_cst_${i}.sru`;
      fs.files.set(uri, `forward prototypes\nend prototypes\n`);
      state.addSourceFile(uri);
    }

    const events: Array<{ current: number; total: number }> = [];
    const cancelSource = createCancellationSource();

    await indexWorkspace(
      fs,
      cache,
      kb,
      state,
      cancelSource.token,
      undefined,
      (current: number, total: number) => events.push({ current, total })
    );

    // Debe incluir al menos: inicio (0), 25, 50 y final (60).
    assert.ok(events.length >= 4, `esperaba >=4 eventos, recibí ${events.length}`);
    assert.equal(events[0]!.current, 0);
    assert.equal(events[0]!.total, 60);
    assert.equal(events[events.length - 1]!.current, 60);
    assert.equal(events[events.length - 1]!.total, 60);

    // Algún evento intermedio con 25 o 50.
    const intermediates = events.slice(1, -1).map((e) => e.current);
    assert.ok(intermediates.includes(25) || intermediates.includes(50));
  });

  test('onProgress reporta total=0 si no hay archivos', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    const events: Array<{ current: number; total: number }> = [];

    await indexWorkspace(
      fs,
      cache,
      kb,
      state,
      cancelSource.token,
      undefined,
      (current: number, total: number) => events.push({ current, total })
    );

    assert.equal(events.length, 2); // inicio + final
    assert.equal(events[0]!.total, 0);
    assert.equal(events[1]!.total, 0);
  });

  test('prioriza archivo activo y archivos de su proyecto', () => {
    const state = new WorkspaceState();
    state.setProjectRegistry({
      getProjectForFile(uri: string): string | null {
        return uri.includes('/projA/') ? 'projA' : uri.includes('/projB/') ? 'projB' : null;
      },
      getAllProjects(): string[] {
        return ['projA', 'projB'];
      },
      getFilesForProject(projectUri: string): string[] {
        return projectUri === 'projA'
          ? ['file:///projA/active.sru', 'file:///projA/nearby.sru']
          : ['file:///projB/other.sru'];
      }
    });

    const ordered = prioritizeFilesForIndexing(
      ['file:///projB/other.sru', 'file:///projA/nearby.sru', 'file:///projA/active.sru'],
      state,
      'file:///projA/active.sru'
    );

    assert.deepEqual(ordered, ['file:///projA/active.sru', 'file:///projA/nearby.sru', 'file:///projB/other.sru']);
  });

  test('status expone degradación si hay archivos fallidos', async () => {
    class FailingFileSystem extends FakeFileSystem {
      override async readFile(uri: string): Promise<string> {
        if (uri.endsWith('broken.sru')) {
          throw new Error('broken');
        }
        return super.readFile(uri);
      }
    }

    const fs = new FailingFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    fs.files.set('file:///proj/good.sru', 'forward prototypes\nend prototypes\n');
    state.addSourceFile('file:///proj/good.sru');
    state.addSourceFile('file:///proj/broken.sru');

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    const status = getIndexerStatus();
    assert.equal(status.phase, 'ready');
    assert.equal(status.degraded, true);
    assert.equal(status.byState.failed, 1);
    assert.equal(status.pass, undefined);
  });
});
