import * as assert from 'assert/strict';

import {
  buildStatusHealthReport,
  buildStatusStatsReport,
  buildStatusTooltipMarkdown,
  enrichRuntimeStatusStats,
  formatOrcaRunInline,
  formatPbAutoBuildHealthInline,
  formatPbAutoBuildRunInline,
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

  const stats = enrichRuntimeStatusStats({
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
    buildTooling: {
      status: 'available',
      source: 'config',
      executablePath: 'C:/Program Files/Appeon/PowerBuilder 2025/pbautobuild250.exe',
      versionLabel: '25.0 / 2025',
      capabilities: ['json-build', 'pbc-compile'],
      detail: 'PBAutoBuild disponible vía configuración.'
    },
    buildRunner: {
      state: 'running',
      buildFileUri: 'file:///c:/workspace/demo.json',
      executablePath: 'C:/Program Files/Appeon/PowerBuilder 2025/pbautobuild250.exe',
      startedAt: 100,
      detail: 'Ejecutando demo.json.'
    },
    buildFiles: {
      total: 2,
      usable: 1,
      invalid: 1,
      ambiguous: 0
    },
    buildProfile: {
      buildFileUri: 'file:///c:/workspace/demo.json',
      label: 'demo.json',
      detail: 'demo.pbt'
    },
    buildProblems: {
      total: 2,
      published: 1,
      unresolved: 1
    },
    orcaTooling: {
      status: 'available',
      source: 'config',
      executablePath: 'C:/Tools/orca.exe',
      capabilities: ['legacy-script-runner'],
      detail: 'ORCA disponible vía configuración.'
    },
    orcaRunner: {
      state: 'succeeded',
      scriptUri: 'file:///c:/workspace/demo.orca',
      executablePath: 'C:/Tools/orca.exe',
      durationMs: 220,
      detail: 'ORCA finalizó correctamente.'
    },
    memory: {
      status: 'warning',
      totalEstimatedBytes: 80 * 1024 * 1024,
      totalBudgetBytes: 128 * 1024 * 1024,
      process: {
        heapUsedBytes: 70 * 1024 * 1024,
        heapTotalBytes: 96 * 1024 * 1024,
        rssBytes: 120 * 1024 * 1024,
        externalBytes: 2 * 1024 * 1024
      },
      layers: [
        {
          layer: 'knowledge',
          label: 'knowledge index',
          estimatedBytes: 50 * 1024 * 1024,
          budgetBytes: 64 * 1024 * 1024,
          usageRatio: 0.78,
          status: 'healthy',
          unitCount: 1200,
          unitLabel: 'entities'
        },
        {
          layer: 'documents',
          label: 'document cache',
          estimatedBytes: 30 * 1024 * 1024,
          budgetBytes: 32 * 1024 * 1024,
          usageRatio: 0.94,
          status: 'warning',
          unitCount: 20,
          unitLabel: 'documents'
        }
      ]
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
  }) as RuntimeStatusStats;

  test('prefiere el summary del servidor para el texto visible', () => {
    assert.equal(formatStatusBarSummary(indexingProgress, stats), 'demo — semántico 3/10');
  });

  test('resume el estado visible del runner de build', () => {
    assert.equal(formatPbAutoBuildRunInline(stats.buildRunner), 'ejecutando · demo.json');
  });

  test('resume la salud unificada del build moderno', () => {
    assert.equal(formatPbAutoBuildHealthInline(stats), 'ejecutando · build moderno en ejecución');
  });

  test('resume el estado visible del runner ORCA', () => {
    assert.equal(formatOrcaRunInline(stats.orcaRunner), 'último ORCA ok · demo.orca · 220ms');
  });

  test('tooltip incluye contexto, caches, persistencia y acciones rápidas', () => {
    const tooltip = buildStatusTooltipMarkdown(indexingProgress, stats);

    assert.match(tooltip, /Proyecto activo: demo · solution · 3 archivos · 2 librerías/);
    assert.match(tooltip, /Workspace: solution · 120 archivos/);
    assert.match(tooltip, /Cachés: analysis 12\/64 · serving 8\/32 · hit 75% \(9\/3\) · evict 1 · documents 20 · hot 4\/16/);
    assert.match(tooltip, /Persistencia: warm resume configurado · checkpoint listo · journal listo · restored 18 docs · serving 8 entries/);
    assert.match(tooltip, /Build profile: demo\.json · demo\.pbt/);
    assert.match(tooltip, /Build health: ejecutando · build moderno en ejecución/);
    assert.match(tooltip, /Build: PBAutoBuild 25\.0 \/ 2025 disponible · configuración/);
    assert.match(tooltip, /Build run: ejecutando · demo\.json/);
    assert.match(tooltip, /ORCA: ORCA disponible · configuración/);
    assert.match(tooltip, /ORCA run: último ORCA ok · demo\.orca · 220ms/);
    assert.match(tooltip, /Memoria: warning · 80\.0 MiB \/ 128\.0 MiB · document cache 94% · heap 70\.0 MiB/);
    assert.match(tooltip, /command:vscPowerSyntax.openProjectHealthDashboard/);
    assert.match(tooltip, /command:vscPowerSyntax.showStatusStats/);
    assert.match(tooltip, /command:vscPowerSyntax.showStatusHealth/);
    assert.match(tooltip, /command:vscPowerSyntax.runPbAutoBuild/);
    assert.match(tooltip, /command:vscPowerSyntax.runLastPbAutoBuild/);
    assert.match(tooltip, /command:vscPowerSyntax.runPbAutoBuildWithPicker/);
    assert.match(tooltip, /command:vscPowerSyntax.cancelPbAutoBuild/);
    assert.match(tooltip, /command:vscPowerSyntax.runActiveOrcaScript/);
    assert.match(tooltip, /command:vscPowerSyntax.cancelOrcaScript/);
  });

  test('stats report resume readiness, scheduler y caches', () => {
    const report = buildStatusStatsReport(stats);

    assert.match(report, /Readiness: indexing · enriched/);
    assert.match(report, /Scheduler: near 1 · background 4 · interactiveBusy false/);
    assert.match(report, /Cachés: analysis 12\/64 · serving 8\/32 · hit 75% \(9\/3\) · evict 1 · documents 20 · hot 4\/16/);
    assert.match(report, /Persistencia: workspace-key · checkpoint · journal · restored 18 docs · serving 8 entries/);
    assert.match(report, /Build profile: demo\.json · demo\.pbt/);
    assert.match(report, /Build health: ejecutando · build moderno en ejecución/);
    assert.match(report, /Build: PBAutoBuild 25\.0 \/ 2025 disponible · configuración/);
    assert.match(report, /Build run: ejecutando · demo\.json/);
    assert.match(report, /ORCA: ORCA disponible · configuración/);
    assert.match(report, /ORCA run: último ORCA ok · demo\.orca · 220ms/);
    assert.match(report, /Memoria: warning · 80\.0 MiB \/ 128\.0 MiB · document cache 94% · heap 70\.0 MiB/);
    assert.match(report, /Salud: warning · 1 warning · 0 error · 2 info/);
    assert.match(report, /Journal: 1\/3 eventos · query\/definition/);
  });

  test('health report marca colas y huérfanos como señales visibles', () => {
    const report = buildStatusHealthReport(indexingProgress, stats);

    assert.match(report, /Resumen: cola near 1 · cola background 4 · 1 huérfanos/);
    assert.match(report, /Checks: 1 warning · 0 error · 2 info/);
    assert.match(report, /Build profile: demo\.json · demo\.pbt/);
    assert.match(report, /Build health: ejecutando · build moderno en ejecución/);
    assert.match(report, /Build: PBAutoBuild 25\.0 \/ 2025 disponible · configuración/);
    assert.match(report, /Build run: ejecutando · demo\.json/);
    assert.match(report, /ORCA: ORCA disponible · configuración/);
    assert.match(report, /ORCA run: último ORCA ok · demo\.orca · 220ms/);
    assert.match(report, /Memoria: warning · 80\.0 MiB \/ 128\.0 MiB · document cache 94% · heap 70\.0 MiB/);
    assert.match(report, /INFO \[build:runner\] build moderno en ejecución/);
    assert.match(report, /WARNING \[build:problems\] 1\/2 problemas de build publicados/);
    assert.match(report, /INFO \[scheduler\] cola near 1/);
    assert.match(report, /WARNING \[project-model\] 1 huérfanos/);
    assert.match(report, /Journal: 1\/3 eventos · query\/definition/);
    assert.match(report, /Persistencia: restored 18 docs · serving 8 entries/);
    assert.match(report, /Último query: definition · high · exact-owner/);
  });
});