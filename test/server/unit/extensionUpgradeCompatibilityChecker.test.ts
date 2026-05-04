import * as assert from 'assert/strict';

import { buildSettingsGovernanceReport } from '../../../src/client/settingsGovernance';
import { importSemanticWorkspaceSnapshot } from '../../../src/client/semanticWorkspaceSnapshot';
import {
  buildWorkspaceCheckMarkdown,
  buildWorkspaceCheckReport,
} from '../../../src/client/workspaceCheckReport';
import {
  type ApiSemanticWorkspaceManifest,
  type ApiServerStats,
  type ApiWorkspaceMigrationAssistant,
  isApiVersionCompatible,
} from '../../../src/shared/publicApi';
import { loadFixture } from '../helpers/fixtureLoader';

function loadCompatibilityFixture<T>(fileName: string): T {
  return JSON.parse(loadFixture('compatibility', fileName)) as T;
}

function createServerStats(): ApiServerStats {
  return {
    readiness: {
      state: 'ready',
    },
    projectModel: {
      projects: 1,
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
    caches: {
      analysis: { size: 12, capacity: 64 },
      serving: { size: 4, capacity: 32 },
    },
    persistence: {
      checkpointUri: 'file:///workspace/.vsc-powersyntax/runtime/checkpoint.json',
      journalUri: 'file:///workspace/.vsc-powersyntax/runtime/journal.jsonl',
      restoreState: 'restored',
      policy: {
        version: 2,
        staleWorkspaceTtlMs: 86400000,
        maxJournalEntries: 2000,
        maxJournalBytes: 1048576,
        maxWorkspaceBytes: 8388608,
      },
      servingSnapshot: {
        lastRestoredEntries: 7,
        lastPersistedEntries: 7,
      },
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

suite('unit/extensionUpgradeCompatibilityChecker (B298)', () => {
  test('consolida warnings de upgrade usando fixtures legacy y señales del workspace actual', () => {
    const legacyContract = loadCompatibilityFixture<{ apiVersion: string }>('public-contract.v2.11.0.json');
    const legacySnapshot = loadCompatibilityFixture<unknown>('semantic-workspace-snapshot.legacy-no-summary.json');

    assert.equal(isApiVersionCompatible(legacyContract.apiVersion), true);
    assert.equal(importSemanticWorkspaceSnapshot(legacySnapshot).valid, true);

    const settingsGovernance = buildSettingsGovernanceReport({
      'vscPowerSyntax.progress.show': true,
      'vscPowerSyntax.formatting.enabled': false,
      'vscPowerSyntax.formatting.formatOnSave': true,
      'vscPowerSyntax.formatting.maxDocumentChars': 60000,
      'vscPowerSyntax.formatting.maxDocumentLines': 2000,
      'vscPowerSyntax.formatting.trimTrailingWhitespace': true,
      'vscPowerSyntax.formatting.spaceAfterComma': true,
      'vscPowerSyntax.formatting.spaceAroundOperators': true,
      'vscPowerSyntax.formatting.normalizeBlankLines': true,
    }, 'interactive');

    const workspaceMigrationAssistant: ApiWorkspaceMigrationAssistant = {
      schemaVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      available: true,
      currentMode: 'workspace',
      targetMode: 'workspace',
      summary: {
        sourceFileCount: 10,
        projectCount: 1,
        buildFilesTotal: 1,
        usableBuildFiles: 1,
        hasLegacyLibraries: false,
        hasMixedMarkers: false,
        hasOrcaAliases: true,
      },
      recommendations: [
        {
          id: 'source-control-artifacts',
          priority: 'high',
          category: 'legacy',
          title: 'Separar artefactos SCM del source real',
          detail: 'El workspace mezcla ficheros SCM heredados con la topología activa.',
          evidence: ['scm-gitignore-files:1', 'scm-scc-files:1'],
          actions: ['Revisar `.gitignore` y `.scc` antes de reutilizar artefactos generados por versiones previas.'],
        },
        {
          id: 'local-artifact-noise',
          priority: 'high',
          category: 'build',
          title: 'Retirar ruido local antes del upgrade',
          detail: 'Persisten outputs locales que no deben tomarse como build canónico.',
          evidence: ['artifact-build-dirs:1', 'artifact-backup-dirs:1'],
          actions: ['Limpiar `build` y `_backupfiles` antes de comparar el resultado de la nueva versión.'],
        },
      ],
    };

    const report = buildWorkspaceCheckReport({
      request: { mode: 'upgrade' },
      serverStats: createServerStats(),
      manifest: createManifest(),
      settingsGovernance,
      workspaceMigrationAssistant,
    });

    assert.equal(report.available, true);
    assert.equal(report.mode, 'upgrade');
    assert.equal(report.status, 'warning');
    assert.equal(report.upgradeCompatibility?.reviewStatus, 'warning');
    assert.equal(report.upgradeCompatibility?.selectedProfile, 'fast');
    assert.ok(report.findings.some((finding) => finding.code === 'upgrade-settings-profile-drift'));
    assert.ok(report.findings.some((finding) => finding.code === 'upgrade-runtime-cache-refresh'));
    assert.ok(report.findings.some((finding) => finding.code === 'upgrade-workspace-artifacts'));
    assert.ok(report.findings.some((finding) => finding.code === 'upgrade-version-review' && finding.severity === 'info'));
    assert.ok(report.recommendedActions.some((action) => /apiVersion\/schemaVersion/i.test(action)));
    assert.match(buildWorkspaceCheckMarkdown(report), /## Upgrade Compatibility/);
  });
});