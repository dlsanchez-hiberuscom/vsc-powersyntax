import * as assert from 'assert/strict';

import {
  appendObjectExplorerProjectionPage,
  isObjectExplorerLoadMoreNode,
} from '../../../src/client/objectExplorerProjectionModel';
import type { ApiObjectExplorerProjectionPage } from '../../../src/shared/publicApi';

suite('unit/objectExplorerProjectionModel (B384)', () => {
  test('consume una primera página y agrega un nodo local de cargar más', () => {
    const page: ApiObjectExplorerProjectionPage = {
      schemaVersion: '1.0.0',
      scope: 'workspace',
      effectiveScope: 'workspace',
      nodes: [
        {
          id: 'project:file:///workspace-a/app.pbt',
          type: 'project',
          label: 'app-a',
          hasChildren: true,
          path: { projectUri: 'file:///workspace-a/app.pbt' },
        },
      ],
      projection: {
        projectionId: 'object-explorer',
        projectionOwner: 'object-explorer.server',
        state: 'paged',
        generatedAt: '2026-05-09T00:00:00.000Z',
        paged: true,
        pageInfo: {
          page: 1,
          pageSize: 1,
          totalItems: 2,
          hasMore: true,
          nextCursor: '1',
        },
      },
    };

    const nodes = appendObjectExplorerProjectionPage([], page);

    assert.equal(nodes.length, 2);
    assert.equal(nodes[0]?.type, 'project');
    assert.equal(isObjectExplorerLoadMoreNode(nodes[1]), true);
    assert.equal(nodes[1]?.id, 'load-more:root:1');
  });

  test('fusiona la siguiente página y elimina el nodo previo de cargar más', () => {
    const firstPage: ApiObjectExplorerProjectionPage = {
      schemaVersion: '1.0.0',
      scope: 'workspace',
      effectiveScope: 'workspace',
      nodes: [
        {
          id: 'project:file:///workspace-a/app.pbt',
          type: 'project',
          label: 'app-a',
          hasChildren: true,
          path: { projectUri: 'file:///workspace-a/app.pbt' },
        },
      ],
      projection: {
        projectionId: 'object-explorer',
        projectionOwner: 'object-explorer.server',
        state: 'paged',
        generatedAt: '2026-05-09T00:00:00.000Z',
        paged: true,
        pageInfo: {
          page: 1,
          pageSize: 1,
          totalItems: 2,
          hasMore: true,
          nextCursor: '1',
        },
      },
    };
    const secondPage: ApiObjectExplorerProjectionPage = {
      schemaVersion: '1.0.0',
      scope: 'workspace',
      effectiveScope: 'workspace',
      nodes: [
        {
          id: 'project:file:///workspace-b/app.pbt',
          type: 'project',
          label: 'app-b',
          hasChildren: true,
          path: { projectUri: 'file:///workspace-b/app.pbt' },
        },
      ],
      projection: {
        projectionId: 'object-explorer',
        projectionOwner: 'object-explorer.server',
        state: 'ready',
        generatedAt: '2026-05-09T00:00:01.000Z',
        pageInfo: {
          page: 2,
          pageSize: 1,
          totalItems: 2,
          hasMore: false,
        },
      },
    };

    const merged = appendObjectExplorerProjectionPage(
      appendObjectExplorerProjectionPage([], firstPage),
      secondPage,
    );

    assert.deepEqual(
      merged.map((node) => node.id),
      [
        'project:file:///workspace-a/app.pbt',
        'project:file:///workspace-b/app.pbt',
      ],
    );
  });
});