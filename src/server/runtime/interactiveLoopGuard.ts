export class InteractiveLoopGuard {
  private readonly inFlight = new Map<string, Promise<unknown>>();

  run<T>(key: string, execute: () => Promise<T> | T, onReuse?: () => void): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      onReuse?.();
      return existing as Promise<T>;
    }

    const promise = Promise.resolve().then(execute);
    this.inFlight.set(key, promise);

    const clear = (): void => {
      if (this.inFlight.get(key) === promise) {
        this.inFlight.delete(key);
      }
    };

    promise.then(clear, clear);
    return promise;
  }

  getInFlightCount(): number {
    return this.inFlight.size;
  }
}