export class ServingCacheFlushCoordinator {
  private dirty = false;
  private inFlight: Promise<void> | null = null;

  constructor(private readonly flush: () => Promise<void>) {}

  markDirty(): void {
    this.dirty = true;
  }

  async flushIfDirty(): Promise<boolean> {
    if (this.inFlight) {
      await this.inFlight;
      return false;
    }

    let flushed = false;
    while (this.dirty) {
      this.dirty = false;
      this.inFlight = this.flush();
      try {
        await this.inFlight;
      } finally {
        this.inFlight = null;
      }
      flushed = true;
    }

    return flushed;
  }
}