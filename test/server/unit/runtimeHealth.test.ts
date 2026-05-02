import * as assert from 'assert/strict';

import { buildRuntimeHealthReport } from '../../../src/server/runtime/runtimeHealth';

suite('unit/runtimeHealth (B176)', () => {
  test('resume findings estructurados por capa y severidad', () => {
    const report = buildRuntimeHealthReport({
      readiness: { state: 'degraded', detail: 'failed-files' },
      indexer: { degraded: true, phase: 'enriched' },
      scheduler: { pendingNear: 2, pendingBackground: 4 },
      projectModel: { orphanFiles: 1 },
      caches: {
        analysis: { size: 220, capacity: 256 },
        serving: { size: 30, capacity: 32, hits: 3, misses: 9 },
        hotContext: { inheritedTypes: 14, capacity: 16 }
      },
      memory: {
        status: 'warning',
        totalEstimatedBytes: 10,
        totalBudgetBytes: 20,
        layers: [
          {
            layer: 'knowledge',
            label: 'knowledge index',
            estimatedBytes: 97,
            budgetBytes: 100,
            usageRatio: 0.97,
            status: 'warning'
          }
        ]
      },
      persistence: { workspaceKey: 'wk', restoreState: 'rebuilt', restoreReason: 'invalid-checkpoint-payload' },
      lastQueryTrace: { label: 'definition', confidence: 'low', hasAmbiguity: true }
    });

    assert.equal(report.status, 'error');
    assert.ok(report.counts.error >= 1);
    assert.ok(report.counts.warning >= 1);
    assert.ok(report.findings.some((finding) => finding.code === 'runtime-degraded'));
    assert.ok(report.findings.some((finding) => finding.code === 'analysis-cache-capacity-near-limit'));
    assert.ok(report.findings.some((finding) => finding.code === 'memory-knowledge-near-limit'));
    assert.ok(report.findings.some((finding) => finding.code === 'serving-cache-low-hit-ratio'));
    assert.ok(report.findings.some((finding) => finding.code === 'query-ambiguity'));
  });

  test('devuelve healthy cuando no detecta degradación visible', () => {
    const report = buildRuntimeHealthReport({
      readiness: { state: 'ready', detail: 'semantic-ready' },
      caches: {
        analysis: { size: 10, capacity: 256 },
        serving: { size: 5, capacity: 32, hits: 10, misses: 1 },
        hotContext: { inheritedTypes: 2, capacity: 16 }
      }
    });

    assert.equal(report.status, 'healthy');
    assert.equal(report.summary, 'sin degradación visible en stats');
    assert.deepEqual(report.findings, []);
  });
});