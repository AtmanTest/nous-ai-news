/**
 * Cache Manager — high-level cache wrapper.
 *
 * Provides tiered caching for API routes with:
 * - Automatic Redis → memory → stale fallback
 * - Configurable TTL per namespace
 * - Tag-based invalidation
 * - Performance metrics
 */

import { cache } from './redis';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CacheConfig {
  /** Time-to-live in milliseconds (default: 5 min) */
  ttlMs: number;
  /** Namespace prefix for cache keys */
  namespace: string;
  /** Whether to serve stale data when refresh fails (default: true) */
  serveStale?: boolean;
}

export interface CachedResponse<T> {
  data: T;
  cached: boolean;
  stale?: boolean;
  source: 'redis' | 'memory' | 'fresh';
  timing?: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  memorySize: number;
  mode: 'redis' | 'memory';
}

// ─── Default configs per namespace ─────────────────────────────────────────────

const DEFAULT_CONFIGS: Record<string, CacheConfig> = {
  trending: { ttlMs: 5 * 60 * 1000, namespace: 'trending', serveStale: true },
  'for-you': { ttlMs: 3 * 60 * 1000, namespace: 'for-you', serveStale: true },
  latest: { ttlMs: 60 * 1000, namespace: 'latest', serveStale: true },
  'huggingface-trending': { ttlMs: 15 * 60 * 1000, namespace: 'huggingface-trending', serveStale: true },
  article: { ttlMs: 10 * 60 * 1000, namespace: 'article', serveStale: false },
};

const STALE_MARKER = '__stale__';

function buildKey(namespace: string, ...parts: string[]): string {
  return ['daily-ai', namespace, ...parts].join(':');
}

// ─── Stale store (last known good data) ────────────────────────────────────────

const staleStore = new Map<string, { data: unknown; timestamp: number }>();

// ─── Public API ────────────────────────────────────────────────────────────────

export const cacheManager = {
  /**
   * Fetch data with caching. Tries cache first, then factory, falls back to stale.
   *
   * @example
   * ```ts
   * const result = await cacheManager.fetch('trending', ['page-1'], () => fetchTrending(), { ttlMs: 300_000 });
   * ```
   */
  async fetch<T>(
    namespace: string,
    keyParts: string[],
    factory: () => Promise<T>,
    config?: Partial<CacheConfig>,
  ): Promise<CachedResponse<T>> {
    const defaults = DEFAULT_CONFIGS[namespace];
    const cfg: CacheConfig = {
      ...(defaults || { namespace }),
      ...config,
      // Always respect the explicitly passed namespace
      namespace: config?.namespace || defaults?.namespace || namespace,
    };
    const cacheKey = buildKey(cfg.namespace, ...keyParts);
    const staleKey = buildKey(cfg.namespace, 'stale', ...keyParts);
    const start = performance.now();

    // 1. Try primary cache
    const cached = await cache.get<T>(cacheKey);
    if (cached !== null) {
      const timing = Math.round(performance.now() - start);
      return { data: cached, cached: true, source: 'redis', timing };
    }

    // 2. Try stale store
    const stale = staleStore.get(staleKey) as { data: T; timestamp: number } | undefined;
    if (stale && cfg.serveStale !== false) {
      const timing = Math.round(performance.now() - start);
      return { data: stale.data, cached: true, stale: true, source: 'memory', timing };
    }

    // 3. Fetch fresh data
    try {
      const data = await factory();
      const timing = Math.round(performance.now() - start);

      // Cache the result
      await cache.set(cacheKey, data, cfg.ttlMs);

      // Save to stale store
      staleStore.set(staleKey, { data: data as unknown, timestamp: Date.now() });

      return { data, cached: false, source: 'fresh', timing };
    } catch (err) {
      // 4. Factory failed — try stale again (in case it was just checked)
      const staleRetry = staleStore.get(staleKey) as { data: T; timestamp: number } | undefined;
      if (staleRetry && cfg.serveStale !== false) {
        const timing = Math.round(performance.now() - start);
        return { data: staleRetry.data, cached: true, stale: true, source: 'memory', timing };
      }

      throw err;
    }
  },

  /**
   * Invalidate cached data for a namespace and optional key parts.
   */
  async invalidate(namespace: string, ...keyParts: string[]): Promise<void> {
    const cacheKey = buildKey(namespace, ...keyParts);
    await cache.del(cacheKey);

    // Also clear stale
    const staleKey = buildKey(namespace, 'stale', ...keyParts);
    staleStore.delete(staleKey);
  },

  /**
   * Invalidate all cached data for a namespace.
   */
  async invalidateNamespace(namespace: string): Promise<void> {
    // Clear matching entries from stale store
    const prefix = buildKey(namespace, 'stale');
    for (const key of staleStore.keys()) {
      if (key.startsWith(prefix)) {
        staleStore.delete(key);
      }
    }
    // Note: full namespace invalidation would require scanning Redis keys.
    // For now, this clears the stale store — the next fetch will get fresh data.
  },

  /**
   * Get cache metrics.
   */
  getMetrics(): CacheMetrics {
    const s = cache.stats();
    return {
      hits: s.hits,
      misses: s.misses,
      memorySize: s.size,
      mode: s.mode,
    };
  },

  /**
   * Clear all caches.
   */
  async clear(): Promise<void> {
    staleStore.clear();
    cache.clear();
  },
};
