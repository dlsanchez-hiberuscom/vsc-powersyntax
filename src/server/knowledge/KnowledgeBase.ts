import { normalizeUri } from '../system/uriUtils';
import { Entity, Fact } from './types';

/**
 * Índice semántico global del workspace.
 * Transforma una lista de "Facts" por archivo en mapas consultables globalmente.
 */
export class KnowledgeBase {
  /**
   * Mapa de Símbolos Globales.
   * Key: Normalizado (id en minúsculas).
   * Value: La entidad.
   */
  private globalSymbols: Map<string, Entity> = new Map();

  /**
   * Índice inverso para saber qué símbolos aporta cada archivo.
   * Key: URI normalizado del archivo.
   * Value: Set de IDs de símbolos exportados por este archivo.
   */
  private documentSymbols: Map<string, Set<string>> = new Map();

  /**
   * Inserta o actualiza el conocimiento aportado por un documento.
   * Elimina primero el conocimiento previo del mismo archivo para evitar duplicados estancados.
   */
  upsertDocument(uri: string, facts: Fact[]): void {
    const normalizedUri = normalizeUri(uri);
    
    // 1. Limpiar rastro previo de este documento
    this.removeDocument(normalizedUri);

    // 2. Indexar nuevos facts
    const symbolIds = new Set<string>();
    
    for (const fact of facts) {
      // Como Fact actualmente es alias de Entity, lo guardamos en globalSymbols
      this.globalSymbols.set(fact.id, fact);
      symbolIds.add(fact.id);
    }

    this.documentSymbols.set(normalizedUri, symbolIds);
  }

  /**
   * Elimina del índice global todo el conocimiento aportado por un archivo.
   */
  removeDocument(uri: string): void {
    const normalizedUri = normalizeUri(uri);
    const existingSymbols = this.documentSymbols.get(normalizedUri);
    
    if (existingSymbols) {
      for (const id of existingSymbols) {
        this.globalSymbols.delete(id);
      }
      this.documentSymbols.delete(normalizedUri);
    }
  }

  /**
   * Busca una definición global por su nombre (case-insensitive).
   */
  findDefinition(symbolName: string): Entity | null {
    return this.globalSymbols.get(symbolName.toLowerCase()) || null;
  }

  /**
   * Limpia toda la base de conocimiento.
   */
  clear(): void {
    this.globalSymbols.clear();
    this.documentSymbols.clear();
  }

  /**
   * Retorna estadísticas del índice.
   */
  getStats() {
    return {
      totalEntities: this.globalSymbols.size,
      indexedDocuments: this.documentSymbols.size
    };
  }
}
