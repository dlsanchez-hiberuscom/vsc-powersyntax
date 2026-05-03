import * as assert from 'assert/strict';

import type { ApiSemanticWorkspaceManifest } from '../../../src/shared/publicApi';
import type { ProgressNotification } from '../../../src/shared/types';
import { buildProjectHealthDashboardMarkdown } from '../../../src/client/projectHealthDashboard';
import { enrichRuntimeStatusStats, type RuntimeStatusStats } from '../../../src/client/statusBarPresentation';

suite('unit/projectHealthDashboard (B216)', () => {
  const progress: ProgressNotification = {
    phase: 'indexing',
    current: 7,
    total: 10,
    pass: 'enriched',
    message: 'demo — semántico 7/10',
  };

  const stats = enrichRuntimeStatusStats({
    readiness: { state: 'indexing', detail: 'enriched' },
    workspace: {
      mode: 'solution',
      files: 120,
      activeProject: {
        name: 'demo',
        kind: 'solution',
        files: ['w_main.srw', 'n_cst.sru'],
        libraries: ['app.pbl', 'core.pbl'],
      },
    },
    projectStatus: {
      summary: 'demo — semántico 7/10',
      snapshot: {
        readiness: 'indexing',
        projectName: 'demo',
        totalFiles: 10,
        indexedFiles: 7,
        pass: 'enriched',
      },
    },
    indexer: { phase: 'enriched', current: 7, total: 10 },
    projectModel: { projects: 2, libraries: 6, orphanFiles: 1 },
    caches: {
      analysis: { size: 12, capacity: 64 },
      serving: { size: 8, capacity: 32, hits: 9, misses: 3, evictions: 1 },
      documents: { size: 20 },
      hotContext: { inheritedTypes: 4, capacity: 16 },
    },
    persistence: {
      workspaceKey: 'workspace-key',
      checkpointUri: 'file:///cache/semantic-checkpoint.json',
      journalUri: 'file:///cache/semantic-journal.json',
      restoreState: 'restored',
    },
    buildTooling: {
      status: 'available',
      source: 'config',
      executablePath: 'C:/pbautobuild250.exe',
      capabilities: ['json-build'],
      detail: 'PBAutoBuild disponible vía configuración.',
    },
    buildFiles: { total: 2, usable: 1, invalid: 1, ambiguous: 0 },
    buildRunner: {
      state: 'running',
      buildFileUri: 'file:///c:/workspace/demo.json',
      executablePath: 'C:/pbautobuild250.exe',
      detail: 'Ejecutando demo.json.',
      startedAt: 10,
    },
    orcaTooling: {
      status: 'available',
      source: 'config',
      executablePath: 'C:/orca.exe',
      capabilities: ['legacy-script-runner'],
      detail: 'ORCA disponible vía configuración.',
      packagingPolicy: {
        exposure: 'not-exposed',
        requiresFeatureFlag: true,
        supportedArtifacts: ['exe', 'pbd', 'dll'],
        detail: 'Packaging ORCA de EXE/PBD/DLL no está expuesto; requiere un feature flag dedicado y queda fuera del carril PBAutoBuild.',
      },
    },
    orcaRunner: {
      state: 'idle',
    },
    health: {
      status: 'warning',
      summary: 'cola background 4 · 1 huérfanos',
      findings: [
        { code: 'project-model-orphans', layer: 'project-model', severity: 'warning', message: '1 huérfanos' },
      ],
      counts: { info: 0, warning: 1, error: 0 },
      checkedLayers: ['project-model'],
    },
    diagnostics: {
      totals: { error: 1, warning: 2, info: 0, hint: 1 },
      byFile: { 'file:///demo/w_main.srw': 4 },
      byCode: { 'PowerScript:SD7': 2, 'PowerScript:SD3': 1 },
      bySeverity: { error: 1, warning: 2, hint: 1 },
      documents: [],
      projects: [],
    },
  }) as RuntimeStatusStats;

  const manifest: ApiSemanticWorkspaceManifest = {
    schemaVersion: '1.0.0',
    generatedAt: Date.parse('2026-05-01T10:00:00.000Z'),
    limits: {
      maxObjects: 200,
      maxSymbols: 400,
      objectsTruncated: false,
      symbolsTruncated: false,
    },
    projects: [
      { projectUri: 'file:///demo/demo.pbt', kind: 'target', name: 'demo', libraries: ['app.pbl', 'core.pbl'], fileCount: 120 },
      { projectUri: 'file:///demo/tools.pbproj', kind: 'project', name: 'tools', libraries: ['tools.pbl'], fileCount: 12 },
    ],
    libraries: ['app.pbl', 'core.pbl', 'tools.pbl'],
    objects: [
      { name: 'w_main', uri: 'file:///demo/w_main.srw', baseType: 'window', sourceOrigin: 'solution-source' },
      { name: 'n_cst', uri: 'file:///demo/n_cst.sru', baseType: 'nonvisualobject', sourceOrigin: 'solution-source' },
    ],
    inheritanceSummary: {
      totalTypes: 8,
      roots: 2,
      items: [{ name: 'w_main', baseType: 'window', descendantCount: 0 }],
    },
    exportedSymbols: [],
    diagnosticsSummary: stats.diagnostics,
    sourceOriginSummary: { 'solution-source': 2 },
    readiness: { state: 'indexing', detail: 'enriched' },
  };

  test('compone una vista read-only con runtime, manifest y build health', () => {
    const dashboard = buildProjectHealthDashboardMarkdown(progress, stats, manifest, '2026-05-01T10:05:00.000Z');

    assert.match(dashboard, /^# PowerSyntax Project Health Dashboard/m);
    assert.match(dashboard, /Estado visible: demo — semántico 7\/10/);
    assert.match(dashboard, /Salud runtime: warning · cola background 4 · 1 huérfanos/);
    assert.match(dashboard, /Workspace semántico: 2 proyectos · 3 librerías · 2 objetos exportados · 8 tipos/);
    assert.match(dashboard, /ORCA legacy: ORCA disponible · configuración/);
    assert.match(dashboard, /## Diagnósticos/);
    assert.match(dashboard, /PowerScript:SD7: 2/);
    assert.match(dashboard, /## Build/);
    assert.match(dashboard, /Build files: 2 total · 1 utilizables · 1 inválidos · 0 ambiguos/);
    assert.match(dashboard, /ORCA capability: available · ORCA disponible vía configuración\./);
    assert.match(dashboard, /ORCA packaging: off · Packaging ORCA de EXE\/PBD\/DLL no está expuesto/);
    assert.match(dashboard, /## Findings runtime/);
    assert.match(dashboard, /WARNING \[project-model\] 1 huérfanos/);
    assert.match(dashboard, /## Reporte de salud del runtime/);
    assert.match(dashboard, /\[PowerSyntax\] Salud del runtime/);
  });

  test('degrada con honestidad cuando no hay datos disponibles', () => {
    const dashboard = buildProjectHealthDashboardMarkdown({ phase: 'idle' }, undefined, undefined, '2026-05-01T10:05:00.000Z');

    assert.match(dashboard, /Estado visible: en espera/);
    assert.match(dashboard, /Diagnósticos/);
    assert.match(dashboard, /Sin snapshot diagnóstico disponible/);
    assert.match(dashboard, /Tooling: sin datos/);
  });
});