import { spawn, type SpawnOptions } from 'child_process';
import * as path from 'path';

import {
  clonePbAutoBuildRunResult,
  clonePbAutoBuildRunSnapshot,
  type PbAutoBuildRunResult,
  type PbAutoBuildRunSnapshot,
  type PbAutoBuildRunState
} from '../../shared/pbAutoBuildProtocol';
import { createCancellationSource } from '../runtime/cancellation';
import type { RuntimeJournal } from '../runtime/runtimeJournal';
import { normalizeUri, uriToFsPath } from '../system/uriUtils';
import type { PbAutoBuildBuildFileInfo } from '../workspace/pbAutoBuildBuildFiles';

const EXPECTED_PBAUTOBUILD_BINARY = 'pbautobuild250.exe';
const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_CAPTURED_OUTPUT_CHARS = 16_000;
const MAX_OUTPUT_EXCERPT_CHARS = 400;

export type PbAutoBuildSelectionReasonCode =
  | 'missing-usable-build-file'
  | 'ambiguous-usable-build-file'
  | 'requested-build-file-not-found'
  | 'requested-build-file-not-usable';

export interface PbAutoBuildSelectionResult {
  buildFile?: PbAutoBuildBuildFileInfo;
  reasonCode?: PbAutoBuildSelectionReasonCode;
  detail?: string;
}

export interface PbAutoBuildRunnerRequest {
  executablePath: string;
  buildFile: PbAutoBuildBuildFileInfo;
  timeoutMs?: number;
}

export interface PbAutoBuildProcessLike {
  stdout?: {
    on(event: 'data', listener: (chunk: Buffer | string) => void): unknown;
  } | null;
  stderr?: {
    on(event: 'data', listener: (chunk: Buffer | string) => void): unknown;
  } | null;
  kill(signal?: NodeJS.Signals | number): boolean;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'close', listener: (code: number | null, signal: NodeJS.Signals | null) => void): this;
}

export type PbAutoBuildSpawnProcess = (
  executablePath: string,
  args: string[],
  options: SpawnOptions
) => PbAutoBuildProcessLike;

interface ActivePbAutoBuildRun {
  process: PbAutoBuildProcessLike;
  startedAt: number;
  buildFile: PbAutoBuildBuildFileInfo;
  executablePath: string;
  cancelReason: 'manual' | 'timeout' | null;
  cancellation: ReturnType<typeof createCancellationSource>;
  resolve: (result: PbAutoBuildRunResult) => void;
  reject: (error: unknown) => void;
}

export interface PbAutoBuildRunnerOptions {
  spawnProcess?: PbAutoBuildSpawnProcess;
  now?: () => number;
  setTimer?: (callback: () => void, timeoutMs: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (handle: ReturnType<typeof setTimeout>) => void;
  journal?: RuntimeJournal;
}

export function buildPbAutoBuildArgs(buildFilePath: string): string[] {
  return ['/f', buildFilePath];
}

export function selectPbAutoBuildBuildFile(
  buildFiles: readonly PbAutoBuildBuildFileInfo[],
  activeProjectUri?: string | null,
  requestedBuildFileUri?: string | null
): PbAutoBuildSelectionResult {
  const usable = buildFiles.filter((buildFile) => buildFile.status === 'usable');
  const requestedUri = requestedBuildFileUri ? normalizeUri(requestedBuildFileUri) : null;

  if (requestedUri) {
    const requested = buildFiles.find((buildFile) => normalizeUri(buildFile.uri) === requestedUri);
    if (!requested) {
      return {
        reasonCode: 'requested-build-file-not-found',
        detail: `El build file solicitado no existe en el catálogo actual: ${requestedBuildFileUri}`
      };
    }
    if (requested.status !== 'usable') {
      return {
        reasonCode: 'requested-build-file-not-usable',
        detail: requested.detail ?? `El build file solicitado no es utilizable (${requested.status}).`
      };
    }
    return { buildFile: requested };
  }

  const normalizedActiveProjectUri = activeProjectUri ? normalizeUri(activeProjectUri) : null;
  if (normalizedActiveProjectUri) {
    const matchingProject = usable.filter(
      (buildFile) => buildFile.representedProjectUri && normalizeUri(buildFile.representedProjectUri) === normalizedActiveProjectUri
    );
    if (matchingProject.length === 1) {
      return { buildFile: matchingProject[0] };
    }
  }

  if (usable.length === 1) {
    return { buildFile: usable[0] };
  }

  if (usable.length === 0) {
    return {
      reasonCode: 'missing-usable-build-file',
      detail: 'No hay build files PBAutoBuild utilizables en el workspace actual.'
    };
  }

  return {
    reasonCode: 'ambiguous-usable-build-file',
    detail: `Hay múltiples build files utilizables (${usable.length}) y no se puede elegir uno único de forma segura.`
  };
}

export class PbAutoBuildRunner {
  private readonly spawnProcess: PbAutoBuildSpawnProcess;
  private readonly now: () => number;
  private readonly setTimer: (callback: () => void, timeoutMs: number) => ReturnType<typeof setTimeout>;
  private readonly clearTimer: (handle: ReturnType<typeof setTimeout>) => void;
  private readonly journal?: RuntimeJournal;
  private activeRun: ActivePbAutoBuildRun | null = null;
  private snapshot: PbAutoBuildRunSnapshot = { state: 'idle' };

  constructor(options: PbAutoBuildRunnerOptions = {}) {
    this.spawnProcess = options.spawnProcess ?? defaultSpawnProcess;
    this.now = options.now ?? Date.now;
    this.setTimer = options.setTimer ?? setTimeout;
    this.clearTimer = options.clearTimer ?? clearTimeout;
    this.journal = options.journal;
  }

  getSnapshot(): PbAutoBuildRunSnapshot {
    return clonePbAutoBuildRunSnapshot(this.snapshot);
  }

  isRunning(): boolean {
    return this.activeRun !== null;
  }

  async run(request: PbAutoBuildRunnerRequest): Promise<PbAutoBuildRunResult> {
    if (this.activeRun) {
      throw new Error('Ya hay una ejecución de PBAutoBuild en curso. Cancélala antes de iniciar otra.');
    }

    validateExecutablePath(request.executablePath);

    const buildFilePath = uriToFsPath(request.buildFile.uri);
    if (!buildFilePath) {
      throw new Error(`No se pudo convertir el build file a ruta local: ${request.buildFile.uri}`);
    }

    const startedAt = this.now();
    const args = buildPbAutoBuildArgs(buildFilePath);
    const cwd = path.dirname(buildFilePath);
    const cancellation = createCancellationSource();
    const timeoutMs = normalizeTimeout(request.timeoutMs);

    let process: PbAutoBuildProcessLike;
    try {
      process = this.spawnProcess(request.executablePath, args, {
        cwd,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
    } catch (error) {
      const snapshot = this.finishWithoutActiveRun({
        state: 'failed',
        request,
        startedAt,
        finishedAt: this.now(),
        exitCode: null,
        detail: `No se pudo lanzar PBAutoBuild: ${error instanceof Error ? error.message : String(error)}`,
        output: ''
      });
      return clonePbAutoBuildRunResult(snapshot);
    }

    const runningSnapshot: PbAutoBuildRunSnapshot = {
      state: 'running',
      buildFileUri: request.buildFile.uri,
      ...(request.buildFile.representedProjectUri ? { representedProjectUri: request.buildFile.representedProjectUri } : {}),
      executablePath: request.executablePath,
      startedAt,
      detail: `Ejecutando ${path.basename(buildFilePath)}.`
    };
    this.snapshot = runningSnapshot;
    this.recordJournal('started', 'info', runningSnapshot, { args });

    let stdout = '';
    let stderr = '';
    let settled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const result = new Promise<PbAutoBuildRunResult>((resolve, reject) => {
      this.activeRun = {
        process,
        startedAt,
        buildFile: request.buildFile,
        executablePath: request.executablePath,
        cancelReason: null,
        cancellation,
        resolve,
        reject
      };
    });

    const settle = (state: PbAutoBuildRunState, exitCode: number | null, detail: string): void => {
      if (settled) {
        return;
      }
      settled = true;
      if (timeoutHandle) {
        this.clearTimer(timeoutHandle);
        timeoutHandle = undefined;
      }

      const finishedAt = this.now();
      const output = combineCapturedOutput(stdout, stderr);
      const finalSnapshot: PbAutoBuildRunSnapshot = {
        state,
        buildFileUri: request.buildFile.uri,
        ...(request.buildFile.representedProjectUri ? { representedProjectUri: request.buildFile.representedProjectUri } : {}),
        executablePath: request.executablePath,
        startedAt,
        finishedAt,
        durationMs: Math.max(0, finishedAt - startedAt),
        exitCode,
        detail,
        ...(buildOutputExcerpt(output) ? { outputExcerpt: buildOutputExcerpt(output) } : {})
      };

      this.snapshot = finalSnapshot;
      this.recordJournal(state, state === 'failed' || state === 'timed-out' ? 'error' : 'info', finalSnapshot, undefined);

      const activeRun = this.activeRun;
      this.activeRun = null;
      activeRun?.cancellation.dispose();
      activeRun?.resolve({ snapshot: finalSnapshot, output });
    };

    process.stdout?.on('data', (chunk: Buffer | string) => {
      stdout = appendOutput(stdout, chunk, MAX_CAPTURED_OUTPUT_CHARS);
    });
    process.stderr?.on('data', (chunk: Buffer | string) => {
      stderr = appendOutput(stderr, chunk, MAX_CAPTURED_OUTPUT_CHARS);
    });
    process.on('error', (error) => {
      settle('failed', null, `PBAutoBuild falló al arrancar: ${error.message}`);
    });
    process.on('close', (code, signal) => {
      const activeRun = this.activeRun;
      if (activeRun?.cancelReason === 'timeout') {
        settle('timed-out', code, `PBAutoBuild agotó el timeout de ${timeoutMs}ms.`);
        return;
      }
      if (activeRun?.cancelReason === 'manual') {
        settle('cancelled', code, 'PBAutoBuild cancelado desde VS Code.');
        return;
      }
      if (code === 0) {
        settle('succeeded', code, `PBAutoBuild finalizó correctamente${signal ? ` (${signal})` : ''}.`);
        return;
      }
      settle('failed', code, `PBAutoBuild finalizó con código ${code ?? 'desconocido'}${signal ? ` (${signal})` : ''}.`);
    });

    cancellation.token.onCancelled(() => {
      process.kill();
    });

    timeoutHandle = this.setTimer(() => {
      if (!this.activeRun) {
        return;
      }
      this.activeRun.cancelReason = 'timeout';
      this.activeRun.cancellation.cancel();
    }, timeoutMs);

    return clonePbAutoBuildRunResult(await result);
  }

  cancel(): PbAutoBuildRunSnapshot | null {
    if (!this.activeRun) {
      return null;
    }
    this.activeRun.cancelReason = 'manual';
    this.recordJournal('cancel-requested', 'info', this.snapshot, undefined);
    this.activeRun.cancellation.cancel();
    return this.getSnapshot();
  }

  private finishWithoutActiveRun(options: {
    state: PbAutoBuildRunState;
    request: PbAutoBuildRunnerRequest;
    startedAt: number;
    finishedAt: number;
    exitCode: number | null;
    detail: string;
    output: string;
  }): PbAutoBuildRunResult {
    const snapshot: PbAutoBuildRunSnapshot = {
      state: options.state,
      buildFileUri: options.request.buildFile.uri,
      ...(options.request.buildFile.representedProjectUri ? { representedProjectUri: options.request.buildFile.representedProjectUri } : {}),
      executablePath: options.request.executablePath,
      startedAt: options.startedAt,
      finishedAt: options.finishedAt,
      durationMs: Math.max(0, options.finishedAt - options.startedAt),
      exitCode: options.exitCode,
      detail: options.detail,
      ...(buildOutputExcerpt(options.output) ? { outputExcerpt: buildOutputExcerpt(options.output) } : {})
    };
    this.snapshot = snapshot;
    this.recordJournal(options.state, 'error', snapshot, undefined);
    return { snapshot, output: options.output };
  }

  private recordJournal(
    action: string,
    severity: 'info' | 'warning' | 'error',
    snapshot: PbAutoBuildRunSnapshot,
    detail: unknown
  ): void {
    this.journal?.record({
      phase: 'build',
      kind: 'pbautobuild',
      action,
      severity,
      detail: {
        state: snapshot.state,
        buildFileUri: snapshot.buildFileUri,
        representedProjectUri: snapshot.representedProjectUri,
        executablePath: snapshot.executablePath,
        exitCode: snapshot.exitCode,
        durationMs: snapshot.durationMs,
        ...(detail !== undefined ? { extra: detail } : {})
      }
    });
  }
}

function defaultSpawnProcess(
  executablePath: string,
  args: string[],
  options: SpawnOptions
): PbAutoBuildProcessLike {
  return spawn(executablePath, args, options);
}

function validateExecutablePath(executablePath: string): void {
  if (!executablePath || path.basename(executablePath).toLowerCase() !== EXPECTED_PBAUTOBUILD_BINARY) {
    throw new Error(`La ruta no apunta a ${EXPECTED_PBAUTOBUILD_BINARY}: ${executablePath || 'vacía'}`);
  }
}

function normalizeTimeout(timeoutMs: number | undefined): number {
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return DEFAULT_TIMEOUT_MS;
  }
  return Math.max(1, Math.trunc(timeoutMs));
}

function appendOutput(current: string, chunk: Buffer | string, maxChars: number): string {
  const next = `${current}${typeof chunk === 'string' ? chunk : chunk.toString('utf8')}`;
  if (next.length <= maxChars) {
    return next;
  }
  return next.slice(next.length - maxChars);
}

function combineCapturedOutput(stdout: string, stderr: string): string {
  const sections: string[] = [];
  if (stdout.trim()) {
    sections.push('[stdout]', stdout.trimEnd());
  }
  if (stderr.trim()) {
    sections.push('[stderr]', stderr.trimEnd());
  }
  return sections.join('\n');
}

function buildOutputExcerpt(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.length <= MAX_OUTPUT_EXCERPT_CHARS) {
    return trimmed;
  }
  return trimmed.slice(trimmed.length - MAX_OUTPUT_EXCERPT_CHARS);
}