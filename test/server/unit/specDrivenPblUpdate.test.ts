import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import type { ApiSafeEditPlan } from '../../../src/shared/publicApi';
import { applySpecDrivenPblUpdate } from '../../../src/server/build/specDrivenPblUpdate';
import { readOrcaStagingExportState } from '../../../src/server/build/orcaStagingExport';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import { RuntimeJournal } from '../../../src/server/runtime/runtimeJournal';
import type { FileStat, IFileSystem } from '../../../src/server/system/fileSystem';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

suite('unit/specDrivenPblUpdate (B199)', () => {
  test('exporta fresco, aplica edits explícitos sobre staging e importa la PBL', async () => {
    const fs = new FakeFileSystem();
    const workspaceState = new WorkspaceState();
    const journal = new RuntimeJournal();
    const libraryUri = 'file:///c:/workspace/legacy/app.pbl';
    const sourceRootUri = 'file:///c:/workspace/source';
    const sourceUri = `${sourceRootUri}/w_main.srw`;

    await fs.writeFile(libraryUri, 'binary-pbl-v1');
    await fs.createDirectory(sourceRootUri);
    await fs.writeFile(sourceUri, 'forward\r\nend forward');
    workspaceState.addRoot('libraries', libraryUri);
    workspaceState.registerLibrarySourceAlias(libraryUri, sourceRootUri);
    workspaceState.addSourceFile(sourceUri, 'manual-export-source');
    workspaceState.refreshProjectRouting();

    const document = TextDocument.create(sourceUri, 'powerbuilder', 1, 'forward\r\nend forward');
    const runOrcaCalls: string[] = [];

    const result = await applySpecDrivenPblUpdate(document, {
      uri: sourceUri,
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
      edits: [{ uri: sourceUri, content: 'forward\r\n// spec update\r\nend forward' }],
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
      kb: new KnowledgeBase(),
      graph: new InheritanceGraph(new KnowledgeBase()),
      systemCatalog: new SystemCatalog(),
      runOrca: async (orcaRequest) => {
        runOrcaCalls.push(orcaRequest.scriptUri);
        if (orcaRequest.scriptUri.endsWith('export-to-staging.orc')) {
          const exportState = await readOrcaStagingExportState({
            workspaceFolders: ['file:///c:/workspace'],
            fs,
            focusUri: sourceUri,
          });
          await fs.writeFile(`${exportState.exportedLibraries[0]?.stagingDirectoryUri}/w_main.srw`, 'forward\r\nend forward');
        }
        return {
          snapshot: {
            state: 'succeeded',
            scriptUri: orcaRequest.scriptUri,
            executablePath: orcaRequest.executablePath,
          },
          output: 'Compile completed successfully.',
        };
      },
      loadSource: async (uri) => fs.readFile(uri),
      journal,
      journalUri: 'file:///c:/workspace/.vsc-powersyntax/runtime/build-orca-journal.json',
      buildPlan: async () => buildAvailablePlan(sourceUri),
    });

    assert.equal(result.blocked, false);
    assert.equal(result.appliedEdits.length, 1);
    assert.equal(result.appliedEdits[0]?.sourceUri, sourceUri);
    assert.ok(result.appliedEdits[0]?.stagingUri.endsWith('/w_main.srw'));
    assert.equal(runOrcaCalls.length, 2);
    assert.equal(result.importResult?.blocked, false);
    assert.equal(await fs.readFile(result.appliedEdits[0]?.stagingUri ?? ''), 'forward\r\n// spec update\r\nend forward');
    assert.equal(result.journalUri, 'file:///c:/workspace/.vsc-powersyntax/runtime/build-orca-journal.json');
  });

  test('bloquea el workflow cuando el edit queda fuera del safe edit plan', async () => {
    const fs = new FakeFileSystem();
    const workspaceState = new WorkspaceState();
    const document = TextDocument.create('file:///c:/workspace/source/w_main.srw', 'powerbuilder', 1, 'forward\r\nend forward');
    let runOrcaCalls = 0;

    const result = await applySpecDrivenPblUpdate(document, {
      uri: 'file:///c:/workspace/source/w_main.srw',
      executablePath: 'C:/Tools/pborca.exe',
      sessionLibrary: 'pborc250.dll',
      edits: [{ uri: 'file:///c:/workspace/source/otro.srw', content: 'x' }],
    }, {
      workspaceFolders: ['file:///c:/workspace'],
      workspaceState,
      fs,
      kb: new KnowledgeBase(),
      graph: new InheritanceGraph(new KnowledgeBase()),
      systemCatalog: new SystemCatalog(),
      runOrca: async () => {
        runOrcaCalls++;
        throw new Error('No debería ejecutarse ORCA cuando el plan está bloqueado.');
      },
      loadSource: async () => null,
      buildPlan: async () => buildAvailablePlan('file:///c:/workspace/source/w_main.srw'),
    });

    assert.equal(result.blocked, true);
    assert.ok(result.blockedReasons.some((reason) => reason.includes('fuera del safe edit plan')));
    assert.equal(runOrcaCalls, 0);
  });
});

function buildAvailablePlan(uri: string): ApiSafeEditPlan {
  return {
    available: true,
    blocked: false,
    objects: [],
    files: [{ uri, reason: 'Objeto foco', risk: 'medium' }],
    risks: [],
    recommendedTests: [],
    docsToReview: [],
    blockedReasons: [],
  };
}

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

function parentUri(uri: string): string {
  const trimmed = uri.replace(/\/+$/, '');
  const lastSlash = trimmed.lastIndexOf('/');
  if (lastSlash <= 'file:///c:'.length) {
    return 'file:///c:';
  }
  return trimmed.slice(0, lastSlash);
}

function nameOf(uri: string): string {
  const trimmed = uri.replace(/\/+$/, '');
  const lastSlash = trimmed.lastIndexOf('/');
  return lastSlash >= 0 ? trimmed.slice(lastSlash + 1) : trimmed;
}
