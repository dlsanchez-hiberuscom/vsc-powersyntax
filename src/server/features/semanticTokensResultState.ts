/**
 * Estado de resultados de semantic tokens con delta/resultId versionado y evicción LRU.
 *
 * Almacena hasta MAX_ENTRIES entradas por URI. Cuando se supera el límite,
 * se desaloja la entrada menos recientemente usada.
 */

import * as crypto from 'node:crypto';

import type { SourceOrigin } from '../../shared/sourceOrigin';

const MAX_ENTRIES = 100;

export interface SemanticTokensResultStateDescriptor {
  sourceOrigin?: SourceOrigin;
  legendVersion?: string;
}

export interface SemanticTokensResultStateEntry {
  uri: string;
  documentVersion: number;
  fingerprint: string | number;
  kbVersion: number;
  sourceOrigin?: SourceOrigin;
  legendVersion?: string;
  createdAt: number;
  resultId: string;
  payloadHash: string;
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
    data: readonly number[],
    descriptor?: SemanticTokensResultStateDescriptor,
  ): string {
    const payloadHash = this.computePayloadHash(data);
    const resultId = this.computeResultId(
      uri,
      documentVersion,
      fingerprint,
      kbVersion,
      payloadHash,
      descriptor,
    );
    const entry: SemanticTokensResultStateEntry = {
      uri,
      documentVersion,
      fingerprint,
      kbVersion,
      ...(descriptor?.sourceOrigin ? { sourceOrigin: descriptor.sourceOrigin } : {}),
      ...(descriptor?.legendVersion ? { legendVersion: descriptor.legendVersion } : {}),
      createdAt: Date.now(),
      resultId,
      payloadHash,
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
    kbVersion: number,
    descriptor?: SemanticTokensResultStateDescriptor,
  ): boolean {
    return (
      entry.documentVersion === documentVersion &&
      entry.fingerprint === fingerprint &&
      entry.kbVersion === kbVersion &&
      entry.sourceOrigin === descriptor?.sourceOrigin &&
      entry.legendVersion === descriptor?.legendVersion
    );
  }

  computeResultId(
    uri: string,
    documentVersion: number,
    fingerprint: string | number,
    kbVersion: number,
    payloadHash = '',
    descriptor?: SemanticTokensResultStateDescriptor,
  ): string {
    const raw = [
      uri,
      documentVersion,
      fingerprint,
      kbVersion,
      descriptor?.sourceOrigin ?? '',
      descriptor?.legendVersion ?? '',
      payloadHash,
    ].join('|');
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
    compute: () => readonly number[],
    descriptor?: SemanticTokensResultStateDescriptor,
  ): { data: readonly number[]; resultId: string; wasFull: boolean } {
    const cached = this.get(uri, previousResultId);
    if (cached && this.isCompatible(cached, documentVersion, fingerprint, kbVersion, descriptor)) {
      return { data: cached.data, resultId: cached.resultId, wasFull: false };
    }
    const data = compute();
    const resultId = this.store(uri, documentVersion, fingerprint, kbVersion, data, descriptor);
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

  private computePayloadHash(data: readonly number[]): string {
    return crypto.createHash('sha1').update(Buffer.from(JSON.stringify(data))).digest('hex').slice(0, 16);
  }
}
