import * as assert from 'assert/strict';

import type { ApiSemanticWorkspaceManifest } from '../../../src/shared/publicApi';
import { buildObjectExplorerModel } from '../../../src/client/objectExplorerModel';

suite('unit/objectExplorerModel (B214)', () => {
  function createManifest(): ApiSemanticWorkspaceManifest {
    return {
      schemaVersion: '1.0.0',
      generatedAt: Date.now(),
      limits: {
        maxObjects: 1000,
        maxSymbols: 400,
        objectsTruncated: false,
        symbolsTruncated: false,
      },
      projects: [
        {
          projectUri: 'file:///proj/app.pbt',
          kind: 'target',
          name: 'app',
          libraries: ['file:///proj/lib_app.pbl'],
          fileCount: 2,
        }
      ],
      libraries: ['file:///proj/lib_app.pbl'],
      objects: [
        {
          name: 'w_context',
          uri: 'file:///proj/lib_app.pbl/w_context.srw',
          baseType: 'w_context_base',
          projectUri: 'file:///proj/app.pbt',
          library: 'file:///proj/lib_app.pbl',
          objectKind: 'window',
          readiness: 'nearby-semantic-ready',
          sourceOrigin: 'pbl-folder-source',
        },
        {
          name: 'u_service',
          uri: 'file:///proj/lib_app.pbl/u_service.sru',
          projectUri: 'file:///proj/app.pbt',
          library: 'file:///proj/lib_app.pbl',
          objectKind: 'userobject',
          readiness: 'structural-only',
          sourceOrigin: 'pbl-folder-source',
        }
      ],
      inheritanceSummary: {
        totalTypes: 2,
        roots: 1,
        items: [
          {
            name: 'w_context',
            baseType: 'w_context_base',
            descendantCount: 0,
          }
        ],
      },
      exportedSymbols: [],
      diagnosticsSummary: null,
      sourceOriginSummary: {
        'pbl-folder-source': 2,
      },
      readiness: {
        state: 'ready',
      },
    };
  }

  test('agrupa el workspace por proyecto, librería y kind reutilizando el manifest', () => {
    const model = buildObjectExplorerModel(createManifest(), 'workspace');

    assert.equal(model.effectiveScope, 'workspace');
    assert.equal(model.roots.length, 1);

    const projectNode = model.roots[0];
    assert.equal(projectNode.type, 'project');
    assert.equal(projectNode.label, 'app');
    assert.match(projectNode.description ?? '', /2 objetos/);

    const libraryNode = projectNode.children[0];
    assert.equal(libraryNode.type, 'library');
    assert.equal(libraryNode.label, 'lib_app.pbl');

    const kindLabels = libraryNode.children.map((entry) => entry.label);
    assert.deepEqual(kindLabels, ['Window', 'UserObject']);

    const objectNode = libraryNode.children[0]?.type === 'kind'
      ? libraryNode.children[0].children[0]
      : undefined;
    assert.equal(objectNode?.type, 'object');
    assert.equal(objectNode?.label, 'w_context');
    assert.match(objectNode?.description ?? '', /nearby-semantic-ready/);
  });

  test('foco en archivo actual reduce el árbol y devuelve el nodo activo', () => {
    const model = buildObjectExplorerModel(
      createManifest(),
      'current-file',
      'file:///proj/lib_app.pbl/w_context.srw',
    );

    assert.equal(model.effectiveScope, 'current-file');
    assert.equal(model.focusObjectId, 'object:file:///proj/lib_app.pbl/w_context.srw');

    const projectNode = model.roots[0];
    assert.equal(projectNode.type, 'project');
    const libraryNode = projectNode.children[0];
    assert.equal(libraryNode.type, 'library');
    const kindNode = libraryNode.children[0];
    assert.equal(kindNode.type, 'kind');
    assert.equal(kindNode.children.length, 1);
    assert.equal(kindNode.children[0]?.type, 'object');
    assert.equal(kindNode.children[0]?.label, 'w_context');
  });

  test('mantiene separados proyectos homónimos entre roots distintos y focaliza por projectUri', () => {
    const manifest = createManifest();
    manifest.projects = [
      {
        projectUri: 'file:///workspace-a/app.pbt',
        kind: 'target',
        name: 'app',
        libraries: ['file:///workspace-a/lib_shared.pbl'],
        fileCount: 1,
      },
      {
        projectUri: 'file:///workspace-b/app.pbt',
        kind: 'target',
        name: 'app',
        libraries: ['file:///workspace-b/lib_shared.pbl'],
        fileCount: 1,
      }
    ];
    manifest.libraries = ['file:///workspace-a/lib_shared.pbl', 'file:///workspace-b/lib_shared.pbl'];
    manifest.objects = [
      {
        name: 'u_shared',
        uri: 'file:///workspace-a/lib_shared.pbl/u_shared.sru',
        projectUri: 'file:///workspace-a/app.pbt',
        library: 'file:///workspace-a/lib_shared.pbl',
        objectKind: 'userobject',
        readiness: 'nearby-semantic-ready',
        sourceOrigin: 'pbl-folder-source',
      },
      {
        name: 'u_shared',
        uri: 'file:///workspace-b/lib_shared.pbl/u_shared.sru',
        projectUri: 'file:///workspace-b/app.pbt',
        library: 'file:///workspace-b/lib_shared.pbl',
        objectKind: 'userobject',
        readiness: 'nearby-semantic-ready',
        sourceOrigin: 'pbl-folder-source',
      }
    ];
    manifest.sourceOriginSummary = { 'pbl-folder-source': 2 };

    const workspaceModel = buildObjectExplorerModel(manifest, 'workspace');
    assert.equal(workspaceModel.roots.length, 2);
    assert.deepEqual(
      workspaceModel.roots
        .filter((entry): entry is typeof workspaceModel.roots[number] & { type: 'project'; projectUri: string } => entry.type === 'project' && Boolean(entry.projectUri))
        .map((entry) => entry.projectUri)
        .sort(),
      ['file:///workspace-a/app.pbt', 'file:///workspace-b/app.pbt']
    );

    const currentProjectModel = buildObjectExplorerModel(
      manifest,
      'current-project',
      'file:///workspace-b/lib_shared.pbl/u_shared.sru',
    );
    assert.equal(currentProjectModel.effectiveScope, 'current-project');
    assert.equal(currentProjectModel.roots.length, 1);
    assert.equal(currentProjectModel.roots[0]?.type, 'project');
    assert.equal(currentProjectModel.roots[0]?.projectUri, 'file:///workspace-b/app.pbt');
  });

  test('consume sin degradación un proyecto legacy sintetizado desde una librería PBL', () => {
    const manifest = createManifest();
    manifest.projects = [{
      projectUri: 'file:///proj/lib_legacy.pbl',
      kind: 'library',
      name: 'lib_legacy.pbl',
      libraries: ['file:///proj/lib_legacy.pbl'],
      fileCount: 1,
    }];
    manifest.libraries = ['file:///proj/lib_legacy.pbl'];
    manifest.objects = [{
      name: 'w_legacy',
      uri: 'file:///proj/lib_legacy.pbl/w_legacy.srw',
      projectUri: 'file:///proj/lib_legacy.pbl',
      library: 'file:///proj/lib_legacy.pbl',
      objectKind: 'window',
      readiness: 'nearby-semantic-ready',
      sourceOrigin: 'pbl-folder-source',
    }];

    const model = buildObjectExplorerModel(manifest, 'current-project', 'file:///proj/lib_legacy.pbl/w_legacy.srw');

    assert.equal(model.effectiveScope, 'current-project');
    assert.equal(model.roots.length, 1);
    assert.equal(model.roots[0]?.type, 'project');
    assert.equal(model.roots[0]?.label, 'lib_legacy.pbl');
  });
});