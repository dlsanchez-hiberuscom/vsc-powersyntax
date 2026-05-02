import { getBasename } from '../system/uriUtils';
import type { IFileSystem } from '../system/fileSystem';
import type { RuntimeJournal } from '../runtime/runtimeJournal';
import type { WorkspaceState } from '../workspace/workspaceState';
import type {
  OrcaCompileResult,
  OrcaCompileResultMessage,
  OrcaImportPreflightIssue,
  OrcaImportPreflightResult,
  OrcaOperationLedger,
  OrcaOperationLedgerEntry,
  OrcaRunResult,
  OrcaRunSnapshot,
  OrcaStagingImportRequest,
  OrcaStagingImportResult,
  OrcaWriteOperation,
  OrcaWriteRequest,
  OrcaWriteResult,
} from '../../shared/orcaProtocol';
import {
  captureFileFingerprint,
  captureTextFingerprint,
  EXPORT_ROOT_SEGMENTS,
  joinUri,
  readOrcaStagingExportState,
  SCRIPTS_SEGMENT,
  STATE_SEGMENT,
} from './orcaStagingExport';

const IMPORT_SCRIPT_FILE = 'import-from-staging.orc';
const REGENERATE_SCRIPT_FILE = 'regenerate-from-staging.orc';
const REBUILD_SCRIPT_FILE = 'rebuild-from-staging.orc';
const IMPORT_LEDGER_FILE = 'last-import-ledger.json';
const REGENERATE_LEDGER_FILE = 'last-regenerate-ledger.json';
const REBUILD_LEDGER_FILE = 'last-rebuild-ledger.json';
const BACKUPS_SEGMENT = 'backups';

export async function runOrcaStagingImport(
  request: OrcaStagingImportRequest,
  options: {
    workspaceFolders: string[];
    workspaceState: WorkspaceState;
    fs: IFileSystem;
    runOrca: (request: { executablePath: string; scriptUri: string; timeoutMs?: number }) => Promise<OrcaRunResult>;
    journal?: RuntimeJournal;
    now?: () => number;
  },
): Promise<OrcaStagingImportResult> {
  return runOrcaWriteOperation({
    ...request,
    operation: 'import-compile',
  }, options);
}

export async function runOrcaWriteOperation(
  request: OrcaWriteRequest,
  options: {
    workspaceFolders: string[];
    workspaceState: WorkspaceState;
    fs: IFileSystem;
    runOrca: (request: { executablePath: string; scriptUri: string; timeoutMs?: number }) => Promise<OrcaRunResult>;
    journal?: RuntimeJournal;
    now?: () => number;
  },
): Promise<OrcaWriteResult> {
  const sessionLibrary = request.sessionLibrary.trim();
  if (!sessionLibrary) {
    throw new Error('Configura la DLL ORCA de sesión antes de importar desde staging.');
  }

  const now = options.now ?? Date.now;
  const checkedAt = now();
  const operationId = buildOperationId(request.operation, checkedAt);
  const operationFiles = resolveOperationFiles(request.operation);
  const operationLabel = describeOperation(request.operation);
  let compileResult: OrcaCompileResult = {
    status: 'not-run',
    summary: `${operationLabel} ORCA no ejecutado.`,
    errors: 0,
    warnings: 0,
    messages: [],
  };

  let exportState;
  try {
    exportState = await readOrcaStagingExportState({
      workspaceFolders: options.workspaceFolders,
      fs: options.fs,
      focusUri: request.focusUri,
    });
  } catch (error) {
    const preflight = createPreflightResult(checkedAt, [{
      code: 'missing-export-state',
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
    }]);
    const workspaceFolderUri = options.workspaceFolders[0] ?? '';
    const ledgerUri = workspaceFolderUri
      ? joinUri(workspaceFolderUri, ...EXPORT_ROOT_SEGMENTS, STATE_SEGMENT, operationFiles.ledgerFile)
      : '';
    const ledger = buildLedger({
      operation: request.operation,
      operationId,
      timestamp: checkedAt,
      workspaceFolderUri,
      stateUri: '',
      sessionLibrary,
      preflight,
      compileResult,
      importedLibraries: [],
      selectedProject: undefined,
      backupRootUri: undefined,
      scriptUri: undefined,
    });
    if (ledgerUri) {
      await options.fs.createDirectory(joinUri(workspaceFolderUri, ...EXPORT_ROOT_SEGMENTS, STATE_SEGMENT));
      await options.fs.writeFile(ledgerUri, JSON.stringify(ledger, null, 2));
    }
    options.journal?.record({
      phase: 'legacy',
      kind: journalKindFor(request.operation),
      action: 'blocked',
      severity: 'warning',
      detail: {
        operationId,
        reason: preflight.issues[0]?.message,
      },
    });

    return {
      snapshot: { state: 'idle', detail: `${operationLabel} ORCA bloqueado por ausencia de staging exportado.` },
      output: '',
      blocked: true,
      operation: request.operation,
      operationId,
      workspaceFolderUri,
      stateUri: '',
      ledgerUri,
      sessionLibrary,
      preflight,
      compileResult,
      importedLibraries: [],
    };
  }

  const workspaceFolderUri = exportState.workspaceFolderUri;
  const scriptsRootUri = joinUri(workspaceFolderUri, ...EXPORT_ROOT_SEGMENTS, SCRIPTS_SEGMENT);
  const stateRootUri = joinUri(workspaceFolderUri, ...EXPORT_ROOT_SEGMENTS, STATE_SEGMENT);
  const ledgerUri = joinUri(stateRootUri, operationFiles.ledgerFile);
  const backupRootUri = joinUri(workspaceFolderUri, ...EXPORT_ROOT_SEGMENTS, BACKUPS_SEGMENT, operationId);
  const scriptUri = joinUri(scriptsRootUri, operationFiles.scriptFile);

  await options.fs.createDirectory(scriptsRootUri);
  await options.fs.createDirectory(stateRootUri);

  const preflightData = await collectPreflightIssues(options.fs, exportState, {
    operation: request.operation,
  });
  const preflight = createPreflightResult(checkedAt, preflightData.issues);

  if (!preflight.ok) {
    const ledger = buildLedger({
      operation: request.operation,
      operationId,
      timestamp: checkedAt,
      workspaceFolderUri,
      stateUri: exportState.stateUri,
      sessionLibrary,
      preflight,
      compileResult,
      importedLibraries: preflightData.libraries,
      selectedProject: exportState.selectedProject,
      backupRootUri: undefined,
      scriptUri: undefined,
    });
    await options.fs.writeFile(ledgerUri, JSON.stringify(ledger, null, 2));
    options.journal?.record({
      phase: 'legacy',
      kind: journalKindFor(request.operation),
      action: 'blocked',
      severity: 'warning',
      detail: {
        operationId,
        issues: preflight.issues,
        ledgerUri,
      },
    });

    return {
      snapshot: { state: 'idle', detail: `${operationLabel} ORCA bloqueado por preflight.` },
      output: '',
      blocked: true,
      operation: request.operation,
      operationId,
      workspaceFolderUri,
      stateUri: exportState.stateUri,
      ledgerUri,
      sessionLibrary,
      preflight,
      compileResult,
      importedLibraries: preflightData.libraries,
      ...(exportState.selectedProject ? { selectedProject: exportState.selectedProject } : {}),
    };
  }

  await options.fs.createDirectory(backupRootUri);
  const importedLibraries = await backupLibraries(options.fs, preflightData.libraries, backupRootUri);
  await options.fs.writeFile(
    scriptUri,
    buildOrcaOperationScript(
      request.operation,
      sessionLibrary,
      importedLibraries,
      operationId,
      exportState.stateUri,
      exportState.selectedProject,
    ),
  );

  options.journal?.record({
    phase: 'legacy',
    kind: journalKindFor(request.operation),
    action: 'prepared',
    severity: 'info',
    detail: {
      operationId,
      scriptUri,
      backupRootUri,
      libraries: importedLibraries.map((entry) => entry.libraryUri),
    },
  });

  let runResult: OrcaRunResult;
  try {
    runResult = await options.runOrca({
      executablePath: request.executablePath,
      scriptUri,
      timeoutMs: request.timeoutMs,
    });
  } catch (error) {
    runResult = {
      snapshot: {
        state: 'failed',
        scriptUri,
        executablePath: request.executablePath,
        detail: error instanceof Error ? error.message : String(error),
      },
      output: '',
    };
  }

  compileResult = parseOrcaCompileResult(runResult.output, runResult.snapshot, request.operation);
  const finalizedLibraries = await finalizeImportedLibraries(options.fs, importedLibraries);
  const ledger = buildLedger({
    operation: request.operation,
    operationId,
    timestamp: checkedAt,
    workspaceFolderUri,
    stateUri: exportState.stateUri,
    sessionLibrary,
    preflight,
    compileResult,
    importedLibraries: finalizedLibraries,
    selectedProject: exportState.selectedProject,
    backupRootUri,
    scriptUri,
  });
  await options.fs.writeFile(ledgerUri, JSON.stringify(ledger, null, 2));

  options.journal?.record({
    phase: 'legacy',
    kind: journalKindFor(request.operation),
    action: compileResult.status === 'failed' || runResult.snapshot.state === 'failed' ? 'failed' : 'completed',
    severity: compileResult.status === 'failed' || runResult.snapshot.state === 'failed' ? 'warning' : 'info',
    detail: {
      operationId,
      ledgerUri,
      compileResult: {
        status: compileResult.status,
        errors: compileResult.errors,
        warnings: compileResult.warnings,
      },
    },
  });

  return {
    snapshot: runResult.snapshot,
    output: runResult.output,
    blocked: false,
    operation: request.operation,
    operationId,
    workspaceFolderUri,
    stateUri: exportState.stateUri,
    scriptUri,
    ledgerUri,
    sessionLibrary,
    preflight,
    compileResult,
    backupRootUri,
    importedLibraries: finalizedLibraries,
    ...(exportState.selectedProject ? { selectedProject: exportState.selectedProject } : {}),
  };
}

function buildOperationId(operation: OrcaWriteOperation, timestamp: number): string {
  return `orca-${operation}-${timestamp}`;
}

async function collectPreflightIssues(
  fs: IFileSystem,
  exportState: Awaited<ReturnType<typeof readOrcaStagingExportState>>,
  options: { operation: OrcaWriteOperation },
): Promise<{ issues: OrcaImportPreflightIssue[]; libraries: OrcaOperationLedgerEntry[] }> {
  const issues: OrcaImportPreflightIssue[] = [];
  const libraries: OrcaOperationLedgerEntry[] = [];

  if (options.operation === 'rebuild' && (!exportState.selectedProject || exportState.selectedProject.kind === 'library')) {
    issues.push({
      code: 'missing-rebuild-target',
      severity: 'error',
      message: 'No hay un target o project legacy persistido para ejecutar rebuild. Reexporta desde un archivo del proyecto legacy adecuado.',
    });
  }

  for (const entry of exportState.exportedLibraries) {
    const libraryStat = await fs.stat(entry.libraryUri);
    if (!libraryStat) {
      issues.push({
        code: 'missing-library',
        severity: 'error',
        libraryUri: entry.libraryUri,
        message: `No existe la librería legacy ${entry.libraryUri}.`,
      });
      libraries.push({
        libraryUri: entry.libraryUri,
        stagingDirectoryUri: entry.stagingDirectoryUri,
      });
      continue;
    }

    if (!libraryStat.isFile) {
      issues.push({
        code: 'library-not-file',
        severity: 'error',
        libraryUri: entry.libraryUri,
        message: `La ruta ${entry.libraryUri} no apunta a una PBL binaria escribible.`,
      });
    }

    const currentFingerprint = await captureFileFingerprint(fs, entry.libraryUri);
    if (!entry.libraryFingerprint) {
      issues.push({
        code: 'missing-export-fingerprint',
        severity: 'error',
        libraryUri: entry.libraryUri,
        message: `Falta el fingerprint exportado para ${entry.libraryUri}. Reexporta el staging antes de importar.`,
      });
    } else if (currentFingerprint?.fingerprint !== entry.libraryFingerprint.fingerprint) {
      issues.push({
        code: 'fingerprint-mismatch',
        severity: 'error',
        libraryUri: entry.libraryUri,
        message: `PB-PBL-002: import bloqueado porque ${entry.libraryUri} cambió desde el último export ORCA.`,
      });
    }

    const stagingStat = await fs.stat(entry.stagingDirectoryUri);
    if (options.operation === 'import-compile') {
      if (!stagingStat?.isDirectory) {
        issues.push({
          code: 'missing-staging',
          severity: 'error',
          libraryUri: entry.libraryUri,
          message: `No existe el staging ${entry.stagingDirectoryUri} para ${entry.libraryUri}.`,
        });
      } else if (await countFilesRecursively(fs, entry.stagingDirectoryUri) === 0) {
        issues.push({
          code: 'staging-empty',
          severity: 'error',
          libraryUri: entry.libraryUri,
          message: `El staging ${entry.stagingDirectoryUri} está vacío; no hay source para importar.`,
        });
      } else {
        await validateTrackedRealSources(fs, entry, issues);
      }
    }

    libraries.push({
      libraryUri: entry.libraryUri,
      stagingDirectoryUri: entry.stagingDirectoryUri,
      ...(currentFingerprint ? { pblFingerprintBefore: currentFingerprint } : {}),
    });
  }

  if (libraries.length === 0) {
    issues.push({
      code: 'invalid-export-state',
      severity: 'error',
      message: 'El export ORCA persistido no contiene librerías para importar.',
    });
  }

  return { issues, libraries };
}

async function countFilesRecursively(fs: IFileSystem, rootUri: string): Promise<number> {
  let files = 0;
  const pending = [rootUri];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) {
      continue;
    }

    for (const [name, stat] of await fs.readDirectory(current)) {
      const childUri = joinUri(current, name);
      if (stat.isDirectory) {
        pending.push(childUri);
        continue;
      }
      if (stat.isFile) {
        files++;
      }
    }
  }

  return files;
}

async function backupLibraries(
  fs: IFileSystem,
  libraries: OrcaOperationLedgerEntry[],
  backupRootUri: string,
): Promise<OrcaOperationLedgerEntry[]> {
  const backedUpLibraries: OrcaOperationLedgerEntry[] = [];

  for (const entry of libraries) {
    const backupUri = joinUri(backupRootUri, getBasename(entry.libraryUri) || 'legacy.pbl');
    await fs.copyFile(entry.libraryUri, backupUri);
    backedUpLibraries.push({
      ...entry,
      backupUri,
    });
  }

  return backedUpLibraries;
}

async function finalizeImportedLibraries(
  fs: IFileSystem,
  libraries: OrcaOperationLedgerEntry[],
): Promise<OrcaOperationLedgerEntry[]> {
  const finalized: OrcaOperationLedgerEntry[] = [];

  for (const entry of libraries) {
    const currentFingerprint = await captureFileFingerprint(fs, entry.libraryUri);
    finalized.push({
      ...entry,
      ...(currentFingerprint ? { pblFingerprintAfter: currentFingerprint } : {}),
    });
  }

  return finalized;
}

function buildOrcaOperationScript(
  operation: OrcaWriteOperation,
  sessionLibrary: string,
  libraries: OrcaOperationLedgerEntry[],
  operationId: string,
  stateUri: string,
  selectedProject?: OrcaWriteResult['selectedProject'],
): string {
  const lines = [
    '# generated by VSC PowerSyntax',
    `# operation ${operationId}`,
    `# export-state ${stateUri}`,
    `session begin ${formatOrcaParameter(sessionLibrary)}`,
    ...buildOperationCommands(operation, libraries, selectedProject),
    'session end',
    '',
  ];

  return lines.join('\r\n');
}

function buildOperationCommands(
  operation: OrcaWriteOperation,
  libraries: OrcaOperationLedgerEntry[],
  selectedProject?: OrcaWriteResult['selectedProject'],
): string[] {
  if (operation === 'rebuild') {
    const rebuildTarget = selectedProject?.projectUri ?? libraries[0]?.libraryUri ?? '';
    return [`rebuild ${formatOrcaParameter(toOrcaPath(rebuildTarget))}`];
  }

  return libraries.map((entry) => {
    const libraryPath = toOrcaPath(entry.libraryUri);
    if (operation === 'regenerate') {
      return `regenerate ${formatOrcaParameter(libraryPath)}`;
    }

    const stagingDirectory = toOrcaPath(entry.stagingDirectoryUri);
    return `import ${formatOrcaParameter(libraryPath)}, , , ${formatOrcaParameter(stagingDirectory)}`;
  });
}

function parseOrcaCompileResult(output: string, snapshot: OrcaRunSnapshot, operation: OrcaWriteOperation): OrcaCompileResult {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const messages: OrcaCompileResultMessage[] = [];

  for (const line of lines) {
    const severity = /\berror\b/i.test(line)
      ? 'error'
      : /\bwarning\b/i.test(line)
        ? 'warning'
        : /\bcompile\b|\bimport\b|\bregenerate\b|\brebuild\b/i.test(line)
          ? 'info'
          : undefined;
    if (!severity) {
      continue;
    }
    messages.push({ severity, text: line });
  }

  const errors = messages.filter((message) => message.severity === 'error').length;
  const warnings = messages.filter((message) => message.severity === 'warning').length;
  const failed = snapshot.state === 'failed'
    || snapshot.state === 'timed-out'
    || errors > 0;
  const status = failed ? 'failed' : snapshot.state === 'idle' ? 'not-run' : 'succeeded';
  const operationLabel = describeOperation(operation);

  return {
    status,
    summary: status === 'not-run'
      ? `${operationLabel} ORCA no ejecutado.`
      : status === 'failed'
        ? `${operationLabel} ORCA con incidencias: ${errors} error(es), ${warnings} warning(s).`
        : `${operationLabel} ORCA completado: ${warnings} warning(s), sin errores detectados.`,
    errors,
    warnings,
    messages,
  };
}

function buildLedger(input: {
  operation: OrcaWriteOperation;
  operationId: string;
  timestamp: number;
  workspaceFolderUri: string;
  stateUri: string;
  sessionLibrary: string;
  preflight: OrcaImportPreflightResult;
  compileResult: OrcaCompileResult;
  importedLibraries: OrcaOperationLedgerEntry[];
  selectedProject: OrcaWriteResult['selectedProject'];
  backupRootUri?: string;
  scriptUri?: string;
}): OrcaOperationLedger {
  const warnings = [
    ...input.preflight.issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
    ...input.compileResult.messages.filter((message) => message.severity === 'warning').map((message) => message.text),
  ];
  const errors = [
    ...input.preflight.issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message),
    ...input.compileResult.messages.filter((message) => message.severity === 'error').map((message) => message.text),
  ];

  return {
    operationId: input.operationId,
    timestamp: input.timestamp,
    workspaceFolderUri: input.workspaceFolderUri,
    target: input.operation,
    stateUri: input.stateUri,
    ...(input.scriptUri ? { scriptUri: input.scriptUri } : {}),
    sessionLibrary: input.sessionLibrary,
    preflightResult: input.preflight,
    compileResult: input.compileResult,
    rollbackAvailable: Boolean(input.backupRootUri),
    ...(input.backupRootUri ? { backupRootUri: input.backupRootUri } : {}),
    libraries: input.importedLibraries,
    warnings,
    errors,
    ...(input.selectedProject ? { selectedProject: input.selectedProject } : {}),
  };
}

function createPreflightResult(checkedAt: number, issues: OrcaImportPreflightIssue[]): OrcaImportPreflightResult {
  return {
    ok: !issues.some((issue) => issue.severity === 'error'),
    checkedAt,
    issues,
  };
}

function formatOrcaParameter(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  return /[\s,]/.test(trimmed)
    ? `"${trimmed.replace(/"/g, '""')}"`
    : trimmed;
}

function toOrcaPath(pathOrUri: string): string {
  return pathOrUri.includes('://')
    ? pathOrUri.replace(/^file:\/\//i, '').replace(/\//g, '\\')
    : pathOrUri.replace(/\//g, '\\');
}

function resolveOperationFiles(operation: OrcaWriteOperation): { scriptFile: string; ledgerFile: string } {
  switch (operation) {
    case 'regenerate':
      return { scriptFile: REGENERATE_SCRIPT_FILE, ledgerFile: REGENERATE_LEDGER_FILE };
    case 'rebuild':
      return { scriptFile: REBUILD_SCRIPT_FILE, ledgerFile: REBUILD_LEDGER_FILE };
    case 'import-compile':
      return { scriptFile: IMPORT_SCRIPT_FILE, ledgerFile: IMPORT_LEDGER_FILE };
  }
}

function describeOperation(operation: OrcaWriteOperation): string {
  switch (operation) {
    case 'regenerate':
      return 'Regenerate';
    case 'rebuild':
      return 'Rebuild';
    case 'import-compile':
      return 'Import';
  }
}

function journalKindFor(operation: OrcaWriteOperation): string {
  switch (operation) {
    case 'regenerate':
    case 'rebuild':
      return 'orca-build';
    case 'import-compile':
      return 'orca-import';
  }
}

async function validateTrackedRealSources(
  fs: IFileSystem,
  entry: Awaited<ReturnType<typeof readOrcaStagingExportState>>['exportedLibraries'][number],
  issues: OrcaImportPreflightIssue[],
): Promise<void> {
  const trackedSources = entry.trackedSources ?? [];
  if (trackedSources.length === 0) {
    return;
  }

  const stagedBasenames = await collectFileBasenamesRecursively(fs, entry.stagingDirectoryUri);
  for (const stagedBasename of stagedBasenames) {
    const candidates = trackedSources.filter((trackedSource) => trackedSource.basename.toLowerCase() === stagedBasename.toLowerCase());
    if (candidates.length > 1) {
      issues.push({
        code: 'source-conflict',
        severity: 'error',
        libraryUri: entry.libraryUri,
        message: `Conflicto de source real para ${stagedBasename}: hay múltiples candidatos vigentes en la librería ${entry.libraryUri}.`,
      });
      continue;
    }

    const trackedSource = candidates[0];
    if (!trackedSource) {
      continue;
    }

    const currentFingerprint = await captureTextFingerprint(fs, trackedSource.uri);
    if (!currentFingerprint || currentFingerprint.fingerprint !== trackedSource.fingerprint.fingerprint) {
      issues.push({
        code: 'stale-staging',
        severity: 'error',
        libraryUri: entry.libraryUri,
        message: `PB-PBL-001: el staging para ${stagedBasename} quedó desactualizado porque el source real ${trackedSource.uri} cambió desde el export.`,
      });
    }
  }
}

async function collectFileBasenamesRecursively(fs: IFileSystem, rootUri: string): Promise<string[]> {
  const basenames = new Set<string>();
  const pending = [rootUri];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) {
      continue;
    }

    for (const [name, stat] of await fs.readDirectory(current)) {
      const childUri = joinUri(current, name);
      if (stat.isDirectory) {
        pending.push(childUri);
        continue;
      }
      if (stat.isFile) {
        basenames.add(name);
      }
    }
  }

  return [...basenames].sort();
}