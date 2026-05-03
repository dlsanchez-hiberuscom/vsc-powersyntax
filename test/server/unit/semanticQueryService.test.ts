import * as assert from 'assert/strict';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { getLastTrace } from '../../../src/server/knowledge/queryTrace';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { resolveTargetEntity, resolveTargetEntityDetailed } from '../../../src/server/knowledge/resolution/semanticQueryService';
import { EntityKind, ScopeKind } from '../../../src/server/knowledge/types';

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
      },
      {
        id: 'of_convert_integer',
        name: 'of_Convert',
        kind: EntityKind.Function,
        containerName: 'w_base',
        uri: 'file:///w_base.sru',
        line: 30,
        character: 4,
        parameters: [{ label: 'integer ai_value' }],
        parameterCount: 1,
        signature: 'public function integer of_Convert(integer ai_value)',
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
      {
        id: 'of_pick_one',
        name: 'of_Pick',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 30,
        character: 4,
        parameters: [{ label: 'integer ai_value' }],
        parameterCount: 1,
        signature: 'public function integer of_Pick(integer ai_value)',
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
      {
        id: 'of_pick_two',
        name: 'of_Pick',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 40,
        character: 4,
        parameters: [{ label: 'integer ai_value' }, { label: 'string as_value' }],
        parameterCount: 2,
        signature: 'public function integer of_Pick(integer ai_value, string as_value)',
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
      {
        id: 'of_convert_string',
        name: 'of_Convert',
        kind: EntityKind.Function,
        containerName: 'w_main',
        uri: 'file:///w_main.sru',
        line: 50,
        character: 4,
        parameters: [{ label: 'string as_value' }],
        parameterCount: 1,
        signature: 'public function integer of_Convert(string as_value)',
        lineage: { sourceKind: 'document', authority: 'derived', phase: 'implementation', role: 'implementation', confidence: 'direct' }
      },
      { id: 'lw_window', name: 'lw_window', kind: EntityKind.Variable, datatype: 'w_base', containerName: 'w_main', uri: 'file:///w_main.sru', line: 5, character: 0 }
    ]);

    kb.upsertDocument('file:///global.srf', [
      { id: 'global_func', name: 'global_func', kind: EntityKind.Function, uri: 'file:///global.srf', line: 1, character: 0 }
    ]);
    kb.upsertDocument('file:///global_external.srf', [
      {
        id: 'of_external',
        name: 'of_external',
        kind: EntityKind.Function,
        uri: 'file:///global_external.srf',
        line: 2,
        character: 0,
        isExternal: true,
        externalLibraryName: 'kernel32.dll'
      }
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

  test('resolveTargetEntityDetailed prefiere source real frente a orca-staging en global fallback', () => {
    kb.upsertDocument('file:///proj/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/n_shared.sru', [
      {
        id: 'n_shared',
        name: 'n_shared',
        kind: EntityKind.Type,
        uri: 'file:///proj/.vsc-powersyntax/orca-export/orca-staging/lib_app.pbl-source/n_shared.sru',
        line: 0,
        character: 0,
        lineage: {
          sourceKind: 'document',
          sourceOrigin: 'orca-staging',
          authority: 'derived',
          phase: 'implementation',
          role: 'implementation',
          confidence: 'direct'
        }
      }
    ]);
    kb.upsertDocument('file:///proj/src/n_shared.sru', [
      {
        id: 'n_shared',
        name: 'n_shared',
        kind: EntityKind.Type,
        uri: 'file:///proj/src/n_shared.sru',
        line: 0,
        character: 0,
        lineage: {
          sourceKind: 'document',
          sourceOrigin: 'solution-source',
          authority: 'derived',
          phase: 'implementation',
          role: 'implementation',
          confidence: 'direct'
        }
      }
    ]);

    const resolved = resolveTargetEntityDetailed(
      { identifier: 'n_shared' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.reasonCodes[0], 'global-fallback');
    assert.equal(resolved.targets.length, 1);
    assert.equal(resolved.targets[0]?.uri, 'file:///proj/src/n_shared.sru');
    assert.equal(resolved.ambiguityKind, undefined);
    assert.equal(resolved.winnerLineage?.sourceOrigin, 'solution-source');
    assert.ok(resolved.evidence.some((entry) =>
      entry.kind === 'source-origin-conflict'
      && entry.reasonCode === 'global-fallback'
      && entry.preferredOrigin === 'solution-source'
      && entry.discardedOrigins.includes('orca-staging')
    ));
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

  test('B281 filtra overloads por aridad antes de rankear por distancia', () => {
    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_Pick', argumentCount: 2, argumentTypes: ['integer', 'string'] },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 1);
    assert.equal(resolved.targets[0]?.line, 40);
    assert.equal(resolved.confidence, 'high');
    assert.ok(resolved.evidence.some((entry) =>
      entry.kind === 'discarded-signature'
      && entry.reason === 'arity-mismatch'
      && entry.candidateParameterCount === 1
      && entry.invocationArgumentCount === 2
    ));
  });

  test('B281 no trata un override con firma distinta como ganador si los tipos literales apuntan al ancestro', () => {
    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_Convert', argumentCount: 1, argumentTypes: ['integer'] },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 1);
    assert.equal(resolved.targets[0]?.uri, 'file:///w_base.sru');
    assert.equal(resolved.targets[0]?.line, 30);
    assert.ok(resolved.evidence.some((entry) =>
      entry.kind === 'discarded-signature'
      && entry.reason === 'type-mismatch'
      && entry.targetUri === 'file:///w_main.sru'
    ));
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
    assert.equal(resolved.invocationKind, 'dynamic-call');
    assert.equal(resolved.invocationRisk, 'dynamic');
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
    assert.equal(resolved.invocationKind, 'dynamic-call');
    assert.equal(resolved.invocationRisk, 'dynamic');
    assert.deepEqual(resolved.evidence, [{
      kind: 'discarded-context',
      stage: 'qualifier',
      reason: 'qualifier-no-match',
      qualifier: 'lw_window',
      resolvedType: 'w_base'
    }]);
  });

  test('B281 prefiere implementation frente a prototype de la misma firma', () => {
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

    assert.equal(resolved.targets.length, 1);
    assert.equal(resolved.targets[0]?.line, 20);
    assert.equal(resolved.ambiguityKind, undefined);
    assert.equal(resolved.confidence, 'high');
    assert.ok(resolved.evidence.some((entry) =>
      entry.kind === 'discarded-signature' &&
      entry.reasonCode === 'member-hierarchy' &&
      entry.reason === 'prototype-shadowed'
    ));
  });

  test('resolveTargetEntityDetailed conserva ambigüedad entre overloads si la llamada no aporta aridad', () => {
    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_Pick' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 2);
    assert.equal(resolved.ambiguityKind, 'distance-minimum');
    assert.equal(resolved.confidence, 'medium');
  });

  test('resolveTargetEntityDetailed clasifica super::method como inherited call', () => {
    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_SetData', qualifier: 'super', separator: '::' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 1);
    assert.deepEqual(resolved.reasonCodes, ['super-hierarchy']);
    assert.equal(resolved.confidence, 'medium');
    assert.equal(resolved.invocationKind, 'super-call');
    assert.equal(resolved.invocationRisk, 'inherited');
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
    assert.equal(resolved.invocationKind, 'global-call');
    assert.equal(resolved.invocationRisk, 'fallback');
  });

  test('resolveTargetEntityDetailed clasifica external function como external-call', () => {
    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_external' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 1);
    assert.equal(resolved.reasonCodes[0], 'global-fallback');
    assert.equal(resolved.invocationKind, 'external-call');
    assert.equal(resolved.invocationRisk, 'external');
  });

  test('resolveTargetEntityDetailed resuelve parent.call() desde un type nested', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);
    const uri = 'file:///w_nested.srw';

    const globalScope = {
      id: 'global',
      kind: ScopeKind.Global,
      uri,
      startLine: 0,
      endLine: 40,
      children: [] as any[],
      symbols: [] as any[]
    };
    const wMainScope = {
      id: 'w_main',
      kind: ScopeKind.Type,
      uri,
      startLine: 0,
      endLine: 40,
      parent: globalScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    const cbOkScope = {
      id: 'cb_ok',
      kind: ScopeKind.Type,
      uri,
      startLine: 10,
      endLine: 30,
      parent: globalScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    const clickedScope = {
      id: 'cb_ok.clicked',
      kind: ScopeKind.Event,
      uri,
      startLine: 20,
      endLine: 25,
      parent: cbOkScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    globalScope.children.push(wMainScope, cbOkScope);
    cbOkScope.children.push(clickedScope);

    localKb.upsertDocument(uri, [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, uri, line: 0, character: 0 },
      { id: 'cb_ok', name: 'cb_ok', kind: EntityKind.Type, containerName: 'w_main', uri, line: 10, character: 0 },
      { id: 'of_parent', name: 'of_parent', kind: EntityKind.Function, containerName: 'w_main', uri, line: 5, character: 0 },
      { id: 'clicked', name: 'clicked', kind: EntityKind.Event, containerName: 'cb_ok', uri, line: 20, character: 0 }
    ], [globalScope]);

    const resolved = resolveTargetEntityDetailed(
      { identifier: 'of_parent', qualifier: 'parent', separator: '.' },
      uri,
      localKb,
      localGraph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 1);
    assert.equal(resolved.targets[0].containerName, 'w_main');
    assert.deepEqual(resolved.reasonCodes, ['parent-hierarchy']);
    assert.equal(resolved.invocationKind, 'parent-call');
    assert.equal(resolved.invocationRisk, 'safe');
    assert.equal(resolved.resolvedQualifierType, 'w_main');
  });

  test('resolveTargetEntityDetailed resuelve ancestor::event sobre el baseType actual', () => {
    const localKb = new KnowledgeBase();
    const localGraph = new InheritanceGraph(localKb);
    const uri = 'file:///w_main_ancestor.sru';

    const globalScope = {
      id: 'global',
      kind: ScopeKind.Global,
      uri,
      startLine: 0,
      endLine: 20,
      children: [] as any[],
      symbols: [] as any[]
    };
    const mainScope = {
      id: 'w_main',
      kind: ScopeKind.Type,
      uri,
      startLine: 0,
      endLine: 20,
      parent: globalScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    const openScope = {
      id: 'w_main.open',
      kind: ScopeKind.Event,
      uri,
      startLine: 10,
      endLine: 15,
      parent: mainScope,
      children: [] as any[],
      symbols: [] as any[]
    };
    globalScope.children.push(mainScope);
    mainScope.children.push(openScope);

    localKb.beginBatchUpdate();
    localKb.upsertDocument('file:///w_base_ancestor.sru', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///w_base_ancestor.sru', line: 0, character: 0 },
      { id: 'ue_save', name: 'ue_save', kind: EntityKind.Event, containerName: 'w_base', uri: 'file:///w_base_ancestor.sru', line: 8, character: 0 }
    ]);
    localKb.upsertDocument(uri, [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, baseTypeName: 'w_base', uri, line: 0, character: 0 },
      { id: 'open', name: 'open', kind: EntityKind.Event, containerName: 'w_main', uri, line: 10, character: 0 }
    ], [globalScope]);
    localKb.endBatchUpdate();

    const resolved = resolveTargetEntityDetailed(
      { identifier: 'ue_save', qualifier: 'ancestor', separator: '::' },
      uri,
      localKb,
      localGraph,
      { line: 10, traceLabel: 'definition' }
    );

    assert.equal(resolved.targets.length, 1);
    assert.equal(resolved.targets[0].uri, 'file:///w_base_ancestor.sru');
    assert.deepEqual(resolved.reasonCodes, ['ancestor-hierarchy']);
    assert.equal(resolved.confidence, 'medium');
    assert.equal(resolved.invocationKind, 'ancestor-call');
    assert.equal(resolved.invocationRisk, 'inherited');
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
    assert.equal(resolved.invocationKind, 'unqualified-call');
    assert.equal(resolved.invocationRisk, 'safe');
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

  test('resolveTargetEntityDetailed anota el último query trace con confidence y evidence seguras', () => {
    resolveTargetEntityDetailed(
      { identifier: 'of_SetData' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    const trace = getLastTrace();
    assert.equal(trace?.label, 'definition');
    assert.deepEqual(trace?.resolution, {
      confidence: 'high',
      primaryReasonCode: 'member-hierarchy',
      invocationKind: 'unqualified-call',
      invocationRisk: 'safe',
      evidenceKinds: ['winner-target', 'discarded-distance'],
      targetCount: 1,
      hasAmbiguity: false
    });
  });

  test('resolveTargetEntityDetailed marca ambigüedad cuando el fallback global devuelve varios winners cross-project', () => {
    kb.upsertDocument('file:///proj_a/n_conflict.sru', [
      {
        id: 'n_conflict',
        name: 'n_conflict',
        kind: EntityKind.Type,
        uri: 'file:///proj_a/n_conflict.sru',
        line: 0,
        character: 0,
        lineage: {
          sourceKind: 'document',
          sourceOrigin: 'solution-source',
          authority: 'derived',
          phase: 'implementation',
          role: 'implementation',
          confidence: 'direct'
        }
      }
    ]);
    kb.upsertDocument('file:///proj_b/n_conflict.sru', [
      {
        id: 'n_conflict',
        name: 'n_conflict',
        kind: EntityKind.Type,
        uri: 'file:///proj_b/n_conflict.sru',
        line: 0,
        character: 0,
        lineage: {
          sourceKind: 'document',
          sourceOrigin: 'solution-source',
          authority: 'derived',
          phase: 'implementation',
          role: 'implementation',
          confidence: 'direct'
        }
      }
    ]);

    const resolved = resolveTargetEntityDetailed(
      { identifier: 'n_conflict' },
      'file:///w_main.sru',
      kb,
      graph,
      { line: 20, traceLabel: 'definition' }
    );

    assert.equal(resolved.reasonCodes[0], 'global-fallback');
    assert.equal(resolved.targets.length, 2);
    const trace = getLastTrace();
    assert.equal(trace?.resolution?.targetCount, 2);
    assert.equal(trace?.resolution?.hasAmbiguity, true);
  });
});
