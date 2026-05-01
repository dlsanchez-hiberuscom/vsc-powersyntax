export interface LatencyGovernorOptions {
  initialBudgetMs?: number;
  minBudgetMs?: number;
  maxBudgetMs?: number;
  targetLatencyMs?: number;
  stepMs?: number;
}

export interface LatencyGovernorSnapshot {
  currentBudgetMs: number;
  minBudgetMs: number;
  maxBudgetMs: number;
  targetLatencyMs: number;
  lastElapsedMs: number;
  overloaded: boolean;
}

export interface LatencyGovernor {
  getBudgetMs(): number;
  recordElapsedMs(elapsedMs: number): number;
  getSnapshot(): LatencyGovernorSnapshot;
}

export function createLatencyGovernor(options: LatencyGovernorOptions = {}): LatencyGovernor {
  const minBudgetMs = options.minBudgetMs ?? 15;
  const maxBudgetMs = options.maxBudgetMs ?? 120;
  const targetLatencyMs = options.targetLatencyMs ?? 40;
  const stepMs = options.stepMs ?? 5;
  let currentBudgetMs = options.initialBudgetMs ?? 50;
  let lastElapsedMs = 0;
  let overloaded = false;

  return {
    getBudgetMs(): number {
      return currentBudgetMs;
    },
    recordElapsedMs(elapsedMs: number): number {
      lastElapsedMs = elapsedMs;
      if (elapsedMs > targetLatencyMs * 1.25) {
        currentBudgetMs = Math.max(minBudgetMs, currentBudgetMs - stepMs);
        overloaded = true;
      } else if (elapsedMs < targetLatencyMs * 0.6) {
        currentBudgetMs = Math.min(maxBudgetMs, currentBudgetMs + stepMs);
        overloaded = false;
      } else {
        overloaded = false;
      }
      return currentBudgetMs;
    },
    getSnapshot(): LatencyGovernorSnapshot {
      return {
        currentBudgetMs,
        minBudgetMs,
        maxBudgetMs,
        targetLatencyMs,
        lastElapsedMs,
        overloaded
      };
    }
  };
}