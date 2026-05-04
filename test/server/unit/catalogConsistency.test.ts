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
    assert.equal(r.localization.incompleteOverlays.length, 0, `localization incomplete: ${r.localization.incompleteOverlays.slice(0, 3).map(item => `${item.targetName}:${item.missingFields.join('+')}`).join(',')}`);
    assert.equal(r.localization.invalidParameterTargets.length, 0, `localization invalid parameter targets: ${r.localization.invalidParameterTargets.slice(0, 3).map(item => `${item.targetName}:${item.parameterName}`).join(',')}`);
    assert.equal(r.localization.recoveredTargetIds.length, 0, `localization recovered targetIds: ${r.localization.recoveredTargetIds.slice(0, 3).map(item => `${item.targetName}:${item.previousTargetId}`).join(',')}`);
    assert.equal(r.localization.orphanOverlays.length, 0, `localization orphans: ${r.localization.orphanOverlays.slice(0, 3).map(item => item.reason).join(',')}`);
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
    assert.ok((r.manualOverlayModes.enrichment ?? 0) > 0);
    assert.ok((r.manualOverlayModes.gap ?? 0) === 0);
    assert.ok((r.manualOverlayModes.candidate ?? 0) === 0);
    assert.ok((r.localization.locales.es?.overlayCount ?? 0) > 0);
    assert.equal(r.adoption.summary.recommendedPolicy, 'generated-primary-with-manual-overlays');
    assert.equal(r.adoption.summary.officialDomainsWithGaps.length, 0);
  });
});
