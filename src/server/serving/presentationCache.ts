import { normalizeUri } from '../system/uriUtils';

export interface PresentationCacheStats {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
}

function extractStructuredUri(key: string): string | null {
  const segment = key.split('|').find((entry) => entry.startsWith('uri:'));
  if (!segment) {
    return null;
  }

  return normalizeUri(decodeURIComponent(segment.slice('uri:'.length)));
}

export class PresentationCache<T> {
  private readonly entries = new Map<string, T>();
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(private readonly maxEntries = 128) {}

  get(key: string): T | undefined {
    const value = this.entries.get(key);
    if (value === undefined) {
      this.misses++;
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, value);
    this.hits++;
    return value;
  }

  set(key: string, value: T): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) {
        this.entries.delete(oldest);
        this.evictions++;
      }
    }

    this.entries.set(key, value);
  }

  invalidate(uri?: string): void {
    if (!uri) {
      this.entries.clear();
      return;
    }

    const normalized = normalizeUri(uri);
    for (const key of [...this.entries.keys()]) {
      if (extractStructuredUri(key) === normalized) {
        this.entries.delete(key);
      }
    }
  }

  size(): number {
    return this.entries.size;
  }

  getStats(): PresentationCacheStats {
    return {
      size: this.entries.size,
      capacity: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
    };
  }
}