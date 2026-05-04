import * as assert from 'assert/strict';

import { findPowerBuilderFrameworkKnowledgePacksForOwnerTypes, listPowerBuilderFrameworkKnowledgePacks } from '../../../src/server/knowledge/system/frameworkKnowledgePacks';
import { buildFrameworkKnowledgeConflictPolicy } from '../../../src/server/knowledge/system/frameworkKnowledgePackPolicy';
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

  test('clasifica source real del workspace como ganador frente a knowledge packs aplicables', () => {
    const policy = buildFrameworkKnowledgeConflictPolicy({
      ownerTypes: ['WebBrowser', 'window'],
      sourceOrigin: 'pbl-folder-source',
      confidence: 'high',
    });

    assert.equal(policy?.state, 'workspace-wins');
    assert.equal(policy?.reasonCode, 'workspace-source-overrides-framework-pack');
    assert.deepEqual(policy?.matchedOwnerTypes, ['webbrowser', 'window']);
    assert.ok(policy?.packs.some((pack) => pack.id === 'appeon-webbrowser-webview2'));
    assert.match(policy?.summary ?? '', /workspace/);
  });

  test('degrada a advisory cuando solo hay packs aplicables sin source origin fuerte', () => {
    const policy = buildFrameworkKnowledgeConflictPolicy({
      ownerTypes: ['RibbonBar'],
      sourceOrigin: 'unknown',
      confidence: 'low',
    });

    assert.equal(policy?.state, 'pack-advisory');
    assert.equal(policy?.reasonCode, 'framework-pack-advisory');
    assert.ok(policy?.packs.some((pack) => pack.id === 'appeon-ribbonbar-ui'));
  });
});