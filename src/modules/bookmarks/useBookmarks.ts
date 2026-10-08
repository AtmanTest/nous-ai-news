'use client';

import { useCallback, useEffect, useState } from 'react';
import { BOOKMARKS_EVENT, readBookmarks, toggleBookmark, type KeyValueStorage } from './storage';

const noopStorage: KeyValueStorage = { getItem: () => null, setItem: () => undefined };

function browserStorage(): KeyValueStorage {
  try {
    return window.localStorage;
  } catch {
    // Accès interdit (mode privé strict, cookies bloqués…) : dégradation sans erreur.
    return noopStorage;
  }
}

export function useBookmarks() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSlugs(readBookmarks(browserStorage()));
    sync();
    setReady(true);
    window.addEventListener('storage', sync);
    window.addEventListener(BOOKMARKS_EVENT, sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener(BOOKMARKS_EVENT, sync);
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    const result = toggleBookmark(browserStorage(), slug);
    setSlugs(result.slugs);
    window.dispatchEvent(new Event(BOOKMARKS_EVENT));
    return result.bookmarked;
  }, []);

  return { slugs, ready, toggle };
}
