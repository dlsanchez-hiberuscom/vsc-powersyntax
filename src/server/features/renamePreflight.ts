/**
 * Rename pre-flight (Spec 048 / B032).
 *
 * Valida rápidamente un nuevo nombre antes de invocar al rename real.
 *
 * @module features/renamePreflight
 */

import type { SystemCatalog } from '../knowledge/system/SystemCatalog';

export interface RenamePreflightContext {
  systemCatalog?: SystemCatalog;
  /** Palabras reservadas adicionales del proyecto. */
  extraReserved?: ReadonlySet<string>;
}

export interface RenamePreflightResult {
  ok: boolean;
  reason?: string;
}

const ID_RE = /^[A-Za-z_][\w$#%-]*$/;

const RESERVED = new Set([
  'if', 'then', 'else', 'elseif', 'end', 'for', 'next', 'do', 'while',
  'until', 'loop', 'choose', 'case', 'return', 'continue', 'exit',
  'function', 'subroutine', 'event', 'on', 'forward', 'prototypes',
  'global', 'shared', 'public', 'private', 'protected', 'this', 'super',
  'null', 'true', 'false'
]);

export function validateRenameTarget(
  newName: string,
  ctx: RenamePreflightContext = {}
): RenamePreflightResult {
  const trimmed = (newName ?? '').trim();
  if (!trimmed) return { ok: false, reason: 'Nombre vacío.' };
  if (!ID_RE.test(trimmed)) {
    return { ok: false, reason: 'Identificador PowerScript inválido.' };
  }
  const lower = trimmed.toLowerCase();
  if (RESERVED.has(lower)) {
    return { ok: false, reason: `'${trimmed}' es una palabra reservada.` };
  }
  if (ctx.extraReserved?.has(lower)) {
    return { ok: false, reason: `'${trimmed}' está reservada en este proyecto.` };
  }
  if (ctx.systemCatalog && ctx.systemCatalog.findSystemSymbol(trimmed).length > 0) {
    return { ok: false, reason: `'${trimmed}' colisiona con un símbolo del sistema.` };
  }
  return { ok: true };
}
