import { Worker } from 'worker_threads';
import * as path from 'path';
import type { SourceOrigin } from '../../shared/sourceOrigin';

export interface WorkerTask {
  id: number;
  uri: string;
  content: string;
  sourceOrigin: SourceOrigin;
  type: 'structural' | 'enriched';
}

export interface WorkerResult {
  id: number;
  success: boolean;
  result?: any;
  error?: string;
}

interface QueuedWorkerTask {
  task: WorkerTask;
  resolve: (res: any) => void;
  reject: (err: any) => void;
  enqueuedAt: number;
}

interface ActiveWorkerTask extends QueuedWorkerTask {
  startedAt: number;
}

export interface WorkerPoolStatsSnapshot {
  totalWorkers: number;
  busyWorkers: number;
  idleWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  workerErrors: number;
  unexpectedExits: number;
  restartedWorkers: number;
  avgWaitMs?: number;
  avgRunMs?: number;
  lastWaitMs?: number;
  lastRunMs?: number;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: QueuedWorkerTask[] = [];
  private activeTasks = new Map<Worker, ActiveWorkerTask>();
  private taskIdCounter = 1;
  private completedTasks = 0;
  private failedTasks = 0;
  private workerErrors = 0;
  private unexpectedExits = 0;
  private restartedWorkers = 0;
  private waitMsSum = 0;
  private waitSamples = 0;
  private runMsSum = 0;
  private runSamples = 0;
  private lastWaitMs: number | undefined;
  private lastRunMs: number | undefined;
  private shuttingDown = false;

  constructor(private size: number) {
    const workerScript = path.join(__dirname, 'worker.js');
    for (let i = 0; i < size; i++) {
      this.createAndAddWorker(workerScript);
    }
  }

  private createAndAddWorker(workerScript: string) {
    const worker = new Worker(workerScript);
    worker.on('message', (msg: WorkerResult) => {
      const currentTask = this.activeTasks.get(worker);
      if (currentTask && currentTask.task.id === msg.id) {
        this.activeTasks.delete(worker);
        const runMs = performance.now() - currentTask.startedAt;
        this.runMsSum += runMs;
        this.runSamples++;
        this.lastRunMs = runMs;
        if (msg.success) {
          this.completedTasks++;
          currentTask.resolve(msg.result);
        } else {
          this.failedTasks++;
          currentTask.reject(new Error(msg.error));
        }
        this.processNextTask(worker);
      }
    });
    worker.on('error', (err) => {
      console.error(`[WorkerPool] Error en worker: ${err.message}`);
      this.workerErrors++;
      const currentTask = this.activeTasks.get(worker);
      if (currentTask) {
        this.activeTasks.delete(worker);
        this.failedTasks++;
        currentTask.reject(err);
      }
      // Replace broken worker
      const idx = this.workers.indexOf(worker);
      if (idx !== -1) {
        this.workers.splice(idx, 1);
        this.restartedWorkers++;
        this.createAndAddWorker(workerScript);
      }
    });
    worker.on('exit', (code) => {
      if (!this.shuttingDown && code !== 0) {
        this.unexpectedExits++;
        console.error(`[WorkerPool] Worker finalizó inesperadamente con código ${code}`);
      }
    });
    this.workers.push(worker);
    this.processNextTask(worker);
  }

  private processNextTask(worker: Worker) {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      const startedAt = performance.now();
      const waitMs = startedAt - task.enqueuedAt;
      this.waitMsSum += waitMs;
      this.waitSamples++;
      this.lastWaitMs = waitMs;
      this.activeTasks.set(worker, {
        ...task,
        startedAt,
      });
      worker.postMessage(task.task);
    }
  }

  public runTask(uri: string, content: string, sourceOrigin: SourceOrigin, type: 'structural' | 'enriched'): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = { id: this.taskIdCounter++, uri, content, sourceOrigin, type };
      this.taskQueue.push({ task, resolve, reject, enqueuedAt: performance.now() });
      
      const idleWorker = this.workers.find(w => !this.activeTasks.has(w));
      if (idleWorker) {
        // Triggers the processing of the last task pushed if the worker is idle
        this.processNextTask(idleWorker);
      }
    });
  }

  public getStats(): WorkerPoolStatsSnapshot {
    return {
      totalWorkers: this.workers.length,
      busyWorkers: this.activeTasks.size,
      idleWorkers: Math.max(0, this.workers.length - this.activeTasks.size),
      queuedTasks: this.taskQueue.length,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
      workerErrors: this.workerErrors,
      unexpectedExits: this.unexpectedExits,
      restartedWorkers: this.restartedWorkers,
      ...(this.waitSamples > 0 ? { avgWaitMs: this.waitMsSum / this.waitSamples } : {}),
      ...(this.runSamples > 0 ? { avgRunMs: this.runMsSum / this.runSamples } : {}),
      ...(this.lastWaitMs !== undefined ? { lastWaitMs: this.lastWaitMs } : {}),
      ...(this.lastRunMs !== undefined ? { lastRunMs: this.lastRunMs } : {}),
    };
  }

  public terminate() {
    this.shuttingDown = true;
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
  }
}
