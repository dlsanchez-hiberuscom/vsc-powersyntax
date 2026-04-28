import * as assert from 'assert/strict';
import { discoverWorkspace } from '../../../src/server/workspace/discovery';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { IFileSystem, FileStat } from '../../../src/server/system/fileSystem';
import { createCancellationSource } from '../../../src/server/runtime/cancellation';

class FakeFileSystem implements IFileSystem {
  private files: Map<string, string> = new Map();
  private dirs: Map<string, string[]> = new Map();

  addFile(uri: string) {
    this.files.set(uri, '');
    const parent = uri.substring(0, uri.lastIndexOf('/'));
    if (!this.dirs.has(parent)) {
      this.dirs.set(parent, []);
    }
    this.dirs.get(parent)!.push(uri.substring(uri.lastIndexOf('/') + 1));
  }

  addDir(uri: string) {
    this.dirs.set(uri, []);
    const parent = uri.substring(0, uri.lastIndexOf('/'));
    if (parent && !this.dirs.has(parent)) {
      this.dirs.set(parent, []);
    }
    if (parent) {
      this.dirs.get(parent)!.push(uri.substring(uri.lastIndexOf('/') + 1));
    }
  }

  async stat(uri: string): Promise<FileStat | null> {
    if (this.files.has(uri)) {
      return { isFile: true, isDirectory: false, mtime: 0, size: 0 };
    }
    if (this.dirs.has(uri)) {
      return { isFile: false, isDirectory: true, mtime: 0, size: 0 };
    }
    return null;
  }

  async readDirectory(uri: string): Promise<[string, FileStat][]> {
    const children = this.dirs.get(uri);
    if (!children) return [];

    return Promise.all(
      children.map(async (child) => {
        const childUri = `${uri}/${child}`;
        const s = await this.stat(childUri);
        return [child, s!] as [string, FileStat];
      })
    );
  }

  async readFile(uri: string): Promise<string> {
    return this.files.get(uri) || '';
  }
}

suite('unit/workspace', () => {
  test('discovery encuentra roots y archivos validos', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///workspace');
    fs.addFile('file:///workspace/app.pbw');
    fs.addFile('file:///workspace/target.pbt');
    fs.addDir('file:///workspace/lib.pbl'); // Las PBL a veces se exportan como carpetas
    fs.addFile('file:///workspace/lib.pbl/n_cst_test.sru');
    fs.addFile('file:///workspace/lib.pbl/w_test.srw');
    fs.addFile('file:///workspace/readme.md');
    fs.addDir('file:///workspace/.git');
    fs.addFile('file:///workspace/.git/config'); // No debería descubrirse
    
    await discoverWorkspace(['file:///workspace'], fs, state, cancelSource.token);

    const roots = state.getRoots();
    assert.equal(roots.workspaces.length, 1);
    assert.equal(roots.targets.length, 1);
    assert.equal(roots.libraries.length, 1);
    assert.equal(roots.workspaces[0], 'file:///workspace/app.pbw');

    const files = state.getAllSourceFiles();
    assert.equal(files.length, 2);
    assert.ok(state.hasSourceFile('file:///workspace/lib.pbl/n_cst_test.sru'));
    assert.ok(state.hasSourceFile('file:///workspace/lib.pbl/w_test.srw'));
  });

  test('discovery respeta la cancelacion cooperativa', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///workspace');
    fs.addFile('file:///workspace/1.sru');
    fs.addFile('file:///workspace/2.sru');

    // Cancelar inmediatamente
    cancelSource.cancel();

    await discoverWorkspace(['file:///workspace'], fs, state, cancelSource.token);

    const files = state.getAllSourceFiles();
    assert.equal(files.length, 0, 'No debería haber procesado archivos tras cancelar');
  });
});
