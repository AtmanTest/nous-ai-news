export const BOOKMARKS_KEY = 'nous:bookmarks:v1';
export const BOOKMARKS_EVENT = 'nous:bookmarks-changed';
export const MAX_BOOKMARKS = 200;
const MAX_SLUG_LENGTH = 200;

/** Sous-ensemble de l'API Storage : permet de tester sans navigateur. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * Lecture défensive : le contenu du localStorage n'est pas fiable (édité à la main,
 * ancienne version, corrompu). Toute valeur inattendue donne une liste vide ou filtrée,
 * jamais une exception.
 */
export function readBookmarks(storage: KeyValueStorage): string[] {
  try {
    const raw = storage.getItem(BOOKMARKS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    const slugs: string[] = [];
    for (const value of parsed) {
      if (typeof value === 'string' && value.length > 0 && value.length <= MAX_SLUG_LENGTH && !seen.has(value)) {
        seen.add(value);
        slugs.push(value);
      }
    }
    return slugs.slice(0, MAX_BOOKMARKS);
  } catch {
    return [];
  }
}

export function writeBookmarks(storage: KeyValueStorage, slugs: string[]): void {
  try {
    storage.setItem(BOOKMARKS_KEY, JSON.stringify(slugs.slice(0, MAX_BOOKMARKS)));
  } catch {
    // Quota dépassé ou stockage indisponible : on dégrade silencieusement.
  }
}

export function isBookmarked(storage: KeyValueStorage, slug: string): boolean {
  return readBookmarks(storage).includes(slug);
}

/**
 * Transition d'état d'un favori :
 *   non favori --toggle--> favori (inséré en tête, le plus récent d'abord)
 *   favori     --toggle--> non favori
 * Au-delà de MAX_BOOKMARKS, le plus ancien favori est évincé.
 */
export function toggleBookmark(storage: KeyValueStorage, slug: string): { bookmarked: boolean; slugs: string[] } {
  const current = readBookmarks(storage);
  const bookmarked = !current.includes(slug);
  const next = bookmarked ? [slug, ...current].slice(0, MAX_BOOKMARKS) : current.filter((s) => s !== slug);
  writeBookmarks(storage, next);
  return { bookmarked, slugs: next };
}
