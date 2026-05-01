/**
 * Query trace (Spec 057 / B136).
 *
 * @module knowledge/queryTrace
 */

export interface TraceStep {
  name: string;
  detail?: unknown;
  ts: number;
}

export interface TraceSnapshot {
  label: string;
  steps: TraceStep[];
}

interface ActiveTrace {
  label: string;
  steps: TraceStep[];
}

let active: ActiveTrace | null = null;
let lastTrace: TraceSnapshot | null = null;

export function withTrace<T>(label: string, fn: () => T): { result: T; trace: TraceStep[] } {
  const previous = active;
  active = { label, steps: [] };
  try {
    const result = fn();
    lastTrace = { label, steps: [...active.steps] };
    return { result, trace: active.steps };
  } finally {
    active = previous;
  }
}

export function recordTraceStep(name: string, detail?: unknown): void {
  if (!active) return;
  active.steps.push({ name, detail, ts: Date.now() });
}

export function getLastTrace(): TraceSnapshot | null {
  return lastTrace ? { label: lastTrace.label, steps: [...lastTrace.steps] } : null;
}
