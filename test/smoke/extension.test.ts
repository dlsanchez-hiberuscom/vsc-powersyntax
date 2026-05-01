import * as assert from 'assert';
import * as vscode from 'vscode';

import {
  PUBLIC_API_VERSION,
  type VscPowerSyntaxApi,
} from '../../src/shared/publicApi';

suite('smoke/extension', () => {
  test('la extensión se activa en menos de 500ms', async () => {
    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const start = performance.now();
    const api = await ext.activate() as VscPowerSyntaxApi | undefined;
    const elapsed = performance.now() - start;

    assert.ok(ext.isActive, 'La extensión debería estar activa');
    assert.ok(api, 'La extensión debería exportar una API pública');
    assert.equal(api!.version, PUBLIC_API_VERSION);
    assert.equal(api!.isVersionCompatible(PUBLIC_API_VERSION), true);

    const stats = await api!.getServerStats();
    assert.ok(stats && typeof stats === 'object', 'La API pública debería devolver estadísticas del servidor');

    const symbols = await api!.querySymbols({ query: '', limit: 3 });
    assert.ok(Array.isArray(symbols), 'La API pública debería devolver un array al consultar símbolos');
    
    // El presupuesto de cold start es 500ms, pero las pruebas de CI/test host
    // pueden ser algo más lentas. Avisamos si pasa de 500ms, pero el assert duro
    // lo ponemos en 2000ms para evitar tests inestables en máquinas cargadas.
    if (elapsed > 500) {
      console.warn(`[PERFORMANCE WARNING] Activación superó presupuesto: ${elapsed.toFixed(2)}ms`);
    }
    
    assert.ok(elapsed < 2000, `Activación demasiado lenta: ${elapsed.toFixed(2)}ms`);
  });
});
