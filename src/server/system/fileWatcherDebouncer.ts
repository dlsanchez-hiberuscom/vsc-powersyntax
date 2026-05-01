/**
 * File watcher debouncer (Spec 043 / B127).
 *
 * Coalesce events per URI within a debounce window. Keeps last event
 * type per URI; flushes once the window settles.
 *
 * @module system/fileWatcherDebouncer
 */

export type FsEventKind = 'change' | 'create' | 'delete';

export interface FsEvent {
  uri: string;
  kind: FsEventKind;
}

export interface FileWatcherDebouncerOptions {
  delayMs: number;
  maxPending?: number;
  onFlush: (events: FsEvent[]) => void;
}

export interface FileWatcherDebouncerStats {
  pending: number;
  flushes: number;
  coalesced: number;
  backpressureFlushes: number;
}

export interface FileWatcherDebouncer {
  push(event: FsEvent): void;
  dispose(): void;
  /** For tests: forces immediate flush. */
  flushNow(): void;
  getStats(): FileWatcherDebouncerStats;
}

export function createFileWatcherDebouncer(opts: FileWatcherDebouncerOptions): FileWatcherDebouncer {
  const pending = new Map<string, FsEventKind>();
  let timer: NodeJS.Timeout | null = null;
  let flushes = 0;
  let coalesced = 0;
  let backpressureFlushes = 0;
  const maxPending = opts.maxPending ?? 256;

  function flush(): void {
    if (pending.size === 0) return;
    const events: FsEvent[] = [];
    for (const [uri, kind] of pending) events.push({ uri, kind });
    pending.clear();
    timer = null;
    flushes++;
    opts.onFlush(events);
  }

  function schedule(): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, opts.delayMs);
  }

  return {
    push(event: FsEvent): void {
      if (!pending.has(event.uri) && pending.size >= maxPending) {
        backpressureFlushes++;
        flush();
      }

      // Reglas de fusión: delete > create > change. Delete final descarta
      // todo lo previo. Create+change → create. Change repetido → change.
      const prev = pending.get(event.uri);
      let next = event.kind;
      if (prev === 'delete' && event.kind !== 'create') next = 'delete';
      else if (prev === 'create' && event.kind === 'change') next = 'create';
      if (prev !== undefined) {
        coalesced++;
      }
      pending.set(event.uri, next);
      schedule();
    },
    flushNow(): void {
      if (timer) { clearTimeout(timer); timer = null; }
      flush();
    },
    dispose(): void {
      if (timer) { clearTimeout(timer); timer = null; }
      pending.clear();
    },
    getStats(): FileWatcherDebouncerStats {
      return {
        pending: pending.size,
        flushes,
        coalesced,
        backpressureFlushes
      };
    }
  };
}
