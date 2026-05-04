import * as assert from 'assert/strict';
import { buildCatalogConsistencyReport } from '../../../src/server/knowledge/system/consistency';

suite('unit/catalogConsistency (B132)', () => {
  test('catálogo actual sin duplicados ni signatures vacías', () => {
    const r = buildCatalogConsistencyReport();
    assert.equal(r.duplicateIds.length, 0, `dups: ${r.duplicateIds.slice(0, 3).join(',')}`);
    assert.equal(r.missingSignatures.length, 0);
    assert.equal(r.emptyName.length, 0);
    assert.equal(r.invalidEnumeratedTypeNames.length, 0);
    assert.equal(r.manualGeneratedOverlapsWithoutOverlay.length, 0, `manual/generated sin overlay: ${r.manualGeneratedOverlapsWithoutOverlay.slice(0, 3).join(',')}`);
  });

  test('domain counts suman al total', () => {
    const r = buildCatalogConsistencyReport();
    const sum = Object.values(r.domainCounts).reduce((a, b) => a + b, 0);
    assert.equal(sum, r.total);
  });

  test('datasets manual + generated presentes', () => {
    const r = buildCatalogConsistencyReport();
    assert.ok((r.datasetCounts['manual-core'] ?? 0) > 0);
    assert.ok((r.datasetCounts['generated'] ?? 0) > 0);
    assert.ok((r.manualOverlayModes.gap ?? 0) > 0);
    assert.ok((r.manualOverlayModes.enrichment ?? 0) > 0);
    assert.equal(r.adoption.summary.recommendedPolicy, 'generated-primary-with-manual-overlays');
    assert.equal(r.adoption.summary.officialDomainsWithGaps.length, 0);
  });
});
