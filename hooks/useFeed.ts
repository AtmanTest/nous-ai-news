'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export interface Article {
  id: string;
  title: string;
  summary: string | null;
  image_url: string | null;
  source_name: string;
  source_logo?: string;
  source_handle?: string;
  category: string | null;
  tags: string[];
  published_at: string;
  score: number;
  is_breaking: boolean;
}

type TabId = 'latest' | 'trending' | 'for-you';

interface FeedState {
  articles: Article[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  activeTab: TabId;
}

interface UseFeedReturn extends FeedState {
  setTab: (tab: TabId) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const PAGE_SIZE = 20;
const VALID_TABS = new Set(['latest', 'trending', 'for-you']);

export function useFeed(): UseFeedReturn {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read tab from URL, default to 'latest'
  const urlTab = (searchParams.get('tab') || 'latest') as TabId;
  const activeTab = VALID_TABS.has(urlTab) ? urlTab : 'latest';

  // Read date from URL
  const urlDate = searchParams.get('date');
  const date = urlDate || undefined;

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const prevSearchParamsRef = useRef<string>(searchParams.toString());
  const mountedRef = useRef(true);

  // Track mount state
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
        tab: activeTab,
        limit: String(PAGE_SIZE),
      });
      if (date) {
        params.set('date', date);
      }
      if (append && cursorRef.current) {
        params.set('cursor', cursorRef.current);
      }

      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error('Failed to fetch feed');

      const data = await res.json();

      if (!mountedRef.current) return;

      setArticles(prev => append ? [...prev, ...data.articles] : data.articles);
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
  }, [activeTab, date]);

  // When tab or date changes in URL, refetch
  useEffect(() => {
    const currentParams = searchParams.toString();
    if (currentParams !== prevSearchParamsRef.current) {
      prevSearchParamsRef.current = currentParams;
      cursorRef.current = null;
      setArticles([]);
      setHasMore(true);
      setError(null);
      fetchFeed(false);
    }
  }, [searchParams, fetchFeed]);

  // When tab changes via setTab, update URL
  const setTab = useCallback((tab: TabId) => {
    if (tab === activeTab) return;

    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'latest') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const query = params.toString();
    const newUrl = query ? `${pathname}?${query}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [activeTab, searchParams, router, pathname]);

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
    setArticles([]);
    setHasMore(true);
    await fetchFeed(false);
  }, [fetchFeed]);

  return {
    articles,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    activeTab,
    setTab,
    loadMore,
    refresh,
  };
}