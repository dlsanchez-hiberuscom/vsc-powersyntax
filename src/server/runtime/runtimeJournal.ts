import type { ApiRuntimeJournalEvent, ApiRuntimeJournalSnapshot } from '../../shared/publicApi';

export interface RuntimeJournalRecordInput extends Omit<ApiRuntimeJournalEvent, 'ts'> {
  ts?: number;
}

function cloneJournalEvent(event: ApiRuntimeJournalEvent): ApiRuntimeJournalEvent {
  return {
    ts: event.ts,
    phase: event.phase,
    kind: event.kind,
    action: event.action,
    ...(event.severity ? { severity: event.severity } : {}),
    ...(event.label ? { label: event.label } : {}),
    ...(event.durationMs !== undefined ? { durationMs: event.durationMs } : {}),
    ...(event.hits !== undefined ? { hits: event.hits } : {}),
    ...(event.misses !== undefined ? { misses: event.misses } : {}),
    ...(event.evictions !== undefined ? { evictions: event.evictions } : {}),
    ...(event.invalidationCount !== undefined ? { invalidationCount: event.invalidationCount } : {}),
    ...(event.detail !== undefined ? { detail: structuredClone(event.detail) } : {}),
  };
}

export class RuntimeJournal {
  private readonly events: ApiRuntimeJournalEvent[] = [];
  private readonly observers: Array<(event: ApiRuntimeJournalEvent) => void> = [];
  private totalRecorded = 0;
  private dropped = 0;

  constructor(private readonly maxEntries = 128) {}

  record(event: RuntimeJournalRecordInput): void {
    const normalized: ApiRuntimeJournalEvent = {
      ts: event.ts ?? Date.now(),
      phase: event.phase,
      kind: event.kind,
      action: event.action,
      ...(event.severity ? { severity: event.severity } : {}),
      ...(event.label ? { label: event.label } : {}),
      ...(event.durationMs !== undefined ? { durationMs: event.durationMs } : {}),
      ...(event.hits !== undefined ? { hits: event.hits } : {}),
      ...(event.misses !== undefined ? { misses: event.misses } : {}),
      ...(event.evictions !== undefined ? { evictions: event.evictions } : {}),
      ...(event.invalidationCount !== undefined ? { invalidationCount: event.invalidationCount } : {}),
      ...(event.detail !== undefined ? { detail: structuredClone(event.detail) } : {}),
    };

    this.totalRecorded++;
    if (this.events.length >= this.maxEntries) {
      this.events.shift();
      this.dropped++;
    }
    this.events.push(normalized);

    if (this.observers.length > 0) {
      const cloned = cloneJournalEvent(normalized);
      for (const observer of this.observers) {
        try {
          observer(cloned);
        } catch {
          // Los observers no deben romper el hot path del journal.
        }
      }
    }
  }

  addObserver(observer: (event: ApiRuntimeJournalEvent) => void): void {
    this.observers.push(observer);
  }

  snapshot(limit = this.maxEntries): ApiRuntimeJournalSnapshot {
    return {
      total: this.totalRecorded,
      dropped: this.dropped,
      events: this.events.slice(-Math.max(0, limit)).map(cloneJournalEvent),
    };
  }

  clear(): void {
    this.events.length = 0;
    this.totalRecorded = 0;
    this.dropped = 0;
  }
}