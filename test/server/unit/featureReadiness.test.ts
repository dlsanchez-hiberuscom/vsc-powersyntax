import * as assert from 'assert/strict';

import {
  compareResolutionConfidence,
  decideFeatureReadiness,
  getRequiredResolutionConfidence,
  isResolutionConfidenceSufficient,
  getSemanticReadinessLevel
} from '../../../src/server/features/featureReadiness';
import type { ProgressReadinessSnapshot } from '../../../src/server/features/progressReadiness';

function createSnapshot(levels: {
  activeContextReady: boolean;
  projectReady: boolean;
  workspaceReady: boolean;
}): ProgressReadinessSnapshot {
  return {
    readiness: {
      state: levels.workspaceReady ? 'ready' : levels.activeContextReady || levels.projectReady ? 'indexing' : 'idle',
      levels
    },
    progress: {
      discovery: { current: 1, total: 1 },
      indexing: {
        current: 0,
        total: 0,
        degraded: false,
        skipped: 0,
        failed: 0
      }
    },
    projectStatus: {
      readiness: levels.workspaceReady ? 'ready' : levels.activeContextReady || levels.projectReady ? 'indexing' : 'idle',
      totalFiles: 0,
      indexedFiles: 0
    },
    projectStatusText: 'workspace — inactivo'
  };
}

suite('unit/featureReadiness (B158)', () => {
  test('compareResolutionConfidence ordena low, medium y high', () => {
    assert.ok(compareResolutionConfidence('low', 'medium') < 0);
    assert.ok(compareResolutionConfidence('medium', 'high') < 0);
    assert.equal(compareResolutionConfidence('high', 'high'), 0);
  });

  test('getRequiredResolutionConfidence expone la politica minima por feature', () => {
    assert.equal(getRequiredResolutionConfidence('hover'), 'low');
    assert.equal(getRequiredResolutionConfidence('completion'), 'low');
    assert.equal(getRequiredResolutionConfidence('definition'), 'medium');
    assert.equal(getRequiredResolutionConfidence('references'), 'high');
    assert.equal(getRequiredResolutionConfidence('rename'), 'high');
  });

  test('isResolutionConfidenceSufficient respeta el threshold minimo por feature', () => {
    assert.equal(isResolutionConfidenceSufficient('hover', 'low'), true);
    assert.equal(isResolutionConfidenceSufficient('definition', 'low'), false);
    assert.equal(isResolutionConfidenceSufficient('definition', 'medium'), true);
    assert.equal(isResolutionConfidenceSufficient('references', 'medium'), false);
    assert.equal(isResolutionConfidenceSufficient('references', 'high'), true);
  });

  test('decideFeatureReadiness expone la confidence requerida en la decision', () => {
    const snapshot = createSnapshot({
      activeContextReady: true,
      projectReady: false,
      workspaceReady: false
    });

    const decision = decideFeatureReadiness('definition', snapshot);
    assert.equal(decision.requiredResolutionConfidence, 'medium');
  });

  test('decideFeatureReadiness propaga la confidence real cuando el contexto la aporta', () => {
    const snapshot = createSnapshot({
      activeContextReady: true,
      projectReady: false,
      workspaceReady: false
    });

    const decision = decideFeatureReadiness('definition', snapshot, { resolutionConfidence: 'low' });
    assert.equal(decision.actualResolutionConfidence, 'low');
  });

  test('decideFeatureReadiness bloquea definition si la confidence es insuficiente', () => {
    const snapshot = createSnapshot({
      activeContextReady: true,
      projectReady: false,
      workspaceReady: false
    });

    const decision = decideFeatureReadiness('definition', snapshot, { resolutionConfidence: 'low' });
    assert.equal(decision.action, 'block');
    assert.match(decision.reason, /low < medium/);
  });

  test('decideFeatureReadiness mantiene hover permitido con confidence low', () => {
    const snapshot = createSnapshot({
      activeContextReady: true,
      projectReady: false,
      workspaceReady: false
    });

    const decision = decideFeatureReadiness('hover', snapshot, { resolutionConfidence: 'low' });
    assert.equal(decision.action, 'allow');
  });

  test('structural-only bloquea definition, references y rename', () => {
    const snapshot = createSnapshot({
      activeContextReady: false,
      projectReady: false,
      workspaceReady: false
    });

    assert.equal(getSemanticReadinessLevel(snapshot), 'structural-only');
    assert.equal(decideFeatureReadiness('definition', snapshot).action, 'block');
    assert.equal(decideFeatureReadiness('references', snapshot).action, 'block');
    assert.equal(decideFeatureReadiness('rename', snapshot).action, 'block');
  });

  test('structural-only degrada hover y completion en lugar de bloquearlos', () => {
    const snapshot = createSnapshot({
      activeContextReady: false,
      projectReady: false,
      workspaceReady: false
    });

    assert.equal(decideFeatureReadiness('hover', snapshot).action, 'degrade');
    assert.equal(decideFeatureReadiness('completion', snapshot).action, 'degrade');
  });

  test('nearby-semantic-ready habilita definition y rename pero no references', () => {
    const snapshot = createSnapshot({
      activeContextReady: true,
      projectReady: false,
      workspaceReady: false
    });

    assert.equal(getSemanticReadinessLevel(snapshot), 'nearby-semantic-ready');
    assert.equal(decideFeatureReadiness('definition', snapshot).action, 'allow');
    assert.equal(decideFeatureReadiness('rename', snapshot).action, 'allow');
    assert.equal(decideFeatureReadiness('references', snapshot).action, 'block');
  });

  test('project-semantic-ready habilita references', () => {
    const snapshot = createSnapshot({
      activeContextReady: true,
      projectReady: true,
      workspaceReady: false
    });

    assert.equal(getSemanticReadinessLevel(snapshot), 'project-semantic-ready');
    assert.equal(decideFeatureReadiness('references', snapshot).action, 'allow');
  });

  test('presion de latencia degrada hover y completion aunque el readiness sea suficiente', () => {
    const snapshot = createSnapshot({
      activeContextReady: true,
      projectReady: true,
      workspaceReady: true
    });

    assert.equal(decideFeatureReadiness('hover', snapshot, { latencyOverloaded: true }).action, 'degrade');
    assert.equal(decideFeatureReadiness('completion', snapshot, { latencyOverloaded: true }).action, 'degrade');
  });

  test('presion de latencia bloquea references aunque el proyecto este listo', () => {
    const snapshot = createSnapshot({
      activeContextReady: true,
      projectReady: true,
      workspaceReady: false
    });

    assert.equal(decideFeatureReadiness('references', snapshot, { latencyOverloaded: true }).action, 'block');
  });
});