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

const DISCOVERY_BUDGET_MS = 30000;
const INDEXING_BUDGET_MS = 90000;

function logBudget(metric: string, elapsedMs: number, budgetMs: number): void {
  console.log(`[perf-budget] ${metric} elapsedMs=${elapsedMs.toFixed(2)} budgetMs=${budgetMs.toFixed(2)}`);
}

suite('performance/synthetic-corpus-10k', () => {
  test('10k synthetic corpus remains observable and can enforce budgets', async function () {
    this.timeout(180000);

    if (process.env.PB_ENABLE_SYNTHETIC_10K !== '1') {
      this.skip();
      return;
    }

    const gateMode = process.env.PB_10K_GATE_MODE === 'fail' ? 'fail' : 'report-only';
    const rootDir = path.join(os.tmpdir(), `vsc-powersyntax-synthetic-10k-${Date.now()}`);
    const corpus = await materializeSyntheticPowerBuilderCorpus(rootDir, '10k');

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

      logBudget('synthetic-corpus-10k-discovery', discoveryElapsedMs, DISCOVERY_BUDGET_MS);
      logBudget('synthetic-corpus-10k-indexing', indexingElapsedMs, INDEXING_BUDGET_MS);

      const indexerStatus = getIndexerStatus();
      assert.equal(workspaceState.getAllSourceFiles().length, corpus.profile.fileCount);
      assert.ok(knowledgeBase.getStats().totalEntities > 0, 'El corpus 10k debe producir entidades semánticas.');
      assert.ok(indexerStatus.worker?.totalWorkers !== undefined);
      assert.ok(indexerStatus.latencyGovernor?.currentBudgetMs !== undefined);

      if (gateMode === 'fail') {
        assert.ok(discoveryElapsedMs < DISCOVERY_BUDGET_MS, `Discovery synthetic 10k demasiado lento: ${discoveryElapsedMs.toFixed(2)}ms`);
        assert.ok(indexingElapsedMs < INDEXING_BUDGET_MS, `Indexing synthetic 10k demasiado lento: ${indexingElapsedMs.toFixed(2)}ms`);
      }
    } finally {
      await fs.rm(rootDir, { recursive: true, force: true });
    }
  });
});