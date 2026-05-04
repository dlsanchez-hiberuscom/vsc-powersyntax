import type { CancellationToken } from './cancellation';
import type { RuntimeWorkloadClass } from './backpressurePolicy';
import { TaskPriority, type TaskScheduler } from './scheduler';

export interface ManagedRuntimeWorkloads {
  runBackgroundWorkload<T>(
    idPrefix: string,
    workload: RuntimeWorkloadClass,
    execute: (token: CancellationToken) => Promise<T> | T,
  ): Promise<T>;
  runNearContextWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T>;
  runExportReportingWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T>;
  runMaintenanceWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T>;
}

function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

export function createManagedRuntimeWorkloads(scheduler: TaskScheduler): ManagedRuntimeWorkloads {
  let managedBackgroundTaskSequence = 0;

  function nextManagedBackgroundTaskId(prefix: string): string {
    managedBackgroundTaskSequence += 1;
    return `${prefix}-${managedBackgroundTaskSequence}`;
  }

  async function runBackgroundWorkload<T>(
    idPrefix: string,
    workload: RuntimeWorkloadClass,
    execute: (token: CancellationToken) => Promise<T> | T,
  ): Promise<T> {
    return scheduler.enqueueBackground({
      id: nextManagedBackgroundTaskId(idPrefix),
      priority: TaskPriority.Background,
      workload,
      execute: async (token) => {
        await yieldToEventLoop();
        if (token.isCancelled) {
          throw new Error(`Workload ${idPrefix} cancelado antes de iniciar.`);
        }
        return execute(token);
      },
    });
  }

  async function runNearContextWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T> {
    return scheduler.enqueueNear({
      id: nextManagedBackgroundTaskId(idPrefix),
      priority: TaskPriority.Near,
      workload: 'near-context',
      execute: async (token) => {
        await yieldToEventLoop();
        if (token.isCancelled) {
          throw new Error(`Workload ${idPrefix} cancelado antes de iniciar.`);
        }
        return execute();
      },
    });
  }

  async function runExportReportingWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T> {
    return runBackgroundWorkload(idPrefix, 'export-reporting', async () => execute());
  }

  async function runMaintenanceWorkload<T>(idPrefix: string, execute: () => Promise<T> | T): Promise<T> {
    return runBackgroundWorkload(idPrefix, 'maintenance', async () => execute());
  }

  return {
    runBackgroundWorkload,
    runNearContextWorkload,
    runExportReportingWorkload,
    runMaintenanceWorkload,
  };
}