/**
 * Registro declarativo de descriptores de cache con owner, clase de presión,
 * políticas de invalidación y políticas de stale.
 */

export type CacheInvalidationPolicy =
  | 'document-fingerprint'
  | 'kb-version'
  | 'source-origin'
  | 'locale'
  | 'manual';

export type CacheStalePolicy = 'strict' | 'allow-stale-ui' | 'degrade-to-empty';

export interface CacheDescriptor {
  id: string;
  owner: string;
  pressureClass: 'hot' | 'heavy' | 'negative';
  invalidationPolicies: CacheInvalidationPolicy[];
  stalePolicy: CacheStalePolicy;
  budgetMs?: number;
  capEntries?: number;
  description?: string;
}

export class CacheDescriptorRegistry {
  private readonly descriptors = new Map<string, CacheDescriptor>();

  register(descriptor: CacheDescriptor): void {
    this.descriptors.set(descriptor.id, descriptor);
  }

  get(id: string): CacheDescriptor | undefined {
    return this.descriptors.get(id);
  }

  getAll(): CacheDescriptor[] {
    return Array.from(this.descriptors.values());
  }
}

export const CACHE_DESCRIPTOR_REGISTRY = new CacheDescriptorRegistry();

const SERVING = 'InteractiveServingCacheFeature';

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'hover',
  owner: SERVING,
  pressureClass: 'hot',
  invalidationPolicies: ['document-fingerprint', 'kb-version'],
  stalePolicy: 'allow-stale-ui',
  budgetMs: 150,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'hover-view-model',
  owner: SERVING,
  pressureClass: 'heavy',
  invalidationPolicies: ['document-fingerprint', 'kb-version', 'locale'],
  stalePolicy: 'allow-stale-ui',
  budgetMs: 200,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'hover-negative',
  owner: SERVING,
  pressureClass: 'negative',
  invalidationPolicies: ['document-fingerprint'],
  stalePolicy: 'strict',
  budgetMs: 50,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'completion',
  owner: SERVING,
  pressureClass: 'hot',
  invalidationPolicies: ['document-fingerprint', 'kb-version'],
  stalePolicy: 'allow-stale-ui',
  budgetMs: 300,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'completion-resolve',
  owner: SERVING,
  pressureClass: 'hot',
  invalidationPolicies: ['document-fingerprint', 'kb-version'],
  stalePolicy: 'allow-stale-ui',
  budgetMs: 100,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'completion-view-model',
  owner: SERVING,
  pressureClass: 'heavy',
  invalidationPolicies: ['document-fingerprint', 'kb-version', 'locale'],
  stalePolicy: 'allow-stale-ui',
  budgetMs: 300,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'signatureHelp',
  owner: SERVING,
  pressureClass: 'hot',
  invalidationPolicies: ['document-fingerprint', 'kb-version'],
  stalePolicy: 'allow-stale-ui',
  budgetMs: 150,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'signatureHelp-view-model',
  owner: SERVING,
  pressureClass: 'heavy',
  invalidationPolicies: ['document-fingerprint', 'kb-version', 'locale'],
  stalePolicy: 'allow-stale-ui',
  budgetMs: 200,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'definition',
  owner: SERVING,
  pressureClass: 'hot',
  invalidationPolicies: ['document-fingerprint', 'kb-version'],
  stalePolicy: 'degrade-to-empty',
  budgetMs: 200,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'references',
  owner: SERVING,
  pressureClass: 'heavy',
  invalidationPolicies: ['document-fingerprint', 'kb-version'],
  stalePolicy: 'degrade-to-empty',
  budgetMs: 400,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'documentSymbols',
  owner: SERVING,
  pressureClass: 'hot',
  invalidationPolicies: ['document-fingerprint'],
  stalePolicy: 'allow-stale-ui',
  budgetMs: 100,
});

CACHE_DESCRIPTOR_REGISTRY.register({
  id: 'semanticTokens',
  owner: SERVING,
  pressureClass: 'hot',
  invalidationPolicies: ['document-fingerprint', 'kb-version'],
  stalePolicy: 'allow-stale-ui',
  budgetMs: 200,
});
