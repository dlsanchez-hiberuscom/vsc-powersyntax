import * as assert from 'assert/strict';

import { buildCatalogConsistencyReport } from '../../../src/server/knowledge/system/consistency';

suite('unit/catalogAdoptionDecision (B369)', () => {
  test('decision gate recomienda generated primary con overlays manuales', () => {
    const report = buildCatalogConsistencyReport();

    assert.equal(report.adoption.completenessMode, 'complete');
    assert.equal(report.adoption.summary.recommendedPolicy, 'generated-primary-with-manual-overlays');
    assert.equal(report.adoption.summary.officialDomainsWithGaps.length, 0);
    assert.ok(report.adoption.summary.duplicateCount > 0);
    assert.ok(report.adoption.manualOnlyDomains.includes('operators'));
    assert.ok(report.adoption.manualOnlyDomains.includes('pronouns'));
  });

  test('decision gate expone métricas por dominio para coverage y overlays', () => {
    const report = buildCatalogConsistencyReport();
    const datatypes = report.adoption.domains.datatypes;
    const dataWindowFunctions = report.adoption.domains['datawindow-functions'];

    assert.equal(datatypes?.officialCount, 24);
    assert.equal(datatypes?.officialCoverage?.missingCount, 0);
    assert.equal(datatypes?.recommendedPolicy, 'generated-primary-with-manual-overlays');
    assert.ok((datatypes?.enrichmentCount ?? 0) > 0);

    assert.equal(dataWindowFunctions?.recommendedPolicy, 'generated-primary-with-manual-overlays');
    assert.ok((dataWindowFunctions?.overrideCount ?? 0) > 0);
    assert.ok((dataWindowFunctions?.generated.hoverUsefulness.ratio ?? 0) > 0);
  });
});