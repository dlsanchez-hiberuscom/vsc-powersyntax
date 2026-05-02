import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { collectReferenceSourcePool } from '../../../src/server/features/referenceSourcePool';
import type { FileStat, IFileSystem } from '../../../src/server/system/fileSystem';
import { normalizeUri } from '../../../src/server/system/uriUtils';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';

class CountingFileSystem implements IFileSystem {
  readonly files = new Map<string, string>();
  readonly reads: string[] = [];

  async stat(uri: string): Promise<FileStat | null> {
    const content = this.files.get(uri);
    return content === undefined
      ? null
      : { isFile: true, isDirectory: false, size: content.length, mtime: 0 };
  }

  async readDirectory(): Promise<[string, FileStat][]> {
    return [];
  }

  async readFile(uri: string): Promise<string> {
    this.reads.push(normalizeUri(uri));
    const content = this.files.get(normalizeUri(uri)) ?? this.files.get(uri);
    if (content === undefined) {
      throw new Error(`File not found: ${uri}`);
    }
    return content;
  }

  async createDirectory(): Promise<void> {
    return;
  }

  async writeFile(uri: string, content: string): Promise<void> {
    this.files.set(normalizeUri(uri), content);
  }

  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    this.files.set(normalizeUri(targetUri), this.files.get(normalizeUri(sourceUri)) ?? this.files.get(sourceUri) ?? '');
  }

  async deletePath(uri: string): Promise<void> {
    this.files.delete(normalizeUri(uri));
  }
}

suite('unit/referenceSourcePool (B223)', () => {
  test('acota el barrido a los archivos del proyecto activo y reutiliza maskedText del snapshot', async () => {
    const fs = new CountingFileSystem();
    const workspaceState = new WorkspaceState();
    const currentUri = normalizeUri('file:///proj/lib_app.pbl/w_use.sru');
    const siblingUri = normalizeUri('file:///proj/lib_app.pbl/n_service.sru');
    const otherUri = normalizeUri('file:///proj/lib_other.pbl/n_other.sru');

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl']
      }
    });
    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/other.pbt',
        name: 'other',
        libraries: ['file:///proj/lib_other.pbl']
      }
    });
    workspaceState.addSourceFile(currentUri, 'pbl-folder-source');
    workspaceState.addSourceFile(siblingUri, 'pbl-folder-source');
    workspaceState.addSourceFile(otherUri, 'pbl-folder-source');
    workspaceState.refreshProjectRouting();

    const currentDocument = TextDocument.create(currentUri, 'powerbuilder', 1, 'event open();\r\n  of_call()\r\nend event');
    const siblingDocument = TextDocument.create(siblingUri, 'powerbuilder', 1, 'forward prototypes\r\npublic function integer of_call()\r\nend prototypes');
    const siblingSnapshot = analyzeDocument(siblingDocument).snapshot;

    await fs.writeFile(siblingUri, siblingDocument.getText());
    await fs.writeFile(otherUri, 'forward prototypes\r\npublic function integer of_else()\r\nend prototypes');

    const pool = await collectReferenceSourcePool({
      currentUri,
      resolvedTargetUris: [siblingUri],
      workspaceState,
      fs,
      getOpenDocument: (uri) => uri === currentUri ? currentDocument : undefined,
      getSnapshot: (uri) => uri === siblingUri ? siblingSnapshot : undefined
    });

    assert.equal(pool.scope, 'project');
    assert.deepEqual(pool.candidateUris, [siblingUri, currentUri]);
    assert.deepEqual(fs.reads, [siblingUri]);
    assert.equal(pool.sources.length, 2);
    assert.ok(!pool.sources.some((source) => source.uri === otherUri));
    assert.deepEqual(pool.sources.find((source) => source.uri === siblingUri)?.maskedLines, siblingSnapshot?.maskedText.lines);
  });

  test('cae al workspace completo cuando no existe routing de proyecto', async () => {
    const fs = new CountingFileSystem();
    const workspaceState = new WorkspaceState();
    const firstUri = normalizeUri('file:///workspace/a.sru');
    const secondUri = normalizeUri('file:///workspace/b.sru');

    workspaceState.addSourceFile(firstUri, 'unknown');
    workspaceState.addSourceFile(secondUri, 'unknown');

    await fs.writeFile(firstUri, 'forward\nend forward');
    await fs.writeFile(secondUri, 'forward\nend forward');

    const pool = await collectReferenceSourcePool({
      currentUri: firstUri,
      workspaceState,
      fs
    });

    assert.equal(pool.scope, 'workspace');
    assert.deepEqual(pool.candidateUris, [firstUri, secondUri]);
    assert.deepEqual(fs.reads.sort(), [firstUri, secondUri]);
  });
});