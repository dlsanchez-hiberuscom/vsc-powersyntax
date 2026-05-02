import * as assert from 'assert/strict';

import { RuntimeJournal } from '../../../src/server/runtime/runtimeJournal';
import { BuildOrcaJournalStore } from '../../../src/server/runtime/buildOrcaJournalStore';
import type { FileStat, IFileSystem } from '../../../src/server/system/fileSystem';

suite('unit/buildOrcaJournalStore (B197)', () => {
  test('persiste solo eventos build y legacy observados desde RuntimeJournal', async () => {
    const fs = new FakeFileSystem();
    const journal = new RuntimeJournal(8);
    const store = new BuildOrcaJournalStore(fs, { maxEntries: 4, now: () => 1_700_000_001_000 });
    journal.addObserver((event) => store.record(event));

    store.configure(['file:///c:/workspace']);
    journal.record({ phase: 'query', kind: 'query-trace', action: 'definition' });
    journal.record({ phase: 'build', kind: 'pbautobuild', action: 'started', detail: { buildFileUri: 'file:///c:/workspace/app.json' } });
    journal.record({ phase: 'legacy', kind: 'orca-import', action: 'blocked', detail: { ledgerUri: 'file:///c:/workspace/.vsc-powersyntax/orca-export/state/last-import-ledger.json' } });
    await store.flush();

    assert.ok(store.storageUri?.endsWith('/.vsc-powersyntax/runtime/build-orca-journal.json'));
    const persisted = await fs.readJson<{ snapshot: { total: number; events: Array<{ phase: string; kind: string; action: string }> } }>(store.storageUri ?? '');
    assert.equal(persisted.snapshot.total, 2);
    assert.deepEqual(persisted.snapshot.events.map((event) => [event.phase, event.kind, event.action]), [
      ['build', 'pbautobuild', 'started'],
      ['legacy', 'orca-import', 'blocked'],
    ]);
  });

  test('restaura el snapshot persistido y mantiene ring buffer para eventos build/legacy', async () => {
    const fs = new FakeFileSystem();
    const bootstrapStore = new BuildOrcaJournalStore(fs);
    bootstrapStore.configure(['file:///c:/workspace']);
    await bootstrapStore.flush();
    const storageUri = bootstrapStore.storageUri ?? '';

    await fs.writeFile(storageUri, JSON.stringify({
      schemaVersion: 1,
      updatedAt: 1_700_000_000_000,
      snapshot: {
        total: 2,
        dropped: 0,
        events: [
          { ts: 10, phase: 'build', kind: 'pbautobuild', action: 'started' },
          { ts: 20, phase: 'legacy', kind: 'orca-export', action: 'completed' },
        ],
      },
    }, null, 2));

    const journal = new RuntimeJournal(8);
    const store = new BuildOrcaJournalStore(fs, { maxEntries: 2, now: () => 1_700_000_002_000 });
    journal.addObserver((event) => store.record(event));

    store.configure(['file:///c:/workspace']);
    journal.record({ ts: 30, phase: 'legacy', kind: 'orca-build', action: 'completed' });
    await store.flush();

    const persisted = await fs.readJson<{ snapshot: { total: number; dropped: number; events: Array<{ ts: number; action: string }> } }>(storageUri);
    assert.equal(persisted.snapshot.total, 3);
    assert.equal(persisted.snapshot.dropped, 1);
    assert.deepEqual(persisted.snapshot.events.map((event) => [event.ts, event.action]), [
      [20, 'completed'],
      [30, 'completed'],
    ]);
  });
});

class FakeFileSystem implements IFileSystem {
  private readonly files = new Map<string, string>();
  private readonly directories = new Set<string>(['file:///']);

  async stat(uri: string): Promise<FileStat | null> {
    if (this.files.has(uri)) {
      return {
        isFile: true,
        isDirectory: false,
        mtime: 0,
        size: Buffer.byteLength(this.files.get(uri) ?? '', 'utf8'),
      };
    }
    if (this.directories.has(uri)) {
      return { isFile: false, isDirectory: true, mtime: 0, size: 0 };
    }
    return null;
  }

  async readDirectory(uri: string): Promise<[string, FileStat][]> {
    const prefix = uri.endsWith('/') ? uri : `${uri}/`;
    const entries = new Map<string, FileStat>();

    for (const directory of this.directories) {
      if (!directory.startsWith(prefix) || directory === uri) {
        continue;
      }
      const name = directory.slice(prefix.length).split('/')[0];
      if (!name) {
        continue;
      }
      entries.set(name, { isFile: false, isDirectory: true, mtime: 0, size: 0 });
    }

    for (const [fileUri, content] of this.files.entries()) {
      if (!fileUri.startsWith(prefix)) {
        continue;
      }
      const name = fileUri.slice(prefix.length).split('/')[0];
      if (!name) {
        continue;
      }
      entries.set(name, { isFile: true, isDirectory: false, mtime: 0, size: Buffer.byteLength(content, 'utf8') });
    }

    return [...entries.entries()];
  }

  async readFile(uri: string): Promise<string> {
    const content = this.files.get(uri);
    if (content === undefined) {
      throw new Error(`Archivo inexistente: ${uri}`);
    }
    return content;
  }

  async createDirectory(uri: string): Promise<void> {
    this.ensureDirectory(uri);
  }

  async writeFile(uri: string, content: string): Promise<void> {
    this.ensureDirectory(parentDirectoryUri(uri));
    this.files.set(uri, content);
  }

  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    await this.writeFile(targetUri, await this.readFile(sourceUri));
  }

  async deletePath(uri: string): Promise<void> {
    this.files.delete(uri);
    this.directories.delete(uri);
  }

  async readJson<T>(uri: string): Promise<T> {
    return JSON.parse(await this.readFile(uri)) as T;
  }

  private ensureDirectory(uri: string): void {
    if (!uri) {
      return;
    }

    const normalized = uri.endsWith('/') ? uri.slice(0, -1) : uri;
    if (!normalized) {
      return;
    }
    this.directories.add(normalized);
  }
}

function parentDirectoryUri(uri: string): string {
  const normalized = uri.endsWith('/') ? uri.slice(0, -1) : uri;
  const lastSlash = normalized.lastIndexOf('/');
  if (lastSlash <= 'file:///'.length - 1) {
    return 'file:///';
  }
  return normalized.slice(0, lastSlash);
}