import * as assert from 'assert/strict';
import * as path from 'path';

import { buildSupportBundle, suggestSupportBundleDirectoryName } from '../../../src/client/support/supportBundle';

suite('unit/supportBundle (B258)', () => {
  test('normaliza un nombre de carpeta estable para el support bundle', () => {
    assert.equal(suggestSupportBundleDirectoryName(' Sample Workspace / Support '), 'sample-workspace-support');
    assert.equal(suggestSupportBundleDirectoryName('***'), 'support-bundle');
  });

  test('genera un bundle saneado con inventario, diagnosticos y redaccion de rutas', () => {
    const workspaceRootPath = path.join('C:', 'repo');
    const bundleRootPath = path.join(workspaceRootPath, 'tools', 'support-bundles', 'sample-support');
    const bundle = buildSupportBundle({
      workspaceRootPath,
      bundleRootPath,
      workspaceLabel: 'repo',
      activeUri: 'file:///repo/test/fixtures/basic/sample.sru',
      activeWorkspaceRelativePath: 'test/fixtures/basic/sample.sru',
      workspaceManifest: {
        schemaVersion: '1.0.0',
        generatedAt: 1,
        limits: { maxObjects: 120, maxSymbols: 240, objectsTruncated: false, symbolsTruncated: false },
        projects: [{ projectUri: 'file:///repo/app.pbt', kind: 'target', name: 'app', libraries: ['file:///repo/lib_app.pbl'], fileCount: 4 }],
        libraries: ['file:///repo/lib_app.pbl'],
        objects: [{ name: 'w_main', uri: 'file:///repo/lib_app.pbl/w_main.srw', objectKind: 'window', sourceOrigin: 'workspace-ws_objects' }],
        inheritanceSummary: { totalTypes: 1, roots: 1, items: [] },
        exportedSymbols: [{ name: 'w_main', kind: 'Type', uri: 'file:///repo/lib_app.pbl/w_main.srw', line: 0, character: 0 }],
        diagnosticsSummary: {
          totals: { error: 1, warning: 2, info: 0, hint: 0 },
          byFile: { 'file:///repo/lib_app.pbl/w_main.srw': 3 },
          byCode: { 'PowerScript:SD1': 1, 'PowerScript:SD7': 2 },
          bySeverity: { error: 1, warning: 2 },
          documents: [],
          projects: [],
        },
        sourceOriginSummary: { 'workspace-ws_objects': 1 },
        readiness: { state: 'ready' },
      },
      serverStats: {
        readiness: { state: 'ready', detail: 'ok' },
        workspace: { mode: 'workspace', files: 4 },
        health: { status: 'warning', summary: 'runtime attention', findings: [{ code: 'cache', layer: 'serving', severity: 'warning', message: 'cache high', detail: 'ttl high' }], counts: { info: 0, warning: 1, error: 0 }, checkedLayers: ['serving'] },
        buildTooling: {
          status: 'available',
          source: 'config',
          executablePath: 'C:/Tools/pbautobuild250.exe',
          versionLabel: '25.0 / 2025',
          capabilities: ['json-build'],
          detail: 'PBAutoBuild disponible vía configuración.',
        },
        buildProfile: {
          buildFileUri: 'file:///repo/builds/app.json',
          label: 'app.json',
        },
        buildHealth: {
          state: 'ready',
          status: 'healthy',
          canRun: true,
          summary: 'ok',
          findings: [],
        },
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
        diagnostics: {
          totals: { error: 1, warning: 2, info: 0, hint: 0 },
          byFile: { 'file:///repo/lib_app.pbl/w_main.srw': 3 },
          byCode: { 'PowerScript:SD1': 1, 'PowerScript:SD7': 2 },
          bySeverity: { error: 1, warning: 2 },
          documents: [{ uri: 'file:///repo/lib_app.pbl/w_main.srw', total: 3, byCode: { 'PowerScript:SD7': 2 }, bySeverity: { warning: 2 }, projectLabel: 'app', objectLabel: 'w_main', snapshotIdentity: 'file:///repo/lib_app.pbl/w_main.srw@123' }],
          projects: [{ key: 'file:///repo/app.pbt', label: 'app', total: 3, byCode: { 'PowerScript:SD7': 2 }, bySeverity: { warning: 2 }, objects: [] }],
        },
        memory: {
          status: 'warning',
          totalEstimatedBytes: 2048,
          totalBudgetBytes: 4096,
          layers: [],
          process: { rssBytes: 1024, heapUsedBytes: 512 },
        },
        caches: {
          analysis: { size: 2, capacity: 10 },
          serving: { size: 4, capacity: 8, hits: 10, misses: 2, evictions: 1, ttlMs: 5000 },
        },
        lastQueryTrace: {
          label: 'hover',
          confidence: 'medium',
          primaryReasonCode: 'global-fallback',
          evidenceKinds: ['winner-target'],
          targetCount: 2,
          hasAmbiguity: true,
          steps: [{ name: 'seed' }, { name: 'resolve' }],
        },
        persistence: {
          storageUri: 'file:///repo/.vsc-powersyntax/runtime/storage.json',
          journalUri: 'file:///repo/.vsc-powersyntax/runtime/journal.json',
          checkpointUri: 'file:///repo/.vsc-powersyntax/runtime/checkpoint.json',
          buildOrcaJournalUri: 'file:///repo/.vsc-powersyntax/runtime/build-orca-journal.json',
          workspaceKey: 'repo-workspace-key',
        },
        runtimeJournal: {
          total: 3,
          dropped: 1,
          events: [
            { ts: 1, phase: 'index', kind: 'cache', action: 'restore', detail: { journalUri: 'file:///repo/.vsc-powersyntax/runtime/journal.json' } },
            { ts: 2, phase: 'serve', kind: 'hover', action: 'query', detail: { sourcePath: 'C:/repo/lib_app.pbl/w_main.srw' } },
            { ts: 3, phase: 'build', kind: 'orca', action: 'detect', detail: { executablePath: 'C:/Tools/orca.exe' } },
          ],
        },
      },
      publicContract: {
        apiVersion: '2.9.0',
        apiVersionMajor: 2,
        extensionId: 'lopez.vsc-powersyntax',
        exportedFrom: 'activate',
        methods: [{ name: 'getServerStats', access: 'read-only', stability: 'stable', command: 'powerbuilder.showStats', responseSchema: 'ApiServerStats' }],
        schemas: [{ name: 'ApiServerStats', version: '1.0.0', kind: 'response' }],
        taskExecutionCatalog: {
          schemaVersion: '1.0.0',
          apiVersion: '2.9.0',
          contracts: [],
        },
        capabilities: {
          readOnlyMethods: ['getServerStats'],
          writeEnabledMethods: [],
          readOnlyTools: ['server-stats'],
        },
      },
      readOnlyToolBridge: {
        schemaVersion: '1.0.0',
        apiVersion: '2.9.0',
        tools: [{ name: 'server-stats', description: 'stats', responseSchema: 'ApiServerStats', usesActiveEditorFallback: false }],
      },
      settingsGovernance: {
        selectedProfile: 'balanced',
        availableProfiles: [{ id: 'balanced', label: 'Balanced', description: 'Default', managedSettings: { 'vscPowerSyntax.progress.show': true } }],
        managedSettings: [{ key: 'vscPowerSyntax.progress.show', expectedValue: true, currentValue: true, matchesProfile: true }],
        conflicts: [],
      },
      settingsValues: {
        'vscPowerSyntax.profile': 'balanced',
        'vscPowerSyntax.progress.show': true,
        'vscPowerSyntax.build.pbAutoBuildPath': 'C:/Tools/pbautobuild250.exe',
        'vscPowerSyntax.legacy.orcaPath': 'C:/Tools/orca.exe',
      },
      generatedAt: '2026-05-03T12:30:00.000Z',
    });

    assert.equal(bundle.supportBundleWorkspaceRelativePath, 'tools/support-bundles/sample-support');
    assert.ok(bundle.files.some((file) => file.relativePath === 'manifest.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'settings-sanitized.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'build-orca-snapshot.json'));

    const stats = bundle.files.find((file) => file.relativePath === 'server-stats.sanitized.json')?.content ?? '';
    assert.match(stats, /redacted:pbautobuild250\.exe/);
    assert.doesNotMatch(stats, /C:\/Tools\//);

    const settings = bundle.files.find((file) => file.relativePath === 'settings-sanitized.json')?.content ?? '';
    assert.match(settings, /redacted:orca\.exe/);
    assert.doesNotMatch(settings, /C:\/Tools\//);

    const diagnostics = bundle.files.find((file) => file.relativePath === 'diagnostics-snapshot.sanitized.json')?.content ?? '';
    assert.match(diagnostics, /redacted:w_main\.srw/);

    const manifest = JSON.parse(bundle.files.find((file) => file.relativePath === 'manifest.json')?.content ?? '{}');
    assert.equal(manifest.summary.rawSourceIncluded, false);
    assert.equal(manifest.summary.runtimeJournalEvents, 3);

    const readme = bundle.files.find((file) => file.relativePath === 'README.md')?.content ?? '';
    assert.match(readme, /sin incluir codigo bruto/i);
    assert.match(readme, /runtime-health\.json/);
  });
});