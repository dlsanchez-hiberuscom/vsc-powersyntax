import { normalizeUri } from '../system/uriUtils';
import { Entity, EntityKind, Fact, Scope } from './types';
import type { SemanticCacheDocumentRecord } from '../cache/cacheSchema';
import type { SemanticDocumentSnapshot } from '../analysis/semanticSnapshot';
import { collectSnapshotDependencyKeys } from './semanticDiff';
import { ManagedStringInterner } from './ManagedStringInterner';
import { internEntity, internScopes, internSemanticSnapshot } from './stringInterning';

interface ScopeIndexEntry {
  start: number;
  end: number;
  depth: number;
  scope: Scope;
}

interface PublishedKnowledgeState {
  globalSymbols: Map<string, Entity[]>;
  documentSymbols: Map<string, Set<string>>;
  entitiesByUri: Map<string, Entity[]>;
  documentScopes: Map<string, Scope[]>;
  scopeIndex: Map<string, ScopeIndexEntry[]>;
  documentSnapshots: Map<string, SemanticDocumentSnapshot>;
  documentDependencies: Map<string, Set<string>>;
  reverseDependencies: Map<string, Set<string>>;
  semanticEpoch: number;
  publishedAt: number;
}

export interface EntityQueryOptions {
  query?: string;
  kinds?: readonly EntityKind[];
  limit?: number;
  include?: (entity: Entity) => boolean;
}

function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

function createEmptyState(): PublishedKnowledgeState {
  return {
    globalSymbols: new Map(),
    documentSymbols: new Map(),
    entitiesByUri: new Map(),
    documentScopes: new Map(),
    scopeIndex: new Map(),
    documentSnapshots: new Map(),
    documentDependencies: new Map(),
    reverseDependencies: new Map(),
    semanticEpoch: 0,
    publishedAt: Date.now()
  };
}

function cloneState(state: PublishedKnowledgeState): PublishedKnowledgeState {
  return {
    globalSymbols: new Map(Array.from(state.globalSymbols.entries(), ([key, value]) => [key, cloneValue(value)])),
    documentSymbols: new Map(Array.from(state.documentSymbols.entries(), ([key, value]) => [key, new Set(value)])),
    entitiesByUri: new Map(Array.from(state.entitiesByUri.entries(), ([key, value]) => [key, cloneValue(value)])),
    documentScopes: new Map(Array.from(state.documentScopes.entries(), ([key, value]) => [key, cloneValue(value)])),
    scopeIndex: new Map(),
    documentSnapshots: new Map(Array.from(state.documentSnapshots.entries(), ([key, value]) => [key, cloneValue(value)])),
    documentDependencies: new Map(Array.from(state.documentDependencies.entries(), ([key, value]) => [key, new Set(value)])),
    reverseDependencies: new Map(Array.from(state.reverseDependencies.entries(), ([key, value]) => [key, new Set(value)])),
    semanticEpoch: state.semanticEpoch,
    publishedAt: state.publishedAt
  };
}

/**
 * Índice semántico global del workspace.
 * Transforma una lista de "Facts" por archivo en mapas consultables globalmente.
 *
 * Soporta múltiples entidades con el mismo nombre (frecuente en PB:
 * distintos objetos pueden definir funciones como `of_SetData`).
 */
export class KnowledgeBase {
  private publishedState: PublishedKnowledgeState = createEmptyState();
  private stagedState: PublishedKnowledgeState | null = null;
  private publishedStringInterner = new ManagedStringInterner();
  private stagedStringInterner: ManagedStringInterner | null = null;

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
    if (this.batchDepth === 0) {
      this.stagedState = cloneState(this.publishedState);
      this.stagedStringInterner = this.publishedStringInterner.clone();
    }
    this.batchDepth++;
  }

  /**
   * Finaliza un batch update. Solo cuando batchDepth vuelve a 0
   * el sistema considera que la actualización masiva terminó.
   */
  endBatchUpdate(): void {
    this.commitBatchUpdate();
  }

  /**
   * Publica el estado staged como nueva versión visible.
   */
  commitBatchUpdate(): void {
    if (this.batchDepth > 0) {
      this.batchDepth--;
      if (this.batchDepth === 0 && this.stagedState && this.stagedStringInterner) {
        this.publishState(this.stagedState);
        this.publishedStringInterner = this.stagedStringInterner;
        this.stagedState = null;
        this.stagedStringInterner = null;
      }
    }
  }

  /**
   * Descarta cualquier construcción staged no publicada.
   */
  rollbackBatchUpdate(): void {
    this.batchDepth = 0;
    this.stagedState = null;
    this.stagedStringInterner = null;
  }

  /**
   * Indica si hay un batch update activo.
   */
  get isBatchUpdating(): boolean {
    return this.batchDepth > 0;
  }

  /**
   * Spec 122: aplica un lote de actualizaciones documentales en una sola
   * transacción. Útil cuando el indexer prepara N documentos y quiere evitar
   * incrementar la versión N veces. Retorna el número de versiones avanzadas
   * (1 si todo va bien).
   */
  resyncDocuments(updates: ReadonlyArray<{ uri: string; facts: Fact[]; scopes?: Scope[] }>): number {
    if (updates.length === 0) return 0;
    const before = this.semanticEpoch;
    this.beginBatchUpdate();
    try {
      for (const u of updates) {
        this.upsertDocument(u.uri, u.facts, u.scopes ?? []);
      }
      this.commitBatchUpdate();
    } catch (error) {
      this.rollbackBatchUpdate();
      throw error;
    } finally {
      if (this.isBatchUpdating) {
        this.rollbackBatchUpdate();
      }
    }
    return this.semanticEpoch - before;
  }

  /**
   * Devuelve la versión actual del índice.
   */
  get version(): number {
    return this.publishedState.semanticEpoch;
  }

  /**
   * Época semántica publicada del workspace.
   * Spec 135 / B166.
   */
  get semanticEpoch(): number {
    return this.publishedState.semanticEpoch;
  }

  /**
   * Inserta o actualiza el conocimiento aportado por un documento.
   * Elimina primero el conocimiento previo del mismo archivo para evitar duplicados estancados.
   */
  upsertDocument(
    uri: string,
    facts: Fact[],
    scopes: Scope[] = [],
    snapshot?: SemanticDocumentSnapshot
  ): void {
    const normalizedUri = normalizeUri(uri);
    const { nextFacts, nextScopes, nextSnapshot } = this.currentStringInterner().replaceDocument(
      normalizedUri,
      (intern) => ({
        nextFacts: cloneValue(facts).map((fact) => internEntity(fact, intern)),
        nextScopes: internScopes(cloneValue(scopes), intern),
        nextSnapshot: snapshot ? internSemanticSnapshot(cloneValue(snapshot), intern) : undefined,
      })
    );

    this.writeState((state) => {
      this.indexDocumentIntoState(state, normalizedUri, nextFacts, nextScopes, nextSnapshot);
    });
  }

  /**
   * Elimina del índice global todo el conocimiento aportado por un archivo.
   * Solo elimina las entidades que pertenecen a ese archivo, preservando las de otros.
   */
  removeDocument(uri: string): void {
    const normalizedUri = normalizeUri(uri);
    this.currentStringInterner().removeDocument(normalizedUri);
    this.writeState((state) => {
      this.removeDocumentFromState(state, normalizedUri);
    });
  }

  /**
   * Busca la primera definición global por nombre (case-insensitive).
   */
  findDefinition(symbolName: string): Entity | null {
    const entities = this.publishedState.globalSymbols.get(symbolName.toLowerCase());
    return entities && entities.length > 0 ? cloneValue(entities[0]) : null;
  }

  /**
   * Busca todas las definiciones globales de un símbolo (case-insensitive).
   * Necesario para "Go to Definition" cuando hay múltiples coincidencias.
   */
  findAllDefinitions(symbolName: string): Entity[] {
    return cloneValue(this.publishedState.globalSymbols.get(symbolName.toLowerCase()) || []);
  }

  /**
   * Spec 109: busca la primera entidad invocable (function/subroutine/event)
   * por nombre, opcionalmente restringida a un contenedor (`window`, `userobject`).
   * Devuelve la primera que cumpla; los conflictos cross-container quedan
   * fuera del alcance hasta tener inheritance/visibility resolvidos.
   */
  findCallable(name: string, container?: string): Entity | null {
    const entities = this.publishedState.globalSymbols.get(name.toLowerCase());
    if (!entities) return null;
    const containerLc = container?.toLowerCase();
    for (const e of entities) {
      const isCallable = e.kind === EntityKind.Function
        || e.kind === EntityKind.Subroutine
        || e.kind === EntityKind.Event;
      if (!isCallable) continue;
      if (!containerLc) return cloneValue(e);
      if ((e.containerName ?? '').toLowerCase() === containerLc) return cloneValue(e);
    }
    return null;
  }

  /**
   * Devuelve todas las entidades del índice (para Workspace Symbols).
   */
  getAllEntities(): Entity[] {
    const result: Entity[] = [];
    for (const entities of this.publishedState.globalSymbols.values()) {
      result.push(...entities);
    }
    return cloneValue(result);
  }

  queryEntities(options: EntityQueryOptions = {}): Entity[] {
    const query = options.query?.toLowerCase() ?? '';
    const kinds = options.kinds ? new Set(options.kinds) : undefined;
    const limit = options.limit === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(0, Math.trunc(options.limit));

    if (limit === 0) {
      return [];
    }

    const result: Entity[] = [];
    for (const entities of this.publishedState.globalSymbols.values()) {
      for (const entity of entities) {
        if (kinds && !kinds.has(entity.kind)) continue;
        if (query && !entity.id.includes(query)) continue;
        if (options.include && !options.include(entity)) continue;

        result.push(entity);
        if (result.length >= limit) {
          return cloneValue(result);
        }
      }
    }

    return cloneValue(result);
  }

  countEntities(include?: (entity: Entity) => boolean): number {
    let count = 0;
    for (const entities of this.publishedState.globalSymbols.values()) {
      for (const entity of entities) {
        if (!include || include(entity)) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Devuelve las entidades aportadas por un archivo concreto.
   * Operación O(1) sobre el índice por URI; preferir frente a `getAllEntities()`
   * cuando ya se conoce el archivo de interés.
   */
  getEntitiesByUri(uri: string): Entity[] {
    const normalizedUri = normalizeUri(uri);
    const snapshotEntities = this.publishedState.documentSnapshots.get(normalizedUri)?.symbols;
    if (snapshotEntities) {
      return cloneValue(snapshotEntities);
    }

    const entities = this.publishedState.entitiesByUri.get(normalizedUri);
    return cloneValue(entities ?? []);
  }

  /** Snapshot semántico publicado de un documento. */
  getDocumentSnapshot(uri: string): SemanticDocumentSnapshot | null {
    const snapshot = this.publishedState.documentSnapshots.get(normalizeUri(uri));
    return snapshot ? cloneValue(snapshot) : null;
  }

  hasDocumentSnapshot(uri: string): boolean {
    return this.publishedState.documentSnapshots.has(normalizeUri(uri));
  }

  /** Documentos que dependen semánticamente de símbolos exportados por una URI. */
  getDependentDocumentsForUri(uri: string): string[] {
    const normalizedUri = normalizeUri(uri);
    const exportedIds = this.publishedState.documentSymbols.get(normalizedUri);
    if (!exportedIds || exportedIds.size === 0) {
      return [];
    }

    const dependentUris = new Set<string>();
    for (const exportId of exportedIds) {
      const dependents = this.publishedState.reverseDependencies.get(exportId);
      if (!dependents) continue;
      for (const dependentUri of dependents) {
        if (dependentUri !== normalizedUri) {
          dependentUris.add(dependentUri);
        }
      }
    }

    return [...dependentUris].sort();
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
    const scopes = this.publishedState.documentSnapshots.get(normalizedUri)?.scopes
      ?? this.publishedState.documentScopes.get(normalizedUri);
    if (!scopes || scopes.length === 0) return null;

    let index = this.publishedState.scopeIndex.get(normalizedUri);
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
      this.publishedState.scopeIndex.set(normalizedUri, index);
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
    return best ? cloneValue(best) : null;
  }

  /**
   * Limpia toda la base de conocimiento.
   */
  clear(): void {
    this.writeState(() => createEmptyState(), true);
    if (this.isBatchUpdating) {
      this.stagedStringInterner = new ManagedStringInterner();
    } else {
      this.publishedStringInterner = new ManagedStringInterner();
    }
  }

  /**
  /**
   * Retorna estadísticas del índice.
   * Spec 101: añade `indexedScopes` (cardinalidad del scopeIndex) para que
   * features de observabilidad puedan vigilar el coste real del índice.
   */
  getStats() {
    let totalEntities = 0;
    for (const entities of this.publishedState.globalSymbols.values()) {
      totalEntities += entities.length;
    }
    let indexedScopes = 0;
    for (const arr of this.publishedState.scopeIndex.values()) indexedScopes += arr.length;
    let structuralSnapshots = 0;
    let enrichedSnapshots = 0;
    let structuralOnlySnapshots = 0;
    let nearbySemanticReadySnapshots = 0;
    for (const snapshot of this.publishedState.documentSnapshots.values()) {
      if (snapshot.pass === 'structural') structuralSnapshots++;
      if (snapshot.pass === 'enriched') enrichedSnapshots++;
      if (snapshot.readiness === 'structural-only') structuralOnlySnapshots++;
      if (snapshot.readiness === 'nearby-semantic-ready') nearbySemanticReadySnapshots++;
    }
    return {
      totalEntities,
      indexedDocuments: this.publishedState.documentSymbols.size,
      indexedScopes,
      internedStrings: this.publishedStringInterner.getStats().uniqueStrings,
      semanticEpoch: this.publishedState.semanticEpoch,
      snapshotDocuments: this.publishedState.documentSnapshots.size,
      structuralSnapshots,
      enrichedSnapshots,
      structuralOnlySnapshots,
      nearbySemanticReadySnapshots,
      dependencyDocuments: this.publishedState.documentDependencies.size,
      reverseDependencyKeys: this.publishedState.reverseDependencies.size,
      publishedAt: this.publishedState.publishedAt
    };
  }

  private publishState(next: PublishedKnowledgeState): void {
    next.semanticEpoch = this.publishedState.semanticEpoch + 1;
    next.publishedAt = Date.now();
    this.publishedState = next;
  }

  private writeState(
    mutator: ((state: PublishedKnowledgeState) => void) | (() => PublishedKnowledgeState),
    replace = false
  ): void {
    if (this.isBatchUpdating) {
      if (!this.stagedState) {
        this.stagedState = cloneState(this.publishedState);
      }
      if (replace) {
        this.stagedState = (mutator as () => PublishedKnowledgeState)();
      } else {
        (mutator as (state: PublishedKnowledgeState) => void)(this.stagedState);
      }
      return;
    }

    const draft = replace
      ? (mutator as () => PublishedKnowledgeState)()
      : cloneState(this.publishedState);

    if (!replace) {
      (mutator as (state: PublishedKnowledgeState) => void)(draft);
    }
    this.publishState(draft);
  }

  private removeDocumentFromState(state: PublishedKnowledgeState, normalizedUri: string): void {
    const existingSymbolIds = state.documentSymbols.get(normalizedUri);
    this.removeDependenciesFromState(state, normalizedUri);

    if (!existingSymbolIds) {
      state.documentSnapshots.delete(normalizedUri);
      return;
    }

    for (const id of existingSymbolIds) {
      const entities = state.globalSymbols.get(id);
      if (!entities) continue;

      const filtered = entities.filter((entity) => normalizeUri(entity.uri) !== normalizedUri);
      if (filtered.length > 0) {
        state.globalSymbols.set(id, filtered);
      } else {
        state.globalSymbols.delete(id);
      }
    }

    state.documentSymbols.delete(normalizedUri);
    state.documentScopes.delete(normalizedUri);
    state.entitiesByUri.delete(normalizedUri);
    state.scopeIndex.delete(normalizedUri);
    state.documentSnapshots.delete(normalizedUri);
  }

  private updateDependenciesFromSnapshot(
    state: PublishedKnowledgeState,
    normalizedUri: string,
    snapshot: SemanticDocumentSnapshot
  ): void {
    this.removeDependenciesFromState(state, normalizedUri);

    const dependencies = new Set(collectSnapshotDependencyKeys(snapshot));
    if (dependencies.size === 0) {
      return;
    }

    state.documentDependencies.set(normalizedUri, dependencies);
    for (const dependency of dependencies) {
      const reverse = state.reverseDependencies.get(dependency) ?? new Set<string>();
      reverse.add(normalizedUri);
      state.reverseDependencies.set(dependency, reverse);
    }
  }

  private removeDependenciesFromState(state: PublishedKnowledgeState, normalizedUri: string): void {
    const dependencies = state.documentDependencies.get(normalizedUri);
    if (!dependencies) {
      return;
    }

    for (const dependency of dependencies) {
      const reverse = state.reverseDependencies.get(dependency);
      if (!reverse) continue;

      reverse.delete(normalizedUri);
      if (reverse.size === 0) {
        state.reverseDependencies.delete(dependency);
      }
    }

    state.documentDependencies.delete(normalizedUri);
  }

  exportDocumentRecords(): SemanticCacheDocumentRecord[] {
    return Array.from(this.publishedState.entitiesByUri.entries()).map(([uri, facts]) => ({
      uri,
      facts: structuredClone(facts),
      scopes: structuredClone(this.publishedState.documentScopes.get(uri) ?? []),
      snapshot: structuredClone(this.publishedState.documentSnapshots.get(uri))
    }));
  }

  restoreDocumentRecords(records: SemanticCacheDocumentRecord[], semanticEpoch = 0): void {
    const nextState = createEmptyState();
    const nextInterner = new ManagedStringInterner();
    for (const record of records) {
      const restoredRecord = structuredClone(record);
      const { facts, scopes, snapshot } = nextInterner.replaceDocument(
        normalizeUri(restoredRecord.uri),
        (intern) => ({
          facts: restoredRecord.facts.map((fact) => internEntity(fact, intern)),
          scopes: internScopes(restoredRecord.scopes, intern),
          snapshot: restoredRecord.snapshot ? internSemanticSnapshot(restoredRecord.snapshot, intern) : undefined,
        })
      );
      this.indexDocumentIntoState(
        nextState,
        normalizeUri(restoredRecord.uri),
        facts,
        scopes,
        snapshot
      );
    }
    nextState.semanticEpoch = semanticEpoch;
    nextState.publishedAt = Date.now();
    this.publishedState = nextState;
    this.publishedStringInterner = nextInterner;
    this.stagedState = null;
    this.stagedStringInterner = null;
    this.batchDepth = 0;
  }

  private currentStringInterner(): ManagedStringInterner {
    return this.stagedStringInterner ?? this.publishedStringInterner;
  }

  private indexDocumentIntoState(
    state: PublishedKnowledgeState,
    normalizedUri: string,
    facts: Fact[],
    scopes: Scope[] = [],
    snapshot?: SemanticDocumentSnapshot
  ): void {
    this.removeDocumentFromState(state, normalizedUri);

    const symbolIds = new Set<string>();
    const uriEntities: Entity[] = [];

    for (const fact of facts) {
      const existing = state.globalSymbols.get(fact.id) || [];
      existing.push(fact);
      state.globalSymbols.set(fact.id, existing);
      symbolIds.add(fact.id);
      uriEntities.push(fact);
    }

    state.documentSymbols.set(normalizedUri, symbolIds);
    state.documentScopes.set(normalizedUri, scopes);
    state.scopeIndex.delete(normalizedUri);
    if (uriEntities.length > 0) {
      state.entitiesByUri.set(normalizedUri, uriEntities);
    }
    if (snapshot) {
      state.documentSnapshots.set(normalizedUri, snapshot);
      this.updateDependenciesFromSnapshot(state, normalizedUri, snapshot);
    } else {
      this.removeDependenciesFromState(state, normalizedUri);
    }
  }
}
