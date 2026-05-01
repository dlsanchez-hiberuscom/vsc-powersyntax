import { DocumentCacheEntry } from './types';
import type { SemanticCacheDocumentRecord } from '../cache/cacheSchema';
import { normalizeUri } from '../system/uriUtils';
import { ManagedStringInterner } from './ManagedStringInterner';
import { internDocumentCacheEntry } from './stringInterning';

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Caché documental de alto rendimiento.
 * Almacena el resultado del parseo (Símbolos y Facts) por cada archivo.
 * Evita repeticiones costosas si la 'version' (o hash) no ha cambiado.
 */
export class DocumentCache {
  private cache: Map<string, DocumentCacheEntry> = new Map();
  private stringInterner = new ManagedStringInterner();

  /**
   * Actualiza o inserta la caché para un documento.
   */
  set(uri: string, entry: DocumentCacheEntry): void {
    const normalized = normalizeUri(uri);
    const nextEntry = this.stringInterner.replaceDocument(normalized, (intern) =>
      internDocumentCacheEntry(cloneValue(entry), intern)
    );
    this.cache.set(normalized, nextEntry);
  }

  /**
   * Recupera la caché de un documento.
   */
  get(uri: string): DocumentCacheEntry | undefined {
    const entry = this.cache.get(normalizeUri(uri));
    return entry ? cloneValue(entry) : undefined;
  }

  /** Snapshot semántico canónico asociado a una URI, si existe. */
  getSnapshot(uri: string): DocumentCacheEntry['snapshot'] | undefined {
    return this.get(uri)?.snapshot;
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
    this.stringInterner.removeDocument(normalized);
  }

  /**
   * Limpia toda la caché.
   */
  clear(): void {
    this.cache.clear();
    this.stringInterner.clear();
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
  getStats(): { size: number; internedStrings: number } {
    return {
      size: this.cache.size,
      internedStrings: this.stringInterner.getStats().uniqueStrings,
    };
  }

  /**
   * Retorna el número de archivos en la caché.
   */
  get size(): number {
    return this.cache.size;
  }
}
