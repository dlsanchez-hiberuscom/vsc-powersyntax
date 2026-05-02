export type OrcaRunState = 'idle' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'timed-out';

export interface OrcaRunSnapshot {
  state: OrcaRunState;
  scriptUri?: string;
  executablePath?: string;
  startedAt?: number;
  finishedAt?: number;
  durationMs?: number;
  exitCode?: number | null;
  detail?: string;
  outputExcerpt?: string;
}

export interface OrcaRunRequest {
  executablePath: string;
  scriptUri: string;
  timeoutMs?: number;
}

export interface OrcaRunResult {
  snapshot: OrcaRunSnapshot;
  output: string;
}

export interface OrcaCancelResult {
  cancelled: boolean;
  snapshot: OrcaRunSnapshot;
}

export interface OrcaStagingLibraryExport {
  libraryUri: string;
  stagingDirectoryUri: string;
  folderName: string;
}

export interface OrcaStagingSelectedProject {
  projectUri: string;
  kind: 'target' | 'project' | 'library';
  name: string;
}

export interface OrcaStagingExportRequest {
  executablePath: string;
  sessionLibrary: string;
  focusUri?: string;
  timeoutMs?: number;
}

export interface OrcaStagingExportResult {
  snapshot: OrcaRunSnapshot;
  output: string;
  stagingRootUri: string;
  scriptUri: string;
  stateUri: string;
  exportedLibraries: OrcaStagingLibraryExport[];
  sessionLibrary: string;
  selectedProject?: OrcaStagingSelectedProject;
}

export interface OrcaFileFingerprint {
  strategy: 'stat-v1' | 'text-fnv1a32';
  size: number;
  mtime: number;
  fingerprint: string;
}

export interface OrcaImportPreflightIssue {
  code:
    | 'missing-export-state'
    | 'invalid-export-state'
    | 'missing-export-fingerprint'
    | 'missing-library'
    | 'library-not-file'
    | 'fingerprint-mismatch'
    | 'missing-staging'
    | 'staging-empty'
    | 'missing-rebuild-target'
    | 'stale-staging'
    | 'source-conflict';
  severity: 'error' | 'warning';
  message: string;
  libraryUri?: string;
}

export type OrcaWriteOperation = 'import-compile' | 'regenerate' | 'rebuild';

export interface OrcaImportPreflightResult {
  ok: boolean;
  checkedAt: number;
  issues: OrcaImportPreflightIssue[];
}

export interface OrcaCompileResultMessage {
  severity: 'error' | 'warning' | 'info';
  text: string;
  code?: string;
}

export interface OrcaCompileResult {
  status: 'not-run' | 'succeeded' | 'failed';
  summary: string;
  errors: number;
  warnings: number;
  messages: OrcaCompileResultMessage[];
}

export interface OrcaOperationLedgerEntry {
  libraryUri: string;
  stagingDirectoryUri: string;
  backupUri?: string;
  pblFingerprintBefore?: OrcaFileFingerprint;
  pblFingerprintAfter?: OrcaFileFingerprint;
}

export interface OrcaOperationLedger {
  operationId: string;
  timestamp: number;
  workspaceFolderUri: string;
  target: OrcaWriteOperation;
  stateUri: string;
  scriptUri?: string;
  sessionLibrary: string;
  preflightResult: OrcaImportPreflightResult;
  compileResult: OrcaCompileResult;
  rollbackAvailable: boolean;
  backupRootUri?: string;
  libraries: OrcaOperationLedgerEntry[];
  warnings: string[];
  errors: string[];
  selectedProject?: OrcaStagingSelectedProject;
}

export interface OrcaStagingImportRequest {
  executablePath: string;
  sessionLibrary: string;
  focusUri?: string;
  timeoutMs?: number;
}

export interface OrcaWriteRequest extends OrcaStagingImportRequest {
  operation: OrcaWriteOperation;
}

export interface OrcaStagingImportResult {
  snapshot: OrcaRunSnapshot;
  output: string;
  blocked: boolean;
  operationId: string;
  workspaceFolderUri: string;
  stateUri: string;
  scriptUri?: string;
  ledgerUri: string;
  sessionLibrary: string;
  preflight: OrcaImportPreflightResult;
  compileResult: OrcaCompileResult;
  backupRootUri?: string;
  importedLibraries: OrcaOperationLedgerEntry[];
  selectedProject?: OrcaStagingSelectedProject;
}

export interface OrcaWriteResult extends OrcaStagingImportResult {
  operation: OrcaWriteOperation;
}

export function cloneOrcaRunSnapshot(snapshot: OrcaRunSnapshot): OrcaRunSnapshot {
  return {
    state: snapshot.state,
    ...(snapshot.scriptUri ? { scriptUri: snapshot.scriptUri } : {}),
    ...(snapshot.executablePath ? { executablePath: snapshot.executablePath } : {}),
    ...(snapshot.startedAt !== undefined ? { startedAt: snapshot.startedAt } : {}),
    ...(snapshot.finishedAt !== undefined ? { finishedAt: snapshot.finishedAt } : {}),
    ...(snapshot.durationMs !== undefined ? { durationMs: snapshot.durationMs } : {}),
    ...(snapshot.exitCode !== undefined ? { exitCode: snapshot.exitCode } : {}),
    ...(snapshot.detail ? { detail: snapshot.detail } : {}),
    ...(snapshot.outputExcerpt ? { outputExcerpt: snapshot.outputExcerpt } : {}),
  };
}

export function cloneOrcaRunResult(result: OrcaRunResult): OrcaRunResult {
  return {
    snapshot: cloneOrcaRunSnapshot(result.snapshot),
    output: result.output,
  };
}

export function cloneOrcaStagingExportResult(result: OrcaStagingExportResult): OrcaStagingExportResult {
  return {
    snapshot: cloneOrcaRunSnapshot(result.snapshot),
    output: result.output,
    stagingRootUri: result.stagingRootUri,
    scriptUri: result.scriptUri,
    stateUri: result.stateUri,
    exportedLibraries: result.exportedLibraries.map((entry) => ({
      libraryUri: entry.libraryUri,
      stagingDirectoryUri: entry.stagingDirectoryUri,
      folderName: entry.folderName,
    })),
    sessionLibrary: result.sessionLibrary,
    ...(result.selectedProject
      ? {
        selectedProject: {
          projectUri: result.selectedProject.projectUri,
          kind: result.selectedProject.kind,
          name: result.selectedProject.name,
        }
      }
      : {}),
  };
}