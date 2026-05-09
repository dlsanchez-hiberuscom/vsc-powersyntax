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
    adrCompliance: {
      status: 'passed',
      issueCount: 0,
      recommendedPolicy: 'generated-primary-with-manual-overlays',
      completenessMode: 'complete',
      officialDomainCount: 11,
      manualPrimaryDomains: ['datawindow-events', 'operators', 'pronouns', 'system-globals'],
      officialDomainsWithGaps: [],
      officialCoverageDriftDomains: [],
      overlayCounts: {
        gap: 1,
        enrichment: 1,
        override: 0,
        candidate: 0,
      },
      candidateCount: 0,
      candidateHotPathViolations: 0,
      scraperErrorCount: 0,
      localizationIncompleteOverlays: 0,
      localizationInvalidParameterTargets: 0,
      localizationRecoveredTargetIds: 0,
      officialEntries: 60,
      curatedEntries: 40,
      generatedEntries: 60,
      manualEntries: 40,
    },
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
    assert.equal(report.projection?.state, 'ready');
    assert.equal(report.projection?.projectionId, 'workspace-check');
    assert.equal(report.projection?.generatedFromCache, true);
    assert.equal(report.projection?.caps?.maxFindings, 24);
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

  test('publica el dashboard ADR-0001 y falla cuando el gate del catalogo detecta drift', () => {
    const report = buildWorkspaceCheckReport({
      request: { mode: 'catalog' },
      serverStats: createServerStats(),
      manifest: createManifest(),
      catalog: createCatalogSummary({
        adrCompliance: {
          status: 'failed',
          issueCount: 3,
          recommendedPolicy: 'generated-primary-with-manual-overlays',
          completenessMode: 'complete',
          officialDomainCount: 11,
          manualPrimaryDomains: ['operators'],
          officialDomainsWithGaps: ['global-functions'],
          officialCoverageDriftDomains: ['global-functions'],
          overlayCounts: { gap: 1, enrichment: 2, override: 1, candidate: 0 },
          candidateCount: 0,
          candidateHotPathViolations: 0,
          scraperErrorCount: 1,
          localizationIncompleteOverlays: 0,
          localizationInvalidParameterTargets: 0,
          localizationRecoveredTargetIds: 1,
          officialEntries: 60,
          curatedEntries: 40,
          generatedEntries: 60,
          manualEntries: 40,
        },
      }),
    });

    assert.equal(report.status, 'failed');
    assert.equal(report.summary.catalogIssues, 3);
    assert.ok(report.findings.some((finding) => finding.code === 'catalog-adr-compliance-failed'));

    const markdown = buildWorkspaceCheckMarkdown(report);
    assert.match(markdown, /ADR-0001 compliance: failed/);
    assert.match(markdown, /Coverage drift domains: global-functions/);
    assert.match(markdown, /Manual-primary domains: operators/);
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
        modernIntegrationFindings: 0,
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
    assert.equal(report.projection?.truncated, true);
    assert.match(report.projection?.truncatedReason ?? '', /(findings capped by maxFindings|diagnostic documents capped by maxFiles|manifest limits reached)/);
    assert.equal(report.findings.length, 3);
    assert.ok(report.buildProfiles);
    assert.ok(report.recommendedActions.length > 0);
  });

  test('expone un reporte unavailable si faltan stats base', () => {
    const report = buildUnavailableWorkspaceCheckReport('missing stats');

    assert.equal(report.available, false);
    assert.equal(report.status, 'failed');
    assert.match(report.reason ?? '', /missing stats/);
    assert.equal(report.projection?.state, 'error');
    assert.equal(report.projection?.projectionOwner, 'workspace-check-report');
  });

  test('resume dependencias externas en health reutilizando la evidencia del debt report', () => {
    const technicalDebt: ApiPowerBuilderTechnicalDebtReport = {
      schemaVersion: '1.0.0',
      generatedAt: Date.now(),
      summary: {
        totalHotspots: 1,
        totalRecommendations: 1,
        obsoleteFindings: 0,
        dynamicSqlFindings: 0,
        externalDependencyFindings: 3,
        modernIntegrationFindings: 0,
        dataWindowRiskFindings: 0,
        complexObjectFindings: 0,
        sourceOriginRiskFindings: 0,
        legacyWorkspaceRiskFindings: 0,
      },
      hotspots: [
        {
          name: 'w_native',
          uri: 'file:///workspace/w_native.srw',
          projectUri: 'file:///workspace/app.pbt',
          priority: 'medium',
          confidence: 'high',
          categories: ['external-dependency'],
          evidence: [
            'external-consumers=3',
            'external-kind:dll=1',
            'external-kind:pbx=1',
            'external-kind:unknown=1',
            'external-alias:PBXEntry',
            'external-risk:native-runtime',
            'external-build-impact:manual-native-deployment',
            'external-risk:pbni-runtime-surface',
            'external-orca-impact:manual-pbx-packaging',
          ],
          recommendations: ['Inventariar dependencias nativas.'],
          metrics: {
            approximateComplexity: 1,
            diagnostics: 0,
            externalDependencies: 3,
            linkedDataWindows: 0,
            dynamicSqlStatements: 0,
            obsoleteDiagnostics: 0,
          },
        },
      ],
      recommendations: [
        {
          id: 'rec-native-deps',
          title: 'Dependencias nativas',
          category: 'build',
          priority: 'medium',
          confidence: 'high',
          detail: 'Documentar despliegue nativo.',
          evidence: ['external-kind:pbx=1'],
          actions: ['Inventariar PBX'],
        },
      ],
    };

    const report = buildWorkspaceCheckReport({
      request: { mode: 'quick', includeTechnicalDebt: true },
      serverStats: createServerStats(),
      manifest: createManifest(),
      catalog: createCatalogSummary(),
      technicalDebt,
    });

    const finding = report.findings.find((entry) => entry.code === 'technical-debt-recommendations');
    assert.ok(finding);
    assert.match(finding?.detail ?? '', /externalKinds=dll:1\|pbx:1\|unknown:1/);
    assert.match(finding?.detail ?? '', /externalConsumers=3/);
    assert.match(finding?.detail ?? '', /externalAliases=1/);
    assert.match(finding?.detail ?? '', /manual-pbx-packaging/);
    assert.match(finding?.detail ?? '', /pbni-runtime-surface/);
  });

  test('resume integración moderna en health reutilizando la evidencia del debt report', () => {
    const technicalDebt: ApiPowerBuilderTechnicalDebtReport = {
      schemaVersion: '1.0.0',
      generatedAt: Date.now(),
      summary: {
        totalHotspots: 1,
        totalRecommendations: 1,
        obsoleteFindings: 0,
        dynamicSqlFindings: 0,
        externalDependencyFindings: 0,
        modernIntegrationFindings: 4,
        dataWindowRiskFindings: 0,
        complexObjectFindings: 0,
        sourceOriginRiskFindings: 0,
        legacyWorkspaceRiskFindings: 0,
      },
      hotspots: [
        {
          name: 'n_http_json_usage',
          uri: 'file:///workspace/n_http_json_usage.sru',
          projectUri: 'file:///workspace/app.pbt',
          priority: 'medium',
          confidence: 'high',
          categories: ['modern-integration'],
          evidence: [
            'metric:httpIntegrationUsages=2',
            'metric:jsonIntegrationUsages=2',
            'integration-surface:http-rest',
            'integration-surface:json',
            'integration-endpoint:https://redacted-host/...',
            'integration-pattern:http-verb:get',
            'integration-pattern:authorization-header',
            'integration-risk:redaction-required',
          ],
          recommendations: ['Revisar contratos HTTP/REST/JSON y redaction.'],
          metrics: {
            approximateComplexity: 1,
            diagnostics: 0,
            externalDependencies: 0,
            httpIntegrationUsages: 2,
            jsonIntegrationUsages: 2,
            linkedDataWindows: 0,
            dynamicSqlStatements: 0,
            obsoleteDiagnostics: 0,
          },
        },
      ],
      recommendations: [
        {
          id: 'rec-modern-http-json',
          title: 'Integración HTTP/JSON',
          category: 'modernization',
          priority: 'medium',
          confidence: 'high',
          detail: 'Mantener redaction por defecto.',
          evidence: ['integration-risk:redaction-required'],
          actions: ['Revisar endpoints'],
        },
      ],
    };

    const report = buildWorkspaceCheckReport({
      request: { mode: 'quick', includeTechnicalDebt: true },
      serverStats: createServerStats(),
      manifest: createManifest(),
      catalog: createCatalogSummary(),
      technicalDebt,
    });

    const finding = report.findings.find((entry) => entry.code === 'technical-debt-recommendations');
    assert.ok(finding);
    assert.match(finding?.detail ?? '', /modernIntegration=4/);
    assert.match(finding?.detail ?? '', /modernEndpoints=1/);
    assert.match(finding?.detail ?? '', /modernPatterns=authorization-header\|http-verb:get/);
    assert.match(finding?.detail ?? '', /modernSurfaces=http-rest\|json/);
    assert.match(finding?.detail ?? '', /modernRisk=redaction-required/);
  });

  test('resume interop WebBrowser/WebView2 en health reutilizando la evidencia del debt report', () => {
    const technicalDebt: ApiPowerBuilderTechnicalDebtReport = {
      schemaVersion: '1.0.0',
      generatedAt: Date.now(),
      summary: {
        totalHotspots: 1,
        totalRecommendations: 1,
        obsoleteFindings: 0,
        dynamicSqlFindings: 0,
        externalDependencyFindings: 0,
        modernIntegrationFindings: 0,
        webUiIntegrationFindings: 1,
        dataWindowRiskFindings: 0,
        complexObjectFindings: 0,
        sourceOriginRiskFindings: 0,
        legacyWorkspaceRiskFindings: 0,
      },
      hotspots: [
        {
          name: 'w_browser_host',
          uri: 'file:///workspace/w_browser_host.srw',
          projectUri: 'file:///workspace/app.pbt',
          priority: 'medium',
          confidence: 'high',
          categories: ['web-ui-integration'],
          evidence: [
            'metric:webBrowserUsages=1',
            'web-ui-surface:webbrowser',
            'web-ui-pattern:navigation',
            'web-ui-pattern:script-bridge',
            'web-ui-pattern:remote-debugging',
            'web-ui-risk:no-content-inspection',
          ],
          recommendations: ['Revisar navegación y bridge JavaScript.'],
          metrics: {
            approximateComplexity: 1,
            diagnostics: 0,
            externalDependencies: 0,
            webBrowserUsages: 1,
            linkedDataWindows: 0,
            dynamicSqlStatements: 0,
            obsoleteDiagnostics: 0,
          },
        },
      ],
      recommendations: [
        {
          id: 'rec-web-ui',
          title: 'Interop web embebida',
          category: 'modernization',
          priority: 'medium',
          confidence: 'high',
          detail: 'Revisar navegación y bridge sin inspeccionar contenido remoto.',
          evidence: ['web-ui-risk:no-content-inspection'],
          actions: ['Revisar settings WebView2'],
        },
      ],
    };

    const report = buildWorkspaceCheckReport({
      request: { mode: 'quick', includeTechnicalDebt: true },
      serverStats: createServerStats(),
      manifest: createManifest(),
      catalog: createCatalogSummary(),
      technicalDebt,
    });

    const finding = report.findings.find((entry) => entry.code === 'technical-debt-recommendations');
    assert.ok(finding);
    assert.match(finding?.detail ?? '', /webUiIntegration=1/);
    assert.match(finding?.detail ?? '', /webUiSurfaces=webbrowser/);
    assert.match(finding?.detail ?? '', /webUiPatterns=navigation\|remote-debugging\|script-bridge/);
    assert.match(finding?.detail ?? '', /webUiRisk=no-content-inspection/);
  });
});