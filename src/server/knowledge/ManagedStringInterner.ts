export interface ManagedStringInternerStats {
  uniqueStrings: number;
  trackedDocuments: number;
}

export type InternString = <T extends string | undefined>(value: T) => T;

export class ManagedStringInterner {
  private pool = new Map<string, number>();
  private documentUsage = new Map<string, Map<string, number>>();

  clone(): ManagedStringInterner {
    const cloned = new ManagedStringInterner();
    cloned.pool = new Map(this.pool);
    cloned.documentUsage = new Map(
      Array.from(this.documentUsage.entries(), ([key, usage]) => [key, new Map(usage)])
    );
    return cloned;
  }

  replaceDocument<T>(documentKey: string, build: (intern: InternString) => T): T {
    const nextUsage = new Map<string, number>();
    const intern: InternString = <T extends string | undefined>(value: T): T => {
      if (value === undefined) {
        return value;
      }
      nextUsage.set(value, (nextUsage.get(value) ?? 0) + 1);
      return value;
    };

    const result = build(intern);
    this.applyDocumentUsage(documentKey, nextUsage);
    return result;
  }

  removeDocument(documentKey: string): void {
    const previousUsage = this.documentUsage.get(documentKey);
    if (!previousUsage) {
      return;
    }
    this.releaseUsage(previousUsage);
    this.documentUsage.delete(documentKey);
  }

  clear(): void {
    this.pool.clear();
    this.documentUsage.clear();
  }

  getStats(): ManagedStringInternerStats {
    return {
      uniqueStrings: this.pool.size,
      trackedDocuments: this.documentUsage.size,
    };
  }

  private applyDocumentUsage(documentKey: string, nextUsage: Map<string, number>): void {
    const previousUsage = this.documentUsage.get(documentKey);
    if (previousUsage) {
      this.releaseUsage(previousUsage);
    }

    if (nextUsage.size === 0) {
      this.documentUsage.delete(documentKey);
      return;
    }

    for (const [value, count] of nextUsage.entries()) {
      this.pool.set(value, (this.pool.get(value) ?? 0) + count);
    }

    this.documentUsage.set(documentKey, nextUsage);
  }

  private releaseUsage(usage: Map<string, number>): void {
    for (const [value, count] of usage.entries()) {
      const remaining = (this.pool.get(value) ?? 0) - count;
      if (remaining > 0) {
        this.pool.set(value, remaining);
      } else {
        this.pool.delete(value);
      }
    }
  }
}