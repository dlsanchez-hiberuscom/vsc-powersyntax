export interface CodeLensResultCacheStats {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
}

interface CacheEntry<T> {
  key: string;
  value: T;
}

export class CodeLensResultCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly counters = { hits: 0, misses: 0, evictions: 0 };

  constructor(private readonly capacity: number) {}

  get(uri: string, key: string): T | undefined {
    const cached = this.entries.get(uri);
    if (!cached || cached.key !== key) {
      this.counters.misses++;
      return undefined;
    }

    this.entries.delete(uri);
    this.entries.set(uri, cached);
    this.counters.hits++;
    return cached.value;
  }

  set(uri: string, key: string, value: T): void {
    if (this.capacity <= 0) {
      return;
    }

    if (this.entries.has(uri)) {
      this.entries.delete(uri);
    } else if (this.entries.size >= this.capacity) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) {
        this.entries.delete(oldest);
        this.counters.evictions++;
      }
    }

    this.entries.set(uri, { key, value });
  }

  invalidate(uri?: string): void {
    if (uri === undefined) {
      this.entries.clear();
      return;
    }
    this.entries.delete(uri);
  }

  getStats(): CodeLensResultCacheStats {
    return {
      size: this.entries.size,
      capacity: this.capacity,
      ...this.counters,
    };
  }
}