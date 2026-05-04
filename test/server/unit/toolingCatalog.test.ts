import * as assert from 'assert/strict';

import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { buildCatalogConsistencyReport } from '../../../src/server/knowledge/system/consistency';

suite('unit/toolingCatalog (B340)', () => {
  let catalog: SystemCatalog;

  setup(() => {
    catalog = new SystemCatalog();
  });

  test('publica ORCA y PBAutoBuild en tooling-symbols con namespace separado', () => {
    const entries = catalog.listByDomain('tooling-symbols');

    assert.ok(entries.length >= 8, `tooling-symbols=${entries.length}`);
    assert.ok(entries.some((entry) => entry.name === 'PBAutoBuild'));
    assert.ok(entries.some((entry) => entry.name === 'ORCA'));
    assert.ok(entries.every((entry) => entry.domain === 'tooling-symbols'));
    assert.ok(entries.every((entry) => entry.namespace === 'powerbuilder-tooling'));
  });

  test('permite lookup explícito por dominio sin contaminar resolveLanguageSymbol', () => {
    const tooling = catalog.findByDomainAndLookupKey('tooling-symbols', 'PBAutoBuild');

    assert.ok(tooling.length > 0, 'PBAutoBuild debe existir en tooling-symbols');
    assert.equal(tooling[0]?.kind, 'constant');
    assert.equal(catalog.resolveLanguageSymbol('PBAutoBuild'), undefined);
    assert.equal(catalog.resolveLanguageSymbol('ORCA'), undefined);
  });

  test('domainCounts incluye tooling-symbols sin romper el consistency report', () => {
    const report = buildCatalogConsistencyReport();

    assert.ok((report.domainCounts['tooling-symbols'] ?? 0) >= 8, 'tooling-symbols debe formar parte del catálogo');
  });
});