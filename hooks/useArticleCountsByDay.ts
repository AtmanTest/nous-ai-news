'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseArticleCountsByDayReturn {
  counts: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let memoryCache: { data: Record<string, number>; timestamp: number } | null = null;

// Export for testing
export const _resetMemoryCache = () => {
  memoryCache = null;
};

export function useArticleCountsByDay(days: number = 7): UseArticleCountsByDayReturn {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchCounts = useCallback(async () => {
    if (!mountedRef.current) return;

    // Check memory cache first
    if (memoryCache && Date.now() - memoryCache.timestamp < CACHE_DURATION) {
      if (mountedRef.current) {
        setCounts(memoryCache.data);
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ days: String(days) });
      const res = await fetch(`/api/news/counts-by-day?${params}`);

      if (!res.ok) throw new Error('Failed to fetch counts');

      const data = await res.json();

      if (!mountedRef.current) return;

      const newCounts = data.counts || {};
      memoryCache = { data: newCounts, timestamp: Date.now() };
      setCounts(newCounts);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'An error occurred');
      // On error, return empty counts rather than crashing
      if (Object.keys(counts).length === 0) {
        setCounts({});
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [days]);

  useEffect(() => {
    fetchCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const refresh = useCallback(async () => {
    memoryCache = null; // Invalidate cache
    await fetchCounts();
  }, [fetchCounts]);

  return {
    counts,
    isLoading,
    error,
    refresh,
  };
}