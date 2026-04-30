/**
 * Symbol key (Spec 031 / B101).
 *
 * Deriva una clave estable que distingue símbolos homónimos en distintos
 * contenedores y/o con distinta aridad.
 *
 * @module knowledge/symbolKey
 */

import type { Entity } from './types';

export function buildSymbolKey(e: Entity): string {
  const kind = String(e.kind);
  const owner = (e.containerName ?? e.ownerName ?? '').toLowerCase();
  const name = e.name.toLowerCase();
  const arity = e.parameterCount ?? e.parameters?.length ?? -1;
  return `${kind}|${owner}|${name}|${arity}`;
}

export function dedupeBySymbolKey<T extends Entity>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const it of items) {
    const k = buildSymbolKey(it);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}
