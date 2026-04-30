/**
 * Hover formatter (Spec 037 / B103).
 *
 * Genera markdown enriquecido para entidades del usuario.
 *
 * @module features/hoverFormat
 */

import { Entity, EntityKind } from '../knowledge/types';

const KIND_NAME: Record<string, string> = {
  Type: 'Objeto / Estructura',
  Function: 'Función',
  Subroutine: 'Subrutina',
  Event: 'Evento',
  Variable: 'Variable'
};

export function formatUserHover(entity: Entity): string {
  const out: string[] = [];
  const access = entity.access ? `${entity.access} ` : '';

  let signature: string;
  if (entity.kind === EntityKind.Variable) {
    const scopeStr = entity.scope ? `(${entity.scope}) ` : '';
    signature = `${scopeStr}${access}${entity.datatype ?? 'any'} ${entity.name}`;
  } else if (entity.kind === EntityKind.Function || entity.kind === EntityKind.Subroutine) {
    signature = entity.signature ?? `${access}${entity.kind.toLowerCase()} ${entity.name}(...)`;
  } else {
    signature = `(${KIND_NAME[entity.kind] ?? entity.kind}) ${entity.name}`;
  }
  out.push('```powerbuilder');
  out.push(signature);
  out.push('```');
  out.push('---');

  // Tag prototipo vs implementación.
  if (entity.isPrototype === true) {
    out.push('*(Prototype)*');
  } else if (entity.isPrototype === false &&
    (entity.kind === EntityKind.Function ||
      entity.kind === EntityKind.Subroutine ||
      entity.kind === EntityKind.Event)) {
    out.push('*(Implementation)*');
  }

  if (entity.isExternal && entity.externalLibraryName) {
    out.push(`**External library:** \`${entity.externalLibraryName}\``);
  }

  if (entity.documentation) {
    out.push('');
    out.push(entity.documentation);
  }

  if (entity.containerName) {
    out.push('');
    out.push(`*Definido en:* \`${entity.containerName}\``);
  }
  return out.join('\n');
}
