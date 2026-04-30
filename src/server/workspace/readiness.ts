/**
 * Workspace readiness tracker (Spec 044 / B128).
 *
 * @module workspace/readiness
 */

export type ReadinessState =
  | 'idle'
  | 'discovering'
  | 'indexing'
  | 'ready'
  | 'error';

export interface ReadinessTracker {
  getState(): ReadinessState;
  transition(next: ReadinessState, detail?: string): boolean;
  onChange(listener: (state: ReadinessState, detail?: string) => void): () => void;
}

const ORDER: Record<ReadinessState, number> = {
  idle: 0,
  discovering: 1,
  indexing: 2,
  ready: 3,
  error: 99
};

export function createReadinessTracker(initial: ReadinessState = 'idle'): ReadinessTracker {
  let state = initial;
  const listeners = new Set<(s: ReadinessState, d?: string) => void>();

  return {
    getState: () => state,
    transition(next: ReadinessState, detail?: string): boolean {
      if (next === state) return false;
      // 'error' siempre permitido. 'ready' puede regresar a 'indexing' (re-index).
      // Otras transiciones deben respetar orden (no retroceder a discovering desde ready).
      if (next !== 'error' && next !== 'indexing' && next !== 'idle' && ORDER[next] < ORDER[state]) {
        return false;
      }
      state = next;
      for (const l of listeners) l(state, detail);
      return true;
    },
    onChange(listener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
