import * as assert from 'assert/strict';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { resolveTargetEntity, resolveTargetEntityDetailed } from '../../../src/server/knowledge/resolution/semanticQueryService';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/semanticQueryService', () => {
  let kb: KnowledgeBase;
  let graph: InheritanceGraph;

  setup(() => {
    kb = new KnowledgeBase();
    graph = new InheritanceGraph(kb);

    kb.beginBatchUpdate();
    kb.upsertDocument('file:///w_base.sru', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base.sru', line: 0, character: 0 },
      {
        id: 'of_setdata',
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
        id: 'of_setdata',
        name: 'of_SetData',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 20,
        character: 4,
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
      { id: 'lw_window', name: 'lw_window', kind: EntityKind.Variable, datatype: 'w_base', containerName: 'w_main', uri: 'file:///w_main.sru', line: 5, character: 0 }
    ]);

    kb.upsertDocument('file:///global.srf', [
      { id: 'global_func', name: 'global_func', kind: EntityKind.Function, uri: 'file:///global.srf', line: 1, character: 0 }
    ]);
    kb.endBatchUpdate();
  });

  test('resolveTargetEntity: unqualified method -> local override', () => {
    const targets = resolveTargetEntity(
      { identifier: 'of_SetData' },
      'file:///w_main.sru',
      kb,
      graph
    );
    assert.equal(targets.length, 1);
    assert.equal(targets[0].uri, 'file:///w_main.sru');
    assert.equal(targets[0].line, 20);
  });

  test('resolveTargetEntity: super::method -> ancestor implementation', () => {
    const targets = resolveTargetEntity(
      { identifier: 'of_SetData', qualifier: 'super' },
      'file:///w_main.sru',
      kb,
      graph
    );
    assert.equal(targets.length, 1);
    assert.equal(targets[0].uri, 'file:///w_base.sru');
    assert.equal(targets[0].line, 10);
  });

  test('resolveTargetEntity: variable.method -> variable datatype implementation', () => {
    const targets = resolveTargetEntity(
      { identifier: 'of_SetData', qualifier: 'lw_window' },
      'file:///w_main.sru',
      kb,
      graph
    );
    assert.equal(targets.length, 1);
    assert.equal(targets[0].uri, 'file:///w_base.sru'); // type is w_base
  });

  test('resolveTargetEntity: fallback to global function', () => {
    const targets = resolveTargetEntity(
      { identifier: 'global_func' },
      'file:///w_main.sru',
      kb,
      graph
    );
    assert.equal(targets.length, 1);
    assert.equal(targets[0].uri, 'file:///global.srf');
  });

  test('resolveTargetEntity: unknown returns empty', () => {
    const targets = resolveTargetEntity(
      { identifier: 'of_unknown' },
      'file:///w_main.sru',
      kb,
      graph
    );
    assert.equal(targets.length, 0);
  });

  test('resolveTargetEntityDetailed expone descarte contextual si el qualifier no resuelve a tipo', () => {
    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_SetData', qualifier: 'lw_missing' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 0);
    assert.equal(resolved.confidence, 'low');
    assert.deepEqual(resolved.evidence, [{
      kind: 'discarded-context',
      stage: 'qualifier',
      reason: 'qualifier-unresolved',
      qualifier: 'lw_missing'
    }]);
  });

  test('resolveTargetEntityDetailed expone descarte contextual si el qualifier no encuentra miembros', () => {
    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_Unknown', qualifier: 'lw_window' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 0);
    assert.equal(resolved.confidence, 'low');
    assert.deepEqual(resolved.evidence, [{
      kind: 'discarded-context',
      stage: 'qualifier',
      reason: 'qualifier-no-match',
      qualifier: 'lw_window',
      resolvedType: 'w_base'
    }]);
  });

  test('resolveTargetEntityDetailed expone ambiguedad si varios candidatos comparten la distancia minima', () => {
    kb.beginBatchUpdate();
    kb.upsertDocument('file:///w_main_ambiguous.sru', [
      { id: 'w_main_ambiguous', name: 'w_main_ambiguous', kind: EntityKind.Type, baseTypeName: 'w_base', uri: 'file:///w_main_ambiguous.sru', line: 0, character: 0 },
      {
        id: 'of_setdata_impl',
        name: 'of_SetData',
        kind: EntityKind.Function,
        containerName: 'w_main_ambiguous',
        uri: 'file:///w_main_ambiguous.sru',
        line: 20,
        character: 4,
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
      {
        id: 'of_setdata_proto',
        name: 'of_SetData',
        kind: EntityKind.Function,
        containerName: 'w_main_ambiguous',
        uri: 'file:///w_main_ambiguous.sru',
        line: 12,
        character: 4,
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'prototype', role: 'prototype', confidence: 'direct' }
      }
    ]);
    kb.endBatchUpdate();

    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_SetData' },
      'file:///w_main_ambiguous.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 2);
    assert.equal(resolved.confidence, 'medium');
    assert.ok(resolved.evidence.some((entry) =>
      entry.kind === 'distance-ambiguity' &&
      entry.reasonCode === 'member-hierarchy' &&
      entry.winnerDistance === 0 &&
      entry.candidateCount === 2
    ));
  });

  test('resolveTargetEntityDetailed expone confidence low para global fallback', () => {
    const resolved = resolveTargetEntityDetailed(
      { identifier: 'global_func' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 1);
    assert.equal(resolved.confidence, 'low');
  });

  test('resolveTargetEntityDetailed expone reason code y trace del winner path', () => {
    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_SetData' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 1);
    assert.deepEqual(resolved.reasonCodes, ['member-hierarchy']);
    assert.equal(resolved.confidence, 'high');
    assert.deepEqual(resolved.winnerLineage, {
      sourceKind: 'document',
      authority: 'derived',
      phase: 'implementation',
      role: 'implementation',
      confidence: 'direct',
      resolutionKind: 'member-hierarchy'
    });
    assert.deepEqual(resolved.evidence, [
      {
        kind: 'winner-target',
        reasonCode: 'member-hierarchy',
        confidence: 'direct',
        targetName: 'of_SetData',
        targetKind: EntityKind.Function,
        targetUri: 'file:///w_main.sru',
        targetContainer: 'w_main',
        sourceKind: 'document',
        authority: 'derived',
        phase: 'implementation',
        role: 'implementation'
      },
      {
        kind: 'discarded-distance',
        reasonCode: 'member-hierarchy',
        targetName: 'of_SetData',
        targetKind: EntityKind.Function,
        targetUri: 'file:///w_base.sru',
        targetContainer: 'w_base',
        winnerDistance: 0,
        candidateDistance: 1
      }
    ]);
    assert.deepEqual(resolved.candidatePool, [
      {
        kind: 'candidate',
        reasonCode: 'member-hierarchy',
        targetName: 'of_SetData',
        targetKind: EntityKind.Function,
        targetUri: 'file:///w_main.sru',
        targetContainer: 'w_main'
      },
      {
        kind: 'candidate',
        reasonCode: 'member-hierarchy',
        targetName: 'of_SetData',
        targetKind: EntityKind.Function,
        targetUri: 'file:///w_base.sru',
        targetContainer: 'w_base'
      }
    ]);
    assert.ok(resolved.trace.some((step) => step.name === 'targets:member-hierarchy'));
  });
});
