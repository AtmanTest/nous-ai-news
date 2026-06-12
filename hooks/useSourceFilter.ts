'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hidden-sources';

export function useSourceFilter() {
  const [hiddenSources, setHiddenSources] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setHiddenSources(new Set(JSON.parse(raw)));
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const hideSource = useCallback((source: string) => {
    setHiddenSources(prev => {
      const next = new Set(prev);
      next.add(source);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }, []);

  const showSource = useCallback((source: string) => {
    setHiddenSources(prev => {
      const next = new Set(prev);
      next.delete(source);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
  }, []);

  const showAllSources = useCallback(() => {
    setHiddenSources(new Set());
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const toggleSource = useCallback((source: string) => {
    if (hiddenSources.has(source)) showSource(source);
    else hideSource(source);
  }, [hiddenSources, hideSource, showSource]);

  const isHidden = useCallback((source: string) => hiddenSources.has(source), [hiddenSources]);

  const filterArticles = useCallback(<T extends { source_name?: string }>(articles: T[]): T[] => {
    if (hiddenSources.size === 0) return articles;
    return articles.filter(a => !hiddenSources.has(a.source_name || ''));
  }, [hiddenSources]);

  return { hiddenSources, ready, hideSource, showSource, showAllSources, toggleSource, isHidden, filterArticles };
}
