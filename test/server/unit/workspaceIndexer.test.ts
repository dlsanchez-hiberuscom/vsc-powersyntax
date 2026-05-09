import * as assert from 'assert/strict';
import {
  getIndexerStatus,
  indexWorkspace,
  prioritizeFilesForIndexing
} from '../../../src/server/indexer/workspaceIndexer';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { IndexStateInvariants } from '../../../src/server/workspace/indexStateInvariants';
import type { SemanticDocumentSnapshot } from '../../../src/server/analysis/semanticSnapshot';
import type { UnifiedProjectModel } from '../../../src/server/workspace/unifiedProjectModel';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { EntityKind, type Fact } from '../../../src/server/knowledge/types';
import { IFileSystem, FileStat } from '../../../src/server/system/fileSystem';
import { createCancellationSource } from '../../../src/server/runtime/cancellation';

class FakeFileSystem implements IFileSystem {
  files: Map<string, string> = new Map();
  async stat(uri: string): Promise<FileStat | null> {
    if (this.files.has(uri)) return { isFile: true, isDirectory: false, mtime: 0, size: 0 };
    return null;
  }
  async readDirectory(): Promise<[string, FileStat][]> {
    return [];
  }
  async readFile(uri: string): Promise<string> {
    return this.files.get(uri) ?? '';
  }
  async createDirectory(): Promise<void> {
    return;
  }
  async writeFile(uri: string, content: string): Promise<void> {
    this.files.set(uri, content);
  }
  async copyFile(sourceUri: string, targetUri: string): Promise<void> {
    this.files.set(targetUri, this.files.get(sourceUri) ?? '');
  }
  async deletePath(uri: string): Promise<void> {
    this.files.delete(uri);
  }
}

function createSnapshot(uri: string, symbols: Fact[], lines: string[] = []): SemanticDocumentSnapshot {
  return {
    uri,
    version: 1,
    fingerprint: 1,
    identity: `${uri}@1`,
    pass: 'enriched',
    readiness: 'nearby-semantic-ready',
    containerModel: {
      sections: [],
      typeBlocks: []
    },
    symbols,
    scopes: [],
    logicalStatements: [],
    maskedText: {
      lines,
      masks: lines.map(() => new Uint8Array())
    },
    controlBlocks: []
  };
}

function buildPublishedFingerprintMap(state: WorkspaceState, kb: KnowledgeBase): Map<string, string> {
  return new Map(
    state.getAllSourceFiles().map((uri) => [
      uri,
      String(kb.getDocumentSnapshot(uri)?.fingerprint ?? ''),
    ]),
  );
}

suite('unit/workspaceIndexer/progress', () => {
  test('onProgress se invoca al inicio, intermedio y final', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();

    // Crear 60 archivos para forzar al menos 2 reportes intermedios (cada 25).
    for (let i = 0; i < 60; i++) {
      const uri = `file:///proj/n_cst_${i}.sru`;
      fs.files.set(uri, `forward prototypes\nend prototypes\n`);
      state.addSourceFile(uri);
    }

    const events: Array<{ current: number; total: number }> = [];
    const cancelSource = createCancellationSource();

    await indexWorkspace(
      fs,
      cache,
      kb,
      state,
      cancelSource.token,
      undefined,
      (current: number, total: number) => events.push({ current, total })
    );

    // Debe incluir al menos: inicio (0), 25, 50 y final (60).
    assert.ok(events.length >= 4, `esperaba >=4 eventos, recibí ${events.length}`);
    assert.equal(events[0]!.current, 0);
    assert.equal(events[0]!.total, 60);
    assert.equal(events[events.length - 1]!.current, 60);
    assert.equal(events[events.length - 1]!.total, 60);

    // Algún evento intermedio con 25 o 50.
    const intermediates = events.slice(1, -1).map((e) => e.current);
    assert.ok(intermediates.includes(25) || intermediates.includes(50));
  });

  test('onProgress reporta total=0 si no hay archivos', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    const events: Array<{ current: number; total: number }> = [];

    await indexWorkspace(
      fs,
      cache,
      kb,
      state,
      cancelSource.token,
      undefined,
      (current: number, total: number) => events.push({ current, total })
    );

    assert.equal(events.length, 2); // inicio + final
    assert.equal(events[0]!.total, 0);
    assert.equal(events[1]!.total, 0);
  });

  test('prioriza archivo activo y archivos de su proyecto', () => {
    const state = new WorkspaceState();
    state.setProjectModel({
      getProjects() {
        return [];
      },
      getProjectForFile(uri: string) {
        const normalized = uri.toLowerCase();
        return normalized.includes('/proja/')
          ? { projectUri: 'projA', kind: 'target', name: 'projA', libraries: [] }
          : normalized.includes('/projb/')
            ? { projectUri: 'projB', kind: 'target', name: 'projB', libraries: [] }
            : null;
      },
      getFilesForProject(projectUri: string): string[] {
        return projectUri === 'projA'
          ? ['file:///projA/active.sru', 'file:///projA/nearby.sru']
          : ['file:///projB/other.sru'];
      },
      getLibrariesForFile(): string[] {
        return [];
      },
      getStats() {
        return { projects: 2, libraries: 0, orphanFiles: 0 };
      }
    } as UnifiedProjectModel);

    const ordered = prioritizeFilesForIndexing(
      ['file:///projB/other.sru', 'file:///projA/nearby.sru', 'file:///projA/active.sru'],
      state,
      'file:///projA/active.sru'
    );

    assert.deepEqual(ordered, ['file:///projA/active.sru', 'file:///projA/nearby.sru', 'file:///projB/other.sru']);
  });

  test('prioriza ancestro, tipo relacionado y callable probable antes que el resto del proyecto', () => {
    const state = new WorkspaceState();
    const kb = new KnowledgeBase();

    const activeUri = 'file:///projA/active.sru';
    const parentUri = 'file:///projA/parent.sru';
    const serviceUri = 'file:///projA/service.sru';
    const callableUri = 'file:///projA/callable.sru';
    const sameProjectUri = 'file:///projA/other.sru';
    const workspaceUri = 'file:///projB/other.sru';

    state.setProjectModel({
      getProjects() {
        return [];
      },
      getProjectForFile(uri: string) {
        const normalized = uri.toLowerCase();
        return normalized.includes('/proja/')
          ? { projectUri: 'projA', kind: 'target', name: 'projA', libraries: [] }
          : normalized.includes('/projb/')
            ? { projectUri: 'projB', kind: 'target', name: 'projB', libraries: [] }
            : null;
      },
      getFilesForProject(projectUri: string): string[] {
        return projectUri === 'projA'
          ? [activeUri, parentUri, serviceUri, callableUri, sameProjectUri]
          : [workspaceUri];
      },
      getLibrariesForFile(): string[] {
        return [];
      },
      getStats() {
        return { projects: 2, libraries: 0, orphanFiles: 0 };
      }
    } as UnifiedProjectModel);

    const parentSymbols: Fact[] = [{
      id: 'n_parent',
      name: 'n_parent',
      kind: EntityKind.Type,
      uri: parentUri,
      line: 0,
      character: 0
    }];
    const serviceSymbols: Fact[] = [{
      id: 'n_service',
      name: 'n_service',
      kind: EntityKind.Type,
      uri: serviceUri,
      line: 0,
      character: 0
    }];
    const callableSymbols: Fact[] = [{
      id: 'of_service',
      name: 'of_service',
      kind: EntityKind.Function,
      uri: callableUri,
      line: 0,
      character: 0
    }];
    const activeSymbols: Fact[] = [
      {
        id: 'n_child',
        name: 'n_child',
        kind: EntityKind.Type,
        uri: activeUri,
        line: 0,
        character: 0,
        baseTypeName: 'n_parent'
      },
      {
        id: 'll_service',
        name: 'll_service',
        kind: EntityKind.Variable,
        uri: activeUri,
        line: 1,
        character: 0,
        datatype: 'n_service',
        containerName: 'n_child'
      }
    ];

    kb.upsertDocument(parentUri, parentSymbols, [], createSnapshot(parentUri, parentSymbols));
    kb.upsertDocument(serviceUri, serviceSymbols, [], createSnapshot(serviceUri, serviceSymbols));
    kb.upsertDocument(callableUri, callableSymbols, [], createSnapshot(callableUri, callableSymbols));
    kb.upsertDocument(activeUri, activeSymbols, [], createSnapshot(activeUri, activeSymbols, ['of_service()']));

    const ordered = prioritizeFilesForIndexing(
      [workspaceUri, sameProjectUri, callableUri, serviceUri, parentUri, activeUri],
      state,
      activeUri,
      kb
    );

    assert.deepEqual(ordered, [activeUri, parentUri, serviceUri, callableUri, sameProjectUri, workspaceUri]);
  });

  test('status expone degradación si hay archivos fallidos', async () => {
    class FailingFileSystem extends FakeFileSystem {
      override async readFile(uri: string): Promise<string> {
        if (uri.endsWith('broken.sru')) {
          throw new Error('broken');
        }
        return super.readFile(uri);
      }
    }

    const fs = new FailingFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    fs.files.set('file:///proj/good.sru', 'forward prototypes\nend prototypes\n');
    state.addSourceFile('file:///proj/good.sru');
    state.addSourceFile('file:///proj/broken.sru');

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    const status = getIndexerStatus();
    assert.equal(status.phase, 'ready');
    assert.equal(status.degraded, true);
    assert.equal(status.byState.failed, 1);
    assert.equal(status.pass, undefined);
    assert.equal(status.lastFailedUri, 'file:///proj/broken.sru');
  });

  test('status expone la última URI procesada', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    fs.files.set('file:///proj/only.sru', 'forward prototypes\nend prototypes\n');
    state.addSourceFile('file:///proj/only.sru');

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    const status = getIndexerStatus();
    assert.equal(status.lastProcessedUri, 'file:///proj/only.sru');
    assert.equal(status.lastFailedUri, undefined);
  });

  test('status contabiliza ejecuciones parciales por cancelación', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    fs.files.set('file:///proj/cancelled.sru', 'forward prototypes\nend prototypes\n');
    state.addSourceFile('file:///proj/cancelled.sru');
    cancelSource.cancel();

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    const status = getIndexerStatus();
    assert.equal(status.phase, 'partial');
    assert.equal(status.partialRuns, 1);
    assert.equal(status.degradedReason, 'partial-index');
  });

  test('publica snapshot structural-only antes de empezar enriched', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    fs.files.set('file:///proj/structural.sru', 'forward prototypes\nend prototypes\n');
    state.addSourceFile('file:///proj/structural.sru');

    let snapshotAtEnrichedStart = kb.getDocumentSnapshot('file:///proj/structural.sru');

    await indexWorkspace(
      fs,
      cache,
      kb,
      state,
      cancelSource.token,
      undefined,
      (current, total, meta) => {
        if (current === 0 && total === 1 && meta.pass === 'enriched') {
          snapshotAtEnrichedStart = kb.getDocumentSnapshot('file:///proj/structural.sru');
        }
      }
    );

    assert.equal(snapshotAtEnrichedStart?.pass, 'structural');
    assert.equal(snapshotAtEnrichedStart?.readiness, 'structural-only');
    assert.deepEqual(snapshotAtEnrichedStart?.symbols, []);
    assert.equal(getIndexerStatus().structuralPublished, 1);
  });

  test('promueve el snapshot a nearby-semantic-ready al cerrar enriched', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    fs.files.set('file:///proj/enriched.sru', 'forward prototypes\nend prototypes\n');
    state.addSourceFile('file:///proj/enriched.sru');

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    const snapshot = kb.getDocumentSnapshot('file:///proj/enriched.sru');
    assert.equal(snapshot?.pass, 'enriched');
    assert.equal(snapshot?.readiness, 'nearby-semantic-ready');
    assert.equal(getIndexerStatus().enrichedPublished, 1);
  });

  test('workspaceIndexer produce un estado indexed coherente para las invariantes', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    fs.files.set('file:///proj/invariant.sru', 'forward prototypes\nend prototypes\n');
    state.addSourceFile('file:///proj/invariant.sru');

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    const invariants = new IndexStateInvariants({
      phase: 'dirty',
      epoch: 0,
      fingerprintMap: new Map(),
      publishedSnapshotVersion: 0,
    });
    invariants.transition('indexing');
    invariants.transition('indexed', {
      epoch: kb.semanticEpoch,
      fingerprintMap: buildPublishedFingerprintMap(state, kb),
      publishedSnapshotVersion: kb.getStats().publishedAt,
    });

    assert.equal(invariants.isCoherent(), true);
  });

  test('warm start no republica documentos sin cambios ni avanza semanticEpoch', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    fs.files.set('file:///proj/warm.sru', 'forward prototypes\nend prototypes\n');
    state.addSourceFile('file:///proj/warm.sru');

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);
    const epochAfterColdRun = kb.semanticEpoch;

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    assert.equal(kb.semanticEpoch, epochAfterColdRun);
    assert.equal(getIndexerStatus().structuralPublished, 0);
    assert.equal(getIndexerStatus().enrichedPublished, 0);
  });

  test('warm start reutiliza snapshots publicados aunque el DocumentCache haya evictado parte del workspace', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache(1);
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    fs.files.set('file:///proj/warm_a.sru', 'forward prototypes\nend prototypes\n');
    fs.files.set('file:///proj/warm_b.sru', 'forward prototypes\nend prototypes\n');
    state.addSourceFile('file:///proj/warm_a.sru');
    state.addSourceFile('file:///proj/warm_b.sru');

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);
    const epochAfterColdRun = kb.semanticEpoch;

    await indexWorkspace(fs, cache, kb, state, cancelSource.token);

    assert.equal(kb.semanticEpoch, epochAfterColdRun);
    assert.equal(getIndexerStatus().structuralPublished, 0);
    assert.equal(getIndexerStatus().enrichedPublished, 0);

    const invariants = new IndexStateInvariants({
      phase: 'indexed',
      epoch: kb.semanticEpoch,
      fingerprintMap: buildPublishedFingerprintMap(state, kb),
      publishedSnapshotVersion: kb.getStats().publishedAt,
    });

    assert.equal(invariants.getSnapshot().fingerprintMap.size, 2, 'La pérdida de DocumentCache no debe borrar semántica publicada.');
    assert.equal(invariants.isCoherent(), true);
  });

  test('status expone resumen de prioridad semantica del activo', async () => {
    const fs = new FakeFileSystem();
    const state = new WorkspaceState();
    const cache = new DocumentCache();
    const kb = new KnowledgeBase();
    const cancelSource = createCancellationSource();

    const activeUri = 'file:///projA/active.sru';
    const parentUri = 'file:///projA/parent.sru';
    const serviceUri = 'file:///projA/service.sru';
    const callableUri = 'file:///projA/callable.sru';
    const sameProjectUri = 'file:///projA/other.sru';
    const workspaceUri = 'file:///projB/other.sru';

    for (const uri of [activeUri, parentUri, serviceUri, callableUri, sameProjectUri, workspaceUri]) {
      state.addSourceFile(uri);
      fs.files.set(uri, 'forward prototypes\nend prototypes\n');
    }

    state.setProjectModel({
      getProjects() {
        return [];
      },
      getProjectForFile(uri: string) {
        const normalized = uri.toLowerCase();
        return normalized.includes('/proja/')
          ? { projectUri: 'projA', kind: 'target', name: 'projA', libraries: [] }
          : normalized.includes('/projb/')
            ? { projectUri: 'projB', kind: 'target', name: 'projB', libraries: [] }
            : null;
      },
      getFilesForProject(projectUri: string): string[] {
        return projectUri === 'projA'
          ? [activeUri, parentUri, serviceUri, callableUri, sameProjectUri]
          : [workspaceUri];
      },
      getLibrariesForFile(): string[] {
        return [];
      },
      getStats() {
        return { projects: 2, libraries: 0, orphanFiles: 0 };
      }
    } as UnifiedProjectModel);

    const parentSymbols: Fact[] = [{ id: 'n_parent', name: 'n_parent', kind: EntityKind.Type, uri: parentUri, line: 0, character: 0 }];
    const serviceSymbols: Fact[] = [{ id: 'n_service', name: 'n_service', kind: EntityKind.Type, uri: serviceUri, line: 0, character: 0 }];
    const callableSymbols: Fact[] = [{ id: 'of_service', name: 'of_service', kind: EntityKind.Function, uri: callableUri, line: 0, character: 0 }];
    const activeSymbols: Fact[] = [
      { id: 'n_child', name: 'n_child', kind: EntityKind.Type, uri: activeUri, line: 0, character: 0, baseTypeName: 'n_parent' },
      { id: 'll_service', name: 'll_service', kind: EntityKind.Variable, uri: activeUri, line: 1, character: 0, datatype: 'n_service', containerName: 'n_child' }
    ];

    const snapshots = new Map<string, SemanticDocumentSnapshot>([
      [parentUri, createSnapshot(parentUri, parentSymbols)],
      [serviceUri, createSnapshot(serviceUri, serviceSymbols)],
      [callableUri, createSnapshot(callableUri, callableSymbols)],
      [sameProjectUri, createSnapshot(sameProjectUri, [])],
      [workspaceUri, createSnapshot(workspaceUri, [])],
      [activeUri, createSnapshot(activeUri, activeSymbols, ['of_service()'])]
    ]);

    for (const [uri, snapshot] of snapshots.entries()) {
      kb.upsertDocument(uri, snapshot.symbols, [], snapshot);
      cache.set(uri, {
        version: `hash:${uri}`,
        symbols: [],
        facts: snapshot.symbols,
        scopes: [],
        snapshot
      });
    }

    state.markIndexClean();

    await indexWorkspace(fs, cache, kb, state, cancelSource.token, undefined, undefined, activeUri);

    assert.deepEqual(getIndexerStatus().prioritySummary, {
      strategy: 'semantic-nearby',
      ancestors: 1,
      semantic: 1,
      probableCalls: 1,
      sameProject: 4
    });
  });
});
