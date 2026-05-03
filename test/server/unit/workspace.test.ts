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

  async createDirectory(uri: string): Promise<void> {
    this.addDir(uri);
  }

  async writeFile(uri: string, content: string): Promise<void> {
    this.files.set(uri, content);
    const parent = uri.substring(0, uri.lastIndexOf('/'));
    if (!this.dirs.has(parent)) {
      this.dirs.set(parent, []);
    }
    const name = uri.substring(uri.lastIndexOf('/') + 1);
    if (!this.dirs.get(parent)!.includes(name)) {
      this.dirs.get(parent)!.push(name);
    }
  }

  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    await this.writeFile(targetUri, await this.readFile(sourceUri));
  }

  async deletePath(uri: string): Promise<void> {
    this.files.delete(uri);
    this.dirs.delete(uri);
  }
}

class RecordingFileSystem extends FakeFileSystem {
  readonly readOrder: string[] = [];

  override async readDirectory(uri: string): Promise<[string, FileStat][]> {
    this.readOrder.push(uri);
    return super.readDirectory(uri);
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

  test('discovery detecta solution markers (.pbsln/.pbproj) y devuelve modo solution', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///sln');
    fs.addFile('file:///sln/app.pbsln');
    fs.addFile('file:///sln/main.pbproj');
    fs.addDir('file:///sln/lib.pbl');
    fs.addFile('file:///sln/lib.pbl/n_cst_test.sru');

    await discoverWorkspace(['file:///sln'], fs, state, cancelSource.token);

    const roots = state.getRoots();
    assert.equal(roots.solutions.length, 1);
    assert.equal(roots.projects.length, 1);
    assert.equal(roots.workspaces.length, 0);
    assert.equal(state.getMode(), 'solution');
    assert.ok(state.hasSourceFile('file:///sln/lib.pbl/n_cst_test.sru'));
  });

  test('discovery devuelve modo workspace si solo hay .pbw/.pbt', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///ws');
    fs.addFile('file:///ws/app.pbw');
    fs.addFile('file:///ws/target.pbt');

    await discoverWorkspace(['file:///ws'], fs, state, cancelSource.token);

    assert.equal(state.getMode(), 'workspace');
  });

  test('discovery devuelve modo mixed si conviven workspace y solution markers', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///mix');
    fs.addFile('file:///mix/app.pbw');
    fs.addFile('file:///mix/app.pbsln');

    await discoverWorkspace(['file:///mix'], fs, state, cancelSource.token);

    assert.equal(state.getMode(), 'mixed');
  });

  test('discovery recalcula sourceOrigin por root y no contamina roots workspace con solution-source', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///workspace-root');
    fs.addFile('file:///workspace-root/app.pbw');
    fs.addDir('file:///workspace-root/src');
    fs.addFile('file:///workspace-root/src/w_workspace.srw');

    fs.addDir('file:///solution-root');
    fs.addFile('file:///solution-root/app.pbsln');
    fs.addDir('file:///solution-root/src');
    fs.addFile('file:///solution-root/src/w_solution.srw');

    await discoverWorkspace(['file:///workspace-root', 'file:///solution-root'], fs, state, cancelSource.token);

    assert.equal(state.getMode(), 'mixed');
    assert.equal(state.getSourceOrigin('file:///workspace-root/src/w_workspace.srw'), 'unknown');
    assert.equal(state.getSourceOrigin('file:///solution-root/src/w_solution.srw'), 'solution-source');
  });

  test('discovery devuelve modo unknown si no hay markers', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///empty');
    fs.addFile('file:///empty/readme.md');

    await discoverWorkspace(['file:///empty'], fs, state, cancelSource.token);

    assert.equal(state.getMode(), 'unknown');
  });

  test('discovery devuelve modo pbl-only si solo hay roots legacy .pbl', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///legacy');
    fs.addDir('file:///legacy/app.pbl');
    fs.addFile('file:///legacy/app.pbl/w_demo.srw');

    await discoverWorkspace(['file:///legacy'], fs, state, cancelSource.token);

    assert.equal(state.getMode(), 'pbl-only');
  });

  test('discovery excluye directorios .pb / build / _BackupFiles', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///proj');
    fs.addFile('file:///proj/keep.sru');
    fs.addDir('file:///proj/.pb');
    fs.addFile('file:///proj/.pb/skip.sru');
    fs.addDir('file:///proj/build');
    fs.addFile('file:///proj/build/skip.sru');
    fs.addDir('file:///proj/_BackupFiles');
    fs.addFile('file:///proj/_BackupFiles/skip.sru');

    await discoverWorkspace(['file:///proj'], fs, state, cancelSource.token);

    const files = state.getAllSourceFiles();
    assert.equal(files.length, 1);
    assert.ok(state.hasSourceFile('file:///proj/keep.sru'));
  });

  test('discovery reporta progreso monotono de directorios', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();
    const progress: Array<{ current: number; total: number }> = [];

    fs.addDir('file:///workspace');
    fs.addDir('file:///workspace/lib');
    fs.addFile('file:///workspace/lib/n_demo.sru');

    await discoverWorkspace(
      ['file:///workspace'],
      fs,
      state,
      cancelSource.token,
      (current, total) => progress.push({ current, total })
    );

    assert.deepEqual(progress[0], { current: 0, total: 1 });
    assert.ok(progress.some((entry) => entry.total === 2));
    assert.equal(progress[progress.length - 1]?.current, progress[progress.length - 1]?.total);
    for (let index = 1; index < progress.length; index++) {
      assert.ok(progress[index]!.current >= progress[index - 1]!.current);
      assert.ok(progress[index]!.total >= progress[index - 1]!.current);
    }
  });

  test('discovery procesa siblings en orden estable antes de profundizar subárboles grandes', async () => {
    const fs = new RecordingFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///workspace');
    fs.addDir('file:///workspace/plugin_old');
    fs.addDir('file:///workspace/plugin_old/deep');
    fs.addDir('file:///workspace/fixtures-local');
    fs.addFile('file:///workspace/fixtures-local/app.pbw');
    fs.addDir('file:///workspace/fixtures-local/lib.pbl');
    fs.addFile('file:///workspace/fixtures-local/lib.pbl/u_demo.sru');

    await discoverWorkspace(['file:///workspace'], fs, state, cancelSource.token);

    assert.deepEqual(fs.readOrder.slice(0, 4), [
      'file:///workspace',
      'file:///workspace/fixtures-local',
      'file:///workspace/fixtures-local/lib.pbl',
      'file:///workspace/plugin_old'
    ]);
    assert.ok(state.hasSourceFile('file:///workspace/fixtures-local/lib.pbl/u_demo.sru'));
  });

  test('refreshProjectRouting recompone registry y model desde topology + knownFiles', () => {
    const state = new WorkspaceState();

    state.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl']
      }
    });
    state.addSourceFile('file:///proj/lib_app.pbl/u_demo.sru');

    state.refreshProjectRouting();

    assert.equal(state.getProjectRegistry()?.getProjectForFile('file:///proj/lib_app.pbl/u_demo.sru'), 'file:///proj/app.pbt');
    assert.equal(state.getProjectModel()?.getProjectForFile('file:///proj/lib_app.pbl/u_demo.sru')?.projectUri, 'file:///proj/app.pbt');
  });

  test('refreshProjectRouting aísla roots con nombres duplicados sin mezclar proyectos ni librerías', () => {
    const state = new WorkspaceState();

    state.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///workspace-a/app.pbt',
        name: 'app',
        libraries: ['file:///workspace-a/lib_shared.pbl']
      }
    });
    state.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///workspace-b/app.pbt',
        name: 'app',
        libraries: ['file:///workspace-b/lib_shared.pbl']
      }
    });
    state.addSourceFile('file:///workspace-a/lib_shared.pbl/u_shared.sru', 'pbl-folder-source');
    state.addSourceFile('file:///workspace-b/lib_shared.pbl/u_shared.sru', 'pbl-folder-source');

    state.refreshProjectRouting();

    assert.deepEqual(state.getProjectRegistry()?.getAllProjects(), [
      'file:///workspace-a/app.pbt',
      'file:///workspace-b/app.pbt'
    ]);
    assert.equal(
      state.getProjectRegistry()?.getProjectForFile('file:///workspace-a/lib_shared.pbl/u_shared.sru'),
      'file:///workspace-a/app.pbt'
    );
    assert.equal(
      state.getProjectRegistry()?.getProjectForFile('file:///workspace-b/lib_shared.pbl/u_shared.sru'),
      'file:///workspace-b/app.pbt'
    );
    assert.deepEqual(state.getProjectContextForFile('file:///workspace-a/lib_shared.pbl/u_shared.sru'), {
      projectUri: 'file:///workspace-a/app.pbt',
      kind: 'target',
      name: 'app',
      libraries: ['file:///workspace-a/lib_shared.pbl'],
      files: ['file:///workspace-a/lib_shared.pbl/u_shared.sru']
    });
    assert.deepEqual(state.getProjectContextForFile('file:///workspace-b/lib_shared.pbl/u_shared.sru'), {
      projectUri: 'file:///workspace-b/app.pbt',
      kind: 'target',
      name: 'app',
      libraries: ['file:///workspace-b/lib_shared.pbl'],
      files: ['file:///workspace-b/lib_shared.pbl/u_shared.sru']
    });
  });

  test('discovery descubre y clasifica build files JSON de PBAutoBuild', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cancelSource = createCancellationSource();

    fs.addDir('file:///proj');
    await fs.writeFile('file:///proj/app.pbproj', '<library>lib_app.pbl</library>');
    await fs.writeFile(
      'file:///proj/app.build.json',
      JSON.stringify({
        MetaInfo: { IDEVersion: '25.0' },
        BuildPlan: {
          Projects: [{ Path: 'app.pbproj' }]
        }
      })
    );

    await discoverWorkspace(['file:///proj'], fs, state, cancelSource.token);
    state.refreshProjectRouting();

    assert.deepEqual(state.getBuildFiles(), [
      {
        uri: 'file:///proj/app.build.json',
        hasBuildPlan: true,
        referencedProjectUris: ['file:///proj/app.pbproj'],
        status: 'usable',
        representedProjectUri: 'file:///proj/app.pbproj'
      }
    ]);
    assert.deepEqual(state.getBuildFileSummary(), {
      total: 1,
      usable: 1,
      invalid: 0,
      ambiguous: 0
    });
  });

  test('getProjectContextForFile resume el proyecto activo desde el modelo unificado', () => {
    const state = new WorkspaceState();

    state.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl']
      }
    });
    state.addSourceFile('file:///proj/lib_app.pbl/u_demo.sru');
    state.refreshProjectRouting();

    const context = state.getProjectContextForFile('file:///proj/lib_app.pbl/u_demo.sru');

    assert.deepEqual(context, {
      projectUri: 'file:///proj/app.pbt',
      kind: 'target',
      name: 'app',
      libraries: ['file:///proj/lib_app.pbl'],
      files: ['file:///proj/lib_app.pbl/u_demo.sru']
    });
  });

  test('refreshProjectRouting sintetiza un nodo legacy para workspaces PBL-only', () => {
    const state = new WorkspaceState();

    state.addRoot('libraries', 'file:///proj/lib_legacy.pbl');
    state.addSourceFile('file:///proj/lib_legacy.pbl/u_demo.sru');
    state.addSourceFile('file:///proj/lib_legacy.pbl/w_demo.srw');

    state.refreshProjectRouting();

    assert.equal(state.getProjectRegistry()?.getProjectForFile('file:///proj/lib_legacy.pbl/u_demo.sru'), 'file:///proj/lib_legacy.pbl');
    assert.deepEqual(state.getProjectModel()?.getProjects(), [{
      projectUri: 'file:///proj/lib_legacy.pbl',
      kind: 'library',
      name: 'lib_legacy.pbl',
      libraries: ['file:///proj/lib_legacy.pbl']
    }]);
    assert.deepEqual(state.getProjectContextForFile('file:///proj/lib_legacy.pbl/w_demo.srw'), {
      projectUri: 'file:///proj/lib_legacy.pbl',
      kind: 'library',
      name: 'lib_legacy.pbl',
      libraries: ['file:///proj/lib_legacy.pbl'],
      files: [
        'file:///proj/lib_legacy.pbl/u_demo.sru',
        'file:///proj/lib_legacy.pbl/w_demo.srw'
      ]
    });
  });

  test('workspaceState marca dirty y permite marcar clean tras indexacion completa', () => {
    const state = new WorkspaceState();

    assert.equal(state.isIndexDirty(), true);

    state.markIndexClean();
    assert.equal(state.isIndexDirty(), false);

    state.addSourceFile('file:///proj/lib_app.pbl/u_demo.sru');
    assert.equal(state.isIndexDirty(), true);
  });

  test('workspaceState exporta, restaura y reemplaza snapshots de discovery', () => {
    const restored = new WorkspaceState();
    restored.addRoot('workspaces', 'file:///proj/app.pbw');
    restored.addRoot('libraries', 'file:///proj/lib_app.pbl');
    restored.addSourceFile('file:///proj/lib_app.pbl/u_demo.sru', 'pbl-folder-source');
    restored.addBuildFileCandidate({
      uri: 'file:///proj/app.build.json',
      hasBuildPlan: true,
      referencedProjectUris: ['file:///proj/app.pbw']
    });
    restored.refreshProjectRouting();

    const snapshot = restored.exportDiscoverySnapshot();

    const rehydrated = new WorkspaceState();
    rehydrated.restoreDiscoverySnapshot(snapshot);

    assert.deepEqual(rehydrated.getRoots(), snapshot.roots);
    assert.deepEqual(rehydrated.getAllSourceFiles(), snapshot.sourceFiles);
    assert.equal(rehydrated.getSourceOrigin('file:///proj/lib_app.pbl/u_demo.sru'), 'pbl-folder-source');
    assert.deepEqual(rehydrated.getBuildFiles(), snapshot.buildFiles);

    const discovered = new WorkspaceState();
    discovered.addRoot('solutions', 'file:///proj/app.pbsln');
    discovered.addSourceFile('file:///proj/lib_app.pbl/n_cst_calc.sru', 'solution-source');
    discovered.addBuildFileCandidate({
      uri: 'file:///proj/app.solution.build.json',
      hasBuildPlan: true,
      referencedProjectUris: ['file:///proj/app.pbsln']
    });
    discovered.refreshProjectRouting();

    rehydrated.replaceFrom(discovered);

    assert.deepEqual(rehydrated.getRoots(), discovered.getRoots());
    assert.deepEqual(rehydrated.getAllSourceFiles(), discovered.getAllSourceFiles());
    assert.equal(rehydrated.getSourceOrigin('file:///proj/lib_app.pbl/n_cst_calc.sru'), 'solution-source');
    assert.deepEqual(rehydrated.getBuildFiles(), discovered.getBuildFiles());
  });

  test('clear reinicia registry y project model de routing', () => {
    const state = new WorkspaceState();

    state.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl']
      }
    });
    state.addSourceFile('file:///proj/lib_app.pbl/u_demo.sru');
    state.refreshProjectRouting();

    state.clear();

    assert.equal(state.getProjectRegistry(), null);
    assert.equal(state.getProjectModel(), null);
    assert.equal(state.getProjectContextForFile('file:///proj/lib_app.pbl/u_demo.sru'), null);
  });
});
