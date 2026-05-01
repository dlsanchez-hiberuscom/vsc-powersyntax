import type { ServingCache } from '../knowledge/ServingCache';
import type { ServingCacheFlushCoordinator } from './servingCacheFlushCoordinator';

export function cacheServingResult<T>(
  cache: ServingCache<unknown>,
  key: string,
  value: T,
  flushCoordinator?: Pick<ServingCacheFlushCoordinator, 'markDirty' | 'flushIfDirty'> | null
): void {
  cache.set(key, value);
  if (!flushCoordinator) {
    return;
  }

  flushCoordinator.markDirty();
  void flushCoordinator.flushIfDirty();
}

export function invalidateServingCacheEntries(
  cache: ServingCache<unknown>,
  uris?: readonly string[],
  flushCoordinator?: Pick<ServingCacheFlushCoordinator, 'markDirty' | 'flushIfDirty'> | null
): void {
  if (!uris || uris.length === 0) {
    cache.invalidate();
  } else {
    for (const uri of uris) {
      cache.invalidate(uri);
    }
  }

  if (!flushCoordinator) {
    return;
  }

  flushCoordinator.markDirty();
  void flushCoordinator.flushIfDirty();
}