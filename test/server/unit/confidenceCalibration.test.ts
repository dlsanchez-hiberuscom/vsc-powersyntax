import * as assert from 'assert/strict';

import {
  buildConfidenceCalibrationReport,
  type ConfidenceCalibrationScenario,
} from '../../../src/server/features/confidenceCalibration';
import type { ProgressReadinessSnapshot } from '../../../src/server/features/progressReadiness';

function createReadySnapshot(): ProgressReadinessSnapshot {
  return {
    readiness: {
      state: 'ready',
      levels: {
        activeContextReady: true,
        projectReady: true,
        workspaceReady: true,
      },
    },
    progress: {
      discovery: { current: 1, total: 1 },
      indexing: {
        current: 1,
        total: 1,
        degraded: false,
        skipped: 0,
        failed: 0,
      },
    },
    projectStatus: {
      readiness: 'ready',
      totalFiles: 1,
      indexedFiles: 1,
    },
    projectStatusText: 'workspace — ready',
  };
}

suite('unit/confidenceCalibration (B283)', () => {
  test('clasifica resultados más permisivos como false-positive y más restrictivos como false-negative', () => {
    const ready = createReadySnapshot();
    const scenarios: ConfidenceCalibrationScenario[] = [
      {
        corpus: 'synthetic',
        label: 'expected-block-but-actual-allows',
        readinessSnapshot: ready,
        resolutionConfidence: 'high',
        expectations: [
          { feature: 'hover', expectedAction: 'block' },
        ],
      },
      {
        corpus: 'synthetic',
        label: 'expected-allow-but-actual-blocks',
        readinessSnapshot: ready,
        resolutionConfidence: 'low',
        expectations: [
          { feature: 'definition', expectedAction: 'allow' },
        ],
      },
    ];

    const report = buildConfidenceCalibrationReport(scenarios);

    assert.equal(report.totalExpectations, 2);
    assert.equal(report.matches, 0);
    assert.equal(report.falsePositives, 1);
    assert.equal(report.falseNegatives, 1);
    assert.deepEqual(
      report.findings.map((finding) => ({ feature: finding.feature, classification: finding.classification })),
      [
        { feature: 'hover', classification: 'false-positive' },
        { feature: 'definition', classification: 'false-negative' },
      ],
    );
  });

  test('resume matches por feature cuando las expectativas calibradas coinciden con la política', () => {
    const ready = createReadySnapshot();
    const report = buildConfidenceCalibrationReport([
      {
        corpus: 'synthetic',
        label: 'low-confidence',
        readinessSnapshot: ready,
        resolutionConfidence: 'low',
        expectations: [
          { feature: 'hover', expectedAction: 'allow' },
          { feature: 'completion', expectedAction: 'allow' },
          { feature: 'definition', expectedAction: 'block' },
          { feature: 'references', expectedAction: 'block' },
          { feature: 'rename', expectedAction: 'block' },
          { feature: 'signature-help', expectedAction: 'allow' },
        ],
      },
      {
        corpus: 'synthetic',
        label: 'medium-confidence',
        readinessSnapshot: ready,
        resolutionConfidence: 'medium',
        expectations: [
          { feature: 'definition', expectedAction: 'allow' },
          { feature: 'references', expectedAction: 'block' },
          { feature: 'rename', expectedAction: 'block' },
        ],
      },
      {
        corpus: 'synthetic',
        label: 'high-confidence',
        readinessSnapshot: ready,
        resolutionConfidence: 'high',
        expectations: [
          { feature: 'definition', expectedAction: 'allow' },
          { feature: 'references', expectedAction: 'allow' },
          { feature: 'rename', expectedAction: 'allow' },
        ],
      },
    ]);

    assert.equal(report.falsePositives, 0);
    assert.equal(report.falseNegatives, 0);
    assert.equal(report.matches, report.totalExpectations);
    assert.equal(report.byFeature.definition.matches, 3);
    assert.equal(report.byFeature.references.matches, 3);
    assert.equal(report.byFeature.rename.matches, 3);
    assert.equal(report.byFeature.hover.matches, 1);
    assert.equal(report.byFeature.completion.matches, 1);
    assert.equal(report.byFeature['signature-help'].matches, 1);
  });
});