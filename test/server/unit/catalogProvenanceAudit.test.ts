import * as assert from 'assert/strict';

import { buildCatalogConsistencyReport } from '../../../src/server/knowledge/system/consistency';

suite('unit/catalogProvenanceAudit (B339)', () => {
  test('manual-core queda curado y generated queda official con provenance trazable', () => {
    const report = buildCatalogConsistencyReport();

    assert.equal(report.provenance.datasetAuthorityMismatch.length, 0);
    assert.equal(report.provenance.datasetKindMismatch.length, 0);
    assert.equal(report.provenance.missingSource.length, 0);
    assert.equal(report.provenance.missingVersion.length, 0);
    assert.equal(report.provenance.missingSourceUrlForOfficial.length, 0);
    assert.equal(report.provenance.missingGeneratedAtForGenerated.length, 0);
    assert.ok((report.provenance.byAuthority.curated ?? 0) > 0);
    assert.ok((report.provenance.byAuthority.official ?? 0) > 0);
    assert.ok((report.provenance.byKind.manual ?? 0) > 0);
    assert.ok((report.provenance.byKind.generated ?? 0) > 0);
    assert.equal(report.provenance.withVersion, report.total);
  });

  test('resume authority, source y version por dominio sin vender cobertura oficial falsa', () => {
    const report = buildCatalogConsistencyReport();
    const globalFunctions = report.provenance.domainSummaries['global-functions'];
    const systemGlobals = report.provenance.domainSummaries['system-globals'];
    const operators = report.provenance.domainSummaries['operators'];

    assert.ok(globalFunctions);
    assert.deepEqual(globalFunctions?.datasets, ['generated', 'manual-core']);
    assert.deepEqual(globalFunctions?.authorities, ['curated', 'official']);
    assert.deepEqual(globalFunctions?.versions, ['PowerBuilder 2025']);

    assert.ok(systemGlobals);
    assert.deepEqual(systemGlobals?.datasets, ['manual-core']);
    assert.deepEqual(systemGlobals?.authorities, ['curated']);
    assert.deepEqual(systemGlobals?.versions, ['PowerBuilder 2025']);

    assert.ok(operators);
    assert.deepEqual(operators?.datasets, ['manual-core']);
    assert.deepEqual(operators?.authorities, ['curated']);
    assert.equal(operators?.missingSourceUrlCount, 0);
  });
});