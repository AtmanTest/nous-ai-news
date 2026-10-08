'use client';

import { useBookmarks } from '@/modules/bookmarks/useBookmarks';

export function BookmarkButton({ slug }: { slug: string }) {
  const { slugs, ready, toggle } = useBookmarks();
  const bookmarked = slugs.includes(slug);

  return (
    <button
      type="button"
      data-testid="bookmark-button"
      data-hydrated={ready ? 'true' : 'false'}
      aria-pressed={bookmarked}
      disabled={!ready}
      onClick={() => toggle(slug)}
      className="rounded border border-accent px-4 py-2 text-sm font-medium text-accent hover:bg-blue-50 disabled:opacity-60 aria-pressed:bg-accent aria-pressed:text-white"
    >
      {bookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    </button>
  );
}
