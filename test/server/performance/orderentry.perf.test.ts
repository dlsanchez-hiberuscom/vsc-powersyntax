import * as assert from 'assert/strict';
import { performance } from 'perf_hooks';

import { indexWorkspace } from '../../../src/server/indexer/workspaceIndexer';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { createCancellationSource } from '../../../src/server/runtime/cancellation';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { discoverWorkspace } from '../../../src/server/workspace/discovery';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { getOrderEntryPath, hasOrderEntry } from '../helpers/orderEntryPaths';

function toFileUri(fsPath: string): string {
  return `file:///${fsPath.replace(/\\/g, '/')}`;
}

suite('performance/orderentry', () => {
  test('OrderEntry perf: discovery detecta el corpus real sin bloquear y encuentra suficiente superficie fuente', async function () {
    if (!hasOrderEntry()) {
      this.skip();
      return;
    }

    const fs = new NodeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();
    const rootUri = toFileUri(getOrderEntryPath());

    const start = performance.now();
    await discoverWorkspace([rootUri], fs, state, cancelSource.token);
    const elapsedMs = performance.now() - start;

    const files = state.getAllSourceFiles();
    const roots = state.getRoots();

    console.log(`[PERFORMANCE] OrderEntry discovery: ${files.length} archivos fuente en ${elapsedMs.toFixed(2)}ms`);

    if (elapsedMs > 3000) {
      console.warn(`[PERFORMANCE WARNING] OrderEntry discovery se acerca al límite: ${elapsedMs.toFixed(2)}ms`);
    }

    assert.ok(files.length > 500, `Se esperaban > 500 archivos fuente reales en OrderEntry y se obtuvieron ${files.length}`);
    assert.ok(roots.projects.length >= 1, 'OrderEntry debería descubrir al menos un marker .pbproj durante discovery.');
    assert.equal(state.getMode(), 'solution', 'OrderEntry debería quedar clasificado como corpus solution-mode por su .pbproj real.');
    assert.ok(elapsedMs < 6000, `Discovery de OrderEntry demasiado lento: ${elapsedMs.toFixed(2)}ms`);
  });

  test('OrderEntry perf: indexWorkspace completa cold y warm sobre el corpus real', async function () {
    if (!hasOrderEntry()) {
      this.skip();
      return;
    }

    this.timeout(60000);

    const fs = new NodeFileSystem();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();
    const rootUri = toFileUri(getOrderEntryPath());

    await discoverWorkspace([rootUri], fs, state, cancelSource.token);

    const coldStart = performance.now();
    await indexWorkspace(fs, cache, kb, state, cancelSource.token);
    const coldElapsedMs = performance.now() - coldStart;

    const warmStart = performance.now();
    await indexWorkspace(fs, cache, kb, state, cancelSource.token);
    const warmElapsedMs = performance.now() - warmStart;

    const stats = kb.getStats();
    console.log(`[PERFORMANCE] OrderEntry index cold=${coldElapsedMs.toFixed(2)}ms warm=${warmElapsedMs.toFixed(2)}ms entities=${stats.totalEntities}`);

    if (coldElapsedMs > 15000) {
      console.warn(`[PERFORMANCE WARNING] OrderEntry cold indexing se acerca al límite: ${coldElapsedMs.toFixed(2)}ms`);
    }

    assert.ok(stats.totalEntities > 1000, `Se esperaban > 1000 entidades en OrderEntry y se obtuvieron ${stats.totalEntities}`);
    assert.ok(coldElapsedMs < 30000, `Indexación cold de OrderEntry demasiado lenta: ${coldElapsedMs.toFixed(2)}ms`);
    assert.ok(warmElapsedMs < 3000, `Indexación warm de OrderEntry demasiado lenta: ${warmElapsedMs.toFixed(2)}ms`);
  });
});
