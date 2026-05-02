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
  if (e.isExternal && (e.kind === EntityKind.Function || e.kind === EntityKind.Subroutine)) {
    return 'external-function';
  }
  if (
    e.kind === EntityKind.Event
    && typeof e.signature === 'string'
    && e.signature.trim().toLowerCase().startsWith('on ')
  ) {
    return 'on-handler';
  }
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

function deriveDeclarationScope(e: Entity): Entity['declarationScope'] {
  if (e.declarationScope) return e.declarationScope;
  if (e.kind === EntityKind.Type) return 'type';
  if (e.kind === EntityKind.Function || e.kind === EntityKind.Subroutine || e.kind === EntityKind.Event) {
    return 'callable';
  }
  if (e.scope === 'Argumento') return 'parameter';
  if (e.scope === 'Local') return 'local';
  if (e.kind === EntityKind.Variable) return 'member';
  return undefined;
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
  const declarationScope = deriveDeclarationScope(e);
  const inferredOwnerName = (() => {
    if (e.ownerName) return e.ownerName;
    if ((declarationScope === 'local' || declarationScope === 'parameter') && e.containerName) {
      const callableSeparator = e.containerName.indexOf('.');
      if (callableSeparator > 0) {
        return e.containerName.slice(0, callableSeparator);
      }
    }
    return e.containerName ?? e.fileObjectName;
  })();

  return {
    ...e,
    declarationScope,
    parameterCount: e.parameterCount ?? e.parameters?.length,
    ownerName: inferredOwnerName,
    implementationKind,
    kindLabel: e.kindLabel ?? deriveKindLabel(e),
    signatureLabel: deriveSignatureLabel(e),
    lineage: deriveLineage(e, implementationKind)
  };
}
