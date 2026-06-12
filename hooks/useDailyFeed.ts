'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export interface DailyArticle {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_name: string;
  category: string | null;
  tags: string[];
  published_at: string;
  score: number;
  is_breaking: boolean;
}

export interface DailyDay {
  date: string; // YYYY-MM-DD
  label: string; // "Today", "Yesterday", "Monday June 8"
  articles: DailyArticle[];
}

export interface UseDailyFeedReturn {
  days: DailyDay[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const DEFAULT_LIMIT = 50;

export function useDailyFeed(): UseDailyFeedReturn {
  const router = useRouter();
  const pathname = usePathname();

  const [days, setDays] = useState<DailyDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchFeed = useCallback(async (append: boolean) => {
    if (!mountedRef.current) return;

    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: String(DEFAULT_LIMIT),
      });
      if (append && cursorRef.current) {
        params.set('cursor', cursorRef.current);
      }

      const res = await fetch(`/api/daily-feed?${params}`);
      if (!res.ok) throw new Error('Failed to fetch daily feed');

      const data = await res.json();

      if (!mountedRef.current) return;

      if (append) {
        setDays(prev => [...prev, ...data.days]);
      } else {
        setDays(data.days);
      }
      cursorRef.current = data.nextCursor || null;
      setHasMore(data.hasMore);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchFeed(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || isLoading) return;
    await fetchFeed(true);
  }, [fetchFeed, isLoadingMore, hasMore, isLoading]);

  const refresh = useCallback(async () => {
    cursorRef.current = null;
    setDays([]);
    setHasMore(true);
    await fetchFeed(false);
  }, [fetchFeed]);

  return {
    days,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
  };
}