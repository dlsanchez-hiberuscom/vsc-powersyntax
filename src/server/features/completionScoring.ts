/**
 * Completion scoring (Spec 035 / B061).
 *
 * Asigna un coste a cada candidato priorizando proximidad semántica.
 * Menor coste = mejor candidato.
 *
 * @module features/completionScoring
 */

import type { Entity } from '../knowledge/types';
import { isAccessibleFrom } from '../knowledge/visibility';

export interface ScoreContext {
  /** Tipo del scope actual (window/userobject), si aplica. */
  currentType: string | null;
  /** Nombres locales declarados en el callable actual (lowercase). */
  locals?: ReadonlySet<string>;
  /** Distancia de un tipo respecto al currentType (0 = mismo, n = ancestro n). */
  typeDistance?: (typeName: string) => number;
  /** Si la entidad está en la cadena de herencia del currentType. */
  isDescendant?: (child: string, ancestor: string) => boolean;
}

const SCORE_LOCAL = 0;
const SCORE_OWN_MEMBER = 1;
const SCORE_INHERITED_BASE = 2;
const SCORE_GLOBAL = 100;

export function scoreCandidate(candidate: Entity, ctx: ScoreContext): number {
  // Filtrado por visibilidad antes de puntuar.
  const accessible = isAccessibleFrom(candidate, {
    contextOwner: ctx.currentType,
    isDescendant: ctx.isDescendant
  });
  if (!accessible) return Number.POSITIVE_INFINITY;

  const nameLower = candidate.name.toLowerCase();
  if (ctx.locals?.has(nameLower)) return SCORE_LOCAL;

  const owner = (candidate.containerName ?? candidate.ownerName ?? '').toLowerCase();
  const me = (ctx.currentType ?? '').toLowerCase();

  if (!owner) return SCORE_GLOBAL;
  if (owner === me) return SCORE_OWN_MEMBER;

  if (ctx.typeDistance) {
    const d = ctx.typeDistance(owner);
    if (Number.isFinite(d)) return SCORE_INHERITED_BASE + d;
  }
  return SCORE_GLOBAL;
}

export function sortByScore(candidates: Entity[], ctx: ScoreContext): Entity[] {
  return candidates
    .map((entity, idx) => ({ entity, score: scoreCandidate(entity, ctx), idx }))
    .filter((x) => Number.isFinite(x.score))
    .sort((a, b) => (a.score - b.score) || (a.idx - b.idx))
    .map((x) => x.entity);
}
