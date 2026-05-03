import * as assert from 'assert/strict';

import {
  type ApiSemanticWorkspaceManifest,
  PUBLIC_API_VERSION,
  getPublicApiContractDescriptor,
  getReadOnlyToolBridgeDescriptor,
} from '../../../src/shared/publicApi';
import {
  buildSemanticWorkspaceSnapshot,
  diffSemanticWorkspaceSnapshots,
  importSemanticWorkspaceSnapshot,
} from '../../../src/client/semanticWorkspaceSnapshot';
import { loadFixture } from '../helpers/fixtureLoader';

function loadJsonFixture<T>(fileName: string): T {
  return JSON.parse(loadFixture('compatibility', fileName)) as T;
}

suite('unit/semanticWorkspaceSnapshot (B243)', () => {
  test('exporta un snapshot versionado y resumido del workspace', () => {
    const snapshot = buildSemanticWorkspaceSnapshot({
      apiVersion: PUBLIC_API_VERSION,
      contract: getPublicApiContractDescriptor(),
      readOnlyToolBridge: getReadOnlyToolBridgeDescriptor(),
      workspaceManifest: {
        schemaVersion: '1.0.0',
        generatedAt: 1,
        limits: { maxObjects: 2, maxSymbols: 3, objectsTruncated: false, symbolsTruncated: false },
        projects: [{ projectUri: 'file:///proj/app.pbt', kind: 'target', name: 'app', libraries: ['file:///proj/lib_app.pbl'], fileCount: 2 }],
        libraries: ['file:///proj/lib_app.pbl'],
        objects: [
          { name: 'w_main', uri: 'file:///proj/lib_app.pbl/w_main.srw', objectKind: 'window' },
          { name: 'n_service', uri: 'file:///proj/lib_app.pbl/n_service.sru', objectKind: 'userobject' },
        ],
        inheritanceSummary: { totalTypes: 2, roots: 1, items: [] },
        exportedSymbols: [{ name: 'w_main', kind: 'Type', uri: 'file:///proj/lib_app.pbl/w_main.srw', line: 0, character: 0 }],
        sourceOriginSummary: { 'pbl-folder-source': 2 },
        readiness: { state: 'ready' },
      },
      serverStats: {
        health: {
          status: 'healthy',
          summary: 'ok',
          findings: [],
          counts: { info: 0, warning: 0, error: 0 },
          checkedLayers: [],
        },
      },
      generatedAt: '2026-05-02T12:30:00.000Z',
    });

    assert.equal(snapshot.schemaVersion, '1.0.0');
    assert.equal(snapshot.apiVersion, PUBLIC_API_VERSION);
    assert.equal(snapshot.summary.projectCount, 1);
    assert.equal(snapshot.summary.objectCount, 2);
    assert.equal(snapshot.summary.exportedSymbolCount, 1);
    assert.equal(snapshot.summary.readinessState, 'ready');
    assert.equal(snapshot.summary.healthStatus, 'healthy');
  });

  test('importa un snapshot válido y rechaza schemaVersion no soportado', () => {
    const snapshot = buildSemanticWorkspaceSnapshot({
      apiVersion: PUBLIC_API_VERSION,
      contract: getPublicApiContractDescriptor(),
      readOnlyToolBridge: getReadOnlyToolBridgeDescriptor(),
      workspaceManifest: {
        schemaVersion: '1.0.0',
        generatedAt: 1,
        limits: { maxObjects: 1, maxSymbols: 1, objectsTruncated: false, symbolsTruncated: false },
        projects: [],
        libraries: [],
        objects: [],
        inheritanceSummary: { totalTypes: 0, roots: 0, items: [] },
        exportedSymbols: [],
        sourceOriginSummary: {},
        readiness: {},
      },
      generatedAt: '2026-05-02T12:30:00.000Z',
    });

    const imported = importSemanticWorkspaceSnapshot(snapshot, 'file:///tmp/snapshot.json');
    assert.equal(imported.valid, true);
    assert.equal(imported.sourceUri, 'file:///tmp/snapshot.json');
    assert.equal(imported.summary?.objectCount, 0);

    const invalid = importSemanticWorkspaceSnapshot({ ...snapshot, schemaVersion: '9.0.0' });
    assert.equal(invalid.valid, false);
    assert.match(invalid.reason ?? '', /schemaVersion no soportado/i);
  });

  test('migra un snapshot legado compatible sin schemaVersion ni summary', () => {
    const legacySnapshot = loadJsonFixture<unknown>('semantic-workspace-snapshot.legacy-no-summary.json');

    const imported = importSemanticWorkspaceSnapshot(legacySnapshot, 'file:///tmp/legacy-snapshot.json');

    assert.equal(imported.valid, true);
    assert.equal(imported.sourceUri, 'file:///tmp/legacy-snapshot.json');
    assert.equal(imported.snapshot?.schemaVersion, '1.0.0');
    assert.deepEqual(imported.summary, {
      projectCount: 1,
      objectCount: 2,
      exportedSymbolCount: 1,
      readinessState: 'ready',
      healthStatus: 'healthy',
    });
  });

  test('roundtripea un manifest versionado desde fixture externo', () => {
    const workspaceManifest = loadJsonFixture<ApiSemanticWorkspaceManifest>('semantic-workspace-manifest.v1.json');

    const snapshot = buildSemanticWorkspaceSnapshot({
      apiVersion: PUBLIC_API_VERSION,
      contract: getPublicApiContractDescriptor(),
      readOnlyToolBridge: getReadOnlyToolBridgeDescriptor(),
      workspaceManifest,
      serverStats: {
        health: {
          status: 'healthy',
          summary: 'ok',
          findings: [],
          counts: { info: 0, warning: 0, error: 0 },
          checkedLayers: [],
        },
      },
      generatedAt: '2026-05-03T18:00:00.000Z',
    });

    const imported = importSemanticWorkspaceSnapshot(JSON.parse(JSON.stringify(snapshot)));

    assert.equal(imported.valid, true);
    assert.deepEqual(imported.snapshot?.workspaceManifest, workspaceManifest);
    assert.deepEqual(imported.summary, {
      projectCount: workspaceManifest.projects.length,
      objectCount: workspaceManifest.objects.length,
      exportedSymbolCount: workspaceManifest.exportedSymbols.length,
      readinessState: 'ready',
      healthStatus: 'healthy',
    });
  });

  test('resume cambios relevantes entre dos snapshots exportados', () => {
    const previous = buildSemanticWorkspaceSnapshot({
      apiVersion: PUBLIC_API_VERSION,
      contract: getPublicApiContractDescriptor(),
      readOnlyToolBridge: getReadOnlyToolBridgeDescriptor(),
      workspaceManifest: {
        schemaVersion: '1.0.0',
        generatedAt: 1,
        limits: { maxObjects: 4, maxSymbols: 4, objectsTruncated: false, symbolsTruncated: false },
        projects: [{ projectUri: 'file:///proj/app.pbt', kind: 'target', name: 'app', libraries: ['file:///proj/lib_app.pbl'], fileCount: 2 }],
        libraries: ['file:///proj/lib_app.pbl'],
        objects: [{ name: 'w_main', uri: 'file:///proj/lib_app.pbl/w_main.srw', objectKind: 'window', sourceOrigin: 'pbl-folder-source' }],
        inheritanceSummary: { totalTypes: 1, roots: 1, items: [] },
        exportedSymbols: [{ name: 'w_main', kind: 'Type', uri: 'file:///proj/lib_app.pbl/w_main.srw', line: 0, character: 0 }],
        diagnosticsSummary: { totals: { error: 0, warning: 1, info: 0, hint: 0 }, byFile: {}, byCode: {}, bySeverity: {}, documents: [], projects: [] },
        sourceOriginSummary: { 'pbl-folder-source': 1 },
        readiness: { state: 'ready' },
      },
      serverStats: {
        health: { status: 'healthy', summary: 'ok', findings: [], counts: { info: 0, warning: 0, error: 0 }, checkedLayers: [] },
      },
      generatedAt: '2026-05-03T00:00:00.000Z',
    });

    const next = JSON.parse(JSON.stringify(previous));
    next.generatedAt = '2026-05-03T00:05:00.000Z';
    next.workspaceManifest.objects.push({
      name: 'n_service',
      uri: 'file:///proj/lib_app.pbl/n_service.sru',
      objectKind: 'userobject',
      sourceOrigin: 'pbl-folder-source',
    });
    next.workspaceManifest.exportedSymbols.push({
      name: 'of_process',
      kind: 'Function',
      uri: 'file:///proj/lib_app.pbl/n_service.sru',
      line: 4,
      character: 2,
    });
    next.workspaceManifest.diagnosticsSummary.totals.warning = 2;
    next.workspaceManifest.sourceOriginSummary['pbl-folder-source'] = 2;
    next.workspaceManifest.readiness.state = 'indexing';
    next.serverStats.health.status = 'warning';
    next.summary.objectCount = 2;
    next.summary.exportedSymbolCount = 2;
    next.summary.readinessState = 'indexing';
    next.summary.healthStatus = 'warning';

    const diff = diffSemanticWorkspaceSnapshots({
      previous,
      next,
      previousLabel: 'baseline',
      nextLabel: 'candidate',
      maxObjectChanges: 8,
      maxSymbolChanges: 8,
    });

    assert.equal(diff.changed, true);
    assert.equal(diff.previousLabel, 'baseline');
    assert.equal(diff.nextLabel, 'candidate');
    assert.equal(diff.summary.objects.added, 1);
    assert.equal(diff.summary.exportedSymbols.added, 1);
    assert.equal(diff.summary.diagnosticsChanged, true);
    assert.equal(diff.summary.readinessChanged, true);
    assert.equal(diff.summary.healthChanged, true);
    assert.equal(diff.objectChanges[0]?.change, 'added');
    assert.equal(diff.symbolChanges[0]?.change, 'added');
  });
});