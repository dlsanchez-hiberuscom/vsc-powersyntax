/**
 * Minimal task scheduler with two priority levels.
 *
 * Interactive tasks (user-facing: hover, symbols, diagnostics) execute
 * immediately. Background tasks wait until no interactive work is pending
 * and are cancelable.
 *
 * @module runtime/scheduler
 */

import {
  type CancellationToken,
  type CancellationSource,
  createCancellationSource
} from './cancellation.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export enum TaskPriority {
  /** User-facing operations — execute immediately. */
  Interactive = 0,
  /** Deferred work — waits for idle, cancelable. */
  Background = 10
}

export interface ScheduledTask<T = void> {
  readonly id: string;
  readonly priority: TaskPriority;
  execute(token: CancellationToken): Promise<T> | T;
}

interface QueuedTask {
  task: ScheduledTask<unknown>;
  cancellation: CancellationSource;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

export class TaskScheduler {
  private readonly backgroundQueue: QueuedTask[] = [];
  private activeInteractiveCount = 0;
  private activeBackgroundTask: QueuedTask | null = null;
  private drainScheduled = false;

  // ---- Logging callback (optional) ----------------------------------------

  private logFn: ((message: string) => void) | undefined;

  setLogger(fn: (message: string) => void): void {
    this.logFn = fn;
  }

  private log(message: string): void {
    this.logFn?.(message);
  }

  // ---- Public API ----------------------------------------------------------

  /**
   * Runs an interactive (high-priority) task immediately.
   * If a background task is running, it will be cancelled.
   */
  async runInteractive<T>(task: ScheduledTask<T>): Promise<T> {
    this.activeInteractiveCount++;
    this.log(`[SCHEDULER] Interactive start: ${task.id} (active: ${this.activeInteractiveCount})`);

    // Cancel any running background task to free resources.
    this.cancelActiveBackground();

    try {
      const result = await task.execute({ isCancelled: false, onCancelled() {} });
      return result;
    } finally {
      this.activeInteractiveCount--;
      this.log(`[SCHEDULER] Interactive done: ${task.id} (active: ${this.activeInteractiveCount})`);
      this.scheduleDrain();
    }
  }

  /**
   * Enqueues a background (low-priority) task.
   * It will execute when no interactive tasks are running.
   * Returns a promise that resolves when the task completes.
   */
  enqueueBackground<T>(task: ScheduledTask<T>): Promise<T> {
    const cancellation = createCancellationSource();

    return new Promise<T>((resolve, reject) => {
      this.backgroundQueue.push({
        task,
        cancellation,
        resolve: resolve as (v: unknown) => void,
        reject
      });
      this.log(`[SCHEDULER] Background enqueued: ${task.id} (queue: ${this.backgroundQueue.length})`);
      this.scheduleDrain();
    });
  }

  /**
   * Cancels all pending and active background tasks.
   */
  cancelAllBackground(): void {
    this.cancelActiveBackground();

    for (const queued of this.backgroundQueue) {
      queued.cancellation.cancel();
      queued.cancellation.dispose();
      queued.reject(new Error(`Task ${queued.task.id} cancelled`));
    }
    this.backgroundQueue.length = 0;

    this.log('[SCHEDULER] All background tasks cancelled');
  }

  /**
   * Returns the number of pending background tasks.
   */
  get pendingBackgroundCount(): number {
    return this.backgroundQueue.length;
  }

  /**
   * Returns true if interactive tasks are currently running.
   */
  get isInteractiveBusy(): boolean {
    return this.activeInteractiveCount > 0;
  }

  /**
   * Shuts down the scheduler, cancelling all work.
   */
  shutdown(): void {
    this.cancelAllBackground();
    this.log('[SCHEDULER] Shutdown');
  }

  // ---- Internal ------------------------------------------------------------

  private cancelActiveBackground(): void {
    if (this.activeBackgroundTask) {
      this.activeBackgroundTask.cancellation.cancel();
      this.log(`[SCHEDULER] Background cancelled: ${this.activeBackgroundTask.task.id}`);
      this.activeBackgroundTask = null;
    }
  }

  private scheduleDrain(): void {
    if (this.drainScheduled) {
      return;
    }
    this.drainScheduled = true;

    // Use setImmediate to avoid blocking the current call stack.
    setImmediate(() => {
      this.drainScheduled = false;
      void this.drainBackground();
    });
  }

  private async drainBackground(): Promise<void> {
    while (
      this.backgroundQueue.length > 0 &&
      this.activeInteractiveCount === 0 &&
      !this.activeBackgroundTask
    ) {
      const queued = this.backgroundQueue.shift()!;

      // Skip if already cancelled before execution.
      if (queued.cancellation.token.isCancelled) {
        queued.reject(new Error(`Task ${queued.task.id} cancelled before execution`));
        queued.cancellation.dispose();
        continue;
      }

      this.activeBackgroundTask = queued;
      this.log(`[SCHEDULER] Background start: ${queued.task.id}`);

      try {
        const result = await queued.task.execute(queued.cancellation.token);
        queued.resolve(result);
      } catch (error) {
        queued.reject(error);
      } finally {
        queued.cancellation.dispose();

        // Only clear if this is still the active task (not replaced by another).
        if (this.activeBackgroundTask === queued) {
          this.activeBackgroundTask = null;
        }

        this.log(`[SCHEDULER] Background done: ${queued.task.id}`);
      }
    }
  }
}
