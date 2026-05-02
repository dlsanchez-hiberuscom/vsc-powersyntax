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

export interface ServingCacheEntry<T = unknown> {
  key: string;
  value: T;
  insertedAt?: number;
}

export interface ServingCacheEvent {
  action: 'hit' | 'miss' | 'set' | 'evict' | 'invalidate';
  key?: string;
  uri?: string;
  removed?: number;
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
}

export type ServingCacheObserver = (event: ServingCacheEvent) => void;

/**
 * Construye una clave estable a partir de las partes que identifican
 * un resultado servido.
 */
export function makeKey(p: ServingKeyParts): string {
  const uri = normalizeUri(p.uri);
  const extra = p.extra ?? '';
  return `${p.feature}|${uri}|${p.line}|${p.character}|${p.kbVersion}|${extra}`;
}

export function kbVersionFromKey(key: string): number | null {
  const parts = key.split('|');
  if (parts.length < 5) {
    return null;
  }

  const parsed = Number.parseInt(parts[4], 10);
  return Number.isFinite(parsed) ? parsed : null;
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
  // Spec 118/121: TTL opcional y contadores de hit/miss/eviction.
  private readonly ttlMs: number;
  private readonly insertedAt: Map<string, number> = new Map();
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(
    private readonly maxEntries: number = 256,
    ttlMs = 0,
    private readonly observer?: ServingCacheObserver
  ) {
    this.ttlMs = ttlMs;
  }

  private emitEvent(action: ServingCacheEvent['action'], context: Partial<ServingCacheEvent> = {}): void {
    if (!this.observer) {
      return;
    }

    this.observer({
      action,
      size: this.entries.size,
      capacity: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      ...context
    });
  }

  /** Recupera un valor y lo "calienta" (lo mueve al final de la LRU). */
  get(key: string): T | undefined {
    const value = this.entries.get(key);
    if (value === undefined) {
      this.misses++;
      this.emitEvent('miss', { key });
      return undefined;
    }
    // Spec 118: TTL opcional. Si vencido, eliminar y devolver undefined.
    if (this.ttlMs > 0) {
      const at = this.insertedAt.get(key) ?? 0;
      if (Date.now() - at > this.ttlMs) {
        this.entries.delete(key);
        this.insertedAt.delete(key);
        this.evictions++;
        this.misses++;
        this.emitEvent('evict', { key });
        this.emitEvent('miss', { key });
        return undefined;
      }
    }
    this.entries.delete(key);
    this.entries.set(key, value);
    this.hits++;
    this.emitEvent('hit', { key });
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
        this.insertedAt.delete(oldest);
        this.evictions++;
        this.emitEvent('evict', { key: oldest });
      }
    }
    this.entries.set(key, value);
    if (this.ttlMs > 0) this.insertedAt.set(key, Date.now());
    this.emitEvent('set', { key });
  }

  /** Exporta un snapshot ordenado de la LRU actual, de más antiguo a más reciente. */
  exportEntries(): ServingCacheEntry<T>[] {
    return [...this.entries.entries()].map(([key, value]) => ({
      key,
      value: structuredClone(value),
      insertedAt: this.ttlMs > 0 ? this.insertedAt.get(key) : undefined
    }));
  }

  /** Restaura un snapshot exportado preservando orden LRU y capacidad. */
  restoreEntries(entries: ServingCacheEntry<T>[]): void {
    this.entries.clear();
    this.insertedAt.clear();

    const retainedEntries = entries.slice(-this.maxEntries);
    for (const entry of retainedEntries) {
      this.entries.set(entry.key, structuredClone(entry.value));
      if (this.ttlMs > 0) {
        this.insertedAt.set(entry.key, entry.insertedAt ?? Date.now());
      }
    }
  }

  /**
   * Invalida entradas. Si se proporciona una URI, solo se eliminan las
   * entradas asociadas a ese archivo. Sin argumentos, vacía el caché.
   */
  invalidate(uri?: string): void {
    let removed = 0;
    if (uri === undefined) {
      removed = this.entries.size;
      this.entries.clear();
      this.insertedAt.clear();
      this.emitEvent('invalidate', { removed });
      return;
    }

    const normalized = normalizeUri(uri);
    for (const key of [...this.entries.keys()]) {
      if (uriFromKey(key) === normalized) {
        this.entries.delete(key);
        this.insertedAt.delete(key);
        removed++;
      }
    }

    this.emitEvent('invalidate', { uri: normalized, removed });
  }

  /** Tamaño actual (para inspección y tests). */
  size(): number {
    return this.entries.size;
  }

  /** Spec 121: métricas para telemetría. */
  getStats(): { size: number; capacity: number; hits: number; misses: number; evictions: number; ttlMs: number } {
    return {
      size: this.entries.size,
      capacity: this.maxEntries,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      ttlMs: this.ttlMs
    };
  }
}
