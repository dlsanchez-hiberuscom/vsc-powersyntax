import * as assert from 'assert/strict';

import { performance } from 'perf_hooks';

import { ServingCacheFlushCoordinator } from '../../../src/server/cache/servingCacheFlushCoordinator';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { HotContextCache } from '../../../src/server/knowledge/HotContextCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { ServingCache } from '../../../src/server/knowledge/ServingCache';
import type { FileStat, IFileSystem } from '../../../src/server/system/fileSystem';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { applyWatchedFileEvents } from '../../../src/server/workspace/watchedFileIntake';
import { FileIndexState, getFileIndexState } from '../../../src/server/indexer/workspaceIndexer';

const BASELINE_FILES = 256;
const INCREMENTAL_CHANGES = 24;
const MASSIVE_CHANGES = 96;
const INCREMENTAL_BUDGET_MS = 1500;
const MASSIVE_BUDGET_MS = 3500;

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
      mtime: 0,
    };
  }

  async createDirectory(): Promise<void> {
    return;
  }

  async writeFile(uri: string, content: string): Promise<void> {
    this.files.set(uri, content);
  }

  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    this.files.set(targetUri, this.files.get(sourceUri) ?? '');
  }

  async deletePath(uri: string): Promise<void> {
    this.files.delete(uri);
  }
}

function createSource(index: number, revision: number): string {
  return [
    'forward',
    `global type u_stress_${index} from nonvisualobject`,
    'end type',
    'end forward',
    '',
    `global type u_stress_${index} from nonvisualobject`,
    `public function integer of_revision_${revision}();`,
    `  return ${index + revision}`,
    'end function',
    'end type',
  ].join('\n');
}

function createFileUri(index: number): string {
  return `file:///stress/lib_app.pbl/u_stress_${index}.sru`;
}

function logBudget(metric: string, elapsedMs: number, budgetMs: number): void {
  console.log(`[perf-budget] ${metric} elapsedMs=${elapsedMs.toFixed(2)} budgetMs=${budgetMs.toFixed(2)}`);
}

async function seedWorkspace(
  fs: FakeFileSystem,
  workspaceState: WorkspaceState,
  documentCache: DocumentCache,
  knowledgeBase: KnowledgeBase,
  hotContextCache: HotContextCache,
  servingCache: ServingCache,
  servingCacheFlushCoordinator: ServingCacheFlushCoordinator,
): Promise<void> {
  workspaceState.addTopologyEntry({
    kind: 'target',
    data: {
      uri: 'file:///stress/app.pbt',
      name: 'stress-app',
      libraries: ['file:///stress/lib_app.pbl'],
    },
  });
  workspaceState.refreshProjectRouting();

  const createEvents = [] as Array<{ uri: string; kind: 'create' }>;
  for (let index = 0; index < BASELINE_FILES; index++) {
    const uri = createFileUri(index);
    fs.files.set(uri, createSource(index, 0));
    createEvents.push({ uri, kind: 'create' });
  }

  const result = await applyWatchedFileEvents({
    events: createEvents,
    fs,
    documentCache,
    knowledgeBase,
    workspaceState,
    hotContextCache,
    servingCache,
    servingCacheFlushCoordinator,
    massiveChangeThreshold: BASELINE_FILES + 1,
  });

  assert.equal(result.reindexed, BASELINE_FILES);
  assert.equal(result.massive, false);
}

suite('performance/large-workspace-incremental', () => {
  test('incremental watcher burst stays bounded on a large synthetic workspace', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});

    await seedWorkspace(fs, workspaceState, documentCache, knowledgeBase, hotContextCache, servingCache, servingCacheFlushCoordinator);

    const changeEvents = [] as Array<{ uri: string; kind: 'change' }>;
    for (let index = 0; index < INCREMENTAL_CHANGES; index++) {
      const uri = createFileUri(index);
      fs.files.set(uri, createSource(index, 1));
      changeEvents.push({ uri, kind: 'change' });
    }

    const start = performance.now();
    const result = await applyWatchedFileEvents({
      events: changeEvents,
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 32,
    });
    const elapsedMs = performance.now() - start;

    logBudget('large-workspace-incremental-burst', elapsedMs, INCREMENTAL_BUDGET_MS);

    assert.equal(result.massive, false);
    assert.equal(result.reindexed, INCREMENTAL_CHANGES);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.deepEqual(result.touchedProjects, ['file:///stress/app.pbt']);
    assert.ok(elapsedMs < INCREMENTAL_BUDGET_MS, `Ráfaga incremental demasiado lenta: ${elapsedMs.toFixed(2)}ms`);
    assert.equal(getFileIndexState(createFileUri(0)), FileIndexState.Indexed);
    assert.equal(knowledgeBase.getDocumentSnapshot(createFileUri(0))?.pass, 'enriched');
  });

  test('massive watcher burst degrades safely without losing reindex stability', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});

    await seedWorkspace(fs, workspaceState, documentCache, knowledgeBase, hotContextCache, servingCache, servingCacheFlushCoordinator);

    const changeEvents = [] as Array<{ uri: string; kind: 'change' }>;
    for (let index = 0; index < MASSIVE_CHANGES; index++) {
      const uri = createFileUri(index);
      fs.files.set(uri, createSource(index, 2));
      changeEvents.push({ uri, kind: 'change' });
    }

    const start = performance.now();
    const result = await applyWatchedFileEvents({
      events: changeEvents,
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 32,
    });
    const elapsedMs = performance.now() - start;

    logBudget('large-workspace-massive-burst', elapsedMs, MASSIVE_BUDGET_MS);

    assert.equal(result.massive, true);
    assert.equal(result.reindexed, MASSIVE_CHANGES);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.deepEqual(result.touchedProjects, ['file:///stress/app.pbt']);
    assert.ok(elapsedMs < MASSIVE_BUDGET_MS, `Ráfaga masiva demasiado lenta: ${elapsedMs.toFixed(2)}ms`);
    assert.equal(getFileIndexState(createFileUri(MASSIVE_CHANGES - 1)), FileIndexState.Indexed);
    assert.equal(knowledgeBase.getDocumentSnapshot(createFileUri(MASSIVE_CHANGES - 1))?.pass, 'enriched');
  });
});