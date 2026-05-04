import * as assert from 'assert/strict';

import { buildWorkspaceCheckCatalogSummary } from '../../../src/server/features/workspaceCheckCatalogSummary';

suite('unit/workspaceCheckCatalogSummary (B335)', () => {
  test('resume el gate ADR-0001 sobre el catalogo real', () => {
    const summary = buildWorkspaceCheckCatalogSummary();

    assert.equal(summary.available, true);
    assert.equal(summary.consistencyStatus, 'passed');
    assert.equal(summary.generatedManualConflicts, 0);
    assert.equal(summary.orphanLocalizationOverlays, 0);
    assert.ok(summary.totalEntries && summary.totalEntries > 0);

    const compliance = summary.adrCompliance;
    assert.ok(compliance);
    assert.equal(compliance?.status, 'passed');
    assert.equal(compliance?.recommendedPolicy, 'generated-primary-with-manual-overlays');
    assert.equal(compliance?.completenessMode, 'complete');
    assert.equal(compliance?.officialDomainsWithGaps.length, 0);
    assert.equal(compliance?.officialCoverageDriftDomains.length, 0);
    assert.equal(compliance?.candidateHotPathViolations, 0);
    assert.equal(compliance?.scraperErrorCount, 0);
    assert.ok((compliance?.manualPrimaryDomains.length ?? 0) > 0);
    assert.ok((compliance?.officialEntries ?? 0) > 0);
    assert.ok((compliance?.curatedEntries ?? 0) > 0);
  });

  test('devuelve copias defensivas de arrays y objetos anidados', () => {
    const first = buildWorkspaceCheckCatalogSummary();
    first.adrCompliance?.manualPrimaryDomains.push('mutated');
    if (first.adrCompliance) {
      first.adrCompliance.overlayCounts.gap = 999;
    }

    const second = buildWorkspaceCheckCatalogSummary();
    assert.ok(!second.adrCompliance?.manualPrimaryDomains.includes('mutated'));
    assert.notEqual(second.adrCompliance?.overlayCounts.gap, 999);
  });
});