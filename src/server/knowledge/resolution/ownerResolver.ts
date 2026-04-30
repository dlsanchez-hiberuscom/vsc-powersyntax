/**
 * Owner Resolver (Spec 024 / B060).
 *
 * Resuelve la expresión "owner" previa a un punto/`::` para inferir el
 * tipo cuyos miembros consultar.
 *
 * Casos soportados:
 *   - `this`       → `ctx.currentType`.
 *   - `super` / `super::`  → primer ancestro (vía graph).
 *   - variable simple con `datatype` conocido en `ctx.localVars` → su datatype.
 *   - cualquier otro → null.
 *
 * @module knowledge/resolution/ownerResolver
 */

import type { InheritanceGraph } from './InheritanceGraph';

export interface OwnerContext {
  /** Tipo del scope actual (window/userobject) si lo conocemos. */
  currentType: string | null;
  /** Variables visibles con su datatype (id en minúsculas). */
  localVars?: ReadonlyMap<string, string>;
  /** Grafo para resolver `super`. Opcional (solo necesario para super). */
  graph?: InheritanceGraph;
}

export interface OwnerResolution {
  ownerType: string | null;
  isSuper: boolean;
}

const SUPER_RE = /^super(\s*::)?$/i;

export function resolveOwnerExpression(
  prefix: string,
  ctx: OwnerContext
): OwnerResolution {
  const raw = prefix.trim();
  if (!raw) return { ownerType: null, isSuper: false };
  const lower = raw.toLowerCase();

  if (lower === 'this') {
    return { ownerType: ctx.currentType ?? null, isSuper: false };
  }
  if (SUPER_RE.test(lower)) {
    if (!ctx.currentType || !ctx.graph) return { ownerType: null, isSuper: true };
    const ancestors = ctx.graph.getAncestors(ctx.currentType);
    return { ownerType: ancestors[0] ?? null, isSuper: true };
  }
  // Variable simple
  if (ctx.localVars) {
    const dt = ctx.localVars.get(lower);
    if (dt) return { ownerType: dt, isSuper: false };
  }
  return { ownerType: null, isSuper: false };
}
