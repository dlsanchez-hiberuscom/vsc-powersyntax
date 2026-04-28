import * as assert from 'assert/strict';
import { performance } from 'perf_hooks';
import { indexWorkspace } from '../../../src/server/indexer/workspaceIndexer';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { discoverWorkspace } from '../../../src/server/workspace/discovery';
import { createCancellationSource } from '../../../src/server/runtime/cancellation';
import { getPfcWorkspacePath, hasPfcWorkspace } from '../helpers/pfcPaths';

suite('performance/indexer', () => {
  test('indexWorkspace indexa PFC (Cold start) en presupuesto', async function () {
    if (!hasPfcWorkspace()) {
      this.skip();
      return;
    }

    const fs = new NodeFileSystem();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();
    
    const pfcPath = getPfcWorkspacePath();
    const rootUri = `file:///${pfcPath.replace(/\\/g, '/')}`;

    // 1. Descubrimiento primero
    await discoverWorkspace([rootUri], fs, state, cancelSource.token);
    
    const files = state.getAllSourceFiles();
    console.log(`[PERF] Iniciando indexación de ${files.length} archivos...`);

    // 2. Indexación en frío
    const start = performance.now();
    await indexWorkspace(fs, cache, kb, state, cancelSource.token);
    const elapsedMs = performance.now() - start;

    const stats = kb.getStats();
    console.log(`[PERF] Indexación completada: ${elapsedMs.toFixed(2)}ms`);
    console.log(`[PERF] Entidades detectadas: ${stats.totalEntities}`);

    // Presupuesto: < 15s para mediano (PFC es mediano-grande)
    assert.ok(elapsedMs < 15000, `Indexación demasiado lenta: ${elapsedMs.toFixed(2)}ms`);
    assert.ok(stats.totalEntities > 100, 'Debería haber detectado entidades globales');
  });

  test('indexWorkspace es instantáneo con caché caliente (Warm start)', async function () {
    if (!hasPfcWorkspace()) {
      this.skip();
      return;
    }

    const fs = new NodeFileSystem();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();
    
    const pfcPath = getPfcWorkspacePath();
    const rootUri = `file:///${pfcPath.replace(/\\/g, '/')}`;

    await discoverWorkspace([rootUri], fs, state, cancelSource.token);
    
    // Indexación 1 (Llenar caché)
    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    // Indexación 2 (Caché caliente)
    const start = performance.now();
    await indexWorkspace(fs, cache, kb, state, cancelSource.token);
    const elapsedMs = performance.now() - start;

    console.log(`[PERF] Indexación en caliente: ${elapsedMs.toFixed(2)}ms`);
    
    // Debería ser casi instantáneo (< 500ms incluso para un workspace grande)
    assert.ok(elapsedMs < 1000, `Caché caliente demasiado lenta: ${elapsedMs.toFixed(2)}ms`);
  });
});
