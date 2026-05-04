import * as assert from 'assert/strict';
import * as path from 'path';

import {
  buildSupportBundle,
  buildSupportBundleRedactionPolicy,
  suggestSupportBundleDirectoryName,
} from '../../../src/client/support/supportBundle';
import {
  type ApiCurrentObjectContext,
  type ApiPowerBuilderCodeMetrics,
  type ApiPowerBuilderTechnicalDebtReport,
  getPublicApiContractDescriptor,
  getReadOnlyToolBridgeDescriptor,
  type ApiSemanticWorkspaceManifest,
  type ApiWorkspaceMigrationAssistant,
} from '../../../src/shared/publicApi';
import { loadFixture } from '../helpers/fixtureLoader';

interface LegacySupportBundleManifestFixture {
  schemaVersion: number;
  summary: {
    rawSourceIncluded: boolean;
    publicApiVersion: string;
    readOnlyToolCount: number;
  };
  files: Array<{
    relativePath: string;
  }>;
}

function loadCompatibilityFixture<T>(fileName: string): T {
  return JSON.parse(loadFixture('compatibility', fileName)) as T;
}

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
      currentObjectContext: {
        available: true,
        uri: 'file:///repo/lib_app.pbl/w_main.srw',
        objectInfo: {
          uri: 'file:///repo/lib_app.pbl/w_main.srw',
          globalType: 'w_main',
        },
        embeddedSqlAnchors: [
          {
            startLine: 10,
            endLine: 12,
            keyword: 'SELECT',
            preview: 'SELECT order_id INTO :ll_order_id FROM sales_order;',
            confidence: 'high',
            transactionTarget: 'SQLCA',
          }
        ],
      } as unknown as ApiCurrentObjectContext,
      codeMetrics: {
        schemaVersion: '1.0.0',
        generatedAt: 1,
        summary: {
          totalProjects: 1,
          totalLibraries: 1,
          totalObjects: 1,
          totalFunctions: 0,
          totalEvents: 1,
          totalEmbeddedSqlStatements: 1,
          totalLinkedDataWindows: 0,
          totalExternalDependencies: 0,
          totalLifecycleWarnings: 0,
          totalDiagnostics: 0,
        },
        footprint: {
          build: { total: 0, usable: 0, invalid: 0, ambiguous: 0 },
          orca: { stagedFiles: 0, libraryAliases: 0 },
        },
        diagnostics: { byArea: [] },
        objects: [
          {
            name: 'w_main',
            uri: 'file:///repo/lib_app.pbl/w_main.srw',
            projectUri: 'file:///repo/app.pbt',
            metrics: {
              functions: 0,
              events: 1,
              approximateComplexity: 1,
              embeddedSqlStatements: 1,
              linkedDataWindows: 0,
              externalDependencies: 0,
              lifecycleWarnings: 0,
              diagnostics: 0,
            },
            embeddedSqlAnchors: [
              {
                startLine: 10,
                endLine: 12,
                keyword: 'SELECT',
                preview: 'SELECT order_id INTO :ll_order_id FROM sales_order;',
                confidence: 'high',
                transactionTarget: 'SQLCA',
              }
            ],
          }
        ],
      } as unknown as ApiPowerBuilderCodeMetrics,
      technicalDebtReport: {
        schemaVersion: '1.0.0',
        generatedAt: 1,
        summary: {
          totalHotspots: 4,
          totalRecommendations: 0,
          obsoleteFindings: 0,
          dynamicSqlFindings: 0,
          externalDependencyFindings: 0,
          modernIntegrationFindings: 4,
          webUiIntegrationFindings: 1,
          dataWindowRiskFindings: 0,
          complexObjectFindings: 0,
          sourceOriginRiskFindings: 0,
          legacyWorkspaceRiskFindings: 0,
        },
        hotspots: [
          {
            name: 'w_main',
            uri: 'file:///repo/lib_app.pbl/w_main.srw',
            projectUri: 'file:///repo/app.pbt',
            priority: 'medium',
            confidence: 'high',
            categories: ['dynamic-sql'],
            evidence: ['sql-anchor:select:11-13'],
            recommendations: ['Externalizar SQL'],
            metrics: {
              approximateComplexity: 1,
              diagnostics: 0,
              externalDependencies: 0,
              linkedDataWindows: 0,
              dynamicSqlStatements: 0,
              obsoleteDiagnostics: 0,
            },
            embeddedSqlAnchors: [
              {
                startLine: 10,
                endLine: 12,
                keyword: 'SELECT',
                preview: 'SELECT order_id INTO :ll_order_id FROM sales_order;',
                confidence: 'high',
                transactionTarget: 'SQLCA',
              }
            ],
          },
          {
            name: 'w_native',
            uri: 'file:///repo/lib_app.pbl/w_native.srw',
            projectUri: 'file:///repo/app.pbt',
            priority: 'medium',
            confidence: 'high',
            categories: ['external-dependency'],
            evidence: [
              'external-consumers=2',
              'external-kind:dll=1',
              'external-kind:pbx=1',
              'external-alias:PBXEntry',
              'external-risk:native-runtime',
              'external-build-impact:manual-native-deployment',
              'external-risk:pbni-runtime-surface',
              'external-orca-impact:manual-pbx-packaging',
            ],
            recommendations: ['Inventariar dependencias nativas y su despliegue.'],
            metrics: {
              approximateComplexity: 1,
              diagnostics: 0,
              externalDependencies: 2,
              linkedDataWindows: 0,
              dynamicSqlStatements: 0,
              obsoleteDiagnostics: 0,
            },
          },
          {
            name: 'n_http_json_usage',
            uri: 'file:///repo/lib_app.pbl/n_http_json_usage.sru',
            projectUri: 'file:///repo/app.pbt',
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
            recommendations: ['Revisar contratos HTTP/REST/JSON con redaction.'],
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
          {
            name: 'w_browser_host',
            uri: 'file:///repo/lib_app.pbl/w_browser_host.srw',
            projectUri: 'file:///repo/app.pbt',
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
          }
        ],
        recommendations: [],
      } as unknown as ApiPowerBuilderTechnicalDebtReport,
      workspaceMigrationAssistant: {
        schemaVersion: '1.0.0',
        generatedAt: '2026-05-03T12:29:00.000Z',
        available: true,
        currentMode: 'workspace',
        targetMode: 'solution',
        summary: {
          sourceFileCount: 4,
          projectCount: 1,
          buildFilesTotal: 1,
          usableBuildFiles: 1,
          hasLegacyLibraries: true,
          hasMixedMarkers: false,
          hasOrcaAliases: true,
        },
        recommendations: [
          {
            id: 'local-artifact-noise',
            priority: 'medium',
            category: 'build',
            title: 'Excluir outputs locales',
            detail: 'Discovery ignoró build y _backupfiles.',
            evidence: ['artifact-build-dirs:1', 'artifact-backup-dirs:1'],
            actions: ['Inspeccionar manualmente el ruido local con `Get-ChildItem -Force -Directory . | Where-Object Name -in @( ".pb", "build", "_backupfiles" )` antes de archivarlo o retirarlo.'],
          },
          {
            id: 'legacy-orca-aliases',
            priority: 'medium',
            category: 'legacy',
            title: 'Limpiar staging ORCA legacy',
            detail: 'El workspace mantiene aliases ORCA.',
            evidence: ['orca-aliases:1'],
            actions: ['Inspeccionar el staging legacy con `Get-ChildItem -Force -Directory . | Where-Object Name -match "orca|staging"` y retirarlo manualmente solo cuando el source real ya sea la referencia canónica.'],
          },
        ],
      } as ApiWorkspaceMigrationAssistant,
      publicContract: {
        apiVersion: '2.9.0',
        apiVersionMajor: 2,
        extensionId: 'lopez.vsc-powersyntax',
        exportedFrom: 'activate',
        methods: [{ name: 'getServerStats', access: 'read-only', stability: 'stable', command: 'powerbuilder.showStats', responseSchema: 'ApiServerStats' }],
        schemas: [{ name: 'ApiServerStats', version: '1.0.0', kind: 'response' }],
        observability: getPublicApiContractDescriptor().observability,
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
      buildOrcaJournal: {
        total: 1,
        dropped: 0,
        events: [
          {
            ts: 10,
            phase: 'legacy',
            kind: 'orca-import',
            action: 'blocked',
            severity: 'warning',
            detail: {
              issues: [
                {
                  code: 'stale-staging',
                  severity: 'error',
                  message: 'Staging obsoleto para C:/repo/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source.',
                },
              ],
            },
          },
        ],
      },
    });

    assert.equal(bundle.supportBundleWorkspaceRelativePath, 'tools/support-bundles/sample-support');
    assert.ok(bundle.files.some((file) => file.relativePath === 'manifest.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'settings-sanitized.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'build-orca-snapshot.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'workspace-cleanup-advisor.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'current-object-context.sanitized.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'powerbuilder-code-metrics.sanitized.json'));
    assert.ok(bundle.files.some((file) => file.relativePath === 'powerbuilder-technical-debt-report.sanitized.json'));

    const stats = bundle.files.find((file) => file.relativePath === 'server-stats.sanitized.json')?.content ?? '';
    assert.match(stats, /redacted:pbautobuild250\.exe/);
    assert.doesNotMatch(stats, /C:\/Tools\//);

    const settings = bundle.files.find((file) => file.relativePath === 'settings-sanitized.json')?.content ?? '';
    assert.match(settings, /redacted:orca\.exe/);
    assert.doesNotMatch(settings, /C:\/Tools\//);

    const buildOrcaSnapshot = JSON.parse(bundle.files.find((file) => file.relativePath === 'build-orca-snapshot.json')?.content ?? '{}');
    assert.equal(buildOrcaSnapshot.failureClassification?.orca?.primaryReasonCode, 'stale-staging');
    assert.ok(buildOrcaSnapshot.failureClassification?.orca?.findings?.some((finding: { reasonCode?: string }) => finding.reasonCode === 'packaging-disabled'));
    assert.equal(buildOrcaSnapshot.failureClassification?.orca?.findings?.find((finding: { reasonCode?: string }) => finding.reasonCode === 'stale-staging')?.detail, 'El preflight ORCA reportó staging obsoleto.');
    assert.doesNotMatch(JSON.stringify(buildOrcaSnapshot), /C:\/repo\//);

    const diagnostics = bundle.files.find((file) => file.relativePath === 'diagnostics-snapshot.sanitized.json')?.content ?? '';
    assert.match(diagnostics, /redacted:w_main\.srw/);

    const currentObjectContext = bundle.files.find((file) => file.relativePath === 'current-object-context.sanitized.json')?.content ?? '';
    assert.match(currentObjectContext, /redacted:w_main\.srw/);
    assert.match(currentObjectContext, /"transactionTarget": "SQLCA"/);

    const codeMetrics = bundle.files.find((file) => file.relativePath === 'powerbuilder-code-metrics.sanitized.json')?.content ?? '';
    assert.match(codeMetrics, /redacted:app\.pbt/);
    assert.match(codeMetrics, /"embeddedSqlAnchors"/);

    const technicalDebtReport = bundle.files.find((file) => file.relativePath === 'powerbuilder-technical-debt-report.sanitized.json')?.content ?? '';
    assert.match(technicalDebtReport, /redacted:w_main\.srw/);
    assert.match(technicalDebtReport, /redacted:w_native\.srw/);
    assert.match(technicalDebtReport, /sql-anchor:select:11-13/);
    assert.match(technicalDebtReport, /external-kind:pbx=1/);
    assert.match(technicalDebtReport, /manual-pbx-packaging/);
    assert.match(technicalDebtReport, /redacted:n_http_json_usage\.sru/);
    assert.match(technicalDebtReport, /integration-surface:http-rest/);
    assert.match(technicalDebtReport, /integration-endpoint:https:\/\/redacted-host\/\.\.\./);
    assert.match(technicalDebtReport, /integration-pattern:authorization-header/);
    assert.match(technicalDebtReport, /redaction-required/);
    assert.match(technicalDebtReport, /redacted:w_browser_host\.srw/);
    assert.match(technicalDebtReport, /web-ui-surface:webbrowser/);
    assert.match(technicalDebtReport, /web-ui-pattern:remote-debugging/);
    assert.match(technicalDebtReport, /no-content-inspection/);

    const manifest = JSON.parse(bundle.files.find((file) => file.relativePath === 'manifest.json')?.content ?? '{}');
    assert.equal(manifest.summary.rawSourceIncluded, false);
    assert.equal(manifest.summary.redactionProfile, 'balanced');
    assert.equal(manifest.summary.redactionPolicy.settings, 'sanitized');
    assert.equal(manifest.summary.runtimeJournalEvents, 3);
    assert.ok(manifest.files.some((file: { relativePath: string }) => file.relativePath === 'current-object-context.sanitized.json'));
    assert.ok(manifest.files.some((file: { relativePath: string }) => file.relativePath === 'powerbuilder-code-metrics.sanitized.json'));
    assert.ok(manifest.files.some((file: { relativePath: string }) => file.relativePath === 'powerbuilder-technical-debt-report.sanitized.json'));
    assert.ok(manifest.files.some((file: { relativePath: string; redaction?: string }) => file.relativePath === 'settings-sanitized.json' && file.redaction === 'sanitized'));
    assert.ok(manifest.files.some((file: { relativePath: string }) => file.relativePath === 'workspace-cleanup-advisor.json'));

    const cleanupAdvisor = bundle.files.find((file) => file.relativePath === 'workspace-cleanup-advisor.json')?.content ?? '';
    assert.match(cleanupAdvisor, /runtime-cache-refresh/);
    assert.match(cleanupAdvisor, /workspace-artifact-cleanup/);
    assert.match(cleanupAdvisor, /public-api-version:2\.9\.0/);
    assert.match(cleanupAdvisor, /Get-ChildItem -Force/);

    const readme = bundle.files.find((file) => file.relativePath === 'README.md')?.content ?? '';
    assert.match(readme, /sin incluir codigo bruto/i);
    assert.match(readme, /runtime-health\.json/);
    assert.match(readme, /workspace-cleanup-advisor\.json/);
  });

  test('endurece la redaccion por perfil para ci-support', () => {
    const bundle = buildSupportBundle({
      workspaceRootPath: path.join('C:', 'repo'),
      bundleRootPath: path.join('C:', 'repo', 'tools', 'support-bundles', 'ci-support'),
      workspaceLabel: 'repo',
      activeUri: 'file:///repo/test/fixtures/basic/sample.sru',
      activeWorkspaceRelativePath: 'test/fixtures/basic/sample.sru',
      workspaceManifest: {
        schemaVersion: '1.0.0',
        generatedAt: 1,
        limits: { maxObjects: 50, maxSymbols: 100, objectsTruncated: false, symbolsTruncated: false },
        projects: [{ projectUri: 'file:///repo/app.pbt', kind: 'target', name: 'app', libraries: ['file:///repo/lib_app.pbl'], fileCount: 4 }],
        libraries: ['file:///repo/lib_app.pbl'],
        objects: [{ name: 'w_main', uri: 'file:///repo/lib_app.pbl/w_main.srw', objectKind: 'window', sourceOrigin: 'workspace-ws_objects' }],
        inheritanceSummary: { totalTypes: 1, roots: 1, items: [] },
        exportedSymbols: [],
        diagnosticsSummary: {
          totals: { error: 1, warning: 2, info: 0, hint: 0 },
          byFile: { 'file:///repo/lib_app.pbl/w_main.srw': 3 },
          byCode: { 'PowerScript:SD7': 2 },
          bySeverity: { error: 1, warning: 2 },
          documents: [{ uri: 'file:///repo/lib_app.pbl/w_main.srw', total: 3, byCode: { 'PowerScript:SD7': 2 }, bySeverity: { warning: 2 }, projectLabel: 'app', objectLabel: 'w_main', snapshotIdentity: 'file:///repo/lib_app.pbl/w_main.srw@123' }],
          projects: [{ key: 'file:///repo/app.pbt', label: 'app', total: 3, byCode: { 'PowerScript:SD7': 2 }, bySeverity: { warning: 2 }, objects: [] }],
        },
        sourceOriginSummary: { 'workspace-ws_objects': 1 },
        readiness: { state: 'ready' },
      },
      serverStats: {
        readiness: { state: 'ready', detail: 'ok' },
        workspace: { mode: 'workspace', files: 4 },
        health: { status: 'warning', summary: 'runtime attention', findings: [], counts: { info: 0, warning: 1, error: 0 }, checkedLayers: [] },
        diagnostics: {
          totals: { error: 1, warning: 2, info: 0, hint: 0 },
          byFile: { 'file:///repo/lib_app.pbl/w_main.srw': 3 },
          byCode: { 'PowerScript:SD7': 2 },
          bySeverity: { error: 1, warning: 2 },
          documents: [{ uri: 'file:///repo/lib_app.pbl/w_main.srw', total: 3, byCode: { 'PowerScript:SD7': 2 }, bySeverity: { warning: 2 }, projectLabel: 'app', objectLabel: 'w_main', snapshotIdentity: 'file:///repo/lib_app.pbl/w_main.srw@123' }],
          projects: [{ key: 'file:///repo/app.pbt', label: 'app', total: 3, byCode: { 'PowerScript:SD7': 2 }, bySeverity: { warning: 2 }, objects: [] }],
        },
        runtimeJournal: {
          total: 1,
          dropped: 0,
          events: [{ ts: 1, phase: 'serve', kind: 'hover', action: 'query', detail: { sourcePath: 'C:/repo/lib_app.pbl/w_main.srw' } }],
        },
      },
      currentObjectContext: {
        available: true,
        uri: 'file:///repo/lib_app.pbl/w_main.srw',
        embeddedSqlAnchors: [{ startLine: 1, endLine: 1, keyword: 'SELECT', preview: 'SELECT * FROM sales_order', confidence: 'high', transactionTarget: 'SQLCA' }],
      } as unknown as ApiCurrentObjectContext,
      publicContract: getPublicApiContractDescriptor(),
      readOnlyToolBridge: getReadOnlyToolBridgeDescriptor(),
      settingsGovernance: {
        selectedProfile: 'ci-support',
        availableProfiles: [{ id: 'ci-support', label: 'CI Support', description: 'CI', managedSettings: { 'vscPowerSyntax.progress.show': false } }],
        managedSettings: [{ key: 'vscPowerSyntax.progress.show', expectedValue: false, currentValue: false, matchesProfile: true }],
        conflicts: [],
      },
      settingsValues: {
        'vscPowerSyntax.profile': 'ci-support',
        'vscPowerSyntax.build.pbAutoBuildPath': 'C:/Tools/pbautobuild250.exe',
        'vscPowerSyntax.legacy.orcaPath': 'C:/Tools/orca.exe',
      },
      generatedAt: '2026-05-03T12:45:00.000Z',
    });

    const manifest = JSON.parse(bundle.files.find((file) => file.relativePath === 'manifest.json')?.content ?? '{}');
    assert.equal(manifest.summary.redactionProfile, 'ci-support');
    assert.equal(manifest.summary.redactionPolicy.paths, 'summary-only');
    assert.equal(manifest.summary.redactionPolicy.diagnostics, 'summary-only');
    assert.equal(manifest.summary.redactionPolicy.settings, 'summary-only');

    const diagnostics = JSON.parse(bundle.files.find((file) => file.relativePath === 'diagnostics-snapshot.sanitized.json')?.content ?? '{}');
    assert.equal(diagnostics.redaction, 'summary-only');
    assert.equal('topDocuments' in diagnostics, false);

    const settings = JSON.parse(bundle.files.find((file) => file.relativePath === 'settings-sanitized.json')?.content ?? '{}');
    assert.equal(settings.redaction, 'summary-only');
    assert.ok(Array.isArray(settings.managedSettings));
    assert.ok(settings.managedSettings.every((entry: { valueType?: string; value?: unknown }) => typeof entry.valueType === 'string' && entry.value === undefined));

    const currentObjectContext = bundle.files.find((file) => file.relativePath === 'current-object-context.sanitized.json')?.content ?? '';
    assert.match(currentObjectContext, /redacted-snippet/);

    const reducedManifest = JSON.parse(bundle.files.find((file) => file.relativePath === 'semantic-workspace-manifest.reduced.json')?.content ?? '{}');
    assert.equal(reducedManifest.redaction, 'summary-only');
    assert.equal('projects' in reducedManifest, false);

    const stats = bundle.files.find((file) => file.relativePath === 'server-stats.sanitized.json')?.content ?? '';
    assert.doesNotMatch(stats, /redacted:pbautobuild250\.exe/);
    assert.match(stats, /"sourcePath": "redacted"/);
  });

  test('mantiene roundtrip del manifest y compatibilidad con el fixture v1', () => {
    const workspaceManifest = loadCompatibilityFixture<ApiSemanticWorkspaceManifest>('semantic-workspace-manifest.v1.json');
    const legacyManifest = loadCompatibilityFixture<LegacySupportBundleManifestFixture>('support-bundle-manifest.v1.json');

    const bundle = buildSupportBundle({
      workspaceRootPath: path.join('C:', 'repo'),
      bundleRootPath: path.join('C:', 'repo', 'tools', 'support-bundles', 'compatibility-sample'),
      workspaceLabel: 'repo',
      workspaceManifest,
      serverStats: {
        readiness: { state: 'ready', detail: 'ok' },
        workspace: { mode: 'workspace', files: 2 },
        health: {
          status: 'healthy',
          summary: 'ok',
          findings: [],
          counts: { info: 0, warning: 0, error: 0 },
          checkedLayers: [],
        },
        diagnostics: {
          totals: { error: 0, warning: 0, info: 0, hint: 0 },
          byFile: {},
          byCode: {},
          bySeverity: {},
          documents: [],
          projects: [],
        },
        runtimeJournal: {
          total: 2,
          dropped: 0,
          events: [
            { ts: 1, phase: 'index', kind: 'cache', action: 'restore', detail: { checkpointUri: 'file:///repo/.vsc-powersyntax/runtime/checkpoint.json' } },
            { ts: 2, phase: 'serve', kind: 'hover', action: 'query', detail: { uri: 'file:///proj/lib_app.pbl/w_main.srw' } },
          ],
        },
        memory: {
          status: 'healthy',
          totalEstimatedBytes: 1024,
          totalBudgetBytes: 4096,
          layers: [],
        },
        caches: {
          analysis: { size: 1, capacity: 8 },
          serving: { size: 1, capacity: 8, hits: 2, misses: 0, evictions: 0, ttlMs: 5000 },
        },
      },
      publicContract: getPublicApiContractDescriptor(),
      readOnlyToolBridge: getReadOnlyToolBridgeDescriptor(),
      settingsGovernance: {
        selectedProfile: 'balanced',
        availableProfiles: [],
        managedSettings: [],
        conflicts: [],
      },
      settingsValues: {},
      generatedAt: '2026-05-03T18:10:00.000Z',
    });

    const manifestFile = JSON.parse(bundle.files.find((file) => file.relativePath === 'manifest.json')?.content ?? '{}');

    assert.deepEqual(manifestFile, bundle.manifest);
    assert.equal(bundle.manifest.schemaVersion, legacyManifest.schemaVersion);
    assert.equal(bundle.manifest.summary.rawSourceIncluded, legacyManifest.summary.rawSourceIncluded);
    assert.equal(
      bundle.manifest.summary.publicApiVersion.split('.')[0],
      legacyManifest.summary.publicApiVersion.split('.')[0]
    );
    assert.ok(bundle.manifest.summary.readOnlyToolCount >= legacyManifest.summary.readOnlyToolCount);
    assert.ok(
      legacyManifest.files.every((entry) => bundle.manifest.files.some((current) => current.relativePath === entry.relativePath))
    );
  });

  test('publica una policy de redaccion explicita por perfil', () => {
    assert.deepEqual(buildSupportBundleRedactionPolicy('balanced'), {
      profile: 'balanced',
      paths: 'sanitized',
      snippets: 'sanitized',
      diagnostics: 'sanitized',
      settings: 'sanitized',
      manifest: 'sanitized',
    });
    assert.deepEqual(buildSupportBundleRedactionPolicy('ci-support'), {
      profile: 'ci-support',
      paths: 'summary-only',
      snippets: 'summary-only',
      diagnostics: 'summary-only',
      settings: 'summary-only',
      manifest: 'summary-only',
    });
  });
});