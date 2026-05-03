import * as assert from 'assert/strict';

import type { ApiSemanticWorkspaceManifest } from '../../../src/shared/publicApi';
import { buildProjectSupportMatrix } from '../../../src/client/projectSupportMatrix';
import { enrichRuntimeStatusStats, type RuntimeStatusStats } from '../../../src/client/statusBarPresentation';

suite('unit/projectSupportMatrix (B293)', () => {
  test('resume el contrato de soporte por modo sin requerir estado adicional del servidor', () => {
    const stats = enrichRuntimeStatusStats({
      workspace: {
        mode: 'solution',
        files: 42,
        sourceOrigins: {
          'solution-source': 20,
          'manual-export-source': 2,
          'orca-staging': 1,
        },
      },
      buildTooling: {
        status: 'available',
        source: 'config',
        executablePath: 'C:/pbautobuild250.exe',
        capabilities: ['json-build'],
        detail: 'PBAutoBuild disponible vía configuración.',
      },
      buildFiles: {
        total: 3,
        usable: 1,
        invalid: 1,
        ambiguous: 1,
      },
    }) as RuntimeStatusStats;

    const manifest: ApiSemanticWorkspaceManifest = {
      schemaVersion: '1.0.0',
      generatedAt: Date.now(),
      limits: {
        maxObjects: 200,
        maxSymbols: 400,
        objectsTruncated: false,
        symbolsTruncated: false,
      },
      projects: [
        {
          projectUri: 'file:///demo/demo.pbt',
          kind: 'target',
          name: 'demo',
          libraries: ['app.pbl'],
          fileCount: 42,
        },
      ],
      libraries: ['app.pbl'],
      objects: [
        {
          name: 'd_orders',
          uri: 'file:///demo/d_orders.srd',
          objectKind: 'datawindow',
          sourceOrigin: 'solution-source',
        },
      ],
      inheritanceSummary: {
        totalTypes: 1,
        roots: 1,
        items: [],
      },
      exportedSymbols: [],
      sourceOriginSummary: {
        'solution-source': 20,
        'manual-export-source': 2,
        'orca-staging': 1,
      },
      readiness: {
        state: 'ready',
      },
    };

    const matrix = buildProjectSupportMatrix(stats, manifest);
    const byKey = new Map(matrix.items.map((item) => [item.key, item]));

    assert.equal(matrix.schemaVersion, '1.0.0');
    assert.equal(matrix.currentMode, 'solution');
    assert.equal(matrix.items.length, 9);

    assert.equal(byKey.get('workspace')?.status, 'available');
    assert.equal(byKey.get('solution')?.status, 'active');
    assert.equal(byKey.get('target-pbt')?.status, 'present');
    assert.equal(byKey.get('pbl-only-legacy')?.supportLevel, 'read-only');
    assert.equal(byKey.get('source-plain-text')?.status, 'present');
    assert.equal(byKey.get('orca-staging')?.status, 'present');
    assert.equal(byKey.get('datawindow-srd')?.status, 'present');
    assert.equal(byKey.get('pbautobuild')?.status, 'available');
    assert.equal(byKey.get('powerserver-powerclient-build-files')?.status, 'available');

    assert.match(byKey.get('pbautobuild')?.detail ?? '', /1 utilizables · 1 inválidos · 1 ambiguos/);
    assert.match(byKey.get('source-plain-text')?.detail ?? '', /manual-export-source/);
    assert.match(byKey.get('datawindow-srd')?.detail ?? '', /1 DataWindow/);
    assert.match(byKey.get('orca-staging')?.limitations ?? '', /no se declara fuente canónica/i);
  });

  test('degrada con honestidad cuando faltan stats y manifest', () => {
    const matrix = buildProjectSupportMatrix();
    const pbAutoBuild = matrix.items.find((item) => item.key === 'pbautobuild');

    assert.equal(matrix.currentMode, undefined);
    assert.equal(pbAutoBuild?.status, 'unavailable');
    assert.match(pbAutoBuild?.detail ?? '', /tooling no detectado/i);
    assert.equal(matrix.items.find((item) => item.key === 'workspace')?.status, 'available');
  });
});