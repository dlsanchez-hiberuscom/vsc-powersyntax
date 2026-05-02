import * as assert from 'assert/strict';

import { findPowerBuilderFrameworkKnowledgePacksForOwnerTypes, listPowerBuilderFrameworkKnowledgePacks } from '../../../src/server/knowledge/system/frameworkKnowledgePacks';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';

suite('unit/frameworkKnowledgePacks (B248)', () => {
  test('publica packs curados versionados y trazables sobre el catálogo oficial', () => {
    const catalog = new SystemCatalog();
    const packs = listPowerBuilderFrameworkKnowledgePacks(catalog);

    assert.ok(packs.length >= 3);
    assert.ok(packs.every((pack) => /^\d+\.\d+\.\d+$/.test(pack.version)));
    assert.ok(packs.every((pack) => pack.symbolCount > 0));
    assert.ok(packs.every((pack) => pack.source.includes('curated framework pack')));
  });

  test('resuelve packs aplicables por owner type sin duplicar motores semánticos', () => {
    const catalog = new SystemCatalog();
    const packs = findPowerBuilderFrameworkKnowledgePacksForOwnerTypes(catalog, ['WebBrowser', 'window']);

    assert.ok(packs.some((pack) => pack.id === 'appeon-webbrowser-webview2'));
    assert.ok(!packs.some((pack) => pack.id === 'appeon-mobilink-sync'));
  });
});