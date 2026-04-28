import * as assert from 'assert/strict';
import { performance } from 'perf_hooks';
import { discoverWorkspace } from '../../../src/server/workspace/discovery';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { NodeFileSystem } from '../../../src/server/system/fileSystem';
import { createCancellationSource } from '../../../src/server/runtime/cancellation';
import { getPfcWorkspacePath, hasPfcWorkspace } from '../helpers/pfcPaths';

suite('performance/discovery', () => {
  test('discoverWorkspace recorre PFC en menos de 2s', async function () {
    if (!hasPfcWorkspace()) {
      this.skip();
      return;
    }

    const fs = new NodeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();
    
    // Convertir el path del sistema a URI
    const pfcPath = getPfcWorkspacePath();
    const rootUri = `file:///${pfcPath.replace(/\\/g, '/')}`;

    const start = performance.now();
    await discoverWorkspace([rootUri], fs, state, cancelSource.token);
    const elapsedMs = performance.now() - start;

    const files = state.getAllSourceFiles();
    
    console.log(`[PERFORMANCE] Descubrimiento de ${files.length} archivos en PFC: ${elapsedMs.toFixed(2)}ms`);

    // Presupuesto: < 2000ms para workspace mediano
    if (elapsedMs > 1000) {
      console.warn(`[PERFORMANCE WARNING] Descubrimiento se acerca al límite: ${elapsedMs.toFixed(2)}ms`);
    }

    assert.ok(elapsedMs < 2000, `Descubrimiento demasiado lento: ${elapsedMs.toFixed(2)}ms`);
    assert.ok(files.length > 100, 'Debería haber descubierto cientos de archivos en el PFC');
  });
});
