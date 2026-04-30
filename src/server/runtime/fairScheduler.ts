/**
 * Fair scheduler (Spec 058 / B129).
 *
 * Cola round-robin por proyecto. Garantiza que ningún proyecto
 * monopolice el procesamiento.
 *
 * @module runtime/fairScheduler
 */

export interface FairScheduler<T> {
  enqueue(project: string, item: T): void;
  dequeue(): { project: string; item: T } | undefined;
  size(): number;
}

export function createFairScheduler<T>(): FairScheduler<T> {
  const queues = new Map<string, T[]>();
  const order: string[] = [];
  let cursor = 0;
  let total = 0;

  function ensureSlot(project: string): T[] {
    let q = queues.get(project);
    if (!q) {
      q = [];
      queues.set(project, q);
      order.push(project);
    }
    return q;
  }

  return {
    enqueue(project, item) {
      ensureSlot(project).push(item);
      total++;
    },
    dequeue() {
      if (total === 0) return undefined;
      for (let attempts = 0; attempts < order.length; attempts++) {
        const project = order[cursor];
        cursor = (cursor + 1) % order.length;
        const q = queues.get(project);
        if (q && q.length > 0) {
          total--;
          return { project, item: q.shift()! };
        }
      }
      return undefined;
    },
    size() {
      return total;
    }
  };
}
