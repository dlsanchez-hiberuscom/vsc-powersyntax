import * as assert from 'assert/strict';

import type { SemanticDocumentSnapshot } from '../../../src/server/analysis/semanticSnapshot';
import { EntityKind } from '../../../src/server/knowledge/types';
import { collectSnapshotDependencyKeys, diffSemanticSnapshots } from '../../../src/server/knowledge/semanticDiff';

function createSnapshot(overrides?: Partial<SemanticDocumentSnapshot>): SemanticDocumentSnapshot {
  const uri = overrides?.uri ?? 'file:///semantic-diff.sru';
  return {
    uri,
    version: overrides?.version ?? 1,
    fingerprint: overrides?.fingerprint ?? 1,
    identity: overrides?.identity ?? `${uri}@${overrides?.fingerprint ?? 1}`,
    pass: overrides?.pass ?? 'enriched',
    readiness: overrides?.readiness ?? 'nearby-semantic-ready',
    containerModel: overrides?.containerModel ?? { sections: [], typeBlocks: [] },
    symbols: overrides?.symbols ?? [],
    scopes: overrides?.scopes ?? [],
    logicalStatements: overrides?.logicalStatements ?? [],
    maskedText: overrides?.maskedText ?? { lines: [], masks: [] },
    controlBlocks: overrides?.controlBlocks ?? []
  };
}

suite('unit/semanticDiff', () => {
  test('detecta export removido, añadido y actualizado', () => {
    const previous = createSnapshot({
      fingerprint: 10,
      identity: 'file:///semantic-diff.sru@10',
      symbols: [
        { id: 'n_parent', name: 'n_parent', kind: EntityKind.Type, uri: 'file:///semantic-diff.sru', line: 1, character: 0 },
        { id: 'of_old', name: 'of_old', kind: EntityKind.Function, uri: 'file:///semantic-diff.sru', line: 5, character: 0, signature: 'of_old()' }
      ]
    });
    const next = createSnapshot({
      fingerprint: 11,
      identity: 'file:///semantic-diff.sru@11',
      symbols: [
        { id: 'n_parent', name: 'n_parent', kind: EntityKind.Type, uri: 'file:///semantic-diff.sru', line: 1, character: 0, baseTypeName: 'window' },
        { id: 'of_new', name: 'of_new', kind: EntityKind.Function, uri: 'file:///semantic-diff.sru', line: 8, character: 0, signature: 'of_new()' }
      ]
    });

    const diff = diffSemanticSnapshots(previous, next);

    assert.equal(diff.changed, true);
    assert.equal(diff.fingerprintChanged, true);
    assert.deepEqual(diff.exportedIdsAdded, ['of_new']);
    assert.deepEqual(diff.exportedIdsRemoved, ['of_old']);
    assert.deepEqual(diff.exportedIdsUpdated, ['n_parent']);
  });

  test('extrae dependencias semánticas externas filtrando builtins e internas', () => {
    const snapshot = createSnapshot({
      symbols: [
        {
          id: 'n_child',
          name: 'n_child',
          kind: EntityKind.Type,
          uri: 'file:///semantic-diff.sru',
          line: 1,
          character: 0,
          baseTypeName: 'n_parent'
        },
        {
          id: 'of_build',
          name: 'of_build',
          kind: EntityKind.Function,
          uri: 'file:///semantic-diff.sru',
          line: 10,
          character: 0,
          datatype: 'n_service',
          returnType: 'integer',
          containerName: 'n_child'
        }
      ]
    });

    assert.deepEqual(collectSnapshotDependencyKeys(snapshot), ['n_parent', 'n_service']);
  });

  test('cambios de lineage en diff marcan export actualizado', () => {
    const previous = createSnapshot({
      symbols: [
        {
          id: 'of_run',
          name: 'of_run',
          kind: EntityKind.Function,
          uri: 'file:///semantic-diff.sru',
          line: 5,
          character: 0,
          lineage: {
            sourceKind: 'document',
            authority: 'derived',
            phase: 'prototype',
            role: 'prototype',
            confidence: 'direct'
          }
        }
      ]
    });

    const next = createSnapshot({
      symbols: [
        {
          id: 'of_run',
          name: 'of_run',
          kind: EntityKind.Function,
          uri: 'file:///semantic-diff.sru',
          line: 5,
          character: 0,
          lineage: {
            sourceKind: 'document',
            authority: 'derived',
            phase: 'implementation',
            role: 'implementation',
            confidence: 'direct'
          }
        }
      ]
    });

    const diff = diffSemanticSnapshots(previous, next);

    assert.deepEqual(diff.exportedIdsUpdated, ['of_run']);
  });

  test('cambio solo cosmético mantiene fingerprintChanged pero no cambio semántico', () => {
    const previous = createSnapshot({
      fingerprint: 10,
      identity: 'file:///semantic-diff.sru@10',
      symbols: [
        { id: 'of_run', name: 'of_run', kind: EntityKind.Function, uri: 'file:///semantic-diff.sru', line: 5, character: 0, signature: 'of_run()' }
      ]
    });
    const next = createSnapshot({
      fingerprint: 11,
      identity: 'file:///semantic-diff.sru@11',
      symbols: [
        { id: 'of_run', name: 'of_run', kind: EntityKind.Function, uri: 'file:///semantic-diff.sru', line: 5, character: 0, signature: 'of_run()' }
      ]
    });

    const diff = diffSemanticSnapshots(previous, next);

    assert.equal(diff.changed, false);
    assert.equal(diff.fingerprintChanged, true);
  });
});