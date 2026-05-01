import * as assert from 'assert/strict';

import { decideFeatureReadiness, getSemanticReadinessLevel } from '../../../src/server/features/featureReadiness';
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