/**
 * Planificador de tareas minimalista con dos niveles de prioridad.
 *
 * Las tareas interactivas (vistas por el usuario: hover, símbolos, diagnósticos)
 * se ejecutan inmediatamente. Las tareas de fondo esperan hasta que no haya
 * trabajo interactivo pendiente y son cancelables.
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
  /** Trabajo diferido: espera a inactividad, cancelable. */
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
  private readonly backgroundQueue: QueuedTask[] = [];
  private activeInteractiveCount = 0;
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
   * Si hay una tarea de fondo ejecutándose, será cancelada.
   */
  async runInteractive<T>(task: ScheduledTask<T>): Promise<T> {
    this.activeInteractiveCount++;
    this.log(`[PLANIFICADOR] Inicio interactivo: ${task.id} (activos: ${this.activeInteractiveCount})`);

    // Cancelar cualquier tarea de fondo en curso para liberar recursos.
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
   * Encola una tarea de fondo (prioridad baja).
   * Se ejecutará cuando no haya tareas interactivas en curso.
   * Devuelve una promesa que se resuelve cuando la tarea termina.
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

  /**
   * Devuelve el número de tareas de fondo pendientes.
   */
  get pendingBackgroundCount(): number {
    return this.backgroundQueue.length;
  }

  /**
   * Devuelve true si hay tareas interactivas ejecutándose actualmente.
   */
  get isInteractiveBusy(): boolean {
    return this.activeInteractiveCount > 0;
  }

  /**
   * Apaga el planificador, cancelando todo el trabajo.
   */
  shutdown(): void {
    this.cancelAllBackground();
    this.log('[PLANIFICADOR] Apagado (Shutdown)');
  }

  // ---- Interno -------------------------------------------------------------

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

    // Usamos setImmediate para evitar bloquear la pila de llamadas actual.
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

      // Saltar si ya fue cancelada antes de empezar la ejecución.
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

        // Solo limpiar si sigue siendo la tarea activa (no reemplazada por otra).
        if (this.activeBackgroundTask === queued) {
          this.activeBackgroundTask = null;
        }

        this.log(`[PLANIFICADOR] Fin fondo: ${queued.task.id}`);
      }
    }
  }
}
