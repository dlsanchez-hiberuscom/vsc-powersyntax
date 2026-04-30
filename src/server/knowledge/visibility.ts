/**
 * Visibility (Spec 022 / B059).
 *
 * Modelo simplificado de visibilidad PowerScript:
 *   - public:    accesible desde cualquier sitio.
 *   - protected: accesible desde el propio owner y sus descendientes.
 *   - private:   accesible solo desde el propio owner.
 *   - system:    APIs internas; tratado como public por defecto.
 *
 * Las variantes `*read`/`*write` se colapsan a su nivel base para esta fase.
 *
 * @module knowledge/visibility
 */

import type { Entity } from './types';

export type Visibility = 'public' | 'protected' | 'private' | 'system';

const TABLE: Record<string, Visibility> = {
  public: 'public',
  protected: 'protected',
  private: 'private',
  system: 'system',
  protectedread: 'protected',
  protectedwrite: 'protected',
  privateread: 'private',
  privatewrite: 'private',
  publicread: 'public',
  publicwrite: 'public'
};

export function parseVisibility(token: string | undefined | null): Visibility {
  if (!token) return 'public';
  const t = token.trim().toLowerCase().replace(/\s+/g, '');
  return TABLE[t] ?? 'public';
}

interface AccessContext {
  /** Nombre del tipo desde el que se accede (ownerName). */
  contextOwner: string | null;
  /** Función opcional para saber si `child` desciende de `ancestor`. */
  isDescendant?: (child: string, ancestor: string) => boolean;
}

export function isAccessibleFrom(symbol: Entity, ctx: AccessContext): boolean {
  const vis = parseVisibility(symbol.access);
  if (vis === 'public' || vis === 'system') return true;

  const owner = (symbol.ownerName ?? symbol.containerName ?? '').toLowerCase();
  const me = (ctx.contextOwner ?? '').toLowerCase();
  if (!owner) return true; // datos insuficientes: no rompemos UX.

  if (vis === 'private') return owner === me;
  // protected
  if (owner === me) return true;
  return ctx.isDescendant ? ctx.isDescendant(me, owner) : false;
}
