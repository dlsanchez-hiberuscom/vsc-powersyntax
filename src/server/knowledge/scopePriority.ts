/**
 * Canonical variable scope priority for PowerBuilder resolution.
 *
 * PowerBuilder resolves variables in this order:
 *   1. Local / Argumento  (innermost scope wins)
 *   2. Compartida          (shared variables)
 *   3. Global              (global variables)
 *   4. Instancia           (instance variables of the object)
 *
 * Lower numeric priority = higher precedence (preferred during resolution).
 *
 * This module is the **single source of truth** for scope ordering.
 * Both `semanticQueryService` and `InheritanceGraph` must import from here.
 *
 * @module knowledge/scopePriority
 * @see AUDIT-04-DERIVED-001
 */

import type { Entity } from './types';

export type VariableScope = NonNullable<Entity['scope']>;

/**
 * Prioridad canónica de scopes de variables PowerBuilder.
 *
 * Valor numérico más bajo = mayor prioridad en la resolución.
 */
export const VARIABLE_SCOPE_PRIORITY = new Map<VariableScope, number>([
  ['Local', 0],
  ['Argumento', 0],
  ['Compartida', 1],
  ['Global', 2],
  ['Instancia', 3],
]);

/**
 * Devuelve la prioridad numérica de un scope de variable.
 *
 * `undefined` o scopes desconocidos devuelven `Number.MAX_SAFE_INTEGER`
 * para que queden al final de la resolución.
 */
export function getVariableScopePriority(scope: VariableScope | undefined): number {
  return VARIABLE_SCOPE_PRIORITY.get(scope ?? 'Instancia') ?? Number.MAX_SAFE_INTEGER;
}
