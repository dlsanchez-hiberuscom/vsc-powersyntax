import * as assert from 'assert/strict';

import {
  buildStatusHealthReport,
  buildStatusStatsReport,
  buildStatusTooltipMarkdown,
  formatStatusBarSummary,
  type RuntimeStatusStats,
} from '../../../src/client/statusBarPresentation';
import type { ProgressNotification } from '../../../src/shared/types';

suite('unit/statusBarPresentation (B107)', () => {
  const indexingProgress: ProgressNotification = {
    phase: 'indexing',
    current: 3,
    total: 10,
    pass: 'enriched',
    message: 'demo — semántico 3/10'
  };

  const stats: RuntimeStatusStats = {
    readiness: { state: 'indexing', detail: 'enriched' },
    workspace: {
      mode: 'solution',
      files: 120,
      activeProject: {
        name: 'demo',
        kind: 'solution',
        files: ['a.sru', 'b.srw', 'c.srm'],
        libraries: ['app.pbl', 'core.pbl']
      }
    },
    projectStatus: {
      summary: 'demo — semántico 3/10',
      snapshot: {
        readiness: 'indexing',
        projectName: 'demo',
        totalFiles: 10,
        indexedFiles: 3,
        pass: 'enriched'
      }
    },
    projectModel: {
      projects: 2,
      libraries: 6,
      orphanFiles: 1
    },
    scheduler: {
      pendingNear: 1,
      pendingBackground: 4,
      interactiveBusy: false
    },
    caches: {
      analysis: { size: 12, capacity: 64 },
      serving: { size: 8, capacity: 32, hits: 9, misses: 3, evictions: 1, ttlMs: 0 },
      documents: { size: 20 },
      hotContext: { inheritedTypes: 4, capacity: 16 }
    },
    persistence: {
      workspaceKey: 'workspace-key',
      checkpointUri: 'file:///cache/semantic-checkpoint.json',
      journalUri: 'file:///cache/semantic-journal.json',
      restoreState: 'restored',
      restoredDocuments: 18,
      servingSnapshot: {
        lastRestoredEntries: 8,
        lastPersistedEntries: 8
      }
    },
    lastQueryTrace: {
      label: 'definition',
      confidence: 'high',
      targetCount: 1,
      primaryReasonCode: 'exact-owner'
    },
    health: {
      status: 'warning',
      summary: 'cola near 1 · cola background 4 · 1 huérfanos',
      findings: [
        { code: 'scheduler-near-backlog', layer: 'scheduler', severity: 'info', message: 'cola near 1' },
        { code: 'scheduler-background-backlog', layer: 'scheduler', severity: 'info', message: 'cola background 4' },
        { code: 'project-model-orphans', layer: 'project-model', severity: 'warning', message: '1 huérfanos' }
      ],
      counts: { info: 2, warning: 1, error: 0 },
      checkedLayers: ['scheduler', 'project-model']
    },
    runtimeJournal: {
      total: 3,
      dropped: 0,
      events: [
        { ts: 1, phase: 'query', kind: 'query-trace', action: 'definition', severity: 'info', durationMs: 4 }
      ]
    }
  };

  test('prefiere el summary del servidor para el texto visible', () => {
    assert.equal(formatStatusBarSummary(indexingProgress, stats), 'demo — semántico 3/10');
  });

  test('tooltip incluye contexto, caches, persistencia y acciones rápidas', () => {
    const tooltip = buildStatusTooltipMarkdown(indexingProgress, stats);

    assert.match(tooltip, /Proyecto activo: demo · solution · 3 archivos · 2 librerías/);
    assert.match(tooltip, /Workspace: solution · 120 archivos/);
  assert.match(tooltip, /Cachés: analysis 12\/64 · serving 8\/32 · hit 75% \(9\/3\) · evict 1 · documents 20 · hot 4\/16/);
    assert.match(tooltip, /Persistencia: warm resume configurado · checkpoint listo · journal listo · restored 18 docs · serving 8 entries/);
    assert.match(tooltip, /command:vscPowerSyntax.showStatusStats/);
    assert.match(tooltip, /command:vscPowerSyntax.showStatusHealth/);
    assert.match(tooltip, /command:workbench.action.tasks.build/);
  });

  test('stats report resume readiness, scheduler y caches', () => {
    const report = buildStatusStatsReport(stats);

    assert.match(report, /Readiness: indexing · enriched/);
    assert.match(report, /Scheduler: near 1 · background 4 · interactiveBusy false/);
    assert.match(report, /Cachés: analysis 12\/64 · serving 8\/32 · hit 75% \(9\/3\) · evict 1 · documents 20 · hot 4\/16/);
    assert.match(report, /Persistencia: workspace-key · checkpoint · journal · restored 18 docs · serving 8 entries/);
    assert.match(report, /Salud: warning · 1 warning · 0 error · 2 info/);
    assert.match(report, /Journal: 1\/3 eventos · query\/definition/);
  });

  test('health report marca colas y huérfanos como señales visibles', () => {
    const report = buildStatusHealthReport(indexingProgress, stats);

    assert.match(report, /Resumen: cola near 1 · cola background 4 · 1 huérfanos/);
    assert.match(report, /Checks: 1 warning · 0 error · 2 info/);
    assert.match(report, /INFO \[scheduler\] cola near 1/);
    assert.match(report, /WARNING \[project-model\] 1 huérfanos/);
    assert.match(report, /Journal: 1\/3 eventos · query\/definition/);
    assert.match(report, /Persistencia: restored 18 docs · serving 8 entries/);
    assert.match(report, /Último query: definition · high · exact-owner/);
  });
});