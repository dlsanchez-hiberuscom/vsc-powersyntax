import { DocumentCacheEntry } from './types';
import type { SemanticCacheDocumentRecord } from '../cache/cacheSchema';
import { normalizeUri } from '../system/uriUtils';

/**
 * Caché documental de alto rendimiento.
 * Almacena el resultado del parseo (Símbolos y Facts) por cada archivo.
 * Evita repeticiones costosas si la 'version' (o hash) no ha cambiado.
 */
export class DocumentCache {
  private cache: Map<string, DocumentCacheEntry> = new Map();

  /**
   * Actualiza o inserta la caché para un documento.
   */
  set(uri: string, entry: DocumentCacheEntry): void {
    const normalized = normalizeUri(uri);
    this.cache.set(normalized, entry);
  }

  /**
   * Recupera la caché de un documento.
   */
  get(uri: string): DocumentCacheEntry | undefined {
    return this.cache.get(normalizeUri(uri));
  }

  /** Snapshot semántico canónico asociado a una URI, si existe. */
  getSnapshot(uri: string): DocumentCacheEntry['snapshot'] | undefined {
    return this.get(uri)?.snapshot;
  }

  /**
   * Comprueba si la caché de un documento sigue siendo válida comparando la versión/hash.
   */
  isValid(uri: string, version: string | number): boolean {
    const entry = this.get(uri);
    return entry !== undefined && entry.version === version;
  }

  /**
   * Invalida (borra) la caché de un documento.
   */
  invalidate(uri: string): void {
    this.cache.delete(normalizeUri(uri));
  }

  /**
   * Limpia toda la caché.
   */
  clear(): void {
    this.cache.clear();
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
   * Spec 120: estadísticas básicas (size, capacity opcional).
   */
  getStats(): { size: number } {
    return { size: this.cache.size };
  }

  /**
   * Retorna el número de archivos en la caché.
   */
  get size(): number {
    return this.cache.size;
  }
}
