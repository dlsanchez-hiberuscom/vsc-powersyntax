import { kbVersionFromKey, type ServingCache } from '../knowledge/ServingCache';
import type { SemanticCacheStore } from './cacheStore';

export async function restoreServingCacheSnapshot(
  cache: ServingCache<unknown>,
  store: Pick<SemanticCacheStore, 'loadServingCacheSnapshot'> | null | undefined,
  expectedKbVersion: number
): Promise<number> {
  if (!store) {
    return 0;
  }

  const entries = (await store.loadServingCacheSnapshot<unknown>()).filter(
    (entry) => kbVersionFromKey(entry.key) === expectedKbVersion
  );
  if (entries.length === 0) {
    return 0;
  }

  cache.restoreEntries(entries);
  return entries.length;
}

export async function persistServingCacheSnapshot(
  cache: ServingCache<unknown>,
  store: Pick<SemanticCacheStore, 'persistServingCacheSnapshot'> | null | undefined,
  activeKbVersion: number
): Promise<number> {
  if (!store) {
    return 0;
  }

  const entries = cache.exportEntries().filter((entry) => kbVersionFromKey(entry.key) === activeKbVersion);
  await store.persistServingCacheSnapshot(entries);
  return entries.length;
}