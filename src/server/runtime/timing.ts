/**
 * Timing utilities for measuring operation durations.
 *
 * Provides lightweight wrappers around `performance.now()` for
 * consistent measurement and logging of operation costs.
 *
 * @module runtime/timing
 */

export interface TimingResult<T> {
  result: T;
  elapsedMs: number;
}

/**
 * Measures the execution time of a synchronous function.
 * Returns both the result and elapsed time in milliseconds.
 */
export function measureMs<T>(fn: () => T): TimingResult<T> {
  const start = performance.now();
  const result = fn();
  const elapsedMs = performance.now() - start;
  return { result, elapsedMs };
}

/**
 * Measures the execution time of an asynchronous function.
 * Returns both the result and elapsed time in milliseconds.
 */
export async function measureMsAsync<T>(fn: () => Promise<T>): Promise<TimingResult<T>> {
  const start = performance.now();
  const result = await fn();
  const elapsedMs = performance.now() - start;
  return { result, elapsedMs };
}

/**
 * Formats a timing result as a structured log string.
 */
export function formatTiming(label: string, elapsedMs: number): string {
  return `[TIMING] ${label}: ${elapsedMs.toFixed(2)}ms`;
}

/**
 * Tracks first-time invocations for measuring "time to first X".
 */
export class FirstInvocationTracker {
  private readonly seen = new Set<string>();

  /**
   * Returns true and marks the label as seen if this is the first call.
   * Returns false on subsequent calls with the same label.
   */
  isFirst(label: string): boolean {
    if (this.seen.has(label)) {
      return false;
    }
    this.seen.add(label);
    return true;
  }

  reset(): void {
    this.seen.clear();
  }
}
