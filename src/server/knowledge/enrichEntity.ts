/**
 * Enrich Entity (Spec 021 / B064).
 *
 * Helper puro que rellena campos derivables de los datos ya presentes
 * en una `Entity`. No mutua: devuelve una nueva referencia.
 *
 * @module knowledge/enrichEntity
 */

import { type Entity, EntityKind } from './types';

function deriveImplementationKind(e: Entity): Entity['implementationKind'] {
  if (e.implementationKind) return e.implementationKind;
  switch (e.kind) {
    case EntityKind.Function:
      return 'function';
    case EntityKind.Subroutine:
      return 'subroutine';
    case EntityKind.Event:
      return 'event';
    case EntityKind.Type:
      return 'type';
    case EntityKind.Variable:
      return e.scope === 'Instancia' ? 'instance-var' : undefined;
    default:
      return undefined;
  }
}

export function enrichEntity(e: Entity): Entity {
  return {
    ...e,
    parameterCount: e.parameterCount ?? e.parameters?.length,
    ownerName: e.ownerName ?? e.containerName,
    implementationKind: deriveImplementationKind(e)
  };
}
