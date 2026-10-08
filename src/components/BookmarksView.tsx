'use client';

import Link from 'next/link';
import { formatDateFr, pluralize } from '@/lib/format';
import type { ArticleSummary } from '@/modules/articles/types';
import { useBookmarks } from '@/modules/bookmarks/useBookmarks';
import { getTopicLabel } from '@/modules/topics/topics';

export function BookmarksView({ articles }: { articles: ArticleSummary[] }) {
  const { slugs, ready, toggle } = useBookmarks();

  if (!ready) {
    return (
      <p data-testid="bookmarks-loading" className="text-muted">
        Chargement de vos favoris…
      </p>
    );
  }

  // On ignore les slugs inconnus (article retiré, valeur éditée à la main).
  const bySlug = new Map(articles.map((article) => [article.slug, article]));
  const bookmarked = slugs.flatMap((slug) => {
    const article = bySlug.get(slug);
    return article ? [article] : [];
  });

  if (bookmarked.length === 0) {
    return (
      <div data-testid="bookmarks-empty" className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center">
        <p className="font-medium">Vous n’avez aucun favori pour l’instant.</p>
        <p className="mt-2 text-sm text-muted">
          Ouvrez un article et utilisez « Ajouter aux favoris », ou{' '}
          <Link href="/" className="text-accent underline underline-offset-4">
            parcourez les dernières actualités
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <p data-testid="bookmarks-count" className="mb-4 text-sm text-muted">
        {pluralize(bookmarked.length, 'favori')}
      </p>
      <ul className="space-y-3">
        {bookmarked.map((article) => (
          <li
            key={article.slug}
            data-testid="bookmark-item"
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
          >
            <div>
              <p className="text-xs font-semibold text-accent">{getTopicLabel(article.category)}</p>
              <h2 className="text-base font-semibold">
                <Link href={`/articles/${article.slug}`} className="hover:text-accent hover:underline">
                  {article.title}
                </Link>
              </h2>
              <p className="text-xs text-muted">{formatDateFr(article.publishedAt)}</p>
            </div>
            <button
              type="button"
              data-testid="bookmark-remove"
              onClick={() => toggle(article.slug)}
              className="rounded border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-2"
            >
              Retirer<span className="sr-only"> {article.title} des favoris</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
