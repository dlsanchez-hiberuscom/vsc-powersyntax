import * as assert from 'assert/strict';

import { ServingCacheFlushCoordinator } from '../../../src/server/cache/servingCacheFlushCoordinator';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { HotContextCache } from '../../../src/server/knowledge/HotContextCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { ServingCache } from '../../../src/server/knowledge/ServingCache';
import type { FileStat, IFileSystem } from '../../../src/server/system/fileSystem';
import { createFileWatcherDebouncer, type FsEvent } from '../../../src/server/system/fileWatcherDebouncer';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { applyWatchedFileEvents, type WatchedFileIntakeResult } from '../../../src/server/workspace/watchedFileIntake';

class FakeFileSystem implements IFileSystem {
  readonly files = new Map<string, string>();

  async stat(uri: string): Promise<FileStat | null> {
    const content = this.files.get(uri);
    return content === undefined
      ? null
      : { isFile: true, isDirectory: false, size: content.length, mtime: 0 };
  }

  async readDirectory(): Promise<[string, FileStat][]> {
    return [];
  }

  async readFile(uri: string): Promise<string> {
    const value = this.files.get(uri);
    if (value === undefined) {
      throw new Error(`File not found: ${uri}`);
    }
    return value;
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

function createPipeline(fs: FakeFileSystem, results: WatchedFileIntakeResult[]) {
  const documentCache = new DocumentCache();
  const knowledgeBase = new KnowledgeBase();
  const workspaceState = new WorkspaceState();
  const hotContextCache = new HotContextCache();
  const servingCache = new ServingCache();
  const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
  const pendingRuns: Promise<void>[] = [];

  const debouncer = createFileWatcherDebouncer({
    delayMs: 1000,
    maxPending: 2,
    onFlush: (events: FsEvent[]) => {
      pendingRuns.push(
        applyWatchedFileEvents({
          events,
          fs,
          documentCache,
          knowledgeBase,
          workspaceState,
          hotContextCache,
          servingCache,
          servingCacheFlushCoordinator,
          massiveChangeThreshold: 99
        }).then((result) => {
          results.push(result);
        })
      );
    }
  });

  return {
    debouncer,
    knowledgeBase,
    workspaceState,
    async waitAll(): Promise<void> {
      await Promise.all(pendingRuns);
    }
  };
}

suite('unit/watcherPipeline', () => {
  test('coalescing por URI evita reindexado redundante en el pipeline real', async () => {
    const fs = new FakeFileSystem();
    const uri = 'file:///proj/w_same.sru';
    const results: WatchedFileIntakeResult[] = [];
    fs.files.set(uri, 'forward\nend forward\n');

    const pipeline = createPipeline(fs, results);

    pipeline.debouncer.push({ uri, kind: 'change' });
    pipeline.debouncer.push({ uri, kind: 'change' });
    pipeline.debouncer.push({ uri, kind: 'change' });
    pipeline.debouncer.flushNow();
    await pipeline.waitAll();

    assert.equal(results.length, 1);
    assert.equal(results[0]?.reindexed, 1);
    assert.equal(pipeline.debouncer.getStats().coalesced, 2);
    assert.equal(pipeline.knowledgeBase.getDocumentSnapshot(uri)?.pass, 'enriched');
  });

  test('backpressure adelanta un flush y procesa el resto en el siguiente batch', async () => {
    const fs = new FakeFileSystem();
    const results: WatchedFileIntakeResult[] = [];
    const uris = [
      'file:///proj/a.sru',
      'file:///proj/b.sru',
      'file:///proj/c.sru'
    ];

    for (const uri of uris) {
      fs.files.set(uri, 'forward\nend forward\n');
    }

    const pipeline = createPipeline(fs, results);

    pipeline.debouncer.push({ uri: uris[0], kind: 'change' });
    pipeline.debouncer.push({ uri: uris[1], kind: 'change' });
    pipeline.debouncer.push({ uri: uris[2], kind: 'change' });
    pipeline.debouncer.flushNow();
    await pipeline.waitAll();

    assert.equal(results.length, 2);
    assert.deepEqual(results.map((result) => result.reindexed).sort((left, right) => left - right), [1, 2]);
    assert.equal(pipeline.debouncer.getStats().backpressureFlushes, 1);
    assert.equal(pipeline.workspaceState.getAllSourceFiles().length, 3);
  });
});