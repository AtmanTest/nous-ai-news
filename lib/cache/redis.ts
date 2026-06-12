/**
 * Redis cache client with automatic in-memory fallback.
 *
 * Tries Upstash Redis first (when REDIS_URL is configured). Falls back to
 * an in-memory Map-based cache transparently when Redis is unavailable or
 * not configured.
 */

// In-memory fallback store
const memoryStore = new Map<string, { value: string; expiry: number }>();

// Default TTL: 5 minutes
const DEFAULT_TTL_MS = 5 * 60 * 1000;

// Periodic cleanup interval (every 60s)
const CLEANUP_INTERVAL_MS = 60_000;

// Memory store stats
let hits = 0;
let misses = 0;

// Set up periodic cleanup of expired entries
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.expiry > 0 && entry.expiry <= now) {
        memoryStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL_MS).unref?.();
}

export type CacheEntry = {
  value: string;
  expiry: number;
};

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  mode: 'redis' | 'memory';
}

/**
 * Try to get an Upstash Redis client using REDIS_URL env var.
 * Returns null if REDIS_URL is not set or loading fails.
 */
function getRedisClient(): { get: (key: string) => Promise<string | null>; set: (key: string, value: string, ttl?: number) => Promise<void>; del: (key: string) => Promise<void>; ping: () => Promise<boolean> } | null {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url) return null;

  try {
    // Upstash Redis REST API
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = url.replace(/\/$/, '');

    return {
      async get(key: string): Promise<string | null> {
        const res = await fetch(`${baseUrl}/get/${encodeURIComponent(key)}`, {
          headers,
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data?.result ?? null;
      },

      async set(key: string, value: string, ttl?: number): Promise<void> {
        const ttlSeconds = ttl ? Math.ceil(ttl / 1000) : undefined;
        let endpoint = `${baseUrl}/set/${encodeURIComponent(key)}`;
        if (ttlSeconds) {
          endpoint += `/${encodeURIComponent(value)}/ex/${ttlSeconds}`;
        }
        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(value),
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error(`Redis SET failed: ${res.status}`);
      },

      async del(key: string): Promise<void> {
        const res = await fetch(`${baseUrl}/del/${encodeURIComponent(key)}`, {
          method: 'POST',
          headers,
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) throw new Error(`Redis DEL failed: ${res.status}`);
      },

      async ping(): Promise<boolean> {
        try {
          const res = await fetch(`${baseUrl}/ping`, {
            headers,
            signal: AbortSignal.timeout(2000),
          });
          return res.ok;
        } catch {
          return false;
        }
      },
    };
  } catch {
    return null;
  }
}

// Lazy-initialized Redis client
let redisClient: ReturnType<typeof getRedisClient> | null | undefined = undefined;

function getClient(): { type: 'redis'; client: NonNullable<ReturnType<typeof getRedisClient>> } | { type: 'memory' } {
  if (redisClient === undefined) {
    redisClient = getRedisClient();
  }
  if (redisClient) {
    return { type: 'redis', client: redisClient };
  }
  return { type: 'memory' };
}

export const cache = {
  /**
   * Get a value from cache. Tries Redis first, falls back to memory.
   */
  async get<T>(key: string): Promise<T | null> {
    const client = getClient();

    if (client.type === 'redis') {
      try {
        const raw = await client.client.get(key);
        if (raw !== null && raw !== undefined) {
          hits++;
          return JSON.parse(raw) as T;
        }
      } catch {
        // Redis failure — fall through to memory
      }
    }

    // Memory fallback
    const entry = memoryStore.get(key);
    if (entry) {
      if (entry.expiry === 0 || entry.expiry > Date.now()) {
        hits++;
        return JSON.parse(entry.value) as T;
      }
      // Expired
      memoryStore.delete(key);
    }

    misses++;
    return null;
  },

  /**
   * Set a value in cache.
   */
  async set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiry = ttlMs > 0 ? Date.now() + ttlMs : 0;

    // Always write to memory
    memoryStore.set(key, { value: serialized, expiry });

    // Also try Redis
    const client = getClient();
    if (client.type === 'redis') {
      try {
        await client.client.set(key, serialized, ttlMs);
      } catch {
        // Redis failure — memory cache still works
      }
    }
  },

  /**
   * Delete a key from cache.
   */
  async del(key: string): Promise<void> {
    memoryStore.delete(key);

    const client = getClient();
    if (client.type === 'redis') {
      try {
        await client.client.del(key);
      } catch {
        // ignore
      }
    }
  },

  /**
   * Get or compute a cached value. If the key isn't cached, calls the
   * factory function, caches the result, and returns it.
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs: number = DEFAULT_TTL_MS,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(key, value, ttlMs);
    return value;
  },

  /**
   * Check if Redis is connected (useful for health checks).
   */
  async ping(): Promise<boolean> {
    const client = getClient();
    if (client.type === 'redis') {
      try {
        return await client.client.ping();
      } catch {
        return false;
      }
    }
    return false; // memory-only is always "available"
  },

  /**
   * Get cache statistics.
   */
  stats(): CacheStats {
    const client = getClient();
    return {
      hits,
      misses,
      size: memoryStore.size,
      mode: client.type === 'redis' ? 'redis' : 'memory',
    };
  },

  /**
   * Clear all cached entries (memory store).
   */
  clear(): void {
    memoryStore.clear();
    hits = 0;
    misses = 0;
  },
};
