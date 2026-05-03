import * as path from 'path';

import type {
  ApiDiagnosticsSnapshot,
  ApiPublicContractDescriptor,
  ApiReadOnlyToolBridgeDescriptor,
  ApiSemanticWorkspaceManifest,
  ApiServerStats,
} from '../../shared/publicApi';
import type { PowerSyntaxSettingsGovernanceReport } from '../settingsGovernance';

export interface SupportBundleInput {
  workspaceRootPath: string;
  bundleRootPath: string;
  workspaceLabel: string;
  activeUri?: string;
  activeWorkspaceRelativePath?: string;
  workspaceManifest: ApiSemanticWorkspaceManifest;
  serverStats: ApiServerStats;
  publicContract: ApiPublicContractDescriptor;
  readOnlyToolBridge: ApiReadOnlyToolBridgeDescriptor;
  settingsGovernance: PowerSyntaxSettingsGovernanceReport;
  settingsValues: Record<string, unknown>;
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
  };
  files: Array<{
    relativePath: string;
    description: string;
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

const DEFAULT_MAX_RUNTIME_JOURNAL_EVENTS = 40;

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
  const serverStats = sanitizeServerStats(input.serverStats);
  const diagnosticsSnapshot = buildSanitizedDiagnosticsSnapshot(input.serverStats.diagnostics);
  const reducedManifest = buildReducedManifest(input.workspaceManifest);
  const runtimeJournalTail = buildRuntimeJournalTail(input.serverStats, input.maxJournalEvents);
  const performanceSummary = buildPerformanceSummary(input.serverStats);
  const buildOrcaSnapshot = buildBuildOrcaSnapshot(input.serverStats);
  const settingsSnapshot = buildSanitizedSettings(input.settingsValues, input.settingsGovernance);
  const apiInventory = buildApiInventory(input.publicContract, input.readOnlyToolBridge);

  const files: SupportBundleFile[] = [
    {
      relativePath: 'runtime-health.json',
      content: `${JSON.stringify(input.serverStats.health ?? null, null, 2)}\n`,
    },
    {
      relativePath: 'server-stats.sanitized.json',
      content: `${JSON.stringify(serverStats, null, 2)}\n`,
    },
    {
      relativePath: 'diagnostics-snapshot.sanitized.json',
      content: `${JSON.stringify(diagnosticsSnapshot, null, 2)}\n`,
    },
    {
      relativePath: 'semantic-workspace-manifest.reduced.json',
      content: `${JSON.stringify(reducedManifest, null, 2)}\n`,
    },
    {
      relativePath: 'runtime-journal-tail.json',
      content: `${JSON.stringify(runtimeJournalTail, null, 2)}\n`,
    },
    {
      relativePath: 'performance-summary.json',
      content: `${JSON.stringify(performanceSummary, null, 2)}\n`,
    },
    {
      relativePath: 'settings-governance.json',
      content: `${JSON.stringify(input.settingsGovernance, null, 2)}\n`,
    },
    {
      relativePath: 'settings-sanitized.json',
      content: `${JSON.stringify(settingsSnapshot, null, 2)}\n`,
    },
    {
      relativePath: 'build-orca-snapshot.json',
      content: `${JSON.stringify(buildOrcaSnapshot, null, 2)}\n`,
    },
    {
      relativePath: 'public-contract.json',
      content: `${JSON.stringify(input.publicContract, null, 2)}\n`,
    },
    {
      relativePath: 'read-only-tool-bridge.json',
      content: `${JSON.stringify(input.readOnlyToolBridge, null, 2)}\n`,
    },
    {
      relativePath: 'api-inventory.json',
      content: `${JSON.stringify(apiInventory, null, 2)}\n`,
    },
  ];

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
    },
    files: [
      { relativePath: 'runtime-health.json', description: 'Salud agregada del runtime y findings visibles.' },
      { relativePath: 'server-stats.sanitized.json', description: 'Snapshot saneado de stats del runtime.' },
      { relativePath: 'diagnostics-snapshot.sanitized.json', description: 'Snapshot agregada de diagnósticos con rutas saneadas.' },
      { relativePath: 'semantic-workspace-manifest.reduced.json', description: 'Manifest semántico reducido sin inventario completo de URIs.' },
      { relativePath: 'runtime-journal-tail.json', description: 'Cola reciente del journal técnico del runtime.' },
      { relativePath: 'performance-summary.json', description: 'Resumen de memoria, caches, query trace e indexación.' },
      { relativePath: 'settings-governance.json', description: 'Reporte de gobernanza y divergencias del perfil actual.' },
      { relativePath: 'settings-sanitized.json', description: 'Settings exportados con redacción de rutas y secretos locales.' },
      { relativePath: 'build-orca-snapshot.json', description: 'Estado saneado de build moderno, ORCA legacy y journal asociado.' },
      { relativePath: 'public-contract.json', description: 'Contrato público exportado por la extensión.' },
      { relativePath: 'read-only-tool-bridge.json', description: 'Descriptor del bridge read-only y schemas visibles.' },
      { relativePath: 'api-inventory.json', description: 'Inventario resumido de métodos y tools read-only.' },
      { relativePath: 'README.md', description: 'Guía de reproducción y uso del support bundle.' },
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

function buildReducedManifest(manifest: ApiSemanticWorkspaceManifest): Record<string, unknown> {
  const objectKinds = manifest.objects.reduce<Record<string, number>>((accumulator, objectInfo) => {
    const key = objectInfo.objectKind ?? 'unknown';
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    schemaVersion: manifest.schemaVersion,
    generatedAt: manifest.generatedAt,
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
    events: selectedEvents.map((event) => sanitizeUnknown(event, ['runtimeJournal', event.kind, event.action])),
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

function buildBuildOrcaSnapshot(stats: ApiServerStats): Record<string, unknown> {
  return {
    buildTooling: sanitizeUnknown(stats.buildTooling, ['buildTooling']),
    buildFiles: stats.buildFiles,
    buildProfile: sanitizeUnknown(stats.buildProfile, ['buildProfile']),
    buildRunner: sanitizeUnknown(stats.buildRunner, ['buildRunner']),
    buildProblems: stats.buildProblems,
    buildHealth: stats.buildHealth,
    orcaTooling: sanitizeUnknown(stats.orcaTooling, ['orcaTooling']),
    orcaRunner: sanitizeUnknown(stats.orcaRunner, ['orcaRunner']),
    persistence: sanitizeUnknown({
      buildOrcaJournalUri: stats.persistence?.buildOrcaJournalUri,
      journalUri: stats.persistence?.journalUri,
      checkpointUri: stats.persistence?.checkpointUri,
    }, ['persistence']),
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
): Record<string, unknown> {
  const keys = Object.keys(settingsValues).sort();
  return {
    selectedProfile: governance.selectedProfile,
    managedSettings: keys.map((key) => ({
      key,
      value: sanitizeUnknown(settingsValues[key], [key]),
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
): Record<string, unknown> {
  if (!diagnostics) {
    return {
      available: false,
    };
  }

  return {
    available: true,
    totals: diagnostics.totals,
    bySeverity: diagnostics.bySeverity,
    topCodes: takeTopEntries(diagnostics.byCode, 20),
    topDocuments: diagnostics.documents.slice(0, 20).map((documentNode) => ({
      uri: redactLocation(documentNode.uri),
      total: documentNode.total,
      bySeverity: documentNode.bySeverity,
      projectLabel: documentNode.projectLabel,
      objectLabel: documentNode.objectLabel,
      sourceOrigin: documentNode.sourceOrigin,
      snapshotIdentity: documentNode.snapshotIdentity
        ? redactLocation(documentNode.snapshotIdentity)
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

function sanitizeServerStats(stats: ApiServerStats): Record<string, unknown> {
  return sanitizeUnknown(stats, ['serverStats']) as Record<string, unknown>;
}

function sanitizeUnknown(value: unknown, keyChain: readonly string[]): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeUnknown(item, keyChain));
  }

  if (typeof value === 'string') {
    return shouldRedactString(keyChain, value)
      ? redactLocation(value)
      : value;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const sanitizedEntries = Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
    key,
    sanitizeUnknown(nestedValue, [...keyChain, key]),
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

function redactLocation(value: string): string {
  if (!value) {
    return value;
  }

  const basename = basenameFromPathOrUri(value);
  return basename ? `redacted:${basename}` : 'redacted';
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
    `- API version: ${manifest.summary.publicApiVersion}`,
    `- Read-only tools: ${manifest.summary.readOnlyToolCount}`,
    `- Raw source included: ${manifest.summary.rawSourceIncluded}`,
    '',
    '## Redaccion aplicada',
    '',
    '- rutas, URIs, ejecutables y artefactos locales se exportan redacted:basename;',
    '- settings se exportan en forma saneada y con gobernanza del perfil activo;',
    '- el manifest semantico se reduce a resumenes y no incluye el inventario completo de objetos/URIs.',
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
    '4. Adjuntar public-contract.json y read-only-tool-bridge.json si soporte necesita reproducir consumo API/tooling.',
    '',
  ];

  return `${lines.join('\n')}\n`;
}

function ensureNonEmptyPosixPath(value: string): string {
  const normalized = value.replace(/\\/g, '/');
  return normalized.length > 0 ? normalized : '.';
}