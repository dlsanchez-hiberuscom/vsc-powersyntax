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

export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: { task: WorkerTask; resolve: (res: any) => void; reject: (err: any) => void }[] = [];
  private activeTasks = new Map<Worker, { task: WorkerTask; resolve: (res: any) => void; reject: (err: any) => void }>();
  private taskIdCounter = 1;

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
        if (msg.success) {
          currentTask.resolve(msg.result);
        } else {
          currentTask.reject(new Error(msg.error));
        }
        this.processNextTask(worker);
      }
    });
    worker.on('error', (err) => {
      console.error(`[WorkerPool] Error en worker: ${err.message}`);
      const currentTask = this.activeTasks.get(worker);
      if (currentTask) {
        this.activeTasks.delete(worker);
        currentTask.reject(err);
      }
      // Replace broken worker
      const idx = this.workers.indexOf(worker);
      if (idx !== -1) {
        this.workers.splice(idx, 1);
        this.createAndAddWorker(workerScript);
      }
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`[WorkerPool] Worker finalizó inesperadamente con código ${code}`);
      }
    });
    this.workers.push(worker);
    this.processNextTask(worker);
  }

  private processNextTask(worker: Worker) {
    if (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!;
      this.activeTasks.set(worker, task);
      worker.postMessage(task.task);
    }
  }

  public runTask(uri: string, content: string, sourceOrigin: SourceOrigin, type: 'structural' | 'enriched'): Promise<any> {
    return new Promise((resolve, reject) => {
      const task: WorkerTask = { id: this.taskIdCounter++, uri, content, sourceOrigin, type };
      this.taskQueue.push({ task, resolve, reject });
      
      const idleWorker = this.workers.find(w => !this.activeTasks.has(w));
      if (idleWorker) {
        // Triggers the processing of the last task pushed if the worker is idle
        this.processNextTask(idleWorker);
      }
    });
  }

  public terminate() {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
  }
}
