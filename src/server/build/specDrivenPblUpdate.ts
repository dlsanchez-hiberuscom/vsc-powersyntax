import { TextDocument } from 'vscode-languageserver-textdocument';

import type {
  ApiSafeEditPlan,
  ApiSpecDrivenPblUpdateBatchRequest,
  ApiSpecDrivenPblUpdateBatchResult,
  ApiSpecDrivenPblUpdateRequest,
  ApiSpecDrivenPblUpdateResult,
} from '../../shared/publicApi';
import type {
  OrcaRunResult,
  OrcaStagingExportResult,
} from '../../shared/orcaProtocol';
import { buildSafeEditPlan } from '../features/safeEditPlan';
import { KnowledgeBase } from '../knowledge/KnowledgeBase';
import { InheritanceGraph } from '../knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../knowledge/system/SystemCatalog';
import type { RuntimeJournal } from '../runtime/runtimeJournal';
import type { IFileSystem } from '../system/fileSystem';
import { getBasename, normalizeUri } from '../system/uriUtils';
import type { WorkspaceState } from '../workspace/workspaceState';
import { joinUri, prepareOrcaStagingExport, readOrcaStagingExportState, type OrcaStagingExportState } from './orcaStagingExport';
import { runOrcaStagingImport } from './orcaStagingImport';

interface SpecDrivenPblUpdateOptions {
  workspaceFolders: string[];
  workspaceState: WorkspaceState;
  fs: IFileSystem;
  kb: KnowledgeBase;
  graph: InheritanceGraph;
  systemCatalog: SystemCatalog;
  runOrca: (request: { executablePath: string; scriptUri: string; timeoutMs?: number }) => Promise<OrcaRunResult>;
  loadSource: (uri: string) => Promise<string | null>;
  journal?: RuntimeJournal;
  buildPlan?: (document: TextDocument, request: ApiSpecDrivenPblUpdateRequest) => Promise<ApiSafeEditPlan>;
  journalUri?: string;
}

interface SpecDrivenPblUpdateBatchOptions extends SpecDrivenPblUpdateOptions {
  loadDocument: (uri: string) => Promise<TextDocument>;
  executeSingle?: (
    document: TextDocument,
    request: ApiSpecDrivenPblUpdateRequest,
    options: SpecDrivenPblUpdateOptions,
  ) => Promise<ApiSpecDrivenPblUpdateResult>;
}

export async function applySpecDrivenPblUpdate(
  document: TextDocument,
  request: ApiSpecDrivenPblUpdateRequest,
  options: SpecDrivenPblUpdateOptions,
): Promise<ApiSpecDrivenPblUpdateResult> {
  const focusUri = request.uri ?? document.uri;
  const normalizedRequest: ApiSpecDrivenPblUpdateRequest = {
    ...request,
    uri: focusUri,
  };

  const safeEditPlan = await (options.buildPlan
    ? options.buildPlan(document, normalizedRequest)
    : buildSafeEditPlan(
      document,
      normalizedRequest,
      options.kb,
      options.graph,
      options.systemCatalog,
      options.loadSource,
      { workspaceState: options.workspaceState },
    ));

  const validation = validateRequestedEdits(normalizedRequest, safeEditPlan);
  if (validation.blocked) {
    options.journal?.record({
      phase: 'legacy',
      kind: 'orca-spec-update',
      action: 'blocked',
      severity: 'warning',
      detail: {
        blockedReasons: validation.blockedReasons,
      },
    });
    return buildBlockedResult(safeEditPlan, validation.blockedReasons, options.journalUri, validation.reason);
  }

  const exportResult = await runFreshOrcaExport(normalizedRequest, options);
  if (exportResult.snapshot.state === 'failed' || exportResult.snapshot.state === 'timed-out' || exportResult.snapshot.state === 'cancelled') {
    return {
      ...buildBlockedResult(
        safeEditPlan,
        [exportResult.snapshot.detail ?? 'El export ORCA falló antes de aplicar el update PBL spec-driven.'],
        options.journalUri,
        exportResult.snapshot.detail ?? 'El export ORCA falló antes de aplicar el update PBL spec-driven.',
      ),
      exportResult,
    };
  }

  let exportState: OrcaStagingExportState;
  try {
    exportState = await readOrcaStagingExportState({
      workspaceFolders: options.workspaceFolders,
      fs: options.fs,
      focusUri,
    });
  } catch {
    return {
      ...buildBlockedResult(
        safeEditPlan,
        ['El estado del export ORCA no quedó disponible tras exportar el staging.'],
        options.journalUri,
        'El estado del export ORCA no quedó disponible tras exportar el staging.',
      ),
      exportResult,
    };
  }

  let appliedEdits: ApiSpecDrivenPblUpdateResult['appliedEdits'];
  try {
    appliedEdits = await applyEditsToStaging(exportState, normalizedRequest, options.fs);
  } catch (error) {
    return {
      ...buildBlockedResult(
        safeEditPlan,
        [error instanceof Error ? error.message : 'No se pudieron aplicar los edits al staging exportado.'],
        options.journalUri,
        error instanceof Error ? error.message : 'No se pudieron aplicar los edits al staging exportado.',
      ),
      exportResult,
    };
  }

  options.journal?.record({
    phase: 'legacy',
    kind: 'orca-spec-update',
    action: 'prepared',
    severity: 'info',
    detail: {
      edits: appliedEdits,
      stateUri: exportState.stateUri,
    },
  });

  const importResult = await runOrcaStagingImport({
    executablePath: normalizedRequest.executablePath,
    sessionLibrary: normalizedRequest.sessionLibrary,
    focusUri,
    timeoutMs: normalizedRequest.timeoutMs,
  }, {
    workspaceFolders: options.workspaceFolders,
    workspaceState: options.workspaceState,
    fs: options.fs,
    runOrca: options.runOrca,
    journal: options.journal,
  });

  const workflowBlocked = importResult.blocked || importResult.compileResult.status === 'failed';
  options.journal?.record({
    phase: 'legacy',
    kind: 'orca-spec-update',
    action: workflowBlocked ? 'blocked' : 'completed',
    severity: workflowBlocked ? 'warning' : 'info',
    detail: {
      operationId: importResult.operationId,
      ledgerUri: importResult.ledgerUri,
      appliedEdits,
    },
  });

  return {
    available: safeEditPlan.available,
    blocked: workflowBlocked,
    ...(workflowBlocked
      ? {
        reason: importResult.blocked
          ? importResult.preflight.issues[0]?.message ?? 'El import ORCA quedó bloqueado.'
          : importResult.compileResult.summary,
      }
      : {}),
    blockedReasons: importResult.blocked
      ? importResult.preflight.issues.map((issue) => issue.message)
      : importResult.compileResult.status === 'failed'
        ? [importResult.compileResult.summary]
        : [],
    safeEditPlan,
    appliedEdits,
    exportResult,
    importResult,
    ...(options.journalUri ? { journalUri: options.journalUri } : {}),
  };
}

export async function applySpecDrivenPblUpdateBatch(
  request: ApiSpecDrivenPblUpdateBatchRequest,
  options: SpecDrivenPblUpdateBatchOptions,
): Promise<ApiSpecDrivenPblUpdateBatchResult> {
  const requests = Array.isArray(request.requests) ? request.requests : [];
  if (requests.length === 0) {
    return {
      blocked: true,
      stoppedEarly: false,
      total: 0,
      succeeded: 0,
      blockedCount: 0,
      items: [],
      ...(options.journalUri ? { journalUri: options.journalUri } : {}),
    };
  }

  const stopOnError = request.stopOnError !== false;
  const executeSingle = options.executeSingle ?? applySpecDrivenPblUpdate;
  const items: ApiSpecDrivenPblUpdateBatchResult['items'] = [];
  let stoppedEarly = false;

  options.journal?.record({
    phase: 'legacy',
    kind: 'orca-spec-update-batch',
    action: 'started',
    severity: 'info',
    detail: {
      total: requests.length,
      stopOnError,
    },
  });

  for (let index = 0; index < requests.length; index++) {
    const item = requests[index];
    const normalizedLabel = typeof item?.label === 'string' && item.label.trim().length > 0
      ? item.label.trim()
      : undefined;
    const uri = typeof item?.uri === 'string' ? item.uri : undefined;
    if (!uri) {
      items.push({
        ...(normalizedLabel ? { label: normalizedLabel } : {}),
        blocked: true,
        reason: 'El item batch no define una URI válida.',
      });
      if (stopOnError) {
        stoppedEarly = index < requests.length - 1;
        break;
      }
      continue;
    }

    let document: TextDocument;
    try {
      document = await options.loadDocument(uri);
    } catch {
      items.push({
        ...(normalizedLabel ? { label: normalizedLabel } : {}),
        uri,
        blocked: true,
        reason: 'No se pudo cargar el documento solicitado para el item batch.',
      });
      if (stopOnError) {
        stoppedEarly = index < requests.length - 1;
        break;
      }
      continue;
    }

    const result = await executeSingle(document, item, options);
    const blocked = result.blocked || !result.available;
    items.push({
      ...(normalizedLabel ? { label: normalizedLabel } : {}),
      uri,
      blocked,
      ...(blocked ? { reason: result.reason ?? result.blockedReasons[0] ?? 'El item batch quedó bloqueado.' } : {}),
      result,
    });
    if (blocked && stopOnError) {
      stoppedEarly = index < requests.length - 1;
      break;
    }
  }

  const blockedCount = items.filter((item) => item.blocked).length;
  const succeeded = items.length - blockedCount;
  options.journal?.record({
    phase: 'legacy',
    kind: 'orca-spec-update-batch',
    action: blockedCount > 0 ? 'blocked' : 'completed',
    severity: blockedCount > 0 ? 'warning' : 'info',
    detail: {
      total: requests.length,
      processed: items.length,
      succeeded,
      blockedCount,
      stoppedEarly,
    },
  });

  return {
    blocked: blockedCount > 0,
    stoppedEarly,
    total: requests.length,
    succeeded,
    blockedCount,
    items,
    ...(options.journalUri ? { journalUri: options.journalUri } : {}),
  };
}

function buildBlockedResult(
  safeEditPlan: ApiSafeEditPlan,
  blockedReasons: string[],
  journalUri?: string,
  reason?: string,
): ApiSpecDrivenPblUpdateResult {
  return {
    available: safeEditPlan.available,
    blocked: true,
    ...(reason ? { reason } : {}),
    blockedReasons,
    safeEditPlan,
    appliedEdits: [],
    ...(journalUri ? { journalUri } : {}),
  };
}

async function runFreshOrcaExport(
  request: ApiSpecDrivenPblUpdateRequest,
  options: SpecDrivenPblUpdateOptions,
): Promise<OrcaStagingExportResult> {
  const prepared = await prepareOrcaStagingExport({
    executablePath: request.executablePath,
    sessionLibrary: request.sessionLibrary,
    focusUri: request.uri,
    timeoutMs: request.timeoutMs,
  }, {
    workspaceFolders: options.workspaceFolders,
    workspaceState: options.workspaceState,
    fs: options.fs,
  });

  const runResult = await options.runOrca({
    executablePath: request.executablePath,
    scriptUri: prepared.scriptUri,
    timeoutMs: request.timeoutMs,
  });

  return {
    snapshot: runResult.snapshot,
    output: runResult.output,
    stagingRootUri: prepared.stagingRootUri,
    scriptUri: prepared.scriptUri,
    stateUri: prepared.stateUri,
    exportedLibraries: prepared.exportedLibraries,
    sessionLibrary: prepared.sessionLibrary,
    ...(prepared.selectedProject ? { selectedProject: prepared.selectedProject } : {}),
  };
}

function validateRequestedEdits(
  request: ApiSpecDrivenPblUpdateRequest,
  safeEditPlan: ApiSafeEditPlan,
): { blocked: boolean; reason?: string; blockedReasons: string[] } {
  const blockedReasons = [...safeEditPlan.blockedReasons];
  if (!safeEditPlan.available) {
    blockedReasons.push(safeEditPlan.reason ?? 'No hay plan seguro disponible para aplicar el update PBL.');
  }
  if (safeEditPlan.blocked) {
    blockedReasons.push('El safe edit plan sigue bloqueado; no se puede aplicar el update PBL.');
  }
  if (!Array.isArray(request.edits) || request.edits.length === 0) {
    blockedReasons.push('No se recibieron edits explícitos para aplicar sobre el staging exportado.');
  }

  const allowedUris = new Set(safeEditPlan.files.map((file) => normalizeUri(file.uri)));
  allowedUris.add(normalizeUri(request.uri ?? ''));
  for (const edit of request.edits ?? []) {
    if (!edit || typeof edit.uri !== 'string' || typeof edit.content !== 'string') {
      blockedReasons.push('Todos los edits deben indicar uri y content válidos.');
      continue;
    }
    if (!allowedUris.has(normalizeUri(edit.uri))) {
      blockedReasons.push(`El edit ${edit.uri} queda fuera del safe edit plan actual.`);
    }
  }

  return {
    blocked: blockedReasons.length > 0,
    ...(blockedReasons.length > 0 ? { reason: blockedReasons[0] } : {}),
    blockedReasons,
  };
}

async function applyEditsToStaging(
  exportState: OrcaStagingExportState,
  request: ApiSpecDrivenPblUpdateRequest,
  fs: IFileSystem,
): Promise<ApiSpecDrivenPblUpdateResult['appliedEdits']> {
  const appliedEdits: ApiSpecDrivenPblUpdateResult['appliedEdits'] = [];

  for (const edit of request.edits) {
    const stagingUri = resolveStagingUriForEdit(exportState, edit.uri);
    if (!stagingUri) {
      throw new Error(`No se pudo resolver un archivo staged para ${edit.uri}.`);
    }

    const stagingStat = await fs.stat(stagingUri);
    if (!stagingStat?.isFile) {
      throw new Error(`El staging esperado no existe para ${edit.uri}: ${stagingUri}.`);
    }

    await fs.writeFile(stagingUri, edit.content);
    appliedEdits.push({
      sourceUri: edit.uri,
      stagingUri,
    });
  }

  return appliedEdits;
}

function resolveStagingUriForEdit(
  exportState: OrcaStagingExportState,
  sourceUri: string,
): string | undefined {
  const normalizedSourceUri = normalizeUri(sourceUri);

  for (const entry of exportState.exportedLibraries) {
    const stagingDirectoryUri = normalizeUri(entry.stagingDirectoryUri);
    if (normalizedSourceUri.startsWith(stagingDirectoryUri)) {
      return sourceUri;
    }

    const trackedSource = entry.trackedSources?.find((candidate) => normalizeUri(candidate.uri) === normalizedSourceUri);
    if (trackedSource) {
      return joinUri(entry.stagingDirectoryUri, trackedSource.basename || getBasename(sourceUri));
    }
  }

  return undefined;
}
