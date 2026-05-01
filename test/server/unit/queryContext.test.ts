import * as assert from 'assert/strict';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { createDocumentQueryContext } from '../../../src/server/features/queryContext';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/queryContext', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);

    kb.beginBatchUpdate();
    kb.upsertDocument('file:///w_base.sru', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base.sru', line: 0, character: 0 },
      {
        id: 'of_setdata_base',
        name: 'of_SetData',
        kind: EntityKind.Function,
        containerName: 'w_base',
        uri: 'file:///w_base.sru',
        line: 10,
        character: 4,
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      }
    ]);

    kb.upsertDocument('file:///w_main.sru', [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, baseTypeName: 'w_base', uri: 'file:///w_main.sru', line: 0, character: 0 },
      {
        id: 'of_setdata_main',
        name: 'of_SetData',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 20,
        character: 4,
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
      {
        id: 'of_ambiguous_a',
        name: 'of_Ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 30,
        character: 4,
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
      {
        id: 'of_ambiguous_b',
        name: 'of_Ambiguous',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 40,
        character: 4,
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      }
    ]);
    kb.endBatchUpdate();
  });

  test('createDocumentQueryContext expone resolutionConfidence derivada del query engine', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'of_SetData()');
    const queryContext = createDocumentQueryContext(document, { line: 0, character: 5 }, kb, graph);

    assert.equal(queryContext.resolutionConfidence, 'high');
    assert.equal(queryContext.primaryResolutionReasonCode, 'member-hierarchy');
    assert.equal(queryContext.hasResolutionAmbiguity, false);
    assert.equal(queryContext.resolutionTargetCount, 1);
    assert.deepEqual(queryContext.resolutionEvidenceKinds, ['winner-target', 'discarded-distance']);
    assert.equal(queryContext.resolvedTargets?.confidence, 'high');
    assert.deepEqual(queryContext.resolvedTargets?.reasonCodes, ['member-hierarchy']);
  });

  test('createDocumentQueryContext expone hasResolutionAmbiguity cuando la evidence contiene empate minimo', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'of_Ambiguous()');
    const queryContext = createDocumentQueryContext(document, { line: 0, character: 5 }, kb, graph);

    assert.equal(queryContext.hasResolutionAmbiguity, true);
    assert.equal(queryContext.resolutionConfidence, 'medium');
    assert.equal(queryContext.resolutionTargetCount, 2);
    assert.deepEqual(queryContext.resolutionEvidenceKinds, ['winner-target', 'distance-ambiguity']);
  });

  test('createDocumentQueryContext degrada resolutionConfidence a undefined si no hay contexto resoluble', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, ' ');
    const queryContext = createDocumentQueryContext(document, { line: 0, character: 0 }, kb, graph);

    assert.equal(queryContext.resolutionConfidence, undefined);
    assert.equal(queryContext.primaryResolutionReasonCode, undefined);
    assert.equal(queryContext.hasResolutionAmbiguity, false);
    assert.equal(queryContext.resolutionTargetCount, 0);
    assert.deepEqual(queryContext.resolutionEvidenceKinds, []);
    assert.equal(queryContext.resolvedTargets, null);
  });
});