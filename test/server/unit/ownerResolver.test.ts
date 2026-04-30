import * as assert from 'assert/strict';
import { resolveOwnerExpression } from '../../../src/server/knowledge/resolution/ownerResolver';
import { KnowledgeBase } from '../../../src/server/knowledge/KnowledgeBase';
import { InheritanceGraph } from '../../../src/server/knowledge/resolution/InheritanceGraph';
import { EntityKind } from '../../../src/server/knowledge/types';

suite('unit/ownerResolver (B060)', () => {
  test('this → currentType', () => {
    const r = resolveOwnerExpression('this', { currentType: 'w_main' });
    assert.equal(r.ownerType, 'w_main');
    assert.equal(r.isSuper, false);
  });

  test('super → primer ancestro', () => {
    const kb = new KnowledgeBase();
    const graph = new InheritanceGraph(kb);
    kb.beginBatchUpdate();
    kb.upsertDocument('file:///b.sru', [
      { id: 'w_base', name: 'w_base', kind: EntityKind.Type, uri: 'file:///b.sru', line: 0, character: 0 }
    ]);
    kb.upsertDocument('file:///m.sru', [
      { id: 'w_main', name: 'w_main', kind: EntityKind.Type, uri: 'file:///m.sru', line: 0, character: 0, baseTypeName: 'w_base' }
    ]);
    kb.endBatchUpdate();

    const r = resolveOwnerExpression('super', { currentType: 'w_main', graph });
    assert.equal(r.ownerType?.toLowerCase(), 'w_base');
    assert.equal(r.isSuper, true);
  });

  test('variable con datatype', () => {
    const localVars = new Map([['mydw', 'datawindow']]);
    const r = resolveOwnerExpression('mydw', { currentType: 'w_main', localVars });
    assert.equal(r.ownerType, 'datawindow');
  });

  test('desconocido → null', () => {
    const r = resolveOwnerExpression('foo', { currentType: 'w_main' });
    assert.equal(r.ownerType, null);
  });
});
