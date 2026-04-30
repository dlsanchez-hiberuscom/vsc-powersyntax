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
  execute(token: CancellationToken): Promise<T> | T;
}

interface QueuedTask {
  task: ScheduledTask<unknown>;
  cancellation: CancellationSource;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

// ---------------------------------------------------------------------------
// Planificador (Scheduler)
// ---------------------------------------------------------------------------

export class TaskScheduler {
  private readonly nearQueue: QueuedTask[] = [];
  private readonly backgroundQueue: QueuedTask[] = [];
  private activeInteractiveCount = 0;
  private activeNearTask: QueuedTask | null = null;
  private activeBackgroundTask: QueuedTask | null = null;
  private drainScheduled = false;

  // ---- Callback de registro/logs (opcional) -------------------------------

  private logFn: ((message: string) => void) | undefined;

  setLogger(fn: (message: string) => void): void {
    this.logFn = fn;
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
    this.activeInteractiveCount++;
    this.log(`[PLANIFICADOR] Inicio interactivo: ${task.id} (activos: ${this.activeInteractiveCount})`);

    // Cancelar tareas inferiores en curso para liberar el thread.
    this.cancelActiveNear();
    this.cancelActiveBackground();

    try {
      const result = await task.execute({ isCancelled: false, onCancelled() {} });
      return result;
    } finally {
      this.activeInteractiveCount--;
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

    const promise = new Promise<T>((resolve, reject) => {
      this.nearQueue.push({
        task,
        cancellation,
        resolve: resolve as (v: unknown) => void,
        reject
      });
      this.log(`[PLANIFICADOR] Tarea Near encolada: ${task.id} (cola: ${this.nearQueue.length})`);
    });

    // Si hay un background corriendo, cederle el paso a Near.
    this.cancelActiveBackground();
    this.scheduleDrain();
    return promise;
  }

  /**
   * Encola una tarea de fondo (prioridad baja).
   * Se ejecutará cuando no haya tareas Interactive ni Near pendientes.
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
      this.log(`[PLANIFICADOR] Tarea de fondo encolada: ${task.id} (cola: ${this.backgroundQueue.length})`);
      this.scheduleDrain();
    });
  }

  /**
   * Cancela todas las tareas Near pendientes y la activa.
   */
  cancelAllNear(): void {
    this.cancelActiveNear();

    for (const queued of this.nearQueue) {
      queued.cancellation.cancel();
      queued.cancellation.dispose();
      queued.reject(new Error(`Tarea ${queued.task.id} cancelada`));
    }
    this.nearQueue.length = 0;

    this.log('[PLANIFICADOR] Todas las tareas Near canceladas');
  }

  /**
   * Cancela todas las tareas de fondo pendientes y activas.
   */
  cancelAllBackground(): void {
    this.cancelActiveBackground();

    for (const queued of this.backgroundQueue) {
      queued.cancellation.cancel();
      queued.cancellation.dispose();
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

  /**
   * Apaga el planificador, cancelando todo el trabajo.
   */
  shutdown(): void {
    this.cancelAllNear();
    this.cancelAllBackground();
    this.log('[PLANIFICADOR] Apagado (Shutdown)');
  }

  // ---- Interno -------------------------------------------------------------

  private cancelActiveNear(): void {
    if (this.activeNearTask) {
      this.activeNearTask.cancellation.cancel();
      this.log(`[PLANIFICADOR] Tarea Near cancelada: ${this.activeNearTask.task.id}`);
      this.activeNearTask = null;
    }
  }

  private cancelActiveBackground(): void {
    if (this.activeBackgroundTask) {
      this.activeBackgroundTask.cancellation.cancel();
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

  private async drainQueues(): Promise<void> {
    while (this.activeInteractiveCount === 0) {
      // Prioridad Near sobre Background.
      if (this.nearQueue.length > 0 && !this.activeNearTask) {
        const queued = this.nearQueue.shift()!;
        if (queued.cancellation.token.isCancelled) {
          queued.reject(new Error(`Tarea ${queued.task.id} cancelada antes de ejecución`));
          queued.cancellation.dispose();
          continue;
        }
        this.activeNearTask = queued;
        this.log(`[PLANIFICADOR] Inicio Near: ${queued.task.id}`);
        try {
          const result = await queued.task.execute(queued.cancellation.token);
          queued.resolve(result);
        } catch (error) {
          queued.reject(error);
        } finally {
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
        const queued = this.backgroundQueue.shift()!;
        if (queued.cancellation.token.isCancelled) {
          queued.reject(new Error(`Tarea ${queued.task.id} cancelada antes de ejecución`));
          queued.cancellation.dispose();
          continue;
        }
        this.activeBackgroundTask = queued;
        this.log(`[PLANIFICADOR] Inicio fondo: ${queued.task.id}`);
        try {
          const result = await queued.task.execute(queued.cancellation.token);
          queued.resolve(result);
        } catch (error) {
          queued.reject(error);
        } finally {
          queued.cancellation.dispose();
          if (this.activeBackgroundTask === queued) {
            this.activeBackgroundTask = null;
          }
          this.log(`[PLANIFICADOR] Fin fondo: ${queued.task.id}`);
        }
        continue;
      }

      break;
    }
  }
}
