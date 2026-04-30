import * as assert from 'assert/strict';
import {
  findInnermostCallableAtPosition,
  findInnermostTypeAtPosition,
  getPositionContext
} from '../../../src/server/knowledge/positionContext';
import { EntityKind, ScopeKind, type Scope, type Fact } from '../../../src/server/knowledge/types';

function scope(id: string, kind: ScopeKind, startLine: number, endLine: number, children: Scope[] = []): Scope {
  return { id, kind, uri: 'file:///x', startLine, endLine, children, symbols: [] };
}

suite('unit/positionContext (B054)', () => {
  test('innermost callable detectado', () => {
    const fn = scope('w.f', ScopeKind.Function, 5, 15);
    const t = scope('w', ScopeKind.Type, 0, 30, [fn]);
    const got = findInnermostCallableAtPosition([t], 7);
    assert.equal(got?.id, 'w.f');
  });

  test('null si fuera de callable', () => {
    const fn = scope('w.f', ScopeKind.Function, 5, 15);
    const t = scope('w', ScopeKind.Type, 0, 30, [fn]);
    assert.equal(findInnermostCallableAtPosition([t], 25), null);
  });

  test('innermost type por línea de declaración', () => {
    const facts: Fact[] = [
      { id: 'w_a', name: 'w_a', kind: EntityKind.Type, uri: 'file:///x', line: 0, character: 0 },
      { id: 'w_b', name: 'w_b', kind: EntityKind.Type, uri: 'file:///x', line: 50, character: 0 }
    ];
    assert.equal(findInnermostTypeAtPosition(facts, 60)?.name, 'w_b');
    assert.equal(findInnermostTypeAtPosition(facts, 10)?.name, 'w_a');
  });

  test('getPositionContext combina ambos', () => {
    const fn = scope('w.f', ScopeKind.Function, 5, 15);
    const t = scope('w', ScopeKind.Type, 0, 30, [fn]);
    const facts: Fact[] = [
      { id: 'w', name: 'w', kind: EntityKind.Type, uri: 'file:///x', line: 0, character: 0 }
    ];
    const ctx = getPositionContext([t], facts, 7);
    assert.equal(ctx.currentCallable?.id, 'w.f');
    assert.equal(ctx.currentType?.name, 'w');
  });
});
