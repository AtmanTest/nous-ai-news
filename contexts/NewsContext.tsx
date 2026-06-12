'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

interface Article {
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

interface NewsContextType {
  articles: Article[];
  isLoading: boolean;
  hasMore: boolean;
  error: string | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NewsContext = createContext<NewsContextType | null>(null);

const PAGE_SIZE = 20;

export function NewsProvider({ children, initialArticles = [] }: { children: ReactNode; initialArticles?: Article[] }) {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('for-you');
  const cursorRef = useRef<string | null>(null);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        tab: activeTab,
        limit: String(PAGE_SIZE),
      });
      if (cursorRef.current) params.set('cursor', cursorRef.current);

      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();
      setArticles(prev => [...prev, ...data.articles]);
      cursorRef.current = data.next_cursor || null;
      setHasMore(data.has_more);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, activeTab]);

  const refresh = useCallback(async () => {
    cursorRef.current = null;
    setArticles([]);
    setHasMore(true);
    await loadMore();
  }, [loadMore]);

  return (
    <NewsContext.Provider value={{ articles, isLoading, hasMore, error, activeTab, setActiveTab, loadMore, refresh }}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNews() {
  const ctx = useContext(NewsContext);
  if (!ctx) throw new Error('useNews must be used within NewsProvider');
  return ctx;
}
