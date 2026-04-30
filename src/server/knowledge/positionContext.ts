/**
 * Position context (Spec 032 / B054).
 *
 * Helpers reutilizables para razonar sobre el contexto del cursor.
 *
 * @module knowledge/positionContext
 */

import { ScopeKind, type Scope, type Fact, EntityKind } from './types';
import { pickInnermost } from '../parsing/nesting';

export interface PositionContext {
  currentCallable: Scope | null;
  currentType: Fact | null;
}

function flatten(scopes: Scope[]): Scope[] {
  const out: Scope[] = [];
  function walk(s: Scope): void {
    out.push(s);
    for (const c of s.children) walk(c);
  }
  for (const s of scopes) walk(s);
  return out;
}

export function findInnermostCallableAtPosition(scopes: Scope[], line: number): Scope | null {
  const flat = flatten(scopes).filter(
    (s) => s.kind === ScopeKind.Function || s.kind === ScopeKind.Event
  );
  return pickInnermost(flat, line);
}

export function findInnermostTypeAtPosition(facts: Fact[], line: number): Fact | null {
  // Las entidades Type no tienen rangos explícitos; aproximamos:
  // 1) el Type en cuyo containerName está el callable que contiene la línea (no disponible aquí), o
  // 2) el Type cuya `line` es la mayor que sea ≤ line (último Type declarado antes).
  const types = facts.filter((f) => f.kind === EntityKind.Type);
  let best: Fact | null = null;
  for (const t of types) {
    if (t.line > line) continue;
    if (!best || t.line > best.line) best = t;
  }
  return best;
}

export function getPositionContext(scopes: Scope[], facts: Fact[], line: number): PositionContext {
  return {
    currentCallable: findInnermostCallableAtPosition(scopes, line),
    currentType: findInnermostTypeAtPosition(facts, line)
  };
}
