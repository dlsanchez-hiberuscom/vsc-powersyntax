import * as assert from 'assert/strict';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { resolveTargetEntity } from '../../../src/server/knowledge/resolution/semanticQueryService';
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
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, containerName: 'w_base', uri: 'file:///w_base.sru', line: 10, character: 4 }
    ]);
    
    kb.upsertDocument('file:///w_main.sru', [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, baseTypeName: 'w_base', uri: 'file:///w_main.sru', line: 0, character: 0 },
      { id: 'of_setdata', name: 'of_SetData', kind: EntityKind.Function, containerName: 'w_main', uri: 'file:///w_main.sru', line: 20, character: 4 },
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
});
