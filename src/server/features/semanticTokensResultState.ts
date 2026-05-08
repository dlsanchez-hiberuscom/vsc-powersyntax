/**
 * Estado de resultados de semantic tokens con delta/resultId versionado y evicción LRU.
 *
 * Almacena hasta MAX_ENTRIES entradas por URI. Cuando se supera el límite,
 * se desaloja la entrada menos recientemente usada.
 */

import * as crypto from 'node:crypto';

const MAX_ENTRIES = 100;

export interface SemanticTokensResultStateEntry {
  uri: string;
  documentVersion: number;
  fingerprint: string | number;
  kbVersion: number;
  resultId: string;
  data: readonly number[];
}

export class SemanticTokensResultState {
  private readonly entries = new Map<string, SemanticTokensResultStateEntry>();
  private readonly lruOrder: string[] = [];

  store(
    uri: string,
    documentVersion: number,
    fingerprint: string | number,
    kbVersion: number,
    data: readonly number[]
  ): string {
    const resultId = this.computeResultId(uri, documentVersion, fingerprint, kbVersion);
    const entry: SemanticTokensResultStateEntry = {
      uri,
      documentVersion,
      fingerprint,
      kbVersion,
      resultId,
      data,
    };
    this.entries.set(resultId, entry);
    this.trackLru(resultId);
    this.evictOverflow();
    return resultId;
  }

  get(uri: string, previousResultId: string | undefined): SemanticTokensResultStateEntry | undefined {
    if (!previousResultId) return undefined;
    const entry = this.entries.get(previousResultId);
    if (!entry || entry.uri !== uri) return undefined;
    this.trackLru(previousResultId);
    return entry;
  }

  evict(uri: string): void {
    for (const [resultId, entry] of this.entries) {
      if (entry.uri === uri) {
        this.entries.delete(resultId);
        const idx = this.lruOrder.indexOf(resultId);
        if (idx >= 0) this.lruOrder.splice(idx, 1);
      }
    }
  }

  isCompatible(
    entry: SemanticTokensResultStateEntry,
    documentVersion: number,
    fingerprint: string | number,
    kbVersion: number
  ): boolean {
    return (
      entry.documentVersion === documentVersion &&
      entry.fingerprint === fingerprint &&
      entry.kbVersion === kbVersion
    );
  }

  computeResultId(
    uri: string,
    documentVersion: number,
    fingerprint: string | number,
    kbVersion: number
  ): string {
    const raw = `${uri}|${documentVersion}|${fingerprint}|${kbVersion}`;
    return crypto.createHash('sha1').update(raw).digest('hex').slice(0, 16);
  }

  clear(): void {
    this.entries.clear();
    this.lruOrder.length = 0;
  }

  getOrFull(
    uri: string,
    previousResultId: string | undefined,
    documentVersion: number,
    fingerprint: string | number,
    kbVersion: number,
    compute: () => readonly number[]
  ): { data: readonly number[]; resultId: string; wasFull: boolean } {
    const cached = this.get(uri, previousResultId);
    if (cached && this.isCompatible(cached, documentVersion, fingerprint, kbVersion)) {
      return { data: cached.data, resultId: cached.resultId, wasFull: false };
    }
    const data = compute();
    const resultId = this.store(uri, documentVersion, fingerprint, kbVersion, data);
    return { data, resultId, wasFull: true };
  }

  private trackLru(resultId: string): void {
    const idx = this.lruOrder.indexOf(resultId);
    if (idx >= 0) this.lruOrder.splice(idx, 1);
    this.lruOrder.push(resultId);
  }

  private evictOverflow(): void {
    while (this.entries.size > MAX_ENTRIES) {
      const oldest = this.lruOrder.shift();
      if (oldest) this.entries.delete(oldest);
    }
  }
}
