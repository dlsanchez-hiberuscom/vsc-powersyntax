import * as assert from 'assert/strict';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { performance } from 'perf_hooks';

import { indexWorkspace, getIndexerStatus } from '../../../src/server/indexer/workspaceIndexer';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { createCancellationSource } from '../../../src/server/runtime/cancellation';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { discoverWorkspace } from '../../../src/server/workspace/discovery';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { materializeSyntheticPowerBuilderCorpus } from '../helpers/syntheticPowerBuilderCorpus';

const DISCOVERY_BUDGET_MS = 4000;
const INDEXING_BUDGET_MS = 12000;

function logBudget(metric: string, elapsedMs: number, budgetMs: number): void {
  console.log(`[perf-budget] ${metric} elapsedMs=${elapsedMs.toFixed(2)} budgetMs=${budgetMs.toFixed(2)}`);
}

suite('performance/synthetic-corpus-smoke', () => {
  test('synthetic smoke corpus stays bounded for discovery and indexing', async function () {
    this.timeout(45000);

    const rootDir = path.join(os.tmpdir(), `vsc-powersyntax-synthetic-smoke-${Date.now()}`);
    const corpus = await materializeSyntheticPowerBuilderCorpus(rootDir, 'smoke');

    try {
      const fileSystem = new NodeFileSystem();
      const documentCache = new DocumentCache();
      const knowledgeBase = new KnowledgeBase();
      const workspaceState = new WorkspaceState();
      const cancellation = createCancellationSource();

      const discoveryStart = performance.now();
      await discoverWorkspace([corpus.rootUri], fileSystem, workspaceState, cancellation.token);
      const discoveryElapsedMs = performance.now() - discoveryStart;

      const indexingStart = performance.now();
      await indexWorkspace(fileSystem, documentCache, knowledgeBase, workspaceState, cancellation.token);
      const indexingElapsedMs = performance.now() - indexingStart;

      logBudget('synthetic-corpus-smoke-discovery', discoveryElapsedMs, DISCOVERY_BUDGET_MS);
      logBudget('synthetic-corpus-smoke-indexing', indexingElapsedMs, INDEXING_BUDGET_MS);

      const indexerStatus = getIndexerStatus();
      assert.equal(workspaceState.getAllSourceFiles().length, corpus.profile.fileCount);
      assert.ok(knowledgeBase.getStats().totalEntities > 0, 'El corpus smoke debe producir entidades semánticas.');
      assert.ok(indexerStatus.worker?.totalWorkers !== undefined);
      assert.ok(indexerStatus.latencyGovernor?.currentBudgetMs !== undefined);
      assert.ok(discoveryElapsedMs < DISCOVERY_BUDGET_MS, `Discovery synthetic smoke demasiado lento: ${discoveryElapsedMs.toFixed(2)}ms`);
      assert.ok(indexingElapsedMs < INDEXING_BUDGET_MS, `Indexing synthetic smoke demasiado lento: ${indexingElapsedMs.toFixed(2)}ms`);
    } finally {
      await fs.rm(rootDir, { recursive: true, force: true });
    }
  });
});