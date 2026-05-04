import * as assert from 'assert/strict';

import { classifyBuildOrcaFailures } from '../../../src/client/build/buildOrcaFailureClassification';
import type { ApiRuntimeJournalSnapshot, ApiServerStats } from '../../../src/shared/publicApi';

suite('unit/buildOrcaFailureClassification (B314)', () => {
  test('clasifica missing tool y compile errors del build moderno', () => {
    const summary = classifyBuildOrcaFailures({
      stats: {
        buildTooling: {
          status: 'missing',
          source: 'unresolved',
          capabilities: [],
          detail: 'No se encontró PBAutoBuild.',
        },
        buildRunner: {
          state: 'failed',
          detail: 'Build finalizado con errores.',
        },
        buildProblems: {
          total: 4,
          published: 3,
          unresolved: 1,
        },
      } as ApiServerStats,
    });

    assert.equal(summary.build.primaryReasonCode, 'missing-tool');
    assert.ok(summary.build.findings.some((finding) => finding.reasonCode === 'missing-tool'));
    assert.ok(summary.build.findings.some((finding) => finding.reasonCode === 'compile-errors'));
  });

  test('prefiere reason codes ORCA específicos desde el build-orca journal', () => {
    const buildOrcaJournal: ApiRuntimeJournalSnapshot = {
      total: 2,
      dropped: 0,
      events: [
        {
          ts: 1,
          phase: 'legacy',
          kind: 'orca-import',
          action: 'blocked',
          severity: 'warning',
          detail: {
            issues: [
              {
                code: 'source-conflict',
                severity: 'error',
                message: 'Conflicto de source real para u_demo.sru.',
              },
            ],
          },
        },
        {
          ts: 2,
          phase: 'legacy',
          kind: 'orca-import',
          action: 'blocked',
          severity: 'warning',
          detail: {
            issues: [
              {
                code: 'stale-staging',
                severity: 'error',
                message: 'El staging está obsoleto para lib_demo.pbl.',
              },
            ],
          },
        },
      ],
    };

    const summary = classifyBuildOrcaFailures({
      stats: {
        orcaTooling: {
          status: 'available',
          source: 'config',
          executablePath: 'C:/Tools/orca.exe',
          capabilities: ['legacy-script-runner'],
          detail: 'ORCA disponible vía configuración.',
          packagingPolicy: {
            exposure: 'not-exposed',
            requiresFeatureFlag: true,
            supportedArtifacts: ['exe', 'pbd', 'dll'],
            detail: 'Packaging ORCA no expuesto.',
          },
        },
        orcaRunner: {
          state: 'failed',
          detail: 'ORCA finalizó con código 1.',
        },
      } as ApiServerStats,
      buildOrcaJournal,
    });

    assert.equal(summary.orca.primaryReasonCode, 'stale-staging');
    assert.ok(summary.orca.findings.some((finding) => finding.reasonCode === 'stale-staging'));
    assert.ok(summary.orca.findings.some((finding) => finding.reasonCode === 'packaging-disabled'));
    assert.ok(summary.orca.findings.every((finding) => finding.reasonCode !== 'runner-failed'));
  });
});