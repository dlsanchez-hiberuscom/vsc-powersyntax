import * as assert from 'assert/strict';

import { TextDocument } from 'vscode-languageserver-textdocument';

import { analyzeDocument } from '../../../src/server/analysis/documentAnalysis';
import { ServingCacheFlushCoordinator } from '../../../src/server/cache/servingCacheFlushCoordinator';
import { buildCurrentObjectContext } from '../../../src/server/features/currentObjectContext';
import { buildPowerBuilderDependencyGraph } from '../../../src/server/features/dependencyGraph';
import { buildDiagnosticsForDocument } from '../../../src/server/features/diagnostics';
import { buildSemanticWorkspaceManifest } from '../../../src/server/features/semanticWorkspaceManifest';
import { DocumentCache } from '../../../src/server/knowledge/DocumentCache';
import { HotContextCache } from '../../../src/server/knowledge/HotContextCache';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { makeKey, ServingCache } from '../../../src/server/knowledge/ServingCache';
import { SystemCatalog } from '../../../src/server/knowledge/system/SystemCatalog';
import type { IFileSystem, FileStat } from '../../../src/server/system/fileSystem';
import { WorkspaceState } from '../../../src/server/workspace/workspaceState';
import { applyWatchedFileEvents } from '../../../src/server/workspace/watchedFileIntake';
import { FileIndexState, getFileIndexState, getIndexerStatus } from '../../../src/server/indexer/workspaceIndexer';

class FakeFileSystem implements IFileSystem {
  readonly files = new Map<string, string>();

  async readFile(uri: string): Promise<string> {
    const value = this.files.get(uri);
    if (value === undefined) {
      throw new Error(`File not found: ${uri}`);
    }
    return value;
  }

  async readDirectory(): Promise<[string, FileStat][]> {
    return [];
  }

  async stat(uri: string): Promise<FileStat | null> {
    const content = this.files.get(uri);
    if (content === undefined) {
      return null;
    }
    return {
      isFile: true,
      isDirectory: false,
      size: content.length,
      mtime: 0
    };
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

function loadDocument(fs: FakeFileSystem, uri: string): TextDocument {
  return TextDocument.create(uri, 'powerbuilder', 1, fs.files.get(uri) ?? '');
}

function stableDependencyGraph(uri: string, knowledgeBase: KnowledgeBase, workspaceState: WorkspaceState) {
  const graph = buildPowerBuilderDependencyGraph(
    {
      uri,
      maxDependencies: 8,
      maxDependents: 8,
    },
    knowledgeBase,
    workspaceState,
  );

  return {
    available: graph.available,
    focus: graph.focus,
    summary: graph.summary,
    nodes: graph.nodes
      .map((node) => ({
        id: node.id,
        label: node.label,
        kind: node.kind,
        resolution: node.resolution,
        uri: node.uri,
        projectUri: node.projectUri,
        library: node.library,
        sourceOrigin: node.sourceOrigin,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    edges: [...graph.edges].sort((left, right) => `${left.sourceId}|${left.targetId}|${left.relation}`.localeCompare(`${right.sourceId}|${right.targetId}|${right.relation}`)),
  };
}

function stableManifestObject(uri: string, knowledgeBase: KnowledgeBase, workspaceState: WorkspaceState) {
  const manifest = buildSemanticWorkspaceManifest(
    {
      maxObjects: 64,
      maxSymbols: 128,
    },
    knowledgeBase,
    new InheritanceGraph(knowledgeBase),
    workspaceState,
    null,
    { state: 'ready' },
  );

  return manifest.objects.find((entry) => entry.uri === uri) ?? null;
}

function stableDiagnostics(document: TextDocument, knowledgeBase: KnowledgeBase): Array<{
  code?: string;
  message: string;
  severity?: number;
  line: number;
  character: number;
}> {
  const catalog = new SystemCatalog();
  const graph = new InheritanceGraph(knowledgeBase);
  return buildDiagnosticsForDocument(document, 'full', knowledgeBase, catalog, graph).map((diagnostic) => ({
    ...(diagnostic.code != null ? { code: String(diagnostic.code) } : {}),
    message: diagnostic.message,
    ...(diagnostic.severity != null ? { severity: diagnostic.severity } : {}),
    line: diagnostic.range.start.line,
    character: diagnostic.range.start.character,
  }));
}

function stableCurrentObjectContext(document: TextDocument, knowledgeBase: KnowledgeBase, workspaceState: WorkspaceState) {
  const context = buildCurrentObjectContext(
    document,
    undefined,
    knowledgeBase,
    new InheritanceGraph(knowledgeBase),
    new SystemCatalog(),
    { workspaceState },
  );

  return {
    ancestorChain: (context.ancestorChain ?? []).map((entry) => ({
      name: entry.name,
      ...(entry.uri ? { uri: entry.uri } : {}),
      ...(entry.sourceOrigin ? { sourceOrigin: entry.sourceOrigin } : {}),
    })),
    members: {
      functions: (context.members?.functions ?? []).map((entry) => ({
        name: entry.name,
        ...(entry.signature ? { signature: entry.signature } : {}),
        ...(entry.declaredIn ? { declaredIn: entry.declaredIn } : {}),
        ...(entry.relation ? { relation: entry.relation } : {}),
      })),
      prototypes: (context.members?.prototypes ?? []).map((entry) => ({
        name: entry.name,
        ...(entry.signature ? { signature: entry.signature } : {}),
        ...(entry.declaredIn ? { declaredIn: entry.declaredIn } : {}),
        ...(entry.relation ? { relation: entry.relation } : {}),
      })),
    },
  };
}

suite('unit/watchedFileIntake', () => {
  test('reindexa cambios de archivos cerrados y los registra en workspaceState', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const uri = 'file:///proj/w_demo.sru';
    const before = getIndexerStatus().byState;

    fs.files.set(uri, [
      'forward',
      'global type w_demo from window',
      'end type',
      'end forward',
      '',
      'global type w_demo from window',
      'public function integer of_demo();',
      '  return 1',
      'end function',
      'end type'
    ].join('\n'));

    const result = await applyWatchedFileEvents({
      events: [{ uri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.equal(result.reindexed, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.equal(result.massive, false);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(workspaceState.hasSourceFile(uri), true);
    assert.equal(knowledgeBase.getDocumentSnapshot(uri)?.pass, 'enriched');
    assert.ok(documentCache.get(uri)?.facts.some((fact) => fact.name.toLowerCase() === 'of_demo'));
    assert.equal(getFileIndexState(uri), FileIndexState.Indexed);
    const after = getIndexerStatus().byState;
    assert.equal(after[FileIndexState.Indexed] - before[FileIndexState.Indexed], 1);
  });

  test('create y delete refrescan el project model cuando cambia el inventario', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const uri = 'file:///proj/lib_app.pbl/u_refresh.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: 'file:///proj/app.pbt',
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl']
      }
    });
    workspaceState.refreshProjectRouting();

    fs.files.set(uri, 'forward\nend forward\n');

    const createResult = await applyWatchedFileEvents({
      events: [{ uri, kind: 'create' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.equal(workspaceState.getProjectModel()?.getProjectForFile(uri)?.projectUri, 'file:///proj/app.pbt');
    assert.deepEqual(createResult.touchedProjects, ['file:///proj/app.pbt']);

    const deleteResult = await applyWatchedFileEvents({
      events: [{ uri, kind: 'delete' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.equal(workspaceState.getProjectModel()?.getProjectForFile(uri), null);
    assert.deepEqual(deleteResult.touchedProjects, ['file:///proj/app.pbt']);
  });

  test('create y delete de markers refrescan routing y provenance sin rediscovery completo', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const markerUri = 'file:///proj/app.pbt';
    const sourceUri = 'file:///proj/lib_app.pbl/u_refresh.sru';

    workspaceState.addSourceFile(sourceUri, 'unknown');
    await fs.writeFile(markerUri, 'LibList "lib_app.pbl"');

    const createResult = await applyWatchedFileEvents({
      events: [{ uri: markerUri, kind: 'create' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.equal(workspaceState.getProjectModel()?.getProjectForFile(sourceUri)?.projectUri, markerUri);
    assert.equal(workspaceState.getSourceOrigin(sourceUri), 'pbl-folder-source');
    assert.deepEqual(createResult.touchedProjects, [markerUri]);

    const deleteResult = await applyWatchedFileEvents({
      events: [{ uri: markerUri, kind: 'delete' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.equal(workspaceState.getProjectModel()?.getProjectForFile(sourceUri), null);
    assert.deepEqual(deleteResult.touchedProjects, [markerUri]);
  });

  test('create y delete de build files refrescan el catálogo read-only de PBAutoBuild', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const markerUri = 'file:///proj/app.pbproj';
    const buildFileUri = 'file:///proj/app.build.json';

    workspaceState.addTopologyEntry({
      kind: 'project',
      data: {
        uri: markerUri,
        name: 'app',
        libraries: []
      }
    });
    workspaceState.refreshProjectRouting();
    await fs.writeFile(
      buildFileUri,
      JSON.stringify({
        BuildPlan: {
          Projects: [{ Path: 'app.pbproj' }]
        }
      })
    );

    const createResult = await applyWatchedFileEvents({
      events: [{ uri: buildFileUri, kind: 'create' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.deepEqual(workspaceState.getBuildFiles(), [
      {
        uri: buildFileUri,
        hasBuildPlan: true,
        referencedProjectUris: [markerUri],
        status: 'usable',
        representedProjectUri: markerUri
      }
    ]);
    assert.deepEqual(createResult.touchedProjects, [markerUri]);

    const deleteResult = await applyWatchedFileEvents({
      events: [{ uri: buildFileUri, kind: 'delete' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.deepEqual(workspaceState.getBuildFiles(), []);
    assert.deepEqual(deleteResult.touchedProjects, []);
  });

  test('alta caliente de SR* reconcilia sourceOrigin con los roots ya conocidos', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const solutionUri = 'file:///proj/app.pbsln';
    const sourceUri = 'file:///proj/lib_app.pbl/u_hot.sru';

    workspaceState.addRoot('solutions', solutionUri);
    await fs.writeFile(sourceUri, 'forward\nend forward\n');

    const result = await applyWatchedFileEvents({
      events: [{ uri: sourceUri, kind: 'create' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    assert.equal(result.reindexed, 1);
    assert.equal(workspaceState.getSourceOrigin(sourceUri), 'pbl-folder-source');
  });

  test('cambio topológico rematerializa snapshots con sourceOrigin contextual', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const sourceUri = 'file:///proj/src/u_contextual.sru';
    const solutionUri = 'file:///proj/app.pbsln';

    await fs.writeFile(sourceUri, [
      'forward',
      'global type u_contextual from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type u_contextual from nonvisualobject',
      'end type'
    ].join('\n'));

    const firstResult = await applyWatchedFileEvents({
      events: [{ uri: sourceUri, kind: 'create' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    const firstType = knowledgeBase.getDocumentSnapshot(sourceUri)?.symbols.find(
      (fact) => fact.kind.toString().toLowerCase() === 'type'
    );

    await fs.writeFile(solutionUri, 'Projects = "app.pbproj"');

    const secondResult = await applyWatchedFileEvents({
      events: [{ uri: solutionUri, kind: 'create' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    const secondType = knowledgeBase.getDocumentSnapshot(sourceUri)?.symbols.find(
      (fact) => fact.kind.toString().toLowerCase() === 'type'
    );

    assert.equal(firstResult.reindexed, 1);
    assert.equal(firstType?.lineage?.sourceOrigin, 'unknown');
    assert.equal(workspaceState.getSourceOrigin(sourceUri), 'solution-source');
    assert.equal(secondResult.reindexed, 1);
    assert.equal(secondType?.lineage?.sourceOrigin, 'solution-source');
  });

  test('delete elimina cache, snapshot y limpia diagnósticos', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const clearedDiagnostics: string[] = [];
    const uri = 'file:///proj/w_delete.sru';

    fs.files.set(uri, 'forward\nend forward\n');
    await applyWatchedFileEvents({
      events: [{ uri, kind: 'create' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator
    });

    const result = await applyWatchedFileEvents({
      events: [{ uri, kind: 'delete' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      clearDiagnostics: (targetUri) => clearedDiagnostics.push(targetUri)
    });

    assert.equal(result.reindexed, 0);
    assert.equal(result.removed, 1);
    assert.equal(result.massive, false);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(workspaceState.hasSourceFile(uri), false);
    assert.equal(documentCache.get(uri), undefined);
    assert.equal(knowledgeBase.getDocumentSnapshot(uri), null);
    assert.deepEqual(clearedDiagnostics, [uri]);
    assert.equal(getFileIndexState(uri), undefined);
  });

  test('omite reindexado si el documento está abierto', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const uri = 'file:///proj/w_open.sru';
    const before = getIndexerStatus().byState;

    fs.files.set(uri, 'forward\nend forward\n');

    const result = await applyWatchedFileEvents({
      events: [{ uri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      isDocumentOpen: (targetUri) => targetUri === uri
    });

    assert.equal(result.reindexed, 0);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 1);
    assert.equal(result.massive, false);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(workspaceState.hasSourceFile(uri), true);
    assert.equal(knowledgeBase.getDocumentSnapshot(uri), null);
    assert.equal(getFileIndexState(uri), FileIndexState.Pending);
    const after = getIndexerStatus().byState;
    assert.equal(after[FileIndexState.Pending] - before[FileIndexState.Pending], 1);
  });

  test('solicita refresh de diagnósticos para documentos abiertos invalidados por un ancestro reindexado', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const childUri = 'file:///proj/lib_app.pbl/u_child.sru';
    const baseUri = 'file:///proj/pfc libs.pbl/pfc_n_base.sru';
    const childDocument = TextDocument.create(
      childUri,
      'powerbuilder',
      1,
      [
        'forward',
        'global type u_child from pfc_n_base',
        'end type',
        'end forward',
        '',
        'global type u_child from pfc_n_base',
        'end type'
      ].join('\n')
    );
    const childAnalysis = analyzeDocument(childDocument, { sourceOrigin: 'pbl-folder-source' });
    const refreshCalls: Array<readonly string[] | undefined> = [];

    workspaceState.addSourceFile(childUri);
    workspaceState.addSourceFile(baseUri);
    documentCache.set(childUri, {
      version: childDocument.version,
      facts: childAnalysis.semanticFacts,
      symbols: [],
      scopes: childAnalysis.scopes,
      snapshot: childAnalysis.snapshot
    });
    knowledgeBase.upsertDocument(
      childUri,
      childAnalysis.semanticFacts,
      childAnalysis.scopes,
      childAnalysis.snapshot
    );

    fs.files.set(
      baseUri,
      [
        'forward',
        'global type pfc_n_base from nonvisualobject',
        'end type',
        'end forward',
        '',
        'global type pfc_n_base from nonvisualobject',
        'end type'
      ].join('\n')
    );

    const result = await applyWatchedFileEvents({
      events: [{ uri: baseUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      isDocumentOpen: (uri) => uri === childUri,
      getOpenDocument: (uri) => (uri === childUri ? childDocument : undefined),
      refreshDiagnostics: (uris) => {
        refreshCalls.push(uris);
      }
    });

    assert.equal(result.reindexed, 1);
    assert.equal(refreshCalls.length, 1);
    assert.ok(refreshCalls[0]?.includes(childUri), 'El watcher debe pedir refresh para el documento abierto dependiente.');
  });

  test('batch pequeño invalida serving cache solo para URIs afectadas', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const changedUri = 'file:///proj/w_small.sru';
    const otherUri = 'file:///proj/w_other.sru';

    fs.files.set(changedUri, 'forward\nend forward\n');
    servingCache.set(makeKey({ feature: 'hover', uri: changedUri, line: 0, character: 0, kbVersion: 1 }), 'changed');
    servingCache.set(makeKey({ feature: 'hover', uri: otherUri, line: 0, character: 0, kbVersion: 1 }), 'other');

    const result = await applyWatchedFileEvents({
      events: [{ uri: changedUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 8
    });

    assert.equal(result.massive, false);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: changedUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: otherUri, line: 0, character: 0, kbVersion: 1 })), 'other');
  });

  test('cambio cosmético invalida solo el documento origen y preserva surfaces read-only del dependiente', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const projectUri = 'file:///proj/app.pbt';
    const baseUri = 'file:///proj/lib_app.pbl/n_parent.sru';
    const childUri = 'file:///proj/lib_app.pbl/n_child.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: projectUri,
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });
    workspaceState.refreshProjectRouting();

    fs.files.set(baseUri, [
      'forward',
      'global type n_parent from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_parent from nonvisualobject',
      'public function integer of_answer();',
      '  return 42',
      'end function',
      'end type',
    ].join('\n'));
    fs.files.set(childUri, [
      'forward',
      'global type n_child from n_parent',
      'end type',
      'end forward',
      '',
      'global type n_child from n_parent',
      'public function integer of_consume();',
      '  return of_answer()',
      'end function',
      'end type',
    ].join('\n'));

    await applyWatchedFileEvents({
      events: [
        { uri: baseUri, kind: 'create' },
        { uri: childUri, kind: 'create' },
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
    });

    const beforeChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const beforeChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const beforeChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const beforeChildDiagnostics = stableDiagnostics(loadDocument(fs, childUri), knowledgeBase);
    const beforeRoots = workspaceState.getRoots();

    servingCache.set(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 }), 'base');
    servingCache.set(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 }), 'child');

    fs.files.set(baseUri, [
      'forward',
      'global type n_parent from nonvisualobject',
      'end type',
      'end forward',
      '',
      '// comentario cosmético',
      'global type n_parent from nonvisualobject',
      'public function integer of_answer();',
      '    return 42',
      'end function',
      'end type',
    ].join('\n'));

    const result = await applyWatchedFileEvents({
      events: [{ uri: baseUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 8,
    });

    const afterChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const afterChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const afterChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const afterChildDiagnostics = stableDiagnostics(loadDocument(fs, childUri), knowledgeBase);

    assert.equal(result.massive, false);
    assert.equal(result.reindexed, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.deepEqual(result.touchedProjects, [projectUri]);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 })), 'child');
    assert.equal(beforeChildSnapshot, afterChildSnapshot);
    assert.deepEqual(beforeChildGraph, afterChildGraph);
    assert.deepEqual(beforeChildManifestObject, afterChildManifestObject);
    assert.deepEqual(beforeChildDiagnostics, afterChildDiagnostics);
    assert.deepEqual(workspaceState.getRoots(), beforeRoots);
  });

  test('cambio en .srd invalida el window ligado por DataObject sin reindexar su snapshot', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const projectUri = 'file:///proj/app.pbt';
    const dataWindowUri = 'file:///proj/lib_app.pbl/d_sales_orders.srd';
    const windowUri = 'file:///proj/lib_app.pbl/w_orders.srw';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: projectUri,
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });
    workspaceState.refreshProjectRouting();

    fs.files.set(dataWindowUri, [
      '$PBExportHeader$d_sales_orders.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) ARG(NAME = ~"orderarg~" TYPE = number) )" arguments=(("custarg", number), ("orderarg", number)) )',
    ].join('\n'));
    fs.files.set(windowUri, [
      'forward',
      'global type w_orders from window',
      'end type',
      'end forward',
      '',
      'global type w_orders from window',
      'public subroutine of_load();',
      '  datastore ids_orders',
      '  ids_orders.SetTrans(SQLCA)',
      '  ids_orders.DataObject = "d_sales_orders"',
      '  ids_orders.Retrieve(1, 2)',
      'end subroutine',
      'end type',
    ].join('\n'));

    await applyWatchedFileEvents({
      events: [
        { uri: dataWindowUri, kind: 'create' },
        { uri: windowUri, kind: 'create' },
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
    });

    const beforeWindowSnapshot = knowledgeBase.getDocumentSnapshot(windowUri)?.identity;
    const beforeWindowGraph = stableDependencyGraph(windowUri, knowledgeBase, workspaceState);
    const beforeWindowManifestObject = stableManifestObject(windowUri, knowledgeBase, workspaceState);
    const beforeWindowDiagnostics = stableDiagnostics(loadDocument(fs, windowUri), knowledgeBase);

    servingCache.set(makeKey({ feature: 'hover', uri: dataWindowUri, line: 0, character: 0, kbVersion: 1 }), 'dw');
    servingCache.set(makeKey({ feature: 'hover', uri: windowUri, line: 0, character: 0, kbVersion: 1 }), 'window');

    fs.files.set(dataWindowUri, [
      '$PBExportHeader$d_sales_orders.srd',
      'release 39;',
      'datawindow(units=0)',
      'table(retrieve="PBSELECT( VERSION(400) TABLE(NAME=~"sales_order~" ) ARG(NAME = ~"custarg~" TYPE = number) )" arguments=(("custarg", number)) )',
    ].join('\n'));

    const result = await applyWatchedFileEvents({
      events: [{ uri: dataWindowUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 8,
    });

    const afterWindowSnapshot = knowledgeBase.getDocumentSnapshot(windowUri)?.identity;
    const afterWindowGraph = stableDependencyGraph(windowUri, knowledgeBase, workspaceState);
    const afterWindowManifestObject = stableManifestObject(windowUri, knowledgeBase, workspaceState);
    const afterWindowDiagnostics = stableDiagnostics(loadDocument(fs, windowUri), knowledgeBase);

    assert.equal(result.massive, false);
    assert.equal(result.reindexed, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.deepEqual(result.touchedProjects, [projectUri]);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: dataWindowUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: windowUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(beforeWindowSnapshot, afterWindowSnapshot);
    assert.deepEqual(beforeWindowGraph, afterWindowGraph);
    assert.deepEqual(beforeWindowManifestObject, afterWindowManifestObject);
    assert.equal(beforeWindowDiagnostics.some((entry) => entry.message.includes('ids_orders.Retrieve') && entry.message.includes('espera 1 argumento')), false);
    assert.equal(afterWindowDiagnostics.some((entry) => entry.message.includes('ids_orders.Retrieve') && entry.message.includes('espera 1 argumento')), true);
  });

  test('cambio de firma en ancestro invalida currentObjectContext del hijo sin reindexar su snapshot', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const projectUri = 'file:///proj/app.pbt';
    const baseUri = 'file:///proj/lib_app.pbl/n_parent.sru';
    const childUri = 'file:///proj/lib_app.pbl/n_child.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: projectUri,
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });
    workspaceState.refreshProjectRouting();

    fs.files.set(baseUri, [
      'forward',
      'global type n_parent from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_parent from nonvisualobject',
      'public function integer of_answer();',
      '  return 42',
      'end function',
      'end type',
    ].join('\n'));
    fs.files.set(childUri, [
      'forward',
      'global type n_child from n_parent',
      'end type',
      'end forward',
      '',
      'global type n_child from n_parent',
      'public function integer of_consume();',
      '  return of_answer()',
      'end function',
      'end type',
    ].join('\n'));

    await applyWatchedFileEvents({
      events: [
        { uri: baseUri, kind: 'create' },
        { uri: childUri, kind: 'create' },
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
    });

    const beforeChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const beforeChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const beforeChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const beforeChildContext = stableCurrentObjectContext(loadDocument(fs, childUri), knowledgeBase, workspaceState);

    servingCache.set(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 }), 'base');
    servingCache.set(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 }), 'child');

    fs.files.set(baseUri, [
      'forward',
      'global type n_parent from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_parent from nonvisualobject',
      'public function integer of_answer (integer ai_value);',
      '  return ai_value',
      'end function',
      'end type',
    ].join('\n'));

    const result = await applyWatchedFileEvents({
      events: [{ uri: baseUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 8,
    });

    const afterChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const afterChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const afterChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const afterChildContext = stableCurrentObjectContext(loadDocument(fs, childUri), knowledgeBase, workspaceState);

    assert.equal(result.massive, false);
    assert.equal(result.reindexed, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.deepEqual(result.touchedProjects, [projectUri]);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(beforeChildSnapshot, afterChildSnapshot);
    assert.deepEqual(beforeChildGraph, afterChildGraph);
    assert.deepEqual(beforeChildManifestObject, afterChildManifestObject);
    assert.equal(beforeChildContext.members.functions.some((entry) => entry.name === 'of_answer' && (entry.signature ?? '').includes('ai_value')), false);
    assert.equal(afterChildContext.members.functions.some((entry) => entry.name === 'of_answer' && (entry.signature ?? '').includes('ai_value')), true);
  });

  test('cambio de implementación preserva surfaces read-only del dependiente y evita invalidación extra', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const projectUri = 'file:///proj/app.pbt';
    const baseUri = 'file:///proj/lib_app.pbl/n_impl_parent.sru';
    const childUri = 'file:///proj/lib_app.pbl/n_impl_child.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: projectUri,
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });
    workspaceState.refreshProjectRouting();

    fs.files.set(baseUri, [
      'forward',
      'global type n_impl_parent from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_impl_parent from nonvisualobject',
      'public function integer of_answer();',
      '  return 42',
      'end function',
      'end type',
    ].join('\n'));
    fs.files.set(childUri, [
      'forward',
      'global type n_impl_child from n_impl_parent',
      'end type',
      'end forward',
      '',
      'global type n_impl_child from n_impl_parent',
      'public function integer of_consume();',
      '  return of_answer()',
      'end function',
      'end type',
    ].join('\n'));

    await applyWatchedFileEvents({
      events: [
        { uri: baseUri, kind: 'create' },
        { uri: childUri, kind: 'create' },
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
    });

    const beforeChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const beforeChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const beforeChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const beforeChildContext = stableCurrentObjectContext(loadDocument(fs, childUri), knowledgeBase, workspaceState);

    servingCache.set(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 }), 'base');
    servingCache.set(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 }), 'child');

    fs.files.set(baseUri, [
      'forward',
      'global type n_impl_parent from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_impl_parent from nonvisualobject',
      'public function integer of_answer();',
      '  return 84',
      'end function',
      'end type',
    ].join('\n'));

    const result = await applyWatchedFileEvents({
      events: [{ uri: baseUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 8,
    });

    const afterChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const afterChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const afterChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const afterChildContext = stableCurrentObjectContext(loadDocument(fs, childUri), knowledgeBase, workspaceState);

    assert.equal(result.massive, false);
    assert.equal(result.reindexed, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.deepEqual(result.touchedProjects, [projectUri]);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 })), 'child');
    assert.equal(beforeChildSnapshot, afterChildSnapshot);
    assert.deepEqual(beforeChildGraph, afterChildGraph);
    assert.deepEqual(beforeChildManifestObject, afterChildManifestObject);
    assert.deepEqual(beforeChildContext, afterChildContext);
  });

  test('cambio de prototype heredado invalida members.prototypes del hijo sin reindexar su snapshot', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const projectUri = 'file:///proj/app.pbt';
    const baseUri = 'file:///proj/lib_app.pbl/n_proto_parent.sru';
    const childUri = 'file:///proj/lib_app.pbl/n_proto_child.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: projectUri,
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });
    workspaceState.refreshProjectRouting();

    fs.files.set(baseUri, [
      'forward',
      'global type n_proto_parent from nonvisualobject',
      'end type',
      'end forward',
      'forward prototypes',
      'public function integer of_only_proto()',
      'end prototypes',
      '',
      'global type n_proto_parent from nonvisualobject',
      'end type',
    ].join('\n'));
    fs.files.set(childUri, [
      'forward',
      'global type n_proto_child from n_proto_parent',
      'end type',
      'end forward',
      '',
      'global type n_proto_child from n_proto_parent',
      'end type',
    ].join('\n'));

    await applyWatchedFileEvents({
      events: [
        { uri: baseUri, kind: 'create' },
        { uri: childUri, kind: 'create' },
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
    });

    const beforeChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const beforeChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const beforeChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const beforeChildContext = stableCurrentObjectContext(loadDocument(fs, childUri), knowledgeBase, workspaceState);

    servingCache.set(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 }), 'base');
    servingCache.set(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 }), 'child');

    fs.files.set(baseUri, [
      'forward',
      'global type n_proto_parent from nonvisualobject',
      'end type',
      'end forward',
      'forward prototypes',
      'public function integer of_only_proto(integer ai_value)',
      'end prototypes',
      '',
      'global type n_proto_parent from nonvisualobject',
      'end type',
    ].join('\n'));

    const result = await applyWatchedFileEvents({
      events: [{ uri: baseUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 8,
    });

    const afterChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const afterChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const afterChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const afterChildContext = stableCurrentObjectContext(loadDocument(fs, childUri), knowledgeBase, workspaceState);

    assert.equal(result.massive, false);
    assert.equal(result.reindexed, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.deepEqual(result.touchedProjects, [projectUri]);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(beforeChildSnapshot, afterChildSnapshot);
    assert.deepEqual(beforeChildGraph, afterChildGraph);
    assert.deepEqual(beforeChildManifestObject, afterChildManifestObject);
    assert.equal(beforeChildContext.members.prototypes.some((entry) => entry.name === 'of_only_proto' && (entry.signature ?? '').includes('ai_value')), false);
    assert.equal(afterChildContext.members.prototypes.some((entry) => entry.name === 'of_only_proto' && (entry.signature ?? '').includes('ai_value')), true);
  });

  test('cambio en external function heredada invalida currentObjectContext del hijo sin reindexar su snapshot', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const projectUri = 'file:///proj/app.pbt';
    const baseUri = 'file:///proj/lib_app.pbl/n_ext_parent.sru';
    const childUri = 'file:///proj/lib_app.pbl/n_ext_child.sru';

    workspaceState.addTopologyEntry({
      kind: 'target',
      data: {
        uri: projectUri,
        name: 'app',
        libraries: ['file:///proj/lib_app.pbl'],
      },
    });
    workspaceState.refreshProjectRouting();

    fs.files.set(baseUri, [
      'forward',
      'global type n_ext_parent from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_ext_parent from nonvisualobject',
      'end type',
      'public function long of_external (string as_input) library "kernel32.dll" alias for "OfExternal";',
    ].join('\n'));
    fs.files.set(childUri, [
      'forward',
      'global type n_ext_child from n_ext_parent',
      'end type',
      'end forward',
      '',
      'global type n_ext_child from n_ext_parent',
      'end type',
    ].join('\n'));

    await applyWatchedFileEvents({
      events: [
        { uri: baseUri, kind: 'create' },
        { uri: childUri, kind: 'create' },
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
    });

    const beforeChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const beforeChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const beforeChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const beforeChildContext = stableCurrentObjectContext(loadDocument(fs, childUri), knowledgeBase, workspaceState);

    servingCache.set(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 }), 'base');
    servingCache.set(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 }), 'child');

    fs.files.set(baseUri, [
      'forward',
      'global type n_ext_parent from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_ext_parent from nonvisualobject',
      'end type',
      'public function long of_external (string as_input, integer ai_mode) library "kernel32.dll" alias for "OfExternalEx";',
    ].join('\n'));

    const result = await applyWatchedFileEvents({
      events: [{ uri: baseUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 8,
    });

    const afterChildSnapshot = knowledgeBase.getDocumentSnapshot(childUri)?.identity;
    const afterChildGraph = stableDependencyGraph(childUri, knowledgeBase, workspaceState);
    const afterChildManifestObject = stableManifestObject(childUri, knowledgeBase, workspaceState);
    const afterChildContext = stableCurrentObjectContext(loadDocument(fs, childUri), knowledgeBase, workspaceState);

    assert.equal(result.massive, false);
    assert.equal(result.reindexed, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.deepEqual(result.touchedProjects, [projectUri]);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: baseUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: childUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(beforeChildSnapshot, afterChildSnapshot);
    assert.deepEqual(beforeChildGraph, afterChildGraph);
    assert.deepEqual(beforeChildManifestObject, afterChildManifestObject);
    assert.equal(beforeChildContext.members.functions.some((entry) => entry.name === 'of_external' && (entry.signature ?? '').includes('ai_mode')), false);
    assert.equal(afterChildContext.members.functions.some((entry) => entry.name === 'of_external' && (entry.signature ?? '').includes('ai_mode') && (entry.signature ?? '').includes('OfExternalEx')), true);
  });

  test('cambio en orca-staging preserva la surface real preferida y evita invalidación extra', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const solutionUri = 'file:///proj/app.pbsln';
    const realUri = 'file:///proj/src/n_shared.sru';
    const stagedUri = 'file:///proj/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/n_shared.sru';

    workspaceState.addRoot('solutions', solutionUri);
    fs.files.set(realUri, [
      'forward',
      'global type n_shared from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_shared from nonvisualobject',
      'end type',
    ].join('\n'));
    fs.files.set(stagedUri, [
      'forward',
      'global type n_shared from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_shared from nonvisualobject',
      'end type',
    ].join('\n'));

    await applyWatchedFileEvents({
      events: [
        { uri: realUri, kind: 'create' },
        { uri: stagedUri, kind: 'create' },
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
    });

    const beforeRealSnapshot = knowledgeBase.getDocumentSnapshot(realUri)?.identity;
    const beforeRealManifestObject = stableManifestObject(realUri, knowledgeBase, workspaceState);

    servingCache.set(makeKey({ feature: 'hover', uri: realUri, line: 0, character: 0, kbVersion: 1 }), 'real');
    servingCache.set(makeKey({ feature: 'hover', uri: stagedUri, line: 0, character: 0, kbVersion: 1 }), 'staged');

    fs.files.set(stagedUri, [
      'forward',
      'global type n_shared from nonvisualobject',
      'end type',
      'end forward',
      '',
      'global type n_shared from nonvisualobject',
      'end type',
      'public function integer of_stage();',
      '  return 1',
      'end function',
    ].join('\n'));

    const result = await applyWatchedFileEvents({
      events: [{ uri: stagedUri, kind: 'change' }],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 8,
    });

    const afterRealSnapshot = knowledgeBase.getDocumentSnapshot(realUri)?.identity;
    const afterRealManifestObject = stableManifestObject(realUri, knowledgeBase, workspaceState);

    assert.equal(result.massive, false);
    assert.equal(result.reindexed, 1);
    assert.equal(result.removed, 0);
    assert.equal(result.skipped, 0);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: realUri, line: 0, character: 0, kbVersion: 1 })), 'real');
    assert.equal(servingCache.get(makeKey({ feature: 'hover', uri: stagedUri, line: 0, character: 0, kbVersion: 1 })), undefined);
    assert.equal(beforeRealSnapshot, afterRealSnapshot);
    assert.deepEqual(beforeRealManifestObject, afterRealManifestObject);
    assert.equal(knowledgeBase.findDefinition('n_shared')?.uri, realUri);
    assert.deepEqual(knowledgeBase.findAllDefinitions('n_shared').map((entry) => entry.uri), [realUri, stagedUri]);
  });

  test('batch masivo invalida serving cache completo en un solo barrido lógico', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const firstUri = 'file:///proj/w_massive_a.sru';
    const secondUri = 'file:///proj/w_massive_b.sru';

    fs.files.set(firstUri, 'forward\nend forward\n');
    fs.files.set(secondUri, 'forward\nend forward\n');
    servingCache.set(makeKey({ feature: 'hover', uri: firstUri, line: 0, character: 0, kbVersion: 1 }), 'first');
    servingCache.set(makeKey({ feature: 'hover', uri: 'file:///proj/unrelated.sru', line: 0, character: 0, kbVersion: 1 }), 'unrelated');

    const result = await applyWatchedFileEvents({
      events: [
        { uri: firstUri, kind: 'change' },
        { uri: secondUri, kind: 'change' }
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      massiveChangeThreshold: 2
    });

    assert.equal(result.massive, true);
    assert.deepEqual(result.touchedProjects, []);
    assert.equal(servingCache.size(), 0);
  });

  test('expone estados simultáneos del workspace en un batch mixto', async () => {
    const fs = new FakeFileSystem();
    const documentCache = new DocumentCache();
    const knowledgeBase = new KnowledgeBase();
    const workspaceState = new WorkspaceState();
    const hotContextCache = new HotContextCache();
    const servingCache = new ServingCache();
    const servingCacheFlushCoordinator = new ServingCacheFlushCoordinator(async () => {});
    const indexedUri = 'file:///proj/w_indexed.sru';
    const pendingUri = 'file:///proj/w_pending.sru';
    const before = getIndexerStatus().byState;

    fs.files.set(indexedUri, 'forward\nend forward\n');
    fs.files.set(pendingUri, 'forward\nend forward\n');

    const result = await applyWatchedFileEvents({
      events: [
        { uri: indexedUri, kind: 'change' },
        { uri: pendingUri, kind: 'change' }
      ],
      fs,
      documentCache,
      knowledgeBase,
      workspaceState,
      hotContextCache,
      servingCache,
      servingCacheFlushCoordinator,
      isDocumentOpen: (uri) => uri === pendingUri
    });

    assert.equal(result.reindexed, 1);
    assert.equal(result.skipped, 1);
    assert.equal(getFileIndexState(indexedUri), FileIndexState.Indexed);
    assert.equal(getFileIndexState(pendingUri), FileIndexState.Pending);
    const after = getIndexerStatus().byState;
    assert.equal(after[FileIndexState.Indexed] - before[FileIndexState.Indexed], 1);
    assert.equal(after[FileIndexState.Pending] - before[FileIndexState.Pending], 1);
  });
});