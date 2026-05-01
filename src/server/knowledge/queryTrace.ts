/**
 * Query trace (Spec 057 / B136).
 *
 * @module knowledge/queryTrace
 */

export interface TraceStep {
  name: string;
  phase?: string;
  action?: string;
  detail?: unknown;
  ts: number;
}

export interface TraceSnapshot {
  label: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  stepCount: number;
  phases: string[];
  actions: string[];
  lastStepName?: string;
  steps: TraceStep[];
}

interface ActiveTrace {
  label: string;
  startedAt: number;
  steps: TraceStep[];
}

let active: ActiveTrace | null = null;
let lastTrace: TraceSnapshot | null = null;

function deriveTracePhase(name: string): string | undefined {
  const separator = name.indexOf(':');
  return separator > 0 ? name.slice(0, separator) : undefined;
}

function deriveTraceAction(name: string): string | undefined {
  const separator = name.indexOf(':');
  return separator >= 0 && separator < name.length - 1 ? name.slice(separator + 1) : undefined;
}

function cloneTraceStep(step: TraceStep): TraceStep {
  return {
    name: step.name,
    ...(step.phase ? { phase: step.phase } : {}),
    ...(step.action ? { action: step.action } : {}),
    ...(step.detail !== undefined ? { detail: step.detail } : {}),
    ts: step.ts
  };
}

function collectUniquePhases(steps: TraceStep[]): string[] {
  const phases: string[] = [];
  const seen = new Set<string>();
  for (const step of steps) {
    if (!step.phase || seen.has(step.phase)) {
      continue;
    }
    seen.add(step.phase);
    phases.push(step.phase);
  }
  return phases;
}

function collectUniqueActions(steps: TraceStep[]): string[] {
  const actions: string[] = [];
  const seen = new Set<string>();
  for (const step of steps) {
    if (!step.action || seen.has(step.action)) {
      continue;
    }
    seen.add(step.action);
    actions.push(step.action);
  }
  return actions;
}

export function withTrace<T>(label: string, fn: () => T): { result: T; trace: TraceStep[] } {
  const previous = active;
  active = { label, startedAt: Date.now(), steps: [] };
  try {
    const result = fn();
    const endedAt = Date.now();
    lastTrace = {
      label,
      startedAt: active.startedAt,
      endedAt,
      durationMs: endedAt - active.startedAt,
      stepCount: active.steps.length,
      phases: collectUniquePhases(active.steps),
      actions: collectUniqueActions(active.steps),
      ...(active.steps.length > 0 ? { lastStepName: active.steps[active.steps.length - 1].name } : {}),
      steps: [...active.steps]
    };
    return { result, trace: active.steps };
  } finally {
    active = previous;
  }
}

export function recordTraceStep(name: string, detail?: unknown): void {
  if (!active) return;
  active.steps.push({
    name,
    phase: deriveTracePhase(name),
    action: deriveTraceAction(name),
    detail,
    ts: Date.now()
  });
}

export function getLastTrace(): TraceSnapshot | null {
  return lastTrace
    ? {
      label: lastTrace.label,
      startedAt: lastTrace.startedAt,
      endedAt: lastTrace.endedAt,
      durationMs: lastTrace.durationMs,
      stepCount: lastTrace.stepCount,
      phases: [...lastTrace.phases],
      actions: [...lastTrace.actions],
      ...(lastTrace.lastStepName ? { lastStepName: lastTrace.lastStepName } : {}),
      steps: lastTrace.steps.map(cloneTraceStep)
    }
    : null;
}
