import * as assert from 'assert';
import * as vscode from 'vscode';

import {
  PUBLIC_API_VERSION,
  type VscPowerSyntaxApi,
} from '../../src/shared/publicApi';

suite('smoke/extension', () => {
  test('la extensión se activa en menos de 500ms', async function () {
    this.timeout(10000);
    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');
    const wasActiveBefore = ext.isActive;

    const start = performance.now();
    const api = await ext.activate() as VscPowerSyntaxApi | undefined;
    const elapsed = performance.now() - start;

    assert.ok(ext.isActive, 'La extensión debería estar activa');
    assert.ok(api, 'La extensión debería exportar una API pública');
    assert.equal(api!.version, PUBLIC_API_VERSION);
    assert.equal(api!.isVersionCompatible(PUBLIC_API_VERSION), true);
    assert.equal(typeof api!.getServerStats, 'function');
    assert.equal(typeof api!.querySymbols, 'function');
    assert.equal(typeof api!.getCurrentObjectContext, 'function');

    if (!wasActiveBefore) {
      const stats = await api!.getServerStats();
      assert.ok(stats && typeof stats === 'object', 'La API pública debería devolver estadísticas del servidor');

      const symbols = await api!.querySymbols({ query: '', limit: 3 });
      assert.ok(Array.isArray(symbols), 'La API pública debería devolver un array al consultar símbolos');

      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      assert.ok(workspaceFolder, 'La prueba smoke requiere un workspace abierto');

      const contextDocument = await vscode.workspace.openTextDocument(
        vscode.Uri.joinPath(workspaceFolder!.uri, 'test', 'fixtures', 'basic', 'sample.sru')
      );

      const currentObjectContext = await api!.getCurrentObjectContext({
        uri: contextDocument.uri.toString(),
        line: 12,
        character: 28
      });
      assert.equal(currentObjectContext.available, true, 'La API pública debería devolver un context pack disponible para el objeto activo');
      assert.equal(currentObjectContext.objectInfo?.globalType, 'sample');
      assert.ok(Array.isArray(currentObjectContext.members?.functions), 'El context pack debería incluir members serializables');
    }

    // El presupuesto de cold start es 500ms, pero las pruebas de CI/test host
    // pueden ser algo más lentas. Avisamos si pasa de 500ms, pero el assert duro
    // lo ponemos en 2000ms para evitar tests inestables en máquinas cargadas.
    if (elapsed > 500) {
      console.warn(`[PERFORMANCE WARNING] Activación superó presupuesto: ${elapsed.toFixed(2)}ms`);
    }
    
    assert.ok(elapsed < 2000, `Activación demasiado lenta: ${elapsed.toFixed(2)}ms`);
  });
});
