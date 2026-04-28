/**
 * Cooperative cancellation primitives.
 *
 * Provides a simple CancellationToken / CancellationSource pattern
 * for making long-running operations cancelable.
 *
 * @module runtime/cancellation
 */

/**
 * A token that can be checked for cancellation.
 * Consumers poll `isCancelled` or register a callback via `onCancelled`.
 */
export interface CancellationToken {
  readonly isCancelled: boolean;
  onCancelled(callback: () => void): void;
}

/**
 * A source that produces a CancellationToken and can cancel it.
 */
export interface CancellationSource {
  readonly token: CancellationToken;
  cancel(): void;
  dispose(): void;
}

/**
 * A token that is never cancelled. Use as a default when no
 * cancellation is needed.
 */
export const CancellationToken_None: CancellationToken = {
  isCancelled: false,
  onCancelled(_callback: () => void): void {
    // Never fires — this token is never cancelled.
  }
};

/**
 * Creates a new CancellationSource with a fresh token.
 */
export function createCancellationSource(): CancellationSource {
  let cancelled = false;
  const callbacks: Array<() => void> = [];

  const token: CancellationToken = {
    get isCancelled(): boolean {
      return cancelled;
    },

    onCancelled(callback: () => void): void {
      if (cancelled) {
        callback();
        return;
      }
      callbacks.push(callback);
    }
  };

  return {
    token,

    cancel(): void {
      if (cancelled) {
        return;
      }
      cancelled = true;
      for (const cb of callbacks) {
        try {
          cb();
        } catch {
          // Swallow callback errors to avoid breaking the cancellation chain.
        }
      }
      callbacks.length = 0;
    },

    dispose(): void {
      callbacks.length = 0;
    }
  };
}
