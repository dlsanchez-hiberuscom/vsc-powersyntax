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
        id: 'create_main',
        name: 'create',
        kind: EntityKind.Event,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 15,
        character: 4,
        implementationKind: 'on-handler',
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
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
    assert.equal(queryContext.invocationKind, 'unqualified-call');
    assert.equal(queryContext.invocationRisk, 'safe');
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

  test('createDocumentQueryContext expone hasResolutionAmbiguity cuando el fallback global devuelve varios winners cross-project', () => {
    kb.upsertDocument('file:///proj_a/gf_conflict.srf', [
      {
        id: 'gf_conflict',
        name: 'gf_conflict',
        kind: EntityKind.Function,
        uri: 'file:///proj_a/gf_conflict.srf',
        line: 1,
        character: 0,
        lineage: { sourceKind: 'document', sourceOrigin: 'solution-source', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      }
    ]);
    kb.upsertDocument('file:///proj_b/gf_conflict.srf', [
      {
        id: 'gf_conflict',
        name: 'gf_conflict',
        kind: EntityKind.Function,
        uri: 'file:///proj_b/gf_conflict.srf',
        line: 1,
        character: 0,
        lineage: { sourceKind: 'document', sourceOrigin: 'solution-source', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      }
    ]);

    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'gf_conflict()');
    const queryContext = createDocumentQueryContext(document, { line: 0, character: 5 }, kb, graph);

    assert.equal(queryContext.primaryResolutionReasonCode, 'global-fallback');
    assert.equal(queryContext.hasResolutionAmbiguity, true);
    assert.equal(queryContext.resolutionConfidence, 'low');
    assert.equal(queryContext.resolutionTargetCount, 2);
    assert.deepEqual(queryContext.resolutionEvidenceKinds, ['winner-target']);
  });

  test('createDocumentQueryContext degrada resolutionConfidence a undefined si no hay contexto resoluble', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, ' ');
    const queryContext = createDocumentQueryContext(document, { line: 0, character: 0 }, kb, graph);

    assert.equal(queryContext.resolutionConfidence, undefined);
    assert.equal(queryContext.primaryResolutionReasonCode, undefined);
    assert.equal(queryContext.invocationKind, undefined);
    assert.equal(queryContext.invocationRisk, undefined);
    assert.equal(queryContext.hasResolutionAmbiguity, false);
    assert.equal(queryContext.resolutionTargetCount, 0);
    assert.deepEqual(queryContext.resolutionEvidenceKinds, []);
    assert.equal(queryContext.resolvedTargets, null);
  });

  test('createDocumentQueryContext expone invocationKind específico para this-call', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'this.of_SetData()');
    const queryContext = createDocumentQueryContext(document, { line: 0, character: 10 }, kb, graph);

    assert.equal(queryContext.primaryResolutionReasonCode, 'member-hierarchy');
    assert.equal(queryContext.invocationKind, 'this-call');
    assert.equal(queryContext.invocationRisk, 'safe');
  });

  test('createDocumentQueryContext sintetiza contexto para TriggerEvent(this, "create")', () => {
    const document = TextDocument.create('file:///w_main.sru', 'powerbuilder', 1, 'TriggerEvent(this, "create")');
    const queryContext = createDocumentQueryContext(document, { line: 0, character: 22 }, kb, graph);

    assert.deepEqual(queryContext.context, { identifier: 'create', qualifier: 'this' });
    assert.equal(queryContext.primaryResolutionReasonCode, 'member-hierarchy');
    assert.equal(queryContext.invocationKind, 'this-call');
    assert.equal(queryContext.invocationRisk, 'safe');
  });
});