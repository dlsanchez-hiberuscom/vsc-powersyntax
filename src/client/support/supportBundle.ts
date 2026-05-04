import * as path from 'path';

import type {
  ApiObservabilityRedaction,
  ApiCurrentObjectContext,
  ApiDiagnosticsSnapshot,
  ApiPowerBuilderCodeMetrics,
  ApiPowerBuilderTechnicalDebtReport,
  ApiPublicContractDescriptor,
  ApiReadOnlyToolBridgeDescriptor,
  ApiRuntimeJournalSnapshot,
  ApiSemanticWorkspaceManifest,
  ApiServerStats,
  ApiWorkspaceMigrationAssistant,
} from '../../shared/publicApi';
import { classifyBuildOrcaFailures } from '../build/buildOrcaFailureClassification';
import type { PowerSyntaxProfileId, PowerSyntaxSettingsGovernanceReport } from '../settingsGovernance';

export type SupportBundleRedactionLevel = Exclude<ApiObservabilityRedaction, 'none'>;

export interface SupportBundleRedactionPolicy {
  profile: PowerSyntaxProfileId;
  paths: SupportBundleRedactionLevel;
  snippets: SupportBundleRedactionLevel;
  diagnostics: SupportBundleRedactionLevel;
  settings: SupportBundleRedactionLevel;
  manifest: SupportBundleRedactionLevel;
}

export interface SupportBundleInput {
  workspaceRootPath: string;
  bundleRootPath: string;
  workspaceLabel: string;
  activeUri?: string;
  activeWorkspaceRelativePath?: string;
  workspaceManifest: ApiSemanticWorkspaceManifest;
  serverStats: ApiServerStats;
  currentObjectContext?: ApiCurrentObjectContext;
  codeMetrics?: ApiPowerBuilderCodeMetrics;
  technicalDebtReport?: ApiPowerBuilderTechnicalDebtReport;
  workspaceMigrationAssistant?: ApiWorkspaceMigrationAssistant;
  publicContract: ApiPublicContractDescriptor;
  readOnlyToolBridge: ApiReadOnlyToolBridgeDescriptor;
  settingsGovernance: PowerSyntaxSettingsGovernanceReport;
  settingsValues: Record<string, unknown>;
  buildOrcaJournal?: ApiRuntimeJournalSnapshot;
  maxJournalEvents?: number;
  generatedAt?: string;
}

export interface SupportBundleFile {
  relativePath: string;
  content: string;
}

export interface SupportBundleManifest {
  schemaVersion: 1;
  generatedAt: string;
  supportBundleWorkspaceRelativePath: string;
  workspace: {
    label: string;
    activeUri?: string;
    activeWorkspaceRelativePath?: string;
    mode?: string;
  };
  summary: {
    readinessState?: string;
    healthStatus?: string;
    buildHealthState?: string;
    diagnosticsAvailable: boolean;
    runtimeJournalEvents: number;
    rawSourceIncluded: false;
    publicApiVersion: string;
    readOnlyToolCount: number;
    redactionProfile: PowerSyntaxProfileId;
    redactionPolicy: {
      paths: SupportBundleRedactionLevel;
      snippets: SupportBundleRedactionLevel;
      diagnostics: SupportBundleRedactionLevel;
      settings: SupportBundleRedactionLevel;
      manifest: SupportBundleRedactionLevel;
    };
  };
  files: Array<{
    relativePath: string;
    description: string;
    redaction: ApiObservabilityRedaction;
  }>;
}

export interface SupportBundleBundle {
  supportBundleWorkspaceRelativePath: string;
  manifest: SupportBundleManifest;
  files: readonly SupportBundleFile[];
}

interface SupportBundleRuntimeJournalTail {
  total: number;
  dropped: number;
  exported: number;
  events: unknown[];
}

interface SupportBundleCleanupRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  area: 'workspace' | 'cache' | 'settings' | 'snapshot';
  detail: string;
  evidence: string[];
  commands: string[];
}

interface SupportBundleCleanupAdvisor {
  schemaVersion: '1.0.0';
  generatedAt: string;
  summary: {
    selectedProfile: PowerSyntaxProfileId;
    settingsConflicts: number;
    managedSettingsOutOfProfile: number;
    publicApiVersion: string;
    workspaceManifestSchemaVersion: ApiSemanticWorkspaceManifest['schemaVersion'];
    supportBundleSchemaVersion: SupportBundleManifest['schemaVersion'];
    workspaceMigrationAssistantAvailable: boolean;
    workspaceArtifactRecommendations: number;
  };
  recommendations: SupportBundleCleanupRecommendation[];
}

const DEFAULT_MAX_RUNTIME_JOURNAL_EVENTS = 40;

export function buildSupportBundleRedactionPolicy(profile: PowerSyntaxProfileId): SupportBundleRedactionPolicy {
  switch (profile) {
    case 'ci-support':
      return {
        profile,
        paths: 'summary-only',
        snippets: 'summary-only',
        diagnostics: 'summary-only',
        settings: 'summary-only',
        manifest: 'summary-only',
      };
    case 'support-safe':
      return {
        profile,
        paths: 'summary-only',
        snippets: 'summary-only',
        diagnostics: 'sanitized',
        settings: 'summary-only',
        manifest: 'sanitized',
      };
    default:
      return {
        profile,
        paths: 'sanitized',
        snippets: 'sanitized',
        diagnostics: 'sanitized',
        settings: 'sanitized',
        manifest: 'sanitized',
      };
  }
}

export function suggestSupportBundleDirectoryName(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'support-bundle';
}

export function buildSupportBundle(input: SupportBundleInput): SupportBundleBundle {
  const supportBundleWorkspaceRelativePath = ensureNonEmptyPosixPath(
    path.relative(input.workspaceRootPath, input.bundleRootPath)
  );
  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const redactionPolicy = buildSupportBundleRedactionPolicy(input.settingsGovernance.selectedProfile);
  const serverStats = sanitizeServerStats(input.serverStats, redactionPolicy);
  const diagnosticsSnapshot = buildSanitizedDiagnosticsSnapshot(input.serverStats.diagnostics, redactionPolicy);
  const reducedManifest = buildReducedManifest(input.workspaceManifest, redactionPolicy);
  const runtimeJournalTail = buildRuntimeJournalTail(input.serverStats, input.maxJournalEvents, redactionPolicy);
  const performanceSummary = buildPerformanceSummary(input.serverStats);
  const buildOrcaSnapshot = buildBuildOrcaSnapshot(input.serverStats, redactionPolicy, input.buildOrcaJournal);
  const settingsSnapshot = buildSanitizedSettings(input.settingsValues, input.settingsGovernance, redactionPolicy);
  const apiInventory = buildApiInventory(input.publicContract, input.readOnlyToolBridge);
  const workspaceCleanupAdvisor = buildWorkspaceCleanupAdvisor(input, generatedAt, redactionPolicy);

  const files: SupportBundleFile[] = [];
  const manifestFiles: SupportBundleManifest['files'] = [];
  const appendFile = (relativePath: string, content: string, description: string, redaction: ApiObservabilityRedaction): void => {
    files.push({ relativePath, content });
    manifestFiles.push({ relativePath, description, redaction });
  };

  appendFile('runtime-health.json', `${JSON.stringify(sanitizeUnknown(input.serverStats.health ?? null, ['runtimeHealth'], redactionPolicy), null, 2)}\n`, 'Salud agregada del runtime y findings visibles.', redactionPolicy.paths);
  appendFile('server-stats.sanitized.json', `${JSON.stringify(serverStats, null, 2)}\n`, 'Snapshot saneado de stats del runtime.', redactionPolicy.paths);
  appendFile('diagnostics-snapshot.sanitized.json', `${JSON.stringify(diagnosticsSnapshot, null, 2)}\n`, 'Snapshot agregada de diagnósticos con rutas saneadas.', redactionPolicy.diagnostics);
  appendFile('semantic-workspace-manifest.reduced.json', `${JSON.stringify(reducedManifest, null, 2)}\n`, 'Manifest semántico reducido sin inventario completo de URIs.', redactionPolicy.manifest);
  appendFile('runtime-journal-tail.json', `${JSON.stringify(runtimeJournalTail, null, 2)}\n`, 'Cola reciente del journal técnico del runtime.', combineRedactionLevels(redactionPolicy.paths, redactionPolicy.snippets));
  appendFile('performance-summary.json', `${JSON.stringify(performanceSummary, null, 2)}\n`, 'Resumen de memoria, caches, query trace e indexación.', 'none');
  if (input.currentObjectContext) {
    appendFile(
      'current-object-context.sanitized.json',
      `${JSON.stringify(sanitizeUnknown(input.currentObjectContext, ['currentObjectContext'], redactionPolicy), null, 2)}\n`,
      'Context pack saneado del objeto activo, incluyendo anchors SQL embebido.',
      combineRedactionLevels(redactionPolicy.paths, redactionPolicy.snippets),
    );
  }
  if (input.codeMetrics) {
    appendFile(
      'powerbuilder-code-metrics.sanitized.json',
      `${JSON.stringify(sanitizeUnknown(input.codeMetrics, ['powerBuilderCodeMetrics'], redactionPolicy), null, 2)}\n`,
      'Reporte saneado de code metrics con anchors SQL embebido por objeto.',
      combineRedactionLevels(redactionPolicy.paths, redactionPolicy.snippets),
    );
  }
  if (input.technicalDebtReport) {
    appendFile(
      'powerbuilder-technical-debt-report.sanitized.json',
      `${JSON.stringify(sanitizeUnknown(input.technicalDebtReport, ['powerBuilderTechnicalDebtReport'], redactionPolicy), null, 2)}\n`,
      'Reporte saneado de deuda técnica con hotspots y anchors SQL embebido.',
      combineRedactionLevels(redactionPolicy.paths, redactionPolicy.snippets),
    );
  }
  appendFile('settings-governance.json', `${JSON.stringify(input.settingsGovernance, null, 2)}\n`, 'Reporte de gobernanza y divergencias del perfil actual.', 'none');
  appendFile('settings-sanitized.json', `${JSON.stringify(settingsSnapshot, null, 2)}\n`, 'Settings exportados con redacción de rutas y secretos locales.', redactionPolicy.settings);
  appendFile('build-orca-snapshot.json', `${JSON.stringify(buildOrcaSnapshot, null, 2)}\n`, 'Estado saneado de build moderno, ORCA legacy y journal asociado.', redactionPolicy.paths);
  appendFile('workspace-cleanup-advisor.json', `${JSON.stringify(workspaceCleanupAdvisor, null, 2)}\n`, 'Advisor read-only con acciones manuales para artefactos locales, staging y caches persistentes.', combineRedactionLevels(redactionPolicy.paths, redactionPolicy.settings));
  appendFile('public-contract.json', `${JSON.stringify(input.publicContract, null, 2)}\n`, 'Contrato público exportado por la extensión.', 'none');
  appendFile('read-only-tool-bridge.json', `${JSON.stringify(input.readOnlyToolBridge, null, 2)}\n`, 'Descriptor del bridge read-only y schemas visibles.', 'none');
  appendFile('api-inventory.json', `${JSON.stringify(apiInventory, null, 2)}\n`, 'Inventario resumido de métodos y tools read-only.', 'none');

  const manifest: SupportBundleManifest = {
    schemaVersion: 1,
    generatedAt,
    supportBundleWorkspaceRelativePath,
    workspace: {
      label: input.workspaceLabel,
      ...(input.activeUri ? { activeUri: redactLocation(input.activeUri) } : {}),
      ...(input.activeWorkspaceRelativePath ? { activeWorkspaceRelativePath: input.activeWorkspaceRelativePath } : {}),
      ...(input.serverStats.workspace?.mode ? { mode: input.serverStats.workspace.mode } : {}),
    },
    summary: {
      ...(input.workspaceManifest.readiness.state ? { readinessState: input.workspaceManifest.readiness.state } : {}),
      ...(input.serverStats.health?.status ? { healthStatus: input.serverStats.health.status } : {}),
      ...(input.serverStats.buildHealth?.state ? { buildHealthState: input.serverStats.buildHealth.state } : {}),
      diagnosticsAvailable: Boolean(input.serverStats.diagnostics),
      runtimeJournalEvents: runtimeJournalTail.events.length,
      rawSourceIncluded: false,
      publicApiVersion: input.publicContract.apiVersion,
      readOnlyToolCount: input.readOnlyToolBridge.tools.length,
      redactionProfile: redactionPolicy.profile,
      redactionPolicy: {
        paths: redactionPolicy.paths,
        snippets: redactionPolicy.snippets,
        diagnostics: redactionPolicy.diagnostics,
        settings: redactionPolicy.settings,
        manifest: redactionPolicy.manifest,
      },
    },
    files: [
      ...manifestFiles,
      { relativePath: 'README.md', description: 'Guía de reproducción y uso del support bundle.', redaction: 'none' },
    ],
  };

  files.unshift({
    relativePath: 'README.md',
    content: buildReadme(manifest),
  });
  files.unshift({
    relativePath: 'manifest.json',
    content: `${JSON.stringify(manifest, null, 2)}\n`,
  });

  return {
    supportBundleWorkspaceRelativePath,
    manifest,
    files,
  };
}

function buildReducedManifest(
  manifest: ApiSemanticWorkspaceManifest,
  redactionPolicy: SupportBundleRedactionPolicy,
): Record<string, unknown> {
  const objectKinds = manifest.objects.reduce<Record<string, number>>((accumulator, objectInfo) => {
    const key = objectInfo.objectKind ?? 'unknown';
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  const reducedManifest = {
    schemaVersion: manifest.schemaVersion,
    generatedAt: manifest.generatedAt,
    redaction: redactionPolicy.manifest,
    readiness: manifest.readiness,
    limits: manifest.limits,
    counts: {
      projectCount: manifest.projects.length,
      libraryCount: manifest.libraries.length,
      objectCount: manifest.objects.length,
      exportedSymbolCount: manifest.exportedSymbols.length,
    },
    sourceOriginSummary: manifest.sourceOriginSummary,
    objectKinds,
    diagnosticsSummary: manifest.diagnosticsSummary
      ? {
        totals: manifest.diagnosticsSummary.totals,
        bySeverity: manifest.diagnosticsSummary.bySeverity,
        topCodes: takeTopEntries(manifest.diagnosticsSummary.byCode, 20),
        documentCount: manifest.diagnosticsSummary.documents.length,
        projectCount: manifest.diagnosticsSummary.projects.length,
      }
      : undefined,
  };

  if (redactionPolicy.manifest === 'summary-only') {
    return reducedManifest;
  }

  return {
    ...reducedManifest,
    projects: manifest.projects.slice(0, 12).map((project) => ({
      name: project.name,
      kind: project.kind,
      fileCount: project.fileCount,
      libraryCount: project.libraries.length,
    })),
  };
}

function buildRuntimeJournalTail(
  stats: ApiServerStats,
  maxJournalEvents: number | undefined,
  redactionPolicy: SupportBundleRedactionPolicy,
): SupportBundleRuntimeJournalTail {
  const events = stats.runtimeJournal?.events ?? [];
  const limit = typeof maxJournalEvents === 'number' && Number.isFinite(maxJournalEvents)
    ? Math.max(0, Math.trunc(maxJournalEvents))
    : DEFAULT_MAX_RUNTIME_JOURNAL_EVENTS;
  const selectedEvents = limit > 0 ? events.slice(-limit) : [];

  return {
    total: stats.runtimeJournal?.total ?? 0,
    dropped: stats.runtimeJournal?.dropped ?? 0,
    exported: selectedEvents.length,
    events: selectedEvents.map((event) => sanitizeUnknown(event, ['runtimeJournal', event.kind, event.action], redactionPolicy)),
  };
}

function buildPerformanceSummary(stats: ApiServerStats): Record<string, unknown> {
  return {
    readiness: stats.readiness,
    indexer: stats.indexer,
    memory: stats.memory,
    caches: stats.caches,
    lastQueryTrace: stats.lastQueryTrace
      ? {
        label: stats.lastQueryTrace.label,
        confidence: stats.lastQueryTrace.confidence,
        primaryReasonCode: stats.lastQueryTrace.primaryReasonCode,
        invocationKind: stats.lastQueryTrace.invocationKind,
        invocationRisk: stats.lastQueryTrace.invocationRisk,
        evidenceKinds: stats.lastQueryTrace.evidenceKinds,
        targetCount: stats.lastQueryTrace.targetCount,
        hasAmbiguity: stats.lastQueryTrace.hasAmbiguity,
        stepCount: stats.lastQueryTrace.steps?.length ?? 0,
      }
      : undefined,
  };
}

function buildBuildOrcaSnapshot(
  stats: ApiServerStats,
  redactionPolicy: SupportBundleRedactionPolicy,
  buildOrcaJournal?: ApiRuntimeJournalSnapshot,
): Record<string, unknown> {
  const failureClassification = classifyBuildOrcaFailures({
    stats,
    buildOrcaJournal,
  });

  return {
    buildTooling: sanitizeUnknown(stats.buildTooling, ['buildTooling'], redactionPolicy),
    buildFiles: stats.buildFiles,
    buildProfile: sanitizeUnknown(stats.buildProfile, ['buildProfile'], redactionPolicy),
    buildRunner: sanitizeUnknown(stats.buildRunner, ['buildRunner'], redactionPolicy),
    buildProblems: stats.buildProblems,
    buildHealth: stats.buildHealth,
    orcaTooling: sanitizeUnknown(stats.orcaTooling, ['orcaTooling'], redactionPolicy),
    orcaRunner: sanitizeUnknown(stats.orcaRunner, ['orcaRunner'], redactionPolicy),
    failureClassification: sanitizeUnknown(failureClassification, ['failureClassification'], redactionPolicy),
    persistence: sanitizeUnknown({
      buildOrcaJournalUri: stats.persistence?.buildOrcaJournalUri,
      journalUri: stats.persistence?.journalUri,
      checkpointUri: stats.persistence?.checkpointUri,
    }, ['persistence'], redactionPolicy),
  };
}

function buildWorkspaceCleanupAdvisor(
  input: SupportBundleInput,
  generatedAt: string,
  redactionPolicy: SupportBundleRedactionPolicy,
): SupportBundleCleanupAdvisor {
  const settingsConflicts = input.settingsGovernance.conflicts.length;
  const managedSettingsOutOfProfile = input.settingsGovernance.managedSettings.filter((entry) => entry.matchesProfile === false).length;
  const workspaceArtifactRecommendations = (input.workspaceMigrationAssistant?.recommendations ?? []).filter((recommendation) =>
    recommendation.id === 'source-control-artifacts'
    || recommendation.id === 'local-artifact-noise'
    || recommendation.id === 'legacy-orca-aliases'
  );

  const recommendations: SupportBundleCleanupRecommendation[] = [];
  const hasPersistentRuntimeState = Boolean(
    input.serverStats.persistence?.checkpointUri
    || input.serverStats.persistence?.journalUri
    || input.serverStats.persistence?.buildOrcaJournalUri
    || input.serverStats.persistence?.servingSnapshot?.lastRestoredEntries
    || input.serverStats.caches?.analysis?.size
    || input.serverStats.caches?.serving?.size
  );

  if (hasPersistentRuntimeState) {
    recommendations.push({
      id: 'runtime-cache-refresh',
      priority: 'medium',
      area: 'cache',
      detail: 'El runtime conserva journal/checkpoint, serving snapshot o entradas de cache; si el troubleshooting sospecha drift o estado obsoleto, inspecciona y regenera ese runtime local manualmente.',
      evidence: [
        `analysis-cache-size:${input.serverStats.caches?.analysis?.size ?? 0}`,
        `serving-cache-size:${input.serverStats.caches?.serving?.size ?? 0}`,
        `serving-snapshot-restored:${input.serverStats.persistence?.servingSnapshot?.lastRestoredEntries ?? 0}`,
        `restore-state:${input.serverStats.persistence?.restoreState ?? 'unknown'}`,
        `retention-policy-version:${input.serverStats.persistence?.policy?.version ?? 'unknown'}`,
      ],
      commands: [
        'Inspeccionar el runtime local con `Get-ChildItem -Force ".vsc-powersyntax/runtime"` desde la raíz del workspace.',
        'Cerrar VS Code antes de archivar o retirar manualmente `checkpoint`, `journal` y snapshots persistentes del runtime.',
        'Reabrir el workspace y volver a exportar el support bundle para comprobar que el runtime se reconstruyó limpio.',
      ],
    });
  }

  if (settingsConflicts > 0 || managedSettingsOutOfProfile > 0) {
    recommendations.push({
      id: 'settings-profile-drift',
      priority: 'medium',
      area: 'settings',
      detail: 'El perfil activo y los managed settings no están alineados; conviene estabilizar el perfil antes de limpiar caches o comparar bundles sucesivos.',
      evidence: [
        `selected-profile:${input.settingsGovernance.selectedProfile}`,
        `settings-conflicts:${settingsConflicts}`,
        `managed-settings-out-of-profile:${managedSettingsOutOfProfile}`,
      ],
      commands: [
        'Revisar `settings-governance.json` y corregir o documentar primero el drift de configuración.',
        'Volver a exportar el bundle después de cambiar el profile para no comparar snapshots generados con settings heterogéneos.',
      ],
    });
  }

  if (workspaceArtifactRecommendations.length > 0) {
    recommendations.push({
      id: 'workspace-artifact-cleanup',
      priority: 'high',
      area: 'workspace',
      detail: 'El workspace aún expone artefactos locales o staging legacy que deben tratarse como ruido o soporte temporal, nunca como source/build canónicos.',
      evidence: [
        ...workspaceArtifactRecommendations.map((recommendation) => `assistant:${recommendation.id}`),
        ...workspaceArtifactRecommendations.flatMap((recommendation) => recommendation.evidence).slice(0, 8),
      ],
      commands: [
        'Inspeccionar ruido local con `Get-ChildItem -Force -Directory . | Where-Object Name -in @( ".pb", "build", "_backupfiles" )`.',
        'Si el staging ORCA ya no es la referencia activa, archivarlo o retirarlo manualmente solo después de confirmar import/source real.',
        'Ejecutar de nuevo el asistente de migración y regenerar el support bundle tras la limpieza manual.',
      ],
    });
  }

  recommendations.push({
    id: 'snapshot-version-review',
    priority: 'low',
    area: 'snapshot',
    detail: 'Antes de comparar bundles o reutilizar capturas antiguas, confirma que la versión pública y los schemaVersion exportados siguen alineados.',
    evidence: [
      `public-api-version:${input.publicContract.apiVersion}`,
      'support-bundle-schema:1',
      `workspace-manifest-schema:${input.workspaceManifest.schemaVersion}`,
      `migration-assistant-schema:${input.workspaceMigrationAssistant?.schemaVersion ?? 'not-exported'}`,
    ],
    commands: [
      'Comparar `public-contract.json`, `semantic-workspace-manifest.reduced.json` y `workspace-cleanup-advisor.json` antes de reciclar bundles viejos o de mezclar snapshots de otra sesión.',
    ],
  });

  return {
    schemaVersion: '1.0.0',
    generatedAt,
    summary: {
      selectedProfile: input.settingsGovernance.selectedProfile,
      settingsConflicts,
      managedSettingsOutOfProfile,
      publicApiVersion: input.publicContract.apiVersion,
      workspaceManifestSchemaVersion: input.workspaceManifest.schemaVersion,
      supportBundleSchemaVersion: 1,
      workspaceMigrationAssistantAvailable: Boolean(input.workspaceMigrationAssistant?.available),
      workspaceArtifactRecommendations: workspaceArtifactRecommendations.length,
    },
    recommendations: recommendations.map((recommendation) => ({
      ...recommendation,
      evidence: sanitizeUnknown(recommendation.evidence, ['workspaceCleanupAdvisor', recommendation.id], redactionPolicy) as string[],
      commands: sanitizeUnknown(recommendation.commands, ['workspaceCleanupAdvisor', recommendation.id, 'commands'], redactionPolicy) as string[],
    })),
  };
}

function buildApiInventory(
  contract: ApiPublicContractDescriptor,
  bridge: ApiReadOnlyToolBridgeDescriptor,
): Record<string, unknown> {
  return {
    apiVersion: contract.apiVersion,
    extensionId: contract.extensionId,
    methodCount: contract.methods.length,
    readOnlyMethodCount: contract.capabilities.readOnlyMethods.length,
    writeEnabledMethodCount: contract.capabilities.writeEnabledMethods.length,
    toolCount: bridge.tools.length,
    methods: contract.methods.map((method) => ({
      name: method.name,
      access: method.access,
      stability: method.stability,
      command: method.command,
      requestSchema: method.requestSchema,
      responseSchema: method.responseSchema,
    })),
    tools: bridge.tools.map((tool) => ({
      name: tool.name,
      command: tool.command,
      requestSchema: tool.requestSchema,
      responseSchema: tool.responseSchema,
      usesActiveEditorFallback: tool.usesActiveEditorFallback,
    })),
  };
}

function buildSanitizedSettings(
  settingsValues: Record<string, unknown>,
  governance: PowerSyntaxSettingsGovernanceReport,
  redactionPolicy: SupportBundleRedactionPolicy,
): Record<string, unknown> {
  const keys = Object.keys(settingsValues).sort();
  const governedKeys = new Set(governance.managedSettings.map((entry) => entry.key));

  if (redactionPolicy.settings === 'summary-only') {
    return {
      selectedProfile: governance.selectedProfile,
      redaction: redactionPolicy.settings,
      managedSettings: keys.map((key) => ({
        key,
        governed: governedKeys.has(key),
        valueType: summarizeValueType(settingsValues[key]),
      })),
      availableProfiles: governance.availableProfiles.map((profile) => ({
        id: profile.id,
        label: profile.label,
      })),
      conflictCount: governance.conflicts.length,
    };
  }

  return {
    selectedProfile: governance.selectedProfile,
    redaction: redactionPolicy.settings,
    managedSettings: keys.map((key) => ({
      key,
      value: sanitizeUnknown(settingsValues[key], [key], redactionPolicy),
    })),
    availableProfiles: governance.availableProfiles.map((profile) => ({
      id: profile.id,
      label: profile.label,
      description: profile.description,
    })),
  };
}

function buildSanitizedDiagnosticsSnapshot(
  diagnostics: ApiDiagnosticsSnapshot | undefined,
  redactionPolicy: SupportBundleRedactionPolicy,
): Record<string, unknown> {
  if (!diagnostics) {
    return {
      available: false,
      redaction: redactionPolicy.diagnostics,
    };
  }

  const summary = {
    available: true,
    redaction: redactionPolicy.diagnostics,
    totals: diagnostics.totals,
    bySeverity: diagnostics.bySeverity,
    topCodes: takeTopEntries(diagnostics.byCode, 20),
    documentCount: diagnostics.documents.length,
    projectCount: diagnostics.projects.length,
  };

  if (redactionPolicy.diagnostics === 'summary-only') {
    return summary;
  }

  return {
    ...summary,
    topDocuments: diagnostics.documents.slice(0, 20).map((documentNode) => ({
      uri: redactLocation(documentNode.uri, redactionPolicy.paths),
      total: documentNode.total,
      bySeverity: documentNode.bySeverity,
      projectLabel: documentNode.projectLabel,
      objectLabel: documentNode.objectLabel,
      sourceOrigin: documentNode.sourceOrigin,
      snapshotIdentity: documentNode.snapshotIdentity
        ? redactLocation(documentNode.snapshotIdentity, redactionPolicy.paths)
        : undefined,
    })),
    projects: diagnostics.projects.slice(0, 10).map((projectNode) => ({
      label: projectNode.label,
      total: projectNode.total,
      bySeverity: projectNode.bySeverity,
      objectCount: projectNode.objects.length,
    })),
  };
}

function sanitizeServerStats(stats: ApiServerStats, redactionPolicy: SupportBundleRedactionPolicy): Record<string, unknown> {
  return sanitizeUnknown(stats, ['serverStats'], redactionPolicy) as Record<string, unknown>;
}

function sanitizeUnknown(value: unknown, keyChain: readonly string[], redactionPolicy: SupportBundleRedactionPolicy): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item, keyChain, redactionPolicy));
  }

  if (typeof value === 'string') {
    const lastKey = keyChain[keyChain.length - 1]?.toLowerCase() ?? '';
    if (redactionPolicy.snippets === 'summary-only' && /(preview|snippet|excerpt)/.test(lastKey)) {
      return 'redacted-snippet';
    }

    return shouldRedactString(keyChain, value)
      ? redactLocation(value, redactionPolicy.paths)
      : value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
    key,
    sanitizeUnknown(nestedValue, [...keyChain, key], redactionPolicy),
  ]);
  return Object.fromEntries(sanitizedEntries);
}

function shouldRedactString(keyChain: readonly string[], value: string): boolean {
  const lastKey = keyChain[keyChain.length - 1]?.toLowerCase() ?? '';
  if (/(uri|path|file|root|directory|storage|checkpoint|journal|workspacekey|executable|script|ledger|backup)/.test(lastKey)) {
    return true;
  }

  return looksLikeLocation(value);
}

function looksLikeLocation(value: string): boolean {
  if (/^file:\/\//i.test(value)) {
    return true;
  }

  if (/^[a-zA-Z]:[\\/]/.test(value)) {
    return true;
  }

  return /[\\/].+\.[a-z0-9]{1,8}$/i.test(value);
}

function redactLocation(value: string, redaction: SupportBundleRedactionLevel = 'sanitized'): string {
  if (!value) {
    return value;
  }

  if (redaction === 'summary-only') {
    return 'redacted';
  }

  const basename = basenameFromPathOrUri(value);
  return basename ? `redacted:${basename}` : 'redacted';
}

function summarizeValueType(value: unknown): string {
  if (Array.isArray(value)) {
    return 'array';
  }

  if (value === null) {
    return 'null';
  }

  return typeof value;
}

function combineRedactionLevels(...levels: ApiObservabilityRedaction[]): ApiObservabilityRedaction {
  if (levels.includes('summary-only')) {
    return 'summary-only';
  }
  if (levels.includes('sanitized')) {
    return 'sanitized';
  }
  return 'none';
}

function basenameFromPathOrUri(value: string): string | undefined {
  const normalized = value
    .split(/[?#]/, 1)[0]
    .replace(/^file:\/+/i, '')
    .replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1];
}

function takeTopEntries(record: Record<string, number> | undefined, limit: number): Array<{ key: string; count: number }> {
  if (!record) {
    return [];
  }

  return Object.entries(record)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([key, count]) => ({ key, count }));
}

function buildReadme(manifest: SupportBundleManifest): string {
  const lines = [
    '# Offline support bundle',
    '',
    'Este bundle captura estado tecnico y diagnostico del runtime para soporte offline sin incluir codigo bruto del workspace por defecto.',
    '',
    '## Resumen',
    '',
    `- Workspace: ${manifest.workspace.label}`,
    ...(manifest.workspace.mode ? [`- Mode: ${manifest.workspace.mode}`] : []),
    ...(manifest.workspace.activeWorkspaceRelativePath ? [`- Active document: ${manifest.workspace.activeWorkspaceRelativePath}`] : []),
    ...(manifest.summary.readinessState ? [`- Readiness: ${manifest.summary.readinessState}`] : []),
    ...(manifest.summary.healthStatus ? [`- Runtime health: ${manifest.summary.healthStatus}`] : []),
    ...(manifest.summary.buildHealthState ? [`- Build health: ${manifest.summary.buildHealthState}`] : []),
    `- Runtime journal events exportados: ${manifest.summary.runtimeJournalEvents}`,
    `- Redaction profile: ${manifest.summary.redactionProfile}`,
    `- Redaction policy: paths=${manifest.summary.redactionPolicy.paths} · snippets=${manifest.summary.redactionPolicy.snippets} · diagnostics=${manifest.summary.redactionPolicy.diagnostics} · settings=${manifest.summary.redactionPolicy.settings} · manifest=${manifest.summary.redactionPolicy.manifest}`,
    `- API version: ${manifest.summary.publicApiVersion}`,
    `- Read-only tools: ${manifest.summary.readOnlyToolCount}`,
    `- Raw source included: ${manifest.summary.rawSourceIncluded}`,
    '',
    '## Redaccion aplicada',
    '',
    `- rutas, URIs, ejecutables y artefactos locales se exportan como ${manifest.summary.redactionPolicy.paths === 'summary-only' ? 'redacted' : 'redacted:basename'};`,
    `- snippets y previews sensibles se exportan como ${manifest.summary.redactionPolicy.snippets === 'summary-only' ? 'redacted-snippet' : 'texto saneado'};`,
    `- diagnostics, settings y manifest usan la policy ${manifest.summary.redactionProfile} (${manifest.summary.redactionPolicy.diagnostics}/${manifest.summary.redactionPolicy.settings}/${manifest.summary.redactionPolicy.manifest}).`,
    '',
    '## Artefactos',
    '',
    ...manifest.files.map((file) => `- ${file.relativePath}: ${file.description}`),
    '',
    '## Uso recomendado',
    '',
    '1. Revisar runtime-health.json y performance-summary.json para detectar presion, degradacion o backpressure.',
    '2. Revisar diagnostics-snapshot.sanitized.json y semantic-workspace-manifest.reduced.json para entender el estado semantico visible.',
    '3. Revisar build-orca-snapshot.json y runtime-journal-tail.json si el problema afecta build, ORCA o persistencia.',
    '4. Revisar workspace-cleanup-advisor.json antes de limpiar caches, staging u otros artefactos locales del workspace.',
    '5. Adjuntar public-contract.json y read-only-tool-bridge.json si soporte necesita reproducir consumo API/tooling.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function ensureNonEmptyPosixPath(value: string): string {
  const normalized = value.replace(/\\/g, '/');
  return normalized.length > 0 ? normalized : '.';
}