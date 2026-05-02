import * as assert from 'assert/strict';

import {
  PUBLIC_API_VERSION,
  getPublicApiContractDescriptor,
  getReadOnlyToolBridgeDescriptor,
} from '../../../src/shared/publicApi';
import {
  buildSemanticWorkspaceSnapshot,
  importSemanticWorkspaceSnapshot,
} from '../../../src/client/semanticWorkspaceSnapshot';

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
});