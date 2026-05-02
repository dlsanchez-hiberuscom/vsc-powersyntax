import * as assert from 'assert/strict';

import { prepareOrcaStagingExport } from '../../../src/server/build/orcaStagingExport';
import { runOrcaStagingImport, runOrcaWriteOperation } from '../../../src/server/build/orcaStagingImport';
import type { FileStat, IFileSystem } from '../../../src/server/system/fileSystem';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

class FakeFileSystem implements IFileSystem {
  private readonly files = new Map<string, string>();
  private readonly mtimes = new Map<string, number>();
  private readonly directories = new Map<string, Set<string>>();

  constructor() {
    this.ensureDirectory('file:///c:');
    this.ensureDirectory('file:///c:/workspace');
    this.ensureDirectory('file:///c:/workspace/legacy');
  }

  async stat(uri: string): Promise<FileStat | null> {
    if (this.files.has(uri)) {
      return {
        isFile: true,
        isDirectory: false,
        mtime: this.mtimes.get(uri) ?? 0,
        size: this.files.get(uri)?.length ?? 0,
      };
    }
    if (this.directories.has(uri)) {
      return { isFile: false, isDirectory: true, mtime: 0, size: this.directories.get(uri)?.size ?? 0 };
    }
    return null;
  }

  async readDirectory(uri: string): Promise<[string, FileStat][]> {
    const entries = [...(this.directories.get(uri) ?? [])].sort();
    return Promise.all(entries.map(async (name) => {
      const childUri = `${uri.replace(/\/+$/, '')}/${name}`;
      const stat = await this.stat(childUri);
      return [name, stat!] as [string, FileStat];
    }));
  }

  async readFile(uri: string): Promise<string> {
    const value = this.files.get(uri);
    if (value === undefined) {
      throw new Error(`Archivo inexistente: ${uri}`);
    }
    return value;
  }

  async createDirectory(uri: string): Promise<void> {
    this.ensureDirectory(uri);
  }

  async writeFile(uri: string, content: string): Promise<void> {
    const parent = parentUri(uri);
    this.ensureDirectory(parent);
    this.directories.get(parent)?.add(nameOf(uri));
    this.files.set(uri, content);
    this.mtimes.set(uri, (this.mtimes.get(uri) ?? 0) + 1);
  }

  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    await this.writeFile(targetUri, await this.readFile(sourceUri));
  }

  async deletePath(uri: string): Promise<void> {
    if (this.files.delete(uri)) {
      this.mtimes.delete(uri);
      this.directories.get(parentUri(uri))?.delete(nameOf(uri));
      return;
    }

    const children = [...(this.directories.get(uri) ?? [])];
    for (const child of children) {
      await this.deletePath(`${uri.replace(/\/+$/, '')}/${child}`);
    }
    if (this.directories.delete(uri)) {
      this.directories.get(parentUri(uri))?.delete(nameOf(uri));
    }
  }

  async readJson<T>(uri: string): Promise<T> {
    return JSON.parse(await this.readFile(uri)) as T;
  }

  bumpMtime(uri: string, amount = 10): void {
    this.mtimes.set(uri, (this.mtimes.get(uri) ?? 0) + amount);
  }

  private ensureDirectory(uri: string): void {
    if (this.directories.has(uri)) {
      return;
    }

    this.directories.set(uri, new Set());
    const parent = parentUri(uri);
    if (parent && parent !== uri) {
      this.ensureDirectory(parent);
      this.directories.get(parent)?.add(nameOf(uri));
    }
  }
}

suite('unit/orcaStagingImport (B193)', () => {
  test('ejecuta preflight, backup y ledger antes de importar staging a PBL', async () => {
    const fs = new FakeFileSystem();
    const workspaceState = new WorkspaceState();
    const libraryUri = 'file:///c:/workspace/legacy/app.pbl';
    const realSourceRootUri = 'file:///c:/workspace/real-source';
    const realSourceUri = `${realSourceRootUri}/w_main.srw`;

    await fs.writeFile(libraryUri, 'binary-pbl-v1');
    await fs.createDirectory(realSourceRootUri);
    await fs.writeFile(realSourceUri, 'forward\r\nend forward');
    workspaceState.addRoot('libraries', libraryUri);
    workspaceState.registerLibrarySourceAlias(libraryUri, realSourceRootUri);
    workspaceState.addSourceFile(realSourceUri, 'manual-export-source');
    workspaceState.refreshProjectRouting();

    const prepared = await prepareOrcaStagingExport({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
    });

    await fs.writeFile(`${prepared.exportedLibraries[0]!.stagingDirectoryUri}/w_main.srw`, 'forward\r\n// staging edit\r\nend forward');

    const runRequests: Array<{ executablePath: string; scriptUri: string; timeoutMs?: number }> = [];
    const result = await runOrcaStagingImport({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
      now: () => 1_717_171_717,
      runOrca: async (runRequest) => {
        runRequests.push(runRequest);
        await fs.writeFile(libraryUri, 'binary-pbl-v2');
        return {
          snapshot: {
            state: 'succeeded',
            scriptUri: runRequest.scriptUri,
            executablePath: runRequest.executablePath,
            detail: 'ORCA finalizó correctamente.',
          },
          output: 'Import completed\nwarning: catalog refresh pending\n',
        };
      },
    });

    assert.equal(result.blocked, false);
    assert.equal(runRequests.length, 1);
    assert.match(result.scriptUri ?? '', /import-from-staging\.orc$/i);
    assert.match(result.backupRootUri ?? '', /backups/i);
    assert.equal(result.compileResult.status, 'succeeded');
    assert.equal(result.compileResult.warnings, 1);
    assert.equal(result.importedLibraries.length, 1);
    assert.ok(result.importedLibraries[0]?.backupUri, 'El backup de la PBL debe quedar registrado.');
    assert.notEqual(
      result.importedLibraries[0]?.pblFingerprintBefore?.fingerprint,
      result.importedLibraries[0]?.pblFingerprintAfter?.fingerprint,
      'La huella de la PBL debe cambiar tras una importación simulada.'
    );

    const script = await fs.readFile(result.scriptUri!);
    assert.match(script, /session begin pborc250\.dll/i);
    assert.match(script, /import/i);

    const ledger = await fs.readJson<{ compileResult?: { status?: string }; rollbackAvailable?: boolean; libraries?: Array<{ backupUri?: string }> }>(result.ledgerUri);
    assert.equal(ledger.compileResult?.status, 'succeeded');
    assert.equal(ledger.rollbackAvailable, true);
    assert.ok(ledger.libraries?.[0]?.backupUri);
  });

  test('bloquea el import cuando la PBL cambió desde el último export', async () => {
    const fs = new FakeFileSystem();
    const workspaceState = new WorkspaceState();
    const libraryUri = 'file:///c:/workspace/legacy/app.pbl';

    await fs.writeFile(libraryUri, 'binary-pbl-v1');
    workspaceState.addRoot('libraries', libraryUri);
    workspaceState.refreshProjectRouting();

    const prepared = await prepareOrcaStagingExport({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
    });

    await fs.writeFile(`${prepared.exportedLibraries[0]!.stagingDirectoryUri}/w_main.srw`, 'forward\r\nend forward');
    fs.bumpMtime(libraryUri);

    const result = await runOrcaStagingImport({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
      now: () => 1_717_171_718,
      runOrca: async () => {
        throw new Error('runOrca no debería ejecutarse cuando el preflight falla');
      },
    });

    assert.equal(result.blocked, true);
    assert.equal(result.snapshot.state, 'idle');
    assert.equal(result.compileResult.status, 'not-run');
    assert.ok(result.preflight.issues.some((issue) => issue.code === 'fingerprint-mismatch'));

    const ledger = await fs.readJson<Record<string, unknown>>(result.ledgerUri);
    assert.ok(ledger, 'El ledger del bloqueo debe persistirse igualmente.');
  });

  test('bloquea el import cuando el source real cambió desde el último export aunque la PBL no cambie', async () => {
    const fs = new FakeFileSystem();
    const workspaceState = new WorkspaceState();
    const libraryUri = 'file:///c:/workspace/legacy/app.pbl';
    const realSourceRootUri = 'file:///c:/workspace/real-source';
    const realSourceUri = `${realSourceRootUri}/w_main.srw`;

    await fs.writeFile(libraryUri, 'binary-pbl-v1');
    await fs.createDirectory(realSourceRootUri);
    await fs.writeFile(realSourceUri, 'forward\r\nend forward');
    workspaceState.addRoot('libraries', libraryUri);
    workspaceState.registerLibrarySourceAlias(libraryUri, realSourceRootUri);
    workspaceState.addSourceFile(realSourceUri, 'manual-export-source');
    workspaceState.refreshProjectRouting();

    const prepared = await prepareOrcaStagingExport({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
    });

    await fs.writeFile(`${prepared.exportedLibraries[0]!.stagingDirectoryUri}/w_main.srw`, 'forward\r\n// staged edit\r\nend forward');
    await fs.writeFile(realSourceUri, 'forward\r\n// real source changed\r\nend forward');

    const result = await runOrcaStagingImport({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
      now: () => 1_717_171_718,
      runOrca: async () => {
        throw new Error('runOrca no debería ejecutarse cuando el source real invalidó el staging');
      },
    });

    assert.equal(result.blocked, true);
    assert.equal(result.snapshot.state, 'idle');
    assert.ok(result.preflight.issues.some((issue) => issue.code === 'stale-staging'));
  });

  test('regenerate reutiliza preflight, backup y genera un script ORCA específico', async () => {
    const fs = new FakeFileSystem();
    const workspaceState = new WorkspaceState();
    const libraryUri = 'file:///c:/workspace/legacy/app.pbl';

    await fs.writeFile(libraryUri, 'binary-pbl-v1');
    workspaceState.addRoot('libraries', libraryUri);
    workspaceState.refreshProjectRouting();

    await prepareOrcaStagingExport({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
    });

    const result = await runOrcaWriteOperation({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
      operation: 'regenerate',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
      now: () => 1_717_171_719,
      runOrca: async (runRequest) => ({
        snapshot: {
          state: 'succeeded',
          scriptUri: runRequest.scriptUri,
          executablePath: runRequest.executablePath,
          detail: 'ORCA regenerate correcto.',
        },
        output: 'regenerate completed\n',
      }),
    });

    assert.equal(result.blocked, false);
    assert.equal(result.operation, 'regenerate');
    assert.match(result.scriptUri ?? '', /regenerate-from-staging\.orc$/i);
    assert.equal(result.compileResult.status, 'succeeded');
    assert.ok(result.backupRootUri, 'Regenerate debe conservar el backup binario.');
    assert.match(await fs.readFile(result.scriptUri!), /regenerate/i);
  });

  test('rebuild se bloquea si el export persistido solo conoce una librería sin target/project', async () => {
    const fs = new FakeFileSystem();
    const workspaceState = new WorkspaceState();
    const libraryUri = 'file:///c:/workspace/legacy/app.pbl';

    await fs.writeFile(libraryUri, 'binary-pbl-v1');
    workspaceState.addRoot('libraries', libraryUri);
    workspaceState.refreshProjectRouting();

    await prepareOrcaStagingExport({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
    });

    const result = await runOrcaWriteOperation({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
      operation: 'rebuild',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
      now: () => 1_717_171_720,
      runOrca: async () => {
        throw new Error('runOrca no debería ejecutarse cuando rebuild no tiene target persistido');
      },
    });

    assert.equal(result.blocked, true);
    assert.equal(result.operation, 'rebuild');
    assert.ok(result.preflight.issues.some((issue) => issue.code === 'missing-rebuild-target'));
  });
});

function parentUri(uri: string): string {
  const normalized = uri.replace(/\/+$/, '');
  const index = normalized.lastIndexOf('/');
  return index > 'file:///c:'.length ? normalized.slice(0, index) : normalized;
}

function nameOf(uri: string): string {
  const normalized = uri.replace(/\/+$/, '');
  return normalized.slice(normalized.lastIndexOf('/') + 1);
}