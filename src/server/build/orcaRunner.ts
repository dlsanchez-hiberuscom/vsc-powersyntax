import { spawn, type SpawnOptions } from 'child_process';
import * as path from 'path';

import {
  cloneOrcaRunResult,
  cloneOrcaRunSnapshot,
  type OrcaRunResult,
  type OrcaRunSnapshot,
  type OrcaRunState,
} from '../../shared/orcaProtocol';
import { createCancellationSource } from '../runtime/cancellation';
import type { RuntimeJournal } from '../runtime/runtimeJournal';
import { uriToFsPath } from '../system/uriUtils';

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_CAPTURED_OUTPUT_CHARS = 16_000;
const MAX_OUTPUT_EXCERPT_CHARS = 400;

export interface OrcaRunnerRequest {
  executablePath: string;
  scriptUri: string;
  timeoutMs?: number;
}

export interface OrcaProcessLike {
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

export type OrcaSpawnProcess = (
  executablePath: string,
  args: string[],
  options: SpawnOptions
) => OrcaProcessLike;

interface ActiveOrcaRun {
  process: OrcaProcessLike;
  startedAt: number;
  scriptUri: string;
  executablePath: string;
  cancelReason: 'manual' | 'timeout' | null;
  cancellation: ReturnType<typeof createCancellationSource>;
  resolve: (result: OrcaRunResult) => void;
}

export interface OrcaRunnerOptions {
  spawnProcess?: OrcaSpawnProcess;
  now?: () => number;
  setTimer?: (callback: () => void, timeoutMs: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (handle: ReturnType<typeof setTimeout>) => void;
  journal?: RuntimeJournal;
}

export function buildOrcaArgs(scriptPath: string): string[] {
  return [scriptPath];
}

export class OrcaRunner {
  private readonly spawnProcess: OrcaSpawnProcess;
  private readonly now: () => number;
  private readonly setTimer: (callback: () => void, timeoutMs: number) => ReturnType<typeof setTimeout>;
  private readonly clearTimer: (handle: ReturnType<typeof setTimeout>) => void;
  private readonly journal?: RuntimeJournal;
  private activeRun: ActiveOrcaRun | null = null;
  private snapshot: OrcaRunSnapshot = { state: 'idle' };

  constructor(options: OrcaRunnerOptions = {}) {
    this.spawnProcess = options.spawnProcess ?? defaultSpawnProcess;
    this.now = options.now ?? Date.now;
    this.setTimer = options.setTimer ?? setTimeout;
    this.clearTimer = options.clearTimer ?? clearTimeout;
    this.journal = options.journal;
  }

  getSnapshot(): OrcaRunSnapshot {
    return cloneOrcaRunSnapshot(this.snapshot);
  }

  isRunning(): boolean {
    return this.activeRun !== null;
  }

  async run(request: OrcaRunnerRequest): Promise<OrcaRunResult> {
    if (this.activeRun) {
      throw new Error('Ya hay una ejecución ORCA en curso. Cancélala antes de iniciar otra.');
    }

    validateExecutablePath(request.executablePath);

    const scriptPath = uriToFsPath(request.scriptUri);
    if (!scriptPath) {
      throw new Error(`No se pudo convertir el script ORCA a ruta local: ${request.scriptUri}`);
    }

    const startedAt = this.now();
    const args = buildOrcaArgs(scriptPath);
    const cwd = path.dirname(scriptPath);
    const cancellation = createCancellationSource();
    const timeoutMs = normalizeTimeout(request.timeoutMs);

    let process: OrcaProcessLike;
    try {
      process = this.spawnProcess(request.executablePath, args, {
        cwd,
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      const snapshot = this.finishWithoutActiveRun({
        state: 'failed',
        request,
        startedAt,
        finishedAt: this.now(),
        exitCode: null,
        detail: `No se pudo lanzar ORCA: ${error instanceof Error ? error.message : String(error)}`,
        output: '',
      });
      return cloneOrcaRunResult(snapshot);
    }

    const runningSnapshot: OrcaRunSnapshot = {
      state: 'running',
      scriptUri: request.scriptUri,
      executablePath: request.executablePath,
      startedAt,
      detail: `Ejecutando ${path.basename(scriptPath)}.`,
    };
    this.snapshot = runningSnapshot;
    this.recordJournal('started', 'info', runningSnapshot, { args });

    let stdout = '';
    let stderr = '';
    let settled = false;
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const result = new Promise<OrcaRunResult>((resolve) => {
      this.activeRun = {
        process,
        startedAt,
        scriptUri: request.scriptUri,
        executablePath: request.executablePath,
        cancelReason: null,
        cancellation,
        resolve,
      };
    });

    const settle = (state: OrcaRunState, exitCode: number | null, detail: string): void => {
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
      const finalSnapshot: OrcaRunSnapshot = {
        state,
        scriptUri: request.scriptUri,
        executablePath: request.executablePath,
        startedAt,
        finishedAt,
        durationMs: Math.max(0, finishedAt - startedAt),
        exitCode,
        detail,
        ...(buildOutputExcerpt(output) ? { outputExcerpt: buildOutputExcerpt(output) } : {}),
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
      settle('failed', null, `ORCA falló al arrancar: ${error.message}`);
    });
    process.on('close', (code, signal) => {
      const activeRun = this.activeRun;
      if (activeRun?.cancelReason === 'timeout') {
        settle('timed-out', code, `ORCA agotó el timeout de ${timeoutMs}ms.`);
        return;
      }
      if (activeRun?.cancelReason === 'manual') {
        settle('cancelled', code, 'ORCA cancelado desde VS Code.');
        return;
      }
      if (code === 0) {
        settle('succeeded', code, `ORCA finalizó correctamente${signal ? ` (${signal})` : ''}.`);
        return;
      }
      settle('failed', code, `ORCA finalizó con código ${code ?? 'desconocido'}${signal ? ` (${signal})` : ''}.`);
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

    return cloneOrcaRunResult(await result);
  }

  cancel(): OrcaRunSnapshot | null {
    if (!this.activeRun) {
      return null;
    }
    this.activeRun.cancelReason = 'manual';
    this.recordJournal('cancel-requested', 'info', this.snapshot, undefined);
    this.activeRun.cancellation.cancel();
    return this.getSnapshot();
  }

  private finishWithoutActiveRun(options: {
    state: OrcaRunState;
    request: OrcaRunnerRequest;
    startedAt: number;
    finishedAt: number;
    exitCode: number | null;
    detail: string;
    output: string;
  }): OrcaRunResult {
    const snapshot: OrcaRunSnapshot = {
      state: options.state,
      scriptUri: options.request.scriptUri,
      executablePath: options.request.executablePath,
      startedAt: options.startedAt,
      finishedAt: options.finishedAt,
      durationMs: Math.max(0, options.finishedAt - options.startedAt),
      exitCode: options.exitCode,
      detail: options.detail,
      ...(buildOutputExcerpt(options.output) ? { outputExcerpt: buildOutputExcerpt(options.output) } : {}),
    };
    this.snapshot = snapshot;
    this.recordJournal(options.state, 'error', snapshot, undefined);
    return { snapshot, output: options.output };
  }

  private recordJournal(
    action: string,
    severity: 'info' | 'warning' | 'error',
    snapshot: OrcaRunSnapshot,
    detail: unknown,
  ): void {
    this.journal?.record({
      phase: 'legacy',
      kind: 'orca',
      action,
      severity,
      detail: {
        state: snapshot.state,
        scriptUri: snapshot.scriptUri,
        executablePath: snapshot.executablePath,
        exitCode: snapshot.exitCode,
        durationMs: snapshot.durationMs,
        ...(detail !== undefined ? { extra: detail } : {}),
      },
    });
  }
}

function defaultSpawnProcess(
  executablePath: string,
  args: string[],
  options: SpawnOptions,
): OrcaProcessLike {
  return spawn(executablePath, args, options);
}

function validateExecutablePath(executablePath: string): void {
  if (!executablePath || !executablePath.trim()) {
    throw new Error('La ruta del ejecutable ORCA no puede estar vacía.');
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