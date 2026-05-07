import * as assert from 'assert/strict';

import { buildRuntimeMemoryReport } from '../../../src/server/runtime/memoryBudgets';
import {
  applyAdaptiveLimit,
  buildRuntimeMemoryPressurePolicy,
  isWorkloadDeferredByMemoryPressure,
} from '../../../src/server/runtime/memoryPressurePolicy';

suite('unit/memoryPressurePolicy (B274)', () => {
  test('permanece healthy sin limpiar serving cache ni aplazar workloads', () => {
    const report = buildRuntimeMemoryReport({
      analysis: { size: 10 },
      serving: { size: 5 },
      documents: { size: 4, internedStrings: 100 },
      hotContext: { inheritedTypes: 2 },
      codeLens: { size: 3 },
      kb: { totalEntities: 500, indexedScopes: 100, internedStrings: 200, snapshotDocuments: 5 },
    });

    const policy = buildRuntimeMemoryPressurePolicy(report);

    assert.equal(policy.level, 'healthy');
    assert.equal(policy.purgeServingCache, false);
    assert.equal(policy.allowServingCacheWrites, true);
    assert.deepEqual(policy.deferredWorkloads, []);
    assert.equal(policy.reportLimits, undefined);
    assert.equal(isWorkloadDeferredByMemoryPressure(policy, 'background-indexing'), false);
  });

  test('warning solicita eviction de document cache sin matar serving cache', () => {
    const report = buildRuntimeMemoryReport({
      analysis: { size: 220 },
      serving: { size: 50 },
      documents: { size: 20, internedStrings: 1_000 },
      hotContext: { inheritedTypes: 10 },
      codeLens: { size: 100 },
      kb: { totalEntities: 200_000, indexedScopes: 20_000, internedStrings: 10_000, snapshotDocuments: 300 },
    });

    const policy = buildRuntimeMemoryPressurePolicy(report);

    assert.equal(report.status, 'warning');
    assert.equal(policy.level, 'warning');
    // CACHE-P0-MEMORY-PRESSURE-GRADUATED-POLICY-01: warning does NOT purge serving cache
    assert.equal(policy.purgeServingCache, false);
    assert.equal(policy.allowServingCacheWrites, true);
    assert.equal(policy.requestDocumentCacheEviction, true);
    // Warning does NOT defer background-indexing (prevents discovery deadlock)
    assert.equal(isWorkloadDeferredByMemoryPressure(policy, 'background-indexing'), false);
    assert.equal(isWorkloadDeferredByMemoryPressure(policy, 'maintenance'), true);
    assert.equal(isWorkloadDeferredByMemoryPressure(policy, 'interactive'), false);
    assert.equal(isWorkloadDeferredByMemoryPressure(policy, 'near-context'), false);
    assert.equal(policy.reportLimits?.semanticWorkspaceManifest.maxObjects, 120);
    assert.equal(policy.reportLimits?.technicalDebtReport.maxHotspots, 20);
  });

  test('error endurece los caps sin bloquear por si mismo export-reporting', () => {
    const report = buildRuntimeMemoryReport({
      analysis: { size: 400 },
      serving: { size: 800 },
      documents: { size: 200, internedStrings: 40_000 },
      hotContext: { inheritedTypes: 600 },
      codeLens: { size: 600 },
      kb: { totalEntities: 600_000, indexedScopes: 80_000, internedStrings: 80_000, snapshotDocuments: 1_500 },
    });

    const policy = buildRuntimeMemoryPressurePolicy(report);

    assert.equal(report.status, 'error');
    assert.equal(policy.level, 'error');
    assert.equal(policy.purgeServingCache, true);
    assert.equal(policy.allowServingCacheWrites, false);
    assert.equal(isWorkloadDeferredByMemoryPressure(policy, 'export-reporting'), false);
    assert.equal(policy.reportLimits?.semanticWorkspaceManifest.maxSymbols, 80);
    assert.equal(policy.reportLimits?.codeMetrics.maxObjects, 30);
    assert.match(policy.reason, /^memory-pressure:/);
  });

  test('applyAdaptiveLimit preserva solicitudes pequenas y recorta las grandes al cap degradado', () => {
    assert.equal(applyAdaptiveLimit(undefined, 40, 1), 40);
    assert.equal(applyAdaptiveLimit(12, 40, 1), 12);
    assert.equal(applyAdaptiveLimit(400, 40, 1), 40);
    assert.equal(applyAdaptiveLimit(0, 8, 0), 0);
  });
});