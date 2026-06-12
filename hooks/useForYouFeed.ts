'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export interface ForYouArticle {
  id: string;
  title: string;
  summary: string | null;
  url: string;
  source_name: string;
  source_type: string;
  source_tier: number | null;
  category: string | null;
  published_at: string;
  score: number;
  base_score: number | null;
  social_momentum: number | null;
  detected_models: string[] | null;
  image_url: string | null;
  slug: string;
  relevance_score: number;
  reason: string;
}

export interface ForYouResponse {
  articles: ForYouArticle[];
  next_cursor: string | null;
  has_more: boolean;
  personalized: boolean;
}

interface UseForYouFeedOptions {
  limit?: number;
  hoursBack?: number;
}

export function useForYouFeed(options: UseForYouFeedOptions = {}) {
  const { limit = 20, hoursBack = 168 } = options;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [articles, setArticles] = useState<ForYouArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [personalized, setPersonalized] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const loadingRef = useRef(false);

  const buildUrl = useCallback((cursor?: string) => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('hours_back', hoursBack.toString());
    if (cursor) params.set('cursor', cursor);
    return `/api/for-you?${params.toString()}`;
  }, [limit, hoursBack]);

  const fetchFeed = useCallback(async (cursor?: string, isLoadMore = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      const response = await fetch(buildUrl(cursor));
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: ForYouResponse = await response.json();

      if (isLoadMore) {
        setArticles((prev) => [...prev, ...data.articles]);
      } else {
        setArticles(data.articles);
      }
      
      setHasMore(data.has_more);
      setNextCursor(data.next_cursor);
      setPersonalized(data.personalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feed');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      loadingRef.current = false;
    }
  }, [buildUrl]);

  const refresh = useCallback(() => {
    setNextCursor(null);
    fetchFeed();
  }, [fetchFeed]);

  const loadMore = useCallback(() => {
    if (nextCursor && hasMore && !isLoadingMore) {
      fetchFeed(nextCursor, true);
    }
  }, [nextCursor, hasMore, isLoadingMore, fetchFeed]);

  // Initial load
  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return {
    articles,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    personalized,
    refresh,
    loadMore,
  };
}

export function useForYouInfiniteScroll(
  loadMore: () => void,
  hasMore: boolean,
  isLoadingMore: boolean
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    if (triggerRef.current) {
      observerRef.current.observe(triggerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMore, hasMore, isLoadingMore]);

  return triggerRef;
}