import * as assert from 'assert/strict';

import type { SemanticDocumentSnapshot } from '../../../src/server/analysis/semanticSnapshot';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { createSemanticInvalidationPlan } from '../../../src/server/knowledge/semanticInvalidation';
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
});