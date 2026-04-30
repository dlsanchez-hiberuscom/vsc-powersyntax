/**
 * Caché caliente del contexto activo.
 *
 * Mantiene en memoria datos derivados del **documento activo** (el que
 * está editando el usuario) y de sus dependencias inmediatas, evitando
 * recomputar ancestros, miembros heredados o entidades del archivo en
 * cada interacción (hover, completion, definition, signatureHelp).
 *
 * Reglas de invalidación:
 * - Cambiar `activeUri` invalida todo.
 * - Cambiar la versión de la KnowledgeBase invalida todo.
 * - `invalidateForUri(activeUri)` invalida pero conserva la identidad
 *   del activo (la próxima `setActive` re-poblará el caché sin perder
 *   el contexto del usuario).
 * - `invalidateForUri(otra)` solo limpia entradas asociadas a tipos
 *   que vivan en esa URI (estrategia conservadora: limpia la lista de
 *   miembros heredados ya que un cambio en cualquier ancestro puede
 *   afectarla).
 *
 * Esta caché vive aguas arriba de la KnowledgeBase y no la modifica.
 *
 * @module knowledge/HotContextCache
 */

import { normalizeUri } from '../system/uriUtils';
import type { Entity } from './types';

export class HotContextCache {
  private activeUri: string | null = null;
  private kbVersion = -1;

  /** Entidades del archivo activo (snapshot bajo la versión actual de la KB). */
  private activeEntities: Entity[] | undefined;

  /** Miembros heredados pre-resueltos por nombre de tipo. */
  private inheritedMembers: Map<string, Entity[]> = new Map();

  // ---- Identidad activa ----------------------------------------------------

  /**
   * Establece el documento activo y la versión de KB para la cual los
   * datos derivados son válidos. Si cambia cualquiera de los dos, el
   * caché entero se invalida.
   */
  setActive(uri: string, kbVersion: number): void {
    const normalized = normalizeUri(uri);
    if (this.activeUri !== normalized || this.kbVersion !== kbVersion) {
      this.invalidate();
      this.activeUri = normalized;
      this.kbVersion = kbVersion;
    }
  }

  getActiveUri(): string | null {
    return this.activeUri;
  }

  getKbVersion(): number {
    return this.kbVersion;
  }

  // ---- Entidades del documento activo --------------------------------------

  getActiveEntities(): Entity[] | undefined {
    return this.activeEntities;
  }

  setActiveEntities(entities: Entity[]): void {
    this.activeEntities = entities;
  }

  // ---- Miembros heredados --------------------------------------------------

  getInheritedMembers(typeName: string): Entity[] | undefined {
    return this.inheritedMembers.get(typeName.toLowerCase());
  }

  setInheritedMembers(typeName: string, members: Entity[]): void {
    this.inheritedMembers.set(typeName.toLowerCase(), members);
  }

  // ---- Invalidación --------------------------------------------------------

  /** Limpia todas las entradas pero conserva el estado de identidad. */
  invalidate(): void {
    this.activeEntities = undefined;
    this.inheritedMembers.clear();
  }

  /**
   * Invalida lo asociado a una URI concreta. Estrategia conservadora:
   * - si la URI es la activa, limpia todo (pero conserva activeUri).
   * - si es otra URI, limpia inheritedMembers (cualquier cambio en un
   *   ancestro potencial requiere recomputación).
   */
  invalidateForUri(uri: string): void {
    const normalized = normalizeUri(uri);
    if (normalized === this.activeUri) {
      this.activeEntities = undefined;
      this.inheritedMembers.clear();
    } else {
      this.inheritedMembers.clear();
    }
  }

  /** Reinicia el caché por completo (incluyendo la identidad activa). */
  reset(): void {
    this.activeUri = null;
    this.kbVersion = -1;
    this.invalidate();
  }
}
