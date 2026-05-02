import * as assert from 'assert/strict';

import { resolveServingReadiness } from '../../../src/server/features/servingReadiness';
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

suite('unit/servingReadiness (B171)', () => {
  test('references devuelve warning estable y resultado bloqueado con confidence insuficiente', () => {
    const readiness = resolveServingReadiness({
      feature: 'references',
      consumerLabel: 'references',
      snapshot: createSnapshot({
        activeContextReady: true,
        projectReady: true,
        workspaceReady: false
      }),
      blockedResult: [],
      context: {
        resolutionConfidence: 'medium'
      }
    });

    assert.equal(readiness.blocked, true);
    assert.deepEqual(readiness.blockedResult, []);
    assert.equal(readiness.decision.actualResolutionConfidence, 'medium');
    assert.match(readiness.warningMessage ?? '', /^\[references\] bloqueado: references bloqueado por confidence insuficiente \(medium < high\)$/);
  });

  test('rename devuelve warning estable y resultado nulo con confidence insuficiente', () => {
    const readiness = resolveServingReadiness({
      feature: 'rename',
      consumerLabel: 'rename',
      snapshot: createSnapshot({
        activeContextReady: true,
        projectReady: false,
        workspaceReady: false
      }),
      blockedResult: null,
      context: {
        resolutionConfidence: 'low'
      }
    });

    assert.equal(readiness.blocked, true);
    assert.equal(readiness.blockedResult, null);
    assert.equal(readiness.decision.actualResolutionConfidence, 'low');
    assert.match(readiness.warningMessage ?? '', /^\[rename\] bloqueado: rename bloqueado por confidence insuficiente \(low < high\)$/);
  });

  test('references deja pasar el request cuando readiness y confidence son suficientes', () => {
    const readiness = resolveServingReadiness({
      feature: 'references',
      consumerLabel: 'references',
      snapshot: createSnapshot({
        activeContextReady: true,
        projectReady: true,
        workspaceReady: false
      }),
      blockedResult: [],
      context: {
        resolutionConfidence: 'high'
      }
    });

    assert.equal(readiness.blocked, false);
    if (readiness.blocked) {
      assert.fail('references no deberia quedar bloqueado con confidence high');
    }
    assert.equal(readiness.decision.action, 'allow');
  });

  test('definition bloquea cache hits con confidence insuficiente', () => {
    const readiness = resolveServingReadiness({
      feature: 'definition',
      consumerLabel: 'definition',
      snapshot: createSnapshot({
        activeContextReady: true,
        projectReady: false,
        workspaceReady: false
      }),
      blockedResult: null,
      context: {
        resolutionConfidence: 'low'
      }
    });

    assert.equal(readiness.blocked, true);
    assert.equal(readiness.blockedResult, null);
    assert.match(readiness.warningMessage ?? '', /^\[definition\] bloqueado: definition bloqueado por confidence insuficiente \(low < medium\)$/);
  });

  test('definition deja pasar cache hits con confidence alta', () => {
    const readiness = resolveServingReadiness({
      feature: 'definition',
      consumerLabel: 'definition',
      snapshot: createSnapshot({
        activeContextReady: true,
        projectReady: true,
        workspaceReady: false
      }),
      blockedResult: null,
      context: {
        resolutionConfidence: 'high'
      }
    });

    assert.equal(readiness.blocked, false);
    if (readiness.blocked) {
      assert.fail('definition no deberia quedar bloqueado con confidence high');
    }
    assert.equal(readiness.decision.action, 'allow');
  });
});