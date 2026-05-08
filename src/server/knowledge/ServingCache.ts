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

type ServingCachePartition = ServingFeature | 'generic';

const SERVING_FEATURES: readonly ServingFeature[] = ['hover', 'completion', 'signatureHelp', 'definition'];

const FEATURE_WEIGHTS: Readonly<Record<ServingFeature, number>> = {
  hover: 0.3,
  completion: 0.35,
  signatureHelp: 0.15,
  definition: 0.2
};

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
  feature?: ServingFeature;
  removed?: number;
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
}

export type ServingCacheObserver = (event: ServingCacheEvent) => void;

export interface ServingCacheFeatureStats {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
}

export interface ServingCacheStats {
  size: number;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
  ttlMs: number;
  byFeature: Record<ServingFeature, ServingCacheFeatureStats>;
}

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
  if (parts.length >= 5) {
    const parsed = Number.parseInt(parts[4], 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  const parsed = Number.parseInt(extractStructuredSegment(key, 'kb:') ?? '', 10);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Devuelve la URI normalizada contenida en una clave de ServingCache.
 * Útil para invalidación selectiva.
 */
function uriFromKey(key: string): string | null {
  // formato: feature|uri|line|character|kbVersion|extra
  const firstPipe = key.indexOf('|');
  if (firstPipe >= 0) {
    const secondPipe = key.indexOf('|', firstPipe + 1);
    if (secondPipe >= 0) {
      const legacyUri = key.substring(firstPipe + 1, secondPipe);
      if (legacyUri.startsWith('file:')) {
        return legacyUri;
      }
    }
  }

  return extractStructuredSegment(key, 'uri:') ?? null;
}

function isServingFeature(value: string): value is ServingFeature {
  return SERVING_FEATURES.includes(value as ServingFeature);
}

function extractStructuredSegment(key: string, prefix: string): string | undefined {
  const segment = key.split('|').find((entry) => entry.startsWith(prefix));
  return segment ? decodeURIComponent(segment.slice(prefix.length)) : undefined;
}

function partitionFromKey(key: string): ServingCachePartition {
  const feature = key.split('|', 1)[0] ?? '';
  if (isServingFeature(feature)) {
    return feature;
  }

  const structuredFeature = extractStructuredSegment(key, 'feature:');
  return structuredFeature && isServingFeature(structuredFeature) ? structuredFeature : 'generic';
}

interface ServingCachePartitionState<T> {
  entries: Map<string, T>;
  insertedAt: Map<string, number>;
  capacity: number;
  hits: number;
  misses: number;
  evictions: number;
}

function createPartitionState<T>(capacity: number): ServingCachePartitionState<T> {
  return {
    entries: new Map(),
    insertedAt: new Map(),
    capacity,
    hits: 0,
    misses: 0,
    evictions: 0
  };
}

function buildFeatureCapacities(maxEntries: number): Record<ServingFeature, number> {
  const total = Math.max(1, maxEntries);
  const base = Object.fromEntries(SERVING_FEATURES.map((feature) => [feature, 0])) as Record<ServingFeature, number>;

  if (total < SERVING_FEATURES.length) {
    for (let index = 0; index < total; index++) {
      base[SERVING_FEATURES[index]] = 1;
    }
    return base;
  }

  let assigned = 0;
  const fractions: Array<{ feature: ServingFeature; fraction: number }> = [];
  for (const feature of SERVING_FEATURES) {
    const exact = total * FEATURE_WEIGHTS[feature];
    const value = Math.max(1, Math.floor(exact));
    base[feature] = value;
    assigned += value;
    fractions.push({ feature, fraction: exact - Math.floor(exact) });
  }

  while (assigned > total) {
    const candidate = SERVING_FEATURES
      .filter((feature) => base[feature] > 1)
      .sort((left, right) => FEATURE_WEIGHTS[left] - FEATURE_WEIGHTS[right])[0];
    if (!candidate) {
      break;
    }
    base[candidate]--;
    assigned--;
  }

  fractions.sort((left, right) => right.fraction - left.fraction);
  let cursor = 0;
  while (assigned < total) {
    const target = fractions[cursor % fractions.length]?.feature;
    if (!target) {
      break;
    }
    base[target]++;
    assigned++;
    cursor++;
  }

  return base;
}

export class ServingCache<T = unknown> {
  private readonly ttlMs: number;
  private readonly partitions: Record<ServingCachePartition, ServingCachePartitionState<T>>;

  constructor(
    private readonly maxEntries: number = 256,
    ttlMs = 0,
    private readonly observer?: ServingCacheObserver
  ) {
    this.ttlMs = ttlMs;
    const featureCapacities = buildFeatureCapacities(maxEntries);
    this.partitions = {
      generic: createPartitionState<T>(Math.max(1, maxEntries)),
      hover: createPartitionState<T>(featureCapacities.hover),
      completion: createPartitionState<T>(featureCapacities.completion),
      signatureHelp: createPartitionState<T>(featureCapacities.signatureHelp),
      definition: createPartitionState<T>(featureCapacities.definition)
    };
  }

  private getPartition(key: string): ServingCachePartitionState<T> {
    return this.partitions[partitionFromKey(key)];
  }

  private getFeatureFromKey(key: string): ServingFeature | undefined {
    const partition = partitionFromKey(key);
    return partition === 'generic' ? undefined : partition;
  }

  private totalSize(): number {
    return Object.values(this.partitions).reduce((total, partition) => total + partition.entries.size, 0);
  }

  private totalHits(): number {
    return Object.values(this.partitions).reduce((total, partition) => total + partition.hits, 0);
  }

  private totalMisses(): number {
    return Object.values(this.partitions).reduce((total, partition) => total + partition.misses, 0);
  }

  private totalEvictions(): number {
    return Object.values(this.partitions).reduce((total, partition) => total + partition.evictions, 0);
  }

  private buildFeatureStats(): Record<ServingFeature, ServingCacheFeatureStats> {
    return Object.fromEntries(
      SERVING_FEATURES.map((feature) => {
        const partition = this.partitions[feature];
        return [
          feature,
          {
            size: partition.entries.size,
            capacity: partition.capacity,
            hits: partition.hits,
            misses: partition.misses,
            evictions: partition.evictions
          }
        ];
      })
    ) as Record<ServingFeature, ServingCacheFeatureStats>;
  }

  private emitEvent(action: ServingCacheEvent['action'], context: Partial<ServingCacheEvent> = {}): void {
    if (!this.observer) {
      return;
    }

    this.observer({
      action,
      size: this.totalSize(),
      capacity: this.maxEntries,
      hits: this.totalHits(),
      misses: this.totalMisses(),
      evictions: this.totalEvictions(),
      ...context
    });
  }

  /** Recupera un valor y lo "calienta" (lo mueve al final de la LRU). */
  get(key: string): T | undefined {
    const partition = this.getPartition(key);
    const value = partition.entries.get(key);
    if (value === undefined) {
      partition.misses++;
      this.emitEvent('miss', { key, feature: this.getFeatureFromKey(key) });
      return undefined;
    }
    // Spec 118: TTL opcional. Si vencido, eliminar y devolver undefined.
    if (this.ttlMs > 0) {
      const at = partition.insertedAt.get(key) ?? 0;
      if (Date.now() - at > this.ttlMs) {
        partition.entries.delete(key);
        partition.insertedAt.delete(key);
        partition.evictions++;
        partition.misses++;
        this.emitEvent('evict', { key, feature: this.getFeatureFromKey(key) });
        this.emitEvent('miss', { key, feature: this.getFeatureFromKey(key) });
        return undefined;
      }
    }
    partition.entries.delete(key);
    partition.entries.set(key, value);
    partition.hits++;
    this.emitEvent('hit', { key, feature: this.getFeatureFromKey(key) });
    return value;
  }

  /**
   * PB-PERF-P2-OPTIMISTIC-SNAPSHOTS-01:
   * Recupera un resultado obsoleto buscando una clave que coincida con el matcher
   * dentro de una feature dada.
   */
  getStale(feature: ServingFeature | 'generic', matcher: (key: string) => boolean): T | undefined {
    const partition = this.partitions[feature];
    if (!partition) {
      return undefined;
    }
    const keys = Array.from(partition.entries.keys());
    for (let i = keys.length - 1; i >= 0; i--) {
      if (matcher(keys[i])) {
        const key = keys[i];
        // Opcional: no emitimos hit/miss porque es lectura de fondo stale
        return partition.entries.get(key);
      }
    }
    return undefined;
  }

  /** Inserta un valor; si la caché está llena, evicta el más antiguo. */
  set(key: string, value: T): void {
    const partition = this.getPartition(key);
    if (partition.capacity <= 0) {
      return;
    }

    if (partition.entries.has(key)) {
      partition.entries.delete(key);
    } else if (partition.entries.size >= partition.capacity) {
      const oldest = partition.entries.keys().next().value;
      if (oldest !== undefined) {
        partition.entries.delete(oldest);
        partition.insertedAt.delete(oldest);
        partition.evictions++;
        this.emitEvent('evict', { key: oldest, feature: this.getFeatureFromKey(oldest) });
      }
    }
    partition.entries.set(key, value);
    if (this.ttlMs > 0) {
      partition.insertedAt.set(key, Date.now());
    }
    this.emitEvent('set', { key, feature: this.getFeatureFromKey(key) });
  }

  /** Exporta un snapshot ordenado de la LRU actual, de más antiguo a más reciente. */
  exportEntries(): ServingCacheEntry<T>[] {
    const orderedPartitions: readonly ServingCachePartition[] = ['generic', ...SERVING_FEATURES];
    return orderedPartitions.flatMap((partitionKey) => {
      const partition = this.partitions[partitionKey];
      return [...partition.entries.entries()].map(([key, value]) => ({
        key,
        value: structuredClone(value),
        insertedAt: this.ttlMs > 0 ? partition.insertedAt.get(key) : undefined
      }));
    });
  }

  /** Restaura un snapshot exportado preservando orden LRU y capacidad. */
  restoreEntries(entries: ServingCacheEntry<T>[]): void {
    for (const partition of Object.values(this.partitions)) {
      partition.entries.clear();
      partition.insertedAt.clear();
    }

    const grouped = new Map<ServingCachePartition, ServingCacheEntry<T>[]>();
    for (const entry of entries) {
      const partitionKey = partitionFromKey(entry.key);
      const bucket = grouped.get(partitionKey);
      if (bucket) {
        bucket.push(entry);
      } else {
        grouped.set(partitionKey, [entry]);
      }
    }

    for (const [partitionKey, groupedEntries] of grouped.entries()) {
      const partition = this.partitions[partitionKey];
      const retainedEntries = groupedEntries.slice(-partition.capacity);
      for (const entry of retainedEntries) {
        partition.entries.set(entry.key, structuredClone(entry.value));
        if (this.ttlMs > 0) {
          partition.insertedAt.set(entry.key, entry.insertedAt ?? Date.now());
        }
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
      removed = this.totalSize();
      for (const partition of Object.values(this.partitions)) {
        partition.entries.clear();
        partition.insertedAt.clear();
      }
      this.emitEvent('invalidate', { removed });
      return;
    }

    const normalized = normalizeUri(uri);
    for (const partition of Object.values(this.partitions)) {
      for (const key of [...partition.entries.keys()]) {
        if (uriFromKey(key) === normalized) {
          partition.entries.delete(key);
          partition.insertedAt.delete(key);
          removed++;
        }
      }
    }

    this.emitEvent('invalidate', { uri: normalized, removed });
  }

  /** Tamaño actual (para inspección y tests). */
  size(): number {
    return this.totalSize();
  }

  /** Spec 121: métricas para telemetría. */
  getStats(): ServingCacheStats {
    return {
      size: this.totalSize(),
      capacity: this.maxEntries,
      hits: this.totalHits(),
      misses: this.totalMisses(),
      evictions: this.totalEvictions(),
      ttlMs: this.ttlMs,
      byFeature: this.buildFeatureStats()
    };
  }
}
