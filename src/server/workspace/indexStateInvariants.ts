/**
 * Invariantes de estado del índice de workspace y cola serializada de escrituras a persistencia.
 */

export type IndexingPhase =
  | 'empty'
  | 'discovering'
  | 'indexing'
  | 'indexed'
  | 'restoring'
  | 'restored'
  | 'dirty';

export interface IndexStateSnapshot {
  phase: IndexingPhase;
  epoch: number;
  fingerprintMap: Map<string, string>;
  publishedSnapshotVersion: number;
  lastCheckpoint?: number;
}

export const ALLOWED_TRANSITIONS: Readonly<Record<IndexingPhase, IndexingPhase[]>> = {
  'empty': ['discovering', 'restoring'],
  'discovering': ['indexing', 'empty'],
  'indexing': ['indexed', 'dirty'],
  'indexed': ['dirty', 'discovering'],
  'restoring': ['restored', 'empty'],
  'restored': ['dirty', 'discovering', 'indexed'],
  'dirty': ['indexing', 'discovering'],
};

export class IndexStateInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IndexStateInvariantError';
  }
}

export class IndexStateInvariants {
  private snapshot: IndexStateSnapshot;

  constructor(initial: IndexStateSnapshot) {
    this.snapshot = { ...initial, fingerprintMap: new Map(initial.fingerprintMap) };
  }

  getSnapshot(): Readonly<IndexStateSnapshot> {
    return this.snapshot;
  }

  transition(
    toPhase: IndexingPhase,
    updates?: Partial<Omit<IndexStateSnapshot, 'phase'>>
  ): void {
    const allowed = ALLOWED_TRANSITIONS[this.snapshot.phase];
    if (!allowed.includes(toPhase)) {
      throw new IndexStateInvariantError(
        `Transición inválida de '${this.snapshot.phase}' a '${toPhase}'. Permitidas: [${allowed.join(', ')}]`
      );
    }
    this.snapshot = {
      ...this.snapshot,
      ...updates,
      phase: toPhase,
      fingerprintMap: updates?.fingerprintMap
        ? new Map(updates.fingerprintMap)
        : new Map(this.snapshot.fingerprintMap),
    };
  }

  isCoherent(): boolean {
    if (this.snapshot.phase === 'dirty') return false;
    if (
      (this.snapshot.phase === 'indexed' || this.snapshot.phase === 'restored') &&
      this.snapshot.publishedSnapshotVersion <= 0
    ) {
      return false;
    }
    return true;
  }

  markDirty(uri: string, newFingerprint: string): void {
    this.snapshot.fingerprintMap.set(uri, newFingerprint);
    if (this.snapshot.phase !== 'dirty') {
      const allowed = ALLOWED_TRANSITIONS[this.snapshot.phase];
      if (allowed.includes('dirty')) {
        this.snapshot = {
          ...this.snapshot,
          phase: 'dirty',
          fingerprintMap: new Map(this.snapshot.fingerprintMap),
        };
      }
    }
  }

  assertCanRestore(fingerprints: Map<string, string>): boolean {
    for (const [uri, fp] of this.snapshot.fingerprintMap) {
      if (fingerprints.get(uri) !== fp) return false;
    }
    return true;
  }
}

export class PersistenceWriteQueue {
  private chain: Promise<void> = Promise.resolve();
  private pending = 0;

  get pendingCount(): number {
    return this.pending;
  }

  enqueue(key: string, value: unknown): Promise<void> {
    this.pending++;
    const task = this.chain
      .then(() => this.executeWrite(key, value))
      .finally(() => {
        this.pending--;
      });
    this.chain = task.catch(() => undefined);
    return task;
  }

  flush(): Promise<void> {
    return this.chain.catch(() => undefined);
  }

  // Implementación concreta delegada al caller; aquí solo serializa el orden
  private executeWrite(_key: string, _value: unknown): Promise<void> {
    return Promise.resolve();
  }
}
