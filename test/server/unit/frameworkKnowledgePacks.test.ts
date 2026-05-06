import * as assert from 'assert/strict';
import * as fs from 'fs';
import * as path from 'path';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { findPowerBuilderFrameworkKnowledgePacksForOwnerTypes, listPowerBuilderFrameworkKnowledgePacks } from '../../../src/server/knowledge/system/frameworkKnowledgePacks';
import { buildFrameworkKnowledgeConflictPolicy } from '../../../src/server/knowledge/system/frameworkKnowledgePackPolicy';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { EntityKind } from '../../../src/server/knowledge/types';
import { getOrderEntryPath, hasOrderEntry } from '../helpers/orderEntryPaths';
import { getPfcWorkspacePath, hasPfcWorkspace } from '../helpers/pfcPaths';

suite('unit/frameworkKnowledgePacks (B248)', () => {
  function analyzeFrameworkType(filePath: string): { name: string; baseTypeName?: string } {
    const uri = `file:///${filePath.replace(/\\/g, '/')}`;
    const document = TextDocument.create(uri, 'powerbuilder', 1, fs.readFileSync(filePath, 'utf8'));
    const analysis = analyzeDocument(document);
    const typeEntity = analysis.semanticFacts.find((entity) => entity.kind === EntityKind.Type);

    assert.ok(typeEntity, `Se esperaba un type principal en ${filePath}`);
    return {
      name: typeEntity.name,
      ...(typeEntity.baseTypeName ? { baseTypeName: typeEntity.baseTypeName } : {}),
    };
  }

  test('publica packs curados versionados y trazables sobre el catálogo oficial', () => {
    const catalog = new SystemCatalog();
    const packs = listPowerBuilderFrameworkKnowledgePacks(catalog);

    assert.ok(packs.length >= 5);
    assert.ok(packs.every((pack) => /^\d+\.\d+\.\d+$/.test(pack.version)));
    assert.ok(packs.every((pack) => pack.symbolCount > 0));
    assert.ok(packs.every((pack) => pack.source.includes('curated framework pack')));
  });

  test('resuelve packs aplicables por owner type sin duplicar motores semánticos', () => {
    const catalog = new SystemCatalog();
    const packs = findPowerBuilderFrameworkKnowledgePacksForOwnerTypes(catalog, ['WebBrowser', 'window']);
    const pfcPacks = findPowerBuilderFrameworkKnowledgePacksForOwnerTypes(catalog, ['w_response']);
    const stdPacks = findPowerBuilderFrameworkKnowledgePacksForOwnerTypes(catalog, ['wn_controller_master']);

    assert.ok(packs.some((pack) => pack.id === 'appeon-webbrowser-webview2'));
    assert.ok(!packs.some((pack) => pack.id === 'appeon-mobilink-sync'));
    assert.ok(pfcPacks.some((pack) => pack.id === 'pfc-response-dwsrv'));
    assert.ok(stdPacks.some((pack) => pack.id === 'std-controller-shells'));
  });

  test('usa summary advisory cuando el owner type framework-specific no vive en el catálogo oficial', () => {
    const catalog = new SystemCatalog();
    const packs = listPowerBuilderFrameworkKnowledgePacks(catalog);
    const pfcPack = packs.find((pack) => pack.id === 'pfc-response-dwsrv');
    const stdPack = packs.find((pack) => pack.id === 'std-controller-shells');

    assert.equal(pfcPack?.memberCount, 4);
    assert.equal(pfcPack?.eventCount, 2);
    assert.ok(pfcPack?.symbolSamples.includes('pfc_FilterDlg'));
    assert.equal(stdPack?.memberCount, 3);
    assert.equal(stdPack?.eventCount, 4);
    assert.ok(stdPack?.symbolSamples.includes('oe_PostOpen'));
  });

  test('reconoce families PFC y STD sobre corpus local cuando los fixtures existen', function () {
    if (!hasPfcWorkspace() || !hasOrderEntry()) {
      this.skip();
    }

    const pfcType = analyzeFrameworkType(path.join(
      getPfcWorkspacePath(),
      'ws_objects',
      'security administrator',
      'pfcsecad.pbl.src',
      'w_pfcsecurity_login.srw',
    ));
    const stdType = analyzeFrameworkType(path.join(
      getOrderEntryPath(),
      'oes_main.pbl',
      'wn_controller_orderentry_e.srw',
    ));

    const pfcPolicy = buildFrameworkKnowledgeConflictPolicy({
      ownerTypes: [pfcType.name, pfcType.baseTypeName],
      sourceOrigin: 'pbl-folder-source',
      confidence: 'high',
    });
    const stdPolicy = buildFrameworkKnowledgeConflictPolicy({
      ownerTypes: [stdType.name, stdType.baseTypeName],
      sourceOrigin: 'pbl-folder-source',
      confidence: 'high',
    });

    assert.ok(pfcPolicy?.packs.some((pack) => pack.id === 'pfc-response-dwsrv'));
    assert.ok(stdPolicy?.packs.some((pack) => pack.id === 'std-controller-shells'));
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