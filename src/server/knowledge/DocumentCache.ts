import { DocumentCacheEntry } from './types';
import type { SemanticCacheDocumentRecord } from '../cache/cacheSchema';
import { normalizeUri } from '../system/uriUtils';
import { ManagedStringInterner } from './ManagedStringInterner';
import { internDocumentCacheEntry } from './stringInterning';

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function freezeValue<T>(value: T): Readonly<T> {
  if (process.env.NODE_ENV === 'development' && value && typeof value === 'object') {
    return Object.freeze(value);
  }
  return value;
}

/**
 * Caché documental de alto rendimiento con LRU, pin semántico y eviction.
 *
 * Tiered model (inspirado en TSServer DocumentRegistry y pools de base de datos):
 *
 * - **Pinned tier:** documentos abiertos en el editor → nunca se evictan.
 * - **Warm tier:** documentos cerrados usados recientemente → LRU, evicción bajo presión.
 * - **Cold tier:** documentos cerrados no usados → candidatos inmediatos a eviction.
 *
 * CACHE-P0-DOCUMENT-CACHE-LRU-EVICTION-01
 */
export class DocumentCache {
  private cache: Map<string, DocumentCacheEntry> = new Map();
  private pinnedUris: Set<string> = new Set();
  private stringInterner = new ManagedStringInterner();
  private totalEvictions = 0;

  /**
   * @param maxEntries Capacidad máxima de entries (pinned + unpinned).
   *   Cuando se excede, los unpinned más antiguos se evictan.
   *   Default: 256 (~16 MiB con 64 KiB/entry estimado).
   */
  constructor(private readonly maxEntries: number = 256) {}

  /**
   * Pin: marca un documento como abierto en el editor.
   * Los documentos pinned nunca se evictan por LRU.
   */
  pin(uri: string): void {
    this.pinnedUris.add(normalizeUri(uri));
  }

  /**
   * Unpin: marca un documento como cerrado en el editor.
   * El documento permanece en cache pero es candidato a eviction LRU.
   */
  unpin(uri: string): void {
    this.pinnedUris.delete(normalizeUri(uri));
  }

  /**
   * Devuelve si un documento está pinned (abierto en el editor).
   */
  isPinned(uri: string): boolean {
    return this.pinnedUris.has(normalizeUri(uri));
  }

  /**
   * Actualiza o inserta la caché para un documento.
   * Si la cache excede maxEntries, evicta los unpinned más antiguos.
   */
  set(uri: string, entry: DocumentCacheEntry): void {
    const normalized = normalizeUri(uri);
    const nextEntry = this.stringInterner.replaceDocument(normalized, (intern) =>
      internDocumentCacheEntry(cloneValue(entry), intern)
    );

    // Reinsert to move to end of Map insertion order (LRU refresh)
    if (this.cache.has(normalized)) {
      this.cache.delete(normalized);
    }
    this.cache.set(normalized, nextEntry);

    this.evictIfOverCapacity();
  }

  /**
   * Recupera la caché de un documento.
   */
  get(uri: string): DocumentCacheEntry | undefined {
    const normalized = normalizeUri(uri);
    const entry = this.cache.get(normalized);
    if (!entry) return undefined;

    // LRU touch: move to end of Map insertion order
    this.cache.delete(normalized);
    this.cache.set(normalized, entry);

    return cloneValue(entry);
  }

  getReadonly(uri: string): Readonly<DocumentCacheEntry> | undefined {
    const normalized = normalizeUri(uri);
    const entry = this.cache.get(normalized);
    if (!entry) return undefined;

    // LRU touch: move to end of Map insertion order
    this.cache.delete(normalized);
    this.cache.set(normalized, entry);

    return freezeValue(entry);
  }

  /** Snapshot semántico canónico asociado a una URI, si existe. */
  getSnapshot(uri: string): DocumentCacheEntry['snapshot'] | undefined {
    // Use internal get without clone for efficiency; only clone the snapshot
    const normalized = normalizeUri(uri);
    const entry = this.cache.get(normalized);
    if (!entry?.snapshot) return undefined;

    // LRU touch
    this.cache.delete(normalized);
    this.cache.set(normalized, entry);

    return cloneValue(entry.snapshot);
  }

  getSnapshotReadonly(uri: string): Readonly<DocumentCacheEntry['snapshot']> | undefined {
    // Use internal get without clone for efficiency; only freeze the snapshot
    const normalized = normalizeUri(uri);
    const entry = this.cache.get(normalized);
    if (!entry?.snapshot) return undefined;

    // LRU touch
    this.cache.delete(normalized);
    this.cache.set(normalized, entry);

    return freezeValue(entry.snapshot);
  }

  hasSnapshot(uri: string): boolean {
    return this.cache.get(normalizeUri(uri))?.snapshot !== undefined;
  }

  /**
   * Comprueba si la caché de un documento sigue siendo válida comparando la versión/hash.
   */
  isValid(uri: string, version: string | number): boolean {
    const entry = this.cache.get(normalizeUri(uri));
    return entry !== undefined && entry.version === version;
  }

  /**
   * Invalida (borra) la caché de un documento.
   */
  invalidate(uri: string): void {
    const normalized = normalizeUri(uri);
    this.cache.delete(normalized);
    this.pinnedUris.delete(normalized);
    this.stringInterner.removeDocument(normalized);
  }

  /**
   * Limpia toda la caché.
   */
  clear(): void {
    this.cache.clear();
    this.pinnedUris.clear();
    this.stringInterner.clear();
  }

  /**
   * Solicita eviction de unpinned entries hasta alcanzar el target.
   * Útil para que memoryPressurePolicy solicite reducción bajo presión.
   * @param targetSize Tamaño objetivo del cache. Si no se pasa, usa maxEntries.
   * @returns Número de entries evictadas.
   */
  evictUnpinned(targetSize?: number): number {
    const target = targetSize ?? this.maxEntries;
    let evicted = 0;

    for (const [key] of this.cache) {
      if (this.cache.size <= target) break;
      if (this.pinnedUris.has(key)) continue;

      this.cache.delete(key);
      this.stringInterner.removeDocument(key);
      this.totalEvictions++;
      evicted++;
    }

    return evicted;
  }

  exportDocumentRecords(): SemanticCacheDocumentRecord[] {
    return Array.from(this.cache.entries()).map(([uri, entry]) => ({
      uri,
      version: entry.version,
      facts: structuredClone(entry.facts),
      scopes: structuredClone(entry.scopes),
      snapshot: structuredClone(entry.snapshot)
    }));
  }

  restoreDocumentRecords(records: SemanticCacheDocumentRecord[]): void {
    this.clear();
    for (const record of records) {
      const restored = structuredClone(record);
      this.set(restored.uri, {
        version: restored.version ?? '',
        symbols: [],
        facts: restored.facts,
        scopes: restored.scopes,
        snapshot: restored.snapshot
      });
    }
  }

  /**
   * Spec 120: lista las URIs cacheadas (útil para introspección y debug).
   */
  getCachedUris(): string[] {
    return [...this.cache.keys()];
  }

  /**
   * Estadísticas con capacity, pinnedCount y evictions.
   */
  getStats(): {
    size: number;
    capacity: number;
    pinnedCount: number;
    evictions: number;
    internedStrings: number;
  } {
    return {
      size: this.cache.size,
      capacity: this.maxEntries,
      pinnedCount: this.pinnedUris.size,
      evictions: this.totalEvictions,
      internedStrings: this.stringInterner.getStats().uniqueStrings,
    };
  }

  /**
   * Retorna el número de archivos en la caché.
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * Evicta unpinned entries más antiguas (inicio del Map) hasta
   * que el tamaño sea <= maxEntries.
   */
  private evictIfOverCapacity(): void {
    if (this.cache.size <= this.maxEntries) return;

    for (const [key] of this.cache) {
      if (this.cache.size <= this.maxEntries) break;
      if (this.pinnedUris.has(key)) continue;

      this.cache.delete(key);
      this.stringInterner.removeDocument(key);
      this.totalEvictions++;
    }
  }
}
