import * as assert from 'assert/strict';

import {
  buildReadOnlyProjectionStateMessage,
  mergeReadOnlySurfaceMessages,
} from '../../../src/client/readOnlyProjectionState';

suite('unit/readOnlyProjectionState (B385)', () => {
  test('describe un estado paginado con refresh hint compacto', () => {
    const message = buildReadOnlyProjectionStateMessage('Object Explorer', {
      projection: {
        projectionId: 'object-explorer',
        projectionOwner: 'object-explorer.server',
        state: 'paged',
        generatedAt: '2026-05-09T00:00:00.000Z',
        paged: true,
        pageInfo: {
          page: 2,
          pageSize: 50,
          totalItems: 120,
          hasMore: true,
          nextCursor: '100',
        },
        refreshHint: {
          strategy: 'refresh-on-demand',
          detail: 'Expandir o refrescar para solicitar la siguiente pagina.',
        },
      },
    });

    assert.equal(message, 'Object Explorer: paginado · Expandir o refrescar para solicitar la siguiente pagina.');
  });

  test('describe un estado ready truncado sin volverlo ruidoso', () => {
    const message = buildReadOnlyProjectionStateMessage('Current Object Context', {
      projection: {
        projectionId: 'current-object-context:embedded-sql',
        projectionOwner: 'current-object-context.embedded-sql',
        state: 'ready',
        generatedAt: '2026-05-09T00:00:00.000Z',
        truncated: true,
        truncatedReason: 'sql-anchor-cap:current-object-context',
      },
    });

    assert.equal(message, 'Current Object Context: listo · sql-anchor-cap:current-object-context');
  });

  test('fusiona estado y mensaje adicional sin duplicar texto', () => {
    assert.equal(
      mergeReadOnlySurfaceMessages('Object Explorer: paginado', 'Foco actual no resuelto; mostrando workspace completo.'),
      'Object Explorer: paginado Foco actual no resuelto; mostrando workspace completo.',
    );
  });
});