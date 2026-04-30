import { DocumentCacheEntry } from './types';
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
