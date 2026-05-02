import * as path from 'node:path';

import type { ApiRuntimeJournalEvent, ApiRuntimeJournalSnapshot } from '../../shared/publicApi';
import type { IFileSystem } from '../system/fileSystem';
import { fsPathToUri, uriToFsPath } from '../system/uriUtils';

interface PersistedBuildOrcaJournal {
  schemaVersion: 1;
  updatedAt: number;
  snapshot: ApiRuntimeJournalSnapshot;
}

export class BuildOrcaJournalStore {
  private snapshotState: ApiRuntimeJournalSnapshot = emptySnapshot();
  private queue: Promise<void> = Promise.resolve();
  private storageUriValue: string | undefined;

  constructor(
    private readonly fs: IFileSystem,
    private readonly options: { maxEntries?: number; now?: () => number } = {},
  ) {}

  get storageUri(): string | undefined {
    return this.storageUriValue;
  }

  configure(workspaceFolders: readonly string[]): void {
    const workspaceFolder = workspaceFolders[0];
    this.storageUriValue = workspaceFolder ? buildStorageUri(workspaceFolder) : undefined;
    this.queue = this.queue.catch(() => undefined).then(async () => {
      this.snapshotState = this.storageUriValue
        ? await readPersistedSnapshot(this.fs, this.storageUriValue)
        : emptySnapshot();
    });
  }

  record(event: ApiRuntimeJournalEvent): void {
    if (!shouldPersistEvent(event) || !this.storageUriValue) {
      return;
    }

    const storageUri = this.storageUriValue;
    const maxEntries = this.options.maxEntries ?? 128;
    const now = this.options.now ?? Date.now;
    const cloned = cloneRuntimeEvent(event);

    this.queue = this.queue.catch(() => undefined).then(async () => {
      appendEvent(this.snapshotState, cloned, maxEntries);
      const payload: PersistedBuildOrcaJournal = {
        schemaVersion: 1,
        updatedAt: now(),
        snapshot: cloneSnapshot(this.snapshotState),
      };
      await this.fs.writeFile(storageUri, JSON.stringify(payload, null, 2));
    });
  }

  async flush(): Promise<void> {
    await this.queue;
  }
}

function shouldPersistEvent(event: ApiRuntimeJournalEvent): boolean {
  return event.phase === 'build' || event.phase === 'legacy';
}

function buildStorageUri(workspaceFolderUri: string): string {
  const workspaceFsPath = uriToFsPath(workspaceFolderUri);
  if (!workspaceFsPath) {
    return '';
  }

  return fsPathToUri(path.join(workspaceFsPath, '.vsc-powersyntax', 'runtime', 'build-orca-journal.json'));
}

async function readPersistedSnapshot(fs: IFileSystem, storageUri: string): Promise<ApiRuntimeJournalSnapshot> {
  if (!storageUri) {
    return emptySnapshot();
  }

  try {
    const raw = JSON.parse(await fs.readFile(storageUri)) as Partial<PersistedBuildOrcaJournal>;
    if (raw.schemaVersion !== 1 || !raw.snapshot) {
      return emptySnapshot();
    }

    return {
      total: typeof raw.snapshot.total === 'number' ? raw.snapshot.total : 0,
      dropped: typeof raw.snapshot.dropped === 'number' ? raw.snapshot.dropped : 0,
      events: Array.isArray(raw.snapshot.events)
        ? raw.snapshot.events.filter(isRuntimeEvent).map(cloneRuntimeEvent)
        : [],
    };
  } catch {
    return emptySnapshot();
  }
}

function appendEvent(snapshot: ApiRuntimeJournalSnapshot, event: ApiRuntimeJournalEvent, maxEntries: number): void {
  snapshot.total++;
  if (snapshot.events.length >= maxEntries) {
    snapshot.events.shift();
    snapshot.dropped++;
  }
  snapshot.events.push(event);
}

function emptySnapshot(): ApiRuntimeJournalSnapshot {
  return { total: 0, dropped: 0, events: [] };
}

function cloneSnapshot(snapshot: ApiRuntimeJournalSnapshot): ApiRuntimeJournalSnapshot {
  return {
    total: snapshot.total,
    dropped: snapshot.dropped,
    events: snapshot.events.map(cloneRuntimeEvent),
  };
}

function cloneRuntimeEvent(event: ApiRuntimeJournalEvent): ApiRuntimeJournalEvent {
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

function isRuntimeEvent(value: unknown): value is ApiRuntimeJournalEvent {
  return Boolean(value)
    && typeof value === 'object'
    && typeof (value as ApiRuntimeJournalEvent).ts === 'number'
    && typeof (value as ApiRuntimeJournalEvent).phase === 'string'
    && typeof (value as ApiRuntimeJournalEvent).kind === 'string'
    && typeof (value as ApiRuntimeJournalEvent).action === 'string';
}