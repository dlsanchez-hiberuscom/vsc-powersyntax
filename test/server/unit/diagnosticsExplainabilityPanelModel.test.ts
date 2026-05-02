import * as assert from 'assert/strict';

import { buildDiagnosticsExplainabilityPanelModel } from '../../../src/client/diagnosticsExplainabilityPanelModel';

suite('unit/diagnosticsExplainabilityPanelModel (B245)', () => {
  test('proyecta diagnostics del archivo activo en nodos explicables', () => {
    const model = buildDiagnosticsExplainabilityPanelModel([
      {
        uri: 'file:///proj/w_main.srw',
        message: 'No se pudo resolver of_compute',
        code: 'SD2',
        severity: 'warning',
        line: 12,
        character: 4,
        source: 'PowerScript',
      },
      {
        uri: 'file:///proj/d_sales.srd',
        message: 'DataObject ambiguo',
        code: 'dataobject-ambiguous',
        severity: 'warning',
        line: 4,
        character: 2,
      },
    ]);

    assert.equal(model.roots.length, 2);
    assert.equal(model.focusNodeId, 'diagnostic:0');
    assert.equal(model.roots[0]?.type, 'section');
    assert.equal(model.roots[0]?.label, 'No se pudo resolver of_compute');
    if (model.roots[0]?.type !== 'section') {
      assert.fail('El primer nodo debería ser una sección.');
    }
    assert.ok(model.roots[0].children.some((child) => child.type === 'item' && child.label === 'Why'));
    assert.ok(model.roots[0].children.some((child) => child.type === 'section' && child.label === 'Next steps'));
  });

  test('degrada con mensaje honesto si no hay diagnostics', () => {
    const model = buildDiagnosticsExplainabilityPanelModel([]);

    assert.equal(model.roots.length, 0);
    assert.match(model.message ?? '', /No hay diagnostics publicados/i);
  });
});