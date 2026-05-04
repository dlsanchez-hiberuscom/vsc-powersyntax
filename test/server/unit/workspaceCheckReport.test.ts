import * as assert from 'assert/strict';

import {
  buildUnavailableWorkspaceCheckReport,
  buildWorkspaceCheckMarkdown,
  buildWorkspaceCheckReport,
} from '../../../src/client/workspaceCheckReport';
import type {
  ApiBuildProfileMatrix,
  ApiPowerBuilderCodeMetrics,
  ApiPowerBuilderTechnicalDebtReport,
  ApiSemanticWorkspaceManifest,
  ApiServerStats,
  ApiWorkspaceCheckCatalogSummary,
} from '../../../src/shared/publicApi';

function createServerStats(): ApiServerStats {
  return {
    readiness: {
      state: 'ready',
    },
    projectModel: {
      projects: 1,
    },
    persistence: {
      restoreState: 'restored',
    },
    diagnostics: {
      totals: { error: 0, warning: 0, info: 0, hint: 0 },
      byFile: {},
      byCode: {},
      bySeverity: {},
      documents: [],
      projects: [],
    },
    health: {
      status: 'healthy',
      summary: 'ok',
      findings: [],
      counts: { info: 0, warning: 0, error: 0 },
      checkedLayers: [],
    },
  };
}

function createManifest(): ApiSemanticWorkspaceManifest {
  return {
    schemaVersion: '1.0.0',
    generatedAt: Date.now(),
    limits: {
      maxObjects: 64,
      maxSymbols: 128,
      objectsTruncated: false,
      symbolsTruncated: false,
    },
    projects: [
      {
        projectUri: 'file:///workspace/app.pbt',
        kind: 'project',
        name: 'app',
        libraries: ['app.pbl'],
        fileCount: 1,
      },
    ],
    libraries: ['app.pbl'],
    objects: [
      {
        name: 'w_main',
        uri: 'file:///workspace/w_main.srw',
        identityKey: 'w_main',
        objectKind: 'window',
      },
    ],
    inheritanceSummary: {
      totalTypes: 1,
      roots: 1,
      items: [],
    },
    exportedSymbols: [],
    diagnosticsSummary: null,
    knowledgePacks: {
      total: 0,
      items: [],
    },
    sourceOriginSummary: {},
    readiness: {
      state: 'ready',
    },
  };
}

function createCatalogSummary(
  overrides: Partial<ApiWorkspaceCheckCatalogSummary> = {},
): ApiWorkspaceCheckCatalogSummary {
  return {
    available: true,
    totalEntries: 100,
    duplicates: 0,
    missingSignatures: 0,
    invalidEnumTypes: 0,
    generatedManualConflicts: 0,
    consistencyStatus: 'passed',
    ...overrides,
  };
}

suite('unit/workspaceCheckReport (B376)', () => {
  test('devuelve passed cuando el workspace no expone problemas relevantes', () => {
    const report = buildWorkspaceCheckReport({
      request: { mode: 'quick' },
      serverStats: createServerStats(),
      manifest: createManifest(),
      catalog: createCatalogSummary(),
    });

    assert.equal(report.available, true);
    assert.equal(report.status, 'passed');
    assert.equal(report.summary.generatedFromCache, true);
    assert.equal(report.summary.catalogIssues, 0);
    assert.match(buildWorkspaceCheckMarkdown(report), /# Workspace Check/);
  });

  test('marca failed cuando hay diagnostics de error o catalog consistency fallida', () => {
    const stats = createServerStats();
    stats.diagnostics = {
      totals: { error: 2, warning: 1, info: 0, hint: 0 },
      byFile: { 'file:///workspace/w_main.srw': 3 },
      byCode: { PB1001: 2, PB2001: 1 },
      bySeverity: { error: 2, warning: 1 },
      documents: [
        {
          uri: 'file:///workspace/w_main.srw',
          total: 3,
          byCode: { PB1001: 2, PB2001: 1 },
          bySeverity: { error: 2, warning: 1 },
        },
      ],
      projects: [],
    };

    const report = buildWorkspaceCheckReport({
      request: { mode: 'quick' },
      serverStats: stats,
      manifest: createManifest(),
      catalog: createCatalogSummary({
        duplicates: 1,
        consistencyStatus: 'failed',
      }),
    });

    assert.equal(report.status, 'failed');
    assert.ok(report.findings.some((finding) => finding.code === 'diagnostics-errors'));
    assert.ok(report.findings.some((finding) => finding.code === 'catalog-consistency-failed'));
  });

  test('modo full agrega build, metrics, debt y marca truncado al recortar findings', () => {
    const stats = createServerStats();
    stats.readiness = { state: 'indexing', detail: 'background-pass' };
    stats.health = {
      status: 'warning',
      summary: 'runtime warning',
      findings: [
        {
          code: 'indexer-degraded',
          layer: 'indexer',
          severity: 'warning',
          message: 'indexador degradado',
        },
      ],
      counts: { info: 0, warning: 1, error: 0 },
      checkedLayers: ['indexer'],
    };
    stats.diagnostics = {
      totals: { error: 0, warning: 4, info: 0, hint: 0 },
      byFile: {
        'file:///workspace/a.srw': 2,
        'file:///workspace/b.srw': 2,
      },
      byCode: { PB2001: 4 },
      bySeverity: { warning: 4 },
      documents: [
        {
          uri: 'file:///workspace/a.srw',
          total: 2,
          byCode: { PB2001: 2 },
          bySeverity: { warning: 2 },
        },
        {
          uri: 'file:///workspace/b.srw',
          total: 2,
          byCode: { PB2001: 2 },
          bySeverity: { warning: 2 },
        },
      ],
      projects: [],
    };

    const buildProfiles: ApiBuildProfileMatrix = {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      available: true,
      summary: {
        totalProfiles: 2,
        usableProfiles: 1,
        ambiguousProfiles: 0,
        invalidProfiles: 1,
        runnableProfiles: 1,
        toolingStatus: 'available',
        healthState: 'attention',
      },
      health: {
        state: 'attention',
        status: 'warning',
        canRun: true,
        summary: 'build attention',
        findings: [],
      },
      findings: [
        {
          code: 'build-profile-invalid',
          severity: 'warning',
          message: 'perfil invalido',
        },
      ],
      profiles: [],
    };

    const codeMetrics: ApiPowerBuilderCodeMetrics = {
      schemaVersion: '1.0.0',
      generatedAt: Date.now(),
      summary: {
        totalProjects: 1,
        totalLibraries: 1,
        totalObjects: 1,
        totalFunctions: 2,
        totalEvents: 1,
        totalEmbeddedSqlStatements: 0,
        totalLinkedDataWindows: 0,
        totalExternalDependencies: 0,
        totalLifecycleWarnings: 2,
        totalDiagnostics: 4,
      },
      diagnostics: {
        total: 4,
        byArea: [],
      },
      footprint: {
        build: { total: 1, usable: 1, invalid: 0, ambiguous: 0 },
        orca: { stagedFiles: 0, libraryAliases: 0 },
      },
      objects: [],
    };

    const technicalDebt: ApiPowerBuilderTechnicalDebtReport = {
      schemaVersion: '1.0.0',
      generatedAt: Date.now(),
      summary: {
        totalHotspots: 1,
        totalRecommendations: 2,
        obsoleteFindings: 0,
        dynamicSqlFindings: 0,
        externalDependencyFindings: 0,
        dataWindowRiskFindings: 0,
        complexObjectFindings: 1,
        sourceOriginRiskFindings: 0,
        legacyWorkspaceRiskFindings: 0,
      },
      hotspots: [],
      recommendations: [],
    };

    const report = buildWorkspaceCheckReport({
      request: { mode: 'full', maxFindings: 3, maxFiles: 1, maxDiagnostics: 1 },
      serverStats: stats,
      manifest: createManifest(),
      catalog: createCatalogSummary(),
      buildProfiles,
      codeMetrics,
      technicalDebt,
    });

    assert.equal(report.status, 'warning');
    assert.equal(report.summary.truncated, true);
    assert.equal(report.findings.length, 3);
    assert.ok(report.buildProfiles);
    assert.ok(report.recommendedActions.length > 0);
  });

  test('expone un reporte unavailable si faltan stats base', () => {
    const report = buildUnavailableWorkspaceCheckReport('missing stats');

    assert.equal(report.available, false);
    assert.equal(report.status, 'failed');
    assert.match(report.reason ?? '', /missing stats/);
  });
});