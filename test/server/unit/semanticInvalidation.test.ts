import * as assert from 'assert/strict';

import type { SemanticDocumentSnapshot } from '../../../src/server/analysis/semanticSnapshot';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import {
  createSemanticInvalidationPlan,
  createSnapshotAwareInvalidationPlan
} from '../../../src/server/knowledge/semanticInvalidation';
import { EntityKind } from '../../../src/server/knowledge/types';

function createSnapshot(uri: string, symbols: SemanticDocumentSnapshot['symbols']): SemanticDocumentSnapshot {
  return {
    uri,
    version: 1,
    fingerprint: symbols.length + 1,
    identity: `${uri}@${symbols.length + 1}`,
    pass: 'enriched',
    readiness: 'nearby-semantic-ready',
    containerModel: { sections: [], typeBlocks: [] },
    symbols,
    scopes: [],
    logicalStatements: [],
    maskedText: { lines: [], masks: [] },
    controlBlocks: []
  };
}

suite('unit/semanticInvalidation', () => {
  test('propaga invalidación a dependientes directos y transitivos', () => {
    const kb = new KnowledgeBase();
    const uriA = 'file:///a.sru';
    const uriB = 'file:///b.sru';
    const uriC = 'file:///c.sru';
    const symbolsA = [{ id: 'n_parent', name: 'n_parent', kind: EntityKind.Type, uri: uriA, line: 1, character: 0 }];
    const symbolsB = [{ id: 'n_child', name: 'n_child', kind: EntityKind.Type, uri: uriB, line: 1, character: 0, baseTypeName: 'n_parent' }];
    const symbolsC = [{ id: 'of_consume', name: 'of_consume', kind: EntityKind.Function, uri: uriC, line: 1, character: 0, datatype: 'n_child' }];

    kb.upsertDocument(uriA, symbolsA, [], createSnapshot(uriA, symbolsA));
    kb.upsertDocument(uriB, symbolsB, [], createSnapshot(uriB, symbolsB));
    kb.upsertDocument(uriC, symbolsC, [], createSnapshot(uriC, symbolsC));

    const plan = createSemanticInvalidationPlan(uriA, kb);

    assert.deepEqual(plan.directlyImpactedUris, [uriB]);
    assert.deepEqual(plan.transitivelyImpactedUris, [uriC]);
    assert.deepEqual(plan.allUris, [uriA, uriB, uriC]);
  });

  test('si el diff no cambia la superficie semántica invalida solo el documento origen', () => {
    const uriA = 'file:///a.sru';
    const uriB = 'file:///b.sru';
    const uriC = 'file:///c.sru';
    const symbols = [{ id: 'n_parent', name: 'n_parent', kind: EntityKind.Type, uri: uriA, line: 1, character: 0 }];
    const previous = createSnapshot(uriA, symbols);
    const next = {
      ...createSnapshot(uriA, symbols),
      fingerprint: 99,
      identity: `${uriA}@99`
    };

    const plan = createSnapshotAwareInvalidationPlan(
      uriA,
      previous,
      next,
      {
        sourceUri: uriA,
        directlyImpactedUris: [uriB],
        transitivelyImpactedUris: [uriC],
        allUris: [uriA, uriB, uriC]
      },
      {
        sourceUri: uriA,
        directlyImpactedUris: [uriB],
        transitivelyImpactedUris: [uriC],
        allUris: [uriA, uriB, uriC]
      }
    );

    assert.deepEqual(plan.directlyImpactedUris, []);
    assert.deepEqual(plan.transitivelyImpactedUris, []);
    assert.deepEqual(plan.allUris, [uriA]);
  });

  test('si el diff cambia la superficie semántica combina impactos previos y nuevos', () => {
    const uriA = 'file:///a.sru';
    const uriB = 'file:///b.sru';
    const uriC = 'file:///c.sru';
    const uriD = 'file:///d.sru';
    const previous = createSnapshot(uriA, [
      { id: 'n_parent', name: 'n_parent', kind: EntityKind.Type, uri: uriA, line: 1, character: 0 }
    ]);
    const next = createSnapshot(uriA, [
      { id: 'n_parent', name: 'n_parent', kind: EntityKind.Type, uri: uriA, line: 1, character: 0, baseTypeName: 'n_base' }
    ]);

    const plan = createSnapshotAwareInvalidationPlan(
      uriA,
      previous,
      next,
      {
        sourceUri: uriA,
        directlyImpactedUris: [uriB],
        transitivelyImpactedUris: [uriC],
        allUris: [uriA, uriB, uriC]
      },
      {
        sourceUri: uriA,
        directlyImpactedUris: [uriD],
        transitivelyImpactedUris: [uriB],
        allUris: [uriA, uriD, uriB]
      }
    );

    assert.deepEqual(plan.directlyImpactedUris, [uriB, uriD]);
    assert.deepEqual(plan.transitivelyImpactedUris, [uriC]);
    assert.deepEqual(plan.allUris, [uriA, uriB, uriD, uriC]);
  });
});