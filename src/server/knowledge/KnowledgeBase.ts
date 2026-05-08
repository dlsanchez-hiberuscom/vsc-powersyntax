import { normalizeUri } from '../system/uriUtils';
import { compareSourceOriginPriority } from '../../shared/sourceOrigin';
import { EntityKind, type Entity, type Fact, type Scope } from './types';
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

interface ScopeIndexProjectionEntry {
  owner: 'KnowledgeBase.scopeIndexProjection';
  semanticEpoch: number;
  scopeSource: Scope[];
  index: ScopeIndexEntry[];
}

interface PublishedKnowledgeState {
  globalSymbols: Map<string, Entity[]>;
  entitiesByKind: Map<EntityKind, Entity[]>;
  entitiesByContainer: Map<string, Entity[]>;
  typeEntitiesByBaseType: Map<string, Entity[]>;
  documentSymbols: Map<string, Set<string>>;
  entitiesByUri: Map<string, Entity[]>;
  documentScopes: Map<string, Scope[]>;
  documentSnapshots: Map<string, SemanticDocumentSnapshot>;
  documentDependencies: Map<string, Set<string>>;
  reverseDependencies: Map<string, Set<string>>;
  totalEntities: number;
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

function freezeValue<T>(value: T): Readonly<T> {
  if (process.env.NODE_ENV === 'development' && value && typeof value === 'object') {
    return Object.freeze(value);
  }

  return value;
}

function createEmptyState(): PublishedKnowledgeState {
  return {
    globalSymbols: new Map(),
    entitiesByKind: new Map(),
    entitiesByContainer: new Map(),
    typeEntitiesByBaseType: new Map(),
    documentSymbols: new Map(),
    entitiesByUri: new Map(),
    documentScopes: new Map(),
    documentSnapshots: new Map(),
    documentDependencies: new Map(),
    reverseDependencies: new Map(),
    totalEntities: 0,
    semanticEpoch: 0,
    publishedAt: Date.now(),
  };
}

function cloneState(state: PublishedKnowledgeState): PublishedKnowledgeState {
  return {
    globalSymbols: new Map(state.globalSymbols),
    entitiesByKind: new Map(state.entitiesByKind),
    entitiesByContainer: new Map(state.entitiesByContainer),
    typeEntitiesByBaseType: new Map(state.typeEntitiesByBaseType),
    documentSymbols: new Map(state.documentSymbols),
    entitiesByUri: new Map(state.entitiesByUri),
    documentScopes: new Map(state.documentScopes),
    documentSnapshots: new Map(state.documentSnapshots),
    documentDependencies: new Map(state.documentDependencies),
    reverseDependencies: new Map(state.reverseDependencies),
    totalEntities: state.totalEntities,
    semanticEpoch: state.semanticEpoch,
    publishedAt: state.publishedAt,
  };
}

function buildScopeIndex(scopes: Scope[]): ScopeIndexEntry[] {
  const index: ScopeIndexEntry[] = [];

  const walk = (list: Scope[], depth: number): void => {
    for (const scope of list) {
      index.push({
        start: scope.startLine,
        end: scope.endLine,
        depth,
        scope,
      });

      if (scope.children.length > 0) {
        walk(scope.children, depth + 1);
      }
    }
  };

  walk(scopes, 0);
  index.sort((left, right) => left.start - right.start);

  return index;
}

function cloneArrayBucket<K, T>(map: Map<K, T[]>, key: K, touchedKeys: Set<K>): T[] {
  const existing = map.get(key);
  if (!existing) {
    const created: T[] = [];
    map.set(key, created);
    touchedKeys.add(key);
    return created;
  }

  if (touchedKeys.has(key)) {
    return existing;
  }

  const cloned = [...existing];
  map.set(key, cloned);
  touchedKeys.add(key);

  return cloned;
}

function getEntityBuckets(
  state: PublishedKnowledgeState,
  kinds: ReadonlySet<EntityKind> | undefined
): Iterable<Entity[]> {
  if (!kinds || kinds.size === 0) {
    return state.globalSymbols.values();
  }

  return [...kinds].map((kind) => state.entitiesByKind.get(kind) ?? []);
}

function getEntitySourceOrigin(entity: Entity): NonNullable<NonNullable<Entity['lineage']>['sourceOrigin']> | 'unknown' {
  return entity.lineage?.sourceOrigin ?? 'unknown';
}

function sortEntitiesBySourcePriority(entities: Entity[]): void {
  entities.sort((left, right) => compareSourceOriginPriority(getEntitySourceOrigin(left), getEntitySourceOrigin(right)));
}

function normalizeContainerKey(containerName: string | undefined): string {
  return containerName?.trim().toLowerCase() ?? '';
}

function normalizeBaseTypeKey(baseTypeName: string | undefined): string {
  return baseTypeName?.trim().toLowerCase() ?? '';
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
  private readonly scopeIndexProjection = new Map<string, ScopeIndexProjectionEntry>();

  /**
   * Profundidad de batch update. Mientras sea > 0, las operaciones
   * de upsert/remove no disparan efectos colaterales costosos.
   * Patrón portado del plugin_old (SymbolIndex.beginBatchUpdate).
   */
  private batchDepth = 0;

  private epochChangeListeners: ((epoch: number) => void)[] = [];

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
    if (updates.length === 0) {
      return 0;
    }

    const before = this.semanticEpoch;
    this.beginBatchUpdate();

    try {
      for (const update of updates) {
        this.upsertDocument(update.uri, update.facts, update.scopes ?? []);
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

  findDefinitionReadonly(symbolName: string): Readonly<Entity> | null {
    const entities = this.publishedState.globalSymbols.get(symbolName.toLowerCase());

    return entities && entities.length > 0 ? freezeValue(entities[0]) : null;
  }

  /**
   * Busca todas las definiciones globales de un símbolo (case-insensitive).
   * Necesario para "Go to Definition" cuando hay múltiples coincidencias.
   */
  findAllDefinitions(symbolName: string): Entity[] {
    return cloneValue(this.publishedState.globalSymbols.get(symbolName.toLowerCase()) || []);
  }

  findAllDefinitionsReadonly(symbolName: string): ReadonlyArray<Entity> {
    return freezeValue(this.publishedState.globalSymbols.get(symbolName.toLowerCase()) || []);
  }

  /**
   * Spec 109: busca la primera entidad invocable (function/subroutine/event)
   * por nombre, opcionalmente restringida a un contenedor (`window`, `userobject`).
   * Devuelve la primera que cumpla; los conflictos cross-container quedan
   * fuera del alcance hasta tener inheritance/visibility resolvidos.
   */
  findCallable(name: string, container?: string): Entity | null {
    const entities = this.publishedState.globalSymbols.get(name.toLowerCase());
    if (!entities) {
      return null;
    }

    const containerLc = container?.toLowerCase();

    for (const entity of entities) {
      const isCallable = entity.kind === EntityKind.Function
        || entity.kind === EntityKind.Subroutine
        || entity.kind === EntityKind.Event;

      if (!isCallable) {
        continue;
      }

      if (!containerLc) {
        return cloneValue(entity);
      }

      if ((entity.containerName ?? '').toLowerCase() === containerLc) {
        return cloneValue(entity);
      }
    }

    return null;
  }

  findCallableReadonly(name: string, container?: string): Readonly<Entity> | null {
    const entities = this.publishedState.globalSymbols.get(name.toLowerCase());
    if (!entities) {
      return null;
    }

    const containerLc = container?.toLowerCase();

    for (const entity of entities) {
      const isCallable = entity.kind === EntityKind.Function
        || entity.kind === EntityKind.Subroutine
        || entity.kind === EntityKind.Event;

      if (!isCallable) {
        continue;
      }

      if (!containerLc) {
        return freezeValue(entity);
      }

      if ((entity.containerName ?? '').toLowerCase() === containerLc) {
        return freezeValue(entity);
      }
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

    for (const entities of getEntityBuckets(this.publishedState, kinds)) {
      for (const entity of entities) {
        if (kinds && !kinds.has(entity.kind)) {
          continue;
        }

        if (query && !entity.id.includes(query)) {
          continue;
        }

        if (options.include && !options.include(entity)) {
          continue;
        }

        result.push(entity);

        if (result.length >= limit) {
          return cloneValue(result);
        }
      }
    }

    return cloneValue(result);
  }

  countEntities(options?: EntityQueryOptions | ((entity: Entity) => boolean)): number {
    const normalizedOptions = typeof options === 'function'
      ? { include: options }
      : options ?? {};
    const query = normalizedOptions.query?.toLowerCase() ?? '';
    const kinds = normalizedOptions.kinds ? new Set(normalizedOptions.kinds) : undefined;

    if (!normalizedOptions.include && !query && !kinds) {
      return this.publishedState.totalEntities;
    }

    let count = 0;

    for (const entities of getEntityBuckets(this.publishedState, kinds)) {
      for (const entity of entities) {
        if (kinds && !kinds.has(entity.kind)) {
          continue;
        }

        if (query && !entity.id.includes(query)) {
          continue;
        }

        if (!normalizedOptions.include || normalizedOptions.include(entity)) {
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

  getEntitiesByUriReadonly(uri: string): ReadonlyArray<Entity> {
    const normalizedUri = normalizeUri(uri);
    const snapshotEntities = this.publishedState.documentSnapshots.get(normalizedUri)?.symbols;
    if (snapshotEntities) {
      return freezeValue(snapshotEntities);
    }

    const entities = this.publishedState.entitiesByUri.get(normalizedUri);

    return freezeValue(entities ?? []);
  }

  /**
   * Devuelve las entidades cuyo owner lógico es un contenedor dado.
   * Operación O(1) sobre el índice por contenedor; preferir frente a `getAllEntities()`
   * para cierres de miembros por jerarquía.
   */
  getEntitiesByContainer(containerName: string): Entity[] {
    const normalizedContainer = normalizeContainerKey(containerName);
    if (!normalizedContainer) {
      return [];
    }

    return cloneValue(this.publishedState.entitiesByContainer.get(normalizedContainer) ?? []);
  }

  getEntitiesByContainerReadonly(containerName: string): ReadonlyArray<Entity> {
    const normalizedContainer = normalizeContainerKey(containerName);
    if (!normalizedContainer) {
      return [];
    }

    return freezeValue(this.publishedState.entitiesByContainer.get(normalizedContainer) ?? []);
  }

  /**
   * Devuelve los tipos cuyo baseType inmediato coincide con el solicitado.
   * Operación O(1) sobre el índice por baseType; preferir frente a scans
   * completos cuando sólo se necesitan descendientes directos.
   */
  getTypeEntitiesByBaseType(baseTypeName: string): Entity[] {
    const normalizedBaseType = normalizeBaseTypeKey(baseTypeName);
    if (!normalizedBaseType) {
      return [];
    }

    return cloneValue(this.publishedState.typeEntitiesByBaseType.get(normalizedBaseType) ?? []);
  }

  /** Snapshot semántico publicado de un documento. */
  getDocumentSnapshot(uri: string): SemanticDocumentSnapshot | null {
    const snapshot = this.publishedState.documentSnapshots.get(normalizeUri(uri));

    return snapshot ? cloneValue(snapshot) : null;
  }

  getDocumentSnapshotReadonly(uri: string): Readonly<SemanticDocumentSnapshot> | null {
    const snapshot = this.publishedState.documentSnapshots.get(normalizeUri(uri));

    return snapshot ? freezeValue(snapshot) : null;
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
      if (!dependents) {
        continue;
      }

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
    const scopes = this.getPublishedScopes(normalizedUri);
    if (!scopes || scopes.length === 0) {
      return null;
    }

    const index = this.getScopeIndexProjection(normalizedUri, scopes);

    // Búsqueda binaria: índice del primero con start > line.
    let lo = 0;
    let hi = index.length;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (index[mid].start <= line) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    let best: Scope | null = null;
    let bestDepth = -1;

    // Recorrer de derecha a izquierda los candidatos cuyo start <= line.
    for (let indexPosition = lo - 1; indexPosition >= 0; indexPosition--) {
      const candidate = index[indexPosition];
      if (candidate.end < line) {
        continue;
      }

      if (candidate.depth > bestDepth) {
        best = candidate.scope;
        bestDepth = candidate.depth;
      }

      // En árboles bien formados podríamos parar al primer candidato ancestro,
      // pero no podemos asumirlo porque hay scopes raíces consecutivos. El
      // recorrido es lineal acotado por la profundidad real (típico ≤ 3).
    }

    return best ? cloneValue(best) : null;
  }

  getScopeAtReadonly(uri: string, line: number): Readonly<Scope> | null {
    const normalizedUri = normalizeUri(uri);
    const scopes = this.getPublishedScopes(normalizedUri);
    if (!scopes || scopes.length === 0) {
      return null;
    }

    const index = this.getScopeIndexProjection(normalizedUri, scopes);

    // Búsqueda binaria: índice del primero con start > line.
    let lo = 0;
    let hi = index.length;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (index[mid].start <= line) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    let best: Scope | null = null;
    let bestDepth = -1;

    // Recorrer de derecha a izquierda los candidatos cuyo start <= line.
    for (let indexPosition = lo - 1; indexPosition >= 0; indexPosition--) {
      const candidate = index[indexPosition];
      if (candidate.end < line) {
        continue;
      }

      if (candidate.depth > bestDepth) {
        best = candidate.scope;
        bestDepth = candidate.depth;
      }
    }

    return best ? freezeValue(best) : null;
  }

  public onEpochChange(listener: (epoch: number) => void): { dispose: () => void } {
    this.epochChangeListeners.push(listener);

    return {
      dispose: () => {
        this.epochChangeListeners = this.epochChangeListeners.filter((registeredListener) => registeredListener !== listener);
      },
    };
  }

  /**
   * Limpia toda la base de conocimiento.
   */
  clear(): void {
    this.writeState(() => createEmptyState(), true);
    this.scopeIndexProjection.clear();

    if (this.isBatchUpdating) {
      this.stagedStringInterner = new ManagedStringInterner();
    } else {
      this.publishedStringInterner = new ManagedStringInterner();
    }
  }

  /**
   * Retorna estadísticas del índice.
   * Spec 101: añade `indexedScopes` (cardinalidad del scopeIndex) para que
   * features de observabilidad puedan vigilar el coste real del índice.
   */
  getStats() {
    let indexedScopes = 0;
    for (const entry of this.scopeIndexProjection.values()) {
      indexedScopes += entry.index.length;
    }

    let structuralSnapshots = 0;
    let enrichedSnapshots = 0;
    let structuralOnlySnapshots = 0;
    let nearbySemanticReadySnapshots = 0;

    for (const snapshot of this.publishedState.documentSnapshots.values()) {
      if (snapshot.pass === 'structural') {
        structuralSnapshots++;
      }

      if (snapshot.pass === 'enriched') {
        enrichedSnapshots++;
      }

      if (snapshot.readiness === 'structural-only') {
        structuralOnlySnapshots++;
      }

      if (snapshot.readiness === 'nearby-semantic-ready') {
        nearbySemanticReadySnapshots++;
      }
    }

    return {
      totalEntities: this.publishedState.totalEntities,
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
      publishedAt: this.publishedState.publishedAt,
    };
  }

  exportDocumentRecords(): SemanticCacheDocumentRecord[] {
    return Array.from(this.publishedState.entitiesByUri.entries()).map(([uri, facts]) => ({
      uri,
      facts: structuredClone(facts),
      scopes: structuredClone(this.publishedState.documentScopes.get(uri) ?? []),
      snapshot: structuredClone(this.publishedState.documentSnapshots.get(uri)),
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
    this.scopeIndexProjection.clear();

    this.notifyEpochChange(nextState.semanticEpoch);
  }

  private notifyEpochChange(epoch: number): void {
    for (const listener of this.epochChangeListeners) {
      try {
        listener(epoch);
      } catch (error) {
        console.error('Error in epoch change listener', error);
      }
    }
  }

  private publishState(next: PublishedKnowledgeState): void {
    next.semanticEpoch = this.publishedState.semanticEpoch + 1;
    next.publishedAt = Date.now();

    this.publishedState = next;
    this.scopeIndexProjection.clear();

    this.notifyEpochChange(next.semanticEpoch);
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
    const existingEntities = state.entitiesByUri.get(normalizedUri) ?? [];
    this.removeDependenciesFromState(state, normalizedUri);

    if (!existingSymbolIds && existingEntities.length === 0) {
      state.documentSymbols.delete(normalizedUri);
      state.documentScopes.delete(normalizedUri);
      state.entitiesByUri.delete(normalizedUri);
      this.scopeIndexProjection.delete(normalizedUri);
      state.documentSnapshots.delete(normalizedUri);
      return;
    }

    for (const id of existingSymbolIds ?? new Set<string>()) {
      const entities = state.globalSymbols.get(id);
      if (!entities) {
        continue;
      }

      const filtered = entities.filter((entity) => normalizeUri(entity.uri) !== normalizedUri);
      if (filtered.length > 0) {
        state.globalSymbols.set(id, filtered);
      } else {
        state.globalSymbols.delete(id);
      }
    }

    const kinds = new Set(existingEntities.map((entity) => entity.kind));

    for (const kind of kinds) {
      const entities = state.entitiesByKind.get(kind);
      if (!entities) {
        continue;
      }

      const filtered = entities.filter((entity) => normalizeUri(entity.uri) !== normalizedUri);
      if (filtered.length > 0) {
        state.entitiesByKind.set(kind, filtered);
      } else {
        state.entitiesByKind.delete(kind);
      }
    }

    const containers = new Set(
      existingEntities
        .map((entity) => normalizeContainerKey(entity.containerName))
        .filter((containerName) => containerName.length > 0)
    );

    for (const containerName of containers) {
      const entities = state.entitiesByContainer.get(containerName);
      if (!entities) {
        continue;
      }

      const filtered = entities.filter((entity) => normalizeUri(entity.uri) !== normalizedUri);
      if (filtered.length > 0) {
        state.entitiesByContainer.set(containerName, filtered);
      } else {
        state.entitiesByContainer.delete(containerName);
      }
    }

    const baseTypes = new Set(
      existingEntities
        .filter((entity) => entity.kind === EntityKind.Type)
        .map((entity) => normalizeBaseTypeKey(entity.baseTypeName))
        .filter((baseTypeName) => baseTypeName.length > 0)
    );

    for (const baseTypeName of baseTypes) {
      const entities = state.typeEntitiesByBaseType.get(baseTypeName);
      if (!entities) {
        continue;
      }

      const filtered = entities.filter((entity) => normalizeUri(entity.uri) !== normalizedUri);
      if (filtered.length > 0) {
        state.typeEntitiesByBaseType.set(baseTypeName, filtered);
      } else {
        state.typeEntitiesByBaseType.delete(baseTypeName);
      }
    }

    state.documentSymbols.delete(normalizedUri);
    state.documentScopes.delete(normalizedUri);
    state.entitiesByUri.delete(normalizedUri);
    this.scopeIndexProjection.delete(normalizedUri);
    state.documentSnapshots.delete(normalizedUri);
    state.totalEntities = Math.max(0, state.totalEntities - existingEntities.length);
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
      const reverse = new Set(state.reverseDependencies.get(dependency) ?? []);
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
      if (!reverse) {
        continue;
      }

      const nextReverse = new Set(reverse);
      nextReverse.delete(normalizedUri);

      if (nextReverse.size === 0) {
        state.reverseDependencies.delete(dependency);
      } else {
        state.reverseDependencies.set(dependency, nextReverse);
      }
    }

    state.documentDependencies.delete(normalizedUri);
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
    const touchedGlobalIds = new Set<string>();
    const touchedKinds = new Set<EntityKind>();
    const touchedContainers = new Set<string>();
    const touchedBaseTypes = new Set<string>();

    for (const fact of facts) {
      const globalBucket = cloneArrayBucket(state.globalSymbols, fact.id, touchedGlobalIds);
      globalBucket.push(fact);

      const kindBucket = cloneArrayBucket(state.entitiesByKind, fact.kind, touchedKinds);
      kindBucket.push(fact);

      const containerName = normalizeContainerKey(fact.containerName);
      if (containerName) {
        const containerBucket = cloneArrayBucket(state.entitiesByContainer, containerName, touchedContainers);
        containerBucket.push(fact);
      }

      if (fact.kind === EntityKind.Type) {
        const baseTypeName = normalizeBaseTypeKey(fact.baseTypeName);
        if (baseTypeName) {
          const baseTypeBucket = cloneArrayBucket(state.typeEntitiesByBaseType, baseTypeName, touchedBaseTypes);
          baseTypeBucket.push(fact);
        }
      }

      symbolIds.add(fact.id);
      uriEntities.push(fact);
    }

    for (const symbolId of touchedGlobalIds) {
      const globalBucket = state.globalSymbols.get(symbolId);
      if (globalBucket) {
        sortEntitiesBySourcePriority(globalBucket);
      }
    }

    for (const kind of touchedKinds) {
      const kindBucket = state.entitiesByKind.get(kind);
      if (kindBucket) {
        sortEntitiesBySourcePriority(kindBucket);
      }
    }

    for (const containerName of touchedContainers) {
      const containerBucket = state.entitiesByContainer.get(containerName);
      if (containerBucket) {
        sortEntitiesBySourcePriority(containerBucket);
      }
    }

    for (const baseTypeName of touchedBaseTypes) {
      const baseTypeBucket = state.typeEntitiesByBaseType.get(baseTypeName);
      if (baseTypeBucket) {
        sortEntitiesBySourcePriority(baseTypeBucket);
      }
    }

    state.documentSymbols.set(normalizedUri, symbolIds);
    state.documentScopes.set(normalizedUri, scopes);
    this.scopeIndexProjection.delete(normalizedUri);

    if (uriEntities.length > 0) {
      state.entitiesByUri.set(normalizedUri, uriEntities);
      state.totalEntities += uriEntities.length;
    }

    if (snapshot) {
      state.documentSnapshots.set(normalizedUri, snapshot);
      this.updateDependenciesFromSnapshot(state, normalizedUri, snapshot);
    } else {
      this.removeDependenciesFromState(state, normalizedUri);
    }
  }

  private getPublishedScopes(normalizedUri: string): Scope[] | undefined {
    return this.publishedState.documentSnapshots.get(normalizedUri)?.scopes
      ?? this.publishedState.documentScopes.get(normalizedUri);
  }

  private getScopeIndexProjection(normalizedUri: string, scopes: Scope[]): ScopeIndexEntry[] {
    const cached = this.scopeIndexProjection.get(normalizedUri);
    if (
      cached
      && cached.semanticEpoch === this.publishedState.semanticEpoch
      && cached.scopeSource === scopes
    ) {
      return cached.index;
    }

    const index = buildScopeIndex(scopes);
    this.scopeIndexProjection.set(normalizedUri, {
      owner: 'KnowledgeBase.scopeIndexProjection',
      semanticEpoch: this.publishedState.semanticEpoch,
      scopeSource: scopes,
      index,
    });

    return index;
  }
}