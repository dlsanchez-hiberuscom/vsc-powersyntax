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

function deriveKindLabel(e: Entity): string {
  switch (e.kind) {
    case EntityKind.Function: return 'function';
    case EntityKind.Subroutine: return 'subroutine';
    case EntityKind.Event: return 'event';
    case EntityKind.Variable: return 'variable';
    case EntityKind.Type: return 'type';
    default: return String(e.kind ?? 'symbol').toLowerCase();
  }
}

/** Spec 110: construye una etiqueta de firma legible y estable. */
function deriveSignatureLabel(e: Entity): string | undefined {
  if (e.signatureLabel) return e.signatureLabel;
  if (e.kind !== EntityKind.Function && e.kind !== EntityKind.Subroutine && e.kind !== EntityKind.Event) {
    return undefined;
  }
  const params = (e.parameters ?? []).map(p => p.label).join(', ');
  const ret = e.returnType ? ` returns ${e.returnType}` : '';
  return `${e.name}(${params})${ret}`;
}

function deriveLineage(e: Entity, implementationKind: Entity['implementationKind']): Entity['lineage'] {
  if (e.lineage) {
    return e.lineage;
  }

  const phase = e.isPrototype
    ? 'prototype'
    : implementationKind === 'function' || implementationKind === 'subroutine' || implementationKind === 'event'
      ? 'implementation'
      : 'declaration';
  const role = e.isPrototype
    ? 'prototype'
    : implementationKind === 'function' || implementationKind === 'subroutine' || implementationKind === 'event'
      ? 'implementation'
      : undefined;

  return {
    sourceKind: 'document',
    authority: 'derived',
    phase,
    ...(role ? { role } : {}),
    ...(e.baseTypeName ? { inheritedFrom: e.baseTypeName } : {}),
    confidence: 'direct'
  };
}

export function enrichEntity(e: Entity): Entity {
  const implementationKind = deriveImplementationKind(e);
  return {
    ...e,
    parameterCount: e.parameterCount ?? e.parameters?.length,
    ownerName: e.ownerName ?? e.containerName,
    implementationKind,
    kindLabel: e.kindLabel ?? deriveKindLabel(e),
    signatureLabel: deriveSignatureLabel(e),
    lineage: deriveLineage(e, implementationKind)
  };
}
