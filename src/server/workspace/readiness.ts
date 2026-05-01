/**
 * Workspace readiness tracker (Spec 044 / B128).
 *
 * @module workspace/readiness
 */

export type ReadinessState =
  | 'idle'
  | 'discovering'
  | 'indexing'
  | 'degraded'
  | 'ready'
  | 'error';

export interface ReadinessTracker {
  getState(): ReadinessState;
  getDetail(): string | undefined;
  transition(next: ReadinessState, detail?: string): boolean;
  onChange(listener: (state: ReadinessState, detail?: string) => void): () => void;
}

const ORDER: Record<ReadinessState, number> = {
  idle: 0,
  discovering: 1,
  indexing: 2,
  degraded: 3,
  ready: 4,
  error: 99
};

export function createReadinessTracker(initial: ReadinessState = 'idle'): ReadinessTracker {
  let state = initial;
  let detail: string | undefined;
  const listeners = new Set<(s: ReadinessState, d?: string) => void>();

  return {
    getState: () => state,
    getDetail: () => detail,
    transition(next: ReadinessState, nextDetail?: string): boolean {
      if (next === state && nextDetail === undefined) return false;
      // 'error' siempre permitido. 'ready' puede regresar a 'indexing' (re-index).
      // Otras transiciones deben respetar orden (no retroceder a discovering desde ready).
      if (next !== 'error' && next !== 'indexing' && next !== 'idle' && next !== 'degraded' && ORDER[next] < ORDER[state]) {
        return false;
      }
      state = next;
      detail = nextDetail ?? undefined;
      for (const l of listeners) l(state, detail);
      return true;
    },
    onChange(listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
