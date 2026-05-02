import * as assert from 'assert/strict';

import { buildRuntimeMemoryReport } from '../../../src/server/runtime/memoryBudgets';

suite('unit/memoryBudgets (B070)', () => {
  test('estima budgets por capa y marca warning cerca del límite', () => {
    const report = buildRuntimeMemoryReport({
      analysis: { size: 220 },
      serving: { size: 50 },
      documents: { size: 20, internedStrings: 1_000 },
      hotContext: { inheritedTypes: 10 },
      codeLens: { size: 100 },
      kb: { totalEntities: 200_000, indexedScopes: 20_000, internedStrings: 10_000, snapshotDocuments: 300 },
    });

    assert.equal(report.status, 'warning');
    assert.ok(report.layers.some((layer) => layer.layer === 'knowledge'));
    assert.ok(report.layers.some((layer) => layer.status === 'warning' || layer.status === 'error'));
    assert.ok(report.totalBudgetBytes > 0);
    assert.ok(report.totalEstimatedBytes > 0);
  });

  test('permanece healthy cuando la estimación está lejos de los budgets', () => {
    const report = buildRuntimeMemoryReport({
      analysis: { size: 10 },
      serving: { size: 5 },
      documents: { size: 4, internedStrings: 100 },
      hotContext: { inheritedTypes: 2 },
      codeLens: { size: 3 },
      kb: { totalEntities: 500, indexedScopes: 100, internedStrings: 200, snapshotDocuments: 5 },
    });

    assert.equal(report.status, 'healthy');
    assert.ok(report.layers.every((layer) => layer.status === 'healthy'));
  });
});