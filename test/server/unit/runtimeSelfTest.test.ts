import * as assert from 'assert/strict';

import { buildRuntimeSelfTestMarkdown, buildRuntimeSelfTestReport } from '../../../src/client/runtimeSelfTest';
import type { RuntimeStatusStats } from '../../../src/client/statusBarPresentation';
import type { ApiPublicContractDescriptor, ApiSemanticWorkspaceManifest } from '../../../src/shared/publicApi';

suite('unit/runtimeSelfTest (B297)', () => {
  test('proyecta el self-test rápido con checks visibles para API, LSP, cache, project model, diagnostics, build y ORCA', () => {
    const contract: ApiPublicContractDescriptor = {
      extensionId: 'lopez.vsc-powersyntax',
      apiVersion: '2.12.0',
      apiVersionMajor: 2,
      exportedFrom: 'activate',
      methods: [
        { name: 'getPublicContract', access: 'read-only', stability: 'stable', responseSchema: 'ApiPublicContractDescriptor' },
        { name: 'getServerStats', access: 'read-only', stability: 'stable', responseSchema: 'ApiServerStats' },
      ],
      schemas: [],
      observability: {
        schemaVersion: '1.0.0',
        apiVersion: '2.12.0',
        privacy: {
          externalTelemetry: false,
          localOnly: true,
          offlineExportRequiresExplicitUserAction: true,
        },
        surfaces: [],
      },
      taskExecutionCatalog: {
        schemaVersion: '1.0.0',
        apiVersion: '2.12.0',
        contracts: [],
      },
      capabilities: {
        readOnlyMethods: ['getPublicContract', 'getServerStats'],
        writeEnabledMethods: [],
        readOnlyTools: ['contract', 'server-stats'],
      },
    };

    const stats: RuntimeStatusStats = {
      readiness: { state: 'ready', detail: 'workspace listo' },
      health: {
        status: 'healthy',
        summary: 'runtime nominal',
        counts: { warning: 0, error: 0, info: 1 },
        findings: [],
        checkedLayers: ['api', 'indexer', 'build'],
      },
      indexer: { phase: 'ready', current: 120, total: 120, degraded: false },
      workspace: {
        mode: 'solution',
        files: 120,
        activeProject: { name: 'OrderEntry', kind: 'target' },
      },
      projectModel: { projects: 2, libraries: 6, orphanFiles: 0 },
      caches: {
        analysis: { size: 120, capacity: 512 },
        serving: { size: 48, capacity: 256, hits: 40, misses: 5, evictions: 0 },
      },
      persistence: {
        workspaceKey: 'solution:orderentry',
        restoreState: 'restored',
        maintenance: {
          policy: {
            version: 2,
            staleWorkspaceTtlMs: 1,
            maxJournalEntries: 1,
            maxJournalBytes: 1,
            maxWorkspaceBytes: 1,
          },
          currentWorkspace: {
            workspaceKey: 'solution:orderentry',
            totalBytes: 1,
            checkpointBytes: 1,
            journalBytes: 1,
            servingSnapshotBytes: 1,
            partitionBytes: 1,
            partitionCount: 1,
            journalEntries: 1,
            lastModifiedAt: 1,
          },
          staleWorkspaces: [],
          maintenanceRecommended: false,
          needsCompaction: false,
        },
      },
      diagnostics: {
        totals: { error: 1, warning: 2, info: 0, hint: 0 },
        byCode: { SD7: 2 },
        bySeverity: { error: 1, warning: 2, info: 0, hint: 0 },
        byFile: {},
        documents: [],
        projects: [],
      },
      buildTooling: {
        status: 'available',
        source: 'config',
        capabilities: ['compile'],
        detail: 'pbautobuild disponible',
      },
      buildFiles: { total: 2, usable: 1, invalid: 0, ambiguous: 1 },
      buildHealth: {
        state: 'ready',
        status: 'healthy',
        canRun: true,
        summary: 'build moderno listo',
        findings: [],
      },
      orcaTooling: {
        status: 'available',
        source: 'config',
        capabilities: ['export'],
        detail: 'ORCA listo',
        packagingPolicy: {
          exposure: 'not-exposed',
          requiresFeatureFlag: true,
          supportedArtifacts: ['exe', 'pbd'],
          detail: 'Empaquetado ORCA protegido por feature flag.',
        },
      },
      orcaRunner: { state: 'idle' },
    };

    const manifest: ApiSemanticWorkspaceManifest = {
      schemaVersion: '1.0.0',
      generatedAt: 1,
      limits: {
        maxObjects: 200,
        maxSymbols: 400,
        objectsTruncated: false,
        symbolsTruncated: false,
      },
      projects: [{ name: 'OrderEntry', kind: 'target', projectUri: 'file:///repo/app.pbt', libraries: ['app.pbl'], fileCount: 120 }],
      libraries: ['app.pbl'],
      objects: [{ name: 'w_main', uri: 'file:///repo/app.pbl/w_main.srw', objectKind: 'window', projectUri: 'file:///repo/app.pbt' }],
      inheritanceSummary: {
        totalTypes: 12,
        roots: 2,
        items: [],
      },
      exportedSymbols: [],
      diagnosticsSummary: {
        totals: { error: 1, warning: 2, info: 0, hint: 0 },
        byCode: { SD7: 2 },
        bySeverity: { error: 1, warning: 2, info: 0, hint: 0 },
        byFile: {},
        documents: [],
        projects: [],
      },
      sourceOriginSummary: { 'solution-source': 120 },
      readiness: { state: 'ready', detail: 'semántica lista' },
    };

    const report = buildRuntimeSelfTestReport({ contract, stats, manifest, generatedAt: '2026-05-03T20:00:00.000Z' });
    const reportWithFunctional = buildRuntimeSelfTestReport({
      contract,
      stats,
      manifest,
      functionalChecks: [
        { key: 'view-providers', label: 'View providers', status: 'pass', detail: '3/3 registrados' },
        { key: 'hover-builtin', label: 'Hover built-in IsNull', status: 'pass', detail: '3 variantes resueltas' },
        { key: 'serving-cache', label: 'Serving cache probe', status: 'pass', detail: 'viewmodel-hit +1' },
        { key: 'negative-cache', label: 'Hover negative cache', status: 'pass', detail: 'negative-hit +1' },
        { key: 'definition-negative', label: 'Definition negative cache', status: 'pass', detail: 'negative-hit +1' },
      ],
      generatedAt: '2026-05-03T20:00:00.000Z',
    });

    assert.equal(report.overallStatus, 'fail');
    assert.equal(report.functionalChecks.length, 1);
    assert.equal(report.functionalChecks[0]?.key, 'functional-coverage');

    assert.equal(reportWithFunctional.overallStatus, 'pass');
    assert.equal(reportWithFunctional.coreChecks.length, 7);
    assert.equal(reportWithFunctional.functionalChecks.length, 5);
    assert.deepEqual(reportWithFunctional.coreChecks.map((check) => check.key), ['api', 'lsp', 'cache', 'project-model', 'diagnostics', 'build', 'orca']);
    assert.deepEqual(reportWithFunctional.functionalChecks.map((check) => check.key), ['view-providers', 'hover-builtin', 'serving-cache', 'negative-cache', 'definition-negative']);
    assert.ok(reportWithFunctional.checks.every((check) => check.status === 'pass'));

    const markdown = buildRuntimeSelfTestMarkdown(reportWithFunctional);
    assert.match(markdown, /PowerSyntax Runtime Self-Test/);
    assert.match(markdown, /## Core runtime checks/);
    assert.match(markdown, /## Functional interactive probes/);
    assert.match(markdown, /View providers/);
    assert.match(markdown, /Definition negative cache/);
    assert.doesNotMatch(markdown, /## Acciones sugeridas/);
  });

  test('degrada honestamente cuando faltan contrato, stats o snapshots auxiliares', () => {
    const report = buildRuntimeSelfTestReport({
      stats: {
        workspace: { mode: 'source-plain-text', files: 4 },
      },
      generatedAt: '2026-05-03T20:10:00.000Z',
    });

    assert.equal(report.overallStatus, 'fail');
    assert.equal(report.checks.find((check) => check.key === 'api')?.status, 'fail');
    assert.equal(report.checks.find((check) => check.key === 'lsp')?.status, 'pass');
    assert.equal(report.checks.find((check) => check.key === 'cache')?.status, 'warning');
    assert.equal(report.checks.find((check) => check.key === 'diagnostics')?.status, 'warning');
    assert.equal(report.checks.find((check) => check.key === 'build')?.status, 'warning');
    assert.equal(report.checks.find((check) => check.key === 'orca')?.status, 'warning');
    assert.equal(report.functionalChecks.find((check) => check.key === 'functional-coverage')?.status, 'fail');

    const markdown = buildRuntimeSelfTestMarkdown(report);
    assert.match(markdown, /## Acciones sugeridas/);
    assert.match(markdown, /API pública/);
    assert.match(markdown, /Cache\/runtime journal/);
  });
});