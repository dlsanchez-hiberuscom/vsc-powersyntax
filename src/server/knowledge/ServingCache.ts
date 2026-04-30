/**
 * Caché de serving para features interactivas (hover, completion,
 * signatureHelp, definition).
 *
 * Memoriza el resultado calculado por feature, archivo y posición,
 * acotado a una versión concreta de la KnowledgeBase. Se invalida:
 * - cuando cambia el contenido del archivo (`invalidate(uri)`),
 * - cuando se cierra el archivo (`invalidate(uri)`),
 * - cuando se considera necesario un reset total (`invalidate()`).
 *
 * Usa una política LRU sencilla: al alcanzar `maxEntries`, se eliminan
 * los elementos más antiguos.
 *
 * @module knowledge/ServingCache
 */

import { normalizeUri } from '../system/uriUtils';

export type ServingFeature = 'hover' | 'completion' | 'signatureHelp' | 'definition';

export interface ServingKeyParts {
  feature: ServingFeature;
  uri: string;
  line: number;
  character: number;
  kbVersion: number;
  /** Cualquier discriminador extra (p. ej. trigger char, query). */
  extra?: string;
}

/**
 * Construye una clave estable a partir de las partes que identifican
 * un resultado servido.
 */
export function makeKey(p: ServingKeyParts): string {
  const uri = normalizeUri(p.uri);
  const extra = p.extra ?? '';
  return `${p.feature}|${uri}|${p.line}|${p.character}|${p.kbVersion}|${extra}`;
}

/**
 * Devuelve la URI normalizada contenida en una clave de ServingCache.
 * Útil para invalidación selectiva.
 */
function uriFromKey(key: string): string | null {
  // formato: feature|uri|line|character|kbVersion|extra
  const firstPipe = key.indexOf('|');
  if (firstPipe < 0) return null;
  const secondPipe = key.indexOf('|', firstPipe + 1);
  if (secondPipe < 0) return null;
  return key.substring(firstPipe + 1, secondPipe);
}

export class ServingCache<T = unknown> {
  private readonly entries: Map<string, T> = new Map();

  constructor(private readonly maxEntries: number = 256) {}

  /** Recupera un valor y lo "calienta" (lo mueve al final de la LRU). */
  get(key: string): T | undefined {
    const value = this.entries.get(key);
    if (value !== undefined) {
      this.entries.delete(key);
      this.entries.set(key, value);
    }
    return value;
  }

  /** Inserta un valor; si la caché está llena, evicta el más antiguo. */
  set(key: string, value: T): void {
    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) {
        this.entries.delete(oldest);
      }
    }
    this.entries.set(key, value);
  }

  /**
   * Invalida entradas. Si se proporciona una URI, solo se eliminan las
   * entradas asociadas a ese archivo. Sin argumentos, vacía el caché.
   */
  invalidate(uri?: string): void {
    if (uri === undefined) {
      this.entries.clear();
      return;
    }

    const normalized = normalizeUri(uri);
    for (const key of this.entries.keys()) {
      if (uriFromKey(key) === normalized) {
        this.entries.delete(key);
      }
    }
  }

  /** Tamaño actual (para inspección y tests). */
  size(): number {
    return this.entries.size;
  }
}
