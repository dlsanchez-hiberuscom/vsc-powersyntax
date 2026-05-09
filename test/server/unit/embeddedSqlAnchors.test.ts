import * as assert from 'assert/strict';

import type { SemanticDocumentSnapshot } from '../../../src/server/analysis/semanticSnapshot';
import { collectEmbeddedSqlAnchorsProjection } from '../../../src/server/features/embeddedSqlAnchors';

function createSnapshot(lines: string[]): SemanticDocumentSnapshot {
  const uri = 'file:///workspace/w_sql_dense.srw';
  return {
    uri,
    version: 1,
    fingerprint: 1,
    identity: `${uri}@1`,
    pass: 'enriched',
    readiness: 'nearby-semantic-ready',
    containerModel: {
      sections: [],
      typeBlocks: [],
    },
    symbols: [],
    scopes: [],
    logicalStatements: [],
    maskedText: {
      lines,
      masks: lines.map(() => new Uint8Array()),
    },
    controlBlocks: [],
  };
}

suite('unit/embeddedSqlAnchors (B382)', () => {
  test('aplica un cap seguro por defecto cuando no se declara consumer ni límite', () => {
    const snapshot = createSnapshot([
      'event open();',
      ...Array.from({ length: 20 }, () => '  COMMIT USING SQLCA;'),
      'end event',
    ]);

    const result = collectEmbeddedSqlAnchorsProjection(snapshot);

    assert.equal(result.receipt.consumer, 'default');
    assert.equal(result.receipt.maxAnchors, 16);
    assert.equal(result.receipt.totalAnchors, 20);
    assert.equal(result.receipt.emittedAnchors, 16);
    assert.equal(result.receipt.truncated, true);
    assert.equal(result.receipt.truncatedReason, 'sql-anchor-cap:default');
    assert.equal(result.anchors.length, 16);
  });

  test('solo habilita modo unbounded en debug/deep-report cuando se pide explícitamente', () => {
    const snapshot = createSnapshot([
      'event open();',
      ...Array.from({ length: 80 }, () => '  COMMIT USING SQLCA;'),
      'end event',
    ]);

    const boundedDebug = collectEmbeddedSqlAnchorsProjection(snapshot, {
      consumer: 'debug/deep-report',
    });
    const unboundedDebug = collectEmbeddedSqlAnchorsProjection(snapshot, {
      consumer: 'debug/deep-report',
      allowUnbounded: true,
    });

    assert.equal(boundedDebug.receipt.maxAnchors, 64);
    assert.equal(boundedDebug.receipt.unbounded, undefined);
    assert.equal(boundedDebug.receipt.truncated, true);
    assert.equal(boundedDebug.anchors.length, 64);

    assert.equal(unboundedDebug.receipt.maxAnchors, undefined);
    assert.equal(unboundedDebug.receipt.unbounded, true);
    assert.equal(unboundedDebug.receipt.truncated, false);
    assert.equal(unboundedDebug.anchors.length, 80);
    assert.equal(unboundedDebug.receipt.totalAnchors, 80);
  });
});