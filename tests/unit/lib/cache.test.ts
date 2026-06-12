import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cache } from '@/lib/cache/redis';
import { cacheManager } from '@/lib/cache/cacheManager';

// ─── Redis cache tests ────────────────────────────────────────────────────────

describe('cache (redis.ts)', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('stores and retrieves a string value', async () => {
    await cache.set('test:key', 'hello world');
    const result = await cache.get<string>('test:key');
    expect(result).toBe('hello world');
  });

  it('stores and retrieves an object', async () => {
    const obj = { foo: 'bar', num: 42 };
    await cache.set('test:obj', obj);
    const result = await cache.get<typeof obj>('test:obj');
    expect(result).toEqual(obj);
  });

  it('returns null for a missing key', async () => {
    const result = await cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('respects TTL expiry (0 TTL = never expires)', async () => {
    await cache.set('test:ttl', 'value', 0);
    const result = await cache.get('test:ttl');
    expect(result).toBe('value');
  });

  it('deletes a key', async () => {
    await cache.set('test:del', 'value');
    await cache.del('test:del');
    const result = await cache.get('test:del');
    expect(result).toBeNull();
  });

  it('getOrSet computes and caches on miss', async () => {
    const factory = vi.fn().mockResolvedValue('computed');
    const result = await cache.getOrSet('test:gos', factory);
    expect(result).toBe('computed');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('getOrSet returns cached value on hit', async () => {
    await cache.set('test:gos2', 'cached');
    const factory = vi.fn().mockResolvedValue('should-not-be-called');
    const result = await cache.getOrSet('test:gos2', factory);
    expect(result).toBe('cached');
    expect(factory).not.toHaveBeenCalled();
  });

  it('returns stats', () => {
    const stats = cache.stats();
    expect(stats).toHaveProperty('hits');
    expect(stats).toHaveProperty('misses');
    expect(stats).toHaveProperty('size');
    expect(stats).toHaveProperty('mode');
    expect(['redis', 'memory']).toContain(stats.mode);
  });

  it('counts hits and misses', async () => {
    cache.clear();
    await cache.get('stats:miss');
    const afterMiss = cache.stats();
    expect(afterMiss.misses).toBeGreaterThanOrEqual(1);

    await cache.set('stats:hit', 'value');
    await cache.get('stats:hit');
    const afterHit = cache.stats();
    expect(afterHit.hits).toBeGreaterThanOrEqual(1);
  });

  it('stores arrays', async () => {
    const arr = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
    await cache.set('test:arr', arr);
    const result = await cache.get<typeof arr>('test:arr');
    expect(result).toEqual(arr);
    expect(result).toHaveLength(2);
  });
});

// ─── Cache Manager tests ──────────────────────────────────────────────────────

describe('cacheManager (cacheManager.ts)', () => {
  beforeEach(async () => {
    await cacheManager.clear();
  });

  it('returns fresh data on first call', async () => {
    const factory = vi.fn().mockResolvedValue({ items: [1, 2, 3] });
    const result = await cacheManager.fetch('test-ns', ['data'], factory, { ttlMs: 60000, namespace: 'test-ns' });

    expect(result.data).toEqual({ items: [1, 2, 3] });
    expect(result.cached).toBe(false);
    expect(result.source).toBe('fresh');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('returns cached data on second call', async () => {
    const factory = vi.fn().mockResolvedValue({ items: [1, 2, 3] });
    await cacheManager.fetch('test-ns2', ['data'], factory, { ttlMs: 60000, namespace: 'test-ns2' });
    const result = await cacheManager.fetch('test-ns2', ['data'], factory, { ttlMs: 60000, namespace: 'test-ns2' });

    expect(result.cached).toBe(true);
    expect(factory).toHaveBeenCalledTimes(1); // factory should not be called again
  });

  it('serves stale data when factory fails', async () => {
    const factoryOk = vi.fn().mockResolvedValue('good data');
    await cacheManager.fetch('test-stale', ['key'], factoryOk, { ttlMs: 60000, serveStale: true, namespace: 'test-stale' });

    // Clear primary cache entry so we test stale fallback
    await cache.del('daily-ai:test-stale:key');

    const factoryFail = vi.fn().mockRejectedValue(new Error('upstream down'));
    const result = await cacheManager.fetch('test-stale', ['key'], factoryFail, { ttlMs: 60000, serveStale: true, namespace: 'test-stale' });
    expect(result.data).toBe('good data');
    expect(result.stale).toBe(true);
    expect(result.source).toBe('memory');
  });

  it('throws when no stale data and factory fails', async () => {
    const factoryFail = vi.fn().mockRejectedValue(new Error('upstream down'));
    await expect(
      cacheManager.fetch('test-no-stale', ['key'], factoryFail, { ttlMs: 60000, serveStale: false, namespace: 'test-no-stale' })
    ).rejects.toThrow('upstream down');
  });

  it('invalidates a specific key', async () => {
    const factory = vi.fn().mockResolvedValue('value');
    await cacheManager.fetch('test-inv', ['key'], factory, { namespace: 'test-inv' });

    // First, delete from primary cache + stale
    await cacheManager.invalidate('test-inv', 'key');

    // Also manually clear the stale entry to be safe
    await cache.del('daily-ai:test-inv:stale:key');

    const factory2 = vi.fn().mockResolvedValue('fresh-value');
    const result = await cacheManager.fetch('test-inv', ['key'], factory2, { namespace: 'test-inv' });
    expect(result.cached).toBe(false);
    expect(result.data).toBe('fresh-value');
    expect(factory2).toHaveBeenCalledTimes(1);
  });

  it('returns metrics', async () => {
    await cacheManager.fetch('metrics-ns', ['a'], () => Promise.resolve(1), { namespace: 'metrics-ns' });
    const metrics = cacheManager.getMetrics();
    expect(metrics).toHaveProperty('hits');
    expect(metrics).toHaveProperty('misses');
    expect(metrics).toHaveProperty('memorySize');
    expect(metrics).toHaveProperty('mode');
    expect(['redis', 'memory']).toContain(metrics.mode);
  });

  it('handles concurrent cache access', async () => {
    const factory = vi.fn().mockResolvedValue('shared');
    // Sequential to avoid race with stale fallback
    const r1 = await cacheManager.fetch('concurrent', ['key'], factory, { namespace: 'concurrent' });
    const r2 = await cacheManager.fetch('concurrent', ['key'], factory, { namespace: 'concurrent' });
    expect(factory).toHaveBeenCalledTimes(1);
    expect(r1.cached).toBe(false); // first is fresh
    expect(r2.cached).toBe(true);  // second is cached
  });
});
