/**
 * Hover formatter (Spec 037 / B103).
 *
 * Genera markdown enriquecido para entidades del usuario.
 *
 * @module features/hoverFormat
 */

import { enrichEntity } from '../knowledge/enrichEntity';
import { Entity, EntityKind, type EntityLineage } from '../knowledge/types';
import type { QueryReasonCode, QueryResolutionConfidence } from '../knowledge/resolution/semanticQueryService';

const KIND_NAME: Record<string, string> = {
  Type: 'Objeto / Estructura',
  Function: 'Función',
  Subroutine: 'Subrutina',
  Event: 'Evento',
  Variable: 'Variable'
};

export interface HoverResolutionSummary {
  confidence?: QueryResolutionConfidence;
  reasonCode?: QueryReasonCode;
  ambiguous?: boolean;
  targetCount?: number;
}

export function formatLineageHover(lineage?: EntityLineage): string | null {
  if (!lineage) {
    return null;
  }

  const segments: string[] = [];

  if (lineage.sourceKind) {
    segments.push(`*Origen:* ${lineage.sourceKind}`);
  }

  if (lineage.authority) {
    segments.push(`*Autoridad:* ${lineage.authority}`);
  }

  if (lineage.phase) {
    segments.push(`*Fase:* ${lineage.phase}`);
  }

  if (lineage.role) {
    segments.push(`*Rol:* ${lineage.role}`);
  }

  if (lineage.inheritedFrom) {
    segments.push(`*Hereda de:* ${lineage.inheritedFrom}`);
  }

  if (lineage.confidence) {
    segments.push(`*Confianza:* ${lineage.confidence}`);
  }

  return segments.length > 0 ? segments.join(' · ') : null;
}

export function formatUserHover(entity: Entity, resolution?: HoverResolutionSummary): string {
  const enriched = enrichEntity(entity);
  const out: string[] = [];
  const access = enriched.access ? `${enriched.access} ` : '';

  let signature: string;
  if (enriched.kind === EntityKind.Variable) {
    const scopeStr = enriched.scope ? `(${enriched.scope}) ` : '';
    signature = `${scopeStr}${access}${enriched.datatype ?? 'any'} ${enriched.name}`;
  } else if (enriched.kind === EntityKind.Function || enriched.kind === EntityKind.Subroutine) {
    signature = enriched.signature ?? `${access}${enriched.kind.toLowerCase()} ${enriched.name}(...)`;
  } else {
    signature = enriched.signature ?? `(${KIND_NAME[enriched.kind] ?? enriched.kind}) ${enriched.name}`;
  }
  out.push('```powerbuilder');
  out.push(signature);
  out.push('```');
  out.push('---');

  // Tag prototipo vs implementación.
  if (enriched.isPrototype === true) {
    out.push('*(Prototype)*');
  } else if (enriched.implementationKind === 'on-handler') {
    out.push('*(On-handler)*');
  } else if (enriched.implementationKind === 'external-function') {
    out.push('*(External function declaration)*');
  } else if (enriched.isPrototype === false &&
    (enriched.kind === EntityKind.Function ||
      enriched.kind === EntityKind.Subroutine ||
      enriched.kind === EntityKind.Event)) {
    out.push('*(Implementation)*');
  }

  if (enriched.isExternal && enriched.externalLibraryName) {
    out.push(`**External library:** \`${enriched.externalLibraryName}\``);
  }

  if (enriched.isExternal && enriched.externalDependencyKind) {
    out.push(`**Native dependency kind:** \`${enriched.externalDependencyKind}\``);
  }

  if (enriched.isExternal && enriched.externalAlias) {
    out.push(`**External alias:** \`${enriched.externalAlias}\``);
  }

  if (enriched.documentation) {
    out.push('');
    out.push(enriched.documentation);
  }

  const lineage = formatLineageHover(enriched.lineage);
  if (lineage) {
    out.push('');
    out.push(lineage);
  }

  if (resolution?.confidence) {
    out.push('');
    out.push(`*Confianza de resolución:* ${resolution.confidence}`);
  }

  if (resolution?.reasonCode) {
    out.push('');
    out.push(`*Motivo de resolución:* ${resolution.reasonCode}`);
  }

  if (resolution?.ambiguous) {
    out.push('');
    out.push(`*Resolución ambigua:* ${resolution.targetCount ?? 0} candidatos con distancia mínima`);
  }

  if (typeof resolution?.targetCount === 'number' && resolution.targetCount > 0) {
    out.push('');
    out.push(`*Candidatos ganadores:* ${resolution.targetCount}`);
  }

  if (enriched.declarationScope) {
    out.push('');
    out.push(`*Declaration scope:* ${enriched.declarationScope}`);
  }

  if (enriched.ownerName) {
    out.push('');
    out.push(`*Owner real:* \`${enriched.ownerName}\``);
  }

  if (enriched.fileObjectName && enriched.fileObjectName !== enriched.ownerName) {
    out.push('');
    out.push(`*Objeto archivo:* \`${enriched.fileObjectName}\``);
  }

  if (
    (enriched.declarationScope === 'local' || enriched.declarationScope === 'parameter')
    && enriched.containerSignature
  ) {
    out.push('');
    out.push(`*Callable contenedor:* \`${enriched.containerSignature}\``);
  }

  if (enriched.containerKind) {
    out.push('');
    out.push(`*Container kind:* ${enriched.containerKind}`);
  }

  if (enriched.containerName) {
    out.push('');
    out.push(`*Definido en:* \`${enriched.containerName}\``);
  }
  return out.join('\n');
}
