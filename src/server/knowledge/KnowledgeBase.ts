import { normalizeUri } from '../system/uriUtils';
import { Entity, Fact } from './types';

/**
 * Índice semántico global del workspace.
 * Transforma una lista de "Facts" por archivo en mapas consultables globalmente.
 *
 * Soporta múltiples entidades con el mismo nombre (frecuente en PB:
 * distintos objetos pueden definir funciones como `of_SetData`).
 */
export class KnowledgeBase {
  /**
   * Mapa de Símbolos Globales.
   * Key: Normalizado (id en minúsculas).
   * Value: Array de entidades con ese nombre (puede haber varias en archivos distintos).
   */
  private globalSymbols: Map<string, Entity[]> = new Map();

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
      const existing = this.globalSymbols.get(fact.id) || [];
      existing.push(fact);
      this.globalSymbols.set(fact.id, existing);
      symbolIds.add(fact.id);
    }

    this.documentSymbols.set(normalizedUri, symbolIds);
  }

  /**
   * Elimina del índice global todo el conocimiento aportado por un archivo.
   * Solo elimina las entidades que pertenecen a ese archivo, preservando las de otros.
   */
  removeDocument(uri: string): void {
    const normalizedUri = normalizeUri(uri);
    const existingSymbolIds = this.documentSymbols.get(normalizedUri);

    if (existingSymbolIds) {
      for (const id of existingSymbolIds) {
        const entities = this.globalSymbols.get(id);
        if (entities) {
          const filtered = entities.filter(e => normalizeUri(e.uri) !== normalizedUri);
          if (filtered.length > 0) {
            this.globalSymbols.set(id, filtered);
          } else {
            this.globalSymbols.delete(id);
          }
        }
      }
      this.documentSymbols.delete(normalizedUri);
    }
  }

  /**
   * Busca la primera definición global por nombre (case-insensitive).
   */
  findDefinition(symbolName: string): Entity | null {
    const entities = this.globalSymbols.get(symbolName.toLowerCase());
    return entities && entities.length > 0 ? entities[0] : null;
  }

  /**
   * Busca todas las definiciones globales de un símbolo (case-insensitive).
   * Necesario para "Go to Definition" cuando hay múltiples coincidencias.
   */
  findAllDefinitions(symbolName: string): Entity[] {
    return this.globalSymbols.get(symbolName.toLowerCase()) || [];
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
    let totalEntities = 0;
    for (const entities of this.globalSymbols.values()) {
      totalEntities += entities.length;
    }
    return {
      totalEntities,
      indexedDocuments: this.documentSymbols.size
    };
  }
}
