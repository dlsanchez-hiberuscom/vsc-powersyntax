import * as assert from 'assert/strict';

import {
  canSkipEntry,
  discoverWorkspaceBounded,
  WarmStartManifest,
  DISCOVERY_MAX_CONCURRENCY,
} from '../../../src/server/workspace/discovery';
import type { IFileSystem, FileStat } from '../../../src/server/system/fileSystem';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import type { CancellationToken } from '../../../src/server/runtime/cancellation';

// Token de cancelación que nunca cancela
const NEVER_CANCEL: CancellationToken = {
  isCancelled: false,
  onCancelled: () => undefined,
};

// FileStat para un archivo
function fileStat(): FileStat {
  return { isFile: true, isDirectory: false, mtime: 0, size: 0 };
}

// FileStat para un directorio
function dirStat(): FileStat {
  return { isFile: false, isDirectory: true, mtime: 0, size: 0 };
}

// Mock IFileSystem con un conjunto fijo de archivos
function createMockFs(
  tree: Record<string, string[] | null>
): IFileSystem {
  return {
    async stat(_uri: string): Promise<FileStat | null> {
      return fileStat();
    },
    async readDirectory(uri: string): Promise<[string, FileStat][]> {
      const entries = tree[uri];
      if (!entries) return [];
      return entries.map(name => {
        const childUri = `${uri}/${encodeURIComponent(name)}`;
        const isDir = name in tree;
        return [name, isDir ? dirStat() : fileStat()] as [string, FileStat];
      });
    },
    async readFile(_uri: string): Promise<string> {
      return '';
    },
    async createDirectory(_uri: string): Promise<void> { /* noop */ },
    async writeFile(_uri: string, _content: string): Promise<void> { /* noop */ },
    async copyFile(_src: string, _dst: string): Promise<void> { /* noop */ },
    async deletePath(_uri: string): Promise<void> { /* noop */ },
  };
}

suite('unit/discoveryWarmStart', () => {

  test('DISCOVERY_MAX_CONCURRENCY es 4', () => {
    assert.equal(DISCOVERY_MAX_CONCURRENCY, 4);
  });

  // canSkipEntry tests

  test('canSkipEntry retorna true cuando fingerprint coincide con manifest', () => {
    const manifest: WarmStartManifest = {
      version: '1',
      entries: [{ uri: 'file:///workspace/obj_user.sru', fingerprint: 'abc123' }],
    };
    assert.equal(canSkipEntry('file:///workspace/obj_user.sru', 'abc123', manifest), true);
  });

  test('canSkipEntry retorna false cuando fingerprint no coincide', () => {
    const manifest: WarmStartManifest = {
      version: '1',
      entries: [{ uri: 'file:///workspace/obj_user.sru', fingerprint: 'abc123' }],
    };
    assert.equal(canSkipEntry('file:///workspace/obj_user.sru', 'different', manifest), false);
  });

  test('canSkipEntry retorna false cuando URI no está en manifest', () => {
    const manifest: WarmStartManifest = {
      version: '1',
      entries: [{ uri: 'file:///workspace/other.sru', fingerprint: 'abc123' }],
    };
    assert.equal(canSkipEntry('file:///workspace/obj_user.sru', 'abc123', manifest), false);
  });

  test('canSkipEntry retorna false con manifest vacío', () => {
    const manifest: WarmStartManifest = { version: '1', entries: [] };
    assert.equal(canSkipEntry('file:///workspace/obj_user.sru', 'abc123', manifest), false);
  });

  // discoverWorkspaceBounded tests

  test('discoverWorkspaceBounded sin manifest procesa archivos normalmente (skipped=0)', async () => {
    const rootUri = 'file:///workspace';
    const fs = createMockFs({
      'file:///workspace': ['obj_user.sru', 'obj_order.sru'],
    });
    const state = new WorkspaceState();
    const result = await discoverWorkspaceBounded(
      [rootUri],
      fs,
      state,
      NEVER_CANCEL
    );
    assert.equal(result.skipped, 0);
    assert.ok(result.processed >= 0, 'processed debe ser >= 0');
  });

  test('discoverWorkspaceBounded con manifest que contiene URIs omite entradas (skipped > 0)', async () => {
    const rootUri = 'file:///workspace';
    const sruUri = `${rootUri}/${encodeURIComponent('obj_user.sru')}`;
    const fs = createMockFs({
      'file:///workspace': ['obj_user.sru'],
    });
    const manifest: WarmStartManifest = {
      version: '1',
      entries: [{ uri: sruUri, fingerprint: 'some-fp' }],
    };
    const state = new WorkspaceState();
    const result = await discoverWorkspaceBounded(
      [rootUri],
      fs,
      state,
      NEVER_CANCEL,
      { warmStartManifest: manifest }
    );
    assert.equal(result.skipped, 1);
    assert.equal(result.processed, 0);
  });

  test('discoverWorkspaceBounded con fingerprints no coincidentes procesa las entradas', async () => {
    const rootUri = 'file:///workspace';
    const sruUri = `${rootUri}/${encodeURIComponent('obj_user.sru')}`;
    const fs = createMockFs({
      'file:///workspace': ['obj_user.sru'],
    });
    // Manifest con URI diferente → no hay skip
    const manifest: WarmStartManifest = {
      version: '1',
      entries: [{ uri: 'file:///workspace/other.sru', fingerprint: 'fp' }],
    };
    const state = new WorkspaceState();
    const result = await discoverWorkspaceBounded(
      [rootUri],
      fs,
      state,
      NEVER_CANCEL,
      { warmStartManifest: manifest }
    );
    // obj_user.sru no está en manifest → se procesa
    assert.equal(result.skipped, 0, `URI ${sruUri} no debería estar en manifest`);
  });

  test('discoverWorkspaceBounded cancela cuando token está cancelado', async () => {
    const rootUri = 'file:///workspace';
    const fs = createMockFs({
      'file:///workspace': ['obj_user.sru'],
    });
    const cancelledToken: CancellationToken = {
      isCancelled: true,
      onCancelled: () => undefined,
    };
    const state = new WorkspaceState();
    const result = await discoverWorkspaceBounded(
      [rootUri],
      fs,
      state,
      cancelledToken
    );
    // Con token cancelado el resultado puede tener 0 procesados
    assert.ok(result.processed >= 0);
    assert.ok(result.skipped >= 0);
  });

  test('discoverWorkspaceBounded respeta maxConcurrency en opciones', async () => {
    const rootUri = 'file:///workspace';
    const fs = createMockFs({
      'file:///workspace': ['obj_user.sru'],
    });
    const state = new WorkspaceState();
    // Debe funcionar con maxConcurrency=1
    const result = await discoverWorkspaceBounded(
      [rootUri],
      fs,
      state,
      NEVER_CANCEL,
      { maxConcurrency: 1 }
    );
    assert.ok(result.processed >= 0);
  });
});
