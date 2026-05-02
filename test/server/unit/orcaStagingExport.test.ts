import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { buildSemanticWorkspaceManifest } from '../../../src/server/features/semanticWorkspaceManifest';
import { prepareOrcaStagingExport, restoreOrcaStagingAliases } from '../../../src/server/build/orcaStagingExport';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import type { FileStat, IFileSystem } from '../../../src/server/system/fileSystem';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

class FakeFileSystem implements IFileSystem {
  private readonly files = new Map<string, string>();
  private readonly directories = new Map<string, Set<string>>();

  constructor() {
    this.ensureDirectory('file:///c:');
    this.ensureDirectory('file:///c:/workspace');
    this.ensureDirectory('file:///c:/workspace/legacy');
  }

  async stat(uri: string): Promise<FileStat | null> {
    if (this.files.has(uri)) {
      return { isFile: true, isDirectory: false, mtime: 0, size: this.files.get(uri)?.length ?? 0 };
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
  }

  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    const content = await this.readFile(sourceUri);
    await this.writeFile(targetUri, content);
  }

  async deletePath(uri: string): Promise<void> {
    if (this.files.delete(uri)) {
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

suite('unit/orcaStagingExport (B191)', () => {
  test('prepara staging pbl-only y asocia aliases al grafo legacy original', async () => {
    const fs = new FakeFileSystem();
    const workspaceState = new WorkspaceState();
    const libraryUri = 'file:///c:/workspace/legacy/app.pbl';

    await fs.writeFile(libraryUri, 'binary-pbl');
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

    assert.equal(prepared.exportedLibraries.length, 1);
    assert.match(prepared.scriptUri, /export-to-staging\.orc$/i);
    assert.match(prepared.stateUri, /last-export\.state$/i);
    assert.equal(prepared.exportedLibraries[0]?.libraryUri, libraryUri);
    assert.match(prepared.exportedLibraries[0]?.stagingDirectoryUri ?? '', /orca-staging/i);
    assert.ok(
      !(prepared.exportedLibraries[0]?.stagingDirectoryUri ?? '').toLowerCase().endsWith('.pbl'),
      'La carpeta staging no debe parecer una librería .pbl independiente.'
    );

    const script = await fs.readFile(prepared.scriptUri);
    assert.match(script, /session begin pborc250\.dll/i);
    assert.match(script, /export/i);
    assert.match(script, /orca-staging/i);

    const stagedFileUri = `${prepared.exportedLibraries[0]!.stagingDirectoryUri}/w_main.srw`;
    workspaceState.addSourceFile(stagedFileUri, 'orca-staging');
    workspaceState.refreshProjectRouting();

    const projectContext = workspaceState.getProjectContextForFile(stagedFileUri);
    assert.equal(projectContext?.projectUri, libraryUri);
    assert.equal(workspaceState.resolveLibraryForFile(stagedFileUri, projectContext?.libraries), libraryUri);
  });

  test('restaura aliases ORCA desde el estado persistido y mantiene library/project en el manifest', async () => {
    const fs = new FakeFileSystem();
    const libraryUri = 'file:///c:/workspace/legacy/app.pbl';

    await fs.writeFile(libraryUri, 'binary-pbl');
    const exportingState = new WorkspaceState();
    exportingState.addRoot('libraries', libraryUri);
    exportingState.refreshProjectRouting();

    const prepared = await prepareOrcaStagingExport({
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState: exportingState,
      fs,
    });

    const restoredState = new WorkspaceState();
    restoredState.addRoot('libraries', libraryUri);
    await restoreOrcaStagingAliases(['file:///c:/workspace'], fs, restoredState);

    const stagedFileUri = `${prepared.exportedLibraries[0]!.stagingDirectoryUri}/w_main.srw`;
    restoredState.addSourceFile(stagedFileUri, 'orca-staging');
    restoredState.refreshProjectRouting();

    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    const document = TextDocument.create(stagedFileUri, 'powerbuilder-window', 1, [
      'forward',
      'global type w_main from window',
      'end type',
      'end forward',
      'global type w_main from window',
      'end type'
    ].join('\r\n'));
    const analysis = analyzeDocument(document, { sourceOrigin: 'orca-staging' });
    kb.upsertDocument(stagedFileUri, analysis.semanticFacts, analysis.scopes, analysis.snapshot);

    const manifest = buildSemanticWorkspaceManifest(undefined, kb, graph, restoredState, null, {});
    assert.equal(manifest.projects.length, 1);
    assert.equal(manifest.objects[0]?.projectUri, libraryUri);
    assert.equal(manifest.objects[0]?.library, libraryUri);
    assert.equal(manifest.objects[0]?.sourceOrigin, 'orca-staging');
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