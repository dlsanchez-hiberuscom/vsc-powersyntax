/**
 * Nesting helpers (Spec 030 / B099).
 *
 * @module parsing/nesting
 */

export interface NestableRange {
  startLine: number;
  endLine: number;
}

export function contains(range: NestableRange, line: number): boolean {
  return line >= range.startLine && line <= range.endLine;
}

function span(range: NestableRange): number {
  return range.endLine - range.startLine;
}

/**
 * Devuelve negativo si `a` está más anidado que `b` (gana `a`).
 * `a` está más anidado si su span es menor.
 */
export function compareByNesting(a: NestableRange, b: NestableRange): number {
  return span(a) - span(b);
}

/**
 * Selecciona el ítem cuyo rango contiene `line` y es el más anidado.
 * Devuelve null si ninguno contiene la posición.
 */
export function pickInnermost<T extends NestableRange>(items: T[], line: number): T | null {
  let winner: T | null = null;
  for (const it of items) {
    if (!contains(it, line)) continue;
    if (!winner || compareByNesting(it, winner) < 0) {
      winner = it;
    }
  }
  return winner;
}
