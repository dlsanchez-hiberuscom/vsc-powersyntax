import { normalizeUri } from '../system/uriUtils';
import { Entity, Fact, Scope } from './types';

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
   * Índice por URI -> Entidades aportadas por ese archivo.
   * Permite consultas O(1) por archivo evitando escaneos completos del catálogo
   * en operaciones interactivas (hover, definition, semantic tokens, etc.).
   */
  private entitiesByUri: Map<string, Entity[]> = new Map();

  /**
   * Árbol de Scopes por documento para resolución de variables locales.
   * Key: URI normalizado del archivo.
   * Value: Lista de Scopes raíz (usualmente el GlobalScope).
   */
  private documentScopes: Map<string, Scope[]> = new Map();
  /**
   * Spec 065: índice plano y ordenado de scopes por URI para resolver
   * `getScopeAt` en O(log n) (búsqueda binaria + selección del más profundo).
   * Se reconstruye perezosamente en la primera consulta tras cada actualización
   * de scopes.
   */
  private scopeIndex: Map<string, Array<{ start: number; end: number; depth: number; scope: Scope }>> = new Map();

  /**
   * Versión del índice. Se incrementa con cada mutación (salvo en batch updates,
   * donde se incrementa una vez al terminar).
   * Permite a las cachés externas invalidarse fácilmente.
   */
  private currentVersion = 0;

  /**
   * Profundidad de batch update. Mientras sea > 0, las operaciones
   * de upsert/remove no disparan efectos colaterales costosos.
   * Patrón portado del plugin_old (SymbolIndex.beginBatchUpdate).
   */
  private batchDepth = 0;

  /**
   * Inicia un batch update. Mientras esté activo, los consumidores
   * pueden evitar reaccionar a cada cambio individual.
   */
  beginBatchUpdate(): void {
    this.batchDepth++;
  }

  /**
   * Finaliza un batch update. Solo cuando batchDepth vuelve a 0
   * el sistema considera que la actualización masiva terminó.
   */
  endBatchUpdate(): void {
    if (this.batchDepth > 0) {
      this.batchDepth--;
      if (this.batchDepth === 0) {
        this.currentVersion++;
      }
    }
  }

  /**
   * Indica si hay un batch update activo.
   */
  get isBatchUpdating(): boolean {
    return this.batchDepth > 0;
  }

  /**
   * Devuelve la versión actual del índice.
   */
  get version(): number {
    return this.currentVersion;
  }

  /**
   * Inserta o actualiza el conocimiento aportado por un documento.
   * Elimina primero el conocimiento previo del mismo archivo para evitar duplicados estancados.
   */
  upsertDocument(uri: string, facts: Fact[], scopes: Scope[] = []): void {
    const normalizedUri = normalizeUri(uri);

    // 1. Limpiar rastro previo de este documento
    this.removeDocument(normalizedUri);

    // 2. Indexar nuevos facts
    const symbolIds = new Set<string>();
    const uriEntities: Entity[] = [];

    for (const fact of facts) {
      const existing = this.globalSymbols.get(fact.id) || [];
      existing.push(fact);
      this.globalSymbols.set(fact.id, existing);
      symbolIds.add(fact.id);
      uriEntities.push(fact);
    }

    this.documentSymbols.set(normalizedUri, symbolIds);
    this.documentScopes.set(normalizedUri, scopes);
    this.scopeIndex.delete(normalizedUri);
    if (uriEntities.length > 0) {
      this.entitiesByUri.set(normalizedUri, uriEntities);
    }

    if (!this.isBatchUpdating) {
      this.currentVersion++;
    }
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
      this.documentScopes.delete(normalizedUri);
      this.entitiesByUri.delete(normalizedUri);
      this.scopeIndex.delete(normalizedUri);

      if (!this.isBatchUpdating) {
        this.currentVersion++;
      }
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
   * Devuelve todas las entidades del índice (para Workspace Symbols).
   */
  getAllEntities(): Entity[] {
    const result: Entity[] = [];
    for (const entities of this.globalSymbols.values()) {
      result.push(...entities);
    }
    return result;
  }

  /**
   * Devuelve las entidades aportadas por un archivo concreto.
   * Operación O(1) sobre el índice por URI; preferir frente a `getAllEntities()`
   * cuando ya se conoce el archivo de interés.
   */
  getEntitiesByUri(uri: string): Entity[] {
    const entities = this.entitiesByUri.get(normalizeUri(uri));
    return entities ? [...entities] : [];
  }

  /**
   * Obtiene el Scope más profundo/específico que contiene una línea dada en un archivo.
   *
   * Spec 065: usa un índice ordenado por `startLine` con búsqueda binaria
   * sobre el conjunto de scopes (incluyendo nidados). Luego elige el de mayor
   * `depth` que contenga la línea, manteniendo la semántica original.
   */
  getScopeAt(uri: string, line: number): Scope | null {
    const normalizedUri = normalizeUri(uri);
    const scopes = this.documentScopes.get(normalizedUri);
    if (!scopes || scopes.length === 0) return null;

    let index = this.scopeIndex.get(normalizedUri);
    if (!index) {
      index = [];
      const walk = (list: Scope[], depth: number) => {
        for (const s of list) {
          index!.push({ start: s.startLine, end: s.endLine, depth, scope: s });
          if (s.children.length > 0) walk(s.children, depth + 1);
        }
      };
      walk(scopes, 0);
      index.sort((a, b) => a.start - b.start);
      this.scopeIndex.set(normalizedUri, index);
    }

    // Búsqueda binaria: índice del primero con start > line.
    let lo = 0;
    let hi = index.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (index[mid].start <= line) lo = mid + 1;
      else hi = mid;
    }

    let best: Scope | null = null;
    let bestDepth = -1;
    // Recorrer de derecha a izquierda los candidatos cuyo start <= line.
    for (let k = lo - 1; k >= 0; k--) {
      const c = index[k];
      if (c.end < line) continue;
      if (c.depth > bestDepth) {
        best = c.scope;
        bestDepth = c.depth;
      }
      // En árboles bien formados podríamos parar al primer candidato ancestro,
      // pero no podemos asumirlo porque hay scopes raíces consecutivos. El
      // recorrido es lineal acotado por la profundidad real (típico ≤ 3).
    }
    return best;
  }

  /**
   * Limpia toda la base de conocimiento.
   */
  clear(): void {
    this.globalSymbols.clear();
    this.documentSymbols.clear();
    this.documentScopes.clear();
    this.entitiesByUri.clear();
    this.scopeIndex.clear();
    this.currentVersion++;
  }

  /**
  /**
   * Retorna estadísticas del índice.
   * Spec 101: añade `indexedScopes` (cardinalidad del scopeIndex) para que
   * features de observabilidad puedan vigilar el coste real del índice.
   */
  getStats() {
    let totalEntities = 0;
    for (const entities of this.globalSymbols.values()) {
      totalEntities += entities.length;
    }
    let indexedScopes = 0;
    for (const arr of this.scopeIndex.values()) indexedScopes += arr.length;
    return {
      totalEntities,
      indexedDocuments: this.documentSymbols.size,
      indexedScopes
    };
  }
}
