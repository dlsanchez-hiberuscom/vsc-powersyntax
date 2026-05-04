import {
  getTaskExecutionContractCatalog,
  simulateTaskExecutionDryRun,
  type ApiImpactAnalysis,
  type ApiSafeEditPlan,
  type ApiSafeEditPlanFile,
  type ApiSpecDrivenPblUpdateBatchRequest,
  type ApiSpecDrivenPblUpdateBatchResult,
  type ApiSpecDrivenPblUpdateRequest,
  type ApiSpecDrivenPblUpdateResult,
  type ApiTaskExecutionContract,
  type ApiTaskExecutionContractId,
  type ApiTaskExecutionDryRunItemRequest,
  type ApiTaskExecutionDryRunReport,
  type ApiTaskExecutionDryRunReportItem,
  type ApiTaskExecutionDryRunRequest,
  type ApiTaskExecutionMetadata,
  type ApiTaskExecutionValidationReceipt,
  type ApiTaskExecutionValidationReceiptArtifact,
  type ApiTaskReplayBundleKind,
  type ApiTaskReplayBundleReport,
  type ApiTaskReplayBundleRequest,
  type ApiTaskReplaySuggestedCommand,
} from '../shared/publicApi';
import type { SemanticReproPackManifest } from './repro/semanticReproPack';
import type { SupportBundleManifest } from './support/supportBundle';

interface NormalizedTaskExecutionMetadata {
  validationCommands: string[];
  docsTouched: string[];
  specsAffected: string[];
  nextFocus?: string;
}

type ParsedReplayBundle =
  | {
    kind: 'semantic-repro-pack';
    manifest: SemanticReproPackManifest;
  }
  | {
    kind: 'support-bundle';
    manifest: SupportBundleManifest;
  };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeStringList(values: readonly string[] | undefined): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values ?? []) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

function subtractPaths(expected: readonly string[], touched: readonly string[]): string[] {
  const touchedSet = new Set(touched.map((value) => value.toLowerCase()));
  return expected.filter((value) => !touchedSet.has(value.toLowerCase()));
}

function dedupeSafeEditPlanFiles(files: readonly ApiSafeEditPlanFile[]): ApiSafeEditPlanFile[] {
  const byKey = new Map<string, ApiSafeEditPlanFile>();
  for (const file of files) {
    const key = [file.uri, file.reason, file.risk, file.sourceOrigin ?? ''].join('::').toLowerCase();
    if (!byKey.has(key)) {
      byKey.set(key, { ...file });
    }
  }
  return [...byKey.values()];
}

function normalizeTaskExecutionMetadata(
  metadata: ApiTaskExecutionMetadata | undefined,
): NormalizedTaskExecutionMetadata {
  return {
    validationCommands: normalizeStringList(metadata?.validationCommands),
    docsTouched: normalizeStringList(metadata?.docsTouched),
    specsAffected: normalizeStringList(metadata?.specsAffected),
    ...(metadata?.nextFocus?.trim() ? { nextFocus: metadata.nextFocus.trim() } : {}),
  };
}

function getTaskExecutionContract(contractId: ApiTaskExecutionContractId): ApiTaskExecutionContract {
  const contract = getTaskExecutionContractCatalog().contracts.find((candidate) => candidate.id === contractId);
  if (!contract) {
    throw new Error(`Contrato de task execution desconocido: ${contractId}`);
  }
  return contract;
}

function buildDryRunReportItem(input: {
  label?: string;
  uri?: string;
  safeEditPlan?: ApiSafeEditPlan;
  impactAnalysis?: ApiImpactAnalysis;
  reason?: string;
  blockedReasons?: string[];
}): ApiTaskExecutionDryRunReportItem {
  const safeEditPlan = input.safeEditPlan;
  const blockedReasons = normalizeStringList(input.blockedReasons ?? safeEditPlan?.blockedReasons ?? []);
  const reason = input.reason?.trim() || safeEditPlan?.reason;

  return {
    ...(input.label ? { label: input.label } : {}),
    ...(input.uri ? { uri: input.uri } : {}),
    available: safeEditPlan?.available ?? false,
    blocked: safeEditPlan?.blocked ?? true,
    ...(reason ? { reason } : {}),
    ...(safeEditPlan ? { safeEditPlan } : {}),
    ...(input.impactAnalysis ? { impactAnalysis: input.impactAnalysis } : {}),
    files: safeEditPlan ? [...safeEditPlan.files] : [],
    risks: normalizeStringList(safeEditPlan ? [...safeEditPlan.risks, ...(safeEditPlan.riskReasons ?? [])] : []),
    recommendedTests: normalizeStringList(safeEditPlan?.recommendedTests),
    docsToReview: normalizeStringList(safeEditPlan?.docsToReview),
    blockedReasons,
  };
}

export function buildTaskExecutionDryRunReport(input: {
  request: ApiTaskExecutionDryRunRequest;
  items: ApiTaskExecutionDryRunReportItem[];
  reason?: string;
}): ApiTaskExecutionDryRunReport {
  const contract = getTaskExecutionContract(input.request.contractId);
  const metadata = normalizeTaskExecutionMetadata(input.request);
  const requestCount = contract.id === 'spec-driven-pbl-update-batch'
    ? Math.max(1, input.request.requests?.length ?? input.items.length)
    : 1;
  const files = dedupeSafeEditPlanFiles(input.items.flatMap((item) => item.files));
  const risks = normalizeStringList(input.items.flatMap((item) => item.risks));
  const recommendedTests = normalizeStringList([
    ...metadata.validationCommands,
    ...input.items.flatMap((item) => item.recommendedTests),
  ]);
  const docsToReview = normalizeStringList([
    ...contract.docsAffected,
    ...input.items.flatMap((item) => item.docsToReview),
  ]);
  const docsPending = subtractPaths(contract.docsAffected, metadata.docsTouched);
  const blockedCount = input.items.filter((item) => item.blocked).length;
  const available = input.items.some((item) => item.available);

  return {
    schemaVersion: '1.0.0',
    contractId: contract.id,
    available,
    blocked: input.items.length === 0 || blockedCount > 0,
    ...(input.reason?.trim() ? { reason: input.reason.trim() } : {}),
    contract,
    simulation: simulateTaskExecutionDryRun(contract.id, { requestCount }),
    validationCommands: metadata.validationCommands,
    docsTouched: metadata.docsTouched,
    docsPending,
    specsAffected: metadata.specsAffected,
    ...(metadata.nextFocus ? { nextFocus: metadata.nextFocus } : {}),
    items: input.items.map((item) => ({
      ...item,
      files: item.files.map((file) => ({ ...file })),
      risks: [...item.risks],
      recommendedTests: [...item.recommendedTests],
      docsToReview: [...item.docsToReview],
      blockedReasons: [...item.blockedReasons],
    })),
    summary: {
      total: input.items.length,
      blockedCount,
      files,
      risks,
      recommendedTests,
      docsToReview,
    },
  };
}

function buildArtifact(name: string, status: ApiTaskExecutionValidationReceiptArtifact['status'], detail?: string, uri?: string): ApiTaskExecutionValidationReceiptArtifact {
  return {
    name,
    status,
    ...(uri ? { uri } : {}),
    ...(detail ? { detail } : {}),
  };
}

function buildSingleValidationArtifacts(
  contract: ApiTaskExecutionContract,
  result: ApiSpecDrivenPblUpdateResult,
): ApiTaskExecutionValidationReceiptArtifact[] {
  return contract.receipts.map((receipt) => {
    switch (receipt) {
      case 'journalUri':
        return buildArtifact('journalUri', result.journalUri ? 'present' : 'missing', undefined, result.journalUri);
      case 'importResult.ledgerUri':
        return buildArtifact(
          'importResult.ledgerUri',
          result.importResult?.ledgerUri ? 'present' : 'missing',
          result.importResult?.ledgerUri ? undefined : 'No se ha publicado ledgerUri para este resultado.',
          result.importResult?.ledgerUri,
        );
      case 'importResult.compileResult':
        return buildArtifact(
          'importResult.compileResult',
          result.importResult?.compileResult ? 'present' : 'missing',
          result.importResult?.compileResult
            ? `${result.importResult.compileResult.status}: ${result.importResult.compileResult.summary}`
            : 'No se ha publicado compileResult para este resultado.',
        );
      default:
        return buildArtifact(receipt, 'not-applicable');
    }
  });
}

export function buildTaskExecutionValidationReceipt(input: {
  contractId: Extract<ApiTaskExecutionContractId, 'spec-driven-pbl-update'>;
  request: ApiSpecDrivenPblUpdateRequest;
  result: ApiSpecDrivenPblUpdateResult;
}): ApiTaskExecutionValidationReceipt {
  const contract = getTaskExecutionContract(input.contractId);
  const metadata = normalizeTaskExecutionMetadata(input.request);
  const docsPending = subtractPaths(contract.docsAffected, metadata.docsTouched);
  const results = normalizeStringList([
    input.result.blocked
      ? `blocked: ${input.result.reason ?? input.result.blockedReasons[0] ?? 'resultado bloqueado'}`
      : `completed: ${input.result.appliedEdits.length} edit(s) aplicados`,
    ...input.result.blockedReasons.map((reason) => `blocked-reason: ${reason}`),
    ...(input.result.importResult?.compileResult
      ? [`compile: ${input.result.importResult.compileResult.status} - ${input.result.importResult.compileResult.summary}`]
      : []),
  ]);

  return {
    schemaVersion: '1.0.0',
    contractId: contract.id,
    method: contract.method,
    command: contract.command,
    status: input.result.blocked ? 'blocked' : 'completed',
    commands: normalizeStringList([contract.command, ...metadata.validationCommands]),
    results,
    docsAffected: [...contract.docsAffected],
    docsTouched: metadata.docsTouched,
    docsPending,
    specsAffected: metadata.specsAffected,
    risks: normalizeStringList([
      ...input.result.safeEditPlan.risks,
      ...(input.result.safeEditPlan.riskReasons ?? []),
      ...input.result.blockedReasons,
    ]),
    nextFocus: metadata.nextFocus ?? 'Revisar docs/current-focus.md si la tarea queda cerrada.',
    artifacts: buildSingleValidationArtifacts(contract, input.result),
  };
}

export function buildTaskExecutionBatchValidationReceipt(input: {
  request: ApiSpecDrivenPblUpdateBatchRequest;
  result: ApiSpecDrivenPblUpdateBatchResult;
}): ApiTaskExecutionValidationReceipt {
  const contract = getTaskExecutionContract('spec-driven-pbl-update-batch');
  const metadata = normalizeTaskExecutionMetadata(input.request);
  const itemReceipts = input.result.items.flatMap((item) => item.result?.validationReceipt ? [item.result.validationReceipt] : []);
  const docsTouched = normalizeStringList([
    ...metadata.docsTouched,
    ...itemReceipts.flatMap((receipt) => receipt.docsTouched),
  ]);
  const docsPending = subtractPaths(contract.docsAffected, docsTouched);
  const specsAffected = normalizeStringList([
    ...metadata.specsAffected,
    ...itemReceipts.flatMap((receipt) => receipt.specsAffected),
  ]);
  const ledgerReceipts = input.result.items
    .map((item) => item.result?.importResult?.ledgerUri)
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  const processedItems = input.result.items.length;
  const artifactStatus: ApiTaskExecutionValidationReceiptArtifact['status'] = processedItems === 0
    ? 'not-applicable'
    : ledgerReceipts.length === processedItems
      ? 'present'
      : 'missing';

  return {
    schemaVersion: '1.0.0',
    contractId: contract.id,
    method: contract.method,
    command: contract.command,
    status: input.result.blocked ? 'blocked' : 'completed',
    commands: normalizeStringList([
      contract.command,
      ...metadata.validationCommands,
      ...itemReceipts.flatMap((receipt) => receipt.commands),
    ]),
    results: normalizeStringList([
      `processed: ${processedItems}/${input.result.total}`,
      `blocked: ${input.result.blockedCount}`,
      ...(input.result.stoppedEarly ? ['stopped-early: true'] : []),
      ...itemReceipts.flatMap((receipt) => receipt.results),
    ]),
    docsAffected: [...contract.docsAffected],
    docsTouched,
    docsPending,
    specsAffected,
    risks: normalizeStringList([
      ...itemReceipts.flatMap((receipt) => receipt.risks),
    ]),
    nextFocus: metadata.nextFocus ?? itemReceipts.find((receipt) => receipt.nextFocus)?.nextFocus ?? 'Revisar docs/current-focus.md si el batch cierra trabajo activo.',
    artifacts: [
      buildArtifact('journalUri', input.result.journalUri ? 'present' : 'missing', undefined, input.result.journalUri),
      buildArtifact(
        'items[].reason',
        input.result.blockedCount > 0 ? 'present' : 'not-applicable',
        `${input.result.blockedCount} item(s) bloqueados sobre ${processedItems} procesados.`,
      ),
      buildArtifact(
        'items[].result.importResult.ledgerUri',
        artifactStatus,
        `${ledgerReceipts.length} ledger(s) presentes sobre ${processedItems} item(s) procesados.`,
      ),
    ],
  };
}

function parseReplayManifest(request: ApiTaskReplayBundleRequest): { parsed?: ParsedReplayBundle; reason?: string } {
  let manifest = request.manifest;

  if (typeof request.manifestJson === 'string' && request.manifestJson.trim().length > 0) {
    try {
      manifest = JSON.parse(request.manifestJson);
    } catch (error) {
      return {
        reason: error instanceof Error ? error.message : 'No se pudo parsear manifestJson.',
      };
    }
  }

  if (!isRecord(manifest)) {
    return {
      reason: 'El replay requiere manifest o manifestJson con un objeto JSON válido.',
    };
  }

  const explicitKind = request.bundleKind && request.bundleKind !== 'auto' ? request.bundleKind : undefined;
  const detectedKind: Exclude<ApiTaskReplayBundleKind, 'auto'> | undefined = typeof manifest.reproWorkspaceRelativePath === 'string'
    ? 'semantic-repro-pack'
    : typeof manifest.supportBundleWorkspaceRelativePath === 'string'
      ? 'support-bundle'
      : undefined;

  if (explicitKind && detectedKind && explicitKind !== detectedKind) {
    return {
      reason: `bundleKind=${explicitKind} no coincide con el manifest detectado (${detectedKind}).`,
    };
  }

  const kind = explicitKind ?? detectedKind;
  if (!kind) {
    return {
      reason: 'No se pudo detectar si el manifest corresponde a un semantic repro pack o a un support bundle.',
    };
  }

  return kind === 'semantic-repro-pack'
    ? { parsed: { kind, manifest: manifest as unknown as SemanticReproPackManifest } }
    : { parsed: { kind, manifest: manifest as unknown as SupportBundleManifest } };
}

function buildReplayCommand(title: string, detail: string, commandId?: string, targetRelativePath?: string): ApiTaskReplaySuggestedCommand {
  return {
    title,
    detail,
    ...(commandId ? { commandId } : {}),
    ...(targetRelativePath ? { targetRelativePath } : {}),
  };
}

function filterSuggestedFiles(candidates: readonly string[], availableFiles: readonly string[]): string[] {
  if (availableFiles.length === 0) {
    return normalizeStringList([...candidates]);
  }

  const available = new Set(availableFiles.map((file) => file.toLowerCase()));
  return normalizeStringList(candidates.filter((candidate) => available.has(candidate.toLowerCase())));
}

function buildSemanticReplayReport(
  manifest: SemanticReproPackManifest,
  request: ApiTaskReplayBundleRequest,
): ApiTaskReplayBundleReport {
  const availableFiles = normalizeStringList(Object.keys(request.files ?? {}));
  const referencedFiles = filterSuggestedFiles([
    'README.md',
    'manifest.json',
    'current-object-context.json',
    'impact-analysis.json',
    'safe-edit-plan.json',
    'semantic-workspace-manifest.json',
    'server-stats.json',
    'editor-diagnostics.json',
    ...manifest.capturedFiles.slice(0, 4).map((file) => file.exportedRelativePath),
  ], availableFiles);

  return {
    schemaVersion: '1.0.0',
    available: true,
    bundleKind: 'semantic-repro-pack',
    ...(request.sourceUri ? { sourceUri: request.sourceUri } : {}),
    focus: {
      uri: manifest.focus.uri,
      ...(manifest.focus.workspaceRelativePath ? { workspaceRelativePath: manifest.focus.workspaceRelativePath } : {}),
      ...(manifest.focus.objectName ? { objectName: manifest.focus.objectName } : {}),
      ...(manifest.focus.symbolName ? { symbolName: manifest.focus.symbolName } : {}),
      ...(manifest.focus.sourceOrigin ? { sourceOrigin: manifest.focus.sourceOrigin } : {}),
    },
    minimalContext: normalizeStringList([
      `focus-uri: ${manifest.focus.uri}`,
      ...(manifest.focus.workspaceRelativePath ? [`focus-path: ${manifest.focus.workspaceRelativePath}`] : []),
      ...(manifest.focus.objectName ? [`focus-object: ${manifest.focus.objectName}`] : []),
      ...(manifest.focus.symbolName ? [`focus-symbol: ${manifest.focus.symbolName}`] : []),
      `current-object-available: ${String(manifest.evidence.currentObjectAvailable)}`,
      `impact-available: ${String(manifest.evidence.impactAvailable)}`,
      `safe-edit-plan-available: ${String(manifest.evidence.safeEditPlanAvailable)}`,
      ...(manifest.evidence.readinessState ? [`readiness: ${manifest.evidence.readinessState}`] : []),
      ...(manifest.evidence.healthStatus ? [`health: ${manifest.evidence.healthStatus}`] : []),
      `captured-files: ${manifest.capturedFiles.length}`,
      `missing-files: ${manifest.missingFiles.length}`,
    ]),
    referencedFiles,
    suggestedCommands: [
      buildReplayCommand('Abrir README del repro pack', 'Usar la guía incluida como punto de entrada del replay.', undefined, 'README.md'),
      buildReplayCommand('Revisar Current Object Context', 'Confirmar foco, ancestros, bindings y diagnostics capturados.', undefined, 'current-object-context.json'),
      buildReplayCommand('Revisar Impact Analysis', 'Verificar alcance probable antes de reproducir el problema.', undefined, 'impact-analysis.json'),
      buildReplayCommand('Revisar Safe Edit Plan', 'Usar el preflight exportado como gate antes de cualquier write path.', undefined, 'safe-edit-plan.json'),
      buildReplayCommand('Recalcular safe edit plan en repo vivo', 'Cuando el repo esté disponible, volver a ejecutar el dry-run contractual sobre la URI foco.', 'powerbuilder.safeEditPlan'),
      buildReplayCommand('Abrir object-check en repo vivo', 'Confirmar que el estado actual del objeto no ha derivado respecto al bundle.', 'powerbuilder.checkCurrentObject'),
    ],
    ...(manifest.evidence.safeEditPlanAvailable ? { recommendedContractId: 'spec-driven-pbl-update' } : {}),
  };
}

function buildSupportReplayReport(
  manifest: SupportBundleManifest,
  request: ApiTaskReplayBundleRequest,
): ApiTaskReplayBundleReport {
  const manifestFiles = normalizeStringList(manifest.files.map((file) => file.relativePath));
  const referencedFiles = filterSuggestedFiles([
    'README.md',
    'manifest.json',
    'runtime-health.json',
    'diagnostics-snapshot.sanitized.json',
    'current-object-context.sanitized.json',
    'public-contract.json',
    'read-only-tool-bridge.json',
  ], manifestFiles);

  return {
    schemaVersion: '1.0.0',
    available: true,
    bundleKind: 'support-bundle',
    ...(request.sourceUri ? { sourceUri: request.sourceUri } : {}),
    focus: {
      ...(manifest.workspace.activeUri ? { uri: manifest.workspace.activeUri } : {}),
      ...(manifest.workspace.activeWorkspaceRelativePath ? { workspaceRelativePath: manifest.workspace.activeWorkspaceRelativePath } : {}),
    },
    minimalContext: normalizeStringList([
      `workspace-label: ${manifest.workspace.label}`,
      ...(manifest.workspace.mode ? [`workspace-mode: ${manifest.workspace.mode}`] : []),
      ...(manifest.summary.readinessState ? [`readiness: ${manifest.summary.readinessState}`] : []),
      ...(manifest.summary.healthStatus ? [`health: ${manifest.summary.healthStatus}`] : []),
      ...(manifest.summary.buildHealthState ? [`build-health: ${manifest.summary.buildHealthState}`] : []),
      `diagnostics-available: ${String(manifest.summary.diagnosticsAvailable)}`,
      `runtime-journal-events: ${manifest.summary.runtimeJournalEvents}`,
      `redaction-profile: ${manifest.summary.redactionProfile}`,
    ]),
    referencedFiles,
    suggestedCommands: [
      buildReplayCommand('Abrir README del support bundle', 'Usar la guía del bundle para entender alcance, redacción y pasos sugeridos.', undefined, 'README.md'),
      buildReplayCommand('Revisar runtime health', 'Confirmar si el problema es de runtime, cache, build u observabilidad.', undefined, 'runtime-health.json'),
      buildReplayCommand('Revisar snapshot de diagnostics', 'Usar el estado exportado de diagnostics antes de pedir repro adicional.', undefined, 'diagnostics-snapshot.sanitized.json'),
      buildReplayCommand('Revisar current object context saneado', 'Si existe, usarlo para reconstruir el foco mínimo del incidente.', undefined, 'current-object-context.sanitized.json'),
      buildReplayCommand('Revisar contrato público exportado', 'Confirmar qué methods/tools estaban disponibles cuando se generó el support bundle.', undefined, 'public-contract.json'),
      buildReplayCommand('Ejecutar workspace-check en repo vivo', 'Si el repo vuelve a estar disponible, contrastar el estado actual con el bundle exportado.', 'powerbuilder.checkWorkspace'),
    ],
  };
}

export function buildTaskReplayBundleReport(request: ApiTaskReplayBundleRequest): ApiTaskReplayBundleReport {
  const parsed = parseReplayManifest(request);
  if (!parsed.parsed) {
    return {
      schemaVersion: '1.0.0',
      available: false,
      reason: parsed.reason ?? 'No se pudo interpretar el bundle.',
      ...(request.sourceUri ? { sourceUri: request.sourceUri } : {}),
      focus: {},
      minimalContext: [],
      referencedFiles: [],
      suggestedCommands: [],
    };
  }

  return parsed.parsed.kind === 'semantic-repro-pack'
    ? buildSemanticReplayReport(parsed.parsed.manifest, request)
    : buildSupportReplayReport(parsed.parsed.manifest, request);
}

export { buildDryRunReportItem };