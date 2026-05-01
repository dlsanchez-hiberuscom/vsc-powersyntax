import * as assert from 'assert/strict';

import { FileIndexState } from '../../../src/server/indexer/workspaceIndexer';
import {
  buildProgressReadinessSnapshot,
  toProgressNotification
} from '../../../src/server/features/progressReadiness';

suite('unit/progressReadiness (B134)', () => {
  test('expone discovering como fuente unica antes de indexar', () => {
    const snapshot = buildProgressReadinessSnapshot({
      discovery: { current: 1, total: 3 },
      indexer: {
        phase: 'idle',
        current: 0,
        total: 0,
        degraded: false,
        byState: {
          [FileIndexState.Pending]: 0,
          [FileIndexState.Indexing]: 0,
          [FileIndexState.Indexed]: 0,
          [FileIndexState.Skipped]: 0,
          [FileIndexState.Failed]: 0
        }
      },
      activeUri: null,
      activeProjectFiles: [],
      workspaceFiles: [],
      isSemanticallyReady: () => false
    });

    assert.equal(snapshot.readiness.state, 'discovering');
    assert.equal(snapshot.progress.discovery.current, 1);
    assert.equal(snapshot.progress.discovery.total, 3);
    assert.equal(toProgressNotification(snapshot).phase, 'discovering');
  });

  test('modela active/project/workspace ready sin mezclarlo con progreso operativo', () => {
    const readyUris = new Set(['file:///proj/active.sru', 'file:///proj/nearby.sru', 'file:///proj/other.sru']);
    const snapshot = buildProgressReadinessSnapshot({
      discovery: { current: 2, total: 2 },
      indexer: {
        phase: 'enriched',
        current: 2,
        total: 3,
        pass: 'enriched',
        degraded: false,
        byState: {
          [FileIndexState.Pending]: 1,
          [FileIndexState.Indexing]: 0,
          [FileIndexState.Indexed]: 2,
          [FileIndexState.Skipped]: 0,
          [FileIndexState.Failed]: 0
        }
      },
      activeUri: 'file:///proj/active.sru',
      activeProjectName: 'app',
      activeProjectFiles: ['file:///proj/active.sru', 'file:///proj/nearby.sru'],
      workspaceFiles: ['file:///proj/active.sru', 'file:///proj/nearby.sru', 'file:///proj/other.sru'],
      isSemanticallyReady: (uri) => readyUris.has(uri)
    });

    assert.equal(snapshot.readiness.state, 'ready');
    assert.equal(snapshot.readiness.levels.activeContextReady, true);
    assert.equal(snapshot.readiness.levels.projectReady, true);
    assert.equal(snapshot.readiness.levels.workspaceReady, true);
    assert.equal(snapshot.projectStatusText, 'app — 2 archivos');
  });

  test('degrada cuando hay archivos fallidos o omitidos', () => {
    const snapshot = buildProgressReadinessSnapshot({
      discovery: { current: 1, total: 1 },
      indexer: {
        phase: 'partial',
        current: 3,
        total: 4,
        pass: 'enriched',
        degraded: true,
        degradedReason: 'failed-files',
        byState: {
          [FileIndexState.Pending]: 0,
          [FileIndexState.Indexing]: 0,
          [FileIndexState.Indexed]: 3,
          [FileIndexState.Skipped]: 0,
          [FileIndexState.Failed]: 1
        }
      },
      activeUri: 'file:///proj/active.sru',
      activeProjectName: 'app',
      activeProjectFiles: ['file:///proj/active.sru', 'file:///proj/other.sru'],
      workspaceFiles: ['file:///proj/active.sru', 'file:///proj/other.sru', 'file:///proj/failed.sru'],
      isSemanticallyReady: (uri) => uri !== 'file:///proj/failed.sru'
    });

    assert.equal(snapshot.readiness.state, 'degraded');
    assert.equal(snapshot.readiness.detail, 'failed-files');
    assert.equal(toProgressNotification(snapshot).phase, 'degraded');
  });
});