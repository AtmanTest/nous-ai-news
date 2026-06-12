'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'news-bookmarks';

/**
 * useBookmarks — persist bookmark state.
 * Guest: localStorage. Logged-in: Supabase bookmarks table.
 * Merges localStorage → Supabase on login.
 */
export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);
  const supabase = createClient();

  // Load bookmarks from source (localStorage or Supabase)
  useEffect(() => {
    if (user) {
      // Logged in: fetch from Supabase
      loadFromSupabase();
    } else {
      // Guest: load from localStorage
      loadFromStorage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setBookmarkedIds(new Set(parsed));
        }
      }
    } catch {}
    setReady(true);
  }, []);

  const loadFromSupabase = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('article_id')
        .eq('user_id', user.id);

      if (data) {
        const ids = new Set(data.map((b) => b.article_id));

        // Merge from localStorage on first load (carry over guest bookmarks)
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const local = JSON.parse(raw);
            if (Array.isArray(local)) {
              local.forEach((id: string) => ids.add(id));
              // Migrate to Supabase
              for (const id of local) {
                await supabase.from('bookmarks').upsert(
                  { user_id: user.id, article_id: id },
                  { onConflict: 'user_id,article_id' }
                );
              }
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        } catch {}

        setBookmarkedIds(ids);
      }
    } catch {}
    setReady(true);
  }, [user, supabase]);

  const persistStorage = useCallback((ids: Set<string>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
    } catch {}
  }, []);

  const persistSupabase = useCallback(
    async (ids: Set<string>, action: 'add' | 'remove', articleId: string) => {
      if (!user) return;
      try {
        if (action === 'add') {
          await supabase.from('bookmarks').upsert(
            { user_id: user.id, article_id: articleId },
            { onConflict: 'user_id,article_id' }
          );
        } else {
          await supabase
            .from('bookmarks')
            .delete()
            .match({ user_id: user.id, article_id: articleId });
        }
      } catch {}
    },
    [user, supabase]
  );

  const isBookmarked = useCallback(
    (id: string) => bookmarkedIds.has(id),
    [bookmarkedIds]
  );

  const toggleBookmark = useCallback(
    (id: string) => {
      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          persistSupabase(next, 'remove', id);
          if (!user) persistStorage(next);
        } else {
          next.add(id);
          persistSupabase(next, 'add', id);
          if (!user) persistStorage(next);
        }
        return next;
      });
    },
    [user, persistSupabase, persistStorage]
  );

  const getBookmarkedIds = useCallback(() => Array.from(bookmarkedIds), [bookmarkedIds]);

  return {
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
    getBookmarkedIds,
    ready,
  };
}
