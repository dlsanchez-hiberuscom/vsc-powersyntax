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
 * - Cambiar la época semántica (`semanticEpoch`) de la KnowledgeBase invalida todo.
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

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

export class HotContextCache {
  private activeUri: string | null = null;
  private semanticEpoch = -1;

  /** Entidades del archivo activo (snapshot bajo la versión actual de la KB). */
  private activeEntities: Entity[] | undefined;

  /** Miembros heredados pre-resueltos por nombre de tipo. */
  private inheritedMembers: Map<string, Entity[]> = new Map();
  /** Spec 119: cap LRU para evitar crecimiento ilimitado en sesiones largas. */
  private readonly maxInheritedTypes = 128;

  // ---- Identidad activa ----------------------------------------------------

  /**
   * Establece el documento activo y la época semántica para la cual los
   * datos derivados son válidos. Si cambia cualquiera de los dos, el
   * caché entero se invalida.
   */
  setActive(uri: string, semanticEpoch: number): void {
    const normalized = normalizeUri(uri);
    if (this.activeUri !== normalized || this.semanticEpoch !== semanticEpoch) {
      this.invalidate();
      this.activeUri = normalized;
      this.semanticEpoch = semanticEpoch;
    }
  }

  getActiveUri(): string | null {
    return this.activeUri;
  }

  getSemanticEpoch(): number {
    return this.semanticEpoch;
  }

  // ---- Entidades del documento activo --------------------------------------

  getActiveEntities(): Entity[] | undefined {
    return this.activeEntities ? cloneValue(this.activeEntities) : undefined;
  }

  setActiveEntities(entities: Entity[]): void {
    this.activeEntities = cloneValue(entities);
  }

  // ---- Miembros heredados --------------------------------------------------

  getInheritedMembers(typeName: string): Entity[] | undefined {
    const members = this.inheritedMembers.get(typeName.toLowerCase());
    return members ? cloneValue(members) : undefined;
  }

  setInheritedMembers(typeName: string, members: Entity[]): void {
    const key = typeName.toLowerCase();
    if (this.inheritedMembers.has(key)) {
      this.inheritedMembers.delete(key);
    } else if (this.inheritedMembers.size >= this.maxInheritedTypes) {
      const oldest = this.inheritedMembers.keys().next().value;
      if (oldest !== undefined) this.inheritedMembers.delete(oldest);
    }
    this.inheritedMembers.set(key, cloneValue(members));
  }

  /** Spec 119: estadísticas para introspección. */
  getStats(): { activeUri: string | null; semanticEpoch: number; inheritedTypes: number; capacity: number } {
    return {
      activeUri: this.activeUri,
      semanticEpoch: this.semanticEpoch,
      inheritedTypes: this.inheritedMembers.size,
      capacity: this.maxInheritedTypes
    };
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
    this.semanticEpoch = -1;
    this.invalidate();
  }
}
