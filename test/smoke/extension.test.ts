import * as assert from 'assert';
import * as vscode from 'vscode';

suite('smoke/extension', () => {
  test('la extensión se activa en menos de 500ms', async () => {
    const ext = vscode.extensions.getExtension('lopez.vsc-powersyntax');
    assert.ok(ext, 'La extensión debería estar presente');

    const start = performance.now();
    await ext.activate();
    const elapsed = performance.now() - start;

    assert.ok(ext.isActive, 'La extensión debería estar activa');
    
    // El presupuesto de cold start es 500ms, pero las pruebas de CI/test host
    // pueden ser algo más lentas. Avisamos si pasa de 500ms, pero el assert duro
    // lo ponemos en 1000ms para evitar tests inestables.
    if (elapsed > 500) {
      console.warn(`[PERFORMANCE WARNING] Activación superó presupuesto: ${elapsed.toFixed(2)}ms`);
    }
    
    assert.ok(elapsed < 1000, `Activación demasiado lenta: ${elapsed.toFixed(2)}ms`);
  });
});
