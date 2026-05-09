/**
 * Planificador de tareas con tres niveles de prioridad.
 *
 * - `Interactive`: visibles al usuario (hover, completion, definition,
 *   diagnostics inmediatos). Se ejecutan inmediatamente y cancelan cualquier
 *   tarea `Near` o `Background` en curso.
 * - `Near`: trabajo cercano al contexto activo (ancestros, owners, tipos
 *   referenciados). Cancela `Background` en curso pero respeta `Interactive`.
 * - `Background`: indexación masiva del workspace. Solo se ejecuta cuando no
 *   hay `Interactive` ni `Near` pendientes ni activas.
 *
 * Reglas de equidad:
 * - `Interactive` siempre preempta a `Near` y `Background`.
 * - `Near` preempta a `Background`, pero nunca a `Interactive`.
 * - `Background` no priva a `Near`: si llega trabajo `Near`, cede el slot.
 *
 * @module runtime/scheduler
 */

import {
  type CancellationToken,
  type CancellationSource,
  createCancellationSource
} from './cancellation.js';
import { isRuntimeWorkloadPreemptible, type RuntimeWorkloadClass } from './backpressurePolicy';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export enum TaskPriority {
  /** Operaciones visibles para el usuario: se ejecutan inmediatamente. */
  Interactive = 0,
  /** Trabajo cercano al contexto activo: precede a Background. */
  Near = 5,
  /** Trabajo diferido (indexación masiva): cancelable. */
  Background = 10
}

export interface ScheduledTask<T = void> {
  readonly id: string;
  readonly priority: TaskPriority;
  readonly workload?: RuntimeWorkloadClass;
  execute(token: CancellationToken): Promise<T> | T;
}

export interface BackgroundAdmissionDecision {
  allowed: boolean;
  reason?: string;
}

interface QueuedTask {
  task: ScheduledTask<unknown>;
  cancellation: CancellationSource;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
  enqueuedAt: number;
}

export interface SchedulerLaneMetrics {
  enqueued: number;
  completed: number;
  cancelled: number;
  avgWaitMs?: number;
  avgRunMs?: number;
  lastWaitMs?: number;
  lastRunMs?: number;
}

export interface SchedulerStatus {
  pendingNear: number;
  pendingBackground: number;
  interactiveBusy: boolean;
  activeNearId: string | null;
  activeBackgroundId: string | null;
  pendingWorkloads: Partial<Record<RuntimeWorkloadClass, number>>;
  activeInteractiveWorkloads: Partial<Record<RuntimeWorkloadClass, number>>;
  activeNearWorkload?: RuntimeWorkloadClass;
  activeBackgroundWorkload?: RuntimeWorkloadClass;
  throttledBackgroundWorkload?: RuntimeWorkloadClass;
  throttledBackgroundReason?: string;
  preemptions: {
    interactiveCancelledNear: number;
    interactiveCancelledBackground: number;
    nearCancelledBackground: number;
  };
  metrics?: {
    interactive: SchedulerLaneMetrics;
    near: SchedulerLaneMetrics;
    background: SchedulerLaneMetrics;
  };
}

type MutableSchedulerLaneMetrics = {
  enqueued: number;
  completed: number;
  cancelled: number;
  waitMsSum: number;
  waitSamples: number;
  runMsSum: number;
  runSamples: number;
  lastWaitMs?: number;
  lastRunMs?: number;
};

function createLaneMetrics(): MutableSchedulerLaneMetrics {
  return {
    enqueued: 0,
    completed: 0,
    cancelled: 0,
    waitMsSum: 0,
    waitSamples: 0,
    runMsSum: 0,
    runSamples: 0,
  };
}

function toLaneMetricsSnapshot(metrics: MutableSchedulerLaneMetrics): SchedulerLaneMetrics {
  return {
    enqueued: metrics.enqueued,
    completed: metrics.completed,
    cancelled: metrics.cancelled,
    ...(metrics.waitSamples > 0 ? { avgWaitMs: metrics.waitMsSum / metrics.waitSamples } : {}),
    ...(metrics.runSamples > 0 ? { avgRunMs: metrics.runMsSum / metrics.runSamples } : {}),
    ...(metrics.lastWaitMs !== undefined ? { lastWaitMs: metrics.lastWaitMs } : {}),
    ...(metrics.lastRunMs !== undefined ? { lastRunMs: metrics.lastRunMs } : {}),
  };
}

function resolveTaskWorkload(task: ScheduledTask<unknown>, fallbackWorkload: RuntimeWorkloadClass): RuntimeWorkloadClass {
  return task.workload ?? fallbackWorkload;
}

function incrementWorkloadCount(map: Map<RuntimeWorkloadClass, number>, workload: RuntimeWorkloadClass): void {
  map.set(workload, (map.get(workload) ?? 0) + 1);
}

function decrementWorkloadCount(map: Map<RuntimeWorkloadClass, number>, workload: RuntimeWorkloadClass): void {
  const current = map.get(workload) ?? 0;
  if (current <= 1) {
    map.delete(workload);
    return;
  }
  map.set(workload, current - 1);
}

function snapshotWorkloadCounts(map: Map<RuntimeWorkloadClass, number>): Partial<Record<RuntimeWorkloadClass, number>> {
  const snapshot: Partial<Record<RuntimeWorkloadClass, number>> = {};
  for (const [workload, count] of map.entries()) {
    snapshot[workload] = count;
  }
  return snapshot;
}

function collectPendingWorkloads(
  nearQueue: readonly QueuedTask[],
  backgroundQueue: readonly QueuedTask[]
): Partial<Record<RuntimeWorkloadClass, number>> {
  const counts = new Map<RuntimeWorkloadClass, number>();

  for (const queued of nearQueue) {
    incrementWorkloadCount(counts, resolveTaskWorkload(queued.task, 'near-context'));
  }

  for (const queued of backgroundQueue) {
    incrementWorkloadCount(counts, resolveTaskWorkload(queued.task, 'background-indexing'));
  }

  return snapshotWorkloadCounts(counts);
}

// ---------------------------------------------------------------------------
// Planificador (Scheduler)
// ---------------------------------------------------------------------------

export class TaskScheduler {
  private readonly nearQueue: QueuedTask[] = [];
  private readonly backgroundQueue: QueuedTask[] = [];
  private activeInteractiveCount = 0;
  private readonly activeInteractiveWorkloads = new Map<RuntimeWorkloadClass, number>();
  private activeNearTask: QueuedTask | null = null;
  private activeBackgroundTask: QueuedTask | null = null;
  private drainScheduled = false;
  private readonly preemptions = {
    interactiveCancelledNear: 0,
    interactiveCancelledBackground: 0,
    nearCancelledBackground: 0
  };
  private readonly laneMetrics = {
    interactive: createLaneMetrics(),
    near: createLaneMetrics(),
    background: createLaneMetrics(),
  };
  private backgroundAdmissionGate: ((task: ScheduledTask<unknown>) => BackgroundAdmissionDecision | boolean) | undefined;
  private throttledBackground: { workload: RuntimeWorkloadClass; reason: string } | null = null;

  // ---- Callback de registro/logs (opcional) -------------------------------

  private logFn: ((message: string) => void) | undefined;

  setLogger(fn: (message: string) => void): void {
    this.logFn = fn;
  }

  setBackgroundAdmissionGate(fn: ((task: ScheduledTask<unknown>) => BackgroundAdmissionDecision | boolean) | undefined): void {
    this.backgroundAdmissionGate = fn;
  }

  requestDrain(): void {
    this.scheduleDrain();
  }

  private log(message: string): void {
    this.logFn?.(message);
  }

  // ---- API Pública ---------------------------------------------------------

  /**
   * Ejecuta una tarea interactiva (prioridad alta) inmediatamente.
   * Cancela cualquier tarea `Near` o `Background` activa.
   */
  async runInteractive<T>(task: ScheduledTask<T>): Promise<T> {
    const workload = resolveTaskWorkload(task, 'interactive');
    const startedAt = performance.now();
    this.activeInteractiveCount++;
    incrementWorkloadCount(this.activeInteractiveWorkloads, workload);
    this.laneMetrics.interactive.enqueued++;
    this.laneMetrics.interactive.waitSamples++;
    this.laneMetrics.interactive.lastWaitMs = 0;
    this.log(`[PLANIFICADOR] Inicio interactivo: ${task.id} (activos: ${this.activeInteractiveCount})`);

    // Cancelar tareas inferiores en curso para liberar el thread.
    this.cancelActiveNear('interactive');
    this.cancelActiveBackground('interactive');

    try {
      const result = await task.execute({ isCancelled: false, onCancelled() {} });
      return result;
    } finally {
      const runMs = performance.now() - startedAt;
      this.activeInteractiveCount--;
      decrementWorkloadCount(this.activeInteractiveWorkloads, workload);
      this.laneMetrics.interactive.completed++;
      this.laneMetrics.interactive.runMsSum += runMs;
      this.laneMetrics.interactive.runSamples++;
      this.laneMetrics.interactive.lastRunMs = runMs;
      this.log(`[PLANIFICADOR] Fin interactivo: ${task.id} (activos: ${this.activeInteractiveCount})`);
      this.scheduleDrain();
    }
  }

  /**
   * Encola una tarea Near (contexto activo). Se ejecuta antes que cualquier
   * `Background`, y cancela el Background activo si lo hay.
   */
  enqueueNear<T>(task: ScheduledTask<T>): Promise<T> {
    const cancellation = createCancellationSource();
    const normalizedTask: ScheduledTask<T> = {
      ...task,
      workload: resolveTaskWorkload(task, 'near-context')
    };

    const promise = new Promise<T>((resolve, reject) => {
      this.nearQueue.push({
        task: normalizedTask,
        cancellation,
        resolve: resolve as (v: unknown) => void,
        reject,
        enqueuedAt: performance.now(),
      });
      this.laneMetrics.near.enqueued++;
      this.log(`[PLANIFICADOR] Tarea Near encolada: ${normalizedTask.id} (cola: ${this.nearQueue.length})`);
    });

    // Si hay un background corriendo, cederle el paso a Near.
    this.cancelActiveBackground('near');
    this.scheduleDrain();
    return promise;
  }

  /**
   * Encola una tarea de fondo (prioridad baja).
   * Se ejecutará cuando no haya tareas Interactive ni Near pendientes.
   */
  enqueueBackground<T>(task: ScheduledTask<T>): Promise<T> {
    const cancellation = createCancellationSource();
    const normalizedTask: ScheduledTask<T> = {
      ...task,
      workload: resolveTaskWorkload(task, 'background-indexing')
    };

    return new Promise<T>((resolve, reject) => {
      this.backgroundQueue.push({
        task: normalizedTask,
        cancellation,
        resolve: resolve as (v: unknown) => void,
        reject,
        enqueuedAt: performance.now(),
      });
      this.laneMetrics.background.enqueued++;
      this.log(`[PLANIFICADOR] Tarea de fondo encolada: ${normalizedTask.id} (cola: ${this.backgroundQueue.length})`);
      this.scheduleDrain();
    });
  }

  /**
   * Cancela todas las tareas Near pendientes y la activa.
   */
  cancelAllNear(): void {
    this.cancelActiveNear('manual');

    for (const queued of this.nearQueue) {
      queued.cancellation.cancel();
      queued.cancellation.dispose();
      this.laneMetrics.near.cancelled++;
      queued.reject(new Error(`Tarea ${queued.task.id} cancelada`));
    }
    this.nearQueue.length = 0;

    this.log('[PLANIFICADOR] Todas las tareas Near canceladas');
  }

  /**
   * Cancela todas las tareas de fondo pendientes y activas.
   */
  cancelAllBackground(): void {
    this.cancelActiveBackground('manual');

    for (const queued of this.backgroundQueue) {
      queued.cancellation.cancel();
      queued.cancellation.dispose();
      this.laneMetrics.background.cancelled++;
      queued.reject(new Error(`Tarea ${queued.task.id} cancelada`));
    }
    this.backgroundQueue.length = 0;

    this.log('[PLANIFICADOR] Todas las tareas de fondo canceladas');
  }

  /** Número de tareas Near pendientes (sin contar la activa). */
  get pendingNearCount(): number {
    return this.nearQueue.length;
  }

  /** Número de tareas de fondo pendientes (sin contar la activa). */
  get pendingBackgroundCount(): number {
    return this.backgroundQueue.length;
  }

  /** True si hay tareas interactivas ejecutándose actualmente. */
  get isInteractiveBusy(): boolean {
    return this.activeInteractiveCount > 0;
  }

  getStatus(): SchedulerStatus {
    const activeNearWorkload = this.activeNearTask
      ? resolveTaskWorkload(this.activeNearTask.task, 'near-context')
      : undefined;
    const activeBackgroundWorkload = this.activeBackgroundTask
      ? resolveTaskWorkload(this.activeBackgroundTask.task, 'background-indexing')
      : undefined;
    const throttledBackground = this.backgroundQueue.length > 0 ? this.throttledBackground : null;

    return {
      pendingNear: this.pendingNearCount,
      pendingBackground: this.pendingBackgroundCount,
      interactiveBusy: this.isInteractiveBusy,
      activeNearId: this.activeNearTask?.task.id ?? null,
      activeBackgroundId: this.activeBackgroundTask?.task.id ?? null,
      pendingWorkloads: collectPendingWorkloads(this.nearQueue, this.backgroundQueue),
      activeInteractiveWorkloads: snapshotWorkloadCounts(this.activeInteractiveWorkloads),
      activeNearWorkload,
      activeBackgroundWorkload,
      ...(throttledBackground?.workload ? { throttledBackgroundWorkload: throttledBackground.workload } : {}),
      ...(throttledBackground?.reason ? { throttledBackgroundReason: throttledBackground.reason } : {}),
      preemptions: { ...this.preemptions },
      metrics: {
        interactive: toLaneMetricsSnapshot(this.laneMetrics.interactive),
        near: toLaneMetricsSnapshot(this.laneMetrics.near),
        background: toLaneMetricsSnapshot(this.laneMetrics.background),
      }
    };
  }

  /**
   * Apaga el planificador, cancelando todo el trabajo.
   */
  shutdown(): void {
    this.cancelAllNear();
    this.cancelAllBackground();
    this.log('[PLANIFICADOR] Apagado (Shutdown)');
  }

  // ---- Interno -------------------------------------------------------------

  private cancelActiveNear(reason: 'interactive' | 'manual'): void {
    if (this.activeNearTask) {
      this.activeNearTask.cancellation.cancel();
      this.laneMetrics.near.cancelled++;
      if (reason === 'interactive') {
        this.preemptions.interactiveCancelledNear++;
      }
      this.log(`[PLANIFICADOR] Tarea Near cancelada: ${this.activeNearTask.task.id}`);
      this.activeNearTask = null;
    }
  }

  private cancelActiveBackground(reason: 'interactive' | 'near' | 'manual'): void {
    if (this.activeBackgroundTask) {
      const workload = resolveTaskWorkload(this.activeBackgroundTask.task, 'background-indexing');
      if (reason !== 'manual' && !isRuntimeWorkloadPreemptible(workload)) {
        this.log(`[PLANIFICADOR] Fondo preservado: ${this.activeBackgroundTask.task.id} (${workload})`);
        return;
      }
      this.activeBackgroundTask.cancellation.cancel();
      this.laneMetrics.background.cancelled++;
      if (reason === 'interactive') {
        this.preemptions.interactiveCancelledBackground++;
      } else if (reason === 'near') {
        this.preemptions.nearCancelledBackground++;
      }
      this.log(`[PLANIFICADOR] Tarea de fondo cancelada: ${this.activeBackgroundTask.task.id}`);
      this.activeBackgroundTask = null;
    }
  }

  private scheduleDrain(): void {
    if (this.drainScheduled) {
      return;
    }
    this.drainScheduled = true;

    setImmediate(() => {
      this.drainScheduled = false;
      void this.drainQueues();
    });
  }

  private scheduleDrainAfter(delayMs: number): void {
    if (this.drainScheduled) {
      return;
    }
    this.drainScheduled = true;
    setTimeout(() => {
      this.drainScheduled = false;
      void this.drainQueues();
    }, delayMs);
  }

  private async drainQueues(): Promise<void> {
    while (this.activeInteractiveCount === 0) {
      // Prioridad Near sobre Background.
      if (this.nearQueue.length > 0 && !this.activeNearTask) {
        this.throttledBackground = null;
        const queued = this.nearQueue.shift()!;
        if (queued.cancellation.token.isCancelled) {
          this.laneMetrics.near.cancelled++;
          queued.reject(new Error(`Tarea ${queued.task.id} cancelada antes de ejecución`));
          queued.cancellation.dispose();
          continue;
        }
        const startedAt = performance.now();
        const waitMs = startedAt - queued.enqueuedAt;
        this.activeNearTask = queued;
        this.laneMetrics.near.waitMsSum += waitMs;
        this.laneMetrics.near.waitSamples++;
        this.laneMetrics.near.lastWaitMs = waitMs;
        this.log(`[PLANIFICADOR] Inicio Near: ${queued.task.id}`);
        try {
          const result = await queued.task.execute(queued.cancellation.token);
          queued.resolve(result);
        } catch (error) {
          queued.reject(error);
        } finally {
          const runMs = performance.now() - startedAt;
          this.laneMetrics.near.completed++;
          this.laneMetrics.near.runMsSum += runMs;
          this.laneMetrics.near.runSamples++;
          this.laneMetrics.near.lastRunMs = runMs;
          queued.cancellation.dispose();
          if (this.activeNearTask === queued) {
            this.activeNearTask = null;
          }
          this.log(`[PLANIFICADOR] Fin Near: ${queued.task.id}`);
        }
        continue;
      }

      // Background solo si no hay Near pendiente ni activa.
      if (
        this.backgroundQueue.length > 0 &&
        !this.activeBackgroundTask &&
        this.nearQueue.length === 0 &&
        !this.activeNearTask
      ) {
        const nextBackground = this.backgroundQueue[0]!;
        if (this.backgroundAdmissionGate) {
          const decision = this.backgroundAdmissionGate(nextBackground.task);
          const normalizedDecision = typeof decision === 'boolean'
            ? { allowed: decision }
            : decision;
          if (!normalizedDecision.allowed) {
            this.throttledBackground = {
              workload: resolveTaskWorkload(nextBackground.task, 'background-indexing'),
              reason: normalizedDecision.reason ?? 'background-throttled'
            };
            this.scheduleDrainAfter(25);
            break;
          }
        }

        this.throttledBackground = null;
        const queued = this.backgroundQueue.shift()!;
        if (queued.cancellation.token.isCancelled) {
          this.laneMetrics.background.cancelled++;
          queued.reject(new Error(`Tarea ${queued.task.id} cancelada antes de ejecución`));
          queued.cancellation.dispose();
          continue;
        }
        const startedAt = performance.now();
        const waitMs = startedAt - queued.enqueuedAt;
        this.activeBackgroundTask = queued;
        this.laneMetrics.background.waitMsSum += waitMs;
        this.laneMetrics.background.waitSamples++;
        this.laneMetrics.background.lastWaitMs = waitMs;
        this.log(`[PLANIFICADOR] Inicio fondo: ${queued.task.id}`);
        try {
          const result = await queued.task.execute(queued.cancellation.token);
          queued.resolve(result);
        } catch (error) {
          queued.reject(error);
        } finally {
          const runMs = performance.now() - startedAt;
          this.laneMetrics.background.completed++;
          this.laneMetrics.background.runMsSum += runMs;
          this.laneMetrics.background.runSamples++;
          this.laneMetrics.background.lastRunMs = runMs;
          queued.cancellation.dispose();
          if (this.activeBackgroundTask === queued) {
            this.activeBackgroundTask = null;
          }
          this.log(`[PLANIFICADOR] Fin fondo: ${queued.task.id}`);
        }
        continue;
      }

      if (this.backgroundQueue.length === 0) {
        this.throttledBackground = null;
      }

      break;
    }
  }
}
